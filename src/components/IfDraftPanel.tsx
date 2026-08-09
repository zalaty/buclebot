import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CellObjectType, Command } from '../engine/types';
import { colors } from '../theme';

type Branch = 'then' | 'else';

interface Props {
  object: CellObjectType;
  then: Command[];
  /** null = no SI NO zone added yet */
  elseBranch: Command[] | null;
  /** Which branch new palette taps currently land in */
  active: Branch;
  onChangeObject: (object: CellObjectType) => void;
  onAddElse: () => void;
  onSetActiveBranch: (branch: Branch) => void;
  onRemoveBodyItem: (branch: Branch, index: number) => void;
  onClose: () => void;
  onCancel: () => void;
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

export default function IfDraftPanel({
  object,
  then,
  elseBranch,
  active,
  onChangeObject,
  onAddElse,
  onSetActiveBranch,
  onRemoveBodyItem,
  onClose,
  onCancel,
}: Props) {
  const canClose = then.length > 0;

  const renderZone = (branch: Branch, title: string, items: Command[], emptyHint: string) => {
    const isActive = active === branch;
    return (
      <View style={[styles.zone, isActive && styles.zoneActive]}>
        <Pressable
          onPress={() => onSetActiveBranch(branch)}
          style={styles.zoneHeader}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={`Meter comandos en ${title}`}
        >
          <Text style={[styles.zoneLabel, isActive && styles.zoneLabelActive]}>{title}</Text>
          {isActive && <Text style={styles.zoneActiveDot}>●</Text>}
        </Pressable>

        {items.length === 0 ? (
          <Text style={styles.zoneEmpty}>{emptyHint}</Text>
        ) : (
          <View style={styles.zoneBody}>
            {items.map((cmd, i) => (
              <Pressable
                key={i}
                style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
                onPress={() => onRemoveBodyItem(branch, i)}
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
    );
  };

  return (
    <View style={styles.panel}>
      <View style={styles.titleRow}>
        <Text style={styles.panelTitle}>❓ SI...</Text>
        <Pressable onPress={onCancel} hitSlop={10}>
          <Text style={styles.cancelX}>✕</Text>
        </Pressable>
      </View>

      {/* Condition selector */}
      <View style={styles.condRow}>
        <Pressable
          style={[styles.condOption, object === 'coin' && styles.condOptionActive]}
          onPress={() => onChangeObject('coin')}
          accessibilityRole="button"
          accessibilityLabel="Condición: hay moneda"
        >
          <Text style={[styles.condOptionText, object === 'coin' && styles.condOptionTextActive]}>
            🪙 SI moneda
          </Text>
        </Pressable>
        <Pressable
          style={[styles.condOption, object === 'bomb' && styles.condOptionActive]}
          onPress={() => onChangeObject('bomb')}
          accessibilityRole="button"
          accessibilityLabel="Condición: hay bomba"
        >
          <Text style={[styles.condOptionText, object === 'bomb' && styles.condOptionTextActive]}>
            💣 SI bomba
          </Text>
        </Pressable>
      </View>

      {/* ENTONCES — always visible */}
      {renderZone('then', 'ENTONCES', then, 'Toca Avanzar / Girar / Recoger para meterlo aquí…')}

      {/* SI NO — optional */}
      {elseBranch === null ? (
        <Pressable style={styles.addElseBtn} onPress={onAddElse}>
          <Text style={styles.addElseBtnText}>+ añadir SI NO</Text>
        </Pressable>
      ) : (
        renderZone('else', 'SI NO', elseBranch, 'Toca Avanzar / Girar / Recoger para meterlo aquí…')
      )}

      {!canClose && (
        <Text style={styles.hint}>Añade al menos un comando a ENTONCES para cerrar.</Text>
      )}

      <View style={styles.actionRow}>
        <Pressable
          style={[styles.closeBtn, !canClose && styles.closeBtnDisabled]}
          onPress={onClose}
          disabled={!canClose}
        >
          <Text style={styles.closeBtnText}>Cerrar condicional ✓</Text>
        </Pressable>
        <Pressable style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelBtnText}>Cancelar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderWidth: 1,
    borderLeftWidth: 3,
    borderLeftColor: colors.condAccent,
    borderColor: 'rgba(185,142,255,0.35)',
    borderRadius: 12,
    backgroundColor: colors.condDim,
    marginBottom: 4,
    padding: 12,
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
    color: colors.condAccent,
    fontWeight: '700',
  },
  cancelX: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 18,
  },
  condRow: {
    flexDirection: 'row',
    gap: 8,
  },
  condOption: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel2,
    alignItems: 'center',
  },
  condOptionActive: {
    borderColor: colors.condAccent,
    backgroundColor: 'rgba(185,142,255,0.16)',
  },
  condOptionText: {
    fontSize: 12.5,
    color: colors.ink,
  },
  condOptionTextActive: {
    color: colors.condAccent,
    fontWeight: '600',
  },
  zone: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 9,
    padding: 8,
    gap: 6,
  },
  zoneActive: {
    borderColor: colors.condAccent,
    backgroundColor: 'rgba(185,142,255,0.08)',
  },
  zoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  zoneLabel: {
    fontFamily: 'monospace',
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.muted,
  },
  zoneLabelActive: {
    color: colors.condAccent,
  },
  zoneActiveDot: {
    color: colors.condAccent,
    fontSize: 10,
  },
  zoneEmpty: {
    color: colors.muted,
    fontSize: 11.5,
    fontStyle: 'italic',
  },
  zoneBody: {
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
    borderColor: 'rgba(185,142,255,0.25)',
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
  addElseBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(185,142,255,0.30)',
    borderStyle: 'dashed',
  },
  addElseBtnText: {
    fontSize: 12,
    color: colors.condAccent,
  },
  hint: {
    fontSize: 11.5,
    color: 'rgba(185,142,255,0.65)',
    fontStyle: 'italic',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  closeBtn: {
    flex: 1,
    backgroundColor: colors.condAccent,
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
    color: '#1A0F2E',
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
});
