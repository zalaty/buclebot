import React, { useEffect, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Command } from '../engine/types';
import { colors } from '../theme';

interface Props {
  program: Command[];
  activeIndex: number;
  commandCount: number;
  par: number;
}

const LABELS: Record<Command, string> = {
  F: 'avanzar',
  L: '↺ izq',
  R: '↻ der',
};

export default function CommandStrip({ program, activeIndex, commandCount, par }: Props) {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (activeIndex >= 0 && scrollRef.current) {
      // Scroll to active chip (approx 80px per chip)
      scrollRef.current.scrollTo({ x: Math.max(0, activeIndex * 80 - 40), animated: true });
    }
  }, [activeIndex]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Programa</Text>
        <Text style={styles.count}>
          <Text style={styles.countNum}>{commandCount}</Text>
          <Text style={styles.countMuted}> comandos · par </Text>
          <Text style={styles.countNum}>{par}</Text>
        </Text>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        style={styles.strip}
        contentContainerStyle={styles.stripContent}
        showsHorizontalScrollIndicator={false}
      >
        {program.length === 0 ? (
          <Text style={styles.placeholder}>
            Toca los comandos para trazar la ruta…
          </Text>
        ) : (
          program.map((cmd, i) => (
            <View
              key={i}
              style={[styles.chip, i === activeIndex && styles.chipActive]}
            >
              <Text
                style={[styles.chipText, i === activeIndex && styles.chipTextActive]}
              >
                {LABELS[cmd]}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    marginHorizontal: 2,
  },
  label: {
    fontFamily: 'monospace',
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  count: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
  countNum: {
    color: colors.ink,
    fontFamily: 'monospace',
  },
  countMuted: {
    color: colors.muted,
    fontFamily: 'monospace',
  },
  strip: {
    minHeight: 46,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
  },
  stripContent: {
    padding: 9,
    gap: 5,
    flexDirection: 'row',
    flexWrap: 'nowrap',
    minWidth: '100%',
  },
  placeholder: {
    color: colors.muted,
    fontSize: 12.5,
    fontStyle: 'italic',
    alignSelf: 'center',
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 7,
    backgroundColor: colors.panel2,
    borderWidth: 1,
    borderColor: colors.line,
    marginRight: 5,
  },
  chipActive: {
    backgroundColor: 'rgba(56,225,198,0.16)',
    borderColor: colors.accent,
  },
  chipText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: colors.ink,
  },
  chipTextActive: {
    color: colors.accent,
  },
});
