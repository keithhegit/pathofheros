import { useGesture } from "@use-gesture/react";
import { animated, useSpring } from "@react-spring/web";
import { useMemo } from "react";

type Option = { type: number; value: number };

type Props = {
  option: Option;
  fallback?: Option;
  onKeep: () => void;
  onSwap: () => void;
};

const statName = (t: number) =>
  [
    "Damage",
    "Health",
    "Attack Speed",
    "Armor",
    "Crit",
    "Toughness",
    "Dodge",
    "Accuracy",
    "Lifesteal",
    "Bleed"
  ][t] ?? "Stat";

const SwipeCard = ({ option, fallback, onKeep, onSwap }: Props) => {
  const [{ x, rot }, api] = useSpring(() => ({
    x: 0,
    rot: 0,
    config: { tension: 220, friction: 20 }
  }));
  const threshold = 140;

  const bind = useGesture({
    onDrag: ({ down, movement: [mx], cancel }) => {
      if (!down && Math.abs(mx) > threshold) {
        mx > 0 ? onKeep() : onSwap();
        cancel?.();
        api.start({ x: 0, rot: 0 });
        return;
      }
      api.start({ x: down ? mx : 0, rot: down ? mx * -0.08 : 0 });
    }
  });

  const rightActive = useMemo(() => x.get() > 24, [x]);
  const leftActive = useMemo(() => x.get() < -24, [x]);

  return (
    <animated.div
      {...bind()}
      role="button"
      tabIndex={0}
      aria-label="Swipe upgrade option"
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") onKeep();
        if (e.key === "ArrowLeft") onSwap();
      }}
      className="relative w-full max-w-sm touch-pan-y select-none rounded-3xl bg-gradient-to-br from-slate-800/80 via-slate-800/50 to-slate-900/60 p-6 shadow-2xl backdrop-blur transition will-change-transform"
      style={{ x, rotateZ: rot }}
    >
      <div className="pointer-events-none absolute inset-0 rounded-3xl border border-white/10" />
      <div className="relative text-white">
        <p className="text-xs uppercase tracking-wide text-slate-300">Upgrade</p>
        <p className="mt-2 text-2xl font-semibold text-amber-200">
          +{option.value} {statName(option.type)}
        </p>
        {fallback && (
          <p className="mt-3 text-xs text-slate-400">
            Swipe left to take +{fallback.value} {statName(fallback.type)}
          </p>
        )}
      </div>

      <div
        className={`absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-red-500/70 px-3 py-1 text-xs font-semibold text-white transition ${
          leftActive ? "opacity-100 scale-100" : "opacity-0 scale-75"
        }`}
      >
        SWAP
      </div>
      <div
        className={`absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-emerald-500/70 px-3 py-1 text-xs font-semibold text-white transition ${
          rightActive ? "opacity-100 scale-100" : "opacity-0 scale-75"
        }`}
      >
        KEEP
      </div>
    </animated.div>
  );
};

export default SwipeCard;

