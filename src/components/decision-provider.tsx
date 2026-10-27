"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  type ReactNode,
} from "react";
import { emptyDraft, loadLocal, writeDraft, writeHistory } from "@/lib/storage";
import {
  DecisionSchema,
  RawInputSchema,
  type Decision,
  type Draft,
  type SavedReport,
} from "@/lib/schema";
import { invalidateStaleSuggestions } from "@/lib/decision-suggestions";
import { describeRevision } from "@/lib/revision";
import { parseDecision, analyzeDecision } from "@/lib/api";
function useDecisionStore() {
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [history, setHistory] = useState<SavedReport[]>([]);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState<"parse" | "analyze" | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [storageWarning, setStorageWarning] = useState("");
  const lock = useRef(false);
  const draftRef = useRef(draft);
  draftRef.current = draft;
  useEffect(() => {
    const flush = () => {
      try {
        writeDraft(draftRef.current);
      } catch {
        /* existing save warning covers unavailable storage */
      }
    };
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  }, []);
  useEffect(() => {
    const saved = loadLocal();
    setDraft({ ...saved.draft, mode: "live" });
    setHistory(saved.history);
    setStorageWarning(saved.warning);
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => {
      try {
        writeDraft(draft);
      } catch {
        setStorageWarning(
          "本地保存失败：存储空间不足或被浏览器禁用。当前内容仅保留在本次打开的页面中。",
        );
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [draft, ready]);
  function updateDecision(decision: Decision) {
    setDraft((d) => {
      return {
        ...d,
        decision: invalidateStaleSuggestions(d.decision, decision),
      };
    });
    setError("");
  }
  async function run(action: "parse" | "analyze") {
    if (lock.current) return false;
    lock.current = true;
    setBusy(action);
    setError("");
    setNotice("");
    try {
      if (action === "parse") {
        const parsed = RawInputSchema.safeParse({ text: draft.raw });
        if (!parsed.success) throw new Error(parsed.error.issues[0].message);
        const result = await parseDecision(parsed.data.text);
        if (result.status === "needs_clarification")
          throw new Error(result.message);
        setDraft((d) => ({
          ...d,
          mode: "live",
          decision: result.decision,
          current: null,
        }));
      } else {
        const valid = DecisionSchema.safeParse(draft.decision);
        if (!valid.success) throw new Error(valid.error.issues[0].message);
        // An unchanged decision already has a validated real report in this browser.
        if (
          draft.current?.mode === "live" &&
          "version" in draft.current.report &&
          draft.current.report.exchange &&
          JSON.stringify(draft.current.decision) === JSON.stringify(valid.data)
        ) {
          setNotice("条件未改变，已打开现有分析报告。");
          return true;
        }
        if (!valid.data.criteria?.length)
          throw new Error("请返回决策标准页，添加至少一个比较标准。");
        const report = await analyzeDecision(valid.data);
        const current: SavedReport = {
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          mode: "live",
          raw: draft.raw,
          decision: structuredClone(valid.data),
          report,
          revision: describeRevision(draft.current, valid.data),
        };
        setDraft((d) => ({ ...d, mode: "live", current }));
      }
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "请求失败，请重试。");
      return false;
    } finally {
      setBusy(null);
      lock.current = false;
    }
  }
  function saveReport(): boolean {
    if (!draft.current) return false;
    const next = [
      draft.current,
      ...history.filter((h) => h.id !== draft.current!.id),
    ].slice(0, 30);
    try {
      writeHistory(next);
      setHistory(next);
      setNotice("已保存到当前浏览器的历史分析。");
      return true;
    } catch {
      setStorageWarning("保存失败：浏览器存储不可用或空间不足。");
      return false;
    }
  }
  function removeReport(id: string) {
    const next = history.filter((h) => h.id !== id);
    try {
      writeHistory(next);
      setHistory(next);
      setNotice("已移除这份历史报告。");
    } catch {
      setStorageWarning("删除失败：无法写入浏览器存储。");
    }
  }
  function openReport(item: SavedReport) {
    setDraft({
      raw: item.raw,
      mode: "live",
      decision: structuredClone(item.decision),
      current: item,
    });
    setError("");
    setNotice("");
  }
  return {
    draft,
    setDraft,
    history,
    ready,
    busy,
    error,
    setError,
    notice,
    setNotice,
    storageWarning,
    updateDecision,
    run,
    saveReport,
    removeReport,
    openReport,
  };
}
const Context = createContext<ReturnType<typeof useDecisionStore> | null>(null);
export function DecisionProvider({ children }: { children: ReactNode }) {
  const value = useDecisionStore();
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useDecision() {
  const c = useContext(Context);
  if (!c) throw new Error("DecisionProvider is missing");
  return c;
}
