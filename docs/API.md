# 数据结构与 AI 接口

浏览器 → Supabase Edge Function → 配置的大语言模型。Next.js 不保存服务端 AI Key，也不代理密钥到浏览器。

## 请求协议

基础路径：`{NEXT_PUBLIC_SUPABASE_URL}/functions/v1`。

请求头：`Content-Type: application/json` 和 `apikey: <publishable 或 legacy anon key>`。

成功返回 `{ "data": ... }`；失败返回 `{ "error": { "code": "...", "message": "可展示中文说明" } }`。不返回上游原始错误体或密钥。

### POST /parse-decision

```json
{
  "text": "我正在考虑研究生阶段选择计算机视觉还是激光雷达测深方向，我比较在意科研难度、毕业压力和未来就业。"
}
```

清晰输入返回 `data.status = "ready"` 与 `data.decision`。不清晰输入返回：

```json
{
  "data": {
    "status": "needs_clarification",
    "message": "请补充你正在考虑的选项或具体情况。"
  }
}
```

`Decision`：

| 字段              | 类型 / 限制                       | 语义                                              |
| ----------------- | --------------------------------- | ------------------------------------------------- |
| title             | string，1–100 字                  | 决策主题                                          |
| domain            | career / study / life / other（兼容旧 research） | 场景                                              |
| options           | 2–6 个 Option                     | 候选方案，唯一 id                                 |
| preferences       | string，≤2000 字                  | 用户目标与关注点                                  |
| constraints       | string，≤2000 字                  | 硬性限制                                          |
| questions         | ≤3 个 {question, answer}          | 追问；空回答表示跳过                              |
| factorPreferences | ≤20 个 {name, source, included}   | source=user/ai_suggestion；仅关注维度，不作为事实 |

`Option`：`id`、`name`、`facts`（用户提供，未经外部验证）、`judgments`（用户主观判断）、`unknowns`（未确认事项）。三类正文各最多 2000 字，可为空。表单以多行文本编辑，避免复杂评分矩阵。

### POST /analyze-decision

```json
{ "decision": "这里传入上述完整 Decision 对象，而不是字符串" }
```

只发送用户当前确认的信息和因素选择；不发送旧报告作为事实。完整请求请由前端流程生成，以上仅为外层结构示意。

旧版 `Report` 字段（历史兼容）：

| 字段                 | 内容                                                    |
| -------------------- | ------------------------------------------------------- |
| summary / conclusion | 综合摘要与有条件的倾向；证据不足时明确说明              |
| reasons              | 2–3 条 Insight                                          |
| counterReason        | 其他方案仍值得考虑的理由                                |
| limitations          | 1–6 条结论限制                                          |
| nextQuestions        | 1–3 个最值得优先核实的问题                              |
| factors              | 因素 name、why、relevance、source；最多 12 个           |
| options              | 按 optionId 对应全部输入方案；不允许缺失、重复或新增 ID |
| unknowns             | question、why、dimension、verifyWith；1–8 项            |

每个 `options` 包含 `pros`、`cons`、`risks`、`opportunityCosts`（分别 1–5 条 Insight），`paths.short / medium / long` 各一条 Insight。

`Insight`：`title`、`explanation`、`basis`、`source`。source 严格为：

- `user_fact`：来自用户提供的信息，不代表外部核实。
- `ai_inference`：依据某些条件的推断/可能影响，必须写明依据。
- `unknown`：缺少可靠信息，建议核实。

所有结构严格校验，不允许模型增加评分、置信度等额外属性。语义真实性仍依赖模型遵循规则和用户核查；不能因结构校验通过就声称事实正确。

## 错误与重试

| HTTP | code                                  | 处理                             |
| ---- | ------------------------------------- | -------------------------------- |
| 400  | INVALID_INPUT / INVALID_JSON          | 修改输入                         |
| 401  | INVALID_API_KEY                       | 核对 Supabase 项目公共配置       |
| 403  | ORIGIN_DENIED                         | 调整服务端允许来源               |
| 405  | METHOD_NOT_ALLOWED                    | 仅 POST（支持 OPTIONS 预检）     |
| 413  | INPUT_TOO_LARGE                       | 缩短输入；服务端最大 64 KiB      |
| 429  | RATE_LIMITED                          | Retry-After: 60；稍后手动重试    |
| 503  | AI_NOT_CONFIGURED / AI_CONFIG_INVALID | 配置 Secrets/地址                |
| 502  | AI_UPSTREAM_ERROR / AI_NETWORK_ERROR  | 上游暂时失败；可重试             |
| 502  | AI_INVALID_OUTPUT                     | JSON/结构/方案对应校验失败；重试 |
| 504  | AI_TIMEOUT                            | 单次调用超时；重试               |
| 500  | INTERNAL_ERROR                        | 通用安全错误                     |

网络与上游 429/5xx 最多自动重试一次，最多两次模型请求；前端只提供用户主动重试，避免叠加自动请求。两阶段均有 loading 状态和防重复提交。

## 本地数据

- `nextstep:draft:v1`：`raw`、`mode`（live/demo）、`decision`（允许编辑中空字段）、`current`。
- `nextstep:history:v1`：最多 30 个 SavedReport。
- SavedReport：`id`、`createdAt`（ISO）、`mode`、`raw`、生成时 `decision` 快照、`report`。
- 保存报告不会将尚未重分析的编辑误记为旧报告依据。重新分析成功生成新 ID，历史快照不被改写。
- 加载时使用 Zod 验证本地数据；存储损坏/被禁用/容量不足在页面提示。
- 不加密、不跨设备同步、不上传历史记录；清除浏览器数据后无法从服务器恢复。

## version=2 报告

Decision 新增可选字段：
- `criteria`: 最多5项 `{id,name,priority,requirement}`，priority 为 must/prefer/consider。新版前端要求至少1项。
- `depth`: quick/standard。quick 不生成中长期推演。
- `verificationNotes`: 最多12条 `{question,answer}`，用户核实结果属于输入，非外部自动核验。

含标准的 analyze 请求返回 ModernReport，包含 `version:2`、`summary`、`conclusion`、`recommendedOptionId`（可为 null）、`reasons`（含 criterionIds）、`prerequisites`、`switchConditions`、`comparisons`、`tradeoffs`、`unknowns`、`omittedFactors`。具体限制见共享 schema.ts。

comparisons 必须逐一覆盖输入全部标准，每项 assessments 覆盖全部方案，包含 optionId、assessment、basis、source、status。status 为 met/not_met/uncertain/mixed，不是评分。未知来源只能标 uncertain。推荐方案所有 must 项均须为 met；user_fact 的 basis 必须是已确认输入的原文片段。生成时模型使用 evidenceReferences 的证据编号，服务端解析为对应原文，禁止引用其他方案的事实；前端收到的是可读原文，不是内部编号。此校验无法证明模型对原文的解释正确，用户仍需检查。

tradeoffs 每方案包含 risk、opportunityCost、basis、impacts；quick 的 impacts 必须为空，standard 只包含适用时间跨度的条件性影响。unknowns 0–3项，按重要程度排序；omittedFactors 0–2项，需要用户加入 criteria 后才能成为新标准。

SavedReport 的可选 revision 由前端比较输入生成，包含 previousConclusion、previousOptionId、changes；不会额外调用模型，不会将旧报告当作用户事实发回模型。

新报告格式／一致性不合格时服务端至多重试一次。K2.6 所有尝试共享45秒截止时间，K3.1为60秒。失败保留草稿，不能用模拟结果代替真实输出。

## 2026-10-26 报告取舍与底线检查

现代报告继续使用 `version: 2`，增加 `exchange: {gain, cost, why}`：解释收益、牺牲及其与用户优先级的关系。新生成请求要求该字段；历史报告允许缺失。

`unknowns` 增加 `criterionId: string|null` 与 `optionIds: string[]`，必须引用当前标准和候选方案。客户端按关联标准和方案可行性分为可行性缺口、排序影响、补充细节；历史无引用记录显示未分级。分类不再次调用模型。

底线检查从完整的逐标准判断派生：有必须条件明确不满足则排除，有必须条件未确认则待确认，其余通过当前底线检查。它依赖报告判断，不等于外部事实验证。所有候选均被排除时明确提示重新调整方案/底线，不强行选出赢家。

通常仍为一次模型调用，异常时最多一次纠错且共享既有超时预算。分析请求不再发送输入页快捷建议及追问备选答案；用户确认的回答、事实、标准、核实记录均保留。已有新版报告且输入未变时直接复用；缺少新取舍字段的历史报告在再次分析时升级。

为减少延迟，模型传输格式省略固定版本号、重复摘要、空的补充因素，以及简明报告的空影响路径。服务端只补齐这些确定字段；主要依据从底线差异或优先标准的已校验对比中选取，避免再次生成重复理由。所有实际分析内容仍通过严格结构和方案一致性校验。最终返回客户端的报告字段保持完整。

当前建议也由服务端将有效 `recommendedOptionId` 的候选名称与 `exchange.why` 组合，避免模型在当前结论末尾顺带推荐一个违反底线的备选。它不是固定案例答案：方案ID与取舍理由均来自真实模型分析，并继续经过必须条件校验；无倾向和所有方案均不满足条件分别显示对应状态。
