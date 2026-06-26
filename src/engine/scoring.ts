import { Score } from './types';

/**
 * Returns 'optimal' if used <= par, 'completed' otherwise.
 */
export function getScore(used: number, par: number): Score {
  return used <= par ? 'optimal' : 'completed';
}
