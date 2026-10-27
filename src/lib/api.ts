import {
  AnalyzeInputSchema,
  ParseResultSchema,
  RawInputSchema,
  validateReportForDecision,
  type Decision,
} from "./schema";

export const configured = true;

async function invoke(name: string, body: unknown) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 100000);
  try {
    const response = await fetch(`/api/${name}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    let json;
    try {
      json = await response.json();
    } catch {
      const ct = response.headers.get("content-type") ?? "";
      if (ct.includes("text/html"))
        throw new Error("服务正在部署或暂时不可用，请稍后重试。");
      throw new Error("服务返回格式异常，请检查配置并重试。");
    }
    if (json?.error)
      throw new Error(
        typeof json.error.message === "string"
          ? json.error.message
          : "AI 服务请求失败，请检查配置后重试。",
      );
    return json.data;
  } catch (e) {
    if (controller.signal.aborted)
      throw new Error("响应超时，请重试；你的输入已保留。");
    if (e instanceof TypeError)
      throw new Error("无法连接 AI 服务，请检查网络后重试。");
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}
export async function parseDecision(text: string) {
  const data = await invoke("parse-decision", RawInputSchema.parse({ text }));
  const result = ParseResultSchema.safeParse(data);
  if (!result.success) throw new Error("AI 提取结果未通过格式校验，请重试。");
  return result.data;
}
export async function analyzeDecision(decision: Decision) {
  const data = await invoke(
    "analyze-decision",
    AnalyzeInputSchema.parse({ decision }),
  );
  try {
    return validateReportForDecision(data, decision);
  } catch {
    throw new Error("AI 报告未通过格式或方案一致性校验，请重试。");
  }
}
