import type { DialoguePrompt } from './types.js';

/**
 * Dialogue pools per character. Each prompt has 3 choices with category tags
 * that map to the character's preference weights for affection calculation.
 */

const SABLE_DIALOGUES: DialoguePrompt[] = [
  {
    characterId: 'sable',
    text: "Sable is reading quietly by a window. She looks up and smiles. \"Oh! Would you like to sit with me?\"",
    choices: [
      { text: "I'd love to. What are you reading?", category: 'thoughtful' },
      { text: "Only if you read to me out loud!", category: 'bold' },
      { text: "Sure! I brought snacks to share.", category: 'kind' },
    ],
  },
  {
    characterId: 'sable',
    text: "Sable found a stray kitten and is gently caring for it. \"Isn't it precious?\"",
    choices: [
      { text: "Let me help. I'll find it some warm milk.", category: 'kind' },
      { text: "You should name it! How about 'Moonbeam'?", category: 'creative' },
      { text: "Look how cute you two are together!", category: 'flashy' },
    ],
  },
  {
    characterId: 'sable',
    text: "\"I've been trying to write a poem, but I'm stuck on the last line...\"",
    choices: [
      { text: "Read it to me \u2014 maybe we can figure it out together.", category: 'patient' },
      { text: "How about ending with something unexpected?", category: 'creative' },
      { text: "Just finish it already! I bet it's great!", category: 'competitive' },
    ],
  },
  {
    characterId: 'sable',
    text: "Sable is organizing a small community library. \"Would you like to help sort these books?\"",
    choices: [
      { text: "Absolutely! I love getting things organized.", category: 'thoughtful' },
      { text: "Only if we race to see who finishes first!", category: 'competitive' },
      { text: "I'll help, and maybe we can swap book recommendations after.", category: 'kind' },
    ],
  },
];

const DASH_DIALOGUES: DialoguePrompt[] = [
  {
    characterId: 'dash',
    text: "Dash is stretching before a jog. \"Hey! Wanna race me to the fountain and back?\"",
    choices: [
      { text: "You're on! Don't cry when I win!", category: 'competitive' },
      { text: "I'll cheer you on from here, speed demon.", category: 'patient' },
      { text: "Race? How about a dance-off instead?", category: 'creative' },
    ],
  },
  {
    characterId: 'dash',
    text: "\"I'm planning a surprise adventure for everyone. Want to help me set it up?\"",
    choices: [
      { text: "Let's make it the wildest one yet!", category: 'bold' },
      { text: "Sure! I'll handle the decorations.", category: 'creative' },
      { text: "Maybe we should plan carefully first...", category: 'patient' },
    ],
  },
  {
    characterId: 'dash',
    text: "Dash just finished rock climbing and is pumped. \"That was AMAZING! You've gotta try it!\"",
    choices: [
      { text: "Show me the way \u2014 I'm not scared of heights!", category: 'bold' },
      { text: "That sounds terrifying, but... okay, let's do it.", category: 'funny' },
      { text: "I'd rather watch. You look great up there though!", category: 'flashy' },
    ],
  },
  {
    characterId: 'dash',
    text: "\"I can't decide between skydiving or surfing this weekend. What do you think?\"",
    choices: [
      { text: "Both! One in the morning, one in the afternoon!", category: 'bold' },
      { text: "Whichever one lets me see you wipe out.", category: 'funny' },
      { text: "How about something calmer, like a picnic?", category: 'thoughtful' },
    ],
  },
];

const LUX_DIALOGUES: DialoguePrompt[] = [
  {
    characterId: 'lux',
    text: "Lux twirls in a new outfit. \"Well? Tell me I look absolutely stunning. Because I do.\"",
    choices: [
      { text: "You're the most dazzling person in any room.", category: 'flashy' },
      { text: "The outfit's nice, but you make it look even better.", category: 'bold' },
      { text: "It's... fine, I guess?", category: 'patient' },
    ],
  },
  {
    characterId: 'lux',
    text: "\"I'm throwing a little soiree tonight. Very exclusive. You might be invited... if you impress me.\"",
    choices: [
      { text: "I'll bring champagne and my best dance moves.", category: 'flashy' },
      { text: "What if I wrote a song about you instead?", category: 'creative' },
      { text: "Sounds fun! Can I bring my friends too?", category: 'kind' },
    ],
  },
  {
    characterId: 'lux',
    text: "Lux sighs dramatically. \"Nobody understands my vision. I'm an artist, a visionary!\"",
    choices: [
      { text: "Your taste is impeccable. Teach me your ways!", category: 'flashy' },
      { text: "I bet your vision involves sequins. Am I right?", category: 'funny' },
      { text: "I'd love to hear about it \u2014 really.", category: 'thoughtful' },
    ],
  },
  {
    characterId: 'lux',
    text: "\"I need someone to judge a fashion contest with me. Think you can handle it?\"",
    choices: [
      { text: "I was born for this. Let's be ruthless.", category: 'competitive' },
      { text: "As long as everyone has fun, I'm in!", category: 'kind' },
      { text: "Only if I get to wear something fabulous too.", category: 'bold' },
    ],
  },
];

const ELM_DIALOGUES: DialoguePrompt[] = [
  {
    characterId: 'elm',
    text: "Elm is painting a landscape in silence. They notice you watching and offer a spare brush.",
    choices: [
      { text: "...", category: 'patient' },
      { text: "I'll paint something just for you.", category: 'creative' },
      { text: "Wow, look at all these colors! This is AMAZING!", category: 'flashy' },
    ],
  },
  {
    characterId: 'elm',
    text: "\"I found a hidden garden behind the old wall. The flowers bloom only at dusk...\"",
    choices: [
      { text: "Show me. I promise to be quiet.", category: 'patient' },
      { text: "That's beautiful. Can we press some flowers to keep?", category: 'creative' },
      { text: "Let's tell everyone! They'd love to see it!", category: 'flashy' },
    ],
  },
  {
    characterId: 'elm',
    text: "Elm is sitting in a tree, gazing at clouds. \"That one looks like a sleeping fox, don't you think?\"",
    choices: [
      { text: "It does. And that one looks like a sailboat.", category: 'patient' },
      { text: "Let me draw what I see \u2014 a dragon chasing a star.", category: 'creative' },
      { text: "Come down! I want to show you something cool!", category: 'bold' },
    ],
  },
  {
    characterId: 'elm',
    text: "\"I made this ceramic bowl. It's not perfect, but...\"",
    choices: [
      { text: "The imperfections are what make it beautiful.", category: 'thoughtful' },
      { text: "You're really talented. Keep going.", category: 'kind' },
      { text: "I could probably make a better one, honestly.", category: 'competitive' },
    ],
  },
];

const PIP_DIALOGUES: DialoguePrompt[] = [
  {
    characterId: 'pip',
    text: "Pip runs up to you with a goofy grin. \"I just made the world's biggest sandwich! Want half?\"",
    choices: [
      { text: "Only if it has extra pickles!", category: 'funny' },
      { text: "That's so sweet of you! Absolutely!", category: 'kind' },
      { text: "A sandwich? That's not exactly impressive...", category: 'competitive' },
    ],
  },
  {
    characterId: 'pip',
    text: "\"I'm trying to learn to juggle but I keep dropping everything! Watch!\" *drops everything*",
    choices: [
      { text: "*claps* Encore! That was the best drop I've ever seen!", category: 'funny' },
      { text: "Here, let me show you \u2014 start with just two.", category: 'kind' },
      { text: "Maybe try something you're actually good at?", category: 'competitive' },
    ],
  },
  {
    characterId: 'pip',
    text: "Pip is drawing a comic strip about everyone. \"Look, I drew you as a superhero!\"",
    choices: [
      { text: "I love it! Give me a silly catchphrase!", category: 'funny' },
      { text: "That's adorable. You're really creative, Pip.", category: 'kind' },
      { text: "Make me look cooler \u2014 bigger muscles!", category: 'flashy' },
    ],
  },
  {
    characterId: 'pip',
    text: "\"I found a four-leaf clover! Do you think it's really lucky?\"",
    choices: [
      { text: "It brought you to me, so I'd say yes!", category: 'bold' },
      { text: "Keep it safe! We'll test it together.", category: 'kind' },
      { text: "Luck isn't real, but the thought is sweet.", category: 'thoughtful' },
    ],
  },
];

const ALL_DIALOGUES: Record<string, DialoguePrompt[]> = {
  sable: SABLE_DIALOGUES,
  dash: DASH_DIALOGUES,
  lux: LUX_DIALOGUES,
  elm: ELM_DIALOGUES,
  pip: PIP_DIALOGUES,
};

/** Get a random dialogue prompt for a specific character. */
export function getRandomDialogue(characterId: string): DialoguePrompt | undefined {
  const pool = ALL_DIALOGUES[characterId];
  if (!pool || pool.length === 0) return undefined;
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Get a random dialogue prompt from any character. */
export function getRandomCharacterDialogue(): DialoguePrompt | undefined {
  const characterIds = Object.keys(ALL_DIALOGUES);
  const charId = characterIds[Math.floor(Math.random() * characterIds.length)];
  return getRandomDialogue(charId);
}
