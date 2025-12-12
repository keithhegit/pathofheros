import type { EquipmentData } from "./equipment";
import type { SkillData } from "./skills";

type UpgradeOption = { type: number; value: number };

const headers = { "Content-Type": "application/json" };

export async function apiCreateRun(playerId?: string) {
  const res = await fetch("/api/run", {
    method: "POST",
    headers,
    body: JSON.stringify({ playerId })
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const message =
      (payload && typeof payload === "object" && "error" in payload && String((payload as any).error)) ||
      `create run failed: ${res.status}`;
    throw new Error(message);
  }
  return res.json() as Promise<{
    id: string;
    playerId: string;
    userId?: string;
    gold: number;
    upgradeCost: number;
    stats: number[];
    map: { layer: number; node: number };
    skills: SkillData[];
    inventory: any[];
  }>;
}

export async function apiFetchRun(runId: string) {
  const res = await fetch(`/api/run?id=${runId}`);
  if (!res.ok) throw new Error(`fetch run failed: ${res.status}`);
  return res.json() as Promise<{
    id: string;
    playerId: string;
    userId?: string;
    gold: number;
    upgradeCost: number;
    stats: number[];
    map: { layer: number; node: number };
    skills: SkillData[];
    inventory: any[];
  }>;
}

export async function apiUpgrade(runId: string) {
  const res = await fetch("/api/upgrade", {
    method: "POST",
    headers,
    body: JSON.stringify({ runId })
  });
  if (!res.ok) throw new Error(`upgrade failed: ${res.status}`);
  return res.json() as Promise<{
    runId: string;
    gold: number;
    upgradeCost: number;
    optionA: UpgradeOption;
    optionB: UpgradeOption;
  }>;
}

export async function apiUpgradeApply(
  runId: string,
  pick: "A" | "B",
  optionA: UpgradeOption,
  optionB: UpgradeOption
) {
  const res = await fetch("/api/upgrade/apply", {
    method: "POST",
    headers,
    body: JSON.stringify({ runId, pick, optionA, optionB })
  });
  if (!res.ok) throw new Error(`apply failed: ${res.status}`);
  return res.json() as Promise<{
    runId: string;
    stats: number[];
    gold: number;
    upgradeCost: number;
  }>;
}

export async function apiMapMove(
  runId: string,
  target: { layer: number; node: number; type?: string }
) {
  const res = await fetch("/api/map/move", {
    method: "POST",
    headers,
    body: JSON.stringify({ runId, target })
  });
  if (!res.ok) throw new Error(`map move failed: ${res.status}`);
  return res.json() as Promise<{
    map: { layer: number; node: number };
    event: "ENEMY" | "CHEST" | "FOUNTAIN" | "REST" | "BOSS" | "START" | "ELITE";
  }>;
}

export async function apiRegister(username: string, password: string) {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers,
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const message =
      (payload && typeof payload === "object" && "error" in payload && String((payload as any).error)) ||
      `register failed: ${res.status}`;
    throw new Error(message);
  }
  return res.json() as Promise<{ userId: string; username: string }>;
}

export async function apiLogin(username: string, password: string) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers,
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const message =
      (payload && typeof payload === "object" && "error" in payload && String((payload as any).error)) ||
      `login failed: ${res.status}`;
    throw new Error(message);
  }
  return res.json() as Promise<{ userId: string; username: string }>;
}

export async function apiPickSkill(runId: string, skill: SkillData) {
  const res = await fetch("/api/skill/pick", {
    method: "POST",
    headers,
    body: JSON.stringify({ runId, skill })
  });
  if (!res.ok) throw new Error(`skill pick failed: ${res.status}`);
  return res.json() as Promise<{ skills: SkillData[] }>;
}

export async function apiRunSave(payload: {
  runId: string;
  gold: number;
  upgradeCost: number;
  stats: number[];
  map: { layer: number; node: number };
  inventory: EquipmentData[];
  skills: SkillData[];
}) {
  const res = await fetch("/api/run/save", {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`run save failed: ${res.status}`);
  return res.json();
}

