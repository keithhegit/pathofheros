import { useCallback, useEffect, useMemo, useState } from "react";
import AuthPanel from "./components/AuthPanel";
import BattlePanel from "./components/BattlePanel";
import EventDialog, { EventType } from "./components/EventDialog";
import MapView from "./components/MapView";
import SkillDraftPanel from "./components/SkillDraftPanel";
import SkillList from "./components/SkillList";
import UpgradePanel from "./pages/UpgradePanel";
import { apiFetchRun, apiPickSkill, apiRunSave } from "./lib/api";
import { equipmentSlots } from "./lib/equipment";
import { rollSkillOptions, SkillData } from "./lib/skills";
import { useRunStore } from "./state/runStore";

type Tab = "book" | "map";

const MAP_LAYERS = 12;
const EVENT_TYPES: EventType[] = ["START", "ENEMY", "CHEST", "FOUNTAIN", "REST", "BOSS"];

const App = () => {
  const [tab, setTab] = useState<Tab>("book");
  const [lastEvent, setLastEvent] = useState<string | null>(null);
  const [activeEvent, setActiveEvent] = useState<EventType | null>(null);
  const [pendingBattleEvent, setPendingBattleEvent] = useState<EventType | null>(null);
  const [battleEventType, setBattleEventType] = useState<EventType | null>(null);
  const [skillOptions, setSkillOptions] = useState<SkillData[] | null>(null);
  const [skillLoading, setSkillLoading] = useState(false);
  const [battleTrigger, setBattleTrigger] = useState(0);
  const [battleResult, setBattleResult] = useState<string | null>(null);
  const [eventSummary, setEventSummary] = useState<string | null>(null);
  const [chapterComplete, setChapterComplete] = useState(false);

  const setRun = useRunStore((state) => state.setRun);
  const learnSkill = useRunStore((state) => state.learnSkill);
  const runId = useRunStore((state) => state.runId);

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

  const handleLootEquip = useCallback(() => {
    persistRunToServer();
  }, [persistRunToServer]);

  const handleLootSell = useCallback(() => {
    persistRunToServer();
  }, [persistRunToServer]);

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
    if (eventType) {
      setBattleEventType(eventType);
    }
    setBattleTrigger((prev) => prev + 1);
  };

  const handleChapterReset = useCallback(async () => {
    setRun({ map: { layer: 0, node: 0 } });
    setChapterComplete(false);
    setEventSummary("新章节已解锁，继续探险！");
    await persistRunToServer();
  }, [persistRunToServer, setRun]);

  const battleResultBadge = useMemo(() => {
    if (!battleResult) return null;
    return (
      <div className="rounded-2xl bg-white/10 px-4 py-2 text-xs text-emerald-300">
        战斗回响：{battleResult}
      </div>
    );
  }, [battleResult]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-black px-4 py-6 text-white">
      <div className="mx-auto flex max-w-4xl flex-col gap-4">
        <AuthPanel />
        <nav className="flex flex-col gap-2 rounded-3xl border border-white/5 bg-slate-900/60 p-3 sm:flex-row sm:items-center">
          <div className="flex gap-3">
            <button
              aria-label="Book tab"
              onClick={() => setTab("book")}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition active:scale-95 ${
                tab === "book" ? "bg-amber-500 text-slate-900 shadow-lg" : "bg-slate-800 text-slate-200"
              }`}
            >
              Book (Upgrade)
            </button>
            <button
              aria-label="Map tab"
              onClick={() => setTab("map")}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition active:scale-95 ${
                tab === "map" ? "bg-emerald-500 text-slate-900 shadow-lg" : "bg-slate-800 text-slate-200"
              }`}
            >
              Map
            </button>
          </div>
          <div className="flex flex-1 flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-3">
            {lastEvent && (
              <span className="rounded-lg bg-white/10 px-3 py-1 text-xs text-slate-200">
                Last event: {lastEvent}
              </span>
            )}
            {eventSummary && (
              <span className="rounded-lg bg-white/10 px-3 py-1 text-xs text-emerald-200">
                {eventSummary}
              </span>
            )}
            <SkillList />
          </div>
        </nav>

        {tab === "book" ? (
          <UpgradePanel />
        ) : (
          <div className="flex flex-col gap-4 rounded-3xl border border-white/5 bg-slate-900/60 p-4 shadow-2xl">
            <h2 className="text-lg font-semibold text-emerald-200">Route Planning</h2>
            <MapView onEvent={handleEvent} />
            <p className="text-xs text-slate-400">
              点击当前层或下一层节点；事件由服务端返回，弹窗提示。战斗/掉落/技能将在后续阶段接入。
            </p>
            {battleResultBadge}
            <BattlePanel
              battleTrigger={battleTrigger}
              eventType={battleEventType ?? pendingBattleEvent}
              onBattleComplete={handleBattleComplete}
              onLootEquip={handleLootEquip}
              onLootSell={handleLootSell}
            />
            {chapterComplete && (
              <div className="rounded-2xl border border-amber-500 bg-amber-500/10 p-3 text-sm text-amber-300">
                <p>本章节已通关！</p>
                <button
                  onClick={handleChapterReset}
                  className="mt-2 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-3 py-1 text-xs font-semibold text-slate-900 transition active:scale-95"
                >
                  继续下一章节
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <EventDialog
        event={activeEvent}
        onClose={() => setActiveEvent(null)}
        onBattleRequest={() => handleBattleRequest(pendingBattleEvent)}
      />
      {skillOptions && (
        <SkillDraftPanel
          options={skillOptions}
          onPick={handleSkillPick}
          onTakeAll={handleTakeAll}
          onClose={() => setSkillOptions(null)}
          busy={skillLoading}
        />
      )}
    </div>
  );
};

export default App;
