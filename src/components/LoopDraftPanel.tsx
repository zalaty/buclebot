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
  onChangeTimes: (n: number) => void;
  /** Remove the command at the given index from the body. */
  onRemoveBodyItem: (index: number) => void;
  onClose: () => void;
  /** Cancel: discards edits and restores original (if editing), or discards new loop. */
  onCancel: () => void;
  /** Delete: removes the loop entirely (only meaningful when isEditing). */
  onDelete: () => void;
}

function chipLabel(cmd: Command): string {
  if (cmd.type === 'move') return 'avanzar';
  if (cmd.type === 'turn') return cmd.dir === 'L' ? '↺ izq' : '↻ der';
  return '⟳';
}

export default function LoopDraftPanel({
  times,
  body,
  isEditing,
  onChangeTimes,
  onRemoveBodyItem,
  onClose,
  onCancel,
  onDelete,
}: Props) {
  const canClose = body.length > 0;

  return (
    <View style={styles.panel}>
      {/* Header */}
      <View style={styles.titleRow}>
        <Text style={styles.panelTitle}>
          {isEditing ? '⟳ EDITAR BUCLE' : '⟳ REPETIR'}
        </Text>
        <Pressable onPress={onCancel} hitSlop={10}>
          <Text style={styles.cancelX}>✕</Text>
        </Pressable>
      </View>

      {/* Times stepper */}
      <View style={styles.timesRow}>
        <Pressable
          style={[styles.stepper, times <= 2 && styles.stepperDisabled]}
          onPress={() => onChangeTimes(Math.max(2, times - 1))}
          disabled={times <= 2}
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
          style={[styles.stepper, times >= 9 && styles.stepperDisabled]}
          onPress={() => onChangeTimes(Math.min(9, times + 1))}
          disabled={times >= 9}
          hitSlop={8}
        >
          <Text style={styles.stepperText}>+</Text>
        </Pressable>
      </View>

      {/* Body: chips are tappable to remove */}
      <View style={styles.bodyArea}>
        {body.length === 0 ? (
          <Text style={styles.bodyEmpty}>
            Toca Avanzar o Girar para añadir comandos al bucle…
          </Text>
        ) : (
          <View style={styles.bodyChips}>
            {body.map((cmd, i) => (
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
            ))}
          </View>
        )}
      </View>

      {!canClose && (
        <Text style={styles.hint}>
          Añade al menos un comando para cerrar el bucle.
        </Text>
      )}

      {/* Primary actions */}
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

      {/* Delete action — only when editing an existing loop */}
      {isEditing && (
        <Pressable style={styles.deleteBtn} onPress={onDelete}>
          <Text style={styles.deleteBtnText}>Eliminar bucle</Text>
        </Pressable>
      )}
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
    padding: 12,
    marginBottom: 4,
    gap: 10,
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
