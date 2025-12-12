type TabKey = "inventory" | "adventure" | "book";

type Props = {
  value: TabKey;
  onChange: (tab: TabKey) => void;
};

const tabButtonBase =
  "flex-1 rounded-2xl px-4 py-3 text-sm font-semibold transition active:scale-95";

const BottomNav = ({ value, onChange }: Props) => {
  return (
    <nav className="sticky bottom-0 z-40 w-full border-t border-white/5 bg-slate-950/80 p-2 backdrop-blur">
      <div className="mx-auto flex max-w-4xl gap-2">
        <button
          aria-label="Backpack tab"
          onClick={() => onChange("inventory")}
          className={`${tabButtonBase} ${
            value === "inventory"
              ? "bg-slate-800 text-emerald-200"
              : "bg-slate-900/60 text-slate-300"
          }`}
        >
          背包
        </button>
        <button
          aria-label="Adventure tab"
          onClick={() => onChange("adventure")}
          className={`${tabButtonBase} ${
            value === "adventure"
              ? "bg-slate-800 text-amber-200"
              : "bg-slate-900/60 text-slate-300"
          }`}
        >
          冒险
        </button>
        <button
          aria-label="Book tab"
          onClick={() => onChange("book")}
          className={`${tabButtonBase} ${
            value === "book"
              ? "bg-slate-800 text-sky-200"
              : "bg-slate-900/60 text-slate-300"
          }`}
        >
          魔法书
        </button>
      </div>
    </nav>
  );
};

export type { TabKey as MainTabKey };
export default BottomNav;


