export type RunRecord = {
  id: string;
  player_id: string;
  gold: number;
  upgrade_cost: number;
  stats: string;
  inventory: string;
  skills: string;
  map_progress: string;
};

export const BASE_STATS = [10, 100, 10, 5, 5, 0, 0, 90, 0, 0];
export const BASE_UPGRADE_COST = 250;

export const growthByStat = [2, 20, 1, 1, 1, 1, 1, 1, 0.5, 2];

export const runSelectSql =
  "SELECT id, player_id, gold, upgrade_cost, stats, inventory, skills, map_progress FROM runs WHERE id = ?";

export async function fetchRun(db: D1Database, id: string) {
  return await db.prepare(runSelectSql).bind(id).first<RunRecord>();
}

export async function upsertPlayer(db: D1Database, playerId: string) {
  await db
    .prepare("INSERT OR IGNORE INTO players (id) VALUES (?)")
    .bind(playerId)
    .run();
}

export async function createRun(db: D1Database, playerId: string) {
  const runId = crypto.randomUUID();
  const payload = {
    id: runId,
    player_id: playerId,
    gold: 420,
    upgrade_cost: BASE_UPGRADE_COST,
    stats: JSON.stringify(BASE_STATS),
    inventory: JSON.stringify([]),
    skills: JSON.stringify([]),
    map_progress: JSON.stringify({ layer: 0, node: 0 })
  };

  await db
    .prepare(
      "INSERT INTO runs (id, player_id, gold, upgrade_cost, stats, inventory, skills, map_progress) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(
      payload.id,
      payload.player_id,
      payload.gold,
      payload.upgrade_cost,
      payload.stats,
      payload.inventory,
      payload.skills,
      payload.map_progress
    )
    .run();

  return payload;
}

