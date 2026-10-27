"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDecision } from "./decision-provider";
import { Shell, SubmitButton } from "./shell";
import { ProfileScreen } from "./profile-screen";

const iconPaths: Record<string, React.ReactNode> = {
  briefcase: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V4h8v3M3 12h18" />
    </>
  ),
  book: (
    <>
      <path d="M4 4h6a2 2 0 0 1 2 2v15a3 3 0 0 0-3-3H4ZM20 4h-6a2 2 0 0 0-2 2v15a3 3 0 0 1 3-3h5Z" />
    </>
  ),
  bag: (
    <>
      <path d="M5 8h14l-1 13H6ZM9 8a3 3 0 0 1 6 0" />
    </>
  ),
  coffee: (
    <>
      <path d="M4 8h13v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4ZM17 10h2a2 2 0 0 1 0 4h-2M8 4v2M12 4v2" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m15 9-2 4-4 2 2-4Z" />
    </>
  ),
  more: (
    <>
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </>
  ),
  home: (
    <>
      <path d="m3 11 9-8 9 8M5 10v10h14V10M9 20v-6h6v6" />
    </>
  ),
  folder: <path d="M3 6h7l2 2h9v11H3Z" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6M12 7h.01" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  arrow: (
    <>
      <path d="M5 12h14" />
      <path d="m14 7 5 5-5 5" />
    </>
  ),
  upRight: (
    <>
      <path d="M7 17 17 7M8 7h9v9" />
    </>
  ),
  leaf: (
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
  ),
  check: <path d="m6 12 4 4 8-8" />,
  spark: <path d="m12 3 1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5Z" />,
};
function Ico({ name, size = 20 }: { name: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      {iconPaths[name] ?? iconPaths.more}
    </svg>
  );
}

const scenes: [string, string][] = [
  ["briefcase", "实习 / 工作"],
  ["book", "升学 / 研究"],
  ["more", "其他决定"],
];
const scenePrompts: Record<string, string> = {
  "实习 / 工作":
    "我在比较两份实习或工作机会。\n选项 A 的已知情况：\n选项 B 的已知情况：\n我最在意：\n不能妥协的条件：",
  "升学 / 研究":
    "我在考虑升学或研究方向的选择。\n选项 A：\n选项 B：\n我的基础和目标：\n时间或其他限制：",
  其他决定:
    "我正在纠结的决定是：\n目前考虑的选择：\n各自已经知道的情况：\n我最在意：",
};

export function HomeScreen() {
  const s = useDecision();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<"home" | "history" | "info">(
    searchParams.get("tab") === "history" ? "history" : "home",
  );
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  useEffect(() => {
    const t = searchParams.get("tab");
    if (t === "history" || t === "info") setTab(t);
  }, [searchParams]);
  async function start() {
    if (await s.run("parse")) router.push("/confirm");
  }
  return (
    <Shell isHome>
      {tab === "home" ? (
        <>
          <section className="hero">
            <div className="eyebrow">为实习、升学等重要选择理清思路</div>
            <h1>你在纠结什么决定？</h1>
            <p>先明确不能妥协的条件，再比较你愿意付出的代价。决定由你。</p>
            <svg className="plant" viewBox="0 0 120 110" aria-hidden="true">
              <path d="M58 104C58 76 60 50 42 31M58 79C65 60 76 48 96 38M41 31C31 32 23 25 22 15C34 14 42 20 41 31ZM75 51C78 37 88 29 101 29C99 42 90 50 75 51Z" />
              <circle cx="58" cy="104" r="3" />
            </svg>
          </section>
          <Card className="prompt-card">
            <label htmlFor="decision-question">描述你的问题</label>
            <textarea
              id="decision-question"
              ref={inputRef}
              aria-describedby="question-counter"
              value={s.draft.raw}
              disabled={!!s.busy || !s.ready}
              maxLength={2000}
              onChange={(e) => {
                s.setDraft((d) => ({ ...d, raw: e.target.value }));
                s.setError("");
              }}
              placeholder="比如：我应该选择 A 公司还是 B 公司的实习？"
            />
            <div className="counter" id="question-counter">
              <span>至少 10 字</span>
              <span>{s.draft.raw.length}/2000</span>
            </div>
          </Card>
          <div className="home-primary-action">
            <SubmitButton onClick={start} busy={!!s.busy || !s.ready}>
              {s.error ? "重试梳理" : "帮我梳理"}
            </SubmitButton>
          </div>
          <p className="submission-note">
            点击后，你输入的问题及后续确认信息会发送给 AI
            模型服务用于分析。请避免填写姓名、联系方式等不必要的个人信息。
          </p>
          <details className="home-help">
            <summary>第一次使用？了解这三步</summary>
            <ol>
              <li>描述选择：写下你知道的情况。</li>
              <li>确认方案与标准：区分底线和偏好，补充问题可跳过。</li>
              <li>阅读取舍与待核实信息：修改条件后可以重新分析。</li>
            </ol>
          </details>
          <h2 className="section-title">从你的选择开始</h2>
          <div className="scene-grid">
            {scenes.map(([icon, label]) => (
              <button
                key={label}
                className="scene-card"
                disabled={!!s.busy}
                onClick={() => {
                  s.setDraft((d) => ({ ...d, raw: scenePrompts[label] ?? "" }));
                  s.setError("");
                  inputRef.current?.focus();
                  inputRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  });
                }}
              >
                <span>
                  <Ico name={icon} size={17} />
                </span>
                {label}
              </button>
            ))}
          </div>
          <p className="local-storage-note">
            <Ico name="leaf" size={14} />
            记录仅保存在当前浏览器，清理浏览器数据后可能丢失。
          </p>
        </>
      ) : tab === "history" ? (
        <>
          <header className="simple-header">
            <h1>决策记录</h1>
            <p>保存下来的每一次认真思考。</p>
          </header>
          {s.history.length === 0 ? (
            <div className="empty-hint">
              <Ico name="leaf" size={25} />
              <span>还没有保存的报告</span>
            </div>
          ) : (
            <div className="project-list">
              {s.history.map((h) => (
                <Card className="project-card" key={h.id}>
                  <div>
                    <span className={`tag ${h.mode === "demo" ? "peach" : ""}`}>
                      {h.mode === "demo" ? "示例" : "AI 分析"}
                    </span>
                    <small>
                      {new Date(h.createdAt).toLocaleDateString("zh-CN")}
                    </small>
                  </div>
                  <h2>{h.decision.title}</h2>
                  {(() => {
                    const recId =
                      "recommendedOptionId" in h.report ? h.report.recommendedOptionId : null;
                    if (!recId) return null;
                    const optName = h.decision.options.find((o) => o.id === recId)?.name ?? "—";
                    return <p className="history-rec">推荐：{optName}</p>;
                  })()}
                  <div>
                    <button
                      onClick={() => {
                        s.openReport(h);
                        router.push("/report");
                      }}
                    >
                      打开报告 <Ico name="arrow" size={15} />
                    </button>
                    <button aria-label="删除" onClick={() => setDeleteId(h.id)}>
                      <svg viewBox="0 0 24 24" width={15} height={15}>
                        <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13" />
                      </svg>
                    </button>
                  </div>
                  {deleteId === h.id && (
                    <div className="notice" style={{ marginTop: 12 }}>
                      <div>
                        <b>删除后无法恢复</b>
                        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                          <button
                            className="button small outline"
                            onClick={() => setDeleteId(null)}
                          >
                            取消
                          </button>
                          <button
                            className="button small"
                            onClick={() => {
                              s.removeReport(h.id);
                              setDeleteId(null);
                            }}
                          >
                            确认删除
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </>
      ) : (
        <ProfileScreen />
      )}
      <nav className="bottom-nav" aria-label="主导航">
        {(
          [
            ["home", "首页", "home"],
            ["history", "决策记录", "folder"],
            ["info", "我的", "user"],
          ] as const
        ).map(([key, label, icon]) => (
          <button
            key={key}
            onClick={() => {
              setTab(key);
              s.setError("");
              s.setNotice("");
              window.scrollTo(0, 0);
              document.querySelector(".phone-frame")?.scrollTo(0, 0);
            }}
            className={tab === key ? "active" : ""}
            aria-current={tab === key ? "page" : undefined}
          >
            <Ico name={icon} />
            {label}
          </button>
        ))}
      </nav>
    </Shell>
  );
}

function Card({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={`card ${className}`} style={style}>
      {children}
    </div>
  );
}
