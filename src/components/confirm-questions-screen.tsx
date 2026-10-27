"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDecision } from "./decision-provider";
import { Shell, Empty, SubmitButton } from "./shell";

export function ConfirmQuestionsScreen() {
  const s = useDecision();
  const router = useRouter();
  const d = s.draft.decision;
  if (!s.ready) return <Shell step={2}><p role="status">正在恢复本地草稿…</p></Shell>;
  if (!d) return <Shell step={2}><Empty text="还没有待确认的信息" /></Shell>;
  const update = (patch: Partial<typeof d>) => s.updateDecision({ ...d, ...patch });
  const chipsFor = (q: { question: string; suggestedAnswers?: string[] }) =>
    q.suggestedAnswers && q.suggestedAnswers.length > 0
      ? q.suggestedAnswers
      : [];
  return (
    <Shell step={2} subStep="3/3" subLabel="补充问题" backHref="/confirm/focus">
      <div className="intro">
        <h1>再确认几件事</h1>
        <p>这些信息会帮助分析更贴近你的真实处境，也可以跳过。</p>
      </div>
      <fieldset disabled={!!s.busy} className="contents">
        {d.questions.map((q, i) => (
          <div className="card question-card" key={i}>
            <div className="question-head">
              <span>{String(i + 1).padStart(2, "0")}</span>
              <b>{q.question}</b>
              <small>可跳过</small>
            </div>
            <input aria-label={q.question} className="input" value={q.answer} placeholder="写下你的回答…"
              onChange={(e) => update({ questions: d.questions.map((x, j) => (j === i ? { ...x, answer: e.target.value } : x)) })} />
            <div className="chips">
              {chipsFor(q).map((o) => (
                <button key={o} aria-pressed={q.answer === o} onClick={() => update({ questions: d.questions.map((x, j) => (j === i ? { ...x, answer: o } : x)) })}>
                  {o}
                </button>
              ))}
            </div>
            <button className="skip" onClick={() => update({ questions: d.questions.map((x, j) => (j === i ? { ...x, answer: "" } : x)) })}>
              跳过此问题
            </button>
          </div>
        ))}
      </fieldset>
      <div className="action-bar">
        <SubmitButton busy={!!s.busy} onClick={async () => {
          if (await s.run("analyze")) router.push("/report");
        }}>
          {s.error ? "重试生成分析" : "生成分析报告"}
        </SubmitButton>
        <Link href="/confirm/focus" className="text-button" style={{ display: "block", textAlign: "center", marginTop: 10 }}>上一步</Link>
      </div>
    </Shell>
  );
}
