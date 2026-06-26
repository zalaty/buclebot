import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import CommandPalette from '../../src/components/CommandPalette';
import CommandStrip from '../../src/components/CommandStrip';
import DroneSprite from '../../src/components/DroneSprite';
import Grid from '../../src/components/Grid';
import { runSequence } from '../../src/engine/executor';
import { LEVELS } from '../../src/engine/levels';
import { getScore } from '../../src/engine/scoring';
import { Command, DroneState, Level } from '../../src/engine/types';
import { colors } from '../../src/theme';

const sleep = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

type GamePhase = 'idle' | 'running' | 'crashed' | 'won';

interface ResultState {
  used: number;
  score: 'optimal' | 'completed';
}

export default function GameScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();

  // Resolve level
  const level: Level | undefined = LEVELS.find((l) => l.id === id);

  const [program, setProgram] = useState<Command[]>([]);
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
    setProgram([]);
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

  const addCommand = useCallback(
    (cmd: Command) => {
      if (phase === 'running') return;
      setProgram((prev) => [...prev, cmd]);
      setToast('');
    },
    [phase],
  );

  const undoLast = useCallback(() => {
    if (phase === 'running') return;
    setProgram((prev) => prev.slice(0, -1));
  }, [phase]);

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

    const gen = runSequence(level, program);
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
        const used = program.length;
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
    const currentIndex = LEVELS.findIndex((l) => l.id === level.id);
    const nextLevel = LEVELS[currentIndex + 1];
    setShowModal(false);
    if (nextLevel) {
      router.replace(`/game/${nextLevel.id}`);
    } else {
      // All levels done — go back to select
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

  const isLastLevel = LEVELS[LEVELS.length - 1].id === level.id;
  const isRunning = phase === 'running';

  const levelIndex = LEVELS.findIndex((l) => l.id === level.id);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Sector</Text>
          <Text style={styles.levelTag}>
            Nivel {levelIndex + 1} / {LEVELS.length}
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
              commandCount={program.length}
              par={level.par}
            />

            <CommandPalette onCommand={addCommand} disabled={isRunning} />

            <View style={styles.actionRow}>
              <Pressable
                style={[styles.runBtn, isRunning && styles.runBtnDisabled]}
                onPress={executeProgram}
                disabled={isRunning}
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
