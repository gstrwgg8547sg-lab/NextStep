"use client";
import { useState } from "react";
import Link from "next/link";
import {
  FileText,
  ChartColumn,
  CircleAlert,
  Save,
  House,
  Settings,
  CircleCheck,
  ArrowRight,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useDecision } from "./decision-provider";

const tabs = [
  { href: "/report", label: "结论", icon: FileText },
  { href: "/report/options", label: "方案对比", icon: ChartColumn },
  { href: "/report/factors", label: "待核实", icon: CircleAlert },
];

export function ReportNav({ showSave = true }: { showSave?: boolean }) {
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
        {showSave && <button
          className="report-nav-btn"
          onClick={() => { if (s.saveReport()) router.push("/history"); }}
          disabled={!s.draft.current || !!s.busy}
        >
          保存
        </button>}
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
            <t.icon size={16} aria-hidden="true" /> {t.label}
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
  const s = useDecision();
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
      <Link href="/" className="btn-pop flex items-center gap-2 px-6 py-3 text-ink-700">
        <House className="w-4 h-4" /> 返回首页
      </Link>
      <Link href="/confirm/focus" className="btn-pop flex items-center gap-2 px-6 py-3 text-ink-700">
        <Settings className="w-4 h-4" /> 修改条件并重新分析
      </Link>
      <button
        className={`btn-pop flex items-center gap-2 px-6 py-3 font-semibold transition-all ${saved ? "btn-pop-green" : "btn-pop-pink"}`}
        disabled={!s.draft.current || !!s.busy}
        onClick={() => {
          if (s.saveReport()) {
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
          }
        }}
      >
        {saved ? (
          <>
            <CircleCheck className="w-4 h-4" /> 已保存
          </>
        ) : (
          <>
            <Save className="w-4 h-4" /> 保存报告
          </>
        )}
      </button>
      <Link href="/report/factors" className="flex items-center gap-2 text-ink-600 hover:text-ink-800 transition-colors">
        查看待核实信息 <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

export const sourceNames = {
  user_fact: "基于用户信息",
  ai_inference: "AI 推断",
  unknown: "未知 · 待核实",
};
