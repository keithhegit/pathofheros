import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { generateEquipment } from "../lib/equipment";
import { useRunStore } from "../state/runStore";
import InventoryGrid from "./InventoryGrid";
import ChestFoundOverlay from "./ChestFoundOverlay";
import LootRewardOverlay from "./LootRewardOverlay";
import type { EventType } from "./EventDialog";

const enemyNames = ["Goblin", "Bandit", "Specter", "Dire Wolf", "Stone Sentinel"];

type Props = {
  eventType: EventType;
  rewardMode?: "loot" | "none";
  onResolved: (summary: string, eventType: EventType | null, outcome: "victory" | "defeat") => void;
  onClose: () => void;
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

type SkillEffects = {
  thunderChance: number;
  thunderBonusDamage: number;
  lifestealPerHitPctOfMaxHp: number;
  armorBonus: number;
  atkSpeedBonusPct: number;
  flatBonusDamage: number;
  regenPer5s: number;
};

const getSkillEffects = (skills: Array<{ id: number; level?: number }>): SkillEffects => {
  const clampLv = (lv: number) => clamp(Math.floor(lv || 1), 1, 5);

  const effects: SkillEffects = {
    thunderChance: 0,
    thunderBonusDamage: 0,
    lifestealPerHitPctOfMaxHp: 0,
    armorBonus: 0,
    atkSpeedBonusPct: 0,
    flatBonusDamage: 0,
    regenPer5s: 0
  };

  for (const s of skills) {
    const lv = clampLv(s.level ?? 1);
    if (s.id === 101) {
      const chance = [0.12, 0.16, 0.2, 0.24, 0.28][lv - 1];
      const dmg = [8, 12, 16, 20, 24][lv - 1];
      effects.thunderChance = Math.max(effects.thunderChance, chance);
      effects.thunderBonusDamage = Math.max(effects.thunderBonusDamage, dmg);
    }
    if (s.id === 102) {
      effects.lifestealPerHitPctOfMaxHp += [0.02, 0.03, 0.04, 0.05, 0.06][lv - 1];
    }
    if (s.id === 103) {
      effects.armorBonus += [6, 9, 12, 15, 18][lv - 1];
    }
    if (s.id === 104) {
      effects.atkSpeedBonusPct += [0.06, 0.08, 0.1, 0.12, 0.14][lv - 1];
    }
    if (s.id === 105) {
      effects.flatBonusDamage += [10, 14, 18, 22, 26][lv - 1];
    }
    if (s.id === 106) {
      effects.regenPer5s += [10, 14, 18, 22, 26][lv - 1];
    }
  }

  return effects;
};

const BattlePanel = ({ eventType, rewardMode = "loot", onResolved, onClose }: Props) => {
  const runId = useRunStore((state) => state.runId);
  const inventory = useRunStore((state) => state.inventory);
  const equipItem = useRunStore((state) => state.equipItem);
  const addGold = useRunStore((state) => state.addGold);
  const setCurrentHp = useRunStore((state) => state.setCurrentHp);
  const gold = useRunStore((state) => state.gold);
  const skills = useRunStore((state) => state.skills);
  const stats = useRunStore((state) => state.stats);
  const map = useRunStore((state) => state.map);
  const currentHp = useRunStore((state) => state.currentHp);

  const [enemyName, setEnemyName] = useState(enemyNames[0]);
  const [enemyMaxHp, setEnemyMaxHp] = useState(120);
  const [enemyHp, setEnemyHp] = useState(120);
  const [playerMaxHp, setPlayerMaxHp] = useState(100);
  const [playerHp, setPlayerHp] = useState(100);
  const [phase, setPhase] = useState<"fighting" | "chest_found" | "loot" | "defeat">("fighting");
  const [message, setMessage] = useState("战斗开始");
  const [loot, setLoot] = useState<ReturnType<typeof generateEquipment> | null>(null);
  const [skillTrigger, setSkillTrigger] = useState<string | null>(null);
  const [chestGoldReward, setChestGoldReward] = useState(0);
  const [playerAttackTick, setPlayerAttackTick] = useState(0);
  const [enemyAttackTick, setEnemyAttackTick] = useState(0);

  const onResolvedRef = useRef(onResolved);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onResolvedRef.current = onResolved;
    onCloseRef.current = onClose;
  }, [onResolved, onClose]);

  const playerHpRef = useRef<number>(100);
  const enemyHpRef = useRef<number>(120);
  const timersRef = useRef<{
    player?: ReturnType<typeof setInterval>;
    enemy?: ReturnType<typeof setInterval>;
    regen?: ReturnType<typeof setInterval>;
  }>({});

  const currentLoot = useMemo(() => {
    if (!loot) return null;
    return inventory[loot.slot];
  }, [inventory, loot]);

  useEffect(() => {
    const stopTimers = () => {
      if (timersRef.current.player) clearInterval(timersRef.current.player);
      if (timersRef.current.enemy) clearInterval(timersRef.current.enemy);
      if (timersRef.current.regen) clearInterval(timersRef.current.regen);
      timersRef.current = {};
    };

    if (!runId) {
      setPhase("defeat");
      setMessage("Run 未就绪：请先创建 Run");
      return () => stopTimers();
    }

    const layer = map?.layer ?? 0;
    const isBoss = eventType === "BOSS";
    const isElite = eventType === "ELITE";
    const baseEnemyHp = isBoss ? 220 + layer * 30 : 100 + layer * 15;
    const baseEnemyAtk = isBoss ? 12 + layer * 2 : 6 + layer * 1;
    const enemyAtkMs = isBoss ? 950 : 1250;
    const tunedEnemyHp = Math.floor(baseEnemyHp * (isElite ? 1.35 : 1));
    const tunedEnemyAtk = Math.floor(baseEnemyAtk * (isElite ? 1.25 : 1));

    const maxHp = Math.max(1, stats?.[1] ?? 100);
    const startHp = clamp(currentHp > 0 ? currentHp : maxHp, 1, maxHp);
    const selectionName = isBoss
      ? "Boss"
      : enemyNames[Math.floor(Math.random() * enemyNames.length)];

    setPhase("fighting");
    setLoot(null);
    setEnemyName(selectionName);
    setEnemyMaxHp(tunedEnemyHp);
    setEnemyHp(tunedEnemyHp);
    enemyHpRef.current = tunedEnemyHp;

    setPlayerMaxHp(maxHp);
    setPlayerHp(startHp);
    playerHpRef.current = startHp;

    const triggeredSkill = skills.length
      ? skills[Math.floor(Math.random() * skills.length)].name
      : null;
    setSkillTrigger(triggeredSkill);
    setMessage(triggeredSkill ? `战斗中... 技能「${triggeredSkill}」触发` : "战斗中...");

    const damage = Math.max(1, stats?.[0] ?? 10);
    const atkSpeed = stats?.[2] ?? 10;
    const skillEffects = getSkillEffects(skills);
    const armor = (stats?.[3] ?? 0) + skillEffects.armorBonus;
    const crit = stats?.[4] ?? 0;
    const dodge = stats?.[6] ?? 0;
    const lifesteal = stats?.[8] ?? 0;

    const rawPlayerAtkMs = clamp(900 - atkSpeed * 6, 220, 900);
    const playerAtkMs = clamp(rawPlayerAtkMs * (1 - clamp(skillEffects.atkSpeedBonusPct, 0, 0.6)), 180, 900);

    stopTimers();

    timersRef.current.player = setInterval(() => {
      setPlayerAttackTick((t) => t + 1);
      const isCrit = Math.random() < clamp(crit / 100, 0, 0.75);
      const roll = 0.85 + Math.random() * 0.3;
      const thunder = skillEffects.thunderChance > 0 && Math.random() < skillEffects.thunderChance;
      const thunderBonus = thunder ? skillEffects.thunderBonusDamage : 0;
      const dealtBase = Math.max(1, Math.floor(damage * roll)) * (isCrit ? 2 : 1);
      const dealt = dealtBase + skillEffects.flatBonusDamage + thunderBonus;
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

      if (skillEffects.lifestealPerHitPctOfMaxHp > 0) {
        const extraHeal = Math.floor(maxHp * clamp(skillEffects.lifestealPerHitPctOfMaxHp, 0, 0.5));
        if (extraHeal > 0) {
          const nextHp = clamp(playerHpRef.current + extraHeal, 0, maxHp);
          playerHpRef.current = nextHp;
          setPlayerHp(nextHp);
        }
      }

      if (thunder) {
        setSkillTrigger("雷霆突刺");
      }

      if (enemyHpRef.current <= 0) {
        stopTimers();
        setCurrentHp(playerHpRef.current);

        if (rewardMode === "none") {
          const summaryBase = `击败 ${enemyName}（无掉落）`;
          const summary = skillTrigger ? `${summaryBase}（技能 ${skillTrigger} 触发）` : summaryBase;
          onResolvedRef.current(summary, eventType, "victory");
          onCloseRef.current();
          return;
        }
        const drop = generateEquipment();
        if (eventType === "CHEST") {
          const reward = 40 + Math.floor(Math.random() * 50) + layer * 6;
          setChestGoldReward(reward);
          addGold(reward);
        } else {
          setChestGoldReward(0);
        }
        setLoot(drop);
        if (eventType === "CHEST") {
          setPhase("chest_found");
          setMessage("宝箱战胜利！");
        } else {
          setPhase("loot");
          setMessage("胜利！");
        }
      }
    }, playerAtkMs);

    timersRef.current.enemy = setInterval(() => {
      setEnemyAttackTick((t) => t + 1);
      const dodged = Math.random() < clamp(dodge / 100, 0, 0.6);
      if (dodged) return;
      const reduction = armor <= 0 ? 0 : armor / (armor + 100);
      const taken = Math.max(1, Math.floor(tunedEnemyAtk * (1 - reduction)));
      const nextHp = playerHpRef.current - taken;
      playerHpRef.current = Math.max(0, nextHp);
      setPlayerHp(playerHpRef.current);
      if (playerHpRef.current <= 0) {
        stopTimers();
        setCurrentHp(0);
        setPhase("defeat");
        setMessage("战败！返回路线规划继续准备。");
      }
    }, enemyAtkMs);

    if (skillEffects.regenPer5s > 0) {
      timersRef.current.regen = setInterval(() => {
        const nextHp = clamp(playerHpRef.current + skillEffects.regenPer5s, 0, maxHp);
        if (nextHp !== playerHpRef.current) {
          playerHpRef.current = nextHp;
          setPlayerHp(nextHp);
          setSkillTrigger("再生庇护");
        }
      }, 5000);
    }

    return () => stopTimers();
  }, [runId, eventType, map?.layer, skills, stats, currentHp, rewardMode, addGold, setCurrentHp]);

  const handleEquip = () => {
    if (!loot) return;
    equipItem(loot);
    setCurrentHp(playerHpRef.current);
    const extra = chestGoldReward > 0 ? `，金币 +${chestGoldReward}` : "";
    const summaryBase = `击败 ${enemyName}${extra}，获得 ${loot.rarity} ${loot.name}（已装备）`;
    const summary = skillTrigger ? `${summaryBase}（技能 ${skillTrigger} 触发）` : summaryBase;
    onResolvedRef.current(summary, eventType, "victory");
    onCloseRef.current();
  };

  const handleSell = () => {
    if (!loot) return;
    addGold(loot.saleValue);
    setCurrentHp(playerHpRef.current);
    const extra = chestGoldReward > 0 ? `，金币 +${chestGoldReward}` : "";
    const summaryBase = `击败 ${enemyName}${extra}，获得 ${loot.rarity} ${loot.name}（已出售 +${loot.saleValue}G）`;
    const summary = skillTrigger ? `${summaryBase}（技能 ${skillTrigger} 触发）` : summaryBase;
    onResolvedRef.current(summary, eventType, "victory");
    onCloseRef.current();
  };

  return (
    <div className="flex h-full flex-col gap-4 rounded-3xl border border-white/5 bg-slate-900/80 p-5 shadow-2xl">
      {/* Top: Monster combat */}
      <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-slate-950/40 to-slate-950/10 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-slate-400">Battle</p>
            <h3 className="text-lg font-semibold text-amber-200">
              {enemyName}
              {eventType === "ELITE" ? " · ELITE" : ""}
              {eventType === "BOSS" ? " · BOSS" : ""}
            </h3>
            <p className="mt-1 text-[11px] text-slate-400">{message}</p>
          </div>
          {phase === "defeat" && (
            <button
              aria-label="back to route"
              onClick={() => {
                const summaryBase = `挑战 ${enemyName} 失败`;
                const summary = skillTrigger ? `${summaryBase}（技能 ${skillTrigger} 触发）` : summaryBase;
              setCurrentHp(0);
              onResolvedRef.current(summary, eventType, "defeat");
              onCloseRef.current();
              }}
              className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 transition active:scale-95"
            >
              返回路线
            </button>
          )}
        </div>

        <div className="mt-3 grid gap-3">
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

        <div className="relative mt-4 h-40 overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-b from-slate-900/40 to-slate-950/10">
          {/* monster placeholder */}
          <motion.div
            className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/10 bg-amber-500/10"
            animate={{ rotate: playerAttackTick % 2 === 0 ? 0 : 1, x: playerAttackTick % 2 === 0 ? "-50%" : "calc(-50% + 2px)" }}
            transition={{ duration: 0.08 }}
          >
            <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-amber-200">
              MONSTER
            </div>
          </motion.div>

          {/* left hand */}
          <motion.div
            className="absolute bottom-2 left-6 h-10 w-10 rounded-2xl bg-emerald-400/20"
            animate={
              playerAttackTick % 2 === 0
                ? { x: 32, rotate: -18, scale: 1.05 }
                : { x: 0, rotate: 0, scale: 1 }
            }
            transition={{ duration: 0.12 }}
          />
          {/* right hand */}
          <motion.div
            className="absolute bottom-2 right-6 h-10 w-10 rounded-2xl bg-emerald-400/20"
            animate={
              playerAttackTick % 2 === 1
                ? { x: -32, rotate: 18, scale: 1.05 }
                : { x: 0, rotate: 0, scale: 1 }
            }
            transition={{ duration: 0.12 }}
          />

          {/* enemy attack cue */}
          <motion.div
            className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-rose-500/20 px-3 py-1 text-[11px] text-rose-200"
            animate={{ opacity: enemyAttackTick % 2 === 0 ? 0.35 : 0.75 }}
            transition={{ duration: 0.15 }}
          >
            {eventType === "ELITE" ? "ELITE STRIKE" : "ENEMY STRIKE"}
          </motion.div>
        </div>
      </div>

      {/* Middle: Skill bar */}
      <div className="rounded-3xl border border-white/10 bg-slate-950/30 p-4">
        <p className="text-[11px] uppercase tracking-wide text-slate-500">Skills</p>
        <div className="mt-3 grid grid-cols-5 gap-2">
          {Array.from({ length: 5 }).map((_, idx) => {
            const skill = skills[idx];
            return (
              <button
                key={idx}
                aria-label={skill ? `skill ${skill.name}` : "empty skill slot"}
                disabled={!skill}
                className={`flex h-14 flex-col items-center justify-center rounded-2xl border text-[10px] transition active:scale-95 ${
                  skill
                    ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
                    : "border-slate-800 bg-slate-900/40 text-slate-500"
                }`}
              >
                <span className="text-xs font-semibold">{skill ? skill.name.slice(0, 2) : "+"}</span>
                <span className="mt-0.5 text-[10px]">
                  {skill ? `Lv.${skill.level}` : "Empty"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1">
        {loot ? (
          <div className="flex h-full items-center justify-center">
            {eventType === "CHEST" && phase === "chest_found" ? (
              <ChestFoundOverlay
                goldReward={chestGoldReward}
                drop={loot}
                onContinue={() => setPhase("loot")}
              />
            ) : (
              <LootRewardOverlay
                drop={loot}
                current={currentLoot}
                onEquip={handleEquip}
                onSell={handleSell}
                sellGold={loot.saleValue}
                title={eventType === "CHEST" ? "NEW GEAR FOUND!" : "NEW GEAR FOUND!"}
              />
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/5 bg-white/5 p-4 text-xs text-slate-300">
            {phase === "fighting" ? "战斗进行中..." : "暂无掉落"}
          </div>
        )}
      </div>

      {/* Bottom: Equipped gear */}
      <div className="mt-2 rounded-3xl border border-white/10 bg-slate-950/30 p-4">
        <p className="text-[11px] uppercase tracking-wide text-slate-500">Equipped Gear</p>
        <div className="mt-3">
          <InventoryGrid />
        </div>
      </div>

      <p className="mt-3 text-[11px] text-slate-500">Gold: {gold}</p>
    </div>
  );
};

export default BattlePanel;

