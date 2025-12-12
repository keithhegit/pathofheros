import { useCallback, useEffect, useRef, useState } from "react";
import AuthPanel from "./components/AuthPanel";
import BottomNav, { MainTabKey } from "./components/BottomNav";
import UpgradePanel from "./pages/UpgradePanel";
import { apiFetchRun, apiPickSkill, apiRunSave } from "./lib/api";
import { equipmentSlots } from "./lib/equipment";
import { rollSkillOptions, SkillData } from "./lib/skills";
import { useRunStore } from "./state/runStore";
import AuthScreen from "./views/AuthScreen";
import AdventureView from "./views/AdventureView";
import AdventureHomeView from "./views/AdventureHomeView";
import InventoryView from "./views/InventoryView";
import type { EventType } from "./components/EventDialog";
import { getChapter } from "./lib/chapters";
import MapCompleteOverlay from "./components/MapCompleteOverlay";
import { createTimedChest } from "./components/TimedChestSlots";
import ChestSettlementOverlay from "./components/ChestSettlementOverlay";
import { useRunStore as runStore } from "./state/runStore";

const EVENT_TYPES: EventType[] = ["START", "ENEMY", "CHEST", "FOUNTAIN", "REST", "BOSS", "ELITE"];

const App = () => {
  const [tab, setTab] = useState<MainTabKey>("adventure");
  const [adventureStage, setAdventureStage] = useState<"home" | "route">("home");
  const [selectedChapterId, setSelectedChapterId] = useState("chapter-1");
  const [authOpen, setAuthOpen] = useState(false);
  const [lastEvent, setLastEvent] = useState<string | null>(null);
  const [activeEvent, setActiveEvent] = useState<EventType | null>(null);
  const [pendingBattleEvent, setPendingBattleEvent] = useState<EventType | null>(null);
  const [skillOptions, setSkillOptions] = useState<SkillData[] | null>(null);
  const [skillLoading, setSkillLoading] = useState(false);
  const [skillTitle, setSkillTitle] = useState<string | null>(null);
  const [skillCanClose, setSkillCanClose] = useState(true);
  const [skillError, setSkillError] = useState<string | null>(null);
  const [battleOpen, setBattleOpen] = useState(false);
  const [battleEventType, setBattleEventType] = useState<EventType | null>(null);
  const [battleRewardMode, setBattleRewardMode] = useState<"loot" | "none">("loot");
  const [battleResult, setBattleResult] = useState<string | null>(null);
  const [eventSummary, setEventSummary] = useState<string | null>(null);
  const [chapterComplete, setChapterComplete] = useState(false);
  const [unlockedAct, setUnlockedAct] = useState(1);
  const [mapCompleteOpen, setMapCompleteOpen] = useState(false);

  const [chestSettlementOpen, setChestSettlementOpen] = useState<{
    title: string;
    equipmentRarityWeights?: { Common?: number; Uncommon?: number; Rare?: number; Epic?: number };
  } | null>(null);

  type RouteFlowKind = "FOUNTAIN" | "CHEST" | "REST" | "BOSS";
  type RouteFlowStep =
    | { type: "SKILL_DRAFT"; title: string; forced: boolean }
    | { type: "REST_HEAL" }
    | { type: "BATTLE"; eventType: EventType; rewardMode: "loot" | "none" }
    | { type: "ELITE_DECISION" }
    | { type: "CHEST_SETTLE"; title: string }
    | { type: "MAP_COMPLETE" };

  const [routeFlow, setRouteFlow] = useState<{ kind: RouteFlowKind; idx: number; steps: RouteFlowStep[] } | null>(
    null
  );

  const setRun = useRunStore((state) => state.setRun);
  const learnSkill = useRunStore((state) => state.learnSkill);
  const skills = useRunStore((state) => state.skills);
  const runId = useRunStore((state) => state.runId);
  const userId = useRunStore((state) => state.userId);
  const username = useRunStore((state) => state.username);
  const map = useRunStore((state) => state.map);
  const addTimedChest = useRunStore((state) => state.addTimedChest);
  const setCurrentHp = useRunStore((state) => state.setCurrentHp);
  const selectedChapter = getChapter(selectedChapterId);
  const mapLayers = selectedChapter.levels + 1;
  const currentDot = Math.min(selectedChapter.levels, Math.max(1, (map?.layer ?? 0) + 1));

  const startRouteFlow = (kind: RouteFlowKind) => {
    const steps: RouteFlowStep[] = [];
    if (kind === "FOUNTAIN") {
      steps.push({ type: "SKILL_DRAFT", title: "Fountain：继续获取技能（3选1）", forced: false });
      steps.push({ type: "BATTLE", eventType: "ENEMY", rewardMode: "none" });
      steps.push({ type: "CHEST_SETTLE", title: "Fountain Reward Chest" });
    }
    if (kind === "CHEST") {
      steps.push({ type: "BATTLE", eventType: "ENEMY", rewardMode: "none" });
      steps.push({ type: "ELITE_DECISION" });
      steps.push({ type: "BATTLE", eventType: "ELITE", rewardMode: "none" });
      steps.push({ type: "SKILL_DRAFT", title: "ELITE 胜利奖励：技能三选一", forced: true });
      steps.push({ type: "CHEST_SETTLE", title: "Chest Reward Chest" });
    }
    if (kind === "REST") {
      steps.push({ type: "REST_HEAL" });
      steps.push({ type: "BATTLE", eventType: "ENEMY", rewardMode: "none" });
      steps.push({ type: "CHEST_SETTLE", title: "Rest Reward Chest" });
    }
    if (kind === "BOSS") {
      steps.push({ type: "BATTLE", eventType: "ENEMY", rewardMode: "none" });
      steps.push({ type: "BATTLE", eventType: "BOSS", rewardMode: "none" });
      steps.push({ type: "CHEST_SETTLE", title: "Boss Reward Chest" });
      steps.push({ type: "MAP_COMPLETE" });
    }
    setRouteFlow({ kind, idx: 0, steps });
  };

  const advanceRouteFlow = () => {
    setRouteFlow((prev) => {
      if (!prev) return null;
      const nextIdx = prev.idx + 1;
      if (nextIdx >= prev.steps.length) return null;
      return { ...prev, idx: nextIdx };
    });
  };

  const endRouteFlow = () => {
    setRouteFlow(null);
    setActiveEvent(null);
    setPendingBattleEvent(null);
  };

  const currentFlowStep = routeFlow ? routeFlow.steps[routeFlow.idx] : null;
  const lastStepRef = useRef<string | null>(null);

  useEffect(() => {
    if (!routeFlow || !currentFlowStep) return;
    const stepKey = `${routeFlow.kind}:${routeFlow.idx}:${currentFlowStep.type}`;
    if (lastStepRef.current === stepKey) return;
    lastStepRef.current = stepKey;

    if (currentFlowStep.type === "SKILL_DRAFT") {
      setSkillTitle(currentFlowStep.title);
      setSkillCanClose(!currentFlowStep.forced);
      setSkillError(null);
      setSkillOptions(rollSkillOptions(3, runStore.getState().skills));
      return;
    }

    if (currentFlowStep.type === "REST_HEAL") {
      const maxHp = Math.max(1, runStore.getState().stats?.[1] ?? 100);
      const baseHp = runStore.getState().currentHp > 0 ? runStore.getState().currentHp : maxHp;
      const healed = Math.min(maxHp, Math.floor(baseHp + maxHp * 0.25));
      setCurrentHp(healed);
      setEventSummary(`Rest：恢复 +25% HP（${baseHp} → ${healed}）`);
      advanceRouteFlow();
      return;
    }

    if (currentFlowStep.type === "ELITE_DECISION") {
      setActiveEvent("ELITE");
      setPendingBattleEvent("ELITE");
      return;
    }

    if (currentFlowStep.type === "BATTLE") {
      setActiveEvent(null);
      setBattleRewardMode(currentFlowStep.rewardMode);
      setBattleEventType(currentFlowStep.eventType);
      setBattleOpen(true);
      return;
    }

    if (currentFlowStep.type === "CHEST_SETTLE") {
      setChestSettlementOpen({ title: currentFlowStep.title });
      return;
    }

    if (currentFlowStep.type === "MAP_COMPLETE") {
      setMapCompleteOpen(true);
      setUnlockedAct((prev) => Math.max(prev, selectedChapter.act + 1));
      endRouteFlow();
    }
  }, [advanceRouteFlow, currentFlowStep, endRouteFlow, routeFlow, selectedChapter.act, setCurrentHp]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem("pathofkings_unlocked_act");
    if (!raw) return;
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) setUnlockedAct(Math.floor(n));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("pathofkings_unlocked_act", String(unlockedAct));
  }, [unlockedAct]);

  useEffect(() => {
    if (!runId) return;
    const layer = map?.layer ?? 0;
    const dotIndex = layer; // layer 1..levels 对应 dots 的 1..levels
    if (dotIndex <= 0) return;
    if (!selectedChapter.chestDotIndexes.includes(dotIndex)) return;

    const key = `pathofkings_awarded_chest:${runId}:${selectedChapter.id}:${dotIndex}`;
    if (typeof window !== "undefined") {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, "1");
    }

    const roll = Math.random() * 100;
    const r =
      roll < selectedChapter.dropRates.rare
        ? "Rare"
        : roll < selectedChapter.dropRates.rare + selectedChapter.dropRates.uncommon
        ? "Uncommon"
        : "Common";
    addTimedChest(createTimedChest(r));
  }, [addTimedChest, map?.layer, runId, selectedChapter]);

  const routeGiftRef = useRef<{ runId: string | null; granted: boolean }>({
    runId: null,
    granted: false
  });

  useEffect(() => {
    if (routeGiftRef.current.runId !== runId) {
      routeGiftRef.current = { runId, granted: false };
    }
  }, [runId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem("pathofkings_chests");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        useRunStore.getState().setChestSlots(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (adventureStage !== "route") return;
    if (!runId) return;
    if (skills.length > 0) {
      routeGiftRef.current.granted = true;
      return;
    }
    if (skillOptions) return;
    if (routeGiftRef.current.granted) return;
    routeGiftRef.current.granted = true;
    setSkillTitle("Pick an ability!（首次进入路线奖励）");
    setSkillCanClose(false);
    setSkillError(null);
    setSkillOptions(rollSkillOptions(3, useRunStore.getState().skills));
  }, [adventureStage, runId, skills.length, skillOptions]);

  useEffect(() => {
    const storedUser = typeof window !== "undefined" ? localStorage.getItem("pathofkings_user") : null;
    if (storedUser) {
      try {
        const payload = JSON.parse(storedUser);
        setRun({ userId: payload.userId, username: payload.username });
      } catch {
        // ignore
      }
    }

    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("pathofkings_run");
      if (stored) {
        try {
          const snapshot = JSON.parse(stored);
          setRun(snapshot);
          if (snapshot?.runId) {
            apiFetchRun(snapshot.runId)
              .then((fresh) => {
                setRun({
                  runId: fresh.id,
                  playerId: fresh.playerId,
                  userId: fresh.userId,
                  gold: fresh.gold,
                  upgradeCost: fresh.upgradeCost,
                  stats: fresh.stats,
                  currentHp:
                    (snapshot as any)?.currentHp ??
                    (fresh.stats?.[1] ?? 100),
                  map: fresh.map,
                  inventory: fresh.inventory || undefined,
                  skills: (fresh.skills || []).map((s) => ({
                    ...s,
                    level: (s as any)?.level ?? 1,
                    maxLevel: (s as any)?.maxLevel ?? 5
                  }))
                });
              })
              .catch(() => {
                /* ignore */
              });
          }
        } catch {
          // ignore
        }
      }
    }
  }, [setRun]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const persistRun = useRunStore.subscribe(
      (state) => ({
        runId: state.runId,
        playerId: state.playerId,
        userId: state.userId,
        username: state.username,
        gold: state.gold,
        upgradeCost: state.upgradeCost,
        stats: state.stats,
        currentHp: state.currentHp,
        map: state.map,
        inventory: state.inventory,
        skills: state.skills
      }),
      (snapshot) => {
        localStorage.setItem("pathofkings_run", JSON.stringify(snapshot));
      }
    );

    const persistChests = useRunStore.subscribe(
      (state) => state.chestSlots,
      (slots) => {
        localStorage.setItem("pathofkings_chests", JSON.stringify(slots));
      }
    );

    const persistUser = useRunStore.subscribe(
      (state) => ({ userId: state.userId, username: state.username }),
      (user) => {
        if (user.userId) {
          localStorage.setItem("pathofkings_user", JSON.stringify(user));
        } else {
          localStorage.removeItem("pathofkings_user");
        }
      }
    );

    return () => {
      persistRun();
      persistUser();
      persistChests();
    };
  }, []);

  const handleSkillPick = async (skill: SkillData) => {
    if (!runId) return;
    setSkillLoading(true);
    setSkillError(null);
    try {
      const res = await apiPickSkill(runId, skill);
      const picked = res.skills.find((s) => s.id === skill.id) ?? skill;
      learnSkill(picked);
      setSkillOptions(null);
      setSkillTitle(null);
      setSkillCanClose(true);
      if (routeFlow && currentFlowStep?.type === "SKILL_DRAFT") {
        advanceRouteFlow();
      }
    } catch (error) {
      setSkillError(String(error));
    } finally {
      setSkillLoading(false);
    }
  };

  // 3-choice-1: 不再提供 Take All

  const persistRunToServer = useCallback(async () => {
    const state = useRunStore.getState();
    if (!state.runId) return;
    const payload = {
      runId: state.runId,
      gold: state.gold,
      upgradeCost: state.upgradeCost,
      stats: state.stats,
      map: state.map ?? { layer: 0, node: 0 },
      inventory: equipmentSlots
        .map((slot) => state.inventory[slot])
        .filter(Boolean),
      skills: state.skills
    };
    try {
      await apiRunSave(payload);
    } catch (error) {
      console.error("run save failed", error);
    }
  }, []);

  const handleBattleComplete = useCallback(
    async (summary: string, eventType?: EventType | null) => {
      setBattleResult(summary);
      setEventSummary(summary);
      if (eventType === "BOSS") {
        setChapterComplete(true);
      }
      await persistRunToServer();
    },
    [persistRunToServer]
  );

  const handleEvent = (event: string) => {
    setLastEvent(event);
    if (!EVENT_TYPES.includes(event as EventType)) return;
    const evt = event as EventType;

    if (evt === "FOUNTAIN" || evt === "CHEST" || evt === "REST" || evt === "BOSS") {
      setActiveEvent(null);
      setPendingBattleEvent(null);
      startRouteFlow(evt);
      return;
    }

    setActiveEvent(evt);
    setPendingBattleEvent(evt);
  };

  const handleBattleRequest = (eventType?: EventType | null) => {
    setActiveEvent(null);
    const next = eventType ?? pendingBattleEvent ?? null;
    if (!next) return;
    if (routeFlow && currentFlowStep?.type === "ELITE_DECISION" && next === "ELITE") {
      // 进入精英战斗由路线流程统一调度，确保 rewardMode/后续步骤一致
      advanceRouteFlow();
      return;
    }
    setBattleEventType(next);
    setBattleRewardMode("loot");
    setBattleOpen(true);
  };

  const handleBattleResolved = useCallback(
    async (summary: string, resolvedEventType: EventType | null, outcome: "victory" | "defeat") => {
      setBattleOpen(false);
      setBattleEventType(null);
      if (outcome === "victory") {
        await handleBattleComplete(summary, resolvedEventType);
        if (routeFlow) {
          advanceRouteFlow();
          return;
        }
        return;
      }
      setBattleResult(summary);
      setEventSummary(summary);
      if (routeFlow) endRouteFlow();
    },
    [advanceRouteFlow, endRouteFlow, handleBattleComplete, routeFlow]
  );

  const handleEliteRun = () => {
    setActiveEvent(null);
    setPendingBattleEvent(null);
    if (routeFlow && currentFlowStep?.type === "ELITE_DECISION") {
      setEventSummary("你选择撤退，避开了精英战斗。");
      advanceRouteFlow(); // 跳过 ELITE 战斗
      advanceRouteFlow(); // 跳过 ELITE 技能奖励
      return;
    }
    setEventSummary("你选择撤退，避开了精英战斗。");
  };

  const handleBattleClose = () => {
    setBattleOpen(false);
    setBattleEventType(null);
  };

  const handleChapterReset = useCallback(async () => {
    setRun({ map: { layer: 0, node: 0 } });
    setChapterComplete(false);
    setEventSummary("新章节已解锁，继续探险！");
    await persistRunToServer();
  }, [persistRunToServer, setRun]);

  if (!userId) return <AuthScreen />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-black text-white">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-slate-950/80 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          <div>
            <p className="text-xs text-slate-400">Path of Kings</p>
            <p className="text-sm text-slate-200">
              {username ? `已登录：${username}` : "已登录"}
              {lastEvent ? ` · 最近事件：${lastEvent}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {eventSummary && (
              <span className="hidden rounded-lg bg-white/10 px-3 py-1 text-xs text-emerald-200 sm:inline-flex">
                {eventSummary}
              </span>
            )}
            <button
              aria-label="account"
              onClick={() => setAuthOpen(true)}
              className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 transition active:scale-95"
            >
              账号
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        {tab === "inventory" ? (
          <InventoryView />
        ) : tab === "book" ? (
          <div className="h-full w-full overflow-y-auto px-4 pb-6">
            <div className="mx-auto max-w-4xl">
              <UpgradePanel />
            </div>
          </div>
        ) : (
          <>
            {adventureStage === "home" ? (
              <AdventureHomeView
                selectedId={selectedChapterId}
                onSelect={setSelectedChapterId}
                onEnter={() => {
                  setAdventureStage("route");
                }}
                unlockedAct={unlockedAct}
                currentDot={currentDot}
              />
            ) : (
              <div className="h-full w-full overflow-hidden">
                <div className="sticky top-0 z-30 border-b border-white/5 bg-slate-950/70 px-4 py-3 backdrop-blur">
                  <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-slate-400">路线规划</p>
                      <p className="text-sm text-slate-200">
                        {selectedChapterId === "chapter-2"
                          ? "Frostwood Rise"
                          : "Greenwood Trail"}
                      </p>
                    </div>
                    <button
                      aria-label="back to chapter select"
                      onClick={() => setAdventureStage("home")}
                      className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 transition active:scale-95"
                    >
                      返回章节
                    </button>
                  </div>
                </div>

                <AdventureView
                  lastEvent={lastEvent}
                  eventSummary={eventSummary}
                  battleResult={battleResult}
                  activeEvent={activeEvent}
                  pendingBattleEvent={pendingBattleEvent}
                  battleOpen={battleOpen}
                  battleEventType={battleEventType}
                  battleRewardMode={battleRewardMode}
                  chapterComplete={chapterComplete}
                  onEvent={handleEvent}
                  onCloseEvent={() => setActiveEvent(null)}
                  onBattleRequest={handleBattleRequest}
                  onBattleResolved={handleBattleResolved}
                  onBattleClose={handleBattleClose}
                  onChapterReset={handleChapterReset}
                  skillOptions={skillOptions}
                  skillLoading={skillLoading}
                  onSkillPick={handleSkillPick}
                  onCloseSkill={() => {
                    if (!skillCanClose) return;
                    setSkillOptions(null);
                    setSkillTitle(null);
                    setSkillError(null);
                  }}
                  skillTitle={skillTitle}
                  onEliteRun={handleEliteRun}
                  skillCanClose={skillCanClose}
                  skillError={skillError}
                  mapLayers={mapLayers}
                />
              </div>
            )}
          </>
        )}
      </main>

      <BottomNav
        value={tab}
        onChange={(next) => {
          setTab(next);
          if (next === "adventure") {
            setAdventureStage((prev) => prev);
          }
        }}
      />

      {authOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-xl">
            <div className="mb-3 flex justify-end">
              <button
                aria-label="close account"
                onClick={() => setAuthOpen(false)}
                className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 transition active:scale-95"
              >
                关闭
              </button>
            </div>
            <AuthPanel />
          </div>
        </div>
      )}

      {mapCompleteOpen && (
        <MapCompleteOverlay
          chapterTitle={`Chapter ${selectedChapter.act} · ${selectedChapter.title}`}
          dropRates={selectedChapter.dropRates}
          checkpoints={selectedChapter.levels}
          chestDotIndexes={selectedChapter.chestDotIndexes}
          onClose={() => {
            setMapCompleteOpen(false);
            setAdventureStage("home");
          }}
        />
      )}

      {chestSettlementOpen && (
        <ChestSettlementOverlay
          title={chestSettlementOpen.title}
          equipmentRarityWeights={{
            Common: Math.max(0, selectedChapter.dropRates.common / 100),
            Uncommon: Math.max(0, selectedChapter.dropRates.uncommon / 100),
            Rare: Math.max(0, selectedChapter.dropRates.rare / 100),
            Epic: 0
          }}
          onDone={(summary) => {
            setChestSettlementOpen(null);
            setEventSummary(summary);
            if (routeFlow) {
              advanceRouteFlow();
              return;
            }
          }}
        />
      )}
    </div>
  );
};

export default App;
