"use client";
import { ModernComparison } from "./modern-report";
import { useState } from "react";
import { ReportAction, sourceNames } from "./report-layout";
import { useDecision } from "./decision-provider";
import { Shell, Empty } from "./shell";
import type { Insight, LegacyReport } from "@/lib/schema";

const iconPaths: Record<string, React.ReactNode> = {
  plusCircle: <><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></>,
  minus: <><circle cx="12" cy="12" r="9" /><path d="M8 12h8" /></>,
  alert: <><path d="M12 3 2 20h20ZM12 9v4M12 17h.01" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  back: <path d="m15 18-6-6 6-6" />,
  arrow: <><path d="M5 12h14" /><path d="m14 7 5 5-5 5" /></>,
};
function Ico({ name }: { name: string }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true">{iconPaths[name]}</svg>;
}

function AnalysisRow({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="analysis-row">
      <span><Ico name={icon} /></span>
      <div><b>{title}</b><p>{text}</p></div>
    </div>
  );
}

export function ReportOptionsScreen() {
  const s = useDecision();
  const [active, setActive] = useState(0);
  const [view, setView] = useState<"single" | "compare">("single");
  if (!s.ready) return <Shell step={3}><p role="status">正在恢复报告…</p></Shell>;
  const saved = s.draft.current;
  if (!saved) return <Shell step={3}><Empty text="还没有可查看的报告" /></Shell>;
  const r = saved.report;
  if ("version" in r) return <ModernComparison saved={saved} report={r}/>;
  const option = r.options[Math.min(active, r.options.length - 1)];
  const optionName = saved.decision.options.find((o) => o.id === option.optionId)?.name;

  function indicatorFor(factorName: string, opt: LegacyReport["options"][number]) {
    const hay = [opt.pros, opt.cons, opt.risks].flat().map((i) => i.title + i.explanation).join(" ");
    if (!hay.includes(factorName)) return "—";
    const pros = opt.pros.some((i) => (i.title + i.explanation).includes(factorName));
    const cons = opt.cons.some((i) => (i.title + i.explanation).includes(factorName));
    if (pros && cons) return "±";
    if (pros) return "优势";
    if (cons) return "不足";
    return "—";
  }

  const rowLabels = [
    ["可能的优势", option.pros, "plusCircle"],
    ["可能的不足", option.cons, "minus"],
    ["风险", option.risks, "alert"],
    ["机会成本", option.opportunityCosts, "clock"],
  ] as const;

  return (
    <Shell step={3} subStep="2/3" subLabel="方案详情" backHref="/report">
      <div className="intro">
        <h1>比较收益与代价</h1>
        <p>分别看清收益、代价与长期影响。</p>
      </div>
      <div className="segmented">
        <button className={view === "single" ? "active" : ""} onClick={() => setView("single")}>逐方案</button>
        <button className={view === "compare" ? "active" : ""} onClick={() => setView("compare")}>对比</button>
      </div>
      {view === "single" ? (
        <>
          <div className="option-tabs">
            {r.options.map((o, i) => (
              <button key={o.optionId} className={active === i ? "active" : ""} onClick={() => setActive(i)}>
                方案 {String.fromCharCode(65 + i)}
              </button>
            ))}
          </div>
          <div className="card analysis-card">
            <div className="analysis-title">
              <span className={`letter ${active % 2 ? "peach" : ""}`}>{String.fromCharCode(65 + active)}</span>
              <div>
                <b>{optionName}</b>
                <small>条件性分析</small>
              </div>
            </div>
            {rowLabels.map(([label, items, icon], index) => (
              <details className="option-disclosure" key={`${option.optionId}-${label}`} open={index < 2}>
                <summary>{label}<span>{items.length} 项</span></summary>
                {items.map((item: Insight, i: number) => <div key={i}><AnalysisRow icon={icon} title={item.title} text={item.explanation} /><p className="evidence">{sourceNames[item.source]} · {item.basis}</p></div>)}
              </details>
            ))}
          </div>
          <details className="card timeline-card report-disclosure" key={option.optionId}><summary>短中长期影响</summary>
            {([
              ["短期", option.paths.short],
              ["中期", option.paths.medium],
              ["长期", option.paths.long],
            ] as const).map(([when, item]) => (
              <div className="timeline-item" key={when}>
                <i />
                <b>{when}</b>
                <p>{item.title}：{item.explanation}</p><p className="evidence">{sourceNames[item.source]} · {item.basis}</p>
              </div>
            ))}
          </details>
        </>
      ) : (
        <div className="card table-card">
          <div className="compare-scroll"><div className="compare-table" style={{gridTemplateColumns: `120px repeat(${r.options.length}, minmax(100px, 1fr))`}}>
            <div className="th">关注因素</div>
            {r.options.map((_, i) => <div className="th" key={i}>方案 {String.fromCharCode(65 + i)}</div>)}
            {r.factors.slice(0, 8).flatMap((f) => {
              const cells = r.options.map((o) => indicatorFor(f.name, o));
              return [
                <div className="td" key={f.name}>{f.name}</div>,
                ...cells.map((c, i) => (
                  <div key={f.name + i} className={`td mark ${c === "优势" ? "good" : ""}`}>{c}</div>
                )),
              ];
            })}
          </div>
          </div><div className="legend">
            <span><i className="good" />优势</span>
            <span><i />仍需权衡</span>
            <span><i className="empty" />信息不足</span>
          </div>
        </div>
      )}
      <details className="card plain-card report-disclosure"><summary>另一种选择何时更合适？</summary><p>{r.counterReason}</p></details>
      <ReportAction />
    </Shell>
  );
}
