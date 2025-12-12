import type { PagesFunction } from "@cloudflare/workers-types";
import { fetchRun, runSelectSql } from "../../_utils/run";

type SkillPayload = {
  id: number;
  name: string;
  desc: string;
  effect: string;
  type: string;
};

type Env = { DB: D1Database };

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  if (request.method !== "POST") {
    return response({ error: "Method not allowed" }, 405);
  }

  const body = (await request.json().catch(() => ({}))) as {
    runId?: string;
    skill?: SkillPayload;
  };

  if (!body.runId || !body.skill) {
    return response({ error: "runId and skill are required" }, 400);
  }

  const run = await fetchRun(env.DB, body.runId);
  if (!run) {
    return response({ error: "run not found" }, 404);
  }

  const existing = JSON.parse(run.skills || "[]") as SkillPayload[];
  if (existing.find((s) => s.id === body.skill!.id)) {
    return response({ skills: existing });
  }

  const updated = [...existing, body.skill];
  await env.DB.prepare(
    "UPDATE runs SET skills = ?, updated_at = unixepoch() WHERE id = ?"
  )
    .bind(JSON.stringify(updated), run.id)
    .run();

  const refreshed = await env.DB
    .prepare(runSelectSql)
    .bind(run.id)
    .first<typeof run>();

  return response({
    skills: refreshed ? JSON.parse(refreshed.skills) : updated
  });
};

function response(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

