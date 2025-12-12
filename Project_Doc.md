## Path of Kings — Cloudflare Pages + D1 Plan

### Stack
- Frontend: Vite + React + TypeScript + Tailwind, Zustand for client state, @tanstack/react-query for data fetching, @use-gesture/react + framer-motion for swipe/animation.
- Backend: Cloudflare Pages Functions (Hono or native handlers) + D1.
- Dev/Deploy: wrangler pages dev/deploy; D1 migrations for schema.

### Data Model (initial, D1 scope)
- users(id, username UNIQUE, salt, password_hash, created_at) — only for注册/登录。
- players(id, created_at) — link to runs (legacy/simple player identity).
- runs(id, player_id, gold, upgrade_cost, stats JSON[10], inventory JSON, skills JSON, map_progress JSON, updated_at) — 数值与进度存储。
- Optionally: equipment_templates, skills_master for future phases.

### API Surface (MVP-first)
- Auth:
  - POST /api/auth/register — username + password -> create user（PBKDF2-HMAC-SHA256 + 随机盐 + iterations 可配置）.
  - POST /api/auth/login — username + password -> verify and return userId（同 iterations）.
- Progress:
  - POST /api/run — create/reset a run with seed stats/gold/inventory/map (requires userId).
  - GET /api/run?id=... — fetch run snapshot.
  - POST /api/upgrade — spend gold, roll optionA/optionB, bump upgrade_cost.
  - POST /api/upgrade/apply — apply chosen option (A/B), update stats.
  - (Phase 2+) POST /api/map/move — advance map, return event type.
  - (Phase 3+) POST /api/battle/loot — generate loot; POST /api/equip; POST /api/sell.
  - (Phase 4+) POST /api/skill/pick — learn skill.
- (Phase 7+) POST /api/run/save — persist run snapshot (gold/stats/map/inventory/skills).

### Phases
1) Stats Upgrade Loop (MVP)
   - D1 migration for players/runs.
   - API: run create/fetch, upgrade roll/apply.
   - Frontend: Book tab with Upgrade button + SwipeCard (keep/swap).
2) Map Navigation
   - Client map generator, node tap, update map_progress via API.
   - Scrollable vertical map UI + 事件弹窗提醒（Phase2 完成度：可导航并提示事件）。
3) Battle & Loot Compare
   - Enemy approach loop (client), loot drop, swipe equip/sell; inventory/stats recompute.
4) Skill Draft
   - Fountain triggers SkillDraftPanel, `/api/skill/pick`; SkillList shows learned skills.
5) Game Loop & Persistence
   - Session/login persistence, run hydration (localStorage + `/api/run`); Tab flow + event dialog maintains Game Loop.
6) Event→Battle Loop
   - EventDialog now exposes battle entry buttons; BattlePanel listens to triggers and animates progress; battle summary feeds back into Route Planning panel.
7) Boss & Chapter Progress
   - Chapter completion tracked when boss nodes win; UI summarises victories and offers “next chapter” reset.
8) Phase8 – Boss Loop + Persistence
   - Martials: EventDialog-driven fight -> BattlePanel -> map progress increments -> map/save API + localStorage.

### Immediate Next Steps (Phase 1)
- Initialize Vite React TS + Tailwind; add Zustand, React Query, use-gesture, framer-motion.
- Add wrangler.toml with D1 binding; create migrations for players/runs.
- Implement functions/api/run, functions/api/upgrade, functions/api/upgrade/apply.
- Build frontend Upgrade panel with SwipeCard and server wiring; run locally via `wrangler pages dev --d1 <db> --local`.

### 当前进度与开发日志（中文）
- 2025-02-15：搭建前端栈（Vite+React+TS+Tailwind+Zustand+React Query+use-gesture+framer-motion），完成 Book 升级闭环 UI；实现 D1 基础表（players、runs）、接口 run/upgrade/upgrade/apply；完成 SwipeCard 交互。
- 2025-02-16：增加地图浏览基础（客户端生成地图、MapView 可点击当前/下一层节点，调用 map/move 事件回执）；补充 D1 用户表与 auth register/login 接口，规划仅用 D1 存注册登录与数值进度。
- 2025-02-17：完成 Phase2 事件弹窗提醒（EventDialog），Map Tab 显示服务端事件提示；加入 AuthPanel 前端登录/注册流程，创建 Run 绑定 userId；MapView 对未登录/未创建 Run 的引导提示。
- 2025-02-18：Phase3 战斗原型上线，BattlePanel 实现击败敌人后掉落 loot；LootCompare + InventoryGrid 展示装备对比与当前槽位，装备替换自动更新 stats，出售返回金币。
- 2025-02-19：Phase4 完成泉水技能弹窗 + 持久化（SkillDraftPanel+SkillList，/api/skill/pick）并通过 run store subscribe/localStorage 做 Phase5 “登录+复原”。
- 2025-02-20：Phase6 实现事件→战斗循环（EventDialog 战斗按钮 + BattlePanel battleTrigger）；战斗结束以“战斗回响”提示显示 summarize，进度条采用 motion 动画并反馈技能触发信息。
- 2025-02-21：Phase7 连接了 boss/章节流程（胜利后 advanceMapProgress、章节点自动 reset）并在 Map/Left UI 里新增“本章节已通关”提示；第8阶段在 BattlePanel/Api run save 上完善了章节结算 + persistence。


### 已完成功能（固化）
- Phase 1 核心闭环：属性升级（花费金币、roll 2 选 1，左右滑 Keep/Swap，升级成本递增）。
- Phase 2 基础：地图浏览与节点点击（当前/下一层可选），调用 map/move 返回事件并弹窗提示。
- Phase 3 架构起步：BattlePanel + LootCompare + InventoryGrid 在客户端模拟战斗（HP/进度条/掉落），新装备对比/替换、出售会更新 Stats/Gold；Run 状态记录装备槽位。
- Phase 4：SkillDraftPanel + SkillList，/api/skill/pick 在泉水事件中展示技能选择, 学习后持久化。
- Phase 5：登录 session 存储（localStorage + run store subscribe）、run 复原与 Game Loop tab 衔接。
- Phase 6：事件 dialog 入口连接战斗（battleTrigger → BattlePanel）、倒计时进度条以 `framer-motion` 平滑动画、战斗回响反馈技能触发。
- Phase 7：boss 节点胜利后记录章节通关，Map UI 展示“已通关”卡片，用户可点击“继续下一章节”重置进度。
- Phase 8：章节结算流强化（BattlePanel battleTrigger/skill summary → advanceMapProgress → `api/run/save`），章节胜利后同步 inventory/skills/gold/ stats，localStorage + D1 保持一致。
- 数据与接口：
  - D1 表：players、runs（数值进度）；users（注册/登录）。
  - 接口：/api/run (GET/POST)、/api/run/save、/api/upgrade、/api/upgrade/apply、/api/map/move、/api/auth/register、/api/auth/login。

### 核心代码位置
- 前端
  - 升级面板：`src/pages/UpgradePanel.tsx`，状态：`src/state/runStore.ts`，请求：`src/lib/api.ts`。
  - Swipe 手势卡片：`src/components/SwipeCard.tsx`。
  - 地图视图：`src/components/MapView.tsx`，地图生成：`src/lib/map.ts`。
  - 应用入口：`src/App.tsx`（Tab 切换 Book/Map）。
- 后端（Pages Functions）
  - 运行与升级：`functions/api/run.ts`、`functions/api/upgrade.ts`、`functions/api/upgrade/apply.ts`。
  - 地图事件：`functions/api/map/move.ts`。
  - 认证：`functions/api/auth/register.ts`、`functions/api/auth/login.ts`，工具：`functions/_utils/auth.ts`。
  - 数据工具：`functions/_utils/run.ts`。
- 数据库迁移
  - 基础：`migrations/0001_init.sql`（players, runs）。
  - 认证：`migrations/0002_auth.sql`（users）。

### 待办（下一步）
- Phase 9：Boss 章节流量化（boss 战败后自动解锁新地图层、更新章节状态）；Boss/Chapter 奖励回填 stats、gold、inventory。
- 数值与技能平衡：沉淀技能触发概率/持续、战斗掉落/暴击/回血数据，反馈到 `BattlePanel` 与日志。
- 后端扩展：完善 `/api/run/save`，确保 inventory/skills/skills 与 map 同步；准备 D1 schema 迁移与外部导出。
- QA/测试与部署：跑 `npm run build` + `wrangler pages dev --d1` 全链路，核对 D1 run 数据，规划部署/CI。

### UI_build 分支迭代（进行中）
- 目标：对齐原版三入口（背包/冒险/魔法书），并把页面从“单页堆叠”改成端内路由/状态机；战斗改为“路线事件进入→结算掉落滑动→回路线”。
- 已完成：
  - 主导航：新增底部三入口 `背包/冒险/魔法书`（`src/components/BottomNav.tsx`）。
  - 背包页：`InventoryView` 独立视图（`src/views/InventoryView.tsx`）。
  - 冒险入口页：章节选择 + 掉落预览 + ENTER LEVEL（`src/views/AdventureHomeView.tsx`），进入后进入路线规划（`AdventureView`）。
  - 账号页：未登录进入 `AuthScreen`，登录后可在右上角打开账号弹窗（`src/views/AuthScreen.tsx`）。
  - 战斗重做：加入主角 HP/受击/失败；胜利后掉落用左右滑决策（右滑装备/左滑出售）；战斗只从事件进入且结束后回路线（`src/components/BattlePanel.tsx` + `src/components/SwipeDecisionCard.tsx`）。
- 待完成（本轮继续）：
  - Chest 节点做成“战斗后必掉落 → 强制开宝箱/滑动决策”的更贴原版流程（区分普通战斗与宝箱战）。
  - 冒险首页增加“章节解锁/进度/掉落池”展示（先用占位数据，后续接入真实权重）。
  - 战斗动画与怪物精灵接入（idle/attack），以及“受击闪烁/暴击/闪避”反馈图标。

### 部署/排查（固化经验）
- **核心结论**：如果 `wrangler.toml` 未被 Pages 识别（构建日志提示“missing pages_build_output_dir / skipping file”），则 `[[d1_databases]]` 不会注入，Functions 里的 `env.DB` 会是 `undefined`，表现为 `/api/auth/register` 500 且 tail 里出现 `Cannot read properties of undefined (reading 'prepare')`。
- **wrangler.toml 必需字段**：
  - `pages_build_output_dir = "dist"`（否则 Pages 认为配置无效并跳过）
  - `[[d1_databases]] binding = "DB"`（Functions 通过 `env.DB` 使用 D1）
  - `[vars] PBKDF2_ITERATIONS = "100000"`（PBKDF2 迭代次数可配；本项目在 Pages/Workers 环境下实测超过 100000 会报 NotSupportedError，因此钳制到 100000）
- **一键验证远端 D1 是否准备好**：
  - 查看表：
    - `wrangler d1 execute pathofkings --remote --command "SELECT name FROM sqlite_master WHERE type='table';"`
  - 查看用户：
    - `wrangler d1 execute pathofkings --remote --command "SELECT id, username FROM users;"`
- **tail 生产部署日志（定位 500）**：
  - 列出部署：
    - `wrangler pages deployment list --project-name path-of-heroes --environment production`
  - tail 最新部署（推荐直接不写 deploymentId）：
    - `wrangler pages deployment tail --project-name path-of-heroes`
  - 触发注册（curl）：
    - `curl -X POST https://path-of-heroes.pages.dev/api/auth/register -H "Content-Type: application/json" -d '{"username":"demo123","password":"testpass"}'`
- **常见“看起来 OK 但前端还报错”原因**：
  - 你在主域名 `https://path-of-heroes.pages.dev/` 与某个 deployment 子域名之间来回切换测试（不同 deployment 的 Functions/绑定不一致）。
  - 浏览器缓存旧 JS：建议 DevTools 勾选 Disable cache 后强刷（Ctrl+Shift+R）。

