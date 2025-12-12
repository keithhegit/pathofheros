import { create } from "zustand";
import {
  equipmentSlots,
  EquipmentData,
  EquipmentStat,
  SlotType
} from "../lib/equipment";
import type { SkillData } from "../lib/skills";

export type StatArray = number[];

export type InventoryMap = Record<SlotType, EquipmentData | null>;
export type TimedChestRarity = "Common" | "Uncommon" | "Rare";

export type TimedChestSlot = {
  id: string;
  rarity: TimedChestRarity;
  unlockEndsAt: number; // ms timestamp
  createdAt: number; // ms timestamp
};

const createEmptyInventory = (): InventoryMap =>
  equipmentSlots.reduce<InventoryMap>((acc, slot) => {
    acc[slot] = null;
    return acc;
  }, {} as InventoryMap);

const ensureStats = (stats?: StatArray): StatArray => {
  const result = stats ? [...stats] : Array(10).fill(0);
  while (result.length < 10) result.push(0);
  return result;
};

const applyDeltas = (base: StatArray, deltas: EquipmentStat[]) => {
  const next = [...base];
  deltas.forEach((delta) => {
    next[delta.type] = (next[delta.type] || 0) + delta.value;
  });
  return next;
};

type RunSnapshot = {
  runId: string | null;
  playerId: string | null;
  userId: string | null;
  username: string | null;
  gold: number;
  upgradeCost: number;
  stats: StatArray;
  currentHp: number;
  map: { layer: number; node: number } | null;
  inventory: InventoryMap;
  skills: SkillData[];
  chestSlots: Array<TimedChestSlot | null>;
};

type Actions = {
  setRun: (payload: Partial<RunSnapshot>) => void;
  reset: () => void;
  resetRunProgress: () => void;
  setCurrentHp: (hp: number) => void;
  setChestSlots: (slots: Array<TimedChestSlot | null>) => void;
  addTimedChest: (chest: TimedChestSlot) => boolean;
  removeTimedChestAt: (index: number) => void;
  equipItem: (item: EquipmentData) => void;
  sellItem: (item: EquipmentData) => void;
  addGold: (amount: number) => void;
  setInventory: (inventory: InventoryMap) => void;
  learnSkill: (skill: SkillData) => void;
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export const useRunStore = create<RunSnapshot & Actions>((set) => ({
  runId: null,
  playerId: null,
  userId: null,
  username: null,
  gold: 0,
  upgradeCost: 0,
  stats: Array(10).fill(0),
  currentHp: 0,
  map: null,
  inventory: createEmptyInventory(),
  skills: [],
  chestSlots: [null, null, null],
  setRun: (payload) =>
    set((state) => ({
      ...state,
      ...payload,
      stats: payload.stats ? ensureStats(payload.stats) : state.stats,
      inventory: payload.inventory ? payload.inventory : state.inventory,
      skills: payload.skills ? payload.skills : state.skills,
      currentHp: (() => {
        const nextStats = payload.stats ? ensureStats(payload.stats) : state.stats;
        const maxHp = Math.max(1, nextStats?.[1] ?? 100);
        const incoming = payload.currentHp ?? state.currentHp ?? maxHp;
        return clamp(incoming, 0, maxHp);
      })()
    })),
  reset: () =>
    set({
      runId: null,
      playerId: null,
      userId: null,
      username: null,
      gold: 0,
      upgradeCost: 0,
      stats: Array(10).fill(0),
      currentHp: 0,
      map: null,
      inventory: createEmptyInventory(),
      skills: [],
      chestSlots: [null, null, null]
    }),
  resetRunProgress: () =>
    set((state) => ({
      runId: null,
      playerId: null,
      gold: 0,
      upgradeCost: 0,
      stats: Array(10).fill(0),
      currentHp: 0,
      map: null,
      inventory: createEmptyInventory(),
      skills: [],
      // 宝箱计时属于账号资产：登出/切换 run 也应继续计时
      chestSlots: state.chestSlots,
      userId: state.userId,
      username: state.username
    })),
  setCurrentHp: (hp) =>
    set((state) => {
      const maxHp = Math.max(1, state.stats?.[1] ?? 100);
      return { currentHp: clamp(hp, 0, maxHp) };
    }),
  setChestSlots: (slots) =>
    set(() => ({
      chestSlots: slots.length === 3 ? slots : [slots[0] ?? null, slots[1] ?? null, slots[2] ?? null]
    })),
  addTimedChest: (chest) => {
    let placed = false;
    set((state) => {
      const slots = [...state.chestSlots];
      const idx = slots.findIndex((s) => !s);
      if (idx === -1) return { chestSlots: slots };
      slots[idx] = chest;
      placed = true;
      return { chestSlots: slots };
    });
    return placed;
  },
  removeTimedChestAt: (index) =>
    set((state) => {
      const slots = [...state.chestSlots];
      if (index < 0 || index >= slots.length) return { chestSlots: slots };
      slots[index] = null;
      return { chestSlots: slots };
    }),
  equipItem: (item) =>
    set((state) => {
      const existing = state.inventory[item.slot];
      let stats = [...state.stats];
      if (existing) {
        const negative = existing.stats.map((stat) => ({
          type: stat.type,
          value: -stat.value
        }));
        stats = applyDeltas(stats, negative);
      }
      stats = applyDeltas(stats, item.stats);
      return {
        stats,
        inventory: { ...state.inventory, [item.slot]: item }
      };
    }),
  sellItem: (item) =>
    set((state) => ({
      gold: state.gold + item.saleValue
    })),
  addGold: (amount) =>
    set((state) => ({
      gold: state.gold + amount
    })),
  setInventory: (inventory) => set({ inventory }),
  learnSkill: (skill) =>
    set((state) => {
      const existing = state.skills.find((s) => s.id === skill.id);
      if (!existing) return { skills: [...state.skills, skill] };
      if ((existing.level ?? 1) >= (skill.level ?? 1)) return { skills: state.skills };
      return {
        skills: state.skills.map((s) => (s.id === skill.id ? skill : s))
      };
    })
}));

