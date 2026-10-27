"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDecision } from "./decision-provider";
import { Shell, Empty, SubmitButton } from "./shell";
import { CriteriaEditor } from "./criteria-editor";

function appendItem(current: string, item: string) {
  const parts = current.split(/[，,、\s]+/).filter(Boolean);
  if (parts.includes(item)) return current;
  return current ? `${current}、${item}` : item;
}

export function ConfirmFocusScreen() {
  const s = useDecision();
  const router = useRouter();
  const d = s.draft.decision;
  if (!s.ready)
    return (
      <Shell step={2}>
        <p role="status">正在恢复本地草稿…</p>
      </Shell>
    );
  if (!d)
    return (
      <Shell step={2}>
        <Empty text="还没有待确认的信息" />
      </Shell>
    );
  const update = (patch: Partial<typeof d>) =>
    s.updateDecision({ ...d, ...patch });
  const hasQuestions = d.questions.length > 0;
  return (
    <Shell step={2} subStep="2/3" subLabel="决策标准" backHref="/confirm">
      <div className="intro">
        <h1>按你的标准，做选择</h1>
        <p>明确真正重要的事，AI 才能围绕你的标准梳理取舍。</p>
      </div>
      <fieldset disabled={!!s.busy} className="contents">
        <CriteriaEditor decision={d} update={update} />
        <details className="card plain-card">
          <summary>补充目标与现实限制</summary>
          <div className="card prompt-section">
            <div className="card-title">
              <span>
                <svg viewBox="0 0 24 24">
                  <path d="M20 8c0 6-8 11-8 11S4 14 4 8a4 4 0 0 1 8-1 4 4 0 0 1 8 1Z" />
                </svg>
              </span>
              <h2>你最重视什么？</h2>
            </div>
            <textarea
              aria-label="你最重视什么"
              value={d.preferences}
              onChange={(e) => update({ preferences: e.target.value })}
              placeholder="写下这次选择中你最在意的事……"
            />
            <div className="chips">
              {(d.preferenceSuggestions ?? []).map((o) => (
                <button
                  key={o}
                  onClick={() =>
                    update({ preferences: appendItem(d.preferences, o) })
                  }
                >
                  + {o}
                </button>
              ))}
            </div>
          </div>
          <div className="card prompt-section">
            <div className="card-title">
              <span className="peach">
                <svg viewBox="0 0 24 24">
                  <path d="M12 3 4 6v5c0 5 3 8 8 10 5-2 8-5 8-10V6Z" />
                </svg>
              </span>
              <h2>必须满足的条件</h2>
            </div>
            <textarea
              aria-label="必须满足的条件"
              value={d.constraints}
              onChange={(e) => update({ constraints: e.target.value })}
              placeholder="写下已经约定、无法更改或必须满足的条件……"
            />
            <div className="chips">
              {(d.constraintSuggestions ?? []).map((o) => (
                <button
                  key={o}
                  onClick={() =>
                    update({ constraints: appendItem(d.constraints, o) })
                  }
                >
                  + {o}
                </button>
              ))}
            </div>
          </div>
        </details>
      </fieldset>
      <div className="action-bar">
        <SubmitButton
          busy={!!s.busy}
          onClick={async () => {
            if (!d.criteria?.length || d.criteria.some((c) => !c.name.trim())) {
              s.setError("请填写至少一项有效决策标准。");
              return;
            }
            if (hasQuestions) router.push("/confirm/questions");
            else if (await s.run("analyze")) router.push("/report");
          }}
        >
          {hasQuestions ? "下一步：补充问题" : "生成分析报告"}
        </SubmitButton>
        <Link
          href="/confirm"
          className="text-button"
          style={{ display: "block", textAlign: "center", marginTop: 10 }}
        >
          上一步
        </Link>
      </div>
    </Shell>
  );
}
