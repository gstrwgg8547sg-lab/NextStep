"use client";
import { useState } from "react";
import type { Criterion, Decision } from "@/lib/schema";
export const priorityNames = {
  must: "必须满足",
  prefer: "优先考虑",
  consider: "一般考虑",
};
export function CriteriaEditor({
  decision,
  update,
}: {
  decision: Decision;
  update: (patch: Partial<Decision>) => void;
}) {
  const [name, setName] = useState("");
  const criteria = decision.criteria ?? [];
  const edit = (id: string, patch: Partial<Criterion>) =>
    update({
      criteria: criteria.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    });
  return (
    <section className="criteria-editor">
      <h2 className="section-title">这次，按什么标准选？</h2>
      <p className="muted">
        AI 提出的标准由你确认。必须满足是底线；优先考虑决定取舍。最多 5 项。
      </p>
      {criteria.map((c, i) => (
        <div className="card criterion-card" key={c.id}>
          <div className="criterion-heading">
            <span className="reason-number">0{i + 1}</span>
            <input
              className="input"
              aria-label={`标准 ${i + 1} 名称`}
              maxLength={40}
              value={c.name}
              onChange={(e) => edit(c.id, { name: e.target.value })}
            />
            <button
              className="text-button"
              aria-label={`删除标准 ${c.name}`}
              onClick={() =>
                update({ criteria: criteria.filter((x) => x.id !== c.id) })
              }
            >
              删除
            </button>
          </div>
          <div
            className="priority-picker"
            role="group"
            aria-label={`${c.name}重要程度`}
          >
            {(Object.keys(priorityNames) as Criterion["priority"][]).map(
              (p) => (
                <button
                  key={p}
                  aria-pressed={c.priority === p}
                  onClick={() => edit(c.id, { priority: p })}
                >
                  {priorityNames[p]}
                </button>
              ),
            )}
          </div>
          <input
            className="input"
            aria-label={`${c.name}具体要求`}
            placeholder="具体要求或可接受范围（可不填）"
            maxLength={160}
            value={c.requirement}
            onChange={(e) => edit(c.id, { requirement: e.target.value })}
          />
        </div>
      ))}
      {!criteria.length && (
        <p className="notice">请添加至少一个你希望比较的标准。</p>
      )}
      <div className="add-factor">
        <input
          aria-label="新决策标准"
          placeholder="添加遗漏的比较标准"
          maxLength={40}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          disabled={
            !name.trim() ||
            criteria.length >= 5 ||
            criteria.some((c) => c.name === name.trim())
          }
          onClick={() => {
            update({
              criteria: [
                ...criteria,
                {
                  id: crypto.randomUUID(),
                  name: name.trim(),
                  priority: "consider",
                  requirement: "",
                },
              ],
            });
            setName("");
          }}
        >
          添加
        </button>
      </div>
      <h2 className="section-title">分析深度</h2>
      <div className="segmented">
        <button
          aria-pressed={decision.depth === "quick"}
          className={decision.depth === "quick" ? "active" : ""}
          onClick={() => update({ depth: "quick" })}
        >
          简明分析
        </button>
        <button
          aria-pressed={decision.depth !== "quick"}
          className={decision.depth !== "quick" ? "active" : ""}
          onClick={() => update({ depth: "standard" })}
        >
          补充影响分析
        </button>
      </div>
      <p className="muted">
        简明分析聚焦当前取舍；补充影响分析会说明可能的后续影响。两者都基于你提供的信息，不包含外部事实核验。
      </p>
    </section>
  );
}
