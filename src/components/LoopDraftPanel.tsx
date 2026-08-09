import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Command } from '../engine/types';
import { colors } from '../theme';

interface Props {
  times: number;
  body: Command[];
  /** true = reopened existing loop; false = new loop being created */
  isEditing: boolean;
  /** false when a nested draft is open inside this one — this panel is paused, controls hidden */
  active?: boolean;
  onChangeTimes: (n: number) => void;
  /** Remove the command at the given index from the body. */
  onRemoveBodyItem: (index: number) => void;
  onClose: () => void;
  /** Cancel: discards edits and restores original (if editing), or discards new loop. */
  onCancel: () => void;
  /** Delete: removes the loop entirely (only meaningful when isEditing). */
  onDelete: () => void;
  /** Tap a sealed loop chip in the body to reopen it for editing (like reopening from the strip). */
  onTapBodyLoop?: (index: number) => void;
  /** Nested loop draft, rendered inside this one's body when the student opens a loop within a loop. */
  children?: React.ReactNode;
}

function chipLabel(cmd: Command): string {
  switch (cmd.type) {
    case 'move':
      return 'avanzar';
    case 'turn':
      return cmd.dir === 'L' ? '↺ izq' : '↻ der';
    case 'collect':
      return '🪙 recoge';
    case 'loop':
      return `⟳ ${cmd.times}×`;
    case 'if':
      return 'SI…';
  }
}

export default function LoopDraftPanel({
  times,
  body,
  isEditing,
  active = true,
  onChangeTimes,
  onRemoveBodyItem,
  onClose,
  onCancel,
  onDelete,
  onTapBodyLoop,
  children,
}: Props) {
  const canClose = body.length > 0;

  return (
    <View style={styles.panel}>
      {/*
        Own controls live in a separately-dimmed wrapper so the opacity used
        to mark this cajón as inactive never cascades onto `children` (the
        nested draft below) — RN/CSS opacity applies to the whole subtree,
        so nesting the highlighted child inside a dimmed parent would dim it
        too. Keeping `children` outside this wrapper keeps it at full opacity
        regardless of whether this level is active.
      */}
      <View style={[styles.ownContent, !active && styles.panelInactive]}>
        {/* Header */}
        <View style={styles.titleRow}>
          <Text style={styles.panelTitle}>
            {isEditing ? '⟳ EDITAR BUCLE' : '⟳ REPETIR'}
          </Text>
          {active && (
            <Pressable onPress={onCancel} hitSlop={10}>
              <Text style={styles.cancelX}>✕</Text>
            </Pressable>
          )}
        </View>

        {/* Times stepper */}
        <View style={styles.timesRow}>
          <Pressable
            style={[styles.stepper, (!active || times <= 2) && styles.stepperDisabled]}
            onPress={() => onChangeTimes(Math.max(2, times - 1))}
            disabled={!active || times <= 2}
            hitSlop={8}
          >
            <Text style={styles.stepperText}>−</Text>
          </Pressable>

          <Text style={styles.timesLabel}>
            Repetir{'  '}
            <Text style={styles.timesNum}>{times}</Text>
            {'  '}veces
          </Text>

          <Pressable
            style={[styles.stepper, (!active || times >= 9) && styles.stepperDisabled]}
            onPress={() => onChangeTimes(Math.min(9, times + 1))}
            disabled={!active || times >= 9}
            hitSlop={8}
          >
            <Text style={styles.stepperText}>+</Text>
          </Pressable>
        </View>

        {/* Body: move/turn chips are tappable to remove; loop chips are tappable to edit */}
        <View style={styles.bodyArea}>
          {body.length === 0 ? (
            active && (
              <Text style={styles.bodyEmpty}>
                Toca Avanzar o Girar para añadir comandos al bucle…
              </Text>
            )
          ) : (
            <View style={styles.bodyChips}>
              {body.map((cmd, i) => {
                if (!active) {
                  return (
                    <View key={i} style={styles.chip}>
                      <Text style={styles.chipText}>{chipLabel(cmd)}</Text>
                    </View>
                  );
                }

                if (cmd.type === 'loop') {
                  const canEdit = !!onTapBodyLoop;
                  return (
                    <Pressable
                      key={i}
                      style={({ pressed }) => [
                        styles.chip,
                        pressed && canEdit && styles.chipPressed,
                        !canEdit && styles.chipDisabled,
                      ]}
                      onPress={() => canEdit && onTapBodyLoop!(i)}
                      disabled={!canEdit}
                      accessibilityRole="button"
                      accessibilityLabel={`Bucle de ${cmd.times} veces. Toca para editar.`}
                      hitSlop={4}
                    >
                      <Text style={styles.chipText}>{chipLabel(cmd)}</Text>
                      <Text style={styles.chipEditHint}>✎</Text>
                    </Pressable>
                  );
                }

                return (
                  <Pressable
                    key={i}
                    style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
                    onPress={() => onRemoveBodyItem(i)}
                    accessibilityRole="button"
                    accessibilityLabel={`Quitar ${chipLabel(cmd)}`}
                    hitSlop={4}
                  >
                    <Text style={styles.chipText}>{chipLabel(cmd)}</Text>
                    <Text style={styles.chipX}>✕</Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {active && !canClose && (
          <Text style={styles.hint}>
            Añade al menos un comando para cerrar el bucle.
          </Text>
        )}

        {/* Primary actions — only for the active/innermost draft */}
        {active && (
          <View style={styles.actionRow}>
            <Pressable
              style={[styles.closeBtn, !canClose && styles.closeBtnDisabled]}
              onPress={onClose}
              disabled={!canClose}
            >
              <Text style={styles.closeBtnText}>
                {isEditing ? 'Guardar cambios ✓' : 'Cerrar bucle ✓'}
              </Text>
            </Pressable>
            <Pressable style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </Pressable>
          </View>
        )}

        {/* Delete action — only when editing an existing loop, and only while active */}
        {active && isEditing && (
          <Pressable style={styles.deleteBtn} onPress={onDelete}>
            <Text style={styles.deleteBtnText}>Eliminar bucle</Text>
          </Pressable>
        )}

        {!active && (
          <Text style={styles.pausedHint}>Editando el bucle de dentro…</Text>
        )}
      </View>

      {children ? <View style={styles.nestedSlot}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderWidth: 1,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    borderColor: 'rgba(56,225,198,0.35)',
    borderRadius: 12,
    backgroundColor: 'rgba(56,225,198,0.06)',
    marginBottom: 4,
  },
  // Own controls (header, stepper, body chips, actions) — dimmed as a unit when
  // this cajón isn't the active one, WITHOUT touching `nestedSlot` below, which
  // must always render at full opacity regardless of this level's state.
  ownContent: {
    padding: 12,
    gap: 10,
  },
  panelInactive: {
    opacity: 0.55,
  },
  nestedSlot: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    marginTop: 4,
  },
  pausedHint: {
    fontSize: 11.5,
    color: colors.muted,
    fontStyle: 'italic',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  panelTitle: {
    fontFamily: 'monospace',
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.accent,
    fontWeight: '700',
  },
  cancelX: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 18,
  },
  timesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepper: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: colors.panel2,
    borderWidth: 1,
    borderColor: 'rgba(56,225,198,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperDisabled: {
    opacity: 0.35,
  },
  stepperText: {
    color: colors.accent,
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 22,
  },
  timesLabel: {
    flex: 1,
    fontSize: 15,
    color: colors.ink,
  },
  timesNum: {
    fontFamily: 'monospace',
    fontSize: 20,
    fontWeight: '700',
    color: colors.accent,
  },
  bodyArea: {
    minHeight: 34,
    justifyContent: 'center',
  },
  bodyEmpty: {
    color: colors.muted,
    fontSize: 12,
    fontStyle: 'italic',
  },
  bodyChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 7,
    backgroundColor: colors.panel2,
    borderWidth: 1,
    borderColor: 'rgba(56,225,198,0.25)',
  },
  chipPressed: {
    opacity: 0.55,
    borderColor: colors.danger,
  },
  chipText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: colors.ink,
  },
  chipX: {
    fontSize: 10,
    color: colors.muted,
    lineHeight: 13,
  },
  chipEditHint: {
    fontSize: 10,
    color: colors.accent,
    lineHeight: 13,
  },
  chipDisabled: {
    opacity: 0.45,
  },
  hint: {
    fontSize: 11.5,
    color: 'rgba(56,225,198,0.55)',
    fontStyle: 'italic',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  closeBtn: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: 9,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnDisabled: {
    opacity: 0.35,
  },
  closeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#06231E',
  },
  cancelBtn: {
    backgroundColor: colors.panel2,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 9,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 12,
    color: colors.muted,
  },
  deleteBtn: {
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.30)',
    borderRadius: 9,
    paddingVertical: 8,
    alignItems: 'center',
  },
  deleteBtnText: {
    fontSize: 12,
    color: colors.danger,
  },
});
