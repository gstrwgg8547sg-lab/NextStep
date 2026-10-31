"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useDecision } from "./decision-provider";

const tabs = [
  { href: "/report", label: "结论", icon: "✨" },
  { href: "/report/options", label: "方案对比", icon: "⚖️" },
  { href: "/report/factors", label: "待核实", icon: "🔍" },
];

export function ReportNav() {
  const router = useRouter();
  const s = useDecision();
  return (
    <nav className="report-top-nav">
      <Link className="report-logo" href="/" aria-label="NextStep 首页">
        <span className="report-logo-icon">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" /><path d="M20 2v4" /><path d="M22 4h-4" /><circle cx="4" cy="20" r="2" /></svg>
        </span>
        <span className="report-logo-text">NextStep</span>
      </Link>
      <div className="report-nav-links">
        <Link href="/history" className="report-nav-link">决策记录</Link>
        <button
          className="report-nav-btn"
          onClick={() => { if (s.saveReport()) router.push("/history"); }}
          disabled={!s.draft.current || !!s.busy}
        >
          保存
        </button>
      </div>
    </nav>
  );
}

export function ReportTabs() {
  const path = usePathname();
  return (
    <div className="report-tabs-wrap">
      <nav className="report-tabs" aria-label="报告章节">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`report-tab ${path === t.href ? "active" : ""}`}
            aria-current={path === t.href ? "page" : undefined}
          >
            <span>{t.icon}</span> {t.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function ReportNavigation() {
  return <ReportNav />;
}

export function ReportAction() {
  return (
    <div className="action-bar report-action">
      <Link className="btn-pop btn-pop-purple px-8 py-3 font-bold" href="/confirm">
        修改条件并重新分析
      </Link>
    </div>
  );
}

export const sourceNames = {
  user_fact: "基于用户信息",
  ai_inference: "AI 推断",
  unknown: "未知 · 待核实",
};
