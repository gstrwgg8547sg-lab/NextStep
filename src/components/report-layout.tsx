"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useDecision } from "./decision-provider";
export function ReportNavigation() {
  const path = usePathname();
  const router = useRouter();
  const s = useDecision();
  return (
    <div className="report-navigation">
      <div className="report-toolbar">
        <Link href="/history" aria-label="返回决策记录">
          ‹
        </Link>
        <b>决策分析报告</b>
        <button
          onClick={() => {
            if (s.saveReport()) router.push("/history");
          }}
          disabled={!s.draft.current || !!s.busy}
        >
          保存
        </button>
      </div>
      <nav aria-label="报告章节">
        {[
          ["/report", "结论"],
          ["/report/options", "方案对比"],
          ["/report/factors", "待核实"],
        ].map(([href, label]) => (
          <Link
            key={href}
            href={href}
            aria-current={path === href ? "page" : undefined}
          >
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
export function ReportAction() {
  return (
    <div className="action-bar report-action">
      <Link className="button" href="/confirm">
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
