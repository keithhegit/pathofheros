import type { EquipmentData } from "../lib/equipment";
import { statName } from "../lib/stat";

type Props = {
  title: string;
  item: EquipmentData | null;
  compareTo?: EquipmentData | null;
  badge?: string;
};

const rarityClass: Record<string, string> = {
  Common: "border-slate-400/40 bg-slate-900/70",
  Uncommon: "border-emerald-400/40 bg-emerald-500/10",
  Rare: "border-sky-400/40 bg-sky-500/10",
  Epic: "border-violet-400/40 bg-violet-500/10"
};

const EquipmentCard = ({ title, item, compareTo, badge }: Props) => {
  const rarity = item?.rarity ?? "Common";
  const frame = rarityClass[rarity] ?? rarityClass.Common;

  return (
    <div className={`rounded-3xl border p-4 shadow-2xl ${frame}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
          {title}
        </p>
        {badge && (
          <span className="rounded-full bg-black/30 px-3 py-1 text-[10px] font-semibold text-slate-200">
            {badge}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-50">
            {item ? item.name : "Empty Slot"}
          </p>
          <p className="mt-1 text-[11px] text-slate-300">
            {item ? `${item.rarity} · ${item.slot}` : "暂无装备"}
          </p>
        </div>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-xs text-slate-300">
          图
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {(item?.stats ?? []).length ? (
          item!.stats.map((s) => {
            const base = compareTo?.stats.find((x) => x.type === s.type)?.value ?? 0;
            const diff = s.value - base;
            const diffLabel = diff === 0 ? null : diff > 0 ? `+${diff}` : `${diff}`;
            const diffClass =
              diff === 0 ? "text-slate-400" : diff > 0 ? "text-emerald-300" : "text-rose-300";
            const arrow = diff === 0 ? "" : diff > 0 ? "↑" : "↓";
            return (
              <div key={`${s.type}-${s.value}`} className="flex items-center justify-between text-xs">
                <span className="text-slate-200">{statName(s.type)}</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-50">{s.value}</span>
                  {compareTo && diffLabel && (
                    <span className={`text-[11px] font-semibold ${diffClass}`}>
                      {arrow} {diffLabel}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-xs text-slate-400">—</p>
        )}
      </div>
    </div>
  );
};

export default EquipmentCard;


