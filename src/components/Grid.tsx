import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { DroneState, Level } from '../engine/types';
import { colors } from '../theme';

interface Props {
  level: Level;
  droneState: DroneState;
  /** Available width in pixels; cell size is derived from this. */
  availableWidth: number;
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

export default function Grid({ level, droneState: _droneState, availableWidth }: Props) {
  const cellSize = Math.max(36, Math.min(74, Math.floor(availableWidth / level.cols)));

  const walls = useMemo(() => buildWallSet(level), [level]);

  const cells: React.ReactElement[] = [];
  for (let y = 0; y < level.rows; y++) {
    for (let x = 0; x < level.cols; x++) {
      const isWall = walls.has(`${x},${y}`);
      const isGoal = x === level.goal.x && y === level.goal.y;
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
    </View>
  );
}

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
});
