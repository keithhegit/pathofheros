import { useEffect, useMemo, useState } from "react";
import { apiCreateRun, apiMapMove } from "../lib/api";
import { generateMap, MapData, MapNode } from "../lib/map";
import { useRunStore } from "../state/runStore";

type Props = {
  onEvent: (event: string) => void;
  layers: number;
};

const MapView = ({ onEvent, layers }: Props) => {
  const { runId, map, setRun, userId } = useRunStore();
  const [error, setError] = useState<string | null>(null);
  const [mapData, setMapData] = useState<MapData>(() => generateMap(layers));
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    setMapData(generateMap(layers));
  }, [layers]);

  const currentLayer = map?.layer ?? 0;
  const isAtEnd = currentLayer >= mapData.length - 1;

  const handleNodeClick = async (node: MapNode) => {
    if (!runId) {
      setError("尚未创建 Run：请先点击“创建 Run”，再选择节点。");
      return;
    }
    if (node.layer !== currentLayer + 1) return;
    setError(null);
    try {
      const res = await apiMapMove(runId, { layer: node.layer, node: node.index, type: node.type });
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
        if (n.layer === currentLayer + 1) {
          allowed.add(n.id);
        }
      });
    });
    return allowed;
  }, [mapData, currentLayer]);

  const nextLayer = Math.min(currentLayer + 1, mapData.length - 1);
  const nextRow = isAtEnd ? [] : mapData.find((row) => (row?.[0]?.layer ?? -1) === nextLayer) ?? [];
  const currentRow = mapData.find((row) => (row?.[0]?.layer ?? -1) === currentLayer) ?? [];

  return (
    <div className="w-full max-w-md">
      <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-b from-slate-900/90 to-slate-950 p-4 shadow-2xl">
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
                      currentHp: (data.stats?.[1] ?? 100) as number,
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
        <div className="rounded-2xl border border-white/5 bg-white/5 p-3">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>当前位置</span>
            <span className="text-slate-400">Layer {currentLayer}</span>
          </div>
          <div className="mt-3 flex items-center justify-center gap-3">
            {currentRow.map((node) => {
              const isCurrent = map?.layer === node.layer && map?.node === node.index;
              return (
                <div
                  key={node.id}
                  className={`flex h-12 w-20 items-center justify-center rounded-2xl border text-xs font-semibold ${
                    isCurrent
                      ? "border-amber-400 bg-amber-500/20 text-amber-200"
                      : "border-slate-700 bg-slate-900/50 text-slate-400"
                  }`}
                >
                  {nodeLabel(node.type)}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-white/5 bg-white/5 p-3">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>下一步（二选一）</span>
            <span className="text-slate-400">Layer {nextLayer}</span>
          </div>
          {isAtEnd ? (
            <p className="mt-3 text-center text-sm font-semibold text-amber-200">
              已抵达终点节点，请完成 Boss 或返回章节。
            </p>
          ) : (
            <>
              <div className="mt-3 flex items-center justify-center gap-4">
                {nextRow.map((node) => {
                  const isAvailable = availability.has(node.id);
                  return (
                    <button
                      key={node.id}
                      aria-label={`Next node ${node.type}`}
                      onClick={() => handleNodeClick(node)}
                      disabled={!runId || !isAvailable}
                      className={`flex h-20 w-28 flex-col items-center justify-center gap-1 rounded-3xl border text-sm font-semibold transition active:scale-95 ${
                        isAvailable
                          ? "border-emerald-400/50 bg-emerald-500/10 text-emerald-100"
                          : "border-slate-700 bg-slate-900/50 text-slate-500"
                      }`}
                    >
                      <span className="text-base">{nodeLabel(node.type)}</span>
                      <span className="text-[11px] font-normal text-slate-400">点击选择</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-center text-[11px] text-slate-400">
                规则：每层只提供两个选择，选其一前进。
              </p>
            </>
          )}
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
    case "ELITE":
      return "Elite";
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

