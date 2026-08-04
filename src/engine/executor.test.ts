import assert from 'node:assert/strict';
import { runSequence } from './executor';
import type { CellObjectType, Command, Level, StepEvent } from './types';

// ---- helpers ----
const move = { type: 'move' as const };
const collect = { type: 'collect' as const };
const R = { type: 'turn' as const, dir: 'R' as const };
const loopCmd = (times: number, ...body: Command[]): Command => ({ type: 'loop', times, body });
const ifCmd = (object: CellObjectType, then: Command[], elseBranch?: Command[]): Command =>
  elseBranch === undefined
    ? { type: 'if', condition: { type: 'cell-has', object }, then }
    : { type: 'if', condition: { type: 'cell-has', object }, then, else: elseBranch };

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

  // ---- Test 8: if condition met (coin present) — executes 'then' ----
  {
    const level: Level = {
      id: 't8',
      cols: 1,
      rows: 1,
      start: { x: 0, y: 0, dir: 1 },
      goal: { x: 0, y: 0 },
      coins: [[0, 0]],
      objective: 'collect-all-coins',
      par: 2,
      intro: '',
    };
    const events = await run(level, [ifCmd('coin', [collect])]);

    assert.equal(events.length, 2); // collect-coin, win — 'then' ran
    assert.equal(events[0].type, 'collect-coin');
    assert.equal(events[1].type, 'win');
    console.log("✓ if (coin present): runs 'then'");
  }

  // ---- Test 9: if condition NOT met — executes 'else' (SI NO) ----
  {
    // Empty cell (no coin): condition is false, so 'else' (move) runs instead.
    const level: Level = {
      id: 't9',
      cols: 2,
      rows: 1,
      start: { x: 0, y: 0, dir: 1 },
      goal: { x: 1, y: 0 },
      par: 2,
      intro: '',
    };
    const events = await run(level, [ifCmd('coin', [collect], [move])]);

    assert.equal(events.length, 2); // move, goal — 'else' ran, 'then' (collect) never did
    assert.equal(events[0].type, 'move');
    assert.equal(events[1].type, 'goal');
    console.log("✓ if (coin absent) with else: runs 'else'");
  }

  // ---- Test 10: if condition NOT met, no else — does nothing, program continues ----
  {
    const level: Level = {
      id: 't10',
      cols: 2,
      rows: 1,
      start: { x: 0, y: 0, dir: 1 },
      goal: { x: 1, y: 0 },
      par: 2,
      intro: '',
    };
    // No coin here: the if is skipped entirely (no else branch), then move runs normally.
    const events = await run(level, [ifCmd('coin', [collect]), move]);

    assert.equal(events.length, 2); // move, goal — nothing from the skipped if
    assert.equal(events[0].type, 'move');
    assert.equal(events[1].type, 'goal');
    console.log('✓ if (condition false, no else): no-op, execution continues');
  }

  // ---- Test 11: if condition on a bomb — reads the bomb sensor correctly ----
  {
    // "SI hay bomba: avanza (evítala); SI NO: recoge." Bomb is under the drone,
    // so 'then' (move away) must run — if it wrongly ran 'else' (collect), we'd see a boom.
    const level: Level = {
      id: 't11',
      cols: 2,
      rows: 1,
      start: { x: 0, y: 0, dir: 1 },
      goal: { x: 1, y: 0 },
      bombs: [[0, 0]],
      par: 2,
      intro: '',
    };
    const events = await run(level, [ifCmd('bomb', [move], [collect])]);

    assert.equal(events.length, 2); // move, goal — bomb correctly detected, avoided
    assert.equal(events[0].type, 'move');
    assert.equal(events[1].type, 'goal');
    console.log('✓ if (bomb present): correctly reads the bomb sensor');
  }

  // ---- Test 12: if inside a loop — re-evaluated every iteration, not just once ----
  {
    // repite×3[avanzar, SI moneda: recoge] over: [start] coin . coin
    // Iter1: move→coin cell, condition TRUE  → collects coin 1
    // Iter2: move→empty cell, condition FALSE → no else, no-op
    // Iter3: move→coin cell, condition TRUE  → collects coin 2 → wins (all coins collected)
    const level: Level = {
      id: 't12',
      cols: 4,
      rows: 1,
      start: { x: 0, y: 0, dir: 1 },
      goal: { x: 3, y: 0 },
      coins: [[1, 0], [3, 0]],
      objective: 'collect-all-coins',
      par: 2,
      intro: '',
    };
    const events = await run(level, [loopCmd(3, move, ifCmd('coin', [collect]))]);

    assert.equal(events.length, 6);
    assert.deepEqual(
      events.map((e) => e.type),
      ['move', 'collect-coin', 'move', 'move', 'collect-coin', 'win'],
    );
    console.log('✓ if inside loop: condition re-evaluated on every iteration');
  }

  console.log('\nAll executor tests passed.');
}

main();
