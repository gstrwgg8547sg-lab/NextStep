import { expect, it } from "vitest";
import {
  validateReportForDecision,
  SavedReportSchema,
  type Decision,
  type ModernReport,
} from "../src/lib/schema";
import { describeRevision } from "../src/lib/revision";
const d: Decision = {
  title: "两个实习",
  domain: "career",
  options: ["a", "b"].map((id) => ({
    id,
    name: id,
    facts: "每周三天",
    judgments: "",
    unknowns: "",
  })),
  criteria: [
    {
      id: "time",
      name: "学习时间",
      priority: "must",
      requirement: "每周至少两天",
    },
  ],
  depth: "quick",
  preferences: "准备考试",
  constraints: "",
  questions: [],
  factorPreferences: [],
};
export function sampleModern(): ModernReport {
  return {
    version: 2,
    summary: "以学习时间为先",
    conclusion: "目前倾向a",
    recommendedOptionId: "a",
    reasons: [
      {
        title: "时间可兼顾",
        explanation: "每周三天实习",
        basis: "每周三天",
        source: "user_fact",
        criterionIds: ["time"],
      },
    ],
    prerequisites: [],
    switchConditions: [],
    comparisons: [
      {
        criterionId: "time",
        assessments: ["a", "b"].map((optionId) => ({
          optionId,
          assessment: "可保留学习时间",
          basis: "每周三天",
          source: "user_fact",
          status: "met",
        })),
      },
    ],
    tradeoffs: ["a", "b"].map((optionId) => ({
      optionId,
      risk: "实际加班未知",
      opportunityCost: "放弃另一团队体验",
      basis: "用户提供的两个选择",
      impacts: [],
    })),
    unknowns: [],
    omittedFactors: [],
  };
}
it("covers every confirmed criterion and option", () => {
  expect(validateReportForDecision(sampleModern(), d)).toHaveProperty(
    "version",
    2,
  );
  const r = sampleModern();
  r.comparisons[0].assessments.pop();
  expect(() => validateReportForDecision(r, d)).toThrow();
});
it("rejects recommendation violating a must condition", () => {
  const r = sampleModern();
  r.comparisons[0].assessments[0].status = "not_met";
  expect(() => validateReportForDecision(r, d)).toThrow("必须");
});
it("allows withholding recommendation when a must condition is unknown", () => {
  const r = sampleModern();
  r.comparisons[0].assessments[0].status = "uncertain";
  r.comparisons[0].assessments[0].source = "unknown";
  expect(() => validateReportForDecision(r, d)).toThrow("必须");
  r.recommendedOptionId = null;
  r.conclusion = "先确认实际工时，再决定";
  expect(() => validateReportForDecision(r, d)).not.toThrow();
});
it("does not turn unknown evidence into a satisfied condition", () => {
  const r = sampleModern();
  r.comparisons[0].assessments[0].source = "unknown";
  expect(() => validateReportForDecision(r, d)).toThrow("未知");
});
it("requires conclusion reasons to reference confirmed criteria", () => {
  const r = sampleModern();
  r.reasons[0].criterionIds = ["salary"];
  expect(() => validateReportForDecision(r, d)).toThrow("标准");
});
it("quick analysis cannot force long-term predictions", () => {
  const r = sampleModern();
  r.tradeoffs[0].impacts = [
    { horizon: "long", effect: "长期影响", condition: "条件" },
  ];
  expect(() => validateReportForDecision(r, d)).toThrow("长期");
});
it("saved modern report survives validation and revisions record real changes", () => {
  const previous = SavedReportSchema.parse({
    id: "1",
    createdAt: new Date().toISOString(),
    mode: "live",
    raw: "原始输入",
    decision: d,
    report: sampleModern(),
  });
  expect(describeRevision(previous, d)).toBeUndefined();
  expect(
    describeRevision(previous, {
      ...d,
      criteria: [{ ...d.criteria![0], priority: "prefer" }],
    }),
  ).toMatchObject({ changes: ["决策标准或优先级"], previousOptionId: "a" });
});

it("repairs one invalid model response without accepting it or losing inputs", async () => {
  const { createHandler } =
    await import("../supabase/functions/_shared/handler");
  let count = 0;
  const handler = createHandler(
    "analyze",
    (key) =>
      (
        ({
          SUPABASE_ANON_KEY: "public",
          AI_API_KEY: "private",
          AI_MODEL: "test",
          RATE_LIMIT_PER_MINUTE: "100",
          RATE_LIMIT_GLOBAL_PER_MINUTE: "1000",
        }) as Record<string, string>
      )[key],
    async () => {
      count++;
      const r = sampleModern();
      if (count === 1) r.comparisons[0].assessments[0].optionId = "wrong";
      return Response.json({
        choices: [{ message: { content: JSON.stringify(r) } }],
      });
    },
  );
  const response = await handler(
    new Request("https://example.test", {
      method: "POST",
      headers: { apikey: "public", "x-forwarded-for": "modern-repair" },
      body: JSON.stringify({ decision: d }),
    }),
  );
  expect(response.status).toBe(200);
  expect(count).toBe(2);
  expect((await response.json()).data.recommendedOptionId).toBe("a");
});
it("rejects invented user-fact citations", () => {
  const r = sampleModern();
  r.reasons[0].basis = "从未确认的薪资";
  expect(() => validateReportForDecision(r, d)).toThrow("原文");
});

it("resolves evidence IDs to confirmed text and rejects another option’s facts", async () => {
  const { resolveEvidenceReferences } = await import("../src/lib/schema");
  const r = sampleModern();
  r.reasons[0].basis = "F1";
  r.comparisons[0].assessments[0].basis = "F1";
  expect(
    validateReportForDecision(resolveEvidenceReferences(r, d), d).reasons[0]
      .basis,
  ).toBe("每周三天");
  r.comparisons[0].assessments[0].basis = "F2";
  expect(() => resolveEvidenceReferences(r, d)).toThrow("其他候选方案");
});

it("does not let extraction invent answered questions or verified records", async () => {
  const { createHandler } =
    await import("../supabase/functions/_shared/handler");
  const parsed = {
    ...d,
    questions: [{ question: "还有限制吗？", answer: "模型擅自填写" }],
    verificationNotes: [{ question: "是否已核实", answer: "模型擅自确认" }],
  };
  const h = createHandler(
    "parse",
    (key) =>
      (
        ({
          SUPABASE_ANON_KEY: "public",
          AI_API_KEY: "private",
          AI_MODEL: "test",
          RATE_LIMIT_PER_MINUTE: "100",
          RATE_LIMIT_GLOBAL_PER_MINUTE: "1000",
        }) as Record<string, string>
      )[key],
    async () =>
      Response.json({
        choices: [
          {
            message: {
              content: JSON.stringify({ status: "ready", decision: parsed }),
            },
          },
        ],
      }),
  );
  const response = await h(
    new Request("https://example.test", {
      method: "POST",
      headers: { apikey: "public", "x-forwarded-for": "parse-unverified" },
      body: JSON.stringify({ text: "两份实习之间我需要做一个选择" }),
    }),
  );
  const result = (await response.json()).data.decision;
  expect(result.verificationNotes).toEqual([]);
  expect(result.questions[0].answer).toBe("");
});

it("screens all-failed options without pretending information is merely missing", async () => {
  const { getFeasibility } = await import("../src/lib/schema");
  const r = sampleModern();
  r.recommendedOptionId = null;
  r.comparisons[0].assessments.forEach((a) => (a.status = "not_met"));
  expect(getFeasibility(r, d).every((o) => o.status === "excluded")).toBe(true);
  expect(validateReportForDecision(r, d).conclusion).toContain(
    "所有方案都不满足",
  );
});
it("an excluded option’s unknown cannot block viable options", async () => {
  const { unknownImpact } = await import("../src/lib/schema");
  const r = sampleModern();
  r.recommendedOptionId = "b";
  r.comparisons[0].assessments[0].status = "not_met";
  const u = {
    criterionId: "time",
    optionIds: ["a"],
    question: "A能否协商",
    why: "可能调整",
    dimension: "时间",
    verifyWith: "问HR",
  };
  expect(unknownImpact(u, r, d)).toBe("detail");
});
it("distinguishes unknown feasibility, ranking and peripheral details", async () => {
  const { unknownImpact } = await import("../src/lib/schema");
  const r = sampleModern();
  r.recommendedOptionId = null;
  r.comparisons[0].assessments[0].status = "uncertain";
  const u = {
    criterionId: "time",
    optionIds: ["a"],
    question: "可用时间多少",
    why: "影响时间",
    dimension: "时间",
    verifyWith: "问HR",
  };
  expect(unknownImpact(u, r, d)).toBe("blocking");
  expect(
    unknownImpact(u, r, {
      ...d,
      criteria: [{ ...d.criteria![0], priority: "prefer" }],
    }),
  ).toBe("ranking");
  expect(
    unknownImpact(u, r, {
      ...d,
      criteria: [{ ...d.criteria![0], priority: "consider" }],
    }),
  ).toBe("detail");
});
it("absence of must criteria never excludes all candidates", async () => {
  const { getFeasibility } = await import("../src/lib/schema");
  expect(
    getFeasibility(sampleModern(), {
      ...d,
      criteria: [{ ...d.criteria![0], priority: "prefer" }],
    }).every((o) => o.status === "no_must"),
  ).toBe(true);
});

it("builds the current recommendation from the validated choice instead of mixing in excluded alternatives", async () => {
  const { expandReport } = await import("../supabase/functions/_shared/handler");
  const r = sampleModern();
  r.exchange = {gain:"保留学习时间",cost:"放弃另一方案",why:"学习时间优先"};
  r.conclusion = "建议选b，即使违反底线";
  const result = validateReportForDecision(expandReport(r, d), d);
  expect(result.conclusion).toContain("倾向a");
  expect(result.conclusion).not.toContain("选b");
});
