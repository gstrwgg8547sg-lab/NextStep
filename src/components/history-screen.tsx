"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDecision } from "./decision-provider";
import { Shell } from "./shell";

const colors = ["pink", "yellow", "cyan", "green", "purple"] as const;
type CardColor = (typeof colors)[number];

function Ico({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    arrow: <><path d="M5 12h14" /><path d="m14 7 5 5-5 5" /></>,
    trash: <><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M10 11v6M14 11v6" /></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
    star: <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />,
    heart: <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />,
    arrowLeft: <><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></>,
  };
  return <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{paths[name] ?? paths.arrow}</svg>;
}

export function HistoryScreen() {
  const s = useDecision();
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  return (
    <Shell isHome>
      <main className="min-h-screen px-6 py-20">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-ink-900 rounded-full text-sm font-medium mb-8"
            style={{ boxShadow: "3px 3px 0 #1a1a2e" }}
          >
            <Ico name="arrowLeft" size={16} /> 返回首页
          </Link>

          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-ink-900 mb-2">
              我的<span className="gradient-rainbow">历史记录</span>
            </h1>
            <p className="text-ink-600">记录你每一次认真思考的痕迹</p>
            {s.history.length > 0 && (
              <div
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-pop-yellow/30 border-2 border-ink-900 rounded-full"
                style={{ boxShadow: "3px 3px 0 #1a1a2e" }}
              >
                <Ico name="star" size={16} />
                <span className="text-sm font-bold text-ink-800">
                  已完成 {s.history.length} 个决策
                </span>
              </div>
            )}
          </div>

          {s.history.length > 0 ? (
            <div className="space-y-5">
              {s.history.map((h, i) => {
                const recId =
                  "recommendedOptionId" in h.report
                    ? h.report.recommendedOptionId
                    : null;
                const optName =
                  h.decision.options.find((o) => o.id === recId)?.name ?? "暂不推荐";
                const summary =
                  "summary" in h.report ? h.report.summary : "";
                const unknownsCount =
                  "unknowns" in h.report ? h.report.unknowns.length : 0;
                const color = colors[i % colors.length];
                return (
                  <div
                    key={h.id}
                    className={`card-pop-${color} p-6 relative overflow-hidden group`}
                  >
                    <div className="pr-10">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="chip-pop chip-pop-green text-xs">
                          AI 分析
                        </span>
                        <span className="flex items-center gap-1 text-xs text-ink-600">
                          <Ico name="calendar" size={12} />
                          {new Date(h.createdAt).toLocaleDateString("zh-CN", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-ink-900 mb-2">
                        {h.decision.title}
                      </h3>
                      <p className="text-ink-700 mb-4">
                        推荐：<span className="font-bold">{optName}</span>
                      </p>
                      {summary && (
                        <p className="text-sm text-ink-600 line-clamp-2 mb-4">
                          {summary}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <span className="text-xs px-2 py-1 bg-white/60 rounded-lg border border-ink-200">
                          {h.decision.options.length} 个方案
                        </span>
                        <span className="text-xs px-2 py-1 bg-white/60 rounded-lg border border-ink-200">
                          {(h.decision.criteria?.length ?? 0)} 项标准
                        </span>
                        <span className="text-xs px-2 py-1 bg-white/60 rounded-lg border border-ink-200">
                          {unknownsCount} 项待核实
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            s.openReport(h);
                            router.push("/report");
                          }}
                          className="btn-pop btn-pop-pink px-5 py-2 text-sm font-bold"
                        >
                          打开报告 →
                        </button>
                        {deleteId === h.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-ink-600">确定删除？</span>
                            <button
                              onClick={() => {
                                s.removeReport(h.id);
                                setDeleteId(null);
                              }}
                              className="p-2 bg-pop-red text-white rounded-lg border-2 border-ink-900"
                              style={{ boxShadow: "2px 2px 0 #1a1a2e" }}
                              title="确认删除"
                            >
                              <Ico name="trash" size={16} />
                            </button>
                            <button
                              onClick={() => setDeleteId(null)}
                              className="p-2 bg-white border-2 border-ink-900 rounded-lg text-ink-700"
                              style={{ boxShadow: "2px 2px 0 #1a1a2e" }}
                              title="取消"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteId(h.id)}
                            className="p-2 text-ink-500 hover:text-pop-red transition-colors opacity-0 group-hover:opacity-100"
                            title="删除"
                          >
                            <Ico name="trash" size={20} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card-pop-yellow p-12 text-center">
              <h3 className="text-2xl font-bold text-ink-900 mb-3">
                还没有决策记录
              </h3>
              <p className="text-ink-600 mb-8 max-w-sm mx-auto">
                开始你的第一个决策分析吧！不管是大事小事，
                <br />
                想清楚再选，就不会后悔
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/">
                  <span className="btn-pop btn-pop-pink px-8 py-3 font-bold inline-flex items-center gap-2">
                    <Ico name="star" size={20} /> 开始新决策
                  </span>
                </Link>
                <Link href="/dice">
                  <span className="btn-pop px-8 py-3 font-bold inline-block">
                    玩玩决策骰子
                  </span>
                </Link>
              </div>
            </div>
          )}

          {s.history.length > 0 && (
            <div className="mt-12 card-pop-purple p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Ico name="heart" size={20} />
                <span className="font-bold text-ink-900">你已经认真思考了</span>
                <span className="text-2xl font-bold gradient-rainbow">
                  {s.history.length}
                </span>
                <span className="font-bold text-ink-900">个决定</span>
              </div>
              <p className="text-sm text-ink-700">
                每一次认真的选择，都是对自己人生的负责
              </p>
            </div>
          )}
        </div>
      </main>
    </Shell>
  );
}
