import type { PagesFunction } from "@cloudflare/workers-types";

type Env = { DB: D1Database };

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  if (request.method !== "POST") {
    return createJson({ error: "Method not allowed" }, 405);
  }

  const body = (await request.json().catch(() => ({}))) as {
    runId?: string;
    gold?: number;
    upgradeCost?: number;
    stats?: number[];
    map?: { layer: number; node: number };
    inventory?: unknown;
    skills?: unknown;
  };

  if (!body.runId) {
    return createJson({ error: "runId required" }, 400);
  }

  await env.DB.prepare(
    "UPDATE runs SET gold = ?, upgrade_cost = ?, stats = ?, map_progress = ?, inventory = ?, skills = ?, updated_at = unixepoch() WHERE id = ?"
  )
    .bind(
      body.gold ?? 0,
      body.upgradeCost ?? 0,
      JSON.stringify(body.stats ?? []),
      JSON.stringify(body.map ?? { layer: 0, node: 0 }),
      JSON.stringify(body.inventory ?? []),
      JSON.stringify(body.skills ?? []),
      body.runId
    )
    .run();

  return createJson({ ok: true });
};

function createJson(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

