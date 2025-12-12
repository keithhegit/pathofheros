import { useEffect, useMemo, useState } from "react";
import type { RarityWeights } from "../lib/equipment";
import { useRunStore, TimedChestRarity, TimedChestSlot } from "../state/runStore";
import ChestSettlementOverlay from "./ChestSettlementOverlay";

const rarityStyle: Record<TimedChestRarity, { label: string; frame: string; durationMs: number }> = {
  Common: { label: "COMMON", frame: "border-slate-300/40 bg-slate-900/50", durationMs: 5 * 60 * 1000 },
  Uncommon: { label: "UNCOMMON", frame: "border-emerald-300/40 bg-emerald-500/10", durationMs: 10 * 60 * 1000 },
  Rare: { label: "RARE", frame: "border-sky-300/40 bg-sky-500/10", durationMs: 23 * 60 * 1000 }
};

const formatLeft = (ms: number) => {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
};

const weightsByChest = (rarity: TimedChestRarity): RarityWeights => {
  if (rarity === "Rare") return { Common: 0.15, Uncommon: 0.6, Rare: 0.25, Epic: 0 };
  if (rarity === "Uncommon") return { Common: 0.55, Uncommon: 0.4, Rare: 0.05, Epic: 0 };
  return { Common: 0.8, Uncommon: 0.19, Rare: 0.01, Epic: 0 };
};

type Props = {
  className?: string;
};

const TimedChestSlots = ({ className }: Props) => {
  const chestSlots = useRunStore((s) => s.chestSlots);
  const removeTimedChestAt = useRunStore((s) => s.removeTimedChestAt);

  const [now, setNow] = useState(() => Date.now());
  const [openingIndex, setOpeningIndex] = useState<number | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const activeChest = useMemo(() => {
    if (openingIndex === null) return null;
    return { index: openingIndex, chest: chestSlots[openingIndex] };
  }, [chestSlots, openingIndex]);

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-amber-200">Gear Chests</p>
          <p className="mt-1 text-[11px] text-slate-400">
            解锁计时离线也会继续。到点后点击打开，走同一套宝箱结算流程。
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {chestSlots.map((slot, idx) => {
          if (!slot) {
            return (
              <div
                key={idx}
                className="flex h-32 flex-col items-center justify-center rounded-3xl border border-white/10 bg-slate-950/30 p-3 text-center"
              >
                <p className="text-xs font-semibold text-slate-300">Find a chest</p>
                <p className="mt-2 text-[11px] text-slate-500">空位</p>
              </div>
            );
          }

          const meta = rarityStyle[slot.rarity];
          const left = slot.unlockEndsAt - now;
          const ready = left <= 0;

          return (
            <div
              key={slot.id}
              className={`flex h-32 flex-col justify-between rounded-3xl border p-3 ${meta.frame}`}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-extrabold tracking-wide text-slate-100">{meta.label}</p>
                <div className="h-7 w-7 rounded-xl bg-black/20" />
              </div>

              <div className="text-center">
                <p className="text-[11px] text-slate-300">{ready ? "READY" : formatLeft(left)}</p>
              </div>

              <button
                aria-label={`open chest ${idx}`}
                onClick={() => {
                  if (!ready) return;
                  setOpeningIndex(idx);
                }}
                disabled={!ready}
                className="rounded-2xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-900 transition active:scale-95 disabled:opacity-50"
              >
                {ready ? "OPEN" : "OPEN NOW!"}
              </button>
            </div>
          );
        })}
      </div>

      {activeChest?.chest && openingIndex !== null && (
        <ChestSettlementOverlay
          title={`Gear Chest (${activeChest.chest.rarity})`}
          equipmentRarityWeights={weightsByChest(activeChest.chest.rarity)}
          onDone={() => {
            removeTimedChestAt(openingIndex);
            setOpeningIndex(null);
          }}
        />
      )}
    </div>
  );
};

export const createTimedChest = (rarity: TimedChestRarity): TimedChestSlot => {
  const id = crypto.randomUUID();
  const durationMs = rarityStyle[rarity].durationMs;
  const createdAt = Date.now();
  return { id, rarity, createdAt, unlockEndsAt: createdAt + durationMs };
};

export default TimedChestSlots;


