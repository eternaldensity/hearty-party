import type { ItemDef } from './types.js';

export const ITEMS: ItemDef[] = [
  {
    id: 'love_letter',
    name: 'Love Letter',
    description: '+5 affection with a chosen character',
    cost: 3,
    cutthroatOnly: false,
  },
  {
    id: 'bouquet',
    name: 'Bouquet',
    description: '+3 affection with ALL characters',
    cost: 5,
    cutthroatOnly: false,
  },
  {
    id: 'dice_charm',
    name: 'Dice Charm',
    description: 'Choose any number 1-6 on your next roll',
    cost: 3,
    cutthroatOnly: false,
  },
  {
    id: 'swap_scroll',
    name: 'Swap Scroll',
    description: 'Swap board position with another player',
    cost: 4,
    cutthroatOnly: false,
  },
  {
    id: 'mirror',
    name: 'Mirror',
    description: "Copy another player's last affection gain",
    cost: 6,
    cutthroatOnly: false,
  },
  {
    id: 'shield_brooch',
    name: 'Shield Brooch',
    description: 'Block the next negative effect targeting you',
    cost: 4,
    cutthroatOnly: false,
  },
  {
    id: 'heartbreaker_letter',
    name: 'Heartbreaker Letter',
    description: "Reduce a rival's affection with one character by 8",
    cost: 5,
    cutthroatOnly: true,
  },
];

export function getItem(id: string): ItemDef | undefined {
  return ITEMS.find((item) => item.id === id);
}

export function getShopItems(cutthroatMode: boolean): ItemDef[] {
  if (cutthroatMode) return ITEMS;
  return ITEMS.filter((item) => !item.cutthroatOnly);
}
