export type NodeType = "START" | "ENEMY" | "CHEST" | "FOUNTAIN" | "REST" | "BOSS" | "ELITE";

export type MapNode = {
  id: string;
  layer: number;
  index: number;
  type: NodeType;
};

export type MapData = MapNode[][];

// 路线规划格子（四种流程）：Fountain / Chest / Rest / Boss（Boss 只在终点层）
const weightedTypes: Array<{ type: NodeType; weight: number }> = [
  { type: "FOUNTAIN", weight: 0.34 },
  { type: "CHEST", weight: 0.33 },
  { type: "REST", weight: 0.33 }
];

const rollType = (): NodeType => {
  let r = Math.random();
  for (const t of weightedTypes) {
    if (r < t.weight) return t.type;
    r -= t.weight;
  }
  return "ENEMY";
};

export const generateMap = (layers = 12): MapData => {
  const map: MapData = [];
  for (let l = 0; l < layers; l++) {
    const width = l === 0 || l === layers - 1 ? 1 : 2;
    const row: MapNode[] = [];
    for (let i = 0; i < width; i++) {
      let type: NodeType = "ENEMY";
      if (l === 0) type = "START";
      else if (l === layers - 1) type = "BOSS";
      else type = rollType();
      row.push({ id: `${l}-${i}`, layer: l, index: i, type });
    }
    map.push(row);
  }
  return map;
};

