import SwipeDecisionCard from "./SwipeDecisionCard";

type Props = {
  onRun: () => void;
  onFight: () => void;
};

const EliteEncounterOverlay = ({ onRun, onFight }: Props) => {
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 px-4 py-8 text-white">
      <div className="w-full max-w-md space-y-4">
        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4 text-center shadow-2xl backdrop-blur">
          <p className="text-xs uppercase tracking-wider text-slate-400">Encounter</p>
          <p className="mt-1 text-2xl font-extrabold text-rose-200">ELITE</p>
          <p className="mt-2 text-sm text-slate-200">
            左滑逃跑 · 右滑战斗（胜利将获得一次技能三选一）
          </p>
        </div>

        <SwipeDecisionCard
          onSwipeLeft={onRun}
          onSwipeRight={onFight}
          leftLabel="逃跑"
          rightLabel="战斗"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-200">
              精英
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-100">精英怪出现！</p>
              <p className="mt-1 text-xs text-slate-300">
                想要奖励就赌一把；想稳就撤退。
              </p>
              <p className="mt-2 text-[11px] text-slate-400">
                提示：键盘也支持 ← 逃跑 / → 战斗
              </p>
            </div>
          </div>
        </SwipeDecisionCard>

        <div className="grid grid-cols-2 gap-3">
          <button
            aria-label="run away"
            onClick={onRun}
            className="rounded-2xl bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-200 transition active:scale-95"
          >
            逃跑
          </button>
          <button
            aria-label="fight elite"
            onClick={onFight}
            className="rounded-2xl bg-rose-500 px-4 py-3 text-sm font-semibold text-slate-900 transition active:scale-95"
          >
            开打
          </button>
        </div>
      </div>
    </div>
  );
};

export default EliteEncounterOverlay;


