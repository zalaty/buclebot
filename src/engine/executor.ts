import { Command, Condition, Direction, DroneState, Level, StepEvent } from './types';

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
 * Yields one StepEvent per atomic command executed.
 * The caller is responsible for driving timing/animation.
 *
 * Walks the Command tree directly rather than consuming a pre-flattened
 * list: `if` branches depend on runtime state (what's on the drone's
 * current cell), so they can't be decided ahead of time like a loop's
 * fixed repeat count. `loop` still repeats its body N times, but by
 * re-walking the tree each iteration rather than pre-expanding it — this
 * matters once a loop contains an `if`, which must be re-evaluated on
 * every pass.
 */
export async function* runSequence(
  level: Level,
  program: Command[],
): AsyncGenerator<StepEvent> {
  const walls = buildWallSet(level);
  const key = (x: number, y: number) => `${x},${y}`;

  const collectsAllCoins = level.objective === 'collect-all-coins';
  const coinSet = new Set((level.coins ?? []).map(([x, y]) => key(x, y)));
  const bombSet = new Set((level.bombs ?? []).map(([x, y]) => key(x, y)));
  const coinsTotal = coinSet.size;
  const collected = new Set<string>();

  let drone: DroneState = { ...level.start };
  // Set by any terminal event (crash/goal/boom/win) so every ancestor
  // frame of the recursive walk stops yielding instead of continuing on
  // to sibling commands.
  let done = false;

  function evalCondition(condition: Condition): boolean {
    const posKey = key(drone.x, drone.y);
    if (condition.object === 'coin') return coinSet.has(posKey) && !collected.has(posKey);
    return bombSet.has(posKey); // 'bomb'
  }

  async function* walk(commands: Command[]): AsyncGenerator<StepEvent> {
    for (const cmd of commands) {
      if (done) return;

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
          done = true;
          return; // stop execution on crash
        }

        const from: DroneState = { ...drone };
        drone = { ...drone, x: nx, y: ny };
        yield { type: 'move', from, to: { ...drone } };

        if (!collectsAllCoins && drone.x === level.goal.x && drone.y === level.goal.y) {
          yield { type: 'goal', drone: { ...drone } };
          done = true;
          return; // stop execution on success
        }
      } else if (cmd.type === 'collect') {
        const posKey = key(drone.x, drone.y);

        if (bombSet.has(posKey)) {
          yield { type: 'boom', drone: { ...drone } };
          done = true;
          return; // stop execution on bomb pickup, like a crash
        }

        if (coinSet.has(posKey) && !collected.has(posKey)) {
          collected.add(posKey);
          yield {
            type: 'collect-coin',
            drone: { ...drone },
            coinsCollected: collected.size,
            coinsTotal,
          };

          if (collectsAllCoins && collected.size === coinsTotal) {
            yield { type: 'win', drone: { ...drone } };
            done = true;
            return; // stop execution on success
          }
        } else {
          yield { type: 'collect-empty', drone: { ...drone } };
        }
      } else if (cmd.type === 'loop') {
        for (let i = 0; i < cmd.times; i++) {
          yield* walk(cmd.body);
          if (done) return;
        }
      } else if (cmd.type === 'if') {
        const branch = evalCondition(cmd.condition) ? cmd.then : cmd.else ?? [];
        yield* walk(branch);
        if (done) return;
      }
    }
  }

  yield* walk(program);
}
