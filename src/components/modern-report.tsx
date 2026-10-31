"use client";
import { useState } from "react";
import { ReportFeedback } from "./report-feedback";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shell, SubmitButton } from "./shell";
import { ReportAction, ReportTabs, sourceNames } from "./report-layout";
import { priorityNames } from "./criteria-editor";
import { useDecision } from "./decision-provider";
import { getFeasibility, unknownImpact } from "@/lib/schema";
import type { ModernReport, SavedReport } from "@/lib/schema";
import { uid } from "@/lib/utils";
type Props = { saved: SavedReport; report: ModernReport };
const statuses = {
  met: "符合",
  not_met: "不符合",
  uncertain: "待确认",
  mixed: "有取舍",
};
const horizons = { short: "短期", medium: "中期", long: "长期" };
export function ModernSummary({ saved, report: r }: Props) {
  const currentDecision = useDecision().draft.decision;
  const changed =
    JSON.stringify(currentDecision) !== JSON.stringify(saved.decision);
  const selected = saved.decision.options.find(
    (o) => o.id === r.recommendedOptionId,
  );
  const revision = saved.revision;
  const feasibility = getFeasibility(r, saved.decision);
  const noneFeasible = feasibility.every((o) => o.status === "excluded");
  return (
    <Shell step={3}>
      <main className="min-h-screen pt-24 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          {changed && (
            <div className="notice">
              条件已修改，当前仍是上次报告。请重新分析以更新判断。
            </div>
          )}

          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-ink-900 mb-2">
              {saved.decision.title}
            </h1>
            <div className="flex items-center justify-center gap-3 text-sm text-ink-500">
              <span className="chip-pop-purple text-xs">
                {saved.decision.depth === "quick" ? "简明分析" : "深度分析"}
              </span>
              <span>{new Date(saved.createdAt).toLocaleDateString("zh-CN")}</span>
            </div>
          </div>

          <ReportTabs />

          <section className="relative card-pop-purple p-8 mb-6 overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-pop-yellow/20 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-pop-pink/20 rounded-full blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm font-semibold text-pop-purple-dark">
                  ✨ 推荐方案
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                <span className="gradient-sunset">
                  {selected
                    ? selected.name
                    : noneFeasible
                      ? "当前方案都不满足底线"
                      : "暂不推荐具体方案"}
                </span>
              </h2>
              <div className="text-ink-700 leading-relaxed">{r.conclusion}</div>
            </div>
          </section>

          {r.exchange ? (
            <section className="card-pop-yellow p-6 mb-6">
              <h3 className="text-lg font-bold text-ink-900 mb-6 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-pop-yellow-light flex items-center justify-center">
                  💡
                </span>
                这次选择，真正的取舍
              </h3>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="card-pop-green p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-pop-green-light flex items-center justify-center">
                      <span className="text-xs">🟢</span>
                    </div>
                    <span className="text-sm font-semibold text-pop-green-dark">
                      得到什么
                    </span>
                  </div>
                  <p className="text-sm text-ink-700 leading-relaxed">
                    {r.exchange.gain}
                  </p>
                </div>
                <div className="card-pop-pink p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-pop-pink-light flex items-center justify-center">
                      <span className="text-xs">🌸</span>
                    </div>
                    <span className="text-sm font-semibold text-pop-pink-dark">
                      付出什么
                    </span>
                  </div>
                  <p className="text-sm text-ink-700 leading-relaxed">
                    {r.exchange.cost}
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-ink-200">
                <p className="text-sm text-ink-600">
                  <span className="text-pop-purple font-semibold">
                    为什么是这个取舍：
                  </span>
                  {r.exchange.why}
                </p>
              </div>
            </section>
          ) : (
            <p className="report-footnote">{r.summary}</p>
          )}

          <section className="card-pop-cyan p-6 mb-6">
            <h3 className="text-lg font-bold text-ink-900 mb-6">
              关键标准与依据
            </h3>
            <div className="space-y-3">
              {r.reasons.map((x, i) => (
                <div className="card-pop-inner overflow-hidden" key={i}>
                  <div className="w-full p-4 flex items-start gap-3 text-left">
                    <span className="text-pop-cyan-dark font-mono text-sm font-bold mt-0.5">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-ink-900 mb-1">
                        {x.title}
                      </p>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs ${
                            x.source === "user_fact"
                              ? "chip-pop-green"
                              : x.source === "ai_inference"
                                ? "chip-pop-purple"
                                : "chip-pop-pink"
                          }`}
                        >
                          {sourceNames[x.source]}
                        </span>
                        <span className="text-xs text-ink-500 truncate">
                          {x.criterionIds
                            .map(
                              (id) =>
                                saved.decision.criteria?.find((c) => c.id === id)
                                  ?.name,
                            )
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </div>
                      <p className="text-sm text-ink-700 mt-2">
                        {x.explanation}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <Feasibility report={r} saved={saved} />

          {revision && (
            <section className="card-pop p-6 mb-6">
              <h2 className="text-lg font-bold text-ink-900 mb-3">
                {revision.previousOptionId === r.recommendedOptionId
                  ? "推荐方案未改变"
                  : "推荐方案已调整"}
              </h2>
              <p className="text-sm text-ink-700">
                本次修改：{revision.changes.join("、")}。
              </p>
              <details className="mt-3">
                <summary className="text-sm text-ink-600 cursor-pointer">
                  与上次比较
                </summary>
                <p className="text-sm text-ink-700 mt-2">
                  上次：{revision.previousConclusion}
                </p>
                <p className="text-sm text-ink-700">本次：{r.conclusion}</p>
              </details>
              <p className="text-xs text-ink-500 mt-3">
                本次判断依据见下方。输入变化不等同于已证明的因果关系。
              </p>
            </section>
          )}

          {!!r.prerequisites.length && (
            <section className="card-pop p-6 mb-6">
              <h2 className="text-lg font-bold text-ink-900 mb-4">
                结论成立的前提
              </h2>
              {r.prerequisites.map((x, i) => (
                <p key={i} className="text-sm text-ink-700 mb-2">
                  • {x}
                </p>
              ))}
            </section>
          )}

          {!!r.switchConditions.length && (
            <details className="card-pop p-6 mb-6">
              <summary className="text-lg font-bold text-ink-900 cursor-pointer">
                什么情况下会改变选择？
              </summary>
              {r.switchConditions.map((x, i) => (
                <p key={i} className="text-sm text-ink-700 mt-3">
                  • {x}
                </p>
              ))}
            </details>
          )}

          {!selected && (
            <Link className="text-button" href="/report/factors">
              先看最需要核实的信息 →
            </Link>
          )}

          <p className="report-footnote">
            基于你确认的信息，未经外部事实核实。不使用虚构评分或置信度。
          </p>
        </div>
      </main>
      {saved.mode === "live" && (
        <ReportFeedback key={saved.id} reportId={saved.id} />
      )}
      <ReportAction />
    </Shell>
  );
}
export function ModernComparison({ saved, report: r }: Props) {
  const currentDecision = useDecision().draft.decision;
  const changed =
    JSON.stringify(currentDecision) !== JSON.stringify(saved.decision);
  const name = (id: string) =>
    saved.decision.options.find((o) => o.id === id)?.name;
  const order = { must: 0, prefer: 1, consider: 2 };
  const criteria = [...(saved.decision.criteria ?? [])].sort(
    (a, b) => order[a.priority] - order[b.priority],
  );
  const [openCriterion, setOpenCriterion] = useState<string | null>(null);
  const [openTradeoff, setOpenTradeoff] = useState<string | null>(null);

  const statusMeta: Record<string, { bg: string; color: string; icon: string; label: string }> = {
    pass: { bg: "bg-pop-green-light", color: "text-pop-green-dark", icon: "✓", label: "符合" },
    fail: { bg: "bg-pop-pink-light", color: "text-pop-pink-dark", icon: "✕", label: "不符合" },
    uncertain: { bg: "bg-pop-yellow-light", color: "text-pop-yellow-dark", icon: "?", label: "待确认" },
    mixed: { bg: "bg-pop-purple-light", color: "text-pop-purple-dark", icon: "≈", label: "有取舍" },
    unknown: { bg: "bg-ink-100", color: "text-ink-400", icon: "—", label: "—" },
  };

  const feasibilityMap = getFeasibility(r, saved.decision);
  const feasByName = (id: string) => feasibilityMap.find((f) => f.optionId === id);

  return (
    <Shell step={3}>
      <main className="min-h-screen pt-24 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          {changed && (
            <div className="notice">
              条件已修改，当前仍是上次报告。请重新分析以更新判断。
            </div>
          )}

          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-ink-900 mb-2">
              先看底线，再看差异
            </h1>
            <p className="text-ink-500">
              按你确认的重要程度排列。未知信息不当作优势。
            </p>
          </div>

          <ReportTabs />

          <section className="card-pop-cyan p-6 mb-6 overflow-x-auto">
            <h3 className="font-bold text-ink-900 mb-2">方案对比一览</h3>
            <p className="text-sm text-ink-500 mb-6">
              颜色代表在该标准下的满足情况，不是评分。
            </p>
            <ComparisonMatrix report={r} saved={saved} statusMeta={statusMeta} />
          </section>

          <section className="card-pop-pink p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-5 h-5 text-pop-pink-dark">⚠️</span>
              <h3 className="font-bold text-ink-900">哪些方案目前可行？</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {saved.decision.options.map((opt) => {
                const f = feasByName(opt.id);
                const status = f?.status ?? "no_must";
                const cardCls =
                  status === "eligible"
                    ? "card-pop-green"
                    : status === "excluded"
                      ? "card-pop-pink"
                      : status === "unconfirmed"
                        ? "card-pop-purple"
                        : "card-pop";
                const chipCls =
                  status === "eligible"
                    ? "chip-pop-green"
                    : status === "excluded"
                      ? "chip-pop-pink"
                      : status === "unconfirmed"
                        ? "chip-pop-purple"
                        : "chip-pop";
                const label =
                  status === "eligible"
                    ? "通过底线检查"
                    : status === "excluded"
                      ? "不满足底线"
                      : status === "unconfirmed"
                        ? "底线尚待确认"
                        : "未设底线";
                return (
                  <div key={opt.id} className={`p-5 ${cardCls}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-ink-900">{opt.name}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${chipCls}`}>
                        {label}
                      </span>
                    </div>
                    {status === "excluded" && f && (
                      <p className="text-sm text-pop-pink-dark">
                        不满足的标准：{f.failed.join("、")}
                      </p>
                    )}
                    {status === "unconfirmed" && f && (
                      <p className="text-sm text-pop-purple-dark">
                        待确认的标准：{f.pending.join("、")}
                      </p>
                    )}
                    {status === "eligible" && (
                      <p className="text-sm text-pop-green-dark">
                        满足所有 {saved.decision.criteria?.filter((c) => c.priority === "must").length ?? 0} 项底线条件
                      </p>
                    )}
                    {status === "no_must" && (
                      <p className="text-sm text-ink-600">你没有设置必须满足的条件</p>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-ink-400 mt-4">
              根据上方确认标准与报告逐项判断，不代表外部事实核验。
            </p>
          </section>

          <section className="card-pop-yellow p-6 mb-6">
            <h3 className="font-bold text-ink-900 mb-6">逐标准对比详情</h3>
            <div className="space-y-3">
              {criteria.map((c, s) => {
                const row = r.comparisons.find((x) => x.criterionId === c.id);
                const isOpen = openCriterion === c.id;
                return (
                  <div className="card-pop-inner overflow-hidden" key={c.id}>
                    <button
                      onClick={() => setOpenCriterion(isOpen ? null : c.id)}
                      className="w-full p-4 flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-pop-yellow-dark font-mono text-sm font-bold">
                          {String(s + 1).padStart(2, "0")}
                        </span>
                        <span className="font-semibold text-ink-900">{c.name}</span>
                        {c.priority === "must" && (
                          <span className="chip-pop-pink text-[10px]">底线</span>
                        )}
                      </div>
                      <span className={`transition-transform ${isOpen ? "rotate-180" : ""}`}>▼</span>
                    </button>
                    {isOpen && row && (
                      <div className="px-4 pb-4 pt-0 space-y-3">
                        {c.requirement && (
                          <p className="text-sm text-ink-600 pl-8">
                            你的要求：{c.requirement}
                          </p>
                        )}
                        {row.assessments.map((a) => {
                          const meta = statusMeta[a.status] ?? statusMeta.unknown;
                          return (
                            <div className="flex gap-3 pl-8" key={a.optionId}>
                              <div className={`w-6 h-6 rounded-full ${meta.bg} flex items-center justify-center flex-shrink-0 border-2 border-white`}>
                                <span className={`text-xs ${meta.color}`}>{meta.icon}</span>
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-ink-800 mb-1">
                                  {name(a.optionId)}
                                </p>
                                <p className="text-sm text-ink-600 mb-2">{a.assessment}</p>
                                <p className="text-xs text-ink-400">
                                  <span className="text-ink-500 font-medium">依据：</span>
                                  {a.basis}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="card-pop-purple p-6 mb-8">
            <div className="flex items-center gap-2 mb-6">
              <span className="w-5 h-5 text-pop-purple-dark">⚖️</span>
              <h3 className="font-bold text-ink-900">每个选择，也有代价</h3>
            </div>
            <div className="space-y-3">
              {r.tradeoffs.map((t) => {
                const isOpen = openTradeoff === t.optionId;
                return (
                  <div className="card-pop-inner overflow-hidden" key={t.optionId}>
                    <button
                      onClick={() => setOpenTradeoff(isOpen ? null : t.optionId)}
                      className="w-full p-4 flex items-center justify-between text-left"
                    >
                      <span className="font-semibold text-ink-900">{name(t.optionId)}</span>
                      <span className={`transition-transform ${isOpen ? "rotate-180" : ""}`}>▼</span>
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 pt-0 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-pop-pink-light rounded-xl p-4 border-2 border-pop-pink">
                            <p className="text-xs text-pop-pink-dark mb-1 flex items-center gap-1 font-semibold">
                              ⚠️ 主要风险
                            </p>
                            <p className="text-sm text-ink-700">{t.risk}</p>
                          </div>
                          <div className="bg-pop-purple-light rounded-xl p-4 border-2 border-pop-purple">
                            <p className="text-xs text-pop-purple-dark mb-1 flex items-center gap-1 font-semibold">
                              💸 机会成本
                            </p>
                            <p className="text-sm text-ink-700">{t.opportunityCost}</p>
                          </div>
                        </div>
                        <p className="text-xs text-ink-400">
                          <span className="text-ink-500 font-medium">AI 推断，依据：</span>
                          {t.basis}
                        </p>
                        {t.impacts.map((x, i) => (
                          <div key={i} className="pl-2">
                            <p className="text-sm text-ink-700">
                              <b>{horizons[x.horizon]}：</b>
                              {x.effect}
                            </p>
                            <p className="text-xs text-ink-400">成立条件：{x.condition}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>
      <ReportAction />
    </Shell>
  );
}
export function ModernUnknowns({ saved, report: r }: Props) {
  const router = useRouter();
  const s = useDecision();
  const d = s.draft.decision;
  if (!d) return null;
  const changed = JSON.stringify(d) !== JSON.stringify(saved.decision);
  const [openId, setOpenId] = useState<string | null>(null);

  const impactConfig: Record<
    string,
    { label: string; color: string; cardClass: string; icon: string }
  > = {
    blocking: {
      label: "影响能否选择 · 优先核实",
      color: "text-pop-pink-dark",
      cardClass: "card-pop-pink",
      icon: "🔴",
    },
    ranking: {
      label: "可能改变排序 · 不必全部等齐",
      color: "text-pop-purple-dark",
      cardClass: "card-pop-purple",
      icon: "🟡",
    },
    detail: {
      label: "补充细节 · 不阻塞当前判断",
      color: "text-pop-cyan-dark",
      cardClass: "card-pop-cyan",
      icon: "🔵",
    },
    unclassified: {
      label: "历史记录 · 未分级",
      color: "text-ink-500",
      cardClass: "card-pop",
      icon: "⚪",
    },
  };

  const updateNote = (question: string, answer: string) => {
    const notes = d.verificationNotes ?? [];
    if (notes.length >= 12 && !notes.some((n) => n.question === question)) {
      s.setError("最多保留 12 条核实记录，请先删除不再相关的旧记录。");
      return;
    }
    s.updateDecision({
      ...d,
      verificationNotes: [
        ...notes.filter((n) => n.question !== question),
        { question, answer },
      ],
    });
  };

  const grouped = { blocking: [], ranking: [], detail: [] } as Record<string, typeof r.unknowns>;
  for (const u of r.unknowns) {
    const imp = unknownImpact(u, r, saved.decision);
    if (imp in grouped) grouped[imp].push(u);
    else grouped.unclassified = grouped.unclassified || [];
    if (!(imp in grouped)) grouped.unclassified.push(u);
  }

  return (
    <Shell step={3}>
      <main className="min-h-screen pt-24 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          {changed && (
            <div className="notice">
              信息已修改，下方仍是上次报告。重新分析后更新。
            </div>
          )}

          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-ink-900 mb-2">
              先确认，最关键的事
            </h1>
            <p className="text-ink-500">
              按影响选择的重要程度排列。核实后填入结果，再更新报告。
            </p>
          </div>

          <ReportTabs />

          <fieldset className="contents" disabled={!!s.busy}>
            <div className="space-y-8 mb-8">
              {(["blocking", "ranking", "detail"] as const).map((key) => {
                const items = grouped[key] ?? [];
                if (!items.length) return null;
                const cfg = impactConfig[key];
                return (
                  <div key={key}>
                    <div className="flex items-center gap-2 mb-4">
                      <span className={`w-4 h-4 ${cfg.color}`}>{cfg.icon}</span>
                      <span className={`text-sm font-bold ${cfg.color}`}>
                        {cfg.label}
                      </span>
                      <span className="text-xs text-ink-400">({items.length})</span>
                    </div>
                    <div className="space-y-3">
                      {items.map((u) => {
                        const isOpen = openId === u.question;
                        return (
                          <div
                            key={u.question}
                            className={`${cfg.cardClass} overflow-hidden`}
                          >
                            <button
                              onClick={() => setOpenId(isOpen ? null : u.question)}
                              className="w-full p-5 text-left"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <p className="text-ink-900 font-semibold mb-1">
                                    {u.question}
                                  </p>
                                  <p className="text-sm text-ink-500 line-clamp-2">
                                    {u.why}
                                  </p>
                                </div>
                                <span
                                  className={`flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                                >
                                  ▼
                                </span>
                              </div>
                            </button>
                            {isOpen && (
                              <div className="px-5 pb-5 pt-0 space-y-4">
                                <div className="card-pop-inner p-4">
                                  <p className="text-xs text-ink-500 mb-2 font-semibold">
                                    去哪里核实？
                                  </p>
                                  <p className="text-sm text-ink-700">
                                    {saved.decision.criteria?.find(
                                      (c) => c.id === u.dimension,
                                    )?.name ?? u.dimension}{" "}
                                    · {u.verifyWith}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-xs text-ink-500 mb-2 block font-semibold">
                                    核实结果
                                  </label>
                                  <textarea
                                    value={
                                      d.verificationNotes?.find(
                                        (n) => n.question === u.question,
                                      )?.answer ?? ""
                                    }
                                    onChange={(e) =>
                                      updateNote(u.question, e.target.value)
                                    }
                                    placeholder="核实后，写下结果及来源（可不填）"
                                    rows={3}
                                    maxLength={2000}
                                    className="input-pop w-full px-4 py-3 text-sm text-ink-800 placeholder-ink-400 resize-none font-medium"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {r.unknowns.length === 0 && (
              <div className="card-pop-green p-12 text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-pop-green-light flex items-center justify-center mx-auto mb-4 border-2 border-pop-green">
                  <span className="text-3xl">✓</span>
                </div>
                <h3 className="text-lg font-bold text-ink-900 mb-2">
                  当前信息已足够支撑判断
                </h3>
                <p className="text-sm text-ink-500">
                  结论可信度较高。这不代表结果已被外部核验。
                </p>
              </div>
            )}

            {!!d.verificationNotes?.filter(
              (n) => !r.unknowns.some((u) => u.question === n.question),
            ).length && (
              <details className="card-pop p-6 mb-8">
                <summary className="font-semibold text-ink-900 cursor-pointer">
                  此前补充的核实记录
                </summary>
                {d.verificationNotes
                  .filter(
                    (n) => !r.unknowns.some((u) => u.question === n.question),
                  )
                  .map((n) => (
                    <div key={n.question} className="mt-4">
                      <b className="text-ink-900">{n.question}</b>
                      <p className="text-sm text-ink-700 mt-1">
                        {n.answer || "未填写"}
                      </p>
                      <button
                        className="text-button text-sm mt-2"
                        onClick={() =>
                          s.updateDecision({
                            ...d,
                            verificationNotes: d.verificationNotes?.filter(
                              (x) => x.question !== n.question,
                            ),
                          })
                        }
                      >
                        移除此条记录
                      </button>
                    </div>
                  ))}
              </details>
            )}

            {!!r.omittedFactors.length && (
              <section className="card-pop-yellow p-6 mb-8">
                <h3 className="font-bold text-ink-900 mb-4">
                  还值得考虑的维度
                </h3>
                <p className="text-sm text-ink-500 mb-4">
                  AI 建议的额外考虑因素，你可以选择加入比较标准。
                </p>
                <div className="flex flex-wrap gap-2">
                  {r.omittedFactors.map((f) => {
                    const added = d.criteria?.some((c) => c.name === f.name);
                    const maxed = (d.criteria?.length ?? 0) >= 5;
                    return (
                      <button
                        key={f.name}
                        disabled={added || maxed}
                        onClick={() =>
                          s.updateDecision({
                            ...d,
                            criteria: [
                              ...(d.criteria ?? []),
                              {
                                id: uid(),
                                name: f.name.slice(0, 40),
                                priority: "consider",
                                requirement: "",
                              },
                            ],
                          })
                        }
                        className={`chip-pop-yellow text-sm flex items-center gap-1 ${maxed ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <span>+</span>
                        {f.name}
                      </button>
                    );
                  })}
                </div>
                <Link
                  href="/confirm/focus"
                  className="inline-flex items-center gap-1 text-sm text-pop-purple-dark hover:text-pop-purple mt-4 font-semibold"
                >
                  调整决策标准 →
                </Link>
              </section>
            )}
          </fieldset>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/report"
              className="btn-pop flex items-center gap-2 px-6 py-3 text-ink-700"
            >
              ← 返回结论
            </Link>
            <SubmitButton
              busy={!!s.busy}
              onClick={async () => {
                if (await s.run("analyze")) router.push("/report");
              }}
            >
              {changed ? "用新信息更新报告" : "重新生成报告"}
            </SubmitButton>
          </div>
        </div>
      </main>
    </Shell>
  );
}

function ComparisonMatrix({
  report: r,
  saved,
  statusMeta,
}: Props & {
  statusMeta: Record<string, { bg: string; color: string; icon: string; label: string }>;
}) {
  const name = (id: string) =>
    saved.decision.options.find((o) => o.id === id)?.name ?? id;
  const order = { must: 0, prefer: 1, consider: 2 };
  const criteria = [...(saved.decision.criteria ?? [])].sort(
    (a, b) => order[a.priority] - order[b.priority],
  );
  const options = saved.decision.options;
  if (!criteria.length || !options.length) return null;

  const borderCls = (p: string) =>
    p === "must"
      ? "border-l-pop-pink"
      : p === "prefer"
        ? "border-l-pop-purple"
        : "border-l-ink-200";

  return (
    <div className="min-w-[500px]">
      <div
        className="grid gap-2 mb-3"
        style={{ gridTemplateColumns: `1fr repeat(${options.length}, 120px)` }}
      >
        <div className="text-sm text-ink-500">决策标准</div>
        {options.map((o) => (
          <div
            key={o.id}
            className="text-sm font-bold text-ink-800 text-center truncate"
          >
            {o.name}
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {criteria.map((c) => {
          const row = r.comparisons.find((x) => x.criterionId === c.id);
          return (
            <div
              key={c.id}
              className={`grid gap-2 items-center card-pop-inner py-3 px-4 border-l-4 ${borderCls(c.priority)}`}
              style={{ gridTemplateColumns: `1fr repeat(${options.length}, 120px)` }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm text-ink-800 truncate">{c.name}</span>
                {c.priority === "must" && (
                  <span className="chip-pop-pink text-[10px] flex-shrink-0">
                    底线
                  </span>
                )}
              </div>
              {options.map((o) => {
                const a = row?.assessments.find((x) => x.optionId === o.id);
                const meta = statusMeta[a?.status ?? "unknown"] ?? statusMeta.unknown;
                return (
                  <div key={o.id} className="flex justify-center">
                    <div
                      className={`w-8 h-8 rounded-lg ${meta.bg} flex items-center justify-center border-2 border-white`}
                      title={a ? statuses[a.status] : "—"}
                    >
                      <span className={`text-sm ${meta.color}`}>{meta.icon}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Feasibility({ saved, report }: Props) {
  const rows = getFeasibility(report, saved.decision);
  if (rows.every((o) => o.status === "no_must"))
    return (
      <p className="report-footnote">未设置必须条件，以下按优先项权衡。</p>
    );
  const names = {
    eligible: "通过底线检查",
    excluded: "不满足底线",
    unconfirmed: "底线尚待确认",
    no_must: "未设底线",
  };
  return (
    <section className="card plain-card">
      <h2 className="section-title">哪些方案目前可行？</h2>
      {rows.map((o) => (
        <div className="comparison-cell" key={o.optionId}>
          <b>{o.name}</b>
          <p>{names[o.status as keyof typeof names]}</p>
          {!!o.failed.length && (
            <p className="evidence">不满足：{o.failed.join("、")}</p>
          )}
          {!!o.pending.length && (
            <p className="evidence">待确认：{o.pending.join("、")}</p>
          )}
        </div>
      ))}
      <small className="evidence">
        根据上方确认标准与报告逐项判断，不代表外部事实核验。
      </small>
    </section>
  );
}
