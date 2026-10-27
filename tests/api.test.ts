import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { demoParse, demoAnalyze, examples } from "../src/lib/demo";
beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.example.test");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "public-test-key");
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});
it("client preserves service failure and allows a new retry", async () => {
  const mock = vi
    .fn()
    .mockResolvedValueOnce(
      Response.json(
        { error: { message: "AI 服务暂时不可用，请稍后重试。" } },
        { status: 502 },
      ),
    )
    .mockResolvedValueOnce(
      Response.json({
        data: { status: "ready", decision: demoParse(examples.offer) },
      }),
    );
  vi.stubGlobal("fetch", mock);
  const { parseDecision } = await import("../src/lib/api");
  await expect(parseDecision(examples.offer)).rejects.toThrow(
    "AI 服务暂时不可用",
  );
  await expect(parseDecision(examples.offer)).resolves.toHaveProperty(
    "status",
    "ready",
  );
  expect(mock).toHaveBeenCalledTimes(2);
  expect(mock.mock.calls[0][1].headers).not.toHaveProperty("Authorization");
});
it("client rejects malformed payload without showing a fake report", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json({ data: { bad: true } })),
  );
  const { analyzeDecision } = await import("../src/lib/api");
  await expect(analyzeDecision(demoParse(examples.offer))).rejects.toThrow(
    "未通过格式",
  );
});
it("client rejects wrong candidate IDs even in otherwise valid report", async () => {
  const d = demoParse(examples.offer);
  const report = demoAnalyze(d);
  report.options[0].optionId = "not-a-candidate";
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json({ data: report })),
  );
  const { analyzeDecision } = await import("../src/lib/api");
  await expect(analyzeDecision(d)).rejects.toThrow("方案一致性");
});
it("client displays rate limit guidance", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json(
        { error: { message: "调用较频繁，请在 60 秒后重试。" } },
        { status: 429 },
      ),
    ),
  );
  const { parseDecision } = await import("../src/lib/api");
  await expect(parseDecision(examples.offer)).rejects.toThrow("60 秒");
});
it("client times out with recoverable message", async () => {
  vi.useFakeTimers();
  vi.stubGlobal(
    "fetch",
    vi.fn(
      (_url, init) =>
        new Promise((_, reject) =>
          init.signal.addEventListener("abort", () =>
            reject(new Error("abort")),
          ),
        ),
    ),
  );
  const { parseDecision } = await import("../src/lib/api");
  const assertion = expect(parseDecision(examples.offer)).rejects.toThrow(
    "请求超时",
  );
  await vi.advanceTimersByTimeAsync(120001);
  await assertion;
});
