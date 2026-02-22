import type { PlayerState, CharacterDef, DialogueChoice } from '@hearty-party/shared';
import {
  CHARACTERS,
  MAX_AFFECTION,
  MILESTONE_THRESHOLDS,
  AFFECTION_DATE_SPOT_MIN,
  AFFECTION_DATE_SPOT_MAX,
  AFFECTION_LOVE_NEST_MIN,
  AFFECTION_LOVE_NEST_MAX,
} from '@hearty-party/shared';

/**
 * Calculate affection change from a dialogue choice based on a character's preferences.
 * Returns a value in the range [AFFECTION_BAD_CHOICE_MAX, AFFECTION_DATE_SPOT_MAX].
 */
export function calculateDialogueAffection(
  character: CharacterDef,
  choice: DialogueChoice,
): number {
  const weight = character.preferences[choice.category] ?? 0;

  // weight ranges from -3 to +3
  // Map to affection change:
  //   -3 → -5, -2 → -3, -1 → -1, 0 → +1, +1 → +3, +2 → +5, +3 → +8
  if (weight <= -3) return -5;
  if (weight === -2) return -3;
  if (weight === -1) return -1;
  if (weight === 0) return 1;
  if (weight === 1) return 3;
  if (weight === 2) return 5;
  return 8; // weight >= 3
}

/**
 * Calculate affection gain for a Love Nest encounter (guaranteed character).
 * Love Nests always give positive affection in the range [MIN, MAX].
 */
export function calculateLoveNestAffection(
  character: CharacterDef,
  choice: DialogueChoice,
): number {
  const weight = character.preferences[choice.category] ?? 0;
  // Scale weight (-3..+3) into [LOVE_NEST_MIN..LOVE_NEST_MAX]
  const normalized = (weight + 3) / 6; // 0..1
  return Math.round(
    AFFECTION_LOVE_NEST_MIN + normalized * (AFFECTION_LOVE_NEST_MAX - AFFECTION_LOVE_NEST_MIN),
  );
}

/**
 * Apply an affection change to a player, clamping to [0, MAX_AFFECTION],
 * and check for newly unlocked milestones.
 * Returns the actual change applied and any newly unlocked milestones.
 */
export function applyAffection(
  player: PlayerState,
  characterId: string,
  change: number,
): { applied: number; newMilestones: number[] } {
  const before = player.affection[characterId] ?? 0;
  const after = Math.max(0, Math.min(MAX_AFFECTION, before + change));
  const applied = after - before;
  player.affection[characterId] = after;

  // Check milestones
  const existing = player.milestones[characterId] ?? [];
  const newMilestones: number[] = [];
  for (const threshold of MILESTONE_THRESHOLDS) {
    if (after >= threshold && before < threshold && !existing.includes(threshold)) {
      existing.push(threshold);
      newMilestones.push(threshold);
    }
  }
  player.milestones[characterId] = existing;

  return { applied, newMilestones };
}

/**
 * Apply affection change to ALL characters for a player.
 */
export function applyAffectionToAll(
  player: PlayerState,
  change: number,
): void {
  for (const char of CHARACTERS) {
    applyAffection(player, char.id, change);
  }
}

/**
 * Get total affection across all characters for a player.
 */
export function getTotalAffection(player: PlayerState): number {
  return Object.values(player.affection).reduce((sum, v) => sum + v, 0);
}

/**
 * Pick a random character ID.
 */
export function randomCharacterId(): string {
  return CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)].id;
}
