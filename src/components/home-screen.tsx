"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDecision } from "./decision-provider";
import { Shell, SubmitButton } from "./shell";
import { ProfileScreen } from "./profile-screen";

const iconPaths: Record<string, React.ReactNode> = {
  briefcase: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V4h8v3M3 12h18" /></>,
  book: <><path d="M4 4h6a2 2 0 0 1 2 2v15a3 3 0 0 0-3-3H4ZM20 4h-6a2 2 0 0 0-2 2v15a3 3 0 0 1 3-3h5Z" /></>,
  bag: <><path d="M5 8h14l-1 13H6ZM9 8a3 3 0 0 1 6 0" /></>,
  coffee: <><path d="M4 8h13v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4ZM17 10h2a2 2 0 0 1 0 4h-2M8 4v2M12 4v2" /></>,
  compass: <><circle cx="12" cy="12" r="9" /><path d="m15 9-2 4-4 2 2-4Z" /></>,
  more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
  home: <><path d="m3 11 9-8 9 8M5 10v10h14V10M9 20v-6h6v6" /></>,
  folder: <path d="M3 6h7l2 2h9v11H3Z" />,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7h.01" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  arrow: <><path d="M5 12h14" /><path d="m14 7 5 5-5 5" /></>,
  upRight: <><path d="M7 17 17 7M8 7h9v9" /></>,
  leaf: <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />,
  check: <path d="m6 12 4 4 8-8" />,
  spark: <path d="m12 3 1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5Z" />,
  bolt: <path d="M13 2 3 14h7l-1 8 10-12h-7Z" />,
  brain: <><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" /><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" /></>,
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  lock: <><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
  shieldCheck: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></>,
};
function Ico({ name, size = 20 }: { name: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      {iconPaths[name] ?? iconPaths.more}
    </svg>
  );
}

const scenes: { icon: string; title: string; desc: string; prompt: string }[] = [
  {
    icon: "briefcase",
    title: "实习 / 工作",
    desc: "比较 offer、选公司、跳槽决策",
    prompt: "我在比较两份实习或工作机会。\n选项 A 的已知情况：\n选项 B 的已知情况：\n我最在意：\n不能妥协的条件：",
  },
  {
    icon: "book",
    title: "升学 / 研究",
    desc: "选学校、选方向、考研留学",
    prompt: "我在考虑升学或研究方向的选择。\n选项 A：\n选项 B：\n我的基础和目标：\n时间或其他限制：",
  },
  {
    icon: "compass",
    title: "其他决定",
    desc: "买房、搬家、创业等重大选择",
    prompt: "我正在纠结的决定是：\n目前考虑的选择：\n各自已经知道的情况：\n我最在意：",
  },
];

const steps = [
  { icon: "pencil", num: "1", title: "描述选择", desc: "写下你知道的情况，AI 帮你梳理选项和标准" },
  { icon: "target", num: "2", title: "确认标准", desc: "区分底线和偏好，补充问题可跳过" },
  { icon: "sparkles", num: "3", title: "阅读报告", desc: "看清取舍与待核实信息，可随时修改重新分析" },
];

const features = [
  { icon: "brain", title: "AI 深度分析", desc: "从多个视角拆解你的决策，识别关键因素" },
  { icon: "shieldCheck", title: "本地存储", desc: "所有记录仅保存在你的浏览器，不上传云端" },
  { icon: "clock", title: "快速梳理", desc: "3 步完成决策分析，几分钟看清取舍" },
];

export function HomeScreen() {
  const s = useDecision();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<"home" | "history" | "info">(
    searchParams.get("tab") === "history" ? "history" : searchParams.get("tab") === "info" ? "info" : "home",
  );
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  useEffect(() => {
    const t = searchParams.get("tab");
    if (t === "history" || t === "info") setTab(t);
    else setTab("home");
  }, [searchParams]);
  async function start() {
    if (await s.run("parse")) router.push("/confirm");
  }
  return (
    <Shell isHome>
      {tab === "home" ? (
        <>
          <section className="hero">
            <div className="eyebrow">
              <Ico name="spark" size={16} /> AI 决策分析 · 让选择更清晰
            </div>
            <h1>
              你在纠结<span className="gradient-rainbow">什么决定</span>？
            </h1>
            <p>先明确不能妥协的条件，再比较你愿意付出的代价。决定由你，AI 只是帮你想清楚。</p>
            <div className="stats">
              <div className="stat"><b>3</b><small>步出报告</small></div>
              <div className="stat"><b>∞</b><small>视角分析</small></div>
              <div className="stat"><b>🔒</b><small>本地存储</small></div>
            </div>
          </section>

          <div className="card prompt-card">
            <label className="field-label" htmlFor="decision-question">描述你的问题</label>
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
          </div>

          <div style={{ marginBottom: 16 }}>
            <SubmitButton onClick={start} busy={!!s.busy || !s.ready}>
              {s.error ? "重试梳理" : "帮我梳理"}
            </SubmitButton>
          </div>

          <p className="privacy-note">
            <Ico name="lock" size={14} />
            内容仅用于本次分析。避免填写姓名、联系方式等不必要的个人信息。
          </p>

          <h2 className="section-title">从你的选择开始</h2>
          <p className="section-subtitle">点击模板快速开始，也可以自由描述</p>
          <div className="scene-grid">
            {scenes.map((sc) => (
              <button
                key={sc.title}
                className="scene-card"
                disabled={!!s.busy}
                onClick={() => {
                  s.setDraft((d) => ({ ...d, raw: sc.prompt }));
                  s.setError("");
                  inputRef.current?.focus();
                  inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
              >
                <div className="icon"><Ico name={sc.icon} size={26} /></div>
                <div>
                  <h3>{sc.title}</h3>
                  <p>{sc.desc}</p>
                </div>
                <span className="use">使用模板 →</span>
              </button>
            ))}
          </div>

          <h2 className="section-title">三步完成决策分析</h2>
          <p className="section-subtitle">清晰的流程，让你不遗漏任何关键因素</p>
          <div className="scene-grid">
            {steps.map((st) => (
              <div key={st.num} className="card" style={{ padding: 20, textAlign: "left" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span className="letter">{st.num}</span>
                  <Ico name={st.icon} size={20} />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--ink)" }}>{st.title}</h3>
                <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>{st.desc}</p>
              </div>
            ))}
          </div>

          <h2 className="section-title">为什么选择 NextStep？</h2>
          <div className="scene-grid">
            {features.map((f) => (
              <div key={f.title} className="card-pop-yellow" style={{ padding: 20, textAlign: "left" }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: "var(--pop-yellow)", display: "grid", placeItems: "center", marginBottom: 12 }}>
                  <Ico name={f.icon} size={24} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>{f.title}</h3>
                <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </>
      ) : tab === "history" ? (
        <>
          <header className="simple-header">
            <h1>决策记录</h1>
            <p>保存下来的每一次认真思考。</p>
          </header>
          {s.history.length === 0 ? (
            <div className="empty-hint">
              <Ico name="folder" size={28} />
              <span>还没有保存的报告</span>
              <button className="button small" onClick={() => router.push("/")} style={{ marginTop: 14 }}>返回首页</button>
            </div>
          ) : (
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
                      <svg viewBox="0 0 24 24" width={15} height={15}><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13" /></svg>
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
          )}
        </>
      ) : (
        <ProfileScreen />
      )}
    </Shell>
  );
}
