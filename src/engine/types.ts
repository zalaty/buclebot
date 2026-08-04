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

/** What an object placed on the grid represents (World 3+). */
export type CellObjectType = 'coin' | 'bomb';

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

export type Command = MoveCommand | TurnCommand | LoopCommand | CollectCommand | IfCommand;

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
  /** Bomb positions (World 3+). Collecting one loses the level, like a crash. */
  bombs?: [number, number][];
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

export type StepEvent = MoveEvent | TurnEvent | CrashEvent | GoalEvent;

// ---- RunResult ----

export type Score = 'optimal' | 'completed';

export interface RunResult {
  success: boolean;
  commandsUsed: number;
  score: Score | null;
}
