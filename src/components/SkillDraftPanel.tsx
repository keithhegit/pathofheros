import { SkillData } from "../lib/skills";

type Props = {
  options: SkillData[];
  onPick: (skill: SkillData) => Promise<void>;
  onTakeAll: () => Promise<void>;
  onClose: () => void;
  busy?: boolean;
};

const SkillDraftPanel = ({ options, onPick, onTakeAll, onClose }: Props) => {
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 px-4 py-8 text-white">
      <div className="w-full max-w-3xl space-y-4 rounded-3xl border border-white/10 bg-slate-900/90 p-6 shadow-2xl backdrop-blur">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-amber-200">泉水 技能选择</h3>
          <button
            onClick={onClose}
            className="text-xs uppercase tracking-wider text-slate-400 transition hover:text-white"
          >
            关闭
          </button>
        </div>
        <p className="text-xs text-slate-400">
          选择一个技能用于后续战斗。点击左侧即可获得技能，右侧“Take All”将直接学习全部。
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {options.map((skill) => (
            <div
              key={skill.id}
              className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-900/80 p-4 text-sm"
            >
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400">
                  {skill.type}
                </p>
                <p className="text-lg font-semibold text-white">{skill.name}</p>
                <p className="text-[13px] text-slate-300">{skill.desc}</p>
              </div>
              <div className="text-[11px] text-emerald-300">{skill.effect}</div>
              <button
                onClick={() => onPick(skill)}
                className="mt-auto rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-900 transition active:scale-95 disabled:opacity-60"
                disabled={busy}
              >
                {busy ? "选择中..." : "选择 Skill"}
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={onTakeAll}
          className="w-full rounded-xl bg-slate-800 px-4 py-2 text-center text-xs font-semibold uppercase tracking-wider text-slate-200 transition hover:bg-slate-700 disabled:opacity-60"
          disabled={busy}
        >
          Take All (看广告)
        </button>
      </div>
    </div>
  );
};

export default SkillDraftPanel;

