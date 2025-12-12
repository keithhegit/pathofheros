import type { PagesFunction } from "@cloudflare/workers-types";
import { createRun, fetchRun, upsertPlayer } from "../_utils/run";

type Env = {
  DB: D1Database;
};

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (request.method === "GET") {
    const url = new URL(request.url);
    const runId = url.searchParams.get("id");
    if (!runId) {
      return new Response(
        JSON.stringify({ error: "runId is required as query param" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const run = await fetchRun(env.DB, runId);
    if (!run) {
      return new Response(JSON.stringify({ error: "run not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    return Response.json({
      id: run.id,
      playerId: run.player_id,
      userId: run.player_id,
      gold: run.gold,
      upgradeCost: run.upgrade_cost,
      stats: JSON.parse(run.stats),
      inventory: JSON.parse(run.inventory),
      skills: JSON.parse(run.skills),
      map: JSON.parse(run.map_progress)
    });
  }

  if (request.method === "POST") {
    const body = (await request.json().catch(() => ({}))) as {
      playerId?: string;
      userId?: string;
    };
    const playerId = body.playerId || body.userId;
    if (!playerId) {
      return new Response(JSON.stringify({ error: "playerId (userId) required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    await upsertPlayer(env.DB, playerId);
    const run = await createRun(env.DB, playerId);

    return Response.json({
      id: run.id,
      playerId,
      userId: playerId,
      gold: run.gold,
      upgradeCost: run.upgrade_cost,
      stats: JSON.parse(run.stats),
      inventory: [],
      skills: [],
      map: JSON.parse(run.map_progress)
    });
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { "Content-Type": "application/json" }
  });
};

