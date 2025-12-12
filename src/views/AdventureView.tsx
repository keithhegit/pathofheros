import BattlePanel from "../components/BattlePanel";
import EventDialog, { EventType } from "../components/EventDialog";
import MapView from "../components/MapView";
import SkillDraftPanel from "../components/SkillDraftPanel";
import { SkillData } from "../lib/skills";

type Props = {
  lastEvent: string | null;
  eventSummary: string | null;
  battleResult: string | null;
  activeEvent: EventType | null;
  pendingBattleEvent: EventType | null;
  battleOpen: boolean;
  battleEventType: EventType | null;
  chapterComplete: boolean;
  onEvent: (event: string) => void;
  onCloseEvent: () => void;
  onBattleRequest: (eventType?: EventType | null) => void;
  onBattleResolved: (summary: string, eventType: EventType | null, outcome: "victory" | "defeat") => void;
  onBattleClose: () => void;
  onChapterReset: () => void;
  skillOptions: SkillData[] | null;
  skillLoading: boolean;
  onSkillPick: (skill: SkillData) => void;
  onTakeAll: () => void;
  onCloseSkill: () => void;
};

const AdventureView = ({
  battleResult,
  activeEvent,
  pendingBattleEvent,
  battleOpen,
  battleEventType,
  chapterComplete,
  onEvent,
  onCloseEvent,
  onBattleRequest,
  onBattleResolved,
  onBattleClose,
  onChapterReset,
  skillOptions,
  skillLoading,
  onSkillPick,
  onTakeAll,
  onCloseSkill
}: Props) => {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="h-full w-full overflow-y-auto px-4 pb-6">
        <div className="mx-auto flex max-w-4xl flex-col gap-4">
          <div className="rounded-3xl border border-white/5 bg-slate-900/60 p-4 shadow-2xl">
            <h2 className="text-lg font-semibold text-emerald-200">路线规划</h2>
            <div className="mt-3">
              <MapView onEvent={onEvent} />
            </div>
            {battleResult && (
              <div className="mt-4 rounded-2xl bg-white/10 px-4 py-2 text-xs text-emerald-300">
                战斗回响：{battleResult}
              </div>
            )}
            {chapterComplete && (
              <div className="mt-4 rounded-2xl border border-amber-500 bg-amber-500/10 p-3 text-sm text-amber-300">
                <p>本章节已通关！</p>
                <button
                  onClick={onChapterReset}
                  className="mt-2 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-3 py-1 text-xs font-semibold text-slate-900 transition active:scale-95"
                >
                  继续下一章节
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <EventDialog
        event={activeEvent}
        onClose={onCloseEvent}
        onBattleRequest={() => onBattleRequest(pendingBattleEvent)}
      />

      {battleOpen && battleEventType && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur">
          <div className="mx-auto flex h-full max-w-4xl flex-col px-4 py-6">
            <BattlePanel
              eventType={battleEventType}
              onResolved={(summary, eventType, outcome) => onBattleResolved(summary, eventType, outcome)}
              onClose={onBattleClose}
            />
          </div>
        </div>
      )}

      {skillOptions && (
        <SkillDraftPanel
          options={skillOptions}
          onPick={onSkillPick}
          onTakeAll={onTakeAll}
          onClose={onCloseSkill}
          busy={skillLoading}
        />
      )}
    </div>
  );
};

export default AdventureView;


