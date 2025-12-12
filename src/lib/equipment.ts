import { statName } from "./stat";

export type SlotType = "Weapon" | "Armor" | "Helmet" | "Boots" | "Accessory" | "Ring" | "Offhand" | "Special";
export type Rarity = "Common" | "Uncommon" | "Rare" | "Epic";

export type EquipmentStat = {
  type: number;
  value: number;
};

export type EquipmentData = {
  id: string;
  name: string;
  slot: SlotType;
  rarity: Rarity;
  stats: EquipmentStat[];
  power: number;
  saleValue: number;
};

export const equipmentSlots: SlotType[] = [
  "Weapon",
  "Armor",
  "Helmet",
  "Boots",
  "Accessory",
  "Ring",
  "Offhand",
  "Special"
];

const rarityWeights: Record<Rarity, number> = {
  Common: 0.6,
  Uncommon: 0.25,
  Rare: 0.1,
  Epic: 0.05
};

const slotNames: Record<SlotType, string[]> = {
  Weapon: ["Iron Sword", "Steel Axe", "Storm Blade"],
  Armor: ["Leather Armor", "Chainmail", "Stoneplate"],
  Helmet: ["Steel Helm", "Hood of Insight", "Dragon Mask"],
  Boots: ["Swift Greaves", "Boots of Wind", "Earthen Treads"],
  Accessory: ["Amulet of Fury", "Pendant of Life", "Charm of Skill"],
  Ring: ["Ring of Vigor", "Loop of Sharpness", "Band of Shielding"],
  Offhand: ["Magic Tome", "Shield of Dawn", "Spirit Orb"],
  Special: ["Belt of Giants", "Cape of Shadows", "Talisman of Flux"]
};

const slotMainStat: Record<SlotType, number> = {
  Weapon: 0,
  Armor: 1,
  Helmet: 1,
  Boots: 2,
  Accessory: 4,
  Ring: 5,
  Offhand: 8,
  Special: 3
};

const rarityMultiplier: Record<Rarity, number> = {
  Common: 1,
  Uncommon: 1.4,
  Rare: 1.8,
  Epic: 2.4
};

export const generateEquipment = (slot?: SlotType): EquipmentData => {
  const pickSlot = slot || equipmentSlots[Math.floor(Math.random() * equipmentSlots.length)];
  const rarity = rollRarity();
  const namePool = slotNames[pickSlot];
  const name = `${namePool[Math.floor(Math.random() * namePool.length)]} (${rarity})`;
  const baseValue = 8 + Math.random() * 6;
  const stats: EquipmentStat[] = [];

  const primary = slotMainStat[pickSlot] ?? 0;
  stats.push({
    type: primary,
    value: Math.round((baseValue + Math.random() * 4) * rarityMultiplier[rarity])
  });

  const secondaryCount = Math.floor(Math.random() * 2) + 1;
  for (let i = 0; i < secondaryCount; i++) {
    const type = Math.floor(Math.random() * 10);
    stats.push({
      type,
      value: Math.round((Math.random() * 3 + 1) * rarityMultiplier[rarity])
    });
  }

  const power = stats.reduce((sum, stat) => sum + stat.value, 0);
  const saleValue = Math.max(10, Math.round(power * 5 * rarityMultiplier[rarity]));

  return {
    id: crypto.randomUUID(),
    name,
    slot: pickSlot,
    rarity,
    stats,
    power,
    saleValue
  };
};

export const rollRarity = (): Rarity => {
  const r = Math.random();
  let accumulator = 0;
  for (const [key, weight] of Object.entries(rarityWeights)) {
    accumulator += weight;
    if (r < accumulator) {
      return key as Rarity;
    }
  }
  return "Common";
};

export const formatStatLine = (stat: EquipmentStat, prefix?: string) => {
  const name = statName(stat.type);
  const label = `${name} ${prefix ?? ""}${stat.value}`;
  return label.trim();
};

