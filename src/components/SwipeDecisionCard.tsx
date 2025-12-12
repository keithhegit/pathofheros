import { useGesture } from "@use-gesture/react";
import { animated, useSpring } from "@react-spring/web";
import { ReactNode, useMemo } from "react";

type Props = {
  children: ReactNode;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  leftLabel?: string;
  rightLabel?: string;
  disabled?: boolean;
};

const SwipeDecisionCard = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftLabel = "出售",
  rightLabel = "装备",
  disabled
}: Props) => {
  const [{ x, rot }, api] = useSpring(() => ({
    x: 0,
    rot: 0,
    config: { tension: 240, friction: 22 }
  }));

  const threshold = 140;

  const bind = useGesture(
    {
      onDrag: ({ down, movement: [mx], cancel }) => {
        if (disabled) return;
        if (!down && Math.abs(mx) > threshold) {
          mx > 0 ? onSwipeRight() : onSwipeLeft();
          cancel?.();
          api.start({ x: 0, rot: 0 });
          return;
        }
        api.start({ x: down ? mx : 0, rot: down ? mx * -0.08 : 0 });
      }
    },
    { drag: { axis: "x" } }
  );

  const rightActive = useMemo(() => x.get() > 24, [x]);
  const leftActive = useMemo(() => x.get() < -24, [x]);

  return (
    <animated.div
      {...bind()}
      role="button"
      tabIndex={0}
      aria-label="Swipe decision"
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === "ArrowRight") onSwipeRight();
        if (e.key === "ArrowLeft") onSwipeLeft();
      }}
      className={`relative w-full touch-pan-y select-none rounded-3xl border border-white/10 bg-gradient-to-br from-slate-800/80 via-slate-800/50 to-slate-900/60 p-5 shadow-2xl backdrop-blur ${
        disabled ? "opacity-60" : ""
      }`}
      style={{ x, rotateZ: rot }}
    >
      {children}
      <div
        className={`absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-rose-500/70 px-3 py-1 text-xs font-semibold text-white transition ${
          leftActive ? "opacity-100 scale-100" : "opacity-0 scale-75"
        }`}
      >
        {leftLabel}
      </div>
      <div
        className={`absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-emerald-500/70 px-3 py-1 text-xs font-semibold text-white transition ${
          rightActive ? "opacity-100 scale-100" : "opacity-0 scale-75"
        }`}
      >
        {rightLabel}
      </div>
    </animated.div>
  );
};

export default SwipeDecisionCard;


