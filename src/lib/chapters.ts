export type ChapterConfig = {
  id: string;
  act: number;
  title: string;
  subtitle: string;
  levels: number; // 不含起点，最后一个点通常可视作 Boss
  chestDotIndexes: number[]; // 1..levels
  dropRates: { common: number; uncommon: number; rare: number };
};

export const chapters: ChapterConfig[] = [
  {
    id: "chapter-1",
    act: 1,
    title: "Grassland Ruins",
    subtitle: "Act 1 · 3 关 · 1 个宝箱位（中段）",
    levels: 3,
    chestDotIndexes: [2],
    dropRates: { common: 95, uncommon: 5, rare: 0 }
  },
  {
    id: "chapter-2",
    act: 2,
    title: "Frostwood Rise",
    subtitle: "Act 2 · 6 关 · 2 个宝箱位",
    levels: 6,
    chestDotIndexes: [2, 5],
    dropRates: { common: 80, uncommon: 19, rare: 1 }
  },
  {
    id: "chapter-3",
    act: 3,
    title: "Duskfang Grove",
    subtitle: "Act 3 · 9 关 · 3 个宝箱位",
    levels: 9,
    chestDotIndexes: [2, 5, 8],
    dropRates: { common: 60, uncommon: 35, rare: 5 }
  },
  {
    id: "chapter-4",
    act: 4,
    title: "Amberfall Plateau",
    subtitle: "Act 4 · 12 关 · 4 个宝箱位（需先通关前一章）",
    levels: 12,
    chestDotIndexes: [2, 5, 8, 11],
    dropRates: { common: 0, uncommon: 80, rare: 20 }
  }
];

export const getChapter = (id: string): ChapterConfig => chapters.find((c) => c.id === id) ?? chapters[0];


