import type { ChapterConfig } from "../lib/chapters";
import { chapters, getChapter } from "../lib/chapters";

type Props = {
  selectedId: string;
  onSelect: (id: string) => void;
  onEnter: () => void;
  unlockedAct?: number;
  currentDot?: number; // 1..levels
};

const AdventureHomeView = ({ selectedId, onSelect, onEnter, unlockedAct = 1, currentDot = 1 }: Props) => {
  const selected = getChapter(selectedId);

  return (
    <div className="h-full w-full overflow-y-auto px-4 pb-24">
      <div className="mx-auto flex max-w-4xl flex-col gap-4">
        <div className="rounded-3xl border border-white/5 bg-slate-900/60 p-5 shadow-2xl">
          <p className="text-xs text-slate-400">冒险</p>
          <h2 className="mt-2 text-xl font-semibold text-amber-200">章节选择</h2>
          <p className="mt-1 text-sm text-slate-300">
            左右切换章节，查看掉落概率与关卡长度，然后进入路线规划。
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {chapters.map((c) => {
            const active = c.id === selectedId;
            const locked = c.act > unlockedAct;
            return (
              <button
                key={c.id}
                aria-label={`select ${c.title}`}
                onClick={() => {
                  if (locked) return;
                  onSelect(c.id);
                }}
                className={`rounded-3xl border p-4 text-left transition active:scale-[0.99] ${
                  locked
                    ? "border-white/5 bg-slate-950/40 opacity-60"
                    : active
                    ? "border-amber-400/60 bg-amber-500/10"
                    : "border-white/5 bg-slate-900/60"
                }`}
              >
                <p className="text-sm font-semibold text-slate-100">
                  Chapter {c.act} · {c.title}
                </p>
                <p className="mt-1 text-xs text-slate-400">{c.subtitle}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-200">
                  <span className="rounded-full bg-white/5 px-3 py-1">
                    关卡数：{c.levels}
                  </span>
                  <span className="rounded-full bg-white/5 px-3 py-1">
                    白装 {c.dropRates.common}%
                  </span>
                  <span className="rounded-full bg-white/5 px-3 py-1">
                    绿装 {c.dropRates.uncommon}%
                  </span>
                  <span className="rounded-full bg-white/5 px-3 py-1">
                    蓝装 {c.dropRates.rare}%
                  </span>
                </div>
                {locked && (
                  <p className="mt-3 text-[11px] font-semibold text-rose-200">
                    LOCKED · Complete previous map
                  </p>
                )}
              </button>
            );
          })}
        </div>

        <div className="rounded-3xl border border-white/5 bg-slate-900/60 p-5">
          <p className="text-xs text-slate-400">Possible map loot</p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
            <div className="rounded-2xl bg-white/5 p-3">
              <p className="text-[11px] text-slate-400">Common</p>
              <p className="mt-1 text-lg font-semibold text-slate-100">
                {selected.dropRates.common}%
              </p>
            </div>
            <div className="rounded-2xl bg-white/5 p-3">
              <p className="text-[11px] text-slate-400">Uncommon</p>
              <p className="mt-1 text-lg font-semibold text-emerald-200">
                {selected.dropRates.uncommon}%
              </p>
            </div>
            <div className="rounded-2xl bg-white/5 p-3">
              <p className="text-[11px] text-slate-400">Rare</p>
              <p className="mt-1 text-lg font-semibold text-sky-200">
                {selected.dropRates.rare}%
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/30 p-4">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Checkpoints</span>
              <span className="text-slate-400">
                {Math.max(1, Math.min(selected.levels, currentDot))}/{selected.levels}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-center gap-2">
              {Array.from({ length: selected.levels }).map((_, idx) => {
                const dotIndex = idx + 1;
                const isChest = selected.chestDotIndexes.includes(dotIndex);
                const completed = dotIndex < currentDot;
                const isCurrent = dotIndex === currentDot;
                return (
                  <div key={dotIndex} className="relative">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-semibold ${
                        completed
                          ? "border-emerald-400 bg-emerald-500/20 text-emerald-200"
                          : isCurrent
                          ? "border-amber-300 bg-amber-500/10 text-amber-200"
                          : "border-slate-600 bg-slate-900/40 text-slate-300"
                      }`}
                      aria-label={`checkpoint ${dotIndex}`}
                    >
                      {isChest ? "C" : completed ? "✓" : "•"}
                    </div>
                    {isCurrent && (
                      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-slate-200">
                        ▼
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <button
            aria-label="enter chapter"
            onClick={onEnter}
            className="mt-5 w-full rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-slate-900 transition active:scale-95"
          >
            ENTER LEVEL {selected.levels}
          </button>
          <p className="mt-2 text-[11px] text-slate-500">
            进入后将开始路线规划；战斗与掉落会在节点事件中触发。
          </p>
        </div>
      </div>
    </div>
  );
};

export type { ChapterConfig as Chapter };
export default AdventureHomeView;

