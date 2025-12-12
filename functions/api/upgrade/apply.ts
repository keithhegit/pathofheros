import type { PagesFunction } from "@cloudflare/workers-types";
import { fetchRun, growthByStat, runSelectSql } from "../../_utils/run";

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
    pick?: "A" | "B";
    optionA?: { type: number; value: number };
    optionB?: { type: number; value: number };
  };

  if (!body.runId || !body.pick || !body.optionA || !body.optionB) {
    return new Response(
      JSON.stringify({ error: "runId, pick, optionA, optionB are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const run = await fetchRun(env.DB, body.runId);
  if (!run) {
    return new Response(JSON.stringify({ error: "run not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }

  const chosen = body.pick === "A" ? body.optionA : body.optionB;
  if (
    chosen.type == null ||
    chosen.value == null ||
    chosen.type < 0 ||
    chosen.type >= growthByStat.length
  ) {
    return new Response(JSON.stringify({ error: "invalid option" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const stats = JSON.parse(run.stats) as number[];
  stats[chosen.type] = (stats[chosen.type] || 0) + Number(chosen.value);

  await env.DB.prepare(
    "UPDATE runs SET stats = ?, updated_at = unixepoch() WHERE id = ?"
  )
    .bind(JSON.stringify(stats), run.id)
    .run();

  const updated = await env.DB
    .prepare(runSelectSql)
    .bind(run.id)
    .first<typeof run>();

  return Response.json({
    runId: run.id,
    stats: updated ? JSON.parse(updated.stats) : stats,
    gold: updated?.gold ?? run.gold,
    upgradeCost: updated?.upgrade_cost ?? run.upgrade_cost
  });
};

