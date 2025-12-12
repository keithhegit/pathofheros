import type { PagesFunction } from "@cloudflare/workers-types";
import { hashPassword, randomSalt } from "../../_utils/auth";

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
  const salt = randomSalt();
  const iterations = Number.parseInt(env.PBKDF2_ITERATIONS ?? "", 10);
  const passwordHash = await hashPassword(body.password, salt, {
    iterations: Number.isFinite(iterations) && iterations > 0 ? iterations : undefined
  });
  const userId = crypto.randomUUID();

  try {
    await env.DB.prepare(
      "INSERT INTO users (id, username, salt, password_hash) VALUES (?, ?, ?, ?)"
    )
      .bind(userId, username, salt, passwordHash)
      .run();
  } catch (e) {
    console.error("register failed", e);
    const msg = String(e);
    if (msg.includes("UNIQUE")) {
      return json({ error: "用户名已存在" }, 409);
    }
    return json({ error: "failed to register" }, 500);
  }

  return json({ userId, username });
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

