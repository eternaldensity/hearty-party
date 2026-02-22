import type { MinigameDef } from './types.js';

// ── Minigame Definitions ──

export const MINIGAME_DEFS: MinigameDef[] = [
  {
    id: 'heart_catcher',
    name: 'Heart Catcher',
    description: 'Catch falling hearts! Different colors for different characters.',
    rules: 'Tap hearts as they fall. Each catch = 1 point. Most catches wins!',
    duration: 30_000,
    minPlayers: 2,
    type: 'action',
  },
  {
    id: 'love_letter_scramble',
    name: 'Love Letter Scramble',
    description: 'Unscramble romantic words to win hearts!',
    rules: '5 rounds of scrambled words. First correct answer scores most. Type the unscrambled word and submit.',
    duration: 45_000,
    minPlayers: 2,
    type: 'trivia',
  },
  {
    id: 'sweet_nothings',
    name: 'Sweet Nothings',
    description: 'Who said that? Match quotes to characters!',
    rules: '5 rounds of quotes. Pick which character said it. Fastest correct answer wins the most points.',
    duration: 30_000,
    minPlayers: 2,
    type: 'trivia',
  },
];

export function getMinigameDef(id: string): MinigameDef | undefined {
  return MINIGAME_DEFS.find((m) => m.id === id);
}

export function getRandomMinigameDef(minPlayers: number): MinigameDef {
  const eligible = MINIGAME_DEFS.filter((m) => m.minPlayers <= minPlayers);
  return eligible[Math.floor(Math.random() * eligible.length)];
}

// ── Love Letter Scramble: Word Pool ──

export const SCRAMBLE_WORDS: Array<{ word: string; hint: string }> = [
  { word: 'ROMANCE', hint: 'A love affair' },
  { word: 'SWEETHEART', hint: 'A term of endearment' },
  { word: 'PASSION', hint: 'Intense emotion' },
  { word: 'DARLING', hint: 'A beloved person' },
  { word: 'SERENADE', hint: 'A musical tribute' },
  { word: 'BLOSSOM', hint: 'To flower or flourish' },
  { word: 'DEVOTION', hint: 'Loyal love' },
  { word: 'CHERISH', hint: 'To hold dear' },
  { word: 'ADORE', hint: 'To love deeply' },
  { word: 'EMBRACE', hint: 'To hold close' },
  { word: 'AMOUR', hint: 'French for love' },
  { word: 'DESIRE', hint: 'A strong wish' },
  { word: 'TENDER', hint: 'Gentle and caring' },
  { word: 'FLUTTER', hint: 'A rapid heartbeat' },
  { word: 'BELOVED', hint: 'Dearly loved' },
];

export function scrambleWord(word: string): string {
  const chars = word.split('');
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  const scrambled = chars.join('');
  return scrambled === word ? scrambleWord(word) : scrambled;
}

// ── Sweet Nothings: Quote Pool ──

export interface QuoteRound {
  quote: string;
  correctCharacterId: string;
  options: string[];
}

export const SWEET_NOTHINGS_QUOTES: QuoteRound[] = [
  { quote: "Shall I compare thee to a summer's day?", correctCharacterId: 'sable', options: ['sable', 'lux', 'pip'] },
  { quote: 'Life is too short to walk when you can run!', correctCharacterId: 'dash', options: ['dash', 'elm', 'sable'] },
  { quote: 'Darling, fabulous is not a choice. It\'s a lifestyle.', correctCharacterId: 'lux', options: ['lux', 'pip', 'dash'] },
  { quote: 'The quietest moments hold the deepest truths.', correctCharacterId: 'elm', options: ['elm', 'sable', 'lux'] },
  { quote: 'You know what makes everything better? A hug and a cupcake!', correctCharacterId: 'pip', options: ['pip', 'dash', 'elm'] },
  { quote: 'A well-worn book is a well-loved friend.', correctCharacterId: 'sable', options: ['sable', 'elm', 'pip'] },
  { quote: 'First one to the top wins bragging rights forever!', correctCharacterId: 'dash', options: ['dash', 'lux', 'sable'] },
  { quote: "If you're not making an entrance, what's the point of showing up?", correctCharacterId: 'lux', options: ['lux', 'dash', 'elm'] },
  { quote: 'I painted this for you. It\'s the sky the way I see it.', correctCharacterId: 'elm', options: ['elm', 'pip', 'lux'] },
  { quote: "I tried to bake you cookies. Some are a little burnt. Most are a little burnt.", correctCharacterId: 'pip', options: ['pip', 'sable', 'dash'] },
  { quote: "Every story deserves a beautiful ending, don't you think?", correctCharacterId: 'sable', options: ['sable', 'lux', 'elm'] },
  { quote: 'Catch me if you can!', correctCharacterId: 'dash', options: ['dash', 'pip', 'sable'] },
  { quote: 'A room without drama is just a room.', correctCharacterId: 'lux', options: ['lux', 'sable', 'pip'] },
  { quote: 'Listen. Do you hear the rain? It sounds like a lullaby.', correctCharacterId: 'elm', options: ['elm', 'dash', 'lux'] },
  { quote: "Hey! Watch this! ...okay that didn't go as planned but WATCH AGAIN!", correctCharacterId: 'pip', options: ['pip', 'dash', 'elm'] },
];
