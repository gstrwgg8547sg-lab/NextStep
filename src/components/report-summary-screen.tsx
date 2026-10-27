"use client";
import { ReportFeedback } from "./report-feedback";
import { ModernSummary } from "./modern-report";
import { useDecision } from "./decision-provider";
import { Shell, Empty } from "./shell";
import { ReportAction, sourceNames } from "./report-layout";
export function ReportSummaryScreen() {
  const s = useDecision();
  const saved = s.draft.current;
  if (!s.ready)
    return (
      <Shell step={3}>
        <p role="status">正在恢复报告…</p>
      </Shell>
    );
  if (!saved)
    return (
      <Shell step={3}>
        <Empty text="还没有可查看的报告" />
      </Shell>
    );
  const r = saved.report;
  if ("version" in r) return <ModernSummary saved={saved} report={r} />;
  const lead = r.conclusion.split(/[：:；;。\n]/)[0];
  const shortLead = lead.length <= 36;
  const prerequisite = r.reasons.find((x) => x.source === "unknown");
  return (
    <Shell step={3}>
      <header className="report-heading">
        <p>{saved.decision.title}</p>
        <h1>先看清，再决定。</h1>
        <small>{new Date(saved.createdAt).toLocaleDateString("zh-CN")}</small>
      </header>
      <section className="card recommendation compact-recommendation">
        <small>当前建议</small>
        <h2>{shortLead ? lead : "当前选择需要权衡"}</h2>
        <div className="report-excerpt">{r.summary}</div>
        <details className="report-disclosure">
          <summary>完整结论与适用条件</summary>
          <p>{r.conclusion}</p>
          <p>{r.summary}</p>
        </details>
      </section>
      <div className="report-premise">
        <b>关键前提</b>
        <p>{prerequisite?.explanation ?? r.limitations[0]}</p>
        <details>
          <summary>查看依据</summary>
          <p>
            {prerequisite?.basis ??
              "上述条件尚需确认，建议结合待核实页核实后再作决定。"}
          </p>
        </details>
      </div>
      <h2 className="section-title">为什么这样建议</h2>
      <div className="card report-reasons">
        {r.reasons.map((item, i) => (
          <details key={i} className="report-reason">
            <summary>
              <span className="reason-number">0{i + 1}</span>
              <span>
                <b>{item.title}</b>
                <small>{sourceNames[item.source]}</small>
                <span className="reason-preview">{item.explanation}</span>
              </span>
            </summary>
            <p>{item.explanation}</p>
            <p className="evidence">依据：{item.basis}</p>
          </details>
        ))}
      </div>
      <p className="report-footnote">
        基于你确认的信息，尚未经外部核实。最终决定由你作出。
      </p>
      {saved.mode === "live" && (
        <ReportFeedback key={saved.id} reportId={saved.id} />
      )}
      <ReportAction />
    </Shell>
  );
}
