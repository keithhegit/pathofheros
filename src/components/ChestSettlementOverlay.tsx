import { useEffect, useMemo, useRef, useState } from "react";
import type { RarityWeights } from "../lib/equipment";
import { generateEquipment } from "../lib/equipment";
import { useRunStore } from "../state/runStore";
import ChestFoundOverlay from "./ChestFoundOverlay";
import LootRewardOverlay from "./LootRewardOverlay";

type Props = {
  title?: string;
  goldReward?: number;
  equipmentRarityWeights?: RarityWeights;
  onDone: (summary: string) => void;
};

const ChestSettlementOverlay = ({
  title = "宝箱结算",
  goldReward,
  equipmentRarityWeights,
  onDone
}: Props) => {
  const addGold = useRunStore((s) => s.addGold);
  const equipItem = useRunStore((s) => s.equipItem);
  const inventory = useRunStore((s) => s.inventory);

  const onceRef = useRef(false);
  const [phase, setPhase] = useState<"found" | "decide">("found");
  const [drop] = useState(() => generateEquipment(undefined, { rarityWeights: equipmentRarityWeights }));
  const [reward, setReward] = useState(0);

  useEffect(() => {
    if (onceRef.current) return;
    onceRef.current = true;
    const r = typeof goldReward === "number" ? goldReward : 40 + Math.floor(Math.random() * 40);
    setReward(r);
    addGold(r);
  }, [addGold, goldReward]);

  const current = useMemo(() => inventory[drop.slot], [drop.slot, inventory]);

  const handleEquip = () => {
    equipItem(drop);
    onDone(`【${title}】获得金币 +${reward}，并装备 ${drop.rarity} ${drop.name}`);
  };

  const handleSell = () => {
    addGold(drop.saleValue);
    onDone(`【${title}】获得金币 +${reward}，并出售 ${drop.rarity} ${drop.name} +${drop.saleValue}G`);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4 py-8 text-white">
      <div className="w-full max-w-md">
        {phase === "found" ? (
          <ChestFoundOverlay
            goldReward={reward}
            drop={drop}
            onContinue={() => setPhase("decide")}
          />
        ) : (
          <LootRewardOverlay
            title="NEW GEAR FOUND!"
            subtitle="SWIPE to decide"
            drop={drop}
            current={current}
            onEquip={handleEquip}
            onSell={handleSell}
            sellGold={drop.saleValue}
          />
        )}
      </div>
    </div>
  );
};

export default ChestSettlementOverlay;


