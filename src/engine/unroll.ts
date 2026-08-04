import type { Command, LoopCommand } from './types';

/**
 * Everything except `loop` — the only node `unroll` expands. Notably
 * includes `IfCommand`: a conditional's branch depends on runtime state
 * (see executor.ts), so it can't be resolved ahead of time like a loop's
 * fixed repeat count, and passes through unexpanded.
 */
export type AtomicCommand = Exclude<Command, LoopCommand>;

/**
 * Flattens a Command tree into a flat list by expanding loops (fixed
 * repeat count, safe to pre-expand). `if` nodes pass through unexpanded —
 * their branch depends on state at execution time, so runSequence walks
 * the tree itself rather than relying on this flattening for `if`.
 */
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
 * If = 1 (the if node itself) + countCommands(then) + countCommands(else).
 * This measures the size of the written program, not its expanded length.
 * Example: loop×6[move] → 1 + 1 = 2.
 */
export function countCommands(program: Command[]): number {
  let total = 0;
  for (const cmd of program) {
    if (cmd.type === 'loop') {
      total += 1 + countCommands(cmd.body);
    } else if (cmd.type === 'if') {
      total += 1 + countCommands(cmd.then) + countCommands(cmd.else ?? []);
    } else {
      total += 1;
    }
  }
  return total;
}
