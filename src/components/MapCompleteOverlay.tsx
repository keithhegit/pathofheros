type Props = {
  chapterTitle: string;
  dropRates: { common: number; uncommon: number; rare: number };
  checkpoints: number;
  chestDotIndexes: number[];
  onClose: () => void;
};

const MapCompleteOverlay = ({ chapterTitle, dropRates, checkpoints, chestDotIndexes, onClose }: Props) => {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4 py-10 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950/80 p-5 shadow-2xl backdrop-blur">
        <div className="text-center">
          <p className="text-xs uppercase tracking-wider text-slate-400">Map complete</p>
          <p className="mt-2 text-2xl font-extrabold text-amber-200">{chapterTitle}</p>
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-center text-xs font-semibold tracking-widest text-slate-300">
            Possible map loot
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
            <div className="rounded-2xl bg-white/5 p-3 text-center">
              <p className="text-[11px] text-slate-400">Common</p>
              <p className="mt-1 text-lg font-semibold text-slate-100">{dropRates.common}%</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-3 text-center">
              <p className="text-[11px] text-slate-400">Uncommon</p>
              <p className="mt-1 text-lg font-semibold text-emerald-200">{dropRates.uncommon}%</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-3 text-center">
              <p className="text-[11px] text-slate-400">Rare</p>
              <p className="mt-1 text-lg font-semibold text-sky-200">{dropRates.rare}%</p>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>Checkpoints</span>
            <span className="text-slate-400">{checkpoints}/{checkpoints}</span>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            {Array.from({ length: checkpoints }).map((_, idx) => {
              const dot = idx + 1;
              const isChest = chestDotIndexes.includes(dot);
              return (
                <div
                  key={dot}
                  className={`flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-semibold ${
                    isChest
                      ? "border-amber-300 bg-amber-500/10 text-amber-200"
                      : "border-emerald-400 bg-emerald-500/20 text-emerald-200"
                  }`}
                  aria-label={`checkpoint ${dot}`}
                >
                  {isChest ? "C" : "✓"}
                </div>
              );
            })}
          </div>
        </div>

        <button
          aria-label="close map complete"
          onClick={onClose}
          className="mt-5 w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-900 transition active:scale-95"
        >
          返回章节
        </button>
      </div>
    </div>
  );
};

export default MapCompleteOverlay;


