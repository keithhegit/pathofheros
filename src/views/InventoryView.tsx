import InventoryGrid from "../components/InventoryGrid";
import SkillList from "../components/SkillList";
import { useRunStore } from "../state/runStore";

const InventoryView = () => {
  const gold = useRunStore((s) => s.gold);
  const userId = useRunStore((s) => s.userId);
  const username = useRunStore((s) => s.username);

  return (
    <div className="h-full w-full overflow-y-auto px-4 pb-6">
      <div className="mx-auto flex max-w-4xl flex-col gap-4">
        <div className="rounded-3xl border border-white/5 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-slate-400">背包</p>
              <p className="text-sm text-slate-200">
                {userId ? `用户：${username ?? userId}` : "请先登录"}
              </p>
            </div>
            <div className="rounded-2xl bg-white/5 px-3 py-2 text-sm text-amber-200">
              Gold: <span className="font-semibold">{gold}</span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/5 bg-slate-900/60 p-4">
          <p className="text-sm font-semibold text-emerald-200">已学技能</p>
          <div className="mt-2">
            <SkillList />
          </div>
        </div>

        <div className="rounded-3xl border border-white/5 bg-slate-900/60 p-4">
          <p className="text-sm font-semibold text-amber-200">穿戴中的装备</p>
          <div className="mt-3">
            <InventoryGrid />
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryView;


