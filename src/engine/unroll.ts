import type { Command, MoveCommand, TurnCommand } from './types';

export type AtomicCommand = MoveCommand | TurnCommand;

/** Flattens a Command tree into a flat list of atomic commands by expanding loops. */
export function unroll(program: Command[]): AtomicCommand[] {
  const result: AtomicCommand[] = [];
  for (const cmd of program) {
    if (cmd.type === 'loop') {
      for (let i = 0; i < cmd.times; i++) {
        result.push(...unroll(cmd.body));
      }
    } else {
      result.push(cmd);
    }
  }
  return result;
}

/**
 * Counts the "authoring cost" of a program for scoring purposes.
 * Atomic command = 1. Loop = 1 (the loop node itself) + countCommands(body).
 * This measures the size of the written program, not its expanded length.
 * Example: loop×6[move] → 1 + 1 = 2.
 */
export function countCommands(program: Command[]): number {
  let total = 0;
  for (const cmd of program) {
    total += cmd.type === 'loop' ? 1 + countCommands(cmd.body) : 1;
  }
  return total;
}
