import type { EquipmentData } from "../lib/equipment";
import EquipmentCard from "./EquipmentCard";
import SwipeDecisionCard from "./SwipeDecisionCard";

type Props = {
  drop: EquipmentData;
  current: EquipmentData | null;
  onEquip: () => void;
  onSell: () => void;
  sellGold: number;
  title?: string;
  subtitle?: string;
};

const LootRewardOverlay = ({
  drop,
  current,
  onEquip,
  onSell,
  sellGold,
  title = "NEW GEAR FOUND!",
  subtitle = "SWIPE to decide"
}: Props) => {
  return (
    <div className="w-full max-w-md space-y-4">
      <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4 text-center shadow-2xl backdrop-blur">
        <p className="text-xl font-extrabold tracking-wide text-amber-200">{title}</p>
      </div>

      <EquipmentCard title="CURRENTLY EQUIPPED" item={current} compareTo={drop} badge={current?.rarity} />

      <SwipeDecisionCard
        onSwipeLeft={onSell}
        onSwipeRight={onEquip}
        leftLabel={`Discard +${sellGold}`}
        rightLabel="Equip"
      >
        <EquipmentCard title="NEW GEAR" item={drop} compareTo={current} badge={drop.rarity} />
      </SwipeDecisionCard>

      <p className="text-center text-xs font-semibold tracking-widest text-slate-300">
        {subtitle}
      </p>
    </div>
  );
};

export default LootRewardOverlay;


