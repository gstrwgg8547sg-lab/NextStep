import { expect, it } from "vitest";
import { readSseContent } from "../src/lib/ai-stream";
import { safeQuestionAnswers } from "../src/lib/question-quality";
function stream(text: string) {
 const bytes = new TextEncoder().encode(text);
 return new ReadableStream<Uint8Array>({ start(c) { for (const byte of bytes) c.enqueue(new Uint8Array([byte])); c.close(); } });
}
it("handles CRLF and split Chinese UTF-8 bytes, including final event without delimiter", async () => {
 const s = 'data: {"choices":[{"delta":{"content":"你好"}}]}\r\n\r\ndata: {"choices":[{"finish_reason":"stop"}]}';
 await expect(readSseContent(stream(s))).resolves.toBe("你好");
});
it("does not accept valid-looking JSON from a disconnected model", async () => {
 await expect(readSseContent(stream('data: {"choices":[{"delta":{"content":"{}"}}]}\n\n'))).rejects.toThrow("AI_STREAM_INTERRUPTED");
});
it("distinguishes token truncation from format failure", async () => {
 await expect(readSseContent(stream('data: {"choices":[{"finish_reason":"length"}]}\n\n'))).rejects.toThrow("AI_OUTPUT_TRUNCATED");
});
it("never silently discards malformed upstream events", async () => {
 await expect(readSseContent(stream('data: bad\n\n'))).rejects.toThrow("AI_INVALID_OUTPUT");
});
it.each(["导师指导频率和方式是怎样的？", "两份实习的时长和主要内容分别是什么？", "两所学校各自的费用是多少？"])("compound question uses open input: %s", q => {
 expect(safeQuestionAnswers(q, ["每周一次", "不确定"])).toEqual([]);
});
it("retains single dimension answers across domains", () => {
 for (const q of ["每月预算上限是多少？", "每周能留几天备考？", "最多愿意走多久？"])
  expect(safeQuestionAnswers(q, ["不确定", "不确定"])).toEqual(["不确定"]);
});

import { vi } from "vitest";
import { streamJson } from "../src/lib/stream-route";
it("closes stalled requests with one valid error envelope, ignoring late results", async () => {
 vi.useFakeTimers();
 try {
  let resolve!: (x: unknown) => void;
  const response = streamJson(new Promise(r => { resolve = r; }), {});
  const result = response.json();
  await vi.advanceTimersByTimeAsync(40001);
  expect(await result).toHaveProperty("error.code", "AI_TIMEOUT");
  resolve({ late: true });
  await Promise.resolve();
  expect(vi.getTimerCount()).toBe(0);
 } finally { vi.useRealTimers(); }
});
it("cancellation clears heartbeat and tolerates late model rejection", async () => {
 let reject!: (e: Error) => void;
 const response = streamJson(new Promise((_, r) => { reject = r; }), {});
 await response.body!.cancel();
 reject(new Error("AI_TIMEOUT"));
 await Promise.resolve();
});
