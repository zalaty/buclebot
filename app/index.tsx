import { useRouter } from 'expo-router';
import React from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LEVELS } from '../src/engine/levels';
import { colors } from '../src/theme';

export default function LevelSelectScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Mundo 1</Text>
          <Text style={styles.title}>Secuencias</Text>
          <Text style={styles.subtitle}>
            Planifica la ruta completa antes de ejecutar.
          </Text>
        </View>

        <View style={styles.list}>
          {LEVELS.map((level, index) => (
            <Pressable
              key={level.id}
              style={({ pressed }) => [
                styles.levelCard,
                pressed && styles.levelCardPressed,
              ]}
              onPress={() => router.push(`/game/${level.id}`)}
              accessibilityRole="button"
              accessibilityLabel={`Nivel ${index + 1}`}
            >
              <View style={styles.levelLeft}>
                <Text style={styles.levelNum}>Nivel {index + 1}</Text>
                <Text style={styles.levelIntro} numberOfLines={2}>
                  {level.intro}
                </Text>
              </View>
              <View style={styles.levelRight}>
                <Text style={styles.parLabel}>par</Text>
                <Text style={styles.parValue}>{level.par}</Text>
                <Text style={styles.playBtn}>▸</Text>
              </View>
            </Pressable>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.conceptTag}>ESTO ES UNA SECUENCIA</Text>
          <Text style={styles.footerNote}>
            Próximamente: Mundo 2 — BUCLES
          </Text>
        </View>
      </ScrollView>
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
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    marginBottom: 24,
    paddingTop: 8,
  },
  eyebrow: {
    fontFamily: 'monospace',
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.accent,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20,
  },
  list: {
    gap: 10,
  },
  levelCard: {
    flexDirection: 'row',
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 12,
  },
  levelCardPressed: {
    borderColor: colors.accent,
  },
  levelLeft: {
    flex: 1,
    gap: 4,
  },
  levelNum: {
    fontFamily: 'monospace',
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  levelIntro: {
    fontSize: 13.5,
    color: colors.ink,
    lineHeight: 19,
  },
  levelRight: {
    alignItems: 'center',
    gap: 2,
    minWidth: 44,
  },
  parLabel: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  parValue: {
    fontFamily: 'monospace',
    fontSize: 20,
    fontWeight: '700',
    color: colors.ink,
  },
  playBtn: {
    fontSize: 20,
    color: colors.accent,
    marginTop: 2,
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
    gap: 6,
  },
  conceptTag: {
    fontFamily: 'monospace',
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.accent,
  },
  footerNote: {
    fontSize: 12.5,
    color: colors.muted,
  },
});
