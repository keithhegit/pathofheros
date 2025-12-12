import type { PagesFunction } from "@cloudflare/workers-types";
import { verifyPassword } from "../../_utils/auth";

type Env = { DB?: D1Database; PBKDF2_ITERATIONS?: string };

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  if (!env.DB) {
    return json(
      {
        error:
          "D1 未绑定到 Pages Functions（env.DB 为空）。请确认 wrangler.toml 含 pages_build_output_dir 与 [[d1_databases]] 并重新部署。"
      },
      500
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    username?: string;
    password?: string;
  };

  if (!body.username || !body.password) {
    return json({ error: "username and password are required" }, 400);
  }

  const username = body.username.trim().toLowerCase();
  const row = await env.DB.prepare(
    "SELECT id, salt, password_hash FROM users WHERE username = ?"
  )
    .bind(username)
    .first<{ id: string; salt: string; password_hash: string }>();

  if (!row) return json({ error: "invalid credentials" }, 401);

  const iterations = Number.parseInt(env.PBKDF2_ITERATIONS ?? "", 10);
  const ok = await verifyPassword(body.password, row.salt, row.password_hash, {
    iterations: Number.isFinite(iterations) && iterations > 0 ? iterations : undefined
  });
  if (!ok) return json({ error: "invalid credentials" }, 401);

  return json({ userId: row.id, username });
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

