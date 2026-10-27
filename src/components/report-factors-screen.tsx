"use client";
import { ModernUnknowns } from "./modern-report";
import { useState } from "react";
import { ReportAction } from "./report-layout";
import { useDecision } from "./decision-provider";
import { Shell, Empty } from "./shell";

const sourceNames = { user_fact: "基于用户信息", ai_inference: "AI 推断 · 可能影响", unknown: "未知 · 待核实" };

export function ReportFactorsScreen() {
  const s = useDecision();
  const [custom, setCustom] = useState("");
  if (!s.ready) return <Shell step={3}><p role="status">正在恢复报告…</p></Shell>;
  const saved = s.draft.current;
  const d = s.draft.decision;
  if (!saved || !d) return <Shell step={3}><Empty text="还没有可查看的报告" /></Shell>;
  const r = saved.report;
  if ("version" in r) return <ModernUnknowns saved={saved} report={r}/>;
  const changed = JSON.stringify(saved.decision) !== JSON.stringify(d);

  function toggle(name: string) {
    if (!d) return;
    const found = d.factorPreferences.find((f) => f.name === name);
    s.updateDecision({
      ...d,
      factorPreferences: found
        ? d.factorPreferences.map((f) => (f.name === name ? { ...f, included: !f.included } : f))
        : [...d.factorPreferences, { name, source: "ai_suggestion" as const, included: false }],
    });
  }

  return (
    <Shell step={3} subStep="3/3" subLabel="视角与未知" backHref="/report/options">
      <div className="intro">
        <h1>决定前，确认这些事</h1>
        <p>优先核实会影响选择的信息，再调整关注因素。</p>
      </div>
      {changed && (
        <div className="notice">
          <p><b>条件已修改</b>当前仍显示上次报告，请重新分析以更新结果。</p>
        </div>
      )}
      <h2 className="section-title">做决定前，还需要确认</h2>
      <div className="card unknown-list">
        {r.unknowns.map((u, i) => (
          <div className="unknown-item" key={i}>
            <span>{String(i + 1).padStart(2, "0")}</span>
            <div>
              <b>{u.question}</b>
              <p>{u.why}</p>
              <details><summary>如何核实</summary><p>{u.dimension} · {u.verifyWith}</p></details>
            </div>
          </div>
        ))}
      </div>
      <details className="card plain-card report-disclosure"><summary>哪些条件可能改变结论？</summary>{r.limitations.map((t,i)=><p key={i}>{i+1}. {t}</p>)}</details>
      <details className="card plain-card report-disclosure"><summary>优先核实的问题</summary>{r.nextQuestions.map((t,i)=><p key={i}>{i+1}. {t}</p>)}</details>
      <h2 className="section-title">可能忽略的视角</h2>
      <div className="card perspectives">
        {r.factors.map((f) => {
          const included = d.factorPreferences.find((x) => x.name === f.name)?.included ?? true;
          return (
            <div className="perspective" key={f.name}>
              <div>
                <b>{f.name}</b>
                <span className="source">{sourceNames[f.source]}</span>
              </div>
              <button className={`keep ${included ? "active" : ""}`} onClick={() => toggle(f.name)}>
                {included ? "已保留" : "已排除"}
              </button>
              <details>
                <summary>为什么值得考虑？</summary>
                <p>{f.why}</p>
                <p>{f.relevance}</p>
              </details>
            </div>
          );
        })}
        {d.factorPreferences.filter((f) => f.source === "user").map((f) => (
          <div className="perspective" key={f.name}>
            <div>
              <b>{f.name}</b>
              <span className="source">自定义</span>
            </div>
            <button className={`keep ${f.included ? "active" : ""}`} onClick={() => toggle(f.name)}>
              {f.included ? "已保留" : "已排除"}
            </button>
          </div>
        ))}
        <div className="add-factor">
          <input value={custom} aria-label="自定义关注因素" maxLength={100} placeholder="添加你想到的因素" onChange={(e) => setCustom(e.target.value)} />
          <button aria-label="添加因素" disabled={!!s.busy || !custom.trim() || d.factorPreferences.length >= 20} onClick={() => {
            const name = custom.trim();
            if (d.factorPreferences.some((f) => f.name === name) || r.factors.some((f) => f.name === name)) {
              s.setNotice("该因素已存在，可直接调整保留状态。");
              return;
            }
            s.updateDecision({ ...d, factorPreferences: [...d.factorPreferences, { name, source: "user", included: true }] });
            setCustom("");
          }}>
            <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
          </button>
        </div>
      </div>
      <ReportAction />
    </Shell>
  );
}
