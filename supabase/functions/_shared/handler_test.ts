import { createHandler } from "./handler.ts";
function assert(value: unknown, message = "Assertion failed"): asserts value {
  if (!value) throw new Error(message);
}
const env = (k: string) =>
  (
    ({
      SUPABASE_ANON_KEY: "test-public",
      AI_API_KEY: "test-private",
      AI_MODEL: "test-model",
      ALLOWED_ORIGINS: "http://localhost:3000",
    }) as Record<string, string>
  )[k];
Deno.test(
  "Edge runtime: schema, CORS and safe transport response",
  async () => {
    const output = {
      status: "needs_clarification",
      message: "请补充你正在考虑的选项或具体情况。",
    };
    const fake: typeof fetch = () =>
      Promise.resolve(
        Response.json({
          choices: [{ message: { content: JSON.stringify(output) } }],
        }),
      );
    const handler = createHandler("parse", env, fake);
    const response = await handler(
      new Request("https://example.test", {
        method: "POST",
        headers: { origin: "http://localhost:3000", apikey: "test-public" },
        body: JSON.stringify({ text: "我最近不知道应该怎么办才好" }),
      }),
    );
    assert(response.status === 200);
    assert(
      response.headers.get("Access-Control-Allow-Origin") ===
        "http://localhost:3000",
    );
    assert((await response.json()).data.status === "needs_clarification");
    const bad = await handler(
      new Request("https://example.test", {
        method: "POST",
        headers: { apikey: "test-public" },
        body: "{}",
      }),
    );
    assert(bad.status === 400);
    await bad.body?.cancel();
  },
);

Deno.test(
  "Kimi report request uses instant mode, bounded fields and truncation guard",
  async () => {
    const settings: Record<string, string> = {
      AI_BASE_URL: "https://api.moonshot.cn/v1",
      AI_ANALYZE_MODEL: "kimi-k2.6",
    };
    const fake: typeof fetch = async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      assert(body.thinking.type === "disabled");
      assert(body.max_tokens === 12000);
      const prompt = body.messages[0].content;
      const jsonSchema = JSON.parse(
        prompt.split("JSON Schema:\n")[1].split("\n这是移动端")[0],
      );
      assert(
        jsonSchema.properties.options.items.properties.pros.maxItems === 1,
      );
      assert(
        jsonSchema.properties.options.items.properties.pros.items.properties
          .explanation.maxLength === 28,
      );
      return Response.json({
        choices: [
          {
            finish_reason: "length",
            message: { content: '{"summary":"partial"' },
          },
        ],
      });
    };
    const response = await createHandler(
      "analyze",
      (k) => settings[k] ?? env(k),
      fake,
    )(
      new Request("https://example.test", {
        method: "POST",
        headers: { apikey: "test-public", "x-forwarded-for": "test-report" },
        body: JSON.stringify({
          decision: {
            title: "选择哪个食堂",
            domain: "life",
            options: ["a", "b"].map((id) => ({
              id,
              name: id,
              facts: "",
              judgments: "",
              unknowns: "",
            })),
            preferences: "",
            constraints: "",
            questions: [],
            factorPreferences: [],
          },
        }),
      }),
    );
    assert(response.status === 502);
    assert((await response.json()).error.code === "AI_OUTPUT_TRUNCATED");
  },
);

Deno.test(
  "modern report preserves exchange and unknown references in one request",
  async () => {
    let calls = 0;
    const decision = {
      title: "两个选择",
      domain: "life",
      options: ["a", "b"].map((id) => ({
        id,
        name: id,
        facts: "距离五分钟",
        judgments: "",
        unknowns: "",
      })),
      preferences: "近",
      constraints: "",
      questions: [],
      factorPreferences: [],
      depth: "quick",
      criteria: [
        {
          id: "distance",
          name: "距离",
          priority: "must",
          requirement: "十分钟以内",
        },
      ],
    };
    const report = {
      version: 2,
      summary: "距离均可接受",
      conclusion: "目前均可选",
      recommendedOptionId: null,
      exchange: { gain: "节省路程", cost: "口味待了解", why: "优先满足距离" },
      reasons: [
        {
          title: "距离满足",
          explanation: "两者均近",
          basis: "F1",
          source: "user_fact",
          criterionIds: ["distance"],
        },
      ],
      prerequisites: [],
      switchConditions: [],
      comparisons: [
        {
          criterionId: "distance",
          assessments: ["a", "b"].map((optionId, i) => ({
            optionId,
            assessment: "距离满足",
            basis: `F${i + 1}`,
            source: "user_fact",
            status: "met",
          })),
        },
      ],
      tradeoffs: ["a", "b"].map((optionId) => ({
        optionId,
        risk: "口味未知",
        opportunityCost: "另一家的体验",
        basis: "当前选项",
        impacts: [],
      })),
      unknowns: [
        {
          criterionId: null,
          optionIds: ["a", "b"],
          question: "想吃什么",
          why: "帮助区分",
          dimension: "口味",
          verifyWith: "查看菜单",
        },
      ],
      omittedFactors: [],
    };
    const fake: typeof fetch = async (_url, init) => {
      calls++;
      const prompt = JSON.parse(String(init?.body)).messages[0].content;
      const requested = JSON.parse(
        prompt.split("JSON Schema:\n")[1].split("\n最后检查")[0],
      );
      assert(
        !requested.$schema,
        "schema metadata must not be copied into a report",
      );
      assert(requested.required.includes("exchange"));
      assert(
        requested.properties.unknowns.items.required.includes("optionIds"),
      );
      assert(!requested.properties.omittedFactors);
      assert(!requested.properties.summary);
      assert(!requested.properties.reasons);
      assert(!requested.properties.tradeoffs.items.properties.impacts);
      return Response.json({
        choices: [
          {
            finish_reason: "stop",
            message: {
              content: JSON.stringify({
                ...report,
                version: undefined,
                reasons: undefined,
                summary: undefined,
                conclusion: undefined,
                omittedFactors: undefined,
                tradeoffs: report.tradeoffs.map((t) => ({
                  ...t,
                  impacts: undefined,
                })),
              }),
            },
          },
        ],
      });
    };
    const res = await createHandler(
      "analyze",
      env,
      fake,
    )(
      new Request("https://example.test", {
        method: "POST",
        headers: {
          apikey: "test-public",
          "x-forwarded-for": "modern-contract",
        },
        body: JSON.stringify({ decision }),
      }),
    );
    const body = await res.json();
    assert(res.status === 200, JSON.stringify(body));
    assert(calls === 1);
    assert(body.data.exchange.gain === report.exchange.gain);
    assert(body.data.comparisons[0].assessments[0].basis === "距离五分钟");
  },
);
