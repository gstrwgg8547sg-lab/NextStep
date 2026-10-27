import { runParse } from "../../../lib/ai-engine";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    const data = await runParse(text);
    return Response.json({ data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "UNKNOWN";
    const map: Record<string, { message: string; status: number }> = {
      AI_NOT_CONFIGURED: { message: "尚未配置 AI 服务", status: 503 },
      AI_TIMEOUT: { message: "AI 请求超时，请重试。", status: 504 },
      AI_OUTPUT_TRUNCATED: {
        message: "模型输出达到长度限制，请重试。",
        status: 502,
      },
      AI_INVALID_OUTPUT: {
        message: "AI 返回的数据未通过校验，请重试。",
        status: 502,
      },
      AI_NETWORK_ERROR: {
        message: "暂时无法连接 AI 服务，请重试。",
        status: 502,
      },
    };
    const hit = map[msg];
    if (hit)
      return Response.json(
        { error: { code: msg, message: hit.message } },
        { status: hit.status },
      );
    if (msg.includes("AI_HTTP_429"))
      return Response.json(
        {
          error: {
            code: "AI_RATE_LIMITED",
            message: "模型平台调用受限，请稍后重试。",
          },
        },
        { status: 429 },
      );
    if (msg.includes("AI_HTTP_401"))
      return Response.json(
        {
          error: { code: "AI_AUTH_ERROR", message: "模型密钥无效，请检查配置。" },
        },
        { status: 502 },
      );
    if (msg.startsWith("AI_HTTP_"))
      return Response.json(
        {
          error: {
            code: "AI_UPSTREAM_ERROR",
            message: `模型服务暂时异常（${msg}），请稍后重试。`,
          },
        },
        { status: 502 },
      );
    return Response.json(
      { error: { code: "INTERNAL", message: "服务暂时不可用，请稍后重试。" } },
      { status: 500 },
    );
  }
}
