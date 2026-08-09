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

/**
 * "Recoge a ciegas": collect at every single cell along the row, never
 * distinguishing coin from bomb from empty. The naive habit the budget/bombs
 * are meant to defeat.
 */
function blindProgram(cols: number): Command[] {
  const program: Command[] = [{ type: 'collect' }];
  for (let i = 1; i < cols; i++) {
    program.push({ type: 'move' }, { type: 'collect' });
  }
  return program;
}

async function main() {
  for (const id of ['w3-1', 'w3-2', 'w3-3', 'w3-4']) {
    const level = getLevel(id);
    assert.ok(level.solution, `${id}: missing solution`);
    assert.equal(level.objective, 'collect-all-coins', `${id}: wrong objective`);
    assert.ok(level.budget !== undefined, `${id}: missing budget`);

    // ---- Canonical solution: wins cleanly, no boom/crash, matches par/budget ----
    const events = await run(level, level.solution!);
    const types = events.map((e) => e.type);

    assert.ok(!types.includes('boom'), `${id}: solution triggers a boom — ${types}`);
    assert.ok(!types.includes('crash'), `${id}: solution triggers a crash — ${types}`);
    assert.equal(types[types.length - 1], 'win', `${id}: solution doesn't end in a win — ${types}`);

    const solutionCost = countCommands(level.solution!);
    assert.equal(solutionCost, level.par, `${id}: countCommands(solution)=${solutionCost} != par=${level.par}`);
    assert.ok(
      solutionCost <= level.budget!,
      `${id}: solution cost ${solutionCost} exceeds budget ${level.budget}`,
    );

    console.log(`✓ ${id}: solution wins cleanly — ${solutionCost} commands (par ${level.par}, budget ${level.budget})`);

    // ---- Obligatoriness: blind "collect everywhere" must fail — boom, or over budget ----
    const blind = blindProgram(level.cols);
    const blindCost = countCommands(blind);
    const blindEvents = await run(level, blind);
    const blindTypes = blindEvents.map((e) => e.type);
    const blindBooms = blindTypes.includes('boom');
    const blindOverBudget = blindCost > level.budget!;

    assert.ok(
      blindBooms || blindOverBudget,
      `${id}: blind collect neither booms nor exceeds budget (cost ${blindCost} <= budget ${level.budget}) — the conditional isn't actually necessary`,
    );

    console.log(
      `  blind "recoge a ciegas": ${blindCost} comandos — ${
        blindBooms ? 'explota una bomba 💣' : ''
      }${blindBooms && blindOverBudget ? ' y ' : ''}${
        blindOverBudget ? `excede el presupuesto (${level.budget})` : ''
      }`,
    );
  }

  console.log('\nAll World 3 level validations passed.');
}

main();
