import type { EquipmentData } from "../lib/equipment";
import LootRewardOverlay from "./LootRewardOverlay";

type Props = {
  goldReward: number;
  drop: EquipmentData;
  current: EquipmentData | null;
  onEquip: () => void;
  onSell: () => void;
};

const ChestRewardOverlay = ({ goldReward, drop, current, onEquip, onSell }: Props) => {
  return (
    <div className="w-full max-w-md space-y-4">
      <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4 text-center shadow-2xl backdrop-blur">
        <p className="text-xl font-extrabold tracking-wide text-amber-200">CHEST FOUND!</p>
        <div className="mt-3 rounded-2xl bg-white/5 p-4">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-500/15 text-amber-200">
            金币
          </div>
          <p className="mt-2 text-sm text-slate-200">
            获得金币：<span className="font-semibold text-amber-200">+{goldReward}</span>
          </p>
          <p className="mt-1 text-[11px] text-slate-400">宝箱战奖励更丰厚：金币 + 装备</p>
        </div>
      </div>

      <LootRewardOverlay
        drop={drop}
        current={current}
        onEquip={onEquip}
        onSell={onSell}
        sellGold={drop.saleValue}
        title="NEW GEAR FOUND!"
        subtitle="SWIPE to decide"
      />
    </div>
  );
};

export default ChestRewardOverlay;


