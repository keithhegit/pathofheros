import AuthPanel from "../components/AuthPanel";

const AuthScreen = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-black px-4 py-8 text-white">
      <div className="mx-auto flex max-w-xl flex-col gap-6">
        <div className="rounded-3xl border border-white/5 bg-slate-900/60 p-6">
          <p className="text-xs text-slate-400">Path of Kings</p>
          <h1 className="mt-2 text-2xl font-semibold text-amber-200">欢迎回来</h1>
          <p className="mt-2 text-sm text-slate-300">
            先注册/登录以创建 Run，并同步你的进度到 D1。
          </p>
        </div>
        <AuthPanel />
      </div>
    </div>
  );
};

export default AuthScreen;


