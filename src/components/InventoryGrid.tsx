import { equipmentSlots } from "../lib/equipment";
import { useRunStore } from "../state/runStore";

const InventoryGrid = () => {
  const inventory = useRunStore((state) => state.inventory);

  return (
    <div className="grid grid-cols-4 gap-2 text-xs text-slate-200">
      {equipmentSlots.map((slot) => {
        const equip = inventory[slot];
        return (
          <div
            key={slot}
            className="rounded-2xl border border-white/5 bg-slate-900/60 p-3"
          >
            <p className="text-[11px] uppercase tracking-wide text-slate-400">
              {slot}
            </p>
            {equip ? (
              <>
                <p className="mt-1 line-clamp-2 text-[11px] font-semibold text-amber-200">
                  {equip.name}
                </p>
                <p className="mt-1 text-[10px] text-slate-400">
                  {equip.rarity} · Lv.{equip.power}
                </p>
              </>
            ) : (
              <p className="text-[11px] text-slate-500">暂无装备</p>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default InventoryGrid;

