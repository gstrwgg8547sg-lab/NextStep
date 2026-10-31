"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDecision } from "./decision-provider";
import { Shell } from "./shell";

function Ico({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    arrow: <><path d="M5 12h14" /><path d="m14 7 5 5-5 5" /></>,
    trash: <><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M10 11v6M14 11v6" /></>,
    folder: <path d="M3 6h7l2 2h9v11H3Z" />,
    home: <><path d="M3 9.5 12 3l9 6.5" /><path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" /></>,
  };
  return <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{paths[name] ?? paths.folder}</svg>;
}

export function HistoryScreen() {
  const s = useDecision();
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  return (
    <Shell isHome>
      <header className="simple-header">
        <h1>决策记录</h1>
        <p>保存下来的每一次认真思考。</p>
      </header>
      {s.history.length === 0 ? (
        <div className="empty-hint">
          <Ico name="folder" size={28} />
          <span>还没有保存的报告</span>
          <Link href="/" className="button small" style={{ marginTop: 14 }}>返回首页</Link>
        </div>
      ) : (
        <>
          <div className="project-list">
            {s.history.map((h) => (
              <div className="card project-card" key={h.id}>
                <div>
                  <span className={`tag ${h.mode === "demo" ? "pink" : ""}`}>
                    {h.mode === "demo" ? "示例" : "AI 分析"}
                  </span>
                  <small>{new Date(h.createdAt).toLocaleDateString("zh-CN")}</small>
                </div>
                <h2>{h.decision.title}</h2>
                {(() => {
                  const recId = "recommendedOptionId" in h.report ? h.report.recommendedOptionId : null;
                  if (!recId) return null;
                  const optName = h.decision.options.find((o) => o.id === recId)?.name ?? "—";
                  return <p className="history-rec">💡 推荐：{optName}</p>;
                })()}
                <div>
                  <button onClick={() => { s.openReport(h); router.push("/report"); }}>
                    打开报告 <Ico name="arrow" size={15} />
                  </button>
                  <button aria-label="删除" onClick={() => setDeleteId(h.id)}>
                    <Ico name="trash" size={15} />
                  </button>
                </div>
                {deleteId === h.id && (
                  <div className="notice" style={{ marginTop: 12 }}>
                    <div>
                      <b>删除后无法恢复</b>
                      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                        <button className="button small outline" onClick={() => setDeleteId(null)}>取消</button>
                        <button className="button small" onClick={() => { s.removeReport(h.id); setDeleteId(null); }}>确认删除</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-8 pb-16">
            <Link href="/" className="btn-pop inline-flex items-center gap-2 px-6 py-3 text-ink-700 whitespace-nowrap">
              <Ico name="home" size={16} /> 返回首页
            </Link>
          </div>
        </>
      )}
    </Shell>
  );
}
