type Chapter = {
  id: string;
  title: string;
  subtitle: string;
  layers: number;
  dropRates: { common: number; uncommon: number; rare: number };
};

const chapters: Chapter[] = [
  {
    id: "chapter-1",
    title: "Chapter 1: Greenwood Trail",
    subtitle: "初始试炼 · 适合熟悉机制",
    layers: 12,
    dropRates: { common: 80, uncommon: 19, rare: 1 }
  },
  {
    id: "chapter-2",
    title: "Chapter 2: Frostwood Rise",
    subtitle: "寒林回响 · 精英概率更高",
    layers: 14,
    dropRates: { common: 75, uncommon: 23, rare: 2 }
  }
];

type Props = {
  selectedId: string;
  onSelect: (id: string) => void;
  onEnter: () => void;
};

const AdventureHomeView = ({ selectedId, onSelect, onEnter }: Props) => {
  const selected = chapters.find((c) => c.id === selectedId) ?? chapters[0];

  return (
    <div className="h-full w-full overflow-y-auto px-4 pb-24">
      <div className="mx-auto flex max-w-4xl flex-col gap-4">
        <div className="rounded-3xl border border-white/5 bg-slate-900/60 p-5 shadow-2xl">
          <p className="text-xs text-slate-400">冒险</p>
          <h2 className="mt-2 text-xl font-semibold text-amber-200">章节选择</h2>
          <p className="mt-1 text-sm text-slate-300">
            左右切换章节，查看掉落概率与关卡长度，然后进入路线规划。
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {chapters.map((c) => {
            const active = c.id === selectedId;
            return (
              <button
                key={c.id}
                aria-label={`select ${c.title}`}
                onClick={() => onSelect(c.id)}
                className={`rounded-3xl border p-4 text-left transition active:scale-[0.99] ${
                  active
                    ? "border-amber-400/60 bg-amber-500/10"
                    : "border-white/5 bg-slate-900/60"
                }`}
              >
                <p className="text-sm font-semibold text-slate-100">{c.title}</p>
                <p className="mt-1 text-xs text-slate-400">{c.subtitle}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-200">
                  <span className="rounded-full bg-white/5 px-3 py-1">
                    节点数：{c.layers}
                  </span>
                  <span className="rounded-full bg-white/5 px-3 py-1">
                    白装 {c.dropRates.common}%
                  </span>
                  <span className="rounded-full bg-white/5 px-3 py-1">
                    绿装 {c.dropRates.uncommon}%
                  </span>
                  <span className="rounded-full bg-white/5 px-3 py-1">
                    蓝装 {c.dropRates.rare}%
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="rounded-3xl border border-white/5 bg-slate-900/60 p-5">
          <p className="text-xs text-slate-400">掉落预览</p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
            <div className="rounded-2xl bg-white/5 p-3">
              <p className="text-[11px] text-slate-400">Common</p>
              <p className="mt-1 text-lg font-semibold text-slate-100">
                {selected.dropRates.common}%
              </p>
            </div>
            <div className="rounded-2xl bg-white/5 p-3">
              <p className="text-[11px] text-slate-400">Uncommon</p>
              <p className="mt-1 text-lg font-semibold text-emerald-200">
                {selected.dropRates.uncommon}%
              </p>
            </div>
            <div className="rounded-2xl bg-white/5 p-3">
              <p className="text-[11px] text-slate-400">Rare</p>
              <p className="mt-1 text-lg font-semibold text-sky-200">
                {selected.dropRates.rare}%
              </p>
            </div>
          </div>

          <button
            aria-label="enter chapter"
            onClick={onEnter}
            className="mt-5 w-full rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-slate-900 transition active:scale-95"
          >
            ENTER LEVEL
          </button>
          <p className="mt-2 text-[11px] text-slate-500">
            进入后将开始路线规划；战斗与掉落会在节点事件中触发。
          </p>
        </div>
      </div>
    </div>
  );
};

export type { Chapter };
export default AdventureHomeView;

import { useMemo, useState } from "react";
import { useRunStore } from "../state/runStore";

type Chapter = {
  id: string;
  name: string;
  subtitle: string;
  length: number;
  drops: { common: number; uncommon: number; rare: number };
};

type Props = {
  onEnter: (chapterId: string) => void;
  onContinue: () => void;
};

const chapters: Chapter[] = [
  {
    id: "chapter_1",
    name: "Chapter 1",
    subtitle: "Frostwood Rise",
    length: 12,
    drops: { common: 80, uncommon: 19, rare: 1 }
  },
  {
    id: "chapter_2",
    name: "Chapter 2",
    subtitle: "Ashen Hollow",
    length: 14,
    drops: { common: 75, uncommon: 22, rare: 3 }
  },
  {
    id: "chapter_3",
    name: "Chapter 3",
    subtitle: "Obsidian Gate",
    length: 16,
    drops: { common: 70, uncommon: 25, rare: 5 }
  }
];

const AdventureHomeView = ({ onEnter, onContinue }: Props) => {
  const runId = useRunStore((s) => s.runId);
  const map = useRunStore((s) => s.map);
  const [index, setIndex] = useState(0);

  const chapter = chapters[index] ?? chapters[0];
  const progressText = useMemo(() => {
    if (!runId) return "尚未开始冒险";
    const layer = map?.layer ?? 0;
    return `进度：第 ${layer + 1} / ${chapter.length} 层`;
  }, [chapter.length, map?.layer, runId]);

  return (
    <div className="h-full w-full overflow-y-auto px-4 pb-6">
      <div className="mx-auto flex max-w-4xl flex-col gap-4">
        <div className="rounded-3xl border border-white/5 bg-slate-900/60 p-4">
          <p className="text-xs text-slate-400">冒险</p>
          <h2 className="mt-2 text-xl font-semibold text-amber-200">
            章节选择
          </h2>
          <p className="mt-2 text-sm text-slate-300">
            选择一个章节进入路线规划；宝箱战胜利后将进入滑动决策（左滑卖/右滑装）。
          </p>
        </div>

        <div className="rounded-3xl border border-white/5 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between gap-3">
            <button
              aria-label="previous chapter"
              onClick={() => setIndex((p) => (p - 1 + chapters.length) % chapters.length)}
              className="rounded-2xl bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-200 transition active:scale-95"
            >
              ←
            </button>
            <div className="flex flex-1 flex-col items-center text-center">
              <p className="text-xs text-slate-400">{chapter.name}</p>
              <p className="text-lg font-semibold text-emerald-200">{chapter.subtitle}</p>
              <p className="mt-1 text-xs text-slate-400">{progressText}</p>
            </div>
            <button
              aria-label="next chapter"
              onClick={() => setIndex((p) => (p + 1) % chapters.length)}
              className="rounded-2xl bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-200 transition active:scale-95"
            >
              →
            </button>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-slate-200">
            <div className="rounded-2xl border border-white/5 bg-white/5 p-3">
              <p className="text-[11px] text-slate-400">Common</p>
              <p className="mt-1 text-sm font-semibold text-slate-100">
                {chapter.drops.common}%
              </p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/5 p-3">
              <p className="text-[11px] text-slate-400">Uncommon</p>
              <p className="mt-1 text-sm font-semibold text-emerald-200">
                {chapter.drops.uncommon}%
              </p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/5 p-3">
              <p className="text-[11px] text-slate-400">Rare</p>
              <p className="mt-1 text-sm font-semibold text-sky-200">
                {chapter.drops.rare}%
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            {runId ? (
              <button
                aria-label="continue run"
                onClick={onContinue}
                className="flex-1 rounded-2xl bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-200 transition active:scale-95"
              >
                继续当前冒险
              </button>
            ) : (
              <button
                aria-label="enter level"
                onClick={() => onEnter(chapter.id)}
                className="flex-1 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-900 transition active:scale-95"
              >
                ENTER LEVEL
              </button>
            )}
            <button
              aria-label="enter selected level"
              onClick={() => onEnter(chapter.id)}
              className="flex-1 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-slate-900 transition active:scale-95"
            >
              进入路线规划
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdventureHomeView;


