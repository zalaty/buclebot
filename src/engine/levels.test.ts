import assert from 'node:assert/strict';
import { runSequence } from './executor';
import { LEVELS } from './levels';
import type { Command, Level, StepEvent } from './types';
import { countCommands } from './unroll';

async function run(level: Level, program: Command[]): Promise<StepEvent[]> {
  const events: StepEvent[] = [];
  for await (const event of runSequence(level, program)) events.push(event);
  return events;
}

function getLevel(id: string): Level {
  const level = LEVELS.find((l) => l.id === id);
  if (!level) throw new Error(`Level ${id} not found`);
  return level;
}

async function main() {
  // Fase 1 (sintaxis): recoger (w3-1), abrir + bloqueo (w3-2), condicional (w3-3).
  // Fase 2 (condicional en bucle, niveles 4-6) es una pieza posterior.
  for (const id of ['w3-1', 'w3-2', 'w3-3']) {
    const level = getLevel(id);
    assert.ok(level.solution, `${id}: missing solution`);
    assert.equal(level.objective, 'collect-all-coins', `${id}: wrong objective`);
    assert.ok(level.budget !== undefined, `${id}: missing budget`);

    const events = await run(level, level.solution!);
    const types = events.map((e) => e.type);

    // No invalid actions (reset like a crash) and no unrecovered door blocks
    // — the canonical solution should read as the clean, intended path.
    assert.ok(!types.includes('crash'), `${id}: solution triggers a crash — ${types}`);
    assert.ok(!types.includes('door-blocked'), `${id}: solution gets blocked by a door — ${types}`);
    assert.equal(types[types.length - 1], 'win', `${id}: solution doesn't end in a win — ${types}`);

    // The win must actually mean "collected every coin and opened every door".
    const winEvent = events[events.length - 1];
    assert.equal(winEvent.type, 'win');
    const coinsTotal = level.coins?.length ?? 0;
    const doorsTotal = level.doors?.length ?? 0;
    const lastCollect = [...events].reverse().find((e) => e.type === 'collect-coin');
    const lastOpen = [...events].reverse().find((e) => e.type === 'open-door');
    if (coinsTotal > 0) {
      assert.ok(lastCollect, `${id}: no coins were ever collected`);
      if (lastCollect?.type === 'collect-coin') {
        assert.equal(lastCollect.coinsCollected, coinsTotal, `${id}: not all coins collected`);
      }
    }
    if (doorsTotal > 0) {
      assert.ok(lastOpen, `${id}: no doors were ever opened`);
      if (lastOpen?.type === 'open-door') {
        assert.equal(lastOpen.doorsOpened, doorsTotal, `${id}: not all doors opened`);
      }
    }

    const solutionCost = countCommands(level.solution!);
    assert.equal(solutionCost, level.par, `${id}: countCommands(solution)=${solutionCost} != par=${level.par}`);
    assert.ok(
      solutionCost <= level.budget!,
      `${id}: solution cost ${solutionCost} exceeds budget ${level.budget}`,
    );

    console.log(
      `✓ ${id}: solution wins cleanly — ${solutionCost} comandos (par ${level.par}, budget ${level.budget}) — ` +
        `${coinsTotal} moneda(s), ${doorsTotal} puerta(s)`,
    );
  }

  console.log('\nAll World 3 level validations passed.');
}

main();
