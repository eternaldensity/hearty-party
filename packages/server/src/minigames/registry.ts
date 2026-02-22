import type { MinigameServer } from './MinigameServer.js';
import { getRandomMinigameDef } from '@hearty-party/shared';
import { HeartCatcherServer } from './HeartCatcherServer.js';
import { LoveLetterScrambleServer } from './LoveLetterScrambleServer.js';
import { SweetNothingsServer } from './SweetNothingsServer.js';

type MinigameFactory = () => MinigameServer;

const REGISTRY: Record<string, MinigameFactory> = {
  heart_catcher: () => new HeartCatcherServer(),
  love_letter_scramble: () => new LoveLetterScrambleServer(),
  sweet_nothings: () => new SweetNothingsServer(),
};

/** Create a random eligible minigame instance. */
export function createMinigame(playerCount: number): MinigameServer {
  const def = getRandomMinigameDef(playerCount);
  const factory = REGISTRY[def.id];
  if (!factory) throw new Error(`No server implementation for minigame: ${def.id}`);
  return factory();
}
