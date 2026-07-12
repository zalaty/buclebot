import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CommandPalette from '../../src/components/CommandPalette';
import CommandStrip from '../../src/components/CommandStrip';
import DroneSprite from '../../src/components/DroneSprite';
import Grid from '../../src/components/Grid';
import LoopDraftPanel from '../../src/components/LoopDraftPanel';
import { runSequence } from '../../src/engine/executor';
import { LEVELS } from '../../src/engine/levels';
import { getScore } from '../../src/engine/scoring';
import { Command, DroneState, Level } from '../../src/engine/types';
import { countCommands, unroll } from '../../src/engine/unroll';
import { colors } from '../../src/theme';
import { groupLevelsByWorld, levelWorld } from '../../src/utils/levelGroups';

const sleep = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

// DEBUG: programa pre-cargado para visualizar el pintado de bucles en CommandStrip.
// Eliminar junto con el nivel 'debug-loop' antes del MVP.
const DEBUG_LOOP_PROGRAM: Command[] = [
  {
    type: 'loop',
    times: 3,
    body: [
      { type: 'move' },
      { type: 'loop', times: 2, body: [{ type: 'turn', dir: 'R' }] },
    ],
  },
  { type: 'move' },
];

type GamePhase = 'idle' | 'running' | 'crashed' | 'won';

interface ResultState {
  used: number;
  score: 'optimal' | 'completed';
}

interface LoopDraft {
  times: number;
  body: Command[];
  /** null = new loop being created; number = index in program where this loop was reopened from */
  editingIndex: number | null;
  /** original state saved so cancelLoop can restore it when editing */
  original: { times: number; body: Command[] } | null;
}

export default function GameScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();

  // Resolve level
  const level: Level | undefined = LEVELS.find((l) => l.id === id);

  const [program, setProgram] = useState<Command[]>([]);
  const [loopDraft, setLoopDraft] = useState<LoopDraft | null>(null);
  const [droneState, setDroneState] = useState<DroneState>(
    level ? { ...level.start } : { x: 0, y: 0, dir: 1 },
  );
  const [phase, setPhase] = useState<GamePhase>('idle');
  const [activeIdx, setActiveIdx] = useState<number>(-1);
  const [result, setResult] = useState<ResultState | null>(null);
  const [toast, setToast] = useState<string>('');
  const [toastWarn, setToastWarn] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const runningRef = useRef(false);

  // Available width for the grid panel
  const isWide = width >= 640;
  const gridPanelWidth = isWide ? Math.min(360, width * 0.45) : width - 32;
  const cellSize = level
    ? Math.max(36, Math.min(74, Math.floor(gridPanelWidth / level.cols)))
    : 50;

  const resetLevel = useCallback(() => {
    if (!level) return;
    setProgram(level.id === 'debug-loop' ? DEBUG_LOOP_PROGRAM : []);
    setLoopDraft(null);
    setDroneState({ ...level.start });
    setPhase('idle');
    setActiveIdx(-1);
    setToast('');
    setToastWarn(false);
    setShowModal(false);
    runningRef.current = false;
  }, [level]);

  useEffect(() => {
    resetLevel();
  }, [id, resetLevel]);

  // Total authoring cost including any open draft
  const totalCommandCount =
    countCommands(program) + (loopDraft ? 1 + countCommands(loopDraft.body) : 0);

  const isOverBudget = (extra: number) =>
    level?.budget !== undefined && totalCommandCount + extra > level.budget;

  // Add a move/turn command — routes into draft body when a draft is open
  const addCommand = useCallback(
    (cmd: Command) => {
      if (phase === 'running') return;
      setToast('');
      setToastWarn(false);

      if (loopDraft !== null) {
        if (isOverBudget(1)) {
          setToast('Límite de comandos alcanzado.');
          setToastWarn(true);
          return;
        }
        setLoopDraft((prev) => (prev ? { ...prev, body: [...prev.body, cmd] } : prev));
      } else {
        if (isOverBudget(1)) {
          setToast('Límite de comandos alcanzado.');
          setToastWarn(true);
          return;
        }
        setProgram((prev) => [...prev, cmd]);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [phase, loopDraft, totalCommandCount, level],
  );

  // Open a new loop draft
  const openLoop = useCallback(() => {
    if (phase === 'running' || loopDraft !== null) return;
    // Need room for at least the loop node (1) + one body command (1) = 2
    if (level?.budget !== undefined && totalCommandCount + 2 > level.budget) {
      setToast('No hay sitio para un bucle (presupuesto agotado).');
      setToastWarn(true);
      return;
    }
    setToast('');
    setToastWarn(false);
    setLoopDraft({ times: 2, body: [], editingIndex: null, original: null });
  }, [phase, loopDraft, totalCommandCount, level]);

  // Seal the draft, re-inserting at the original position when editing
  const closeLoop = useCallback(() => {
    if (!loopDraft || loopDraft.body.length === 0) return;
    const newLoop: Command = { type: 'loop', times: loopDraft.times, body: loopDraft.body };
    setProgram((prev) => {
      if (loopDraft.editingIndex !== null) {
        const idx = Math.min(loopDraft.editingIndex, prev.length);
        return [...prev.slice(0, idx), newLoop, ...prev.slice(idx)];
      }
      return [...prev, newLoop];
    });
    setLoopDraft(null);
    setToast('');
    setToastWarn(false);
  }, [loopDraft]);

  // Cancel: restore original loop when editing, otherwise just discard
  const cancelLoop = useCallback(() => {
    if (loopDraft && loopDraft.editingIndex !== null && loopDraft.original) {
      const { editingIndex, original } = loopDraft;
      const restored: Command = { type: 'loop', times: original.times, body: original.body };
      setProgram((prev) => {
        const idx = Math.min(editingIndex, prev.length);
        return [...prev.slice(0, idx), restored, ...prev.slice(idx)];
      });
    }
    setLoopDraft(null);
    setToast('');
    setToastWarn(false);
  }, [loopDraft]);

  // Delete the loop entirely — it's already out of program since openLoopEdit removed it
  const deleteLoop = useCallback(() => {
    setLoopDraft(null);
    setToast('');
    setToastWarn(false);
  }, []);

  // Reopen a sealed loop from the strip for editing
  const openLoopEdit = useCallback(
    (index: number) => {
      if (phase === 'running' || loopDraft !== null) return;
      const cmd = program[index];
      if (!cmd || cmd.type !== 'loop') return;
      setProgram((prev) => prev.filter((_, i) => i !== index));
      setLoopDraft({
        times: cmd.times,
        body: [...cmd.body],
        editingIndex: index,
        original: { times: cmd.times, body: [...cmd.body] },
      });
      setToast('');
      setToastWarn(false);
    },
    [phase, loopDraft, program],
  );

  // Remove a single command from the draft body
  const removeBodyItem = useCallback((index: number) => {
    setLoopDraft((prev) =>
      prev ? { ...prev, body: prev.body.filter((_, i) => i !== index) } : prev,
    );
  }, []);

  const changeLoopTimes = useCallback((n: number) => {
    setLoopDraft((prev) => (prev ? { ...prev, times: n } : prev));
  }, []);

  const undoLast = useCallback(() => {
    if (phase === 'running') return;
    if (loopDraft !== null) {
      if (loopDraft.body.length > 0) {
        setLoopDraft((prev) => (prev ? { ...prev, body: prev.body.slice(0, -1) } : prev));
      } else {
        cancelLoop(); // restores original if editing, discards if new
      }
    } else {
      setProgram((prev) => prev.slice(0, -1));
    }
  }, [phase, loopDraft, cancelLoop]);

  const executeProgram = useCallback(async () => {
    if (!level || phase === 'running' || program.length === 0) return;

    runningRef.current = true;
    setPhase('running');
    setToast('Ejecutando ruta…');
    setToastWarn(false);

    // Reset drone to start
    setDroneState({ ...level.start });
    setActiveIdx(-1);
    await sleep(120);

    const gen = runSequence(level, unroll(program));
    let cmdIndex = 0;

    for await (const event of gen) {
      setActiveIdx(cmdIndex);

      if (event.type === 'turn') {
        setDroneState({ ...event.to });
        await sleep(230);
      } else if (event.type === 'move') {
        setDroneState({ ...event.to });
        await sleep(300);
      } else if (event.type === 'crash') {
        setPhase('crashed');
        setActiveIdx(-1);
        await sleep(360);
        setDroneState({ ...level.start });
        runningRef.current = false;
        setToast('💥 Choque. Vuelves al inicio — revisa tu plan.');
        setToastWarn(true);
        return;
      } else if (event.type === 'goal') {
        await sleep(260);
        const used = countCommands(program);
        const score = getScore(used, level.par);
        setResult({ used, score });
        setPhase('won');
        setShowModal(true);
        runningRef.current = false;
        setActiveIdx(-1);
        return;
      }

      cmdIndex++;
    }

    // Program ended without reaching goal
    setActiveIdx(-1);
    setPhase('idle');
    runningRef.current = false;
    setToast('La ruta termina lejos de la baliza. Ajústala.');
    setToastWarn(true);
  }, [level, phase, program]);

  const goNextLevel = useCallback(() => {
    if (!level) return;
    setShowModal(false);
    const group = groupLevelsByWorld(LEVELS).find((g) => g.world === levelWorld(level));
    const currentIndex = group ? group.levels.findIndex((l) => l.id === level.id) : -1;
    const nextLevel = group && currentIndex >= 0 ? group.levels[currentIndex + 1] : undefined;
    if (nextLevel) {
      router.replace(`/game/${nextLevel.id}`);
    } else {
      router.replace('/');
    }
  }, [level, router]);

  if (!level) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Nivel no encontrado.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isRunning = phase === 'running';
  const canRepeat = !isRunning && loopDraft === null;

  const world = levelWorld(level);
  const worldGroup = groupLevelsByWorld(LEVELS).find((g) => g.world === world);
  const levelIndexInWorld = worldGroup ? worldGroup.levels.findIndex((l) => l.id === level.id) : -1;
  const isDebugLevel = levelIndexInWorld === -1;
  const isLastLevel = isDebugLevel
    ? true
    : worldGroup!.levels[worldGroup!.levels.length - 1].id === level.id;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Sector</Text>
          <Text style={styles.levelTag}>
            {isDebugLevel
              ? 'Nivel de depuración'
              : `Mundo ${world} · Nivel ${levelIndexInWorld + 1} / ${worldGroup!.levels.length}`}
          </Text>
        </View>
        <Text style={styles.intro}>{level.intro}</Text>

        {/* Wide layout: grid + strip side by side */}
        <View style={[styles.gameArea, isWide && styles.gameAreaWide]}>
          {/* Grid area */}
          <View style={styles.gridContainer}>
            <View style={{ position: 'relative', width: cellSize * level.cols, height: cellSize * level.rows }}>
              <Grid
                level={level}
                droneState={droneState}
                availableWidth={gridPanelWidth}
              />
              <DroneSprite
                droneState={droneState}
                cellSize={cellSize}
                crashed={phase === 'crashed'}
              />
            </View>
          </View>

          {/* Strip + controls area */}
          <View style={[styles.controlsArea, isWide && styles.controlsAreaWide]}>
            <CommandStrip
              program={program}
              activeIndex={activeIdx}
              commandCount={totalCommandCount}
              par={level.par}
              onTapLoop={!isRunning && loopDraft === null ? openLoopEdit : undefined}
            />

            {loopDraft && (
              <LoopDraftPanel
                times={loopDraft.times}
                body={loopDraft.body}
                isEditing={loopDraft.editingIndex !== null}
                onChangeTimes={changeLoopTimes}
                onRemoveBodyItem={removeBodyItem}
                onClose={closeLoop}
                onCancel={cancelLoop}
                onDelete={deleteLoop}
              />
            )}

            <CommandPalette
              onCommand={addCommand}
              onRepeat={openLoop}
              canRepeat={canRepeat}
              disabled={isRunning}
            />

            <View style={styles.actionRow}>
              <Pressable
                style={[
                  styles.runBtn,
                  (isRunning || loopDraft !== null) && styles.runBtnDisabled,
                ]}
                onPress={executeProgram}
                disabled={isRunning || loopDraft !== null}
                accessibilityRole="button"
                accessibilityLabel="Ejecutar programa"
              >
                <Text style={styles.runBtnText}>Ejecutar ▸</Text>
              </Pressable>
              <Pressable
                style={styles.ghostBtn}
                onPress={undoLast}
                disabled={isRunning}
              >
                <Text style={[styles.ghostBtnText, isRunning && styles.dimText]}>
                  Borrar último
                </Text>
              </Pressable>
              <Pressable
                style={styles.ghostBtn}
                onPress={resetLevel}
                disabled={isRunning}
              >
                <Text style={[styles.ghostBtnText, isRunning && styles.dimText]}>
                  Reiniciar
                </Text>
              </Pressable>
            </View>

            {toast ? (
              <Text style={[styles.toast, toastWarn && styles.toastWarn]}>
                {toast}
              </Text>
            ) : null}
          </View>
        </View>
      </ScrollView>

      {/* Result Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.card}>
            {result && (
              <>
                <Text style={styles.medal}>
                  {result.score === 'optimal' ? 'Ruta óptima ✦' : 'Ruta completada'}
                </Text>
                <Text style={styles.cardTitle}>
                  {result.score === 'optimal' ? '¡Limpio!' : '¡Has llegado!'}
                </Text>
                <Text style={styles.cardBody}>
                  Lo resolviste en{' '}
                  <Text style={styles.stat}>{result.used}</Text> comandos · par{' '}
                  <Text style={styles.stat}>{level.par}</Text>.
                  {result.score === 'optimal'
                    ? ' Has igualado o batido el óptimo.'
                    : ' ¿Puedes hacerlo con menos?'}
                </Text>

                {level.outro ? (
                  <View style={styles.hint}>
                    <Text style={styles.hintText}>{level.outro}</Text>
                  </View>
                ) : null}

                <Pressable
                  style={[styles.runBtn, styles.cardBtn]}
                  onPress={goNextLevel}
                >
                  <Text style={styles.runBtnText}>
                    {isLastLevel ? 'Reiniciar mundo' : 'Siguiente nivel'}
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  eyebrow: {
    fontFamily: 'monospace',
    fontSize: 11,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    color: colors.accent,
  },
  levelTag: {
    fontFamily: 'monospace',
    fontSize: 11,
    letterSpacing: 1.2,
    color: colors.muted,
  },
  intro: {
    fontSize: 13,
    color: colors.muted,
    marginBottom: 12,
    lineHeight: 20,
  },
  gameArea: {
    flexDirection: 'column',
    gap: 16,
  },
  gameAreaWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 24,
  },
  gridContainer: {
    alignItems: 'center',
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    padding: 8,
    alignSelf: 'flex-start',
  },
  controlsArea: {
    flex: 1,
  },
  controlsAreaWide: {
    minWidth: 220,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  runBtn: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: 11,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  runBtnDisabled: {
    opacity: 0.45,
  },
  runBtnText: {
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
    fontSize: 13.5,
    fontWeight: '600',
    color: '#06231E',
  },
  ghostBtn: {
    backgroundColor: colors.panel2,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 11,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostBtnText: {
    fontSize: 12,
    color: colors.muted,
  },
  dimText: {
    opacity: 0.45,
  },
  toast: {
    marginTop: 10,
    fontSize: 12.5,
    color: colors.accent,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  toastWarn: {
    color: colors.hazardEdge,
  },
  // Modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(8,10,13,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    padding: 22,
    alignItems: 'center',
  },
  medal: {
    fontFamily: 'monospace',
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.accent,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 4,
    textAlign: 'center',
  },
  cardBody: {
    fontSize: 13.5,
    color: colors.muted,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 16,
  },
  stat: {
    fontFamily: 'monospace',
    color: colors.ink,
  },
  hint: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    borderStyle: 'dashed',
    paddingTop: 12,
    marginBottom: 16,
    width: '100%',
  },
  hintText: {
    fontSize: 12.5,
    color: colors.hazardEdge,
    lineHeight: 21,
    textAlign: 'center',
  },
  cardBtn: {
    width: '100%',
    flex: 0,
  },
  // Error state
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: colors.muted,
    fontSize: 16,
  },
});
