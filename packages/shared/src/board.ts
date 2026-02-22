import type { BoardSpace, BoardState, BranchPoint, SpaceType } from './types.js';
import { BOARD_SIZE } from './constants.js';

/**
 * Default board layout: 30 spaces in a loop with 2 branch points.
 *
 * Main loop: spaces 0-29 (space 29 connects back to 0).
 * Branch A: at space 8, alternate path through spaces 30-32, rejoins at space 12.
 * Branch B: at space 20, alternate path through spaces 33-35, rejoins at space 24.
 */

const SPACE_TYPES: SpaceType[] = [
  // 0-4
  'blank',       // 0: Start
  'charm_fountain', // 1
  'date_spot',   // 2
  'blank',       // 3
  'event',       // 4
  // 5-9
  'love_nest',   // 5: Sable's home
  'blank',       // 6
  'gift_shop',   // 7
  'blank',       // 8: Branch A start
  'date_spot',   // 9
  // 10-14
  'rival',       // 10
  'love_nest',   // 11: Dash's home
  'blank',       // 12: Branch A rejoin
  'charm_fountain', // 13
  'event',       // 14
  // 15-19
  'date_spot',   // 15
  'blank',       // 16
  'love_nest',   // 17: Lux's home
  'gift_shop',   // 18
  'blank',       // 19
  // 20-24
  'event',       // 20: Branch B start
  'date_spot',   // 21
  'rival',       // 22
  'love_nest',   // 23: Elm's home
  'blank',       // 24: Branch B rejoin
  // 25-29
  'charm_fountain', // 25
  'date_spot',   // 26
  'gift_shop',   // 27
  'love_nest',   // 28: Pip's home
  'event',       // 29
];

// Alternate branch spaces (off the main loop)
const BRANCH_SPACES: Array<{ type: SpaceType }> = [
  // Branch A: spaces 30-32
  { type: 'date_spot' },     // 30
  { type: 'charm_fountain' },// 31
  { type: 'event' },         // 32
  // Branch B: spaces 33-35
  { type: 'gift_shop' },     // 33
  { type: 'date_spot' },     // 34
  { type: 'charm_fountain' },// 35
];

const BRANCHES: BranchPoint[] = [
  { spaceIndex: 8, altPathLength: 3, rejoinIndex: 12 },
  { spaceIndex: 20, altPathLength: 3, rejoinIndex: 24 },
];

export function createDefaultBoard(): BoardState {
  const totalSpaces = BOARD_SIZE + BRANCH_SPACES.length;
  const spaces: BoardSpace[] = [];

  // Main loop spaces
  for (let i = 0; i < BOARD_SIZE; i++) {
    const space: BoardSpace = {
      index: i,
      type: SPACE_TYPES[i],
      next: [(i + 1) % BOARD_SIZE],
    };

    // Assign character IDs to love nest spaces
    if (space.type === 'love_nest') {
      if (i === 5) space.characterId = 'sable';
      else if (i === 11) space.characterId = 'dash';
      else if (i === 17) space.characterId = 'lux';
      else if (i === 23) space.characterId = 'elm';
      else if (i === 28) space.characterId = 'pip';
    }

    spaces.push(space);
  }

  // Branch spaces
  for (let i = 0; i < BRANCH_SPACES.length; i++) {
    spaces.push({
      index: BOARD_SIZE + i,
      type: BRANCH_SPACES[i].type,
      next: [], // wired below
    });
  }

  // Wire Branch A: space 8 → [9 (main), 30 (alt)], 30→31, 31→32, 32→12
  spaces[8].next = [9, 30];
  spaces[30].next = [31];
  spaces[31].next = [32];
  spaces[32].next = [12];

  // Wire Branch B: space 20 → [21 (main), 33 (alt)], 33→34, 34→35, 35→24
  spaces[20].next = [21, 33];
  spaces[33].next = [34];
  spaces[34].next = [35];
  spaces[35].next = [24];

  return { spaces, branches: BRANCHES };
}

/** Get all spaces reachable from a given position within `steps` moves. */
export function getReachableSpaces(
  board: BoardState,
  startIndex: number,
  steps: number,
): number[][] {
  if (steps === 0) return [[startIndex]];

  const paths: number[][] = [];

  function walk(current: number, remaining: number, path: number[]): void {
    if (remaining === 0) {
      paths.push([...path]);
      return;
    }
    const space = board.spaces[current];
    for (const nextIdx of space.next) {
      walk(nextIdx, remaining - 1, [...path, nextIdx]);
    }
  }

  walk(startIndex, steps, [startIndex]);
  return paths;
}
