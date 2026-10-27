"use client";
import { ReportFeedback } from "./report-feedback";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shell, SubmitButton } from "./shell";
import { ReportAction, sourceNames } from "./report-layout";
import { priorityNames } from "./criteria-editor";
import { useDecision } from "./decision-provider";
import { getFeasibility, unknownImpact } from "@/lib/schema";
import type { ModernReport, SavedReport } from "@/lib/schema";
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
      <div className="modern-report">
        {changed && (
          <div className="notice">
            条件已修改，当前仍是上次报告。请重新分析以更新判断。
          </div>
        )}
        <header className="report-heading result-context">
          <p>{saved.decision.title}</p>
          <small>
            {saved.decision.depth === "quick" ? "简明分析" : "补充影响分析"} ·{" "}
            {new Date(saved.createdAt).toLocaleDateString("zh-CN")}
          </small>
        </header>
        <section className="card recommendation compact-recommendation">
          <small>
            {selected ? "推荐方案" : noneFeasible ? "底线检查" : "判断仍有缺口"}
          </small>
          <h1 className="result-title">
            {selected
              ? selected.name
              : noneFeasible
                ? "当前方案都不满足底线"
                : "暂不推荐具体方案"}
          </h1>
          <p>{r.conclusion}</p>
        </section>
        {r.exchange ? (
          <section className="card plain-card exchange-card">
            <h2 className="section-title">这次选择，真正的取舍</h2>
            <p>
              <b>得到什么</b>
              {r.exchange.gain}
            </p>
            <p>
              <b>付出什么</b>
              {r.exchange.cost}
            </p>
            <p>
              <b>如何对应你的优先级</b>
              {r.exchange.why}
            </p>
          </section>
        ) : (
          <p className="report-footnote">{r.summary}</p>
        )}
        <Feasibility report={r} saved={saved} />

        {revision && (
          <section className="revision-card">
            <h2>
              {revision.previousOptionId === r.recommendedOptionId
                ? "推荐方案未改变"
                : "推荐方案已调整"}
            </h2>
            <p>本次修改：{revision.changes.join("、")}。</p>
            <details>
              <summary>与上次比较</summary>
              <p>上次：{revision.previousConclusion}</p>
              <p>本次：{r.conclusion}</p>
            </details>
            <p>本次判断依据见下方。输入变化不等同于已证明的因果关系。</p>
          </section>
        )}
        <h2 className="section-title">关键标准与依据</h2>
        <div className="card report-reasons">
          {r.reasons.map((x, i) => (
            <details className="report-reason" key={i}>
              <summary>
                <span className="reason-number">0{i + 1}</span>
                <span>
                  <b>{x.title}</b>
                  <small>
                    {sourceNames[x.source]} ·{" "}
                    {x.criterionIds
                      .map(
                        (id) =>
                          saved.decision.criteria?.find((c) => c.id === id)
                            ?.name,
                      )
                      .join("、")}
                  </small>
                  <span className="reason-preview">{x.explanation}</span>
                </span>
              </summary>
              <p className="evidence">依据：{x.basis}</p>
            </details>
          ))}
        </div>
        {!!r.prerequisites.length && (
          <section className="card plain-card">
            <h2 className="section-title">结论成立的前提</h2>
            {r.prerequisites.map((x, i) => (
              <p key={i}>{x}</p>
            ))}
          </section>
        )}
        {!!r.switchConditions.length && (
          <details className="card plain-card report-disclosure">
            <summary>什么情况下会改变选择？</summary>
            {r.switchConditions.map((x, i) => (
              <p key={i}>{x}</p>
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
  return (
    <Shell step={3}>
      <div className="modern-report">
        {changed && (
          <div className="notice">
            条件已修改，当前仍是上次报告。请重新分析以更新判断。
          </div>
        )}
        <div className="intro">
          <h1>先看底线，再看差异</h1>
          <p>按你确认的重要程度排列。未知信息不当作优势。</p>
        </div>
        <ComparisonMatrix report={r} saved={saved} />
        <Feasibility report={r} saved={saved} />
        {criteria.map((c) => {
          const row = r.comparisons.find((x) => x.criterionId === c.id)!;
          return (
            <section className="card comparison-card" key={c.id}>
              <header>
                <h2>{c.name}</h2>
                <span className="source">{priorityNames[c.priority]}</span>
              </header>
              {c.requirement && (
                <p className="evidence">你的要求：{c.requirement}</p>
              )}
              {row.assessments.map((a) => (
                <div className="comparison-cell" key={a.optionId}>
                  <div>
                    <b>{name(a.optionId)}</b>
                    <span className={`status-label ${a.status}`}>
                      {statuses[a.status]}
                    </span>
                  </div>
                  <p>{a.assessment}</p>
                  <details>
                    <summary>{sourceNames[a.source]} · 查看依据</summary>
                    <p className="evidence">{a.basis}</p>
                  </details>
                </div>
              ))}
            </section>
          );
        })}
        <h2 className="section-title">每个选择，也有代价</h2>
        {r.tradeoffs.map((t) => (
          <details
            className="card plain-card report-disclosure"
            key={t.optionId}
          >
            <summary>{name(t.optionId)}</summary>
            <p>
              <b>主要风险：</b>
              {t.risk}
            </p>
            <p>
              <b>机会成本：</b>
              {t.opportunityCost}
            </p>
            <p className="evidence">AI 推断，依据：{t.basis}</p>
            {t.impacts.map((x, i) => (
              <p key={i}>
                <b>{horizons[x.horizon]}：</b>
                {x.effect}
                <br />
                <small>成立条件：{x.condition}</small>
              </p>
            ))}
          </details>
        ))}
      </div>
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
  const impactNames = {
    blocking: "影响能否选择 · 优先核实",
    ranking: "可能改变排序 · 不必全部等齐",
    detail: "补充细节 · 不阻塞当前判断",
    unclassified: "历史记录 · 未分级",
  };
  const impactOrder = { blocking: 0, ranking: 1, detail: 2, unclassified: 3 };
  const unknowns = [...r.unknowns].sort(
    (a, b) =>
      impactOrder[unknownImpact(a, r, saved.decision)] -
      impactOrder[unknownImpact(b, r, saved.decision)],
  );
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
  return (
    <Shell step={3}>
      <div className="modern-report">
        <div className="intro">
          <h1>先确认，最关键的事</h1>
          <p>按影响选择的重要程度排列。核实后填入结果，再更新报告。</p>
        </div>
        {changed && (
          <div className="notice">
            信息已修改，下方仍是上次报告。重新分析后更新。
          </div>
        )}
        <fieldset className="contents" disabled={!!s.busy}>
          <div className="card unknown-list">
            {r.unknowns.length ? (
              unknowns.map((u, i) => (
                <div className="unknown-item" key={u.question}>
                  <span>0{i + 1}</span>
                  <div>
                    <small className="source">
                      {impactNames[unknownImpact(u, r, saved.decision)]}
                    </small>
                    <b>{u.question}</b>
                    <p>{u.why}</p>
                    <details>
                      <summary>去哪里核实？</summary>
                      <p>
                        {saved.decision.criteria?.find(
                          (c) => c.id === u.dimension,
                        )?.name ?? u.dimension}{" "}
                        · {u.verifyWith}
                      </p>
                    </details>
                    <textarea
                      className="input"
                      aria-label={`核实结果：${u.question}`}
                      maxLength={2000}
                      value={
                        d.verificationNotes?.find(
                          (n) => n.question === u.question,
                        )?.answer ?? ""
                      }
                      placeholder="核实后，写下结果及来源（可不填）"
                      onChange={(e) => updateNote(u.question, e.target.value)}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="plain-card">
                当前信息已足够支撑判断，结论可信度较高。这不代表结果已被外部核验。
              </p>
            )}
          </div>
          {!!d.verificationNotes?.filter(
            (n) => !r.unknowns.some((u) => u.question === n.question),
          ).length && (
            <details className="card plain-card">
              <summary>此前补充的核实记录</summary>
              {d.verificationNotes
                .filter(
                  (n) => !r.unknowns.some((u) => u.question === n.question),
                )
                .map((n) => (
                  <div key={n.question}>
                    <b>{n.question}</b>
                    <p>{n.answer || "未填写"}</p>
                    <button
                      className="text-button"
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
            <>
              <h2 className="section-title">还值得考虑的维度</h2>
              <p className="report-footnote">
                这些是 AI 建议，加入标准后才用于下一次比较。
              </p>
              {r.omittedFactors.map((f) => {
                const added = d.criteria?.some((c) => c.name === f.name);
                return (
                  <div className="card plain-card" key={f.name}>
                    <b>{f.name}</b>
                    <p>{f.why}</p>
                    <button
                      className="text-button"
                      disabled={added || (d.criteria?.length ?? 0) >= 5}
                      onClick={() =>
                        s.updateDecision({
                          ...d,
                          criteria: [
                            ...(d.criteria ?? []),
                            {
                              id: crypto.randomUUID(),
                              name: f.name.slice(0, 40),
                              priority: "consider",
                              requirement: "",
                            },
                          ],
                        })
                      }
                    >
                      {added
                        ? "已加入标准"
                        : (d.criteria?.length ?? 0) >= 5
                          ? "已达 5 项，可在标准页调整"
                          : "加入比较标准"}
                    </button>
                  </div>
                );
              })}
            </>
          )}
        </fieldset>
        <Link className="text-button" href="/confirm/focus">
          调整决策标准 →
        </Link>
      </div>
      <div className="action-bar">
        <SubmitButton
          busy={!!s.busy}
          onClick={async () => {
            if (await s.run("analyze")) router.push("/report");
          }}
        >
          {changed ? "用新信息更新报告" : "重新生成报告"}
        </SubmitButton>
      </div>
    </Shell>
  );
}

function ComparisonMatrix({ report: r, saved }: Props) {
  const name = (id: string) =>
    saved.decision.options.find((o) => o.id === id)?.name ?? id;
  const order = { must: 0, prefer: 1, consider: 2 };
  const criteria = [...(saved.decision.criteria ?? [])].sort(
    (a, b) => order[a.priority] - order[b.priority],
  );
  const options = saved.decision.options;
  if (!criteria.length || !options.length) return null;

  return (
    <section className="card plain-card">
      <h2 className="section-title">方案对比一览</h2>
      <p className="evidence">颜色代表在该标准下的满足情况，不是评分。</p>
      <div className="compare-matrix">
        <table>
          <thead>
            <tr>
              <th>标准</th>
              {options.map((o) => (
                <th key={o.id}>{o.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {criteria.map((c) => {
              const row = r.comparisons.find((x) => x.criterionId === c.id);
              return (
                <tr key={c.id}>
                  <td>
                    <b>{c.name}</b>
                    <small>{priorityNames[c.priority]}</small>
                  </td>
                  {options.map((o) => {
                    const a = row?.assessments.find((x) => x.optionId === o.id);
                    return (
                      <td
                        key={o.id}
                        className={`matrix-cell ${a?.status ?? "uncertain"}`}
                      >
                        {a ? statuses[a.status] : "—"}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
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
