import type { EquipmentData } from "../lib/equipment";
import EquipmentCard from "./EquipmentCard";

type Props = {
  goldReward: number;
  drop: EquipmentData;
  onContinue: () => void;
};

const ChestFoundOverlay = ({ goldReward, drop, onContinue }: Props) => {
  return (
    <div className="w-full max-w-md space-y-4">
      <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4 text-center shadow-2xl backdrop-blur">
        <p className="text-xl font-extrabold tracking-wide text-amber-200">
          CHEST FOUND!
        </p>
      </div>

      <div className="flex gap-3">
        <div className="flex-1 rounded-3xl border border-white/10 bg-slate-950/60 p-4 text-center shadow-2xl">
          <p className="text-sm font-semibold text-slate-100">Gold</p>
          <div className="mx-auto mt-3 flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-500/15 text-amber-200">
            金币
          </div>
          <p className="mt-3 text-lg font-semibold text-amber-200">+{goldReward}</p>
        </div>

        <div className="flex-1">
          <EquipmentCard title="New Gear" item={drop} compareTo={null} badge={drop.rarity} />
        </div>
      </div>

      <button
        aria-label="continue to loot decision"
        onClick={onContinue}
        className="w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-900 transition active:scale-95"
      >
        CONTINUE
      </button>
      <p className="text-center text-[11px] text-slate-400">
        点击继续进入装备选择（左滑出售/右滑装备）。
      </p>
    </div>
  );
};

export default ChestFoundOverlay;


