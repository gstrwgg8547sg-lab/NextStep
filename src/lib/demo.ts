import { type Decision, type Insight, type LegacyReport as Report } from "./schema";
export const examples = {
  offer:
    "我有两份实习，A 公司薪资较高，但可能经常加班；B 公司薪资较低，但有导师带教。我希望以后从事产品经理工作，不知道应该选择哪份。",
  study:
    "我正在考虑研究生阶段选择计算机视觉还是激光雷达测深方向，我比较在意科研难度、毕业压力和未来就业。",
  purchase:
    "我在纠结是否要购买一台新的笔记本电脑，旧电脑还能用，但有点慢。我比较在意预算、便携性和科研学习需求。",
};
// Explicitly selected demo fixtures. Never used as a fallback for live requests.
export function demoParse(raw: string): Decision {
  const key = (Object.keys(examples) as (keyof typeof examples)[]).find(
    (k) => examples[k] === raw.trim(),
  );
  if (!key)
    throw new Error(
      "示例体验仅支持上方三个示例问题；自定义问题请关闭示例体验使用在线分析。",
    );
  const study = key === "study",
    purchase = key === "purchase";
  return {
    title: study
      ? "选择研究方向"
      : purchase
        ? "是否更换笔记本电脑"
        : "比较两份实习 Offer",
    domain: study ? "study" : purchase ? "life" : "career",
    options: (study
      ? [
          ["计算机视觉方向", "", "", "导师资源、数据条件、毕业要求"],
          ["激光雷达测深方向", "", "", "数据来源、实验条件、具体课题"],
        ]
      : purchase
        ? [
            ["继续使用旧电脑", "旧电脑还能用", "有点慢", "当前任务的性能瓶颈"],
            ["购买新电脑", "", "可能改善使用体验", "预算和实际配置需求"],
          ]
        : [
            [
              "A 公司实习",
              "用户描述薪资较高",
              "可能经常加班",
              "实际岗位职责与工时",
            ],
            [
              "B 公司实习",
              "用户描述薪资较低、有导师带教",
              "",
              "带教投入与具体项目",
            ],
          ]
    ).map(([name, facts, judgments, unknowns], i) => ({
      id: `option-${i + 1}`,
      name,
      facts,
      judgments,
      unknowns,
    })),
    preferences: study
      ? "科研难度、毕业压力、未来就业"
      : purchase
        ? "预算、便携性、科研学习需求"
        : "以后从事产品经理工作",
    constraints: "",
    questions: (study
      ? [
          "你目前的编程和相关研究基础如何？",
          "导师提供哪些现成数据与实验条件？",
        ]
      : purchase
        ? ["预算上限是多少？", "主要使用哪些软件？"]
        : [
            "薪资、成长与生活平衡，你最看重什么？",
            "实际岗位职责和带教安排是否已确认？",
          ]
    ).map((question) => ({ question, answer: "", suggestedAnswers: [] })),
    factorPreferences: [],
  };
}
const excerpt = (value: string, limit = 1100) =>
  value.length > limit ? value.slice(0, limit - 1) + "…" : value;
function insight(
  title: string,
  explanation: string,
  basis: string,
  source: Insight["source"] = "ai_inference",
): Insight {
  return {
    title: excerpt(title),
    explanation: excerpt(explanation),
    basis: excerpt(basis),
    source,
  };
}
export function demoAnalyze(d: Decision): Report {
  const study = d.domain === "study";
  const research = d.domain === "research";
  const names = study
    ? ["导师与指导资源", "数据和实验条件", "毕业要求与个人基础"]
    : research
      ? ["课题可行性", "导师与资源支持", "成果与毕业要求"]
      : d.domain === "career"
        ? ["实际岗位职责", "带教与反馈机制", "隐性时间成本"]
        : ["真实需求", "总拥有成本", "使用频率与替代方案"];
  const requested = d.factorPreferences
    .filter((f) => f.included)
    .map((f) => f.name);
  const excluded = d.factorPreferences
    .filter((f) => !f.included)
    .map((f) => f.name);
  const factors = [...new Set([...requested, ...names])]
    .filter((n) => !excluded.includes(n))
    .slice(0, 5);
  return {
    summary: `演示报告：围绕「${d.title}」展示分析结构。你的关注点为「${excerpt(d.preferences || "尚未补充", 400)}」，限制为「${excerpt(d.constraints || "尚未补充", 400)}」。以下内容由本地示例规则生成，不是 AI 对这些条件的实际推理。`,
    conclusion: study
      ? `更倾向「${d.options[0].name}」，前提是其导师资源与数据条件更明确；若${d.options[1]?.name ?? "另一方案"}的可行性更高则改选。`
      : research
        ? `更倾向「${d.options[0].name}」，前提是课题已有基础与资源；若${d.options[1]?.name ?? "另一方案"}的导师支持更明确则改选。`
        : `更倾向「${d.options[1].name}」，因其与目标匹配度更高且不确定性更小；若${d.options[0].name}的关键条件（如薪资、带教）更优则改选。`,
    reasons: [
      insight(
        "先核实关键条件",
        "先了解方案实际内容，才能评估它与你目标的关系。",
        `你关注：${d.preferences || "未填写关注点"}`,
      ),
      insight(
        "明确不能妥协的边界",
        `当前限制：${d.constraints || "尚未提供，应在决策前确认"}。`,
        "来自当前确认表单；此处仅用于演示条件回显。",
        d.constraints ? "user_fact" : "unknown",
      ),
    ],
    counterReason:
      "其他方案可能提供不同的收益，需核实其实际条件后再比较，不能因为某一项优点就忽略其他取舍。",
    limitations: [
      "演示数据并非真实 AI 分析，不应据此做决定。",
      "用户提供的信息未经外部核实；本产品不查询实时事实。",
    ],
    nextQuestions: study
      ? ["向导师确认具体课题和可用数据。", "核实毕业要求及指导安排。"]
      : research
        ? ["确认课题已有基础与可用资源。", "核实预期产出与时间要求。"]
        : ["核实各方案的实际内容。", "确认最重要的条件是否能够兑现。"],
    factors: factors.map((name) => ({
      name,
      why: "可能影响资源投入与结果，需要作为独立因素核实。",
      relevance: `与「${excerpt(d.preferences || d.title)}」相关；演示仅展示因子结构。`,
      source: "unknown",
    })),
    options: d.options.map((o) => ({
      optionId: o.id,
      pros: [
        insight(
          "可能的收益",
          o.facts || "信息不足，无法可靠判断优势。",
          o.facts ? `用户提供：${o.facts}` : "未提供事实依据",
          o.facts ? "user_fact" : "unknown",
        ),
      ],
      cons: [
        insight(
          "需要承担的取舍",
          "该方案是否满足所有关注点尚不明确。",
          `关注点：${d.preferences || "待补充"}`,
          "unknown",
        ),
      ],
      risks: [
        insight(
          "关键条件未确认",
          o.unknowns || "实际结果仍需进一步确认。",
          o.judgments ? `主观判断，未证实：${o.judgments}` : "目前缺少足够证据",
          "unknown",
        ),
      ],
      opportunityCosts: [
        insight(
          "放弃其他选择的价值",
          `选择此方案意味着暂时放弃 ${d.options
            .filter((x) => x.id !== o.id)
            .map((x) => x.name)
            .join("、")} 的潜在机会。`,
          "候选方案是相互取舍的选择，具体损失尚需比较。",
        ),
      ],
      paths: {
        short: insight(
          "短期 · 确认与适应",
          `首先核实：${o.unknowns || "方案实际条件"}。`,
          "条件尚未核实",
          "unknown",
        ),
        medium: insight(
          "中期 · 投入与积累",
          "结果取决于资源、实际内容和持续投入。",
          "演示条件性推演，非预测",
        ),
        long: insight(
          "长期 · 机会与方向",
          "现有信息无法支持可靠的长期结论。",
          "缺少长期证据",
          "unknown",
        ),
      },
    })),
    unknowns: (study
      ? ["具体课题与现成数据", "导师反馈与毕业要求"]
      : research
        ? ["课题基础与可用资源", "预期产出与时间要求"]
        : ["实际职责或使用需求", "资源承诺与成本"]
    ).map((question) => ({
      question,
      why: "此信息可能改变当前取舍，需优先核实。",
      dimension: study || research ? "研究可行性与毕业压力" : "目标匹配与投入成本",
      verifyWith: study || research
        ? "向导师、学院或在读学生了解，并核对正式要求。"
        : "向相关负责人或官方渠道了解具体条件。",
    })),
  };
}
