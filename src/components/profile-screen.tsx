"use client";
import { useEffect, useRef, useState } from "react";
import { useDecision } from "./decision-provider";
import { Card } from "./ui/card";

const PROFILE_KEY = "nextstep:profile";
const SETTINGS_KEY = "nextstep:settings";

const menuIcon: Record<string, React.ReactNode> = {
  download: (
    <svg
      viewBox="0 0 24 24"
      width={18}
      height={18}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  ),
  upload: (
    <svg
      viewBox="0 0 24 24"
      width={18}
      height={18}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 21V9" />
      <path d="m7 14 5-5 5 5" />
      <path d="M5 3h14" />
    </svg>
  ),
  trash: (
    <svg
      viewBox="0 0 24 24"
      width={18}
      height={18}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M6 6v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6" />
    </svg>
  ),
  help: (
    <svg
      viewBox="0 0 24 24"
      width={18}
      height={18}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  ),
  shield: (
    <svg
      viewBox="0 0 24 24"
      width={18}
      height={18}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3 4 6v5c0 5 3 8 8 10 5-2 8-5 8-10V6Z" />
    </svg>
  ),
  edit: (
    <svg
      viewBox="0 0 24 24"
      width={14}
      height={14}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  ),
};

function Chevron() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={16}
      height={16}
      fill="none"
      stroke="#b8bab2"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function ProfileScreen() {
  const s = useDecision();
  const [nickname, setNickname] = useState("决策小助手");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [autoSave, setAutoSave] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [notice, setNotice] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const p = localStorage.getItem(PROFILE_KEY);
      if (p) setNickname(JSON.parse(p).nickname);
      const st = localStorage.getItem(SETTINGS_KEY);
      if (st) setAutoSave(JSON.parse(st).autoSave ?? true);
    } catch {
      /* ignore */
    }
  }, []);

  const reportCount = s.history.length;
  const optionCount = s.history.reduce(
    (n, r) => n + (r.decision?.options?.length || 0),
    0,
  );

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(""), 3000);
  };

  const saveNickname = () => {
    const name = draft.trim() || "决策小助手";
    setNickname(name);
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify({ nickname: name }));
    } catch {
      /* ignore */
    }
    setEditing(false);
  };

  const toggleAutoSave = (v: boolean) => {
    setAutoSave(v);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ autoSave: v }));
    } catch {
      /* ignore */
    }
  };

  const handleExport = () => {
    try {
      const data = {
        version: 1,
        exportedAt: new Date().toISOString(),
        nickname,
        history: s.history,
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nextstep-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showNotice("数据已导出");
    } catch {
      showNotice("导出失败");
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (Array.isArray(data.history)) {
          const imported = data.history;
          const merged = [
            ...imported,
            ...s.history.filter(
              (h) => !imported.some((i: any) => i.id === h.id),
            ),
          ].slice(0, 50);
          localStorage.setItem("nextstep:history:v1", JSON.stringify(merged));
          // Refresh by reloading
          window.location.reload();
        } else {
          showNotice("文件格式不正确");
        }
      } catch {
        showNotice("导入失败，文件无法解析");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleClearHistory = () => {
    try {
      localStorage.removeItem("nextstep:history:v1");
      showNotice("已清空所有历史记录");
      setTimeout(() => window.location.reload(), 800);
    } catch {
      showNotice("清空失败");
    }
    setConfirmClear(false);
  };

  const stats = [
    { label: "已保存", value: reportCount },
    { label: "对比方案", value: optionCount },
  ];

  return (
    <div>
      <header className="simple-header">
        <h1>我的</h1>
      </header>

      {notice && (
        <div
          style={{
            position: "fixed",
            top: 60,
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--forest)",
            color: "#fff",
            padding: "8px 16px",
            borderRadius: 20,
            fontSize: 12,
            zIndex: 100,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          {notice}
        </div>
      )}

      <Card
        style={{
          padding: 20,
          marginBottom: 14,
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "linear-gradient(135deg, var(--sage), #cdd8c7)",
            display: "grid",
            placeItems: "center",
            color: "var(--forest)",
            fontSize: 22,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {nickname.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {editing ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                className="input"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                style={{ fontSize: 14, height: 38, flex: 1, minWidth: 0 }}
                placeholder="输入昵称"
                maxLength={12}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveNickname();
                }}
              />
              <button
                className="button small"
                style={{
                  height: 38,
                  padding: "0 16px",
                  fontSize: 13,
                  flexShrink: 0,
                }}
                onClick={saveNickname}
              >
                保存
              </button>
            </div>
          ) : (
            <div
              onClick={() => {
                setDraft(nickname);
                setEditing(true);
              }}
              style={{
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--forest)",
                }}
              >
                {nickname}
              </span>
              <span style={{ color: "var(--weak)" }}>{menuIcon.edit}</span>
            </div>
          )}
          <div style={{ fontSize: 11, color: "var(--weak)", marginTop: 2 }}>
            本地用户 · 数据保存在当前浏览器
          </div>
        </div>
      </Card>

      <Card style={{ padding: "16px 8px", marginBottom: 14 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2,1fr)",
            textAlign: "center",
          }}
        >
          {stats.map((st, i) => (
            <div
              key={st.label}
              style={{
                padding: "4px 0",
                borderRight:
                  i < stats.length - 1 ? "1px solid var(--line)" : "none",
              }}
            >
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: "var(--forest)",
                }}
              >
                {st.value}
              </div>
              <div style={{ fontSize: 11, color: "var(--weak)", marginTop: 2 }}>
                {st.label}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div
        style={{
          fontSize: 11,
          color: "var(--weak)",
          fontWeight: 600,
          margin: "0 4px 8px",
        }}
      >
        数据管理
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          marginBottom: 18,
        }}
      >
        <button
          className="card"
          style={{
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            textAlign: "left",
            border: "1px solid var(--line)",
          }}
          onClick={handleExport}
        >
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              display: "grid",
              placeItems: "center",
              background: "var(--sage)",
              color: "var(--forest)",
              flexShrink: 0,
            }}
          >
            {menuIcon.download}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{ fontSize: 13, fontWeight: 600, color: "var(--forest)" }}
            >
              导出数据
            </div>
            <div style={{ fontSize: 11, color: "var(--weak)", marginTop: 2 }}>
              备份所有历史分析为 JSON 文件
            </div>
          </div>
          <Chevron />
        </button>

        <button
          className="card"
          style={{
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            textAlign: "left",
            border: "1px solid var(--line)",
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              display: "grid",
              placeItems: "center",
              background: "var(--sage)",
              color: "var(--forest)",
              flexShrink: 0,
            }}
          >
            {menuIcon.upload}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{ fontSize: 13, fontWeight: 600, color: "var(--forest)" }}
            >
              导入数据
            </div>
            <div style={{ fontSize: 11, color: "var(--weak)", marginTop: 2 }}>
              从备份文件恢复历史分析
            </div>
          </div>
          <Chevron />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleImport}
          style={{ display: "none" }}
        />

        {confirmClear ? (
          <Card style={{ padding: 14, border: "1px solid #e5c4b8" }}>
            <p
              style={{ fontSize: 12, color: "var(--forest)", marginBottom: 10 }}
            >
              确定要清空所有历史记录吗？此操作不可撤销。
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="button"
                style={{
                  flex: 1,
                  height: 44,
                  fontSize: 13,
                  background: "#c45a3a",
                  color: "#fff",
                }}
                onClick={handleClearHistory}
              >
                确认清空
              </button>
              <button
                className="button outline"
                style={{ flex: 1, height: 44, fontSize: 13 }}
                onClick={() => setConfirmClear(false)}
              >
                取消
              </button>
            </div>
          </Card>
        ) : (
          <button
            className="card"
            style={{
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              textAlign: "left",
              border: "1px solid var(--line)",
            }}
            onClick={() => setConfirmClear(true)}
          >
            <span
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                display: "grid",
                placeItems: "center",
                background: "#f5e0d8",
                color: "#c45a3a",
                flexShrink: 0,
              }}
            >
              {menuIcon.trash}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#c45a3a" }}>
                清空历史记录
              </div>
              <div style={{ fontSize: 11, color: "var(--weak)", marginTop: 2 }}>
                删除本机所有已保存的分析报告
              </div>
            </div>
            <Chevron />
          </button>
        )}
      </div>

      <div
        style={{
          fontSize: 11,
          color: "var(--weak)",
          fontWeight: 600,
          margin: "0 4px 8px",
        }}
      >
        偏好设置
      </div>
      <Card
        style={{
          padding: "14px 16px",
          marginBottom: 18,
          display: "flex",
          alignItems: "center",
          gap: 12,
          border: "1px solid var(--line)",
        }}
      >
        <span
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            display: "grid",
            placeItems: "center",
            background: "var(--sage)",
            color: "var(--forest)",
            flexShrink: 0,
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width={18}
            height={18}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3v2M12 19v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M3 12h2M19 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            <circle cx="12" cy="12" r="4" />
          </svg>
        </span>
        <div style={{ flex: 1 }}>
          <div
            style={{ fontSize: 13, fontWeight: 600, color: "var(--forest)" }}
          >
            自动保存分析结果
          </div>
          <div style={{ fontSize: 11, color: "var(--weak)", marginTop: 2 }}>
            分析完成后自动存入历史记录
          </div>
        </div>
        <button
          onClick={() => toggleAutoSave(!autoSave)}
          style={{
            width: 44,
            height: 24,
            borderRadius: 12,
            background: autoSave ? "var(--forest)" : "#d4d4d0",
            position: "relative",
            border: "none",
            cursor: "pointer",
            transition: "background 0.2s",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: 2,
              left: autoSave ? 22 : 2,
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: "#fff",
              transition: "left 0.2s",
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            }}
          />
        </button>
      </Card>

      <div
        style={{
          fontSize: 11,
          color: "var(--weak)",
          fontWeight: 600,
          margin: "0 4px 8px",
        }}
      >
        帮助与关于
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Card
          style={{
            padding: 0,
            border: "1px solid var(--line)",
            overflow: "hidden",
          }}
        >
          <button
            style={{
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              width: "100%",
              textAlign: "left",
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
            onClick={() => setExpanded(expanded === "help" ? null : "help")}
          >
            <span
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                display: "grid",
                placeItems: "center",
                background: "var(--sage)",
                color: "var(--forest)",
                flexShrink: 0,
              }}
            >
              {menuIcon.help}
            </span>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--forest)",
                }}
              >
                使用帮助
              </div>
            </div>
            <Chevron />
          </button>
          {expanded === "help" && (
            <div
              style={{
                padding: "0 16px 16px",
                fontSize: 12,
                color: "#60695b",
                lineHeight: 1.8,
              }}
            >
              1. 在首页输入你正在纠结的决定，或选择场景模板填写
              <br />
              2. AI 会整理你的选项和关注点，你可以调整补充
              <br />
              3. 按需回答补充问题，不确定的可以跳过
              <br />
              4. 生成决策分析报告，查看各方案的利弊和风险
              <br />
              5. 在“待确认”页补充信息，或修改标准后重新分析
            </div>
          )}
        </Card>

        <Card
          style={{
            padding: 0,
            border: "1px solid var(--line)",
            overflow: "hidden",
          }}
        >
          <button
            style={{
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              width: "100%",
              textAlign: "left",
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
            onClick={() =>
              setExpanded(expanded === "disclaimer" ? null : "disclaimer")
            }
          >
            <span
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                display: "grid",
                placeItems: "center",
                background: "var(--sage)",
                color: "var(--forest)",
                flexShrink: 0,
              }}
            >
              {menuIcon.shield}
            </span>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--forest)",
                }}
              >
                分析与隐私说明
              </div>
            </div>
            <Chevron />
          </button>
          {expanded === "disclaimer" && (
            <div
              style={{
                padding: "0 16px 16px",
                fontSize: 12,
                color: "#60695b",
                lineHeight: 1.8,
              }}
            >
              AI
              帮助整理信息、补充视角和理解可能影响，不替你作最终决定。用户陈述未经独立核实，AI
              推断不代表事实。分析直接连接 AI
              服务生成，提交的问题与确认信息会发送给模型服务。草稿和历史报告仅保存在本机浏览器，清理数据或更换设备后可能无法找回。
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
