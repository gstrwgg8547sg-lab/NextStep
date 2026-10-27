import { describe, it, expect, vi, afterEach } from "vitest";
import {
  DecisionSchema,
  RawInputSchema,
  ParseResultSchema,
  validateReportForDecision,
} from "../src/lib/schema";
import { examples, demoParse, demoAnalyze } from "../src/lib/demo";
import { createHandler } from "../supabase/functions/_shared/handler";
describe("decision contracts", () => {
  it("rejects empty/short/oversized inputs", () => {
    for (const text of ["", "怎么办", "a".repeat(2001)])
      expect(RawInputSchema.safeParse({ text }).success).toBe(false);
  });
  it("keeps judgments separate and supports both PRD scenarios", () => {
    for (const raw of [examples.offer, examples.study]) {
      const d = DecisionSchema.parse(demoParse(raw));
      expect(d.options).toHaveLength(2);
      expect(d.questions.length).toBeLessThanOrEqual(2);
      expect(validateReportForDecision(demoAnalyze(d), d)).toBeTruthy();
    }
    const d = demoParse(examples.offer);
    expect(d.options[0].facts).not.toContain("加班");
    expect(d.options[0].judgments).toContain("加班");
  });
  it("does not fabricate demo results for arbitrary inputs", () =>
    expect(() => demoParse("我还没想清楚应该怎么办呢")).toThrow(
      "示例体验仅支持",
    ));
  it("rejects duplicate option ids and mismatched reports", () => {
    const d = demoParse(examples.offer);
    const r = demoAnalyze(d);
    r.options[1].optionId = r.options[0].optionId;
    expect(() => validateReportForDecision(r, d)).toThrow();
    d.options[1].id = d.options[0].id;
    expect(DecisionSchema.safeParse(d).success).toBe(false);
  });
  it("allows clarification without invented choices", () =>
    expect(
      ParseResultSchema.parse({
        status: "needs_clarification",
        message: "请补充选项或具体情况。",
      }).status,
    ).toBe("needs_clarification"));
  it("respects excluded and custom factors in explicitly labeled demo", () => {
    const d = demoParse(examples.study);
    d.factorPreferences = [
      { name: "导师与指导资源", source: "ai_suggestion", included: false },
      { name: "通勤", source: "user", included: true },
    ];
    const r = demoAnalyze(d);
    expect(r.factors.map((f) => f.name)).not.toContain("导师与指导资源");
    expect(r.factors.map((f) => f.name)).toContain("通勤");
  });
});
const env =
  (extra: Record<string, string> = {}) =>
  (k: string) =>
    ({
      SUPABASE_ANON_KEY: "public-test",
      AI_API_KEY: "private-test",
      AI_MODEL: "test-model",
      ALLOWED_ORIGINS: "http://localhost:3000",
      RATE_LIMIT_PER_MINUTE: "1000",
      RATE_LIMIT_GLOBAL_PER_MINUTE: "10000",
      ...extra,
    })[k];
const req = (
  body: unknown,
  key = "public-test",
  origin = "http://localhost:3000",
) =>
  new Request("https://example.test/functions/v1/parse-decision", {
    method: "POST",
    headers: { apikey: key, origin, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
const upstream = (data: unknown) =>
  vi.fn(async () =>
    Response.json({
      choices: [{ message: { content: JSON.stringify(data) } }],
    }),
  ) as unknown as typeof fetch;
afterEach(() => vi.useRealTimers());
describe("actual Edge handler with mocked model transport", () => {
  it("rejects invalid caller and origins before model", async () => {
    const f = upstream({});
    const handler = createHandler("parse", env(), f);
    expect((await handler(req({ text: examples.offer }, "wrong"))).status).toBe(
      401,
    );
    expect(
      (
        await handler(
          req({ text: examples.offer }, "public-test", "https://evil.test"),
        )
      ).status,
    ).toBe(403);
    expect(f).not.toHaveBeenCalled();
  });
  it("returns explicit unconfigured service and no secret", async () => {
    const f = upstream({});
    const response = await createHandler(
      "parse",
      env({ AI_API_KEY: "" }),
      f,
    )(req({ text: examples.offer }));
    expect(response.status).toBe(503);
    expect(await response.text()).toContain("尚未配置 AI 服务");
    expect(f).not.toHaveBeenCalled();
  });
  it("rejects invalid input and huge request", async () => {
    const h = createHandler("parse", env(), upstream({}));
    expect((await h(req({ text: "" }))).status).toBe(400);
    expect((await h(req({ text: "a".repeat(70000) }))).status).toBe(413);
  });
  it("validates parse success and schema failure", async () => {
    const data = { status: "ready", decision: demoParse(examples.offer) };
    const response = await createHandler(
      "parse",
      env(),
      upstream(data),
    )(req({ text: examples.offer }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: {...data, decision:{...data.decision, verificationNotes:[]}} });
    const bad = await createHandler(
      "parse",
      env(),
      upstream({ hello: "world" }),
    )(req({ text: examples.offer }));
    expect(bad.status).toBe(502);
    expect(await bad.text()).not.toContain("private-test");
  });
  it("sends corrected information to model and validates full report", async () => {
    const d = demoParse(examples.study);
    d.constraints = "需要现成数据";
    const f = upstream(demoAnalyze(d));
    const res = await createHandler(
      "analyze",
      env({ AI_MODEL: "kimi-k3.1-pro", AI_BASE_URL: "https://api.moonshot.cn/v1" }),
      f,
    )(req({ decision: d }));
    expect(res.status).toBe(200);
    const call = vi.mocked(f).mock.calls[0];
    const body = JSON.parse(String(call[1]?.body));
    expect(String(call[1]?.body)).toContain("需要现成数据");
    expect(body.max_completion_tokens).toBe(12000);
    expect(body.messages[0].content).toContain('"maxItems":1');
  });
  it("retries upstream errors once then returns a safe error", async () => {
    const f = vi.fn(
      async () => new Response("private-provider-details", { status: 500 }),
    );
    const res = await createHandler(
      "parse",
      env(),
      f,
    )(req({ text: examples.offer }));
    expect(f).toHaveBeenCalledTimes(2);
    expect(res.status).toBe(502);
    expect(await res.text()).not.toContain("private-provider-details");
  });
  it("enforces request timeout", async () => {
    vi.useFakeTimers();
    const f = vi.fn(
      (_url: unknown, init?: RequestInit) =>
        new Promise<Response>((_, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(new Error("abort")),
          );
        }),
    );
    const promise = createHandler(
      "parse",
      env(),
      f,
    )(req({ text: examples.offer }));
    await vi.waitFor(() => expect(f).toHaveBeenCalled());
    await vi.advanceTimersByTimeAsync(25001);
    const res = await promise;
    expect(res.status).toBe(504);
  });
  it("rate-limits requests", async () => {
    const request = () =>
      new Request("https://example.test", {
        method: "POST",
        headers: {
          apikey: "public-test",
          "x-forwarded-for": "unique-rate-test",
        },
        body: JSON.stringify({ text: examples.offer }),
      });
    const h = createHandler(
      "parse",
      env({ RATE_LIMIT_PER_MINUTE: "1" }),
      upstream({ status: "needs_clarification", message: "请补充选项" }),
    );
    expect((await h(request())).status).toBe(200);
    const second = await h(request());
    expect(second.status).toBe(429);
    expect(second.headers.get("Retry-After")).toBe("60");
  });
});

it("demo output remains valid for maximum editable input sizes", () => {
  const d = demoParse(examples.study);
  d.preferences = "研".repeat(2000);
  d.constraints = "约".repeat(2000);
  d.options[0].facts = "事".repeat(2000);
  d.options[0].unknowns = "未".repeat(2000);
  d.factorPreferences = Array.from({ length: 20 }, (_, i) => ({
    name: `factor-${i}`,
    source: "user" as const,
    included: true,
  }));
  expect(() => validateReportForDecision(demoAnalyze(d), d)).not.toThrow();
});

it("uses bounded Kimi K3.1 reasoning and the supported completion budget", async () => {
  const fake = upstream({
    status: "needs_clarification",
    message: "请补充具体选项",
  });
  const h = createHandler(
    "parse",
    env({
      AI_MODEL: "kimi-k3.1-pro",
      AI_BASE_URL: "https://api.moonshot.cn/v1",
    }),
    fake,
  );
  const response = await h(req({ text: examples.offer }));
  expect(response.status).toBe(200);
  const body = JSON.parse(String(vi.mocked(fake).mock.calls[0][1]?.body));
  expect(body.reasoning_effort).toBe("low");
  expect(body.max_completion_tokens).toBe(6000);
  expect(body).not.toHaveProperty("max_tokens");
});


it("rejects truncated model completions without showing a partial conclusion", async () => {
  const fake = vi.fn(async () => Response.json({ choices: [{ finish_reason: "length", message: { content: '{"summary":' } }] })) as unknown as typeof fetch;
  const h = createHandler("analyze", env(), fake);
  const response = await h(req({ decision: demoParse(examples.offer) }));
  expect(response.status).toBe(502);
  expect((await response.json()).error.code).toBe("AI_OUTPUT_TRUNCATED");
});

it("reserves enough Kimi output budget for the full report", async () => {
  const d = demoParse(examples.offer);
  const fake = upstream(demoAnalyze(d));
  const h = createHandler("analyze", env({ AI_MODEL: "kimi-k3.1-pro", AI_BASE_URL: "https://api.moonshot.cn/v1" }), fake);
  expect((await h(req({ decision: d }))).status).toBe(200);
  const body = JSON.parse(String(vi.mocked(fake).mock.calls[0][1]?.body));
  expect(body.max_completion_tokens).toBe(12000);
    expect(body.messages[0].content).toContain('"maxItems":1');
});

it("uses a configurable fast model without unsupported thinking parameters", async () => {
 const fake = upstream({status:"needs_clarification",message:"请补充选项"});
 const h=createHandler("parse",env({AI_PARSE_MODEL:"kimi-k2.6",AI_BASE_URL:"https://api.moonshot.cn/v1"}),fake);
 expect((await h(req({text:examples.offer}))).status).toBe(200);
 const body=JSON.parse(String(vi.mocked(fake).mock.calls[0][1]?.body));
 expect(body.model).toBe("kimi-k2.6");
 expect(body.thinking).toEqual({type:"disabled"});
 expect(body).not.toHaveProperty("reasoning_effort");
});

it("keeps context-specific suggestions optional for older drafts",()=>{
 const d=demoParse(examples.offer);
 expect(DecisionSchema.safeParse(d).success).toBe(true);
 expect(DecisionSchema.parse({...d,preferenceSuggestions:["休息恢复","朋友感受"],constraintSuggestions:["已约好时间"]}).preferenceSuggestions).toEqual(["休息恢复","朋友感受"]);
 expect(DecisionSchema.safeParse({...d,preferenceSuggestions:["x".repeat(31)]}).success).toBe(false);
});
