/** 0 = up, 1 = right, 2 = down, 3 = left */
export type Direction = 0 | 1 | 2 | 3;

export interface DroneState {
  x: number;
  y: number;
  dir: Direction;
}

export interface MoveCommand { type: 'move' }
export interface TurnCommand { type: 'turn'; dir: 'L' | 'R' }
export interface LoopCommand { type: 'loop'; times: number; body: Command[] }
export interface CollectCommand { type: 'collect' }
export interface OpenCommand { type: 'open' }

/** What an object placed on the grid represents (World 3+). */
export type CellObjectType = 'coin' | 'door';

/**
 * What an IfCommand checks. Currently: the object on the drone's current
 * cell. Extensible for future sensors (e.g. `{ type: 'wall-ahead' }`).
 */
export type Condition = { type: 'cell-has'; object: CellObjectType };

/** SI (condition) ENTONCES (then) SI NO (else). `else` is optional. */
export interface IfCommand {
  type: 'if';
  condition: Condition;
  then: Command[];
  else?: Command[];
}

export type Command =
  | MoveCommand
  | TurnCommand
  | LoopCommand
  | CollectCommand
  | OpenCommand
  | IfCommand;

export interface Level {
  id: string;
  /** World this level belongs to (1 = sequences, 2 = loops, …). Omitted on legacy World 1 levels. */
  world?: number;
  cols: number;
  rows: number;
  start: { x: number; y: number; dir: Direction };
  goal: { x: number; y: number };
  /** Explicit wall cells — takes precedence over open */
  walls?: [number, number][];
  /** Whitelist of open cells; everything else is a wall */
  open?: [number, number][];
  /** Coin positions (World 3+). Collecting all coins is the win condition when present. */
  coins?: [number, number][];
  /** Door positions (World 3+). Blocks the path until opened with `open`. */
  doors?: [number, number][];
  /**
   * Win condition for this level. Defaults to 'reach-goal' when omitted
   * (Worlds 1-2). World 3 levels set 'collect-all-coins'.
   */
  objective?: 'reach-goal' | 'collect-all-coins';
  /** Optimal command count */
  par: number;
  /** Shown before play */
  intro: string;
  /** Shown on level completion (used for loop teaser on level 5) */
  outro?: string;
  /** Max atomic commands allowed before the run is rejected (World 2+) */
  budget?: number;
  /** Canonical solution used for validation/hints (World 2+) */
  solution?: Command[];
}

// ---- StepEvent union ----

export interface MoveEvent {
  type: 'move';
  from: DroneState;
  to: DroneState;
}

export interface TurnEvent {
  type: 'turn';
  from: DroneState;
  to: DroneState;
}

export interface CrashEvent {
  type: 'crash';
  drone: DroneState;
  /** attempted position (may be out of bounds) */
  attempted: { x: number; y: number };
}

export interface GoalEvent {
  type: 'goal';
  drone: DroneState;
}

/** A `collect` command picked up a coin (World 3). */
export interface CollectCoinEvent {
  type: 'collect-coin';
  drone: DroneState;
  coinsCollected: number;
  coinsTotal: number;
}

/** A `collect` command found nothing worth collecting (empty cell, or a coin already taken). */
export interface CollectEmptyEvent {
  type: 'collect-empty';
  drone: DroneState;
}

/** A `move` was blocked by a closed door ahead — the drone stays put, execution continues (World 3). */
export interface DoorBlockedEvent {
  type: 'door-blocked';
  drone: DroneState;
  /** the blocked cell ahead */
  attempted: { x: number; y: number };
}

/** An `open` command opened a closed door ahead (World 3). */
export interface OpenDoorEvent {
  type: 'open-door';
  drone: DroneState;
  doorsOpened: number;
  doorsTotal: number;
}

/** An `open` command found nothing to open (empty cell, wall, already-open door, or an already-collected coin). */
export interface OpenEmptyEvent {
  type: 'open-empty';
  drone: DroneState;
}

/** All coins collected — wins a `collect-all-coins` level (World 3). */
export interface WinEvent {
  type: 'win';
  drone: DroneState;
}

export type StepEvent =
  | MoveEvent
  | TurnEvent
  | CrashEvent
  | GoalEvent
  | CollectCoinEvent
  | CollectEmptyEvent
  | DoorBlockedEvent
  | OpenDoorEvent
  | OpenEmptyEvent
  | WinEvent;

// ---- RunResult ----

export type Score = 'optimal' | 'completed';

export interface RunResult {
  success: boolean;
  commandsUsed: number;
  score: Score | null;
}
