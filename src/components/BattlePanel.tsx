import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { generateEquipment } from "../lib/equipment";
import { useRunStore } from "../state/runStore";
import InventoryGrid from "./InventoryGrid";
import LootCompare from "./LootCompare";
import SwipeDecisionCard from "./SwipeDecisionCard";
import type { EventType } from "./EventDialog";

const enemyNames = ["Goblin", "Bandit", "Specter", "Dire Wolf", "Stone Sentinel"];

type Props = {
  eventType: EventType;
  onResolved: (summary: string, eventType: EventType | null, outcome: "victory" | "defeat") => void;
  onClose: () => void;
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

const BattlePanel = ({ eventType, onResolved, onClose }: Props) => {
  const runId = useRunStore((state) => state.runId);
  const inventory = useRunStore((state) => state.inventory);
  const equipItem = useRunStore((state) => state.equipItem);
  const addGold = useRunStore((state) => state.addGold);
  const gold = useRunStore((state) => state.gold);
  const skills = useRunStore((state) => state.skills);
  const stats = useRunStore((state) => state.stats);
  const map = useRunStore((state) => state.map);

  const [enemyName, setEnemyName] = useState(enemyNames[0]);
  const [enemyMaxHp, setEnemyMaxHp] = useState(120);
  const [enemyHp, setEnemyHp] = useState(120);
  const [playerMaxHp, setPlayerMaxHp] = useState(100);
  const [playerHp, setPlayerHp] = useState(100);
  const [phase, setPhase] = useState<"fighting" | "loot" | "defeat">("fighting");
  const [message, setMessage] = useState("战斗开始");
  const [loot, setLoot] = useState<ReturnType<typeof generateEquipment> | null>(null);
  const [skillTrigger, setSkillTrigger] = useState<string | null>(null);

  const playerHpRef = useRef<number>(100);
  const enemyHpRef = useRef<number>(120);
  const timersRef = useRef<{ player?: ReturnType<typeof setInterval>; enemy?: ReturnType<typeof setInterval> }>({});

  const currentLoot = useMemo(() => {
    if (!loot) return null;
    return inventory[loot.slot];
  }, [inventory, loot]);

  useEffect(() => {
    const stopTimers = () => {
      if (timersRef.current.player) clearInterval(timersRef.current.player);
      if (timersRef.current.enemy) clearInterval(timersRef.current.enemy);
      timersRef.current = {};
    };

    if (!runId) {
      setPhase("defeat");
      setMessage("Run 未就绪：请先创建 Run");
      return () => stopTimers();
    }

    const layer = map?.layer ?? 0;
    const isBoss = eventType === "BOSS";
    const baseEnemyHp = isBoss ? 260 + layer * 40 : 120 + layer * 20;
    const baseEnemyAtk = isBoss ? 18 + layer * 3 : 10 + layer * 2;
    const enemyAtkMs = isBoss ? 850 : 1050;

    const maxHp = Math.max(1, stats?.[1] ?? 100);
    const selectionName = isBoss
      ? "Boss"
      : enemyNames[Math.floor(Math.random() * enemyNames.length)];

    setPhase("fighting");
    setLoot(null);
    setEnemyName(selectionName);
    setEnemyMaxHp(baseEnemyHp);
    setEnemyHp(baseEnemyHp);
    enemyHpRef.current = baseEnemyHp;

    setPlayerMaxHp(maxHp);
    setPlayerHp(maxHp);
    playerHpRef.current = maxHp;

    const triggeredSkill = skills.length
      ? skills[Math.floor(Math.random() * skills.length)].name
      : null;
    setSkillTrigger(triggeredSkill);
    setMessage(triggeredSkill ? `战斗中... 技能「${triggeredSkill}」触发` : "战斗中...");

    const damage = Math.max(1, stats?.[0] ?? 10);
    const atkSpeed = stats?.[2] ?? 10;
    const armor = stats?.[3] ?? 0;
    const crit = stats?.[4] ?? 0;
    const dodge = stats?.[6] ?? 0;
    const lifesteal = stats?.[8] ?? 0;

    const playerAtkMs = clamp(900 - atkSpeed * 6, 220, 900);

    stopTimers();

    timersRef.current.player = setInterval(() => {
      const isCrit = Math.random() < clamp(crit / 100, 0, 0.75);
      const roll = 0.85 + Math.random() * 0.3;
      const dealt = Math.max(1, Math.floor(damage * roll)) * (isCrit ? 2 : 1);
      const nextEnemy = enemyHpRef.current - dealt;
      enemyHpRef.current = Math.max(0, nextEnemy);
      setEnemyHp(enemyHpRef.current);

      if (lifesteal > 0) {
        const heal = Math.floor(dealt * clamp(lifesteal / 100, 0, 0.3));
        if (heal > 0) {
          const nextHp = clamp(playerHpRef.current + heal, 0, maxHp);
          playerHpRef.current = nextHp;
          setPlayerHp(nextHp);
        }
      }

      if (enemyHpRef.current <= 0) {
        stopTimers();
        const drop = generateEquipment();
        setLoot(drop);
        setPhase("loot");
        setMessage(`胜利！掉落 ${drop.rarity} ${drop.name}（左滑卖/右滑装）`);
      }
    }, playerAtkMs);

    timersRef.current.enemy = setInterval(() => {
      const dodged = Math.random() < clamp(dodge / 100, 0, 0.6);
      if (dodged) return;
      const reduction = armor <= 0 ? 0 : armor / (armor + 100);
      const taken = Math.max(1, Math.floor(baseEnemyAtk * (1 - reduction)));
      const nextHp = playerHpRef.current - taken;
      playerHpRef.current = Math.max(0, nextHp);
      setPlayerHp(playerHpRef.current);
      if (playerHpRef.current <= 0) {
        stopTimers();
        setPhase("defeat");
        setMessage("战败！返回路线规划继续准备。");
      }
    }, enemyAtkMs);

    return () => stopTimers();
  }, [runId, eventType, map?.layer, skills, stats]);

  const handleEquip = () => {
    if (!loot) return;
    equipItem(loot);
    const summaryBase = `击败 ${enemyName} 获得 ${loot.rarity} ${loot.name}（已装备）`;
    const summary = skillTrigger ? `${summaryBase}（技能 ${skillTrigger} 触发）` : summaryBase;
    onResolved(summary, eventType, "victory");
    onClose();
  };

  const handleSell = () => {
    if (!loot) return;
    addGold(loot.saleValue);
    const summaryBase = `击败 ${enemyName} 获得 ${loot.rarity} ${loot.name}（已出售 +${loot.saleValue}G）`;
    const summary = skillTrigger ? `${summaryBase}（技能 ${skillTrigger} 触发）` : summaryBase;
    onResolved(summary, eventType, "victory");
    onClose();
  };

  return (
    <div className="flex h-full flex-col gap-4 rounded-3xl border border-white/5 bg-slate-900/80 p-5 shadow-2xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-slate-400">战斗</p>
          <h3 className="text-lg font-semibold text-amber-200">{enemyName}</h3>
          <p className="mt-1 text-[11px] text-slate-400">{message}</p>
        </div>
        {(phase === "loot" || phase === "defeat") && (
          <button
            aria-label="back to route"
            onClick={() => {
              if (phase === "defeat") {
                const summaryBase = `挑战 ${enemyName} 失败`;
                const summary = skillTrigger ? `${summaryBase}（技能 ${skillTrigger} 触发）` : summaryBase;
                onResolved(summary, eventType, "defeat");
              }
              onClose();
            }}
            className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 transition active:scale-95"
          >
            返回路线
          </button>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>我方 HP</span>
            <span className="font-semibold text-emerald-200">
              {playerHp}/{playerMaxHp}
            </span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-slate-800">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-200"
              animate={{
                width: `${Math.max(0, Math.min(100, playerMaxHp ? (playerHp / playerMaxHp) * 100 : 0))}%`
              }}
              initial={false}
              transition={{ ease: "easeOut", duration: 0.25 }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>敌方 HP</span>
            <span className="font-semibold text-amber-200">
              {enemyHp}/{enemyMaxHp}
            </span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-slate-800">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-rose-400"
              animate={{
                width: `${Math.max(0, Math.min(100, enemyMaxHp ? (enemyHp / enemyMaxHp) * 100 : 0))}%`
              }}
              initial={false}
              transition={{ ease: "easeOut", duration: 0.25 }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1">
        {loot ? (
          <div className="space-y-3">
            <SwipeDecisionCard onSwipeLeft={handleSell} onSwipeRight={handleEquip}>
              <div className="space-y-3">
                <LootCompare drop={loot} current={currentLoot} />
                <p className="text-[11px] text-slate-500">
                  左滑：出售 +{loot.saleValue}G ｜ 右滑：装备替换当前槽位
                </p>
              </div>
            </SwipeDecisionCard>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/5 bg-white/5 p-4 text-xs text-slate-300">
            {phase === "fighting" ? "战斗进行中..." : "暂无掉落"}
          </div>
        )}
      </div>

      <div className="mt-6">
        <p className="text-[11px] uppercase tracking-wide text-slate-500">当前装备</p>
        <InventoryGrid />
      </div>

      <p className="mt-3 text-[11px] text-slate-500">Gold: {gold}</p>
    </div>
  );
};

export default BattlePanel;

