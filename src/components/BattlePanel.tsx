import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { generateEquipment } from "../lib/equipment";
import { useRunStore } from "../state/runStore";
import InventoryGrid from "./InventoryGrid";
import LootCompare from "./LootCompare";
import type { EventType } from "./EventDialog";

const enemyNames = ["Goblin", "Bandit", "Specter", "Dire Wolf", "Stone Sentinel"];

type Props = {
  battleTrigger?: number;
  eventType?: EventType | null;
  onBattleComplete?: (summary: string, eventType?: EventType | null) => void;
  onLootEquip?: () => void;
  onLootSell?: () => void;
};

const BattlePanel = ({ battleTrigger, eventType, onBattleComplete, onLootEquip, onLootSell }: Props) => {
  const runId = useRunStore((state) => state.runId);
  const inventory = useRunStore((state) => state.inventory);
  const equipItem = useRunStore((state) => state.equipItem);
  const addGold = useRunStore((state) => state.addGold);
  const gold = useRunStore((state) => state.gold);
  const skills = useRunStore((state) => state.skills);

  const [enemyName, setEnemyName] = useState(enemyNames[0]);
  const [enemyMaxHp, setEnemyMaxHp] = useState(120);
  const [enemyHp, setEnemyHp] = useState(120);
  const [isFighting, setIsFighting] = useState(false);
  const [message, setMessage] = useState("准备战斗");
  const [loot, setLoot] = useState<ReturnType<typeof generateEquipment> | null>(null);
  const [skillTrigger, setSkillTrigger] = useState<string | null>(null);
  const battleTriggerRef = useRef<number>(0);

  const currentLoot = useMemo(() => {
    if (!loot) return null;
    return inventory[loot.slot];
  }, [inventory, loot]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    if (!isFighting) return;
    timer = setInterval(() => {
      setEnemyHp((prev) => {
        const damage = Math.floor(Math.random() * 12 + 8);
        if (prev - damage <= 0) {
          clearInterval(timer!);
          setIsFighting(false);
          const drop = generateEquipment();
          setLoot(drop);
          setMessage(`战斗胜利！获得 ${drop.rarity} ${drop.name}`);
          const summaryBase = `击败 ${enemyName} 获得 ${drop.rarity} ${drop.name}`;
          const summary = skillTrigger ? `${summaryBase}（技能 ${skillTrigger} 触发）` : summaryBase;
          onBattleComplete?.(summary, eventType ?? null);
          return 0;
        }
        return prev - damage;
      });
    }, 700);
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isFighting, enemyName, skillTrigger, onBattleComplete]);

  const startBattle = useCallback(() => {
    if (!runId) {
      setMessage("请先登录并开始 Run");
      return;
    }
    setLoot(null);
    const hp = 90 + Math.floor(Math.random() * 80);
    setEnemyMaxHp(hp);
    setEnemyHp(hp);
    const selectionName = enemyNames[Math.floor(Math.random() * enemyNames.length)];
    setEnemyName(selectionName);
    const triggeredSkill = skills.length
      ? skills[Math.floor(Math.random() * skills.length)].name
      : null;
    setSkillTrigger(triggeredSkill);
    setMessage(
      triggeredSkill
        ? `战斗中... ${triggeredSkill} 突然触发，增益正在生效`
        : "战斗中..."
    );
    setIsFighting(true);
  }, [runId, skills]);

  useEffect(() => {
    if (!battleTrigger) return;
    if (battleTriggerRef.current === battleTrigger) return;
    battleTriggerRef.current = battleTrigger;
    if (!isFighting) {
      startBattle();
    }
  }, [battleTrigger, isFighting, startBattle]);

  const handleEquip = () => {
    if (!loot) return;
    equipItem(loot);
    setMessage(`装备${loot.name}`);
    setLoot(null);
    onLootEquip?.();
  };

  const handleSell = () => {
    if (!loot) return;
    addGold(loot.saleValue);
    setMessage(`出售 ${loot.name} 获得 ${loot.saleValue}G`);
    setLoot(null);
    onLootSell?.();
  };

  return (
    <div className="rounded-3xl border border-white/5 bg-slate-900/80 p-5 shadow-2xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400">Battle</p>
          <h3 className="text-lg font-semibold text-amber-200">
            {enemyName} （{enemyHp}/{enemyMaxHp} HP）
          </h3>
        </div>
        <button
          onClick={startBattle}
          disabled={isFighting}
          className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-900 transition active:scale-95 disabled:opacity-50"
        >
          {isFighting ? "战斗中..." : "开始战斗"}
        </button>
      </div>

      <p className="mt-3 text-xs text-slate-400">{message}</p>

      <div className="mt-4 h-2 rounded-full bg-slate-800">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-amber-400"
          animate={{ width: `${Math.max(0, Math.min(100, (enemyMaxHp ? (enemyHp / enemyMaxHp) * 100 : 0)))}%` }}
          initial={false}
          transition={{ ease: "easeOut", duration: 0.3 }}
        />
      </div>

      {loot && (
        <div className="mt-5 space-y-3">
          <LootCompare drop={loot} current={currentLoot} />
          <div className="flex gap-2">
            <button
              onClick={handleEquip}
              className="flex-1 rounded-xl bg-amber-500 px-3 py-2 text-xs font-semibold text-slate-900 transition active:scale-95"
            >
              装备
            </button>
            <button
              onClick={handleSell}
              className="flex-1 rounded-xl bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 transition active:scale-95"
            >
              出售 +{loot.saleValue}G
            </button>
          </div>
        </div>
      )}

      <div className="mt-6">
        <p className="text-[11px] uppercase tracking-wide text-slate-500">当前装备</p>
        <InventoryGrid />
      </div>

      <p className="mt-3 text-[11px] text-slate-500">Gold: {gold}</p>
    </div>
  );
};

export default BattlePanel;

