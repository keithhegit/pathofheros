import { SkillData } from "../lib/skills";

type Props = {
  title?: string;
  options: SkillData[];
  onPick: (skill: SkillData) => Promise<void>;
  onClose: () => void;
  busy?: boolean;
  canClose?: boolean;
  error?: string | null;
};

const SkillDraftPanel = ({
  title = "Pick an ability!",
  options,
  onPick,
  onClose,
  busy,
  canClose = true,
  error
}: Props) => {
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 px-4 py-8 text-white">
      <div className="w-full max-w-3xl space-y-4 rounded-3xl border border-white/10 bg-slate-900/90 p-6 shadow-2xl backdrop-blur">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-amber-200">{title}</h3>
          {canClose ? (
            <button
              aria-label="close skill draft"
              onClick={onClose}
              className="text-xs uppercase tracking-wider text-slate-400 transition hover:text-white"
            >
              关闭
            </button>
          ) : (
            <span className="text-[11px] font-semibold text-slate-400">必须选择 1 个</span>
          )}
        </div>
        <p className="text-xs text-slate-400">
          3 选 1：点击下方按钮获得技能；如果已拥有该技能，则会提升等级（最高 5 级）。
        </p>
        {error && <p className="rounded-xl bg-rose-500/10 px-3 py-2 text-xs text-rose-200">{error}</p>}
        <div className="grid gap-3 sm:grid-cols-3">
          {options.map((skill) => (
            <div
              key={skill.id}
              className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-900/80 p-4 text-sm"
            >
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400">
                  {skill.type} · Lv.{skill.level}/{skill.maxLevel}
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
      </div>
    </div>
  );
};

export default SkillDraftPanel;

