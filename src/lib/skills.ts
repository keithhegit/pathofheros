export type SkillType = "Attack" | "Defense" | "Utility";

export type SkillData = {
  id: number;
  name: string;
  desc: string;
  effect: string;
  type: SkillType;
  level: number;
  maxLevel: number;
};

type SkillDefinition = {
  id: number;
  name: string;
  type: SkillType;
  baseDesc: string;
  effectByLevel: [string, string, string, string, string];
};

const MAX_LEVEL = 5 as const;

const SkillDefinitions: SkillDefinition[] = [
  {
    id: 101,
    name: "雷霆突刺",
    type: "Attack",
    baseDesc: "攻击时有概率触发雷霆爆炸，造成额外伤害。",
    effectByLevel: [
      "触发率 12% · 额外伤害 +8",
      "触发率 16% · 额外伤害 +12",
      "触发率 20% · 额外伤害 +16",
      "触发率 24% · 额外伤害 +20",
      "触发率 28% · 额外伤害 +24"
    ]
  },
  {
    id: 102,
    name: "吸血打击",
    type: "Utility",
    baseDesc: "每次命中后吸取生命，提升续航。",
    effectByLevel: [
      "每次命中回复最大生命 2%",
      "每次命中回复最大生命 3%",
      "每次命中回复最大生命 4%",
      "每次命中回复最大生命 5%",
      "每次命中回复最大生命 6%"
    ]
  },
  {
    id: 103,
    name: "铁壁姿态",
    type: "Defense",
    baseDesc: "受击时短暂强化防御，降低下一次受到的伤害。",
    effectByLevel: [
      "受击后获得护甲 +6（短暂）",
      "受击后获得护甲 +9（短暂）",
      "受击后获得护甲 +12（短暂）",
      "受击后获得护甲 +15（短暂）",
      "受击后获得护甲 +18（短暂）"
    ]
  },
  {
    id: 104,
    name: "敏捷步伐",
    type: "Utility",
    baseDesc: "提高攻速，让输出更连贯。",
    effectByLevel: [
      "攻速 +6%",
      "攻速 +8%",
      "攻速 +10%",
      "攻速 +12%",
      "攻速 +14%"
    ]
  },
  {
    id: 105,
    name: "爆裂利刃",
    type: "Attack",
    baseDesc: "普通攻击附带溅射伤害，对群体更有效。",
    effectByLevel: [
      "溅射伤害 +10",
      "溅射伤害 +14",
      "溅射伤害 +18",
      "溅射伤害 +22",
      "溅射伤害 +26"
    ]
  },
  {
    id: 106,
    name: "再生庇护",
    type: "Defense",
    baseDesc: "战斗中持续恢复生命。",
    effectByLevel: [
      "每 5 秒恢复 10 HP",
      "每 5 秒恢复 14 HP",
      "每 5 秒恢复 18 HP",
      "每 5 秒恢复 22 HP",
      "每 5 秒恢复 26 HP"
    ]
  }
];

const clampLevel = (level: number) => Math.max(1, Math.min(MAX_LEVEL, Math.floor(level)));

export const toSkillData = (id: number, level: number): SkillData | null => {
  const def = SkillDefinitions.find((d) => d.id === id);
  if (!def) return null;
  const lv = clampLevel(level);
  return {
    id: def.id,
    name: def.name,
    type: def.type,
    level: lv,
    maxLevel: MAX_LEVEL,
    desc: def.baseDesc,
    effect: def.effectByLevel[lv - 1]
  };
};

export const getSkillNextLevelOffer = (id: number, ownedLevel: number | undefined): SkillData | null => {
  const nextLevel = clampLevel((ownedLevel ?? 0) + 1);
  return toSkillData(id, nextLevel);
};

export function rollSkillOptions(count = 3, owned: SkillData[] = []): SkillData[] {
  const ownedLevelById = new Map<number, number>();
  owned.forEach((s) => ownedLevelById.set(s.id, s.level));

  const candidates = SkillDefinitions.filter((d) => (ownedLevelById.get(d.id) ?? 0) < MAX_LEVEL);
  const pool = [...candidates];
  const options: SkillData[] = [];

  while (options.length < count && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    const picked = pool.splice(idx, 1)[0];
    const offer = getSkillNextLevelOffer(picked.id, ownedLevelById.get(picked.id));
    if (offer) options.push(offer);
  }
  return options;
}

