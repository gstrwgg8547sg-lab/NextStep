# NextStep · AI 决策分析助手

移动端优先的 Next.js App Router + TypeScript 全栈 MVP，视觉沿用用户提供的 HTML 原型：奶油白、森林绿、杏桃点缀、圆角卡片和清晰文字层级。未实现登录、云同步、评分、复杂因果图、What-if、任务拆解或社区。

**当前没有配置真实大模型密钥和 Supabase 项目。代码和演示闭环可运行，但不代表真实 AI 决策分析已完成联调。**

## 本地启动

要求 Node.js 20.9+（本项目在 Node 24 验证）。首次运行：

```bash
npm ci
cp .env.local.example .env.local # 已提供空模板；已有配置时不要覆盖
npm run dev
```

打开终端实际输出地址，默认 <http://127.0.0.1:3100>。生产运行：`npm run build && npm start`。

不配置任何服务也能打开应用：默认真实模式会明确提示「尚未配置 AI 服务」。勾选「开启演示模式（非真实 AI）」并选择一个示例，验证完整操作。演示仅支持三个明确列出的示例，不会伪装成对任意输入的真实推理，也不会在真实 API 失败时自动启用。

## 功能与路由

- `/`：10–2000 字输入、3 类示例、服务状态、演示切换；底部切换历史分析和说明。
- `/confirm`：决策标题/领域、2–6 个候选方案增删改、分别编辑用户事实/主观判断/未知、偏好与硬限制、最多 3 个可跳过的追问。
- `/report`：综合倾向、2–3 个理由、反向理由、结论边界、补充因素及解释、独立方案利弊/风险/机会成本、短中长期路径、核实渠道和下一步问题。支持因素保留/排除/自定义、修改条件与重新分析、本地保存。
- localStorage：版本化草稿与最多 30 份历史快照。历史记录保存报告当时的确认条件；草稿允许暂时清空必填字段。修改未提交时不会覆盖旧报告，也不会将旧推断转成新事实。
- 数据损坏、存储不可用/超额、空输入、格式错误、超时、限流、服务不可用均有可恢复提示。清理浏览器数据可能丢失本地记录。

## 环境变量：两处配置，不能混放

| 变量                            | 配置位置                                           | 是否进浏览器                              |
| ------------------------------- | -------------------------------------------------- | ----------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Next.js `.env.local` / 前端部署环境                | 是                                        |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Next.js `.env.local` / 前端部署环境                | 是；填 publishable key 或 legacy anon key |
| `AI_API_KEY`                    | Supabase Secrets                                   | **否**                                    |
| `AI_BASE_URL`                   | Supabase Secrets；默认 `https://api.openai.com/v1` | 否                                        |
| `AI_MODEL`                      | Supabase Secrets；填写提供商的实际模型 ID          | 否                                        |
| `ALLOWED_ORIGINS`               | Supabase Secrets；逗号分隔完整来源，无尾部斜杠     | 否                                        |
| `RATE_LIMIT_PER_MINUTE`         | Supabase Secrets；默认 6                           | 否                                        |
| `RATE_LIMIT_GLOBAL_PER_MINUTE`  | Supabase Secrets；默认 60                          | 否                                        |

浏览器只需要公共项目 key，**不能填写 service_role、secret key 或模型密钥**。`.env.local` 已创建为空模板，受 `.gitignore` 保护。服务端变量模板位于 `supabase/.env.example`；不要将真实 Secrets 写入 `.env.local` 或提交 Git。

改动 `NEXT_PUBLIC_*` 后必须重启开发服务；生产前端需要重新构建。

## Supabase 配置和部署

本项目不需要数据表、用户账户或数据库迁移。

1. 创建/选择 Supabase 项目，在项目设置中取得 Project URL 和 publishable key（或 legacy anon key），写入 Next.js `.env.local`。
2. 准备支持 **OpenAI-compatible Chat Completions** 的模型接口：`POST {AI_BASE_URL}/chat/completions`、Bearer API key、`response_format: {"type":"json_object"}`、`max_tokens`。API_BASE_URL 包含 API 版本前缀，如 `/v1`，不包含 `/chat/completions`。原生 Anthropic / Gemini 协议不能直接填入；需要兼容网关或修改 `_shared/handler.ts` 的适配器。
3. 使用 Supabase CLI 登录并关联项目（下列 `YOUR_PROJECT_REF` 替换为实际值）：

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
cp supabase/.env.example supabase/.env.local
```

4. 在编辑器中填写 `supabase/.env.local` 的 `AI_API_KEY`、`AI_MODEL` 等。这个文件已被忽略，不把密钥放入 shell 命令行参数。`ALLOWED_ORIGINS` 包括本机访问来源和正式站点，如 `http://127.0.0.1:3100,http://localhost:3100,https://your-app.example`。
5. 配置 Secrets 并部署函数：

```bash
npx supabase secrets set --env-file supabase/.env.local
npx supabase functions deploy parse-decision --project-ref YOUR_PROJECT_REF
npx supabase functions deploy analyze-decision --project-ref YOUR_PROJECT_REF
```

`supabase/config.toml` 显式 `verify_jwt = false`，因为 MVP 不使用用户登录 JWT。函数内部会验证 `apikey` 是否等于该项目自动提供的 `SUPABASE_ANON_KEY`、`SUPABASE_PUBLISHABLE_KEY` 或 `SUPABASE_PUBLISHABLE_KEYS` 中的公共 key；未配置或不匹配时拒绝请求。不读取 service role。浏览器使用 `apikey` 请求头，不把 publishable key 当作 Bearer JWT。

公共 key 并非用户身份或秘密，CORS 也不是防攻击认证。此设置适用于无需登录的 MVP，**并不构成严格的匿名调用成本上限**。

### 完全本地运行 Edge Functions（可选）

需要 Docker 和 Supabase CLI：

```bash
npx supabase start
npx supabase functions serve --env-file supabase/.env.local
```

把 CLI 输出的本地 URL 与 anon/public key 写入 Next.js 配置，重启 `npm run dev`。CLI 的本地 Supabase 服务虽然会启动基础服务，本应用并不使用数据表。当前交付未启动 Docker / Supabase 本地堆栈；已单独验证 Deno 函数代码。

## 安全与容错边界

- 前端只调用 Supabase Edge Functions；大模型 API key 仅在函数的 Authorization 请求头中使用。
- 前后端共享严格 Zod schema；拒绝额外字段、超长内容、重复方案 ID、超过 3 个追问、不完整/不匹配的报告。UI 以纯文本渲染，不执行模型返回 HTML。
- 服务端请求体最大 64 KiB，原始输入 10–2000 字；每个文本字段均有限长。最多 6 个方案。
- 单次模型请求 25 秒超时；网络错误、上游 429/5xx 最多自动重试一次，超时和格式错误返回用户可重试提示。前端总等待上限 120 秒，防重复提交，不自动进行额外模型重试。
- 默认每个 Edge 隔离实例对每个 IP 每分钟 6 次、实例整体每分钟 60 次；只在内存保存 IP 摘要、计数和过期时间。不记录原始 IP、个人决策内容、完整上游错误或密钥。
- **基础限流是 best-effort**：各函数/地区/实例间不共享，冷启动会重置；转发头依赖部署网关，不能阻止分布式滥用。公开大规模上线前，应按实际需求接入网关或 Redis 原子限流，并在模型提供商设置预算/额度上限；本 MVP 未额外创建 Supabase 表。
- 请求内容会发送到配置的模型提供商。应用无业务内容日志；Supabase 和模型提供商自身的日志/保留策略需要由部署者配置。
- schema 能验证结构，不能证明语义事实正确。提示词要求区分用户事实、推断和未知，不编造外部事实、不评分、不输出虚假置信度；仍需真实模型的场景验收与人工核查。

## 数据和接口

详见 [docs/API.md](docs/API.md)。唯一 schema 源是 `supabase/functions/_shared/schema.ts`，前端从 `src/lib/schema.ts` 导出。函数用其生成模型输出 JSON Schema，并再次验证实际响应。

```text
src/app/                         App Router 三个页面及布局
src/components/                  页面组件、共享状态、表单、报告模块
src/components/ui/               shadcn 风格可编辑基础组件（Radix Slot + CVA）
src/lib/                         类型导出、调用客户端、存储、独立演示数据
supabase/functions/_shared/      共享 Zod schema、模型代理、限流与容错
supabase/functions/parse-decision/
supabase/functions/analyze-decision/
tests/                           数据契约、函数模拟传输测试、浏览器 E2E
```

UI 使用 Tailwind CSS 4、Lucide、shadcn/ui 的本地组件模式；组件源码归项目所有，`components.json` 可用于后续 shadcn CLI 扩展。原型植物装饰以代码 SVG 保留，其余操作图标使用 Lucide；没有引入生成图片。

## 验证命令

```bash
npm run typecheck
npm test
npm run build
npm run check:edge
npm run test:edge
npm run test:e2e
```

E2E 默认使用 macOS 已安装的 Chrome。其他系统请设置 `PLAYWRIGHT_CHROME_PATH` 为 Chrome 可执行路径，或在 `playwright.config.ts` 移除 `executablePath` 后执行 `npx playwright install chromium`。测试使用独立浏览器上下文，不改动用户的实际记录。E2E 用开发服务，默认复用 3100 端口已有服务；测试“未配置”场景应保持 `.env.local` 为空模板。

验证结果及未验证项见 [docs/VERIFICATION.md](docs/VERIFICATION.md)。测试中上游 fetch 是模拟传输，演示报告是预置数据，**均不能证明真实模型接通或分析质量达标**。

## 仍需手动完成

1. 填写 Next.js 公共 Supabase 配置。
2. 在 Supabase Secrets 中填写 AI 凭据、模型、地址、允许的前端来源。
3. 关联项目并部署两个函数。
4. 关闭演示模式，用 PRD 两个场景验证真实提取、追问、依据、条件性倾向、事实区分，以及修改条件后的真实结果变化。
5. 配置正式前端部署来源和模型费用上限；开展 PRD 建议的真实用户理解度/有效性测试。

## 参考文档

- [Next.js 安装与 App Router](https://nextjs.org/docs/app/getting-started/installation)
- [Supabase Edge Functions 身份校验](https://supabase.com/docs/guides/functions/auth)
- [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys)

实现模式为原型还原，单人执行；视觉依据是用户提供的 `NextStep_V1_移动端UI原型.html`，功能依据是用户 PRD。没有对外发布站点。

## Kimi K3.1 接入补充

当 AI_BASE_URL 指向官方 Moonshot 域名且 AI_MODEL 为 kimi-k3.1-pro 或其 highspeed 版本时，代理使用 reasoning_effort=low 和 max_completion_tokens（提取 6000、分析 12000），总超时 60 秒，浏览器总等待上限 120 秒。其他模型保持通用参数。根据 Kimi 官方文档，K3.1 Pro 需要账户具备付费调用权限；具体余额与权限应在 Kimi 控制台核对。

这只是兼容参数配置，是否成功接通以真实调用验收为准。

### 使用管理接口部署（无需安装 Supabase CLI）

将账号的 Personal Access Token 保存在本地 `.env.deploy.local` 的 `SUPABASE_ACCESS_TOKEN` 中，执行 `node scripts/deploy.mjs`。该文件已被 Git 忽略；令牌仅用于部署，不进入前端。脚本目前指向本项目 `gsnehtsbeldwclzlcrza`。

Kimi K2.6 两次尝试共享 45 秒服务端截止时间，K3.1 为 60 秒，前端等待上限为 120 秒。若终端直连项目域名出现 ECONNRESET，可检查本机网络代理；本次联调通过已配置的本地 HTTP 代理完成，未修改系统代理设置。

### 快速响应配置（2026-10-25）
Supabase Secrets 可分别配置 `AI_PARSE_MODEL` 和 `AI_ANALYZE_MODEL`，优先于 `AI_MODEL`。当前使用 `kimi-k2.6` 非思考模式，仍严格校验完整报告；复杂决策的分析深度可能与 K3.1 Pro 不同。删除两个覆盖项即可恢复 AI_MODEL。K3.1 Pro 继续保留原推理参数，不向其发送禁用思考参数。

目标和限制的快捷选项来自同一次信息提取结果，不额外调用模型。旧草稿没有相应字段时只显示自由输入；修改主题或候选方案后清除旧建议，避免错配。加载面板立即显示已提交问题、等待秒数及真实请求状态，不显示伪造分析或百分比。

## 决策标准与新版报告（2026-10-25）

信息提取同时生成动态比较标准，用户在确认页添加、删除、编辑，并设为「必须满足／优先考虑／一般考虑」。领域为工作、学习、生活、其他；旧科研记录兼容显示为学习。日常问题可使用简明分析，重要决定选择深入比较。没有额外的标准生成请求。

新版报告采用 version=2：结论及前提、同标准逐方案对比、风险与机会成本、适用的未来影响、优先核实事项。报告不强行推荐；必须条件未满足或未知时不得推荐该方案。用户事实依据须引用确认输入原文，推断单独标记；结构和引用校验不等于外部事实核验。

核实结果可以在报告页补充，最多保留12条，重新分析后显示修改项及前后结论。相同输入复用本地报告，不重复请求模型。旧版历史报告继续可读，新建或升级分析需要至少一项确认标准。

点击立即显示加载反馈；生成精简结构，避免重复文字、固定长短期推演及无依据评分。新版报告校验失败时最多自动重试一次，重试仍受总截止时间限制；未通过校验不展示为完成报告。目标是尽量在15秒内完成报告，但模型拥堵和网络仍可能使请求超时，不保证固定耗时。

升级回归：`npm test`、`npm run test:edge`、`npm run check:edge`、`npx playwright test tests/e2e/upgrade.spec.ts`、`npm run build`。浏览器测试使用明确的接口桩；真实模型测试另记于 docs/VERIFICATION.md。

## 用户验证与作品集准备

当前展示聚焦实习/工作与升学/研究选择，其他决定仍可使用。报告页提供仅保存在本机的反馈，支持主动导出单条反馈；不会自动上传或触发模型调用。

[研究执行说明](docs/research/README.md) · [固定评估案例](docs/research/cases.md) · [作品集模板](docs/research/portfolio.md)。研究数据表为空白模板，真实参与者、效果和对照结果尚待收集，不能作为已验证成果使用。

### 当前 Vercel 部署链路（2026-10-27）

当前浏览器调用同源 `/api/parse-decision` 和 `/api/analyze-decision`，由 Next.js 服务端访问模型。请在 **Vercel 项目的 Environment Variables** 设置 `AI_API_KEY`、`AI_BASE_URL`（含 `/v1`）和 `AI_MODEL`，并重新部署使配置生效。本地开发使用未提交的 `.env.local`。这三个变量不能加 `NEXT_PUBLIC_` 前缀。上方 Supabase 部署说明适用于保留的旧版代理，当前网页不会通过它调用 AI。

正常请求只调用一次模型；仅在失败且时间预算允许时重试一次。模型调用总预算为 35 秒（单次 25 秒），服务响应兜底 40 秒，浏览器超时 45 秒。响应保持 HTTP 200 流式 JSON，业务错误由 `error.code/message` 表示，因此监控必须读取最终响应体，不能只看状态码。超时或不完整输出不作为成功报告，不会用模拟分析替代。15 秒是体验目标，并非模型服务响应的保证。
