"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDecision } from "./decision-provider";
import { Shell, Empty, SubmitButton } from "./shell";
import { uid } from "@/lib/utils";

export function ConfirmOptionsScreen() {
  const s = useDecision();
  const router = useRouter();
  const d = s.draft.decision;
  if (!s.ready) return <Shell step={2}><p role="status">正在恢复本地草稿…</p></Shell>;
  if (!d) return <Shell step={2}><Empty text="还没有待确认的信息" /></Shell>;
  const update = (patch: Partial<typeof d>) => s.updateDecision({ ...d, ...patch });
  const editOption = (index: number, field: string, value: string) =>
    update({ options: d.options.map((o, i) => (i === index ? { ...o, [field]: value } : o)) });
  return (
    <Shell step={2} subStep="1/3" subLabel="候选方案" backHref="/">
      <div className="intro">
        <h1>有哪些选择？</h1>
        <p>把你正在比较的选项写下来，已知多少都可以。</p>
      </div>
      <fieldset disabled={!!s.busy} className="contents">
        <div className="card-pop decision-context">
        <label className="field">
          <span>决策主题</span>
          <input className="input" value={d.title} maxLength={100} onChange={(e) => update({ title: e.target.value })} />
        </label>
        <label className="field-label">决策领域</label>
        <select className="input" aria-label="决策领域" value={d.domain === "research" ? "study" : d.domain} onChange={(e) => update({ domain: e.target.value as typeof d.domain })}>
          <option value="career">工作</option>
          <option value="study">学习</option>
          <option value="life">生活</option>
          <option value="other">其他</option>
        </select>
        </div>
        <div className="stack">
          {d.options.map((o, i) => {
            const letter = String.fromCharCode(65 + i);
            return (
              <div className="card option-card" key={o.id}>
                <div className="option-head">
                  <span className={`letter ${i % 2 ? "peach" : ""}`}>{letter}</span>
                  <b>方案 {letter}</b>
                  {d.options.length > 2 && (
                    <button className="delete" aria-label={`删除方案 ${letter}`} onClick={() => update({ options: d.options.filter((x) => x.id !== o.id) })}>
                      <svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13" /></svg>
                    </button>
                  )}
                </div>
                <label className="field"><span>名称</span>
                  <input className="input" value={o.name} maxLength={100} onChange={(e) => editOption(i, "name", e.target.value)} placeholder="输入方案名称" />
                </label>
                <label className="field"><span>已知事实</span>
                  <textarea className="input" value={o.facts} onChange={(e) => editOption(i, "facts", e.target.value)} placeholder="例如：薪资、地点、工作内容" />
                </label>
                <div className="two-col">
                  <label className="field"><span>你的判断</span>
                    <input className="input" value={o.judgments} onChange={(e) => editOption(i, "judgments", e.target.value)} placeholder="目前的感受" />
                  </label>
                  <label className="field"><span>还不确定的</span>
                    <input className="input" value={o.unknowns} onChange={(e) => editOption(i, "unknowns", e.target.value)} placeholder="想确认什么" />
                  </label>
                </div>
              </div>
            );
          })}
        </div>
        {d.options.length < 6 && (
          <button className="button secondary" onClick={() => update({
            options: [...d.options, { id: uid(), name: "", facts: "", judgments: "", unknowns: "" }],
          })}>
            <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
            添加候选方案
          </button>
        )}
      </fieldset>
      <div className="action-bar">
        <SubmitButton onClick={() => router.push("/confirm/focus")}>下一步：目标与限制</SubmitButton>
        <Link href="/" className="text-button" style={{ display: "block", textAlign: "center", marginTop: 10 }}>返回修改问题</Link>
      </div>
    </Shell>
  );
}
