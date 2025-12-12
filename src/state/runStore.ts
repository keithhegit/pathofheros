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
  map: { layer: number; node: number } | null;
  inventory: InventoryMap;
  skills: SkillData[];
};

type Actions = {
  setRun: (payload: Partial<RunSnapshot>) => void;
  reset: () => void;
  equipItem: (item: EquipmentData) => void;
  sellItem: (item: EquipmentData) => void;
  addGold: (amount: number) => void;
  setInventory: (inventory: InventoryMap) => void;
  learnSkill: (skill: SkillData) => void;
};

export const useRunStore = create<RunSnapshot & Actions>((set) => ({
  runId: null,
  playerId: null,
  userId: null,
  username: null,
  gold: 0,
  upgradeCost: 0,
  stats: Array(10).fill(0),
  map: null,
  inventory: createEmptyInventory(),
  skills: [],
  setRun: (payload) =>
    set((state) => ({
      ...state,
      ...payload,
      stats: payload.stats ? ensureStats(payload.stats) : state.stats,
      inventory: payload.inventory ? payload.inventory : state.inventory,
      skills: payload.skills ? payload.skills : state.skills
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
      map: null,
      inventory: createEmptyInventory(),
      skills: []
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
      if (state.skills.find((s) => s.id === skill.id)) return { skills: state.skills };
      return { skills: [...state.skills, skill] };
    })
}));

