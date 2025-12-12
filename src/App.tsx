import { useCallback, useEffect, useState } from "react";
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

const MAP_LAYERS = 12;
const EVENT_TYPES: EventType[] = ["START", "ENEMY", "CHEST", "FOUNTAIN", "REST", "BOSS"];

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
  const [battleOpen, setBattleOpen] = useState(false);
  const [battleEventType, setBattleEventType] = useState<EventType | null>(null);
  const [battleResult, setBattleResult] = useState<string | null>(null);
  const [eventSummary, setEventSummary] = useState<string | null>(null);
  const [chapterComplete, setChapterComplete] = useState(false);

  const setRun = useRunStore((state) => state.setRun);
  const learnSkill = useRunStore((state) => state.learnSkill);
  const runId = useRunStore((state) => state.runId);
  const userId = useRunStore((state) => state.userId);
  const username = useRunStore((state) => state.username);

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
                  map: fresh.map,
                  inventory: fresh.inventory || undefined,
                  skills: fresh.skills || []
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
        map: state.map,
        inventory: state.inventory,
        skills: state.skills
      }),
      (snapshot) => {
        localStorage.setItem("pathofkings_run", JSON.stringify(snapshot));
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
    };
  }, []);

  const handleSkillPick = async (skill: SkillData) => {
    if (!runId) return;
    setSkillLoading(true);
    try {
      await apiPickSkill(runId, skill);
      learnSkill(skill);
    } catch (error) {
      console.error(error);
    } finally {
      setSkillLoading(false);
      setSkillOptions(null);
    }
  };

  const handleTakeAll = async () => {
    if (!runId || !skillOptions) return;
    setSkillLoading(true);
    try {
      for (const skill of skillOptions) {
        await apiPickSkill(runId, skill);
        learnSkill(skill);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSkillLoading(false);
      setSkillOptions(null);
    }
  };

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

  const advanceMapProgress = useCallback(
    (eventType?: EventType | null) => {
      const state = useRunStore.getState();
      const current = state.map ?? { layer: 0, node: 0 };
      const nextLayer = Math.min(current.layer + 1, MAP_LAYERS - 1);
      const nextNode = eventType === "BOSS" ? 0 : current.node;
      const next = { layer: nextLayer, node: nextNode };
      setRun({ map: next });
      return next;
    },
    [setRun]
  );

  const handleBattleComplete = useCallback(
    async (summary: string, eventType?: EventType | null) => {
      setBattleResult(summary);
      setEventSummary(summary);
      if (eventType === "BOSS") {
        setChapterComplete(true);
      }
      advanceMapProgress(eventType ?? battleEventType ?? pendingBattleEvent);
      await persistRunToServer();
    },
    [advanceMapProgress, battleEventType, pendingBattleEvent, persistRunToServer]
  );

  const handleEvent = (event: string) => {
    setLastEvent(event);
    if (EVENT_TYPES.includes(event as EventType)) {
      const evt = event as EventType;
      setActiveEvent(evt);
      setPendingBattleEvent(evt);
    }
    if (event === "FOUNTAIN") {
      setSkillOptions(rollSkillOptions());
    }
  };

  const handleBattleRequest = (eventType?: EventType | null) => {
    setActiveEvent(null);
    const next = eventType ?? pendingBattleEvent ?? null;
    if (!next) return;
    setBattleEventType(next);
    setBattleOpen(true);
  };

  const handleBattleResolved = useCallback(
    async (summary: string, resolvedEventType: EventType | null, outcome: "victory" | "defeat") => {
      setBattleOpen(false);
      setBattleEventType(null);
      if (outcome === "victory") {
        await handleBattleComplete(summary, resolvedEventType);
        return;
      }
      setBattleResult(summary);
      setEventSummary(summary);
    },
    [handleBattleComplete]
  );

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
                onEnter={() => setAdventureStage("route")}
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
                  onTakeAll={handleTakeAll}
                  onCloseSkill={() => setSkillOptions(null)}
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
    </div>
  );
};

export default App;
