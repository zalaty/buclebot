import React, { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Command } from '../engine/types';
import { colors } from '../theme';

interface Props {
  onCommand: (cmd: Command) => void;
  onRepeat: () => void;
  canRepeat: boolean;
  disabled: boolean;
}

const MOVE_BUTTONS: { id: string; cmd: Command; label: string; key: string; icon: string }[] = [
  { id: 'move',   cmd: { type: 'move' },           label: 'Avanzar',    key: 'W / ↑', icon: '▲' },
  { id: 'turn-L', cmd: { type: 'turn', dir: 'L' }, label: 'Girar izq.', key: 'A / ←', icon: '↺' },
  { id: 'turn-R', cmd: { type: 'turn', dir: 'R' }, label: 'Girar der.', key: 'D / →', icon: '↻' },
];

export default function CommandPalette({ onCommand, onRepeat, canRepeat, disabled }: Props) {
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handler = (e: KeyboardEvent) => {
      if (disabled) return;
      if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp')    onCommand({ type: 'move' });
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft')  onCommand({ type: 'turn', dir: 'L' });
      if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') onCommand({ type: 'turn', dir: 'R' });
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [disabled, onCommand]);

  return (
    <View style={styles.palette}>
      {MOVE_BUTTONS.map(({ id, cmd, label, key, icon }) => (
        <Pressable
          key={id}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
            disabled && styles.buttonDisabled,
          ]}
          onPress={() => !disabled && onCommand(cmd)}
          accessibilityLabel={label}
          accessibilityRole="button"
        >
          <Text style={styles.icon}>{icon}</Text>
          <Text style={styles.label}>{label}</Text>
          {Platform.OS === 'web' && <Text style={styles.keyHint}>{key}</Text>}
        </Pressable>
      ))}

      {/* Repeat button — structure command, visually distinct */}
      <Pressable
        style={({ pressed }) => [
          styles.button,
          styles.repeatButton,
          pressed && styles.repeatButtonPressed,
          (!canRepeat || disabled) && styles.buttonDisabled,
        ]}
        onPress={() => !disabled && canRepeat && onRepeat()}
        accessibilityLabel="Repetir"
        accessibilityRole="button"
        disabled={!canRepeat || disabled}
      >
        <Text style={styles.repeatIcon}>⟳</Text>
        <Text style={[styles.label, styles.repeatLabel]}>Repetir</Text>
        {Platform.OS === 'web' && <Text style={styles.keyHint}> </Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  palette: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 12,
  },
  button: {
    flex: 1,
    backgroundColor: colors.panel2,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 11,
    paddingVertical: 13,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 5,
  },
  buttonPressed: {
    borderColor: colors.accent,
    transform: [{ translateY: 1 }],
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  icon: {
    fontSize: 22,
    color: colors.accent,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.ink,
    textAlign: 'center',
  },
  keyHint: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: colors.muted,
  },
  repeatButton: {
    borderColor: 'rgba(56,225,198,0.30)',
    backgroundColor: 'rgba(56,225,198,0.06)',
  },
  repeatButtonPressed: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(56,225,198,0.14)',
    transform: [{ translateY: 1 }],
  },
  repeatIcon: {
    fontSize: 22,
    color: colors.accent,
  },
  repeatLabel: {
    color: colors.accent,
  },
});
