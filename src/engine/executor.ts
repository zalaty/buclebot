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

  const isCollectObjective = level.objective === 'collect-all-coins';
  const coinSet = new Set((level.coins ?? []).map(([x, y]) => key(x, y)));
  const doorSet = new Set((level.doors ?? []).map(([x, y]) => key(x, y)));
  const coinsTotal = coinSet.size;
  const doorsTotal = doorSet.size;
  const collected = new Set<string>();
  // Doors start closed; opening one marks it here. Execution-time state,
  // not part of the Level — the level only records where doors *are*.
  const openedDoors = new Set<string>();

  let drone: DroneState = { ...level.start };
  // Set by any terminal event (crash/goal/win) so every ancestor frame of
  // the recursive walk stops yielding instead of continuing on to sibling
  // commands.
  let done = false;

  /** The cell the drone is facing — where `move`/`open` act on a door. */
  function ahead(): { x: number; y: number } {
    const dir = DIRS[drone.dir];
    return { x: drone.x + dir.x, y: drone.y + dir.y };
  }

  /**
   * A coin is found by walking onto it, so its condition checks the
   * drone's current cell. A closed door blocks `move` before the drone
   * ever reaches it — the drone can never stand on one — so its condition
   * checks the cell ahead instead, the same cell `open` acts on. Without
   * this, "SI puerta" could never be true in a reachable game state.
   */
  function evalCondition(condition: Condition): boolean {
    if (condition.object === 'coin') {
      const posKey = key(drone.x, drone.y);
      return coinSet.has(posKey) && !collected.has(posKey);
    }
    const { x, y } = ahead();
    return doorSet.has(key(x, y)) && !openedDoors.has(key(x, y)); // 'door'
  }

  /** Collected all coins and opened all doors (World 3's collect-all-coins objective). */
  function objectiveComplete(): boolean {
    return collected.size === coinsTotal && openedDoors.size === doorsTotal;
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
        const { x: nx, y: ny } = ahead();
        const destKey = key(nx, ny);

        const oob = nx < 0 || ny < 0 || nx >= level.cols || ny >= level.rows;
        if (oob || walls.has(destKey)) {
          yield { type: 'crash', drone: { ...drone }, attempted: { x: nx, y: ny } };
          done = true;
          return; // stop execution on crash
        }

        if (doorSet.has(destKey) && !openedDoors.has(destKey)) {
          // Closed door blocks the way: the drone stays put. This is a
          // warning, not a failure — unlike crash, execution continues so
          // the very next command (e.g. an `open`) can still recover.
          yield { type: 'door-blocked', drone: { ...drone }, attempted: { x: nx, y: ny } };
        } else {
          const from: DroneState = { ...drone };
          drone = { ...drone, x: nx, y: ny };
          yield { type: 'move', from, to: { ...drone } };

          if (!isCollectObjective && drone.x === level.goal.x && drone.y === level.goal.y) {
            yield { type: 'goal', drone: { ...drone } };
            done = true;
            return; // stop execution on success
          }
        }
      } else if (cmd.type === 'collect') {
        const posKey = key(drone.x, drone.y);

        if (doorSet.has(posKey)) {
          // Wrong tool for a door — invalid action, reset like a crash.
          yield { type: 'crash', drone: { ...drone }, attempted: { x: drone.x, y: drone.y } };
          done = true;
          return;
        }

        if (coinSet.has(posKey) && !collected.has(posKey)) {
          collected.add(posKey);
          yield {
            type: 'collect-coin',
            drone: { ...drone },
            coinsCollected: collected.size,
            coinsTotal,
          };

          if (isCollectObjective && objectiveComplete()) {
            yield { type: 'win', drone: { ...drone } };
            done = true;
            return; // stop execution on success
          }
        } else {
          yield { type: 'collect-empty', drone: { ...drone } };
        }
      } else if (cmd.type === 'open') {
        const { x: ax, y: ay } = ahead();
        const aheadKey = key(ax, ay);

        if (doorSet.has(aheadKey) && !openedDoors.has(aheadKey)) {
          openedDoors.add(aheadKey);
          yield {
            type: 'open-door',
            drone: { ...drone },
            doorsOpened: openedDoors.size,
            doorsTotal,
          };

          if (isCollectObjective && objectiveComplete()) {
            yield { type: 'win', drone: { ...drone } };
            done = true;
            return; // stop execution on success
          }
        } else if (coinSet.has(aheadKey) && !collected.has(aheadKey)) {
          // Wrong tool for a coin — invalid action, reset like a crash.
          yield { type: 'crash', drone: { ...drone }, attempted: { x: ax, y: ay } };
          done = true;
          return;
        } else {
          yield { type: 'open-empty', drone: { ...drone } };
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
