import type { PlayerState, ItemId } from '@hearty-party/shared';
import { getItem, getShopItems, CHARACTERS, CUTTHROAT_HEARTBREAKER_AMOUNT } from '@hearty-party/shared';
import { applyAffection, applyAffectionToAll } from './AffectionSystem.js';

export interface ItemUseResult {
  success: boolean;
  error?: string;
  description?: string;
}

/**
 * Attempt to buy an item from the shop.
 */
export function buyItem(
  player: PlayerState,
  itemId: ItemId,
  cutthroatMode: boolean,
): { success: boolean; error?: string } {
  const itemDef = getItem(itemId);
  if (!itemDef) return { success: false, error: 'Item not found' };
  if (itemDef.cutthroatOnly && !cutthroatMode) {
    return { success: false, error: 'This item is only available in Cutthroat Mode' };
  }
  if (player.charmTokens < itemDef.cost) {
    return { success: false, error: `Not enough tokens (need ${itemDef.cost}, have ${player.charmTokens})` };
  }

  player.charmTokens -= itemDef.cost;
  player.items.push({ id: itemId });
  return { success: true };
}

/**
 * Use a Love Letter item: +5 affection with a chosen character.
 */
export function useLoveLetter(
  player: PlayerState,
  targetCharacterId: string,
): ItemUseResult {
  const idx = player.items.findIndex((i) => i.id === 'love_letter');
  if (idx === -1) return { success: false, error: "You don't have a Love Letter" };
  if (!CHARACTERS.find((c) => c.id === targetCharacterId)) {
    return { success: false, error: 'Invalid character' };
  }

  player.items.splice(idx, 1);
  const { applied } = applyAffection(player, targetCharacterId, 5);
  return {
    success: true,
    description: `Love Letter sent! +${applied} affection with ${targetCharacterId}`,
  };
}

/**
 * Use a Bouquet item: +3 affection with ALL characters.
 */
export function useBouquet(player: PlayerState): ItemUseResult {
  const idx = player.items.findIndex((i) => i.id === 'bouquet');
  if (idx === -1) return { success: false, error: "You don't have a Bouquet" };

  player.items.splice(idx, 1);
  applyAffectionToAll(player, 3);
  return {
    success: true,
    description: 'Bouquet presented! +3 affection with all characters',
  };
}

/**
 * Use a Dice Charm: player picks their next roll value (handled in GameStateMachine).
 * This just validates and removes the item.
 */
export function useDiceCharm(player: PlayerState): ItemUseResult {
  const idx = player.items.findIndex((i) => i.id === 'dice_charm');
  if (idx === -1) return { success: false, error: "You don't have a Dice Charm" };

  player.items.splice(idx, 1);
  return { success: true, description: 'Dice Charm activated! Choose your next roll.' };
}

/**
 * Use a Swap Scroll: swap positions with another player.
 */
export function useSwapScroll(
  player: PlayerState,
  target: PlayerState,
): ItemUseResult {
  const idx = player.items.findIndex((i) => i.id === 'swap_scroll');
  if (idx === -1) return { success: false, error: "You don't have a Swap Scroll" };

  player.items.splice(idx, 1);
  const temp = player.position;
  player.position = target.position;
  target.position = temp;
  return {
    success: true,
    description: `Swapped positions with ${target.name}!`,
  };
}

/**
 * Use a Shield Brooch: activate shield status.
 */
export function useShieldBrooch(player: PlayerState): ItemUseResult {
  const idx = player.items.findIndex((i) => i.id === 'shield_brooch');
  if (idx === -1) return { success: false, error: "You don't have a Shield Brooch" };

  player.items.splice(idx, 1);
  player.shielded = true;
  return { success: true, description: 'Shield Brooch activated! Next negative effect will be blocked.' };
}

/**
 * Use a Mirror: copy another player's last affection gain.
 * The `lastGain` param must be tracked by the game state machine.
 */
export function useMirror(
  player: PlayerState,
  targetCharacterId: string,
  lastGainAmount: number,
): ItemUseResult {
  const idx = player.items.findIndex((i) => i.id === 'mirror');
  if (idx === -1) return { success: false, error: "You don't have a Mirror" };

  player.items.splice(idx, 1);
  const gain = Math.max(0, lastGainAmount);
  const { applied } = applyAffection(player, targetCharacterId, gain);
  return {
    success: true,
    description: `Mirror used! Copied +${applied} affection with ${targetCharacterId}`,
  };
}

/**
 * Use a Heartbreaker Letter (cutthroat only): reduce a rival's affection.
 */
export function useHeartbreakerLetter(
  player: PlayerState,
  target: PlayerState,
  targetCharacterId: string,
): ItemUseResult {
  const idx = player.items.findIndex((i) => i.id === 'heartbreaker_letter');
  if (idx === -1) return { success: false, error: "You don't have a Heartbreaker Letter" };

  player.items.splice(idx, 1);

  // Check if target is shielded
  if (target.shielded) {
    target.shielded = false;
    return {
      success: true,
      description: `${target.name}'s Shield Brooch blocked the Heartbreaker Letter!`,
    };
  }

  applyAffection(target, targetCharacterId, -CUTTHROAT_HEARTBREAKER_AMOUNT);
  return {
    success: true,
    description: `Heartbreaker Letter sent! ${target.name} lost ${CUTTHROAT_HEARTBREAKER_AMOUNT} affection with ${targetCharacterId}`,
  };
}
