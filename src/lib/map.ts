export type NodeType = "START" | "ENEMY" | "CHEST" | "FOUNTAIN" | "REST" | "BOSS";

export type MapNode = {
  id: string;
  layer: number;
  index: number;
  type: NodeType;
};

export type MapData = MapNode[][];

const types: NodeType[] = ["ENEMY", "CHEST", "FOUNTAIN", "REST"];

export const generateMap = (layers = 12, maxWidth = 3): MapData => {
  const map: MapData = [];
  for (let l = 0; l < layers; l++) {
    const width = l === 0 || l === layers - 1 ? 1 : Math.max(1, Math.min(maxWidth, Math.floor(Math.random() * maxWidth) + 1));
    const row: MapNode[] = [];
    for (let i = 0; i < width; i++) {
      let type: NodeType = "ENEMY";
      if (l === 0) type = "START";
      else if (l === layers - 1) type = "BOSS";
      else type = types[Math.floor(Math.random() * types.length)];
      row.push({ id: `${l}-${i}`, layer: l, index: i, type });
    }
    map.push(row);
  }
  return map;
};

