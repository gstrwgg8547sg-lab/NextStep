import {
  DraftSchema,
  SavedReportSchema,
  type Draft,
  type SavedReport,
} from "./schema";
const DRAFT = "nextstep:draft:v1",
  HISTORY = "nextstep:history:v1";
export const emptyDraft: Draft = {
  raw: "",
  mode: "live",
  decision: null,
  current: null,
};
export function loadLocal() {
  let warning = "";
  let draft = emptyDraft;
  let history: SavedReport[] = [];
  try {
    const d = localStorage.getItem(DRAFT);
    const h = localStorage.getItem(HISTORY);
    if (d) {
      const parsed = DraftSchema.safeParse(JSON.parse(d));
      if (parsed.success) draft = parsed.data;
      else {
        warning = "本地草稿格式已更新，可重新输入。";
        try { localStorage.removeItem(DRAFT); } catch { /* ignore */ }
      }
    }
    if (h) {
      let raw: unknown;
      try { raw = JSON.parse(h); } catch { raw = null; }
      if (Array.isArray(raw)) {
        const valid: SavedReport[] = [];
        for (const item of raw) {
          const parsed = SavedReportSchema.safeParse(item);
          if (parsed.success) valid.push(parsed.data);
        }
        history = valid;
        if (valid.length !== raw.length) {
          warning = valid.length > 0
            ? `已清理 ${raw.length - valid.length} 条旧记录，保留了 ${valid.length} 条。`
            : "";
          try { localStorage.setItem(HISTORY, JSON.stringify(valid)); } catch { /* ignore */ }
        }
      } else {
        try { localStorage.removeItem(HISTORY); } catch { /* ignore */ }
      }
    }
  } catch {
    warning = "无法读取本地记录。浏览器可能禁用了存储或记录已损坏。";
  }
  return { draft, history, warning };
}
export function writeDraft(draft: Draft) {
  localStorage.setItem(DRAFT, JSON.stringify(draft));
}
export function writeHistory(history: SavedReport[]) {
  localStorage.setItem(HISTORY, JSON.stringify(history));
}
