import React, { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Command } from '../engine/types';
import { colors } from '../theme';

interface Props {
  onCommand: (cmd: Command) => void;
  disabled: boolean;
}

const BUTTONS: { cmd: Command; label: string; key: string; icon: string }[] = [
  { cmd: 'F', label: 'Avanzar', key: 'W / ↑', icon: '▲' },
  { cmd: 'L', label: 'Girar izq.', key: 'A / ←', icon: '↺' },
  { cmd: 'R', label: 'Girar der.', key: 'D / →', icon: '↻' },
];

export default function CommandPalette({ onCommand, disabled }: Props) {
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handler = (e: KeyboardEvent) => {
      if (disabled) return;
      if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') onCommand('F');
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') onCommand('L');
      if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') onCommand('R');
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [disabled, onCommand]);

  return (
    <View style={styles.palette}>
      {BUTTONS.map(({ cmd, label, key, icon }) => (
        <Pressable
          key={cmd}
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
});
