export type SkillData = {
  id: number;
  name: string;
  desc: string;
  effect: string;
  type: "Attack" | "Defense" | "Utility";
};

export const SkillPool: SkillData[] = [
  {
    id: 101,
    name: "雷霆突刺",
    desc: "攻击时有额外爆炸伤害。",
    effect: "+10% 伤害（爆发）",
    type: "Attack"
  },
  {
    id: 102,
    name: "吸血打击",
    desc: "每次命中后吸取生命。",
    effect: "回复最大生命的 3%",
    type: "Utility"
  },
  {
    id: 103,
    name: "铁壁姿态",
    desc: "被攻击时获得护甲加成。",
    effect: "受击时+8 护甲",
    type: "Defense"
  },
  {
    id: 104,
    name: "敏捷步伐",
    desc: "短时间内提高攻速。",
    effect: "+8% 攻速",
    type: "Utility"
  },
  {
    id: 105,
    name: "爆裂利刃",
    desc: "普通攻击带出溅射伤害。",
    effect: "攻击额外溅射 12 点",
    type: "Attack"
  },
  {
    id: 106,
    name: "再生庇护",
    desc: "战斗中定时回复生命。",
    effect: "每 5 秒恢复 15 HP",
    type: "Defense"
  }
];

export function rollSkillOptions(count = 3): SkillData[] {
  const pool = [...SkillPool];
  const options: SkillData[] = [];
  while (options.length < count && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    options.push(pool.splice(idx, 1)[0]);
  }
  return options;
}

