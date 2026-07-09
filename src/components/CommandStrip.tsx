import React, { useEffect, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Command, LoopCommand } from '../engine/types';
import { colors } from '../theme';

interface Props {
  program: Command[];
  activeIndex: number;
  commandCount: number;
  par: number;
}

function labelFor(cmd: Exclude<Command, LoopCommand>): string {
  if (cmd.type === 'move') return 'avanzar';
  return cmd.dir === 'L' ? '↺ izq' : '↻ der';
}

// Accent colors per nesting depth (cycles after depth 2)
const LOOP_ACCENT = [colors.accent, colors.hazardEdge, colors.goal] as const;
const LOOP_BG = [
  'rgba(56,225,198,0.07)',
  'rgba(240,136,62,0.07)',
  'rgba(110,231,135,0.07)',
] as const;
const LOOP_BORDER = [
  'rgba(56,225,198,0.30)',
  'rgba(240,136,62,0.30)',
  'rgba(110,231,135,0.30)',
] as const;

function depthIdx(depth: number) {
  return depth % 3;
}

function renderItem(
  cmd: Command,
  key: string,
  topLevelIndex: number,
  activeIndex: number,
  depth: number,
): React.ReactElement {
  if (cmd.type === 'loop') {
    const di = depthIdx(depth);
    const accent = LOOP_ACCENT[di];
    const isActive = depth === 0 && topLevelIndex === activeIndex;
    return (
      <View
        key={key}
        style={[
          styles.loopBlock,
          {
            borderLeftColor: accent,
            borderColor: isActive ? accent : LOOP_BORDER[di],
            backgroundColor: isActive ? `${accent}22` : LOOP_BG[di],
          },
        ]}
      >
        <Text style={[styles.loopLabel, { color: accent }]}>
          ⟳ {cmd.times}×
        </Text>
        <View style={styles.loopBody}>
          {cmd.body.length === 0 ? (
            <Text style={[styles.loopEmpty, { color: accent }]}>vacío</Text>
          ) : (
            cmd.body.map((inner, j) =>
              renderItem(inner, `${key}-${j}`, topLevelIndex, -1, depth + 1),
            )
          )}
        </View>
      </View>
    );
  }

  const isActive = depth === 0 && topLevelIndex === activeIndex;
  return (
    <View key={key} style={[styles.chip, isActive && styles.chipActive]}>
      <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
        {labelFor(cmd)}
      </Text>
    </View>
  );
}

export default function CommandStrip({ program, activeIndex, commandCount, par }: Props) {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (activeIndex >= 0 && scrollRef.current) {
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
          program.map((cmd, i) => renderItem(cmd, String(i), i, activeIndex, 0))
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
    alignItems: 'center',
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
  // Loop container
  loopBlock: {
    borderWidth: 1,
    borderLeftWidth: 3,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignSelf: 'center',
  },
  loopLabel: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 5,
  },
  loopBody: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    gap: 4,
  },
  loopEmpty: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontStyle: 'italic',
    opacity: 0.5,
  },
});
