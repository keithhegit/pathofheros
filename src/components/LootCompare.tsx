import { EquipmentData } from "../lib/equipment";
import { statName } from "../lib/stat";

type Props = {
  drop: EquipmentData;
  current?: EquipmentData | null;
};

const LootCompare = ({ drop, current }: Props) => {
  const baseStats = drop.stats.map((stat) => {
    const currentVal =
      current?.stats.find((s) => s.type === stat.type)?.value ?? 0;
    const diff = stat.value - currentVal;
    return { stat, diff };
  });

  return (
    <div className="space-y-3 rounded-3xl border border-white/5 bg-slate-900/70 p-4 text-xs text-slate-200 shadow-2xl">
      <p className="text-[11px] text-slate-400">New Loot</p>
      <h4 className="text-lg font-semibold text-amber-200">{drop.name}</h4>
      <div className="space-y-1">
        {baseStats.map(({ stat, diff }) => (
          <div
            key={`${stat.type}-${stat.value}`}
            className="flex items-center justify-between text-[13px]"
          >
            <span>{statName(stat.type)}</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-emerald-300">{stat.value}</span>
              {current && (
                <span
                  className={`text-[10px] font-semibold ${
                    diff >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {diff >= 0 ? `+${diff}` : diff}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LootCompare;

