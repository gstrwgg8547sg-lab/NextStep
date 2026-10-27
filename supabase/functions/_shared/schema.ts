import { z } from "zod";
const text = z.string().trim().min(1).max(1200);
const note = z.string().max(2000);
export const RawInputSchema = z
  .object({
    text: z
      .string()
      .trim()
      .min(10, "请补充你正在考虑的选项或具体情况（至少 10 字）。")
      .max(2000, "最多输入 2000 字。"),
  })
  .strict();
export const OptionSchema = z
  .object({
    id: z.string().min(1).max(80),
    name: z.string().trim().min(1, "请填写方案名称").max(100),
    facts: note,
    judgments: note,
    unknowns: note,
  })
  .strict();
export const FactorPreferenceSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    source: z.enum(["ai_suggestion", "user"]),
    included: z.boolean(),
  })
  .strict();
export const CriterionSchema = z
  .object({
    id: z.string().min(1).max(80),
    name: z.string().trim().min(1).max(40),
    priority: z.enum(["must", "prefer", "consider"]),
    requirement: z.string().max(160),
  })
  .strict();
export const DecisionSchema = z
  .object({
    title: z.string().trim().min(1, "请填写决策主题").max(100),
    domain: z.enum(["career", "study", "research", "life", "other"]),
    options: z.array(OptionSchema).min(2, "请填写至少两个候选方案").max(6),
    preferenceSuggestions: z
      .array(z.string().trim().min(1).max(30))
      .max(6)
      .optional(),
    constraintSuggestions: z
      .array(z.string().trim().min(1).max(30))
      .max(6)
      .optional(),
    criteria: z.array(CriterionSchema).max(5).optional(),
    depth: z.enum(["quick", "standard"]).optional(),
    verificationNotes: z
      .array(z.object({ question: text, answer: note }).strict())
      .max(12)
      .optional(),
    preferences: note,
    constraints: note,
    questions: z
      .array(
        z
          .object({
            question: text,
            answer: note,
            suggestedAnswers: z.array(z.string().max(40)).max(8).optional(),
          })
          .strict(),
      )
      .max(3),
    factorPreferences: z.array(FactorPreferenceSchema).max(20),
  })
  .strict()
  .superRefine((d, c) => {
    if (
      d.criteria &&
      new Set(d.criteria.map((x) => x.id)).size !== d.criteria.length
    )
      c.addIssue({
        code: "custom",
        message: "决策标准标识不能重复",
        path: ["criteria"],
      });
    if (new Set(d.options.map((o) => o.id)).size !== d.options.length)
      c.addIssue({
        code: "custom",
        message: "方案标识不能重复",
        path: ["options"],
      });
  });
export const ParseResultSchema = z.discriminatedUnion("status", [
  z
    .object({ status: z.literal("needs_clarification"), message: text })
    .strict(),
  z.object({ status: z.literal("ready"), decision: DecisionSchema }).strict(),
]);
export const InsightSchema = z
  .object({
    title: text,
    explanation: text,
    basis: text,
    source: z.enum(["user_fact", "ai_inference", "unknown"]),
  })
  .strict();
export const LegacyReportSchema = z
  .object({
    summary: text,
    conclusion: text,
    reasons: z.array(InsightSchema).min(2).max(3),
    counterReason: text,
    limitations: z.array(text).min(1).max(6),
    nextQuestions: z.array(text).min(1).max(3),
    factors: z
      .array(
        z
          .object({
            name: z.string().min(1).max(100),
            why: text,
            relevance: text,
            source: z.enum(["user_fact", "ai_inference", "unknown"]),
          })
          .strict(),
      )
      .max(12),
    options: z
      .array(
        z
          .object({
            optionId: z.string().min(1).max(80),
            pros: z.array(InsightSchema).min(1).max(5),
            cons: z.array(InsightSchema).min(1).max(5),
            risks: z.array(InsightSchema).min(1).max(5),
            opportunityCosts: z.array(InsightSchema).min(1).max(5),
            paths: z
              .object({
                short: InsightSchema,
                medium: InsightSchema,
                long: InsightSchema,
              })
              .strict(),
          })
          .strict(),
      )
      .min(2)
      .max(6),
    unknowns: z
      .array(
        z
          .object({
            question: text,
            why: text,
            dimension: text,
            verifyWith: text,
          })
          .strict(),
      )
      .min(1)
      .max(8),
  })
  .strict();
const brief = z.string().trim().min(1).max(120);
export const ModernReportSchema = z
  .object({
    version: z.literal(2),
    summary: brief,
    conclusion: brief,
    recommendedOptionId: z.string().min(1).max(80).nullable(),
    exchange: z
      .object({ gain: brief, cost: brief, why: brief })
      .strict()
      .optional(),
    reasons: z
      .array(
        InsightSchema.extend({
          criterionIds: z.array(z.string().min(1).max(80)).min(1).max(5),
        }),
      )
      .min(1)
      .max(2),
    prerequisites: z.array(brief).max(2),
    switchConditions: z.array(brief).max(2),
    comparisons: z
      .array(
        z
          .object({
            criterionId: z.string().min(1).max(80),
            assessments: z
              .array(
                z
                  .object({
                    optionId: z.string().min(1).max(80),
                    assessment: brief,
                    basis: brief,
                    source: z.enum(["user_fact", "ai_inference", "unknown"]),
                    status: z.enum(["met", "not_met", "uncertain", "mixed"]),
                  })
                  .strict(),
              )
              .min(2)
              .max(6),
          })
          .strict(),
      )
      .min(1)
      .max(5),
    tradeoffs: z
      .array(
        z
          .object({
            optionId: z.string().min(1).max(80),
            risk: brief,
            opportunityCost: brief,
            basis: brief,
            impacts: z
              .array(
                z
                  .object({
                    horizon: z.enum(["short", "medium", "long"]),
                    effect: brief,
                    condition: brief,
                  })
                  .strict(),
              )
              .max(3),
          })
          .strict(),
      )
      .min(2)
      .max(6),
    unknowns: z
      .array(
        z
          .object({
            criterionId: z.string().min(1).max(80).nullable().optional(),
            optionIds: z
              .array(z.string().min(1).max(80))
              .min(1)
              .max(6)
              .optional(),
            question: brief,
            why: brief,
            dimension: brief,
            verifyWith: brief,
          })
          .strict(),
      )
      .max(3),
    omittedFactors: z
      .array(z.object({ name: brief, why: brief }).strict())
      .max(2),
  })
  .strict();
export const ReportSchema = z.union([ModernReportSchema, LegacyReportSchema]);
export type ModernReport = z.infer<typeof ModernReportSchema>;
export type LegacyReport = z.infer<typeof LegacyReportSchema>;
export type Criterion = z.infer<typeof CriterionSchema>;
export function validateReportForDecision(value: unknown, decision: Decision) {
  const report = ReportSchema.parse(value);
  if ("version" in report) {
    const ids = decision.options.map((o) => o.id);
    const complete = (actual: string[], expected: string[]) =>
      actual.length === expected.length &&
      new Set(actual).size === actual.length &&
      expected.every((id) => actual.includes(id));
    const criteria = decision.criteria ?? [];
    if (
      !complete(
        report.comparisons.map((c) => c.criterionId),
        criteria.map((c) => c.id),
      ) ||
      report.comparisons.some(
        (c) =>
          !complete(
            c.assessments.map((a) => a.optionId),
            ids,
          ),
      ) ||
      !complete(
        report.tradeoffs.map((t) => t.optionId),
        ids,
      )
    )
      throw new Error("对比未完整覆盖确认的标准和方案");
    if (
      report.reasons.some((r) =>
        r.criterionIds.some((id) => !criteria.some((c) => c.id === id)),
      )
    )
      throw new Error("结论依据引用了未确认的标准");
    if (
      report.comparisons.some((c) =>
        c.assessments.some(
          (a) => a.source === "unknown" && a.status !== "uncertain",
        ),
      )
    )
      throw new Error("未知不能当作已满足条件");
    const factTexts = [
      ...decision.options.map((o) => o.facts),
      decision.preferences,
      decision.constraints,
      ...criteria.map((c) => c.requirement),
      ...decision.questions.map((q) => q.answer),
      ...(decision.verificationNotes ?? []).map((n) => n.answer),
    ].filter(Boolean);
    for (const item of [
      ...report.reasons,
      ...report.comparisons.flatMap((c) => c.assessments),
    ]) {
      if (
        item.source === "user_fact" &&
        !factTexts.some((t) => t.includes(item.basis))
      )
        throw new Error("用户事实依据必须引用已确认内容原文");
    }
    if (report.recommendedOptionId !== null) {
      if (!ids.includes(report.recommendedOptionId))
        throw new Error("推荐方案不存在");
      for (const criterion of criteria.filter((c) => c.priority === "must")) {
        const cell = report.comparisons
          .find((c) => c.criterionId === criterion.id)!
          .assessments.find((a) => a.optionId === report.recommendedOptionId)!;
        if (cell.status === "not_met")
          throw new Error("必须条件未满足，不能推荐该方案");
      }
    }
    if (
      decision.depth === "quick" &&
      report.tradeoffs.some((t) => t.impacts.length)
    )
      throw new Error("简明分析不应包含长期推演");
    for (const u of report.unknowns) {
      if (u.criterionId && !criteria.some((c) => c.id === u.criterionId))
        throw new Error("未知项引用了未确认的标准");
      if (u.optionIds?.some((id) => !ids.includes(id)))
        throw new Error("未知项引用了不存在的方案");
    }
    if (
      getFeasibility(report, decision).every((o) => o.status === "excluded")
    ) {
      report.conclusion =
        "当前所有方案都不满足你确认的必须条件。先调整候选方案，或重新确认这些底线，再作选择。";
    }
    return report;
  }
  const ids = report.options.map((o) => o.optionId);
  if (
    new Set(ids).size !== ids.length ||
    ids.length !== decision.options.length ||
    decision.options.some((o) => !ids.includes(o.id))
  )
    throw new Error("报告方案与已确认方案不一致");
  return report;
}
export const AnalyzeInputSchema = z
  .object({ decision: DecisionSchema })
  .strict();
export const ModeSchema = z.enum(["live", "demo"]);
export const SavedReportSchema = z
  .object({
    id: z.string(),
    createdAt: z.string().datetime(),
    mode: ModeSchema,
    raw: z.string().max(2000),
    decision: DecisionSchema,
    report: ReportSchema,
    revision: z
      .object({
        previousConclusion: text,
        previousOptionId: z.string().nullable(),
        changes: z.array(text).max(10),
      })
      .strict()
      .optional(),
  })
  .strict()
  .superRefine((s, c) => {
    try {
      validateReportForDecision(s.report, s.decision);
    } catch {
      c.addIssue({ code: "custom", message: "报告方案不一致" });
    }
  });
// Drafts permit temporarily empty title/name while editing; submitted data remains strict.
export const EditableDecisionSchema = z
  .object({
    ...DecisionSchema.shape,
    title: z.string().max(100),
    criteria: z
      .array(CriterionSchema.extend({ name: z.string().max(40) }))
      .max(5)
      .optional(),
    options: z
      .array(
        z.object({ ...OptionSchema.shape, name: z.string().max(100) }).strict(),
      )
      .min(2)
      .max(6),
  })
  .strict();
export const DraftSchema = z
  .object({
    raw: z.string().max(2000),
    mode: ModeSchema,
    decision: EditableDecisionSchema.nullable(),
    current: SavedReportSchema.nullable(),
  })
  .strict();
export type Decision = z.infer<typeof DecisionSchema>;
export type Report = z.infer<typeof ReportSchema>;
export type Insight = z.infer<typeof InsightSchema>;
export type SavedReport = z.infer<typeof SavedReportSchema>;
export type Mode = z.infer<typeof ModeSchema>;
export type Draft = z.infer<typeof DraftSchema>;

/** Reference confirmed evidence by ID during generation to avoid paraphrased facts. */
export function decisionEvidence(decision: Decision) {
  const items = [
    ...decision.options.map((o) => ({
      text: o.facts,
      optionId: o.id,
      label: o.name,
    })),
    { text: decision.preferences, optionId: null, label: "用户偏好" },
    { text: decision.constraints, optionId: null, label: "现实限制" },
    ...(decision.criteria ?? []).map((c) => ({
      text: c.requirement,
      optionId: null,
      label: c.name,
    })),
    ...decision.questions.map((q) => ({
      text: q.answer,
      optionId: null,
      label: q.question,
    })),
    ...(decision.verificationNotes ?? []).map((n) => ({
      text: n.answer,
      optionId: null,
      label: n.question,
    })),
  ].filter((x) => x.text.trim());
  return Object.fromEntries(items.map((x, i) => [`F${i + 1}`, x]));
}
export function resolveEvidenceReferences(
  value: unknown,
  decision: Decision,
): unknown {
  const report = ModernReportSchema.parse(value);
  const refs = decisionEvidence(decision);
  const resolve = (
    item: { source: string; basis: string },
    optionId?: string,
  ) => {
    if (item.source !== "user_fact") return;
    const ref = refs[item.basis];
    if (!ref) return; // Literal, exact quotes are still accepted by final validation.
    if (optionId && ref.optionId && ref.optionId !== optionId)
      throw new Error("事实引用了其他候选方案");
    item.basis = ref.text.slice(0, 120);
  };
  report.reasons.forEach((r) => resolve(r));
  report.comparisons.forEach((c) =>
    c.assessments.forEach((a) => resolve(a, a.optionId)),
  );
  // Older and current providers may use evidence IDs in tradeoff bases too.
  for (const t of report.tradeoffs) {
    if (/^F\d+(?:[,，、 ]+F\d+)*$/.test(t.basis)) {
      const ids = t.basis.match(/F\d+/g)!;
      if (ids.some((id) => !refs[id]))
        throw new Error("机会成本引用了不存在的依据");
      t.basis = ids
        .map((id) => refs[id].text)
        .join("；")
        .slice(0, 120);
    }
  }
  return report;
}

/** Deterministic screening over validated assessments; no extra model request. */
export function getFeasibility(report: ModernReport, decision: Decision) {
  const must = (decision.criteria ?? []).filter((c) => c.priority === "must");
  return decision.options.map((o) => {
    const checks = must.map((c) => ({
      criterion: c,
      cell: report.comparisons
        .find((row) => row.criterionId === c.id)
        ?.assessments.find((a) => a.optionId === o.id),
    }));
    const failed = checks.filter((x) => x.cell?.status === "not_met");
    const pending = checks.filter(
      (x) => !x.cell || ["uncertain", "mixed"].includes(x.cell.status),
    );
    return {
      optionId: o.id,
      name: o.name,
      status: !must.length
        ? "no_must"
        : failed.length
          ? "excluded"
          : pending.length
            ? "unconfirmed"
            : "eligible",
      failed: failed.map((x) => x.criterion.name),
      pending: pending.map((x) => x.criterion.name),
    };
  });
}
export function unknownImpact(
  unknown: ModernReport["unknowns"][number],
  report: ModernReport,
  decision: Decision,
): "blocking" | "ranking" | "detail" | "unclassified" {
  if (unknown.criterionId === undefined || !unknown.optionIds)
    return "unclassified";
  const viable = getFeasibility(report, decision).filter(
    (o) => o.status !== "excluded",
  );
  if (!unknown.optionIds.some((id) => viable.some((o) => o.optionId === id)))
    return "detail";
  const c = decision.criteria?.find((c) => c.id === unknown.criterionId);
  const row = report.comparisons.find((r) => r.criterionId === c?.id);
  if (
    c?.priority === "must" &&
    row?.assessments.some(
      (a) =>
        unknown.optionIds!.includes(a.optionId) &&
        viable.some((o) => o.optionId === a.optionId) &&
        ["uncertain", "mixed"].includes(a.status),
    )
  )
    return "blocking";
  return c?.priority === "prefer" ? "ranking" : "detail";
}
