import assert from 'node:assert/strict';
import { unroll, countCommands } from './unroll';

// ---- helpers ----
const move = { type: 'move' as const };
const R    = { type: 'turn' as const, dir: 'R' as const };
const L    = { type: 'turn' as const, dir: 'L' as const };
const loop = (times: number, ...body: Parameters<typeof unroll>[0]) =>
  ({ type: 'loop' as const, times, body });

// ---- Test 1: simple loop (the example from the spec) ----
{
  // loop×3[move, turnR]  →  move turnR  move turnR  move turnR
  const prog = [loop(3, move, R)];
  const flat = unroll(prog);

  assert.deepEqual(flat, [move, R, move, R, move, R]);
  assert.equal(countCommands(prog), 3); // 1 (loop) + 2 (body)
  console.log('✓ simple loop: unroll + count OK');
}

// ---- Test 2: loop×6[move] = 2  (the scoring example from spec) ----
{
  const prog = [loop(6, move)];
  assert.equal(unroll(prog).length, 6);
  assert.equal(countCommands(prog), 2); // 1 (loop) + 1 (move)
  console.log('✓ loop×6[move]: count = 2 OK');
}

// ---- Test 3: nested loops ----
{
  // loop×2[ move, loop×3[turnL] ]
  // Unrolled: move turnL turnL turnL  move turnL turnL turnL  (8 atoms)
  // Count:    1 (outer) + 1 (move) + 1 (inner) + 1 (turnL) = 4
  const prog = [loop(2, move, loop(3, L))];
  const flat = unroll(prog);

  assert.deepEqual(flat, [move, L, L, L, move, L, L, L]);
  assert.equal(countCommands(prog), 4);
  console.log('✓ nested loops: unroll + count OK');
}

// ---- Test 4: mixed — atomic commands alongside loops ----
{
  // move, loop×2[R], move
  // Unrolled: move R R move  (4 atoms)
  // Count:    1 + (1+1) + 1 = 4
  const prog = [move, loop(2, R), move];
  const flat = unroll(prog);

  assert.deepEqual(flat, [move, R, R, move]);
  assert.equal(countCommands(prog), 4);
  console.log('✓ mixed atomic + loop: unroll + count OK');
}

console.log('\nAll tests passed.');
