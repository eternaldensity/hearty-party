// ── Game Phases ──

export type GamePhase =
  | 'lobby'
  | 'game_start'
  | 'round_start'
  | 'dice_phase'
  | 'move_phase'
  | 'space_phase'
  | 'minigame_intro'
  | 'minigame_play'
  | 'minigame_results'
  | 'round_end'
  | 'game_over';

// ── Board ──

export type SpaceType =
  | 'blank'
  | 'date_spot'
  | 'gift_shop'
  | 'event'
  | 'love_nest'
  | 'charm_fountain'
  | 'rival';

export interface BoardSpace {
  index: number;
  type: SpaceType;
  /** Which love interest lives here (love_nest spaces only) */
  characterId?: string;
  /** Indices of connected spaces (>1 at branch points) */
  next: number[];
}

export interface BranchPoint {
  /** Space index where the branch occurs */
  spaceIndex: number;
  /** How many spaces on the alternate path before rejoining */
  altPathLength: number;
  /** Space index where the alternate path rejoins the main loop */
  rejoinIndex: number;
}

export interface BoardState {
  spaces: BoardSpace[];
  branches: BranchPoint[];
}

// ── Items ──

export type ItemId =
  | 'love_letter'
  | 'bouquet'
  | 'dice_charm'
  | 'swap_scroll'
  | 'mirror'
  | 'shield_brooch'
  | 'heartbreaker_letter';

export interface ItemDef {
  id: ItemId;
  name: string;
  description: string;
  cost: number;
  /** Only available in cutthroat mode */
  cutthroatOnly: boolean;
}

export interface ItemInstance {
  id: ItemId;
  /** For items that target a character */
  targetCharacterId?: string;
}

// ── Characters ──

export interface CharacterDef {
  id: string;
  name: string;
  personality: string;
  color: string;
  likes: string[];
  dislikes: string[];
  /** Hidden weights for dialogue choice categories */
  preferences: Record<string, number>;
  /** Board space index of their Love Nest */
  homeSpace: number;
}

// ── Players ──

export interface PlayerState {
  id: string;
  name: string;
  isHost: boolean;
  connected: boolean;
  position: number;
  charmTokens: number;
  items: ItemInstance[];
  /** characterId → affection points (0-100) */
  affection: Record<string, number>;
  /** characterId → unlocked milestone thresholds */
  milestones: Record<string, number[]>;
  /** Has this player rolled the dice this phase? */
  hasRolled: boolean;
  /** Last dice roll value */
  lastRoll: number;
  /** Has a shield brooch active? */
  shielded: boolean;
}

// ── Game State ──

export interface GameSettings {
  totalRounds: number;
  cutthroatMode: boolean;
}

export interface GameState {
  id: string;
  code: string;
  phase: GamePhase;
  settings: GameSettings;
  board: BoardState;
  players: PlayerState[];
  currentRound: number;
  totalRounds: number;
  currentMinigameId: string | null;
  /** Index into players array: whose turn is being processed in move/space phase */
  activePlayerIndex: number;
}

// ── Minigames ──

export type MinigameType = 'action' | 'trivia' | 'strategy';

export interface MinigameDef {
  id: string;
  name: string;
  description: string;
  rules: string;
  duration: number;
  minPlayers: number;
  type: MinigameType;
}

export interface MinigameRanking {
  playerId: string;
  rank: number;
  score: number;
}

export interface MinigameReward {
  playerId: string;
  affection: number;
  charmTokens: number;
}

// ── Minigame Tick States (sent via minigame:tick sharedState) ──

export interface HeartCatcherHeart {
  id: string;
  characterId: string;
  x: number;       // 0-100 percentage across screen
  y: number;       // 0-100 percentage down screen
  spawnedAt: number;
  active: boolean;
}

export interface HeartCatcherTickState {
  hearts: HeartCatcherHeart[];
  scores: Record<string, number>;
}

export interface ScrambleTickState {
  roundIndex: number;
  totalRounds: number;
  scrambledWord: string;
  hint: string;
  wordLength: number;
  roundSolved: boolean;
  solvedBy: string | null;
  scores: Record<string, number>;
}

export interface SweetNothingsTickState {
  roundIndex: number;
  totalRounds: number;
  quote: string;
  options: Array<{ characterId: string; characterName: string }>;
  roundAnswered: boolean;
  correctCharacterId: string | null;
  scores: Record<string, number>;
}

// ── Perfect Match Tick State ──

export interface PerfectMatchCard {
  id: number;
  characterId: string;
  flipped: boolean;
  matched: boolean;
}

export interface PerfectMatchTickState {
  cards: PerfectMatchCard[];
  scores: Record<string, number>;
  currentFlipped: number[];  // indices of currently flipped (unmatched) cards
  lastMatchBy: string | null;
}

// ── Dance Floor Tick State ──

export type DanceDirection = 'up' | 'down' | 'left' | 'right';

export interface DanceFloorTickState {
  currentDirection: DanceDirection;
  beatIndex: number;
  totalBeats: number;
  beatActive: boolean;    // true while the current beat is accepting input
  scores: Record<string, number>;
  combos: Record<string, number>;
}

// ── Gift Wrap Race Tick State ──

export interface GiftWrapRaceTickState {
  progress: Record<string, number>;   // 0-100 per player
  finished: Record<string, boolean>;
  tapCounts: Record<string, number>;
}

// ── Compatibility Quiz Tick State ──

export interface CompatibilityQuizQuestion {
  question: string;
  options: Array<{ text: string; category: string }>;
}

export interface CompatibilityQuizTickState {
  roundIndex: number;
  totalRounds: number;
  question: CompatibilityQuizQuestion;
  targetCharacterId: string;
  targetCharacterName: string;
  roundAnswered: boolean;
  scores: Record<string, number>;
}

// ── Rose Garden Tick State ──

export interface RoseGardenCell {
  owner: string | null;  // playerId or null
}

export interface RoseGardenTickState {
  grid: RoseGardenCell[][];
  gridSize: number;
  roundIndex: number;
  totalRounds: number;
  currentPlayerId: string | null;
  scores: Record<string, number>;
  placed: Record<string, boolean>;  // who has placed this round
}

// ── Dialogue ──

export interface DialogueChoice {
  text: string;
  /** Category tag used to look up character preference weights */
  category: string;
}

export interface DialoguePrompt {
  characterId: string;
  text: string;
  choices: DialogueChoice[];
}

// ── Events ──

export interface GameEvent {
  id: string;
  description: string;
  /** Who it affects */
  scope: 'self' | 'all' | 'random_other';
}

// ── Room ──

export interface RoomState {
  code: string;
  players: Array<{ id: string; name: string; isHost: boolean; connected: boolean }>;
  settings: GameSettings;
  inGame: boolean;
}
