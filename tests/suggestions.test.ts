import { describe, it, expect } from "vitest";
import { invalidateStaleSuggestions } from "../src/lib/decision-suggestions";
import { demoParse, examples } from "../src/lib/demo";
const decision = () => ({
  ...demoParse(examples.offer),
  preferenceSuggestions: ["成长"],
  constraintSuggestions: ["工作天数"],
  questions: [
    {
      question: "每周能实习几天？",
      answer: "",
      suggestedAnswers: ["三天", "五天", "不确定"],
    },
  ],
});
describe("suggestions belong to their decision and question", () => {
  it("preserves choices when selecting an answer", () => {
    const d = decision();
    expect(
      invalidateStaleSuggestions(d, {
        ...d,
        questions: [{ ...d.questions[0], answer: "三天" }],
      }).questions[0].suggestedAnswers,
    ).toEqual(d.questions[0].suggestedAnswers);
  });
  it("clears options when the question changes", () => {
    const d = decision();
    expect(
      invalidateStaleSuggestions(d, {
        ...d,
        questions: [{ ...d.questions[0], question: "你的预算是多少？" }],
      }).questions[0].suggestedAnswers,
    ).toEqual([]);
  });
  it.each(["title", "domain", "options"] as const)(
    "invalidates suggestions when %s changes",
    (key) => {
      const d = decision();
      const next = { ...d };
      if (key === "title") next.title = "周末去哪里";
      if (key === "domain") next.domain = "life";
      if (key === "options")
        next.options = d.options.map((o, i) =>
          i === 0 ? { ...o, facts: "事实发生变化" } : o,
        );
      const result = invalidateStaleSuggestions(d, next);
      expect(result.preferenceSuggestions).toEqual([]);
      expect(result.constraintSuggestions).toEqual([]);
      expect(result.questions[0].suggestedAnswers).toEqual([]);
    },
  );
});
