import { useRunStore } from "../state/runStore";

const SkillList = () => {
  const skills = useRunStore((state) => state.skills);

  if (!skills.length) {
    return (
      <p className="text-xs text-slate-400">
        还未学习技能；通过泉水节点可获得 Skill（Phase4）。
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 text-[11px]">
      {skills.map((skill) => (
        <span
          key={skill.id}
          className="rounded-full bg-emerald-500/20 px-3 py-1 font-semibold text-emerald-300"
        >
          {skill.name}
        </span>
      ))}
    </div>
  );
};

export default SkillList;

