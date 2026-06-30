import { Command, Direction, DroneState, Level, StepEvent } from './types';

/** Direction vectors: index = Direction (0=up,1=right,2=down,3=left) */
const DIRS: { x: number; y: number }[] = [
  { x: 0, y: -1 }, // 0 up
  { x: 1, y: 0 },  // 1 right
  { x: 0, y: 1 },  // 2 down
  { x: -1, y: 0 }, // 3 left
];

/** Builds a Set of wall keys "x,y" from either walls list or open whitelist. */
function buildWallSet(level: Level): Set<string> {
  const key = (x: number, y: number) => `${x},${y}`;

  if (level.open) {
    const openSet = new Set(level.open.map(([x, y]) => key(x, y)));
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

/**
 * Pure executor — no React, no side effects.
 * Yields one StepEvent per command.
 * The caller is responsible for driving timing/animation.
 */
export async function* runSequence(
  level: Level,
  program: Command[],
): AsyncGenerator<StepEvent> {
  const walls = buildWallSet(level);
  const key = (x: number, y: number) => `${x},${y}`;

  let drone: DroneState = { ...level.start };

  for (const cmd of program) {
    if (cmd.type === 'turn') {
      const from: DroneState = { ...drone };
      const delta = cmd.dir === 'L' ? 3 : 1;
      drone = { ...drone, dir: ((drone.dir + delta) % 4) as Direction };
      yield { type: 'turn', from, to: { ...drone } };
    } else if (cmd.type === 'move') {
      const dir = DIRS[drone.dir];
      const nx = drone.x + dir.x;
      const ny = drone.y + dir.y;

      const oob = nx < 0 || ny < 0 || nx >= level.cols || ny >= level.rows;
      if (oob || walls.has(key(nx, ny))) {
        yield { type: 'crash', drone: { ...drone }, attempted: { x: nx, y: ny } };
        return; // stop execution on crash
      }

      const from: DroneState = { ...drone };
      drone = { ...drone, x: nx, y: ny };
      yield { type: 'move', from, to: { ...drone } };

      if (drone.x === level.goal.x && drone.y === level.goal.y) {
        yield { type: 'goal', drone: { ...drone } };
        return; // stop execution on success
      }
    }
  }
}
