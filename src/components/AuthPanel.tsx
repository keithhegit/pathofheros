import { useState } from "react";
import { apiLogin, apiRegister } from "../lib/api";
import { useRunStore } from "../state/runStore";

const AuthPanel = () => {
  const { userId, username, setRun, reset } = useRunStore();
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState<"login" | "register" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const handleChange = (key: "username" | "password", value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleRegister = async () => {
    setLoading("register");
    setError(null);
    setMsg(null);
    try {
      const res = await apiRegister(form.username, form.password);
      setRun({ userId: res.userId, username: res.username });
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "pathofkings_user",
          JSON.stringify({ userId: res.userId, username: res.username })
        );
      }
      setMsg("注册成功");
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(null);
    }
  };

  const handleLogin = async () => {
    setLoading("login");
    setError(null);
    setMsg(null);
    try {
      const res = await apiLogin(form.username, form.password);
      setRun({ userId: res.userId, username: res.username, runId: null });
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "pathofkings_user",
          JSON.stringify({ userId: res.userId, username: res.username })
        );
      }
      setMsg("登录成功");
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(null);
    }
  };

  const handleLogout = () => {
    reset();
    setMsg("已清空本地会话");
    if (typeof window !== "undefined") {
      localStorage.removeItem("pathofkings_user");
      localStorage.removeItem("pathofkings_run");
    }
  };

  return (
    <div className="flex w-full max-w-xl flex-col gap-3 rounded-2xl border border-white/5 bg-slate-900/70 p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-200">
          {userId ? `已登录：${username ?? userId}` : "未登录"}
        </div>
        {userId && (
          <button
            aria-label="logout"
            onClick={handleLogout}
            className="rounded-lg bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-200 transition active:scale-95"
          >
            退出/清空
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input
          className="w-full rounded-lg bg-slate-800 px-3 py-2 text-sm text-white outline-none ring-1 ring-slate-700 focus:ring-amber-400"
          placeholder="用户名"
          value={form.username}
          onChange={(e) => handleChange("username", e.target.value)}
        />
        <input
          className="w-full rounded-lg bg-slate-800 px-3 py-2 text-sm text-white outline-none ring-1 ring-slate-700 focus:ring-amber-400"
          placeholder="密码"
          type="password"
          value={form.password}
          onChange={(e) => handleChange("password", e.target.value)}
        />
      </div>

      <div className="flex gap-2">
        <button
          aria-label="register"
          onClick={handleRegister}
          disabled={loading === "register"}
          className="flex-1 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900 transition active:scale-95 disabled:opacity-60"
        >
          {loading === "register" ? "注册中..." : "注册"}
        </button>
        <button
          aria-label="login"
          onClick={handleLogin}
          disabled={loading === "login"}
          className="flex-1 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 transition active:scale-95 disabled:opacity-60"
        >
          {loading === "login" ? "登录中..." : "登录"}
        </button>
      </div>

      {msg && <p className="text-xs text-emerald-300">{msg}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
      <p className="text-xs text-slate-400">
        注册/登录仅写入 D1（users），本地会话保存 userId；创建 Run 时将绑定 userId。
      </p>
    </div>
  );
};

export default AuthPanel;

