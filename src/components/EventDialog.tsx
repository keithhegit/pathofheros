export type EventType = "START" | "ENEMY" | "CHEST" | "FOUNTAIN" | "REST" | "BOSS" | "ELITE";

type Props = {
  event: EventType | null;
  onClose: () => void;
  onBattleRequest?: () => void;
};

const copy: Record<EventType, { title: string; desc: string }> = {
  START: { title: "起点", desc: "出发吧，选择前方的节点。" },
  ENEMY: { title: "遭遇敌人", desc: "即将进入战斗（Phase3+ 的战斗逻辑已接入）。" },
  CHEST: { title: "宝箱战斗", desc: "打赢后可掉落装备（装备对比+换装在 Phase3）。" },
  FOUNTAIN: { title: "泉水", desc: "可选择技能/增益（Phase4 的 SkillDraft 已接入）。" },
  REST: { title: "休整", desc: "恢复与补给，提升续航。" },
  BOSS: { title: "Boss", desc: "终点战斗，胜利即可突破章节（Phase5 循环中）。" },
  ELITE: { title: "精英遭遇", desc: "特殊遭遇：可选择逃跑或战斗（胜利将获得技能奖励）。" }
};

const canBattle = (event: EventType) => ["ENEMY", "CHEST", "BOSS", "ELITE"].includes(event);

const EventDialog = ({ event, onClose, onBattleRequest }: Props) => {
  if (!event) return null;
  const info = copy[event];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/90 p-5 text-white shadow-2xl backdrop-blur">
        <p className="text-xs uppercase tracking-wide text-slate-400">Event</p>
        <h3 className="mt-2 text-2xl font-semibold text-amber-300">{info.title}</h3>
        <p className="mt-2 text-sm text-slate-200">{info.desc}</p>

        {canBattle(event) && onBattleRequest ? (
          <button
            aria-label="start battle"
            onClick={onBattleRequest}
            className="mt-4 w-full rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 transition active:scale-95"
          >
            进入战斗
          </button>
        ) : (
          <button
            aria-label="close event"
            onClick={onClose}
            className="mt-4 w-full rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900 transition active:scale-95"
          >
            继续
          </button>
        )}

        <p className="mt-2 text-[11px] text-slate-500">
          说明：事件与战斗共享同一条流程，战斗结果会同步回地图。
        </p>
      </div>
    </div>
  );
};

export default EventDialog;

