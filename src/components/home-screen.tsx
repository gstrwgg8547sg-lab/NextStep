"use client";
import { useRef } from "react";
import { useRouter } from "next/navigation";
import { useDecision } from "./decision-provider";
import { Shell, SubmitButton } from "./shell";

const iconPaths: Record<string, React.ReactNode> = {
  sparkles: <><path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" /><path d="M20 2v4" /><path d="M22 4h-4" /><circle cx="4" cy="20" r="2" /></>,
  briefcase: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V4h8v3M3 12h18" /></>,
  book: <><path d="M4 4h6a2 2 0 0 1 2 2v15a3 3 0 0 0-3-3H4ZM20 4h-6a2 2 0 0 0-2 2v15a3 3 0 0 1 3-3h5Z" /></>,
  home: <><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" /><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></>,
  dice: <><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M16 8h.01M8 8h.01M8 16h.01M16 16h.01M12 12h.01" /></>,
  brain: <><path d="M12 18V5" /><path d="M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4" /><path d="M17.707 6.294A3 3 0 1 0 12 5a3 3 0 1 0-5.707 1.294" /><path d="M17.996 5.125a4 4 0 0 1 2.526 5.77" /><path d="M18 18a4 4 0 0 0 2-7.465" /><path d="M19.967 17.482a4 4 0 1 1-7.967.517 4 4 0 1 1-7.967-.517" /><path d="M6 18a4 4 0 0 1-2-7.465" /><path d="M6.004 5.125a4 4 0 0 0-2.526 5.77" /></>,
  fileText: <><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" /><path d="M14 2v5a1 1 0 0 0 1 1h5" /><path d="M10 9H8M16 13H8M16 17H8" /></>,
  wand: <><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72" /><path d="m14 7 3 3" /><path d="M5 6v4M19 14v4M10 2v2M7 8H3M21 16h-4M11 3H9" /></>,
  arrow: <><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>,
  bot: <><path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2M20 14h2M15 13v2M9 13v2" /></>,
  lock: <><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
};
function Ico({ name, size = 20 }: { name: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {iconPaths[name] ?? iconPaths.sparkles}
    </svg>
  );
}

const templates = [
  {
    icon: "briefcase",
    title: "实习 / 工作",
    desc: "Offer 对比、跳槽选择",
    prompt: "我在比较两份实习或工作机会。\n选项 A 的已知情况：\n选项 B 的已知情况：\n我最在意：\n不能妥协的条件：",
    gradient: "from-pop-pink to-pop-pink-dark",
  },
  {
    icon: "book",
    title: "升学 / 研究",
    desc: "考研、留学、读博",
    prompt: "我在考虑升学或研究方向的选择。\n选项 A：\n选项 B：\n我的基础和目标：\n时间或其他限制：",
    gradient: "from-pop-cyan to-pop-cyan-dark",
  },
  {
    icon: "home",
    title: "生活 / 财务",
    desc: "买房、投资、大额消费",
    prompt: "我正在纠结一个生活中的重大决定。\n目前考虑的选择：\n各自已经知道的情况：\n我最在意：\n不能妥协的条件：",
    gradient: "from-pop-green to-pop-green-dark",
  },
];

const steps = [
  { num: "1", title: "描述你的选择", desc: "写下你知道的情况，AI 帮你结构化拆解" },
  { num: "2", title: "确认你的标准", desc: "区分底线和偏好，补充问题可以跳过" },
  { num: "3", title: "看报告做决定", desc: "推荐方案 + 成立前提 + 切换条件，明明白白" },
];

export function HomeScreen() {
  const s = useDecision();
  const router = useRouter();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  async function start() {
    if (await s.run("parse")) router.push("/confirm");
  }

  function useTemplate(prompt: string) {
    s.setDraft((d) => ({ ...d, raw: prompt }));
    s.setError("");
    inputRef.current?.focus();
    inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <Shell isHome>
      <section className="text-center mb-10 max-w-3xl mx-auto mt-4">
        <div className="inline-flex items-center gap-2 px-5 py-2 bg-white border-2 border-ink-900 rounded-full mb-8" style={{ boxShadow: "3px 3px 0 #1a1a2e" }}>
          <Ico name="sparkles" size={16} />
          <span className="text-sm font-semibold text-ink-800">AI 决策助手</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
          <span className="scribble-underline">纠结选哪个？</span>
          <br />
          <span className="gradient-rainbow">让 AI 帮你想清楚！</span>
        </h1>
        <p className="text-lg text-ink-600 max-w-xl mx-auto">
          把你的选择告诉 AI，它会帮你拆解标准、分析利弊，
          <br className="hidden md:block" />还给你推荐方案 + 前提条件 + 切换条件
        </p>
      </section>

      <div className="flex flex-wrap justify-center gap-4 mb-10">
        <div className="flex items-center gap-3 px-5 py-3 bg-white border-2 border-ink-900 rounded-2xl" style={{ boxShadow: "4px 4px 0 #1a1a2e" }}>
          <div><div className="text-2xl font-bold gradient-rainbow">∞</div><div className="text-xs text-ink-600">种可能性</div></div>
        </div>
        <div className="flex items-center gap-3 px-5 py-3 bg-white border-2 border-ink-900 rounded-2xl" style={{ boxShadow: "4px 4px 0 #1a1a2e" }}>
          <div><div className="text-2xl font-bold gradient-rainbow">3</div><div className="text-xs text-ink-600">步想清楚</div></div>
        </div>
        <div className="flex items-center gap-3 px-5 py-3 bg-white border-2 border-ink-900 rounded-2xl" style={{ boxShadow: "4px 4px 0 #1a1a2e" }}>
          <div><div className="text-2xl font-bold gradient-rainbow">0</div><div className="text-xs text-ink-600">遗憾率</div></div>
        </div>
      </div>

      <div className="w-full max-w-2xl mx-auto">
        <div className="card-pop p-8 transition-all duration-300">
          <label className="block text-base font-semibold text-ink-800 mb-4">告诉我你在纠结什么</label>
          <textarea
            ref={inputRef}
            placeholder="比如：跳槽去创业公司还是留在大厂？"
            className="w-full bg-transparent text-ink-900 placeholder-ink-400 text-lg resize-none outline-none min-h-[100px]"
            maxLength={2000}
            value={s.draft.raw}
            disabled={!!s.busy || !s.ready}
            onChange={(e) => { s.setDraft((d) => ({ ...d, raw: e.target.value })); s.setError(""); }}
          />
          <div className="flex items-center justify-between mt-4 pt-4 border-t-2 border-ink-100">
            <div className="flex items-center gap-2">
              <span className="text-sm text-ink-500">{s.draft.raw.length}/2000 字</span>
            </div>
            <button
              className="btn-pop btn-pop-pink px-8 py-3 font-bold flex items-center gap-2"
              disabled={!!s.busy || !s.ready || s.draft.raw.length < 10}
              onClick={start}
            >
              <Ico name="wand" size={20} />
              {s.error ? "重试梳理" : "帮我梳理"}
              <Ico name="arrow" size={20} />
            </button>
          </div>
          <p className="text-xs text-ink-500 mt-4 flex items-center gap-1.5">
            <Ico name="lock" size={14} /> 仅保存在你的浏览器，不会上传到服务器
          </p>
        </div>
      </div>

      <div className="w-full max-w-3xl mx-auto mt-16">
        <div className="card-pop-yellow p-8">
          <h3 className="text-xl font-bold text-ink-900 mb-6 flex items-center gap-2">
            <Ico name="bot" size={24} /> 只需三步，想清楚再选
          </h3>
          <div className="space-y-6">
            {steps.map((st) => (
              <div key={st.num} className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-2xl bg-white border-2 border-ink-900 flex items-center justify-center text-lg font-bold flex-shrink-0" style={{ boxShadow: "3px 3px 0 #1a1a2e" }}>
                  {st.num}
                </div>
                <div className="pt-1">
                  <p className="font-bold text-ink-900 text-lg">第 {st.num} 步 · {st.title}</p>
                  <p className="text-ink-700">{st.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full max-w-4xl mx-auto mt-20">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-ink-900 mb-2">从一个模板开始</h2>
          <p className="text-ink-600">不知道怎么描述？点一下就填好</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {templates.map((t) => (
            <button key={t.title} className="card-pop p-6 text-left" onClick={() => useTemplate(t.prompt)}>
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${t.gradient} flex items-center justify-center mb-4`}>
                <Ico name={t.icon} size={28} />
              </div>
              <h3 className="text-xl font-bold text-ink-900 mb-1">{t.title}</h3>
              <p className="text-sm text-ink-600">{t.desc}</p>
              <div className="mt-4 flex items-center gap-1 text-pop-pink text-sm font-medium">
                一键使用 <Ico name="arrow" size={16} />
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="w-full max-w-4xl mx-auto mt-20">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-ink-900 mb-2">更多功能</h2>
          <p className="text-ink-600">做决策也可以很有趣</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <a href="/dice">
            <div className="card-pop-yellow p-6 cursor-pointer">
              <Ico name="dice" size={32} />
              <h3 className="text-lg font-bold text-ink-900 mb-1 mt-3">决策骰子</h3>
              <p className="text-sm text-ink-700">纠结到爆？让命运帮你选</p>
            </div>
          </a>
          <a href="/">
            <div className="card-pop-pink p-6 cursor-pointer">
              <Ico name="brain" size={32} />
              <h3 className="text-lg font-bold text-ink-900 mb-1 mt-3">AI 深度分析</h3>
              <p className="text-sm text-ink-700">结构化拆解你的决策</p>
            </div>
          </a>
          <a href="/history">
            <div className="card-pop-green p-6 cursor-pointer">
              <Ico name="fileText" size={32} />
              <h3 className="text-lg font-bold text-ink-900 mb-1 mt-3">历史记录</h3>
              <p className="text-sm text-ink-700">查看你过往的决策分析</p>
            </div>
          </a>
        </div>
      </div>

      <div className="w-full max-w-2xl mx-auto mt-20">
        <div className="text-center">
          <div className="inline-block px-6 py-3 bg-white border-2 border-dashed border-pop-purple rounded-2xl">
            <p className="text-sm text-ink-700">
              <span className="text-pop-purple font-bold">冷知识：</span>研究显示，把选择写下来能提升 30% 的决策质量
            </p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-xl mx-auto mt-20 text-center">
        <div className="card-pop-pink p-8">
          <h3 className="text-2xl font-bold text-ink-900 mb-2">准备好做一个不后悔的决定了吗？</h3>
          <p className="text-ink-700 mb-6">现在就开始，让 AI 帮你想清楚</p>
          <button className="btn-pop btn-pop-yellow px-8 py-4 font-bold text-lg" onClick={() => inputRef.current?.focus()}>
            <span className="flex items-center gap-2">
              <Ico name="wand" size={20} /> 开始我的决策
            </span>
          </button>
        </div>
      </div>
    </Shell>
  );
}
