"use client";
import Link from "next/link";
import { AnalysisFeedback } from "./analysis-feedback";
import { ReportNavigation } from "./report-layout";
import { useEffect, useState } from "react";
import { useDecision } from "./decision-provider";

function Icon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    back: <path d="m15 18-6-6 6-6" />,
    arrow: <><path d="M5 12h14" /><path d="m14 7 5 5-5 5" /></>,
    check: <path d="m6 12 4 4 8-8" />,
    sparkles: <><path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" /><path d="M20 2v4" /><path d="M22 4h-4" /><circle cx="4" cy="20" r="2" /></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name] ?? paths.check}</svg>;
}

export function Shell({
  children,
  step,
  subStep,
  subLabel,
  backHref,
  isHome,
}: {
  children: React.ReactNode;
  step?: number;
  subStep?: string;
  subLabel?: string;
  backHref?: string;
  isHome?: boolean;
}) {
  const { draft, error, notice, storageWarning, busy } = useDecision();
  useEffect(() => {
    if (error || busy) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [error, busy]);
  const showFlow = !!step && step > 1;
  return (
    <div className="app-shell">
      <div className={isHome ? "home" : step === 3 ? "report-screen" : ""}>
        {step === 3 ? <ReportNavigation /> : showFlow ? (
          <>
            <header className="flow-top">
              {backHref ? (
                <Link href={backHref} aria-label="返回"><Icon name="back" /></Link>
              ) : <span />}
              <b>{subLabel ? `${step === 3 ? "AI 决策报告" : "确认信息"} · ${subLabel}` : "AI 决策分析报告"}</b>
              <span>{subStep ?? `${step}/3`}</span>
            </header>
            <div className="progress">
              {[1, 2, 3].map((i) => (
                <i key={i} className={i <= (subStep ? Number(subStep.split("/")[0]) : (step ?? 1)) ? "active" : ""} />
              ))}
            </div>
          </>
        ) : (
          <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
            <div className="max-w-5xl mx-auto flex items-center justify-between">
              <Link className="flex items-center gap-2" href="/" aria-label="NextStep 首页">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pop-pink to-pop-yellow flex items-center justify-center" style={{ boxShadow: "3px 3px 0 #1a1a2e" }}>
                  <Icon name="sparkles" />
                </div>
                <span className="text-xl font-bold text-ink-900">Next<span className="gradient-rainbow">Step</span></span>
              </Link>
              <div className="flex items-center gap-3">
                <Link className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-white border-2 border-ink-900 rounded-full text-sm font-medium hover:bg-pop-yellow/20 transition-all" style={{ boxShadow: "3px 3px 0 #1a1a2e" }} href="/dice">决策骰子</Link>
                <Link className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-ink-700 hover:text-ink-900 transition-colors" href="/history">历史记录</Link>
              </div>
            </div>
          </nav>
        )}
        <div className={isHome ? "page-content pt-16" : "page-content"}>
          <main aria-busy={!!busy}>
            {busy && <AnalysisFeedback key={busy} kind={busy} question={busy === "parse" ? draft.raw : (draft.decision?.title || draft.raw)} />}
            {draft.current?.mode === "demo" && step === 3 && (
              <div className="mode-banner">历史演示报告 · 重新分析将使用真实 AI</div>
            )}
            {storageWarning && <p className="error" role="alert">{storageWarning}</p>}
            {error && (
              <p className="error" role="alert">
                {error}<br />
                <small>内容已保留，可使用当前操作按钮重试。</small>
              </p>
            )}
            {notice && <p className="success" role="status">{notice}</p>}
            {children}
          </main>
          {!showFlow && !isHome && <div className="site-note">NextStep · 看清取舍，决定由你 🎯</div>}
        </div>
      </div>
    </div>
  );
}

export function SubmitButton({
  onClick,
  children,
  busy = false,
}: {
  onClick: () => void;
  children: React.ReactNode;
  busy?: boolean;
}) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!busy) { setSeconds(0); return; }
    const started = Date.now();
    const timer = setInterval(() => setSeconds(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [busy]);
  return (
    <button className="button primary" disabled={busy} onClick={onClick}>
      {busy ? (
        <><svg className="animate-spin" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>正在分析{seconds > 0 ? ` · ${seconds} 秒` : "…"}</>
      ) : (
        <>{children}<Icon name="arrow" /></>
      )}
    </button>
  );
}

export function Empty({ text }: { text: string }) {
  return (
    <div className="empty-hint">
      <svg viewBox="0 0 24 24"><path d="M12 21v-8M12 13C7 13 4 10 4 5c5 0 8 3 8 8ZM12 16c0-5 3-8 8-8 0 5-3 8-8 8Z" /></svg>
      <span>{text}</span>
      <Link href="/" className="button small" style={{ marginTop: 14 }}>返回首页</Link>
    </div>
  );
}
