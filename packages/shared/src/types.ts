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
