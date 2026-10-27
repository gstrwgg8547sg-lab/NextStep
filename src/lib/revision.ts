import type { Decision, SavedReport } from "./schema";
export function describeRevision(
  previous: SavedReport | null,
  next: Decision,
): SavedReport["revision"] {
  if (!previous || !("version" in previous.report)) return undefined;
  const labels: Partial<Record<keyof Decision, string>> = {
    title: "决策主题",
    domain: "领域",
    options: "方案信息",
    criteria: "决策标准或优先级",
    preferences: "目标偏好",
    constraints: "现实限制",
    questions: "补充回答",
    depth: "分析深度",
    verificationNotes: "核实结果",
    factorPreferences: "关注因素",
  };
  const changes = Object.entries(labels)
    .filter(
      ([key]) =>
        JSON.stringify(previous.decision[key as keyof Decision]) !==
        JSON.stringify(next[key as keyof Decision]),
    )
    .map(([, label]) => label!);
  if (!changes.length) return undefined;
  return {
    previousConclusion: previous.report.conclusion,
    previousOptionId: previous.report.recommendedOptionId,
    changes,
  };
}
