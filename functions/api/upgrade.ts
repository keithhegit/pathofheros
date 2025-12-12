import type { PagesFunction } from "@cloudflare/workers-types";
import {
  BASE_UPGRADE_COST,
  fetchRun,
  growthByStat,
  runSelectSql
} from "../_utils/run";

type Env = { DB: D1Database };

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  const body = (await request.json().catch(() => ({}))) as {
    runId?: string;
  };
  if (!body.runId) {
    return new Response(JSON.stringify({ error: "runId is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const run = await fetchRun(env.DB, body.runId);
  if (!run) {
    return new Response(JSON.stringify({ error: "run not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }

  if (run.gold < run.upgrade_cost) {
    return new Response(JSON.stringify({ error: "not enough gold" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const optionA = rollUpgrade();
  let optionB = rollUpgrade();
  while (optionB.type === optionA.type) {
    optionB = rollUpgrade();
  }

  const newGold = run.gold - run.upgrade_cost;
  const newCost = Math.max(
    BASE_UPGRADE_COST,
    Math.floor(run.upgrade_cost * 1.1)
  );

  await env.DB.prepare(
    "UPDATE runs SET gold = ?, upgrade_cost = ?, updated_at = unixepoch() WHERE id = ?"
  )
    .bind(newGold, newCost, run.id)
    .run();

  const updated = await env.DB
    .prepare(runSelectSql)
    .bind(run.id)
    .first<typeof run>();

  return Response.json({
    runId: run.id,
    gold: updated?.gold ?? newGold,
    upgradeCost: updated?.upgrade_cost ?? newCost,
    optionA,
    optionB
  });
};

function rollUpgrade() {
  const type = Math.floor(Math.random() * growthByStat.length);
  const value = growthByStat[type];
  return { type, value };
}

