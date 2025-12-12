import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import SwipeCard from "../components/SwipeCard";
import {
  apiCreateRun,
  apiUpgrade,
  apiUpgradeApply
} from "../lib/api";
import { statName } from "../lib/stat";
import { useRunStore } from "../state/runStore";

type UpgradeOption = { type: number; value: number };

type Props = {
  className?: string;
};

const UpgradePanel = ({ className }: Props) => {
  const { runId, gold, upgradeCost, stats, userId, username, setRun } = useRunStore();
  const [options, setOptions] = useState<{ A: UpgradeOption; B: UpgradeOption } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const autoCreateRef = useRef(false);

  const createRun = useMutation({
    mutationFn: () => apiCreateRun(userId || undefined),
    onSuccess: (data) => {
      setRun({
        runId: data.id,
        playerId: data.playerId,
        userId: data.userId ?? userId ?? data.playerId,
        gold: data.gold,
        upgradeCost: data.upgradeCost,
        stats: data.stats,
        map: data.map
      });
    },
    onError: (err) => setError(String(err))
  });

  useEffect(() => {
    autoCreateRef.current = false;
  }, [userId]);

  useEffect(() => {
    if (autoCreateRef.current) return;
    if (!runId && userId) {
      autoCreateRef.current = true;
      createRun.mutate();
    }
  }, [runId, userId, createRun]);

  const upgrade = useMutation({
    mutationFn: () => {
      if (!runId) throw new Error("run not ready");
      return apiUpgrade(runId);
    },
    onSuccess: (data) => {
      setRun({ gold: data.gold, upgradeCost: data.upgradeCost });
      setOptions({ A: data.optionA, B: data.optionB });
    },
    onError: (err) => setError(String(err))
  });

  const apply = useMutation({
    mutationFn: (pick: "A" | "B") => {
      if (!runId || !options) throw new Error("run not ready");
      return apiUpgradeApply(runId, pick, options.A, options.B);
    },
    onSuccess: (data) => {
      setRun({
        stats: data.stats,
        gold: data.gold,
        upgradeCost: data.upgradeCost
      });
      setOptions(null);
    },
    onError: (err) => setError(String(err))
  });

  const handleUpgradeClick = () => {
    setError(null);
    upgrade.mutate();
  };

  return (
    <div className={`flex w-full flex-col items-center gap-6 rounded-3xl border border-white/5 bg-gradient-to-b from-slate-900 via-slate-950 to-black px-4 py-6 text-white shadow-2xl ${className ?? ""}`}>
      <header className="flex w-full max-w-md items-center justify-between">
        <div className="flex flex-col">
          <span className="text-sm text-slate-400">Gold</span>
          <span className="text-xl font-semibold text-amber-300">{gold ?? 0}</span>
          <span className="text-[11px] text-slate-500">
            {userId ? `用户：${username ?? userId}` : "请先登录/注册"}
          </span>
        </div>
        {!runId && userId ? (
          <button
            aria-label="Create run"
            onClick={() => {
              setError(null);
              createRun.mutate();
            }}
            className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg transition active:scale-95 disabled:opacity-50"
            disabled={createRun.isLoading}
          >
            {createRun.isLoading ? "创建中..." : "创建 Run"}
          </button>
        ) : (
        <button
          aria-label="Upgrade"
          onClick={handleUpgradeClick}
          className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg transition active:scale-95 disabled:opacity-50"
          disabled={!runId || upgrade.isLoading}
        >
          {upgrade.isLoading ? "Rolling..." : `UPGRADE (${upgradeCost || 0})`}
        </button>
        )}
      </header>

      <section className="w-full max-w-md rounded-2xl border border-white/5 bg-white/5 p-4 backdrop-blur">
        <p className="text-sm text-slate-300">Stats</p>
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-slate-100">
          {stats.map((val, idx) => (
            <div key={idx} className="flex items-center justify-between rounded-lg bg-slate-800/70 px-3 py-2">
              <span className="text-slate-300">{statName(idx)}</span>
              <span className="font-semibold text-amber-200">{val}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="flex w-full max-w-md flex-1 items-center justify-center">
        {userId ? (
          options ? (
            <SwipeCard
              option={options.A}
              fallback={options.B}
              onKeep={() => apply.mutate("A")}
              onSwap={() => apply.mutate("B")}
            />
          ) : (
            <p className="text-sm text-slate-400">点击 UPGRADE 获取两条属性，右滑保留 A，左滑切换 B。</p>
          )
        ) : (
          <p className="text-sm text-slate-400">请先注册/登录，再创建关卡并升级。</p>
        )}
      </section>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
};

export default UpgradePanel;

