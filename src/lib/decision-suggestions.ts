import type { Decision } from "./schema";

/** Suggestions belong to the exact decision context and question that produced them. */
export function invalidateStaleSuggestions(
  previous: Decision | null,
  next: Decision,
): Decision {
  if (!previous) return next;
  const context = (d: Decision) =>
    JSON.stringify({ title: d.title, domain: d.domain, options: d.options });
  const changed = context(previous) !== context(next);
  return {
    ...next,
    ...(changed
      ? { preferenceSuggestions: [], constraintSuggestions: [] }
      : {}),
    questions: next.questions.map((question, index) =>
      changed || previous.questions[index]?.question !== question.question
        ? { ...question, suggestedAnswers: [] }
        : question,
    ),
  };
}
