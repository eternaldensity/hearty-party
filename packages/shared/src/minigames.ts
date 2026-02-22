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
  {
    id: 'perfect_match',
    name: 'Perfect Match',
    description: 'Find matching pairs of character icons!',
    rules: 'Flip cards to find matching pairs. Each pair you find scores a point. Most pairs wins!',
    duration: 40_000,
    minPlayers: 2,
    type: 'strategy',
  },
  {
    id: 'dance_floor',
    name: 'Dance Floor',
    description: 'Hit the right moves to the beat!',
    rules: 'Arrows appear on screen. Tap the matching direction while the beat is active. Accuracy and combos score points!',
    duration: 35_000,
    minPlayers: 2,
    type: 'action',
  },
  {
    id: 'gift_wrap_race',
    name: 'Gift Wrap Race',
    description: 'Tap as fast as you can to wrap the gift!',
    rules: 'Tap the button repeatedly to fill your wrapping bar. First to 100% wins!',
    duration: 25_000,
    minPlayers: 2,
    type: 'action',
  },
  {
    id: 'compatibility_quiz',
    name: 'Compatibility Quiz',
    description: 'How well do you know the characters?',
    rules: '5 personality questions. Pick the answer that matches the target character\'s preferences. Higher preference weight = more points!',
    duration: 60_000,
    minPlayers: 2,
    type: 'trivia',
  },
  {
    id: 'rose_garden',
    name: 'Rose Garden',
    description: 'Grow your garden and claim territory!',
    rules: 'Take turns placing roses on a grid. After each round, your roses spread to empty adjacent cells. Most roses at the end wins!',
    duration: 45_000,
    minPlayers: 2,
    type: 'strategy',
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

// ── Compatibility Quiz: Question Pool ──

export interface QuizQuestion {
  question: string;
  options: Array<{ text: string; category: string }>;
}

export const COMPAT_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question: 'Your date suggests an activity. What do you pick?',
    options: [
      { text: 'A quiet evening reading poetry together', category: 'thoughtful' },
      { text: 'Skydiving — no hesitation!', category: 'bold' },
      { text: 'A comedy show to laugh until you cry', category: 'funny' },
    ],
  },
  {
    question: 'You want to impress someone. How do you do it?',
    options: [
      { text: 'Write them a heartfelt letter', category: 'kind' },
      { text: 'Arrive in a stunning outfit', category: 'flashy' },
      { text: 'Create a painting or song for them', category: 'creative' },
    ],
  },
  {
    question: 'A friend is upset. What do you do?',
    options: [
      { text: 'Sit with them and listen patiently', category: 'patient' },
      { text: 'Tell jokes to cheer them up', category: 'funny' },
      { text: 'Take them on an adventure to forget', category: 'bold' },
    ],
  },
  {
    question: 'What kind of gift do you give?',
    options: [
      { text: 'Something handmade and personal', category: 'creative' },
      { text: 'The most expensive thing you can find', category: 'flashy' },
      { text: 'Something practical they mentioned needing', category: 'thoughtful' },
    ],
  },
  {
    question: 'How do you handle a disagreement?',
    options: [
      { text: 'Talk it out calmly and find common ground', category: 'patient' },
      { text: 'Stand your ground — you know you\'re right', category: 'competitive' },
      { text: 'Apologize with a kind gesture', category: 'kind' },
    ],
  },
  {
    question: 'Your ideal weekend looks like:',
    options: [
      { text: 'A challenging hike or competition', category: 'competitive' },
      { text: 'A cozy day baking and sharing with friends', category: 'kind' },
      { text: 'Visiting a gallery or making art', category: 'creative' },
    ],
  },
  {
    question: 'At a party, you\'re the one who:',
    options: [
      { text: 'Makes a grand, memorable entrance', category: 'flashy' },
      { text: 'Gets everyone laughing with stories', category: 'funny' },
      { text: 'Checks on the quiet person in the corner', category: 'thoughtful' },
    ],
  },
  {
    question: 'Your love language is:',
    options: [
      { text: 'Acts of service — doing things to help', category: 'kind' },
      { text: 'Quality time — just being together, no rush', category: 'patient' },
      { text: 'Words of affirmation — bold compliments', category: 'bold' },
    ],
  },
  {
    question: 'Pick a date night movie:',
    options: [
      { text: 'An action-packed thriller', category: 'bold' },
      { text: 'A beautifully animated art film', category: 'creative' },
      { text: 'A slapstick comedy', category: 'funny' },
    ],
  },
  {
    question: 'Someone challenges you to a contest. You:',
    options: [
      { text: 'Accept immediately — game on!', category: 'competitive' },
      { text: 'Suggest something creative instead', category: 'creative' },
      { text: 'Let them win — it\'s just a game', category: 'patient' },
    ],
  },
];

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
