import assert from 'node:assert/strict';
import { runSequence } from './executor';
import type { CellObjectType, Command, Level, StepEvent } from './types';

// ---- helpers ----
const move = { type: 'move' as const };
const collect = { type: 'collect' as const };
const open = { type: 'open' as const };
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
  // ================= Coins (unchanged mechanic) =================

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

  // ---- Test 2: collecting on an empty cell does nothing ----
  {
    const level: Level = {
      id: 't2',
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

  // ---- Test 3: collecting the same coin twice — second time is a no-op ----
  {
    // Two coins so the first collect doesn't win immediately; re-collecting the
    // same cell must not double-count or emit a second collect-coin.
    const level: Level = {
      id: 't3',
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

  // ================= Doors (new mechanic — replaces the old bomb/boom one) =================

  // ---- Test 4: advancing into a closed door — blocked, drone doesn't move, execution continues ----
  {
    const level: Level = {
      id: 't4',
      cols: 2,
      rows: 1,
      start: { x: 0, y: 0, dir: 1 },
      goal: { x: 1, y: 0 },
      doors: [[1, 0]],
      par: 2,
      intro: '',
    };
    const events = await run(level, [move, R]); // trailing command proves execution didn't stop

    assert.equal(events.length, 2);
    assert.equal(events[0].type, 'door-blocked');
    if (events[0].type === 'door-blocked') {
      assert.deepEqual(events[0].drone, { x: 0, y: 0, dir: 1 }); // never moved
    }
    assert.equal(events[1].type, 'turn'); // the very next command still ran
    console.log("✓ closed door blocks 'move': drone stays put, run continues (not a crash)");
  }

  // ---- Test 5: open a door — unblocks it, then 'move' passes through ----
  {
    const level: Level = {
      id: 't5',
      cols: 3,
      rows: 1,
      start: { x: 0, y: 0, dir: 1 },
      goal: { x: 2, y: 0 }, // away from x=1, so the retried move doesn't incidentally hit goal
      doors: [[1, 0]],
      par: 3,
      intro: '',
    };
    const events = await run(level, [move, open, move]);

    assert.equal(events.length, 3);
    assert.equal(events[0].type, 'door-blocked'); // first attempt: still closed
    assert.equal(events[1].type, 'open-door'); // opens it
    if (events[1].type === 'open-door') {
      assert.equal(events[1].doorsOpened, 1);
      assert.equal(events[1].doorsTotal, 1);
    }
    assert.equal(events[2].type, 'move'); // second attempt: now passes through
    console.log("✓ 'open' unblocks a door: the retried 'move' passes through");
  }

  // ---- Test 6: moving onto an already-open door is normal passage ----
  {
    const level: Level = {
      id: 't6',
      cols: 3,
      rows: 1,
      start: { x: 0, y: 0, dir: 1 },
      goal: { x: 2, y: 0 },
      doors: [[1, 0]],
      coins: [[2, 0]],
      objective: 'collect-all-coins',
      par: 4,
      intro: '',
    };
    const events = await run(level, [open, move, move, collect]);

    assert.equal(events.length, 5); // open-door, move, move, collect-coin, win
    assert.equal(events[0].type, 'open-door');
    assert.equal(events[1].type, 'move'); // walks onto the now-open door normally
    assert.equal(events[2].type, 'move');
    assert.equal(events[3].type, 'collect-coin');
    assert.equal(events[4].type, 'win');
    console.log('✓ an open door is passed through like any other cell');
  }

  // ---- Test 7: opening on an empty cell does nothing ----
  {
    const level: Level = {
      id: 't7',
      cols: 2,
      rows: 1,
      start: { x: 0, y: 0, dir: 1 },
      goal: { x: 1, y: 0 },
      par: 1,
      intro: '',
    };
    const events = await run(level, [open]);

    assert.equal(events.length, 1);
    assert.equal(events[0].type, 'open-empty');
    console.log('✓ open on empty cell ahead: no-op event, no crash');
  }

  // ---- Test 8: opening on a coin — wrong tool, invalid action, resets like a crash ----
  {
    const level: Level = {
      id: 't8',
      cols: 2,
      rows: 1,
      start: { x: 0, y: 0, dir: 1 },
      goal: { x: 1, y: 0 },
      coins: [[1, 0]],
      par: 1,
      intro: '',
    };
    const events = await run(level, [open]);

    assert.equal(events.length, 1);
    assert.equal(events[0].type, 'crash');
    console.log("✓ 'open' on a coin: invalid action, resets like a crash");
  }

  // ---- Test 9: collecting on a door — wrong tool, invalid action, resets like a crash ----
  {
    const level: Level = {
      id: 't9',
      cols: 3,
      rows: 1,
      start: { x: 0, y: 0, dir: 1 },
      goal: { x: 2, y: 0 }, // away from x=1, so the move onto the door doesn't incidentally hit goal
      doors: [[1, 0]],
      par: 3,
      intro: '',
    };
    // Open it and walk onto it first — collect only ever sees the *current*
    // cell, and a closed door can never be the drone's current cell.
    const events = await run(level, [open, move, collect]);

    assert.equal(events.length, 3);
    assert.equal(events[0].type, 'open-door');
    assert.equal(events[1].type, 'move');
    assert.equal(events[2].type, 'crash');
    console.log("✓ 'collect' on a door: invalid action, resets like a crash");
  }

  // ---- Test 10: World 3 win — needs every coin collected AND every door opened ----
  {
    const level: Level = {
      id: 't10',
      cols: 4,
      rows: 1,
      start: { x: 0, y: 0, dir: 1 },
      goal: { x: 3, y: 0 },
      doors: [[1, 0]],
      coins: [[3, 0]],
      objective: 'collect-all-coins',
      par: 6,
      intro: '',
    };
    const events = await run(level, [move, open, move, move, move, collect]);

    assert.equal(events.length, 7);
    assert.deepEqual(
      events.map((e) => e.type),
      ['door-blocked', 'open-door', 'move', 'move', 'move', 'collect-coin', 'win'],
    );
    console.log('✓ win requires all coins collected AND all doors opened');
  }

  // ---- Test 11: opening the last door before collecting the last coin also wins ----
  {
    // Same idea as Test 10, but the *door* is the final piece completed —
    // confirms the win check runs after 'open', not only after 'collect'.
    const level: Level = {
      id: 't11',
      cols: 4,
      rows: 1,
      start: { x: 0, y: 0, dir: 1 },
      goal: { x: 3, y: 0 },
      doors: [[3, 0]],
      coins: [[1, 0]],
      objective: 'collect-all-coins',
      par: 5,
      intro: '',
    };
    const events = await run(level, [move, collect, move, open]);

    assert.equal(events.length, 5);
    assert.deepEqual(
      events.map((e) => e.type),
      ['move', 'collect-coin', 'move', 'open-door', 'win'],
    );
    // 'open-door' (the second-to-last event) is what completes the objective —
    // confirms the win check runs after 'open', not only after 'collect'.
    const openEvent = events[3];
    if (openEvent.type === 'open-door') {
      assert.equal(openEvent.doorsOpened, openEvent.doorsTotal);
    }
    console.log('✓ opening the last door completes the objective too (checked after open, not just collect)');
  }

  // ================= World 1/2 (unaffected) =================

  // ---- Test 12: World 1/2 behavior (reach-goal) is untouched by objective/coins/doors ----
  {
    const level: Level = {
      id: 't12',
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

  // ---- Test 13: coins present but objective NOT set — behaves as reach-goal, no 'win' ----
  {
    // Guards against inferring the objective from the mere presence of `coins`;
    // it must come from the explicit `objective` field.
    const level: Level = {
      id: 't13',
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

  // ================= If/else conditionals =================

  // ---- Test 14: if condition met (coin present) — executes 'then' ----
  {
    const level: Level = {
      id: 't14',
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

  // ---- Test 15: if condition NOT met — executes 'else' (SI NO) ----
  {
    // Empty cell (no coin): condition is false, so 'else' (move) runs instead.
    const level: Level = {
      id: 't15',
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

  // ---- Test 16: if condition NOT met, no else — does nothing, program continues ----
  {
    const level: Level = {
      id: 't16',
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

  // ---- Test 17: if condition on a door — reads the *cell ahead*, not the current cell ----
  {
    // A closed door can never be the drone's current cell (move blocks entry),
    // so "SI puerta" must sense the door ahead of the drone instead. If it
    // wrongly checked the current cell, this condition would always read
    // false, 'else' (move) would run, and we'd see a door-blocked event
    // instead of the door actually opening.
    const level: Level = {
      id: 't17',
      cols: 2,
      rows: 1,
      start: { x: 0, y: 0, dir: 1 },
      goal: { x: 1, y: 0 },
      doors: [[1, 0]],
      par: 2,
      intro: '',
    };
    const events = await run(level, [ifCmd('door', [open], [move])]);

    assert.equal(events.length, 1);
    assert.equal(events[0].type, 'open-door');
    console.log("✓ if (door ahead): correctly senses the door ahead, runs 'then' (open)");
  }

  // ---- Test 18: if condition on a door, none ahead — correctly runs 'else' ----
  {
    const level: Level = {
      id: 't18',
      cols: 2,
      rows: 1,
      start: { x: 0, y: 0, dir: 1 },
      goal: { x: 1, y: 0 },
      par: 2,
      intro: '',
    };
    const events = await run(level, [ifCmd('door', [open], [move])]);

    assert.equal(events.length, 2); // move, goal — no door ahead, 'else' (move) ran
    assert.equal(events[0].type, 'move');
    assert.equal(events[1].type, 'goal');
    console.log("✓ if (no door ahead): correctly runs 'else'");
  }

  // ---- Test 19: if inside a loop — re-evaluated every iteration, not just once ----
  {
    // repite×3[avanzar, SI moneda: recoge] over: [start] coin . coin
    // Iter1: move→coin cell, condition TRUE  → collects coin 1
    // Iter2: move→empty cell, condition FALSE → no else, no-op
    // Iter3: move→coin cell, condition TRUE  → collects coin 2 → wins (all coins collected)
    const level: Level = {
      id: 't19',
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
