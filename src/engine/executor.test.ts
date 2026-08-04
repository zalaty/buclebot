import assert from 'node:assert/strict';
import { runSequence } from './executor';
import type { Command, Level, StepEvent } from './types';

// ---- helpers ----
const move = { type: 'move' as const };
const collect = { type: 'collect' as const };
const R = { type: 'turn' as const, dir: 'R' as const };

async function run(level: Level, program: Command[]): Promise<StepEvent[]> {
  const events: StepEvent[] = [];
  for await (const event of runSequence(level, program)) events.push(event);
  return events;
}

async function main() {
  // ---- Test 1: collect a coin ----
  {
    // .C   (start facing right at 0,0; coin at 1,0)
    const level: Level = {
      id: 't1',
      cols: 2,
      rows: 1,
      start: { x: 0, y: 0, dir: 1 },
      goal: { x: 1, y: 0 },
      coins: [[1, 0]],
      objective: 'collect-all-coins',
      par: 2,
      intro: '',
    };
    const events = await run(level, [move, collect]);

    assert.equal(events.length, 3); // move, collect-coin, win
    assert.equal(events[1].type, 'collect-coin');
    assert.equal(events[2].type, 'win');
    console.log('✓ collect a coin: wins collect-all-coins level');
  }

  // ---- Test 2: collecting a bomb loses (boom), like a crash ----
  {
    const level: Level = {
      id: 't2',
      cols: 2,
      rows: 1,
      start: { x: 0, y: 0, dir: 1 },
      goal: { x: 1, y: 0 },
      bombs: [[1, 0]],
      objective: 'collect-all-coins',
      par: 2,
      intro: '',
    };
    const events = await run(level, [move, collect, move]); // 3rd move never runs

    assert.equal(events.length, 2); // move, boom
    assert.equal(events[1].type, 'boom');
    console.log('✓ collecting a bomb: boom, execution stops');
  }

  // ---- Test 3: walking over a bomb without collecting is safe ----
  {
    const level: Level = {
      id: 't3',
      cols: 3,
      rows: 1,
      start: { x: 0, y: 0, dir: 1 },
      goal: { x: 2, y: 0 },
      bombs: [[1, 0]],
      coins: [[2, 0]],
      objective: 'collect-all-coins',
      par: 3,
      intro: '',
    };
    const events = await run(level, [move, move, collect]); // steps over bomb cell, never collects it

    assert.equal(events.length, 4); // move, move, collect-coin, win
    assert.equal(events[2].type, 'collect-coin');
    assert.equal(events[3].type, 'win');
    console.log('✓ walking over a bomb without collect: safe');
  }

  // ---- Test 4: collecting on an empty cell does nothing ----
  {
    const level: Level = {
      id: 't4',
      cols: 2,
      rows: 1,
      start: { x: 0, y: 0, dir: 1 },
      goal: { x: 1, y: 0 },
      par: 1,
      intro: '',
    };
    const events = await run(level, [collect]);

    assert.equal(events.length, 1);
    assert.equal(events[0].type, 'collect-empty');
    console.log('✓ collect on empty cell: no-op event, no crash');
  }

  // ---- Test 5: collecting the same coin twice — second time is a no-op ----
  {
    // Two coins so the first collect doesn't win immediately; re-collecting the
    // same cell must not double-count or emit a second collect-coin.
    const level: Level = {
      id: 't5',
      cols: 2,
      rows: 1,
      start: { x: 0, y: 0, dir: 1 },
      goal: { x: 1, y: 0 },
      coins: [[0, 0], [1, 0]],
      objective: 'collect-all-coins',
      par: 3,
      intro: '',
    };
    const events = await run(level, [collect, collect]); // both on the same cell, x=0

    assert.equal(events.length, 2);
    assert.equal(events[0].type, 'collect-coin');
    if (events[0].type === 'collect-coin') assert.equal(events[0].coinsCollected, 1);
    assert.equal(events[1].type, 'collect-empty'); // re-collecting: already taken
    console.log('✓ re-collecting an already-taken coin: no-op, no double count');
  }

  // ---- Test 6: World 1/2 behavior (reach-goal) is untouched by objective/coins ----
  {
    const level: Level = {
      id: 't6',
      cols: 2,
      rows: 1,
      start: { x: 0, y: 0, dir: 1 },
      goal: { x: 1, y: 0 },
      par: 1,
      intro: '',
    };
    const events = await run(level, [move]);

    assert.equal(events.length, 2); // move, goal
    assert.equal(events[1].type, 'goal');
    console.log('✓ World 1/2 reach-goal: unchanged');
  }

  // ---- Test 7: coins present but objective NOT set — behaves as reach-goal, no 'win' ----
  {
    // Guards against inferring the objective from the mere presence of `coins`;
    // it must come from the explicit `objective` field.
    const level: Level = {
      id: 't7',
      cols: 2,
      rows: 1,
      start: { x: 0, y: 0, dir: 1 },
      goal: { x: 1, y: 0 },
      coins: [[1, 0]],
      par: 2,
      intro: '',
    };
    const events = await run(level, [move, collect]); // 'collect' never runs: goal ends it first

    assert.equal(events.length, 2); // move, goal — execution stops on reaching goal, as in World 1/2
    assert.equal(events[1].type, 'goal');
    assert.ok(!events.some((e) => e.type === 'win'));
    console.log('✓ coins present without objective: reach-goal behavior, no win event');
  }

  console.log('\nAll executor tests passed.');
}

main();
