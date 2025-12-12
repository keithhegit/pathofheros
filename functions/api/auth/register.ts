import type { PagesFunction } from "@cloudflare/workers-types";
import { hashPassword, randomSalt } from "../../_utils/auth";

type Env = { DB: D1Database };

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
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
  const passwordHash = await hashPassword(body.password, salt);
  const userId = crypto.randomUUID();

  try {
    await env.DB.prepare(
      "INSERT INTO users (id, username, salt, password_hash) VALUES (?, ?, ?, ?)"
    )
      .bind(userId, username, salt, passwordHash)
      .run();
  } catch (e) {
    const msg = String(e);
    if (msg.includes("UNIQUE")) {
      return json({ error: "username taken" }, 409);
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

