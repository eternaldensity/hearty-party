import type { GameEvent } from './types.js';

export interface GameEventEffect {
  event: GameEvent;
  /** Charm token change (positive = gain, negative = lose) */
  tokenChange: number;
  /** Affection change applied to a random character */
  affectionChange: number;
}

const EVENTS: GameEventEffect[] = [
  {
    event: { id: 'found_coin', description: 'You found a shiny coin on the ground!', scope: 'self' },
    tokenChange: 2,
    affectionChange: 0,
  },
  {
    event: { id: 'love_breeze', description: 'A warm breeze carries sweet words your way...', scope: 'self' },
    tokenChange: 0,
    affectionChange: 3,
  },
  {
    event: { id: 'tripped', description: 'You tripped in front of everyone! How embarrassing...', scope: 'self' },
    tokenChange: 0,
    affectionChange: -2,
  },
  {
    event: { id: 'flower_rain', description: 'Flower petals rain from the sky! Everyone feels the love.', scope: 'all' },
    tokenChange: 0,
    affectionChange: 2,
  },
  {
    event: { id: 'bonus_tokens', description: 'A mysterious benefactor gives everyone a gift!', scope: 'all' },
    tokenChange: 1,
    affectionChange: 0,
  },
  {
    event: { id: 'stolen_snack', description: "Someone ate another player's snack! They're not happy.", scope: 'random_other' },
    tokenChange: 0,
    affectionChange: -2,
  },
  {
    event: { id: 'secret_admirer', description: 'You receive a note from a secret admirer! +4 affection with a random character.', scope: 'self' },
    tokenChange: 0,
    affectionChange: 4,
  },
  {
    event: { id: 'lucky_day', description: "It's your lucky day! You find extra charm tokens.", scope: 'self' },
    tokenChange: 3,
    affectionChange: 0,
  },
  {
    event: { id: 'gossip', description: 'Someone spread gossip about you...', scope: 'self' },
    tokenChange: 0,
    affectionChange: -3,
  },
  {
    event: { id: 'group_photo', description: 'Everyone gathers for a group photo! Smiles all around.', scope: 'all' },
    tokenChange: 0,
    affectionChange: 1,
  },
  {
    event: { id: 'dropped_wallet', description: 'You dropped your wallet! Lost some tokens.', scope: 'self' },
    tokenChange: -2,
    affectionChange: 0,
  },
  {
    event: { id: 'dance_party', description: 'An impromptu dance party breaks out! Everyone has fun.', scope: 'all' },
    tokenChange: 0,
    affectionChange: 2,
  },
];

export function getRandomEvent(): GameEventEffect {
  return EVENTS[Math.floor(Math.random() * EVENTS.length)];
}
