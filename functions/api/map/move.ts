import type { PagesFunction } from "@cloudflare/workers-types";
import { fetchRun } from "../../_utils/run";

type Env = { DB: D1Database };

const EVENTS = [
  { type: "ENEMY", weight: 0.4 },
  { type: "CHEST", weight: 0.3 },
  { type: "ELITE", weight: 0.05 },
  { type: "FOUNTAIN", weight: 0.15 },
  { type: "REST", weight: 0.1 },
  { type: "BOSS", weight: 0.05 }
] as const;

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
    target?: { layer: number; node: number; type?: string };
  };

  if (!body.runId || !body.target) {
    return new Response(
      JSON.stringify({ error: "runId and target are required" }),
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

  const mapProgress = safeParseMap(run.map_progress);
  const next = {
    layer: Number(body.target.layer) || 0,
    node: Number(body.target.node) || 0
  };

  if (next.layer < mapProgress.layer) {
    return new Response(
      JSON.stringify({ error: "cannot move backward" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const event = resolveEvent(next.layer, body.target.type);

  await env.DB.prepare(
    "UPDATE runs SET map_progress = ?, updated_at = unixepoch() WHERE id = ?"
  )
    .bind(JSON.stringify(next), run.id)
    .run();

  return Response.json({ map: next, event });
};

function safeParseMap(raw: string) {
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed?.layer === "number" && typeof parsed?.node === "number") {
      return parsed as { layer: number; node: number };
    }
  } catch {
    // ignore
  }
  return { layer: 0, node: 0 };
}

function resolveEvent(layer: number, requestedType?: string) {
  if (layer === 0) return "START";
  const allowed = ["ENEMY", "CHEST", "FOUNTAIN", "REST", "BOSS", "ELITE"];
  if (requestedType && allowed.includes(requestedType)) {
    return requestedType;
  }
  let r = Math.random();
  for (const e of EVENTS) {
    if (r < e.weight) return e.type;
    r -= e.weight;
  }
  return "ENEMY";
}

