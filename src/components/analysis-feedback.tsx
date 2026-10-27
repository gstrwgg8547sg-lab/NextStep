"use client";
import { useEffect, useState } from "react";
export function AnalysisFeedback({
  kind,
  question,
}: {
  kind: "parse" | "analyze";
  question: string;
}) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    setElapsed(0);
    const start = Date.now();
    const timer = setInterval(
      () => setElapsed(Math.floor((Date.now() - start) / 1000)),
      1000,
    );
    return () => clearInterval(timer);
  }, [kind]);
  return (
    <section className="analysis-feedback" aria-label="分析进度">
      <div role="status">
        <span className="feedback-spinner" aria-hidden="true" />
        <h2>{kind === "parse" ? "正在整理你的问题" : "正在生成你的报告"}</h2>
      </div>
      <p className="feedback-question">{question}</p>
      <p>
        {elapsed >= 20
          ? "这次等待有些久，仍在等待服务返回。你可以继续等待；请求失败后可重试。"
          : "正在等待 AI 服务返回结果，完成后自动进入下一页。"}
      </p>
      <div className="feedback-skeleton" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <small>已等待 {elapsed} 秒 · 当前输入仍在页面中</small>
    </section>
  );
}
