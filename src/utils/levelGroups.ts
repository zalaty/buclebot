import { Level } from '../engine/types';

/** Levels with this id are debug/dev-only and never appear in normal navigation. */
const HIDDEN_LEVEL_IDS = new Set(['debug-loop', 'debug-collect']);

export const WORLD_TITLES: Record<number, string> = {
  1: 'Secuencias',
  2: 'Bucles',
};

export const WORLD_CONCEPT_TAGS: Record<number, string> = {
  1: 'ESTO ES UNA SECUENCIA',
  2: 'ESTO ES UN BUCLE',
};

/** Legacy World 1 levels predate the `world` field, so a missing value means world 1. */
export function levelWorld(level: Level): number {
  return level.world ?? 1;
}

export interface WorldGroup {
  world: number;
  title: string;
  levels: Level[];
}

/** Groups levels by world, in ascending world order, excluding hidden/debug levels. */
export function groupLevelsByWorld(levels: Level[]): WorldGroup[] {
  const visible = levels.filter((l) => !HIDDEN_LEVEL_IDS.has(l.id));
  const worlds = Array.from(new Set(visible.map(levelWorld))).sort((a, b) => a - b);

  return worlds.map((world) => ({
    world,
    title: WORLD_TITLES[world] ?? `Mundo ${world}`,
    levels: visible.filter((l) => levelWorld(l) === world),
  }));
}
