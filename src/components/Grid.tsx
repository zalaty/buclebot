import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { DroneState, Level } from '../engine/types';
import { colors } from '../theme';

interface Props {
  level: Level;
  droneState: DroneState;
  /** Available width in pixels; cell size is derived from this. */
  availableWidth: number;
  /** Position keys ("x,y") of coins already picked up this run (World 3). */
  collectedCoins?: Set<string>;
  /** Position keys ("x,y") of doors already opened this run (World 3). */
  openedDoors?: Set<string>;
}

interface MarkerProps {
  cellSize: number;
  x: number;
  y: number;
}

/** A coin marker: shrinks and fades out once `collected` flips true. */
function CoinMarker({ cellSize, x, y, collected }: MarkerProps & { collected: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const wasCollected = useRef(false);

  useEffect(() => {
    if (collected && !wasCollected.current) {
      Animated.parallel([
        Animated.timing(scale, { toValue: 0.15, duration: 280, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 280, useNativeDriver: true }),
      ]).start();
    } else if (!collected && wasCollected.current) {
      scale.setValue(1);
      opacity.setValue(1);
    }
    wasCollected.current = collected;
  }, [collected, scale, opacity]);

  return (
    <Animated.View
      style={[
        styles.objectMark,
        {
          width: cellSize - 18,
          height: cellSize - 18,
          left: x * cellSize + 9,
          top: y * cellSize + 9,
          transform: [{ scale }],
          opacity,
        },
      ]}
      pointerEvents="none"
    >
      <View style={styles.coinBadge}>
        <Text style={styles.objectGlyph}>🪙</Text>
      </View>
    </Animated.View>
  );
}

/** A door marker: shrinks and fades out once `open` flips true, revealing the hueco beneath. */
function DoorMarker({ cellSize, x, y, open }: MarkerProps & { open: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open && !wasOpen.current) {
      Animated.parallel([
        Animated.timing(scale, { toValue: 0.15, duration: 320, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 320, useNativeDriver: true }),
      ]).start();
    } else if (!open && wasOpen.current) {
      scale.setValue(1);
      opacity.setValue(1);
    }
    wasOpen.current = open;
  }, [open, scale, opacity]);

  return (
    <Animated.View
      style={[
        styles.objectMark,
        {
          width: cellSize - 18,
          height: cellSize - 18,
          left: x * cellSize + 9,
          top: y * cellSize + 9,
          transform: [{ scale }],
          opacity,
        },
      ]}
      pointerEvents="none"
    >
      <View style={styles.doorBadge}>
        <Text style={styles.objectGlyph}>🚪</Text>
      </View>
    </Animated.View>
  );
}

function buildWallSet(level: Level): Set<string> {
  const key = (x: number, y: number) => `${x},${y}`;

  if (level.open) {
    const openSet = new Set(level.open.map(([x, y]: [number, number]) => key(x, y)));
    const walls = new Set<string>();
    for (let y = 0; y < level.rows; y++) {
      for (let x = 0; x < level.cols; x++) {
        if (!openSet.has(key(x, y))) walls.add(key(x, y));
      }
    }
    return walls;
  }

  const walls = new Set<string>();
  for (const [x, y] of level.walls ?? []) {
    walls.add(key(x, y));
  }
  return walls;
}

export default function Grid({
  level,
  droneState: _droneState,
  availableWidth,
  collectedCoins,
  openedDoors,
}: Props) {
  const cellSize = Math.max(36, Math.min(74, Math.floor(availableWidth / level.cols)));

  const walls = useMemo(() => buildWallSet(level), [level]);

  // World 3 (collect-all-coins): the baliza isn't the win condition, so
  // showing it would just be a misleading green square.
  const showGoal = level.objective !== 'collect-all-coins';

  const cells: React.ReactElement[] = [];
  for (let y = 0; y < level.rows; y++) {
    for (let x = 0; x < level.cols; x++) {
      const isWall = walls.has(`${x},${y}`);
      const isGoal = showGoal && x === level.goal.x && y === level.goal.y;
      cells.push(
        <View
          key={`${x},${y}`}
          style={[
            styles.cell,
            { width: cellSize, height: cellSize },
            isWall && styles.wall,
            isGoal && styles.goalCell,
          ]}
        />,
      );
    }
  }

  return (
    <View
      style={[
        styles.grid,
        {
          width: cellSize * level.cols,
          height: cellSize * level.rows,
          flexDirection: 'row',
          flexWrap: 'wrap',
        },
      ]}
    >
      {cells}
      {/* Goal marker overlay */}
      {showGoal && (
        <View
          style={[
            styles.goalMark,
            {
              width: cellSize - 14,
              height: cellSize - 14,
              left: level.goal.x * cellSize + 7,
              top: level.goal.y * cellSize + 7,
            },
          ]}
          pointerEvents="none"
        />
      )}
      {/* Coins and doors (World 3) */}
      {(level.coins ?? []).map(([x, y]) => (
        <CoinMarker
          key={`coin-${x}-${y}`}
          cellSize={cellSize}
          x={x}
          y={y}
          collected={(collectedCoins ?? EMPTY_SET).has(`${x},${y}`)}
        />
      ))}
      {(level.doors ?? []).map(([x, y]) => (
        <DoorMarker
          key={`door-${x}-${y}`}
          cellSize={cellSize}
          x={x}
          y={y}
          open={(openedDoors ?? EMPTY_SET).has(`${x},${y}`)}
        />
      ))}
    </View>
  );
}

const EMPTY_SET = new Set<string>();

const styles = StyleSheet.create({
  grid: {
    position: 'relative',
    backgroundColor: colors.panel,
    borderRadius: 14,
    padding: 0,
    overflow: 'hidden',
  },
  cell: {
    borderWidth: 1,
    borderColor: colors.grid,
    borderRadius: 6,
  },
  wall: {
    backgroundColor: colors.hazard,
    borderColor: 'rgba(240,136,62,0.32)',
  },
  goalCell: {
    borderColor: 'rgba(110,231,135,0.5)',
  },
  goalMark: {
    position: 'absolute',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.goal,
  },
  objectMark: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinBadge: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.coinDim,
    borderWidth: 2,
    borderColor: colors.coin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doorBadge: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.doorDim,
    borderWidth: 2,
    borderColor: colors.door,
    alignItems: 'center',
    justifyContent: 'center',
  },
  objectGlyph: {
    fontSize: 16,
  },
});
