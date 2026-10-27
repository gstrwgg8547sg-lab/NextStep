import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { saveFeedback, readFeedback, deleteFeedback, feedbackKey } from "../src/lib/report-feedback";
const item = { reportId:"report-1", rating:"helpful" as const, reasons:[], comment:"有帮助", updatedAt:"2026-10-26T10:00:00.000Z" };
beforeEach(() => {
  const data = new Map<string,string>();
  vi.stubGlobal("localStorage", { getItem:(k:string) => data.get(k) ?? null, setItem:(k:string,v:string) => data.set(k,v) });
});
afterEach(() => vi.unstubAllGlobals());
it("revising feedback replaces one report entry and deletion preserves others", () => {
  saveFeedback(item); saveFeedback({...item,reportId:"report-2"});
  saveFeedback({...item,rating:"error",comment:"遗漏条件"});
  expect(readFeedback()).toHaveLength(2);
  expect(readFeedback()[0].rating).toBe("error");
  deleteFeedback(item.reportId);
  expect(readFeedback().map(x=>x.reportId)).toEqual(["report-2"]);
});
it("rejects corrupt feedback without silently overwriting it", () => {
  localStorage.setItem(feedbackKey,"not json");
  expect(() => saveFeedback(item)).toThrow();
  expect(localStorage.getItem(feedbackKey)).toBe("not json");
});
it("limits comments and does not store decision text in feedback", () => {
  expect(() => saveFeedback({...item,comment:"x".repeat(501)})).toThrow();
  expect(() => saveFeedback({...item,decision:"private"} as typeof item)).toThrow();
});
