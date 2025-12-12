import { useEffect, useMemo, useState } from "react";
import { apiCreateRun, apiMapMove } from "../lib/api";
import { generateMap, MapData, MapNode } from "../lib/map";
import { useRunStore } from "../state/runStore";

type Props = {
  onEvent: (event: string) => void;
};

const MapView = ({ onEvent }: Props) => {
  const { runId, map, setRun, userId } = useRunStore();
  const [error, setError] = useState<string | null>(null);
  const [mapData, setMapData] = useState<MapData>(() => generateMap());
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    // regenerate map only if empty
    if (!mapData.length) {
      setMapData(generateMap());
    }
  }, [mapData]);

  const currentLayer = map?.layer ?? 0;

  const handleNodeClick = async (node: MapNode) => {
    if (!runId) {
      setError("尚未创建 Run：请先点击“创建 Run”，再选择节点。");
      return;
    }
    if (node.layer < currentLayer) return;
    setError(null);
    try {
      const res = await apiMapMove(runId, { layer: node.layer, node: node.index });
      setRun({ map: res.map });
      onEvent(res.event);
    } catch (e) {
      setError(String(e));
    }
  };

  const availability = useMemo(() => {
    const allowed = new Set<string>();
    mapData.forEach((row) => {
      row.forEach((n) => {
        if (n.layer === currentLayer || n.layer === currentLayer + 1) {
          allowed.add(n.id);
        }
      });
    });
    return allowed;
  }, [mapData, currentLayer]);

  return (
    <div className="w-full max-w-md">
      <div className="relative h-[520px] overflow-y-auto rounded-2xl border border-white/5 bg-gradient-to-b from-slate-900/90 to-slate-950 p-4">
        {!runId && userId && (
          <div className="mb-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200">
            <div className="flex items-center justify-between gap-3">
              <span>尚未创建 Run（地图/事件需要 runId）。</span>
              <button
                aria-label="Create run in map"
                onClick={async () => {
                  if (!userId) return;
                  setError(null);
                  setCreating(true);
                  try {
                    const data = await apiCreateRun(userId);
                    setRun({
                      runId: data.id,
                      playerId: data.playerId,
                      userId: data.userId ?? userId ?? data.playerId,
                      gold: data.gold,
                      upgradeCost: data.upgradeCost,
                      stats: data.stats,
                      map: data.map
                    });
                  } catch (e) {
                    setError(String(e));
                  } finally {
                    setCreating(false);
                  }
                }}
                disabled={creating}
                className="rounded-xl bg-emerald-500 px-3 py-1 text-xs font-semibold text-slate-900 transition active:scale-95 disabled:opacity-60"
              >
                {creating ? "创建中..." : "创建 Run"}
              </button>
            </div>
          </div>
        )}
        <div className="flex flex-col gap-6">
          {mapData.map((row, idx) => (
            <div key={idx} className="flex items-center justify-center gap-4">
              {row.map((node) => {
                const isCurrent = map?.layer === node.layer && map?.node === node.index;
                const isAvailable = availability.has(node.id);
                return (
                  <button
                    key={node.id}
                    aria-label={`Node ${node.type}`}
                    onClick={() => handleNodeClick(node)}
                    disabled={!runId || !isAvailable}
                    className={`flex h-16 w-16 items-center justify-center rounded-2xl border text-xs font-semibold transition active:scale-95 ${
                      isCurrent
                        ? "border-amber-400 bg-amber-500/20 text-amber-200"
                        : isAvailable
                        ? "border-emerald-400/50 bg-emerald-500/10 text-emerald-100"
                        : "border-slate-700 bg-slate-800/50 text-slate-400"
                    }`}
                  >
                    {nodeLabel(node.type)}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      {!userId && (
        <p className="mt-2 text-xs text-slate-400">
          提示：请先在上方登录/注册，再到 Book 页创建 Run 后即可在此导航。
        </p>
      )}
    </div>
  );
};

const nodeLabel = (t: string) => {
  switch (t) {
    case "START":
      return "Start";
    case "BOSS":
      return "Boss";
    case "CHEST":
      return "Chest";
    case "FOUNTAIN":
      return "Fountain";
    case "REST":
      return "Rest";
    default:
      return "Enemy";
  }
};

export default MapView;

