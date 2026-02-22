// ── Game Balance ──

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 8;
export const DEFAULT_ROUNDS = 15;
export const MAX_AFFECTION = 100;
export const CONFESSION_THRESHOLD = 100;

// ── Affection Gains ──

export const AFFECTION_DATE_SPOT_MIN = 3;
export const AFFECTION_DATE_SPOT_MAX = 8;
export const AFFECTION_LOVE_NEST_MIN = 5;
export const AFFECTION_LOVE_NEST_MAX = 10;
export const AFFECTION_MINIGAME_1ST = 5;
export const AFFECTION_MINIGAME_2ND = 3;
export const AFFECTION_MINIGAME_3RD = 2;
export const AFFECTION_MINIGAME_OTHER = 1;
export const AFFECTION_BAD_CHOICE_MIN = -2;
export const AFFECTION_BAD_CHOICE_MAX = -5;

// ── Cutthroat ──

export const CUTTHROAT_STEAL_AMOUNT = 5;
export const CUTTHROAT_HEARTBREAKER_AMOUNT = 8;
export const CUTTHROAT_JEALOUSY_LOSS = 2;

// ── Charm Tokens ──

export const CHARM_FOUNTAIN_AMOUNT = 2;
export const TOKENS_MINIGAME_1ST = 3;
export const TOKENS_MINIGAME_2ND = 2;
export const TOKENS_MINIGAME_3RD = 1;
export const TOKENS_MINIGAME_OTHER = 1;

// ── Milestones ──

export const MILESTONE_THRESHOLDS = [25, 50, 75] as const;

// ── Dice ──

export const DICE_MIN = 1;
export const DICE_MAX = 6;
export const DICE_AUTO_ROLL_MS = 3000;

// ── Timing ──

export const ROUND_START_DISPLAY_MS = 3000;
export const SPACE_EVENT_DISPLAY_MS = 5000;
export const MINIGAME_INTRO_MS = 5000;
export const MINIGAME_RESULTS_MS = 5000;
export const ROUND_END_DISPLAY_MS = 3000;
export const RECONNECT_GRACE_MS = 30000;

// ── Board ──

export const BOARD_SIZE = 30;

// ── Room Codes ──

export const ROOM_CODE_LENGTH = 4;
export const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';

// ── Space Colors ──

export const SPACE_COLORS: Record<string, string> = {
  blank: '#9CA3AF',
  date_spot: '#F472B6',
  gift_shop: '#FBBF24',
  event: '#A78BFA',
  love_nest: '#EF4444',
  charm_fountain: '#2DD4BF',
  rival: '#FB923C',
};
