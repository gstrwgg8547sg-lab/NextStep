// Streaming response helper to avoid Vercel function timeouts.
// Sends keepalive whitespace every 2s while the AI call runs,
// then flushes the final JSON payload.

type ErrorMap = Record<string, { message: string; status: number }>;

function mapError(msg: string, map: ErrorMap) {
  if (map[msg]) return { code: msg, message: map[msg].message, status: map[msg].status };
  if (msg.includes("AI_HTTP_429"))
    return { code: "AI_RATE_LIMITED", message: "AI 服务暂时繁忙，请稍后重试。", status: 429 };
  if (msg.includes("AI_HTTP_401"))
    return { code: "AI_AUTH_ERROR", message: "模型密钥无效，请检查配置。", status: 502 };
  if (msg.startsWith("AI_HTTP_"))
    return { code: "AI_UPSTREAM_ERROR", message: `模型服务暂时异常（${msg}），请稍后重试。`, status: 502 };
  return { code: "INTERNAL", message: "服务暂时不可用，请稍后重试。", status: 500 };
}

export function streamJson(
  work: Promise<unknown>,
  errorMap: ErrorMap,
): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const keepalive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(" "));
        } catch {
          // stream may already be closed
        }
      }, 2000);

      try {
        const data = await work;
        controller.enqueue(encoder.encode(JSON.stringify({ data })));
      } catch (e) {
        const msg = e instanceof Error ? e.message : "UNKNOWN";
        const err = mapError(msg, errorMap);
        controller.enqueue(
          encoder.encode(JSON.stringify({ error: { code: err.code, message: err.message } })),
        );
      } finally {
        clearInterval(keepalive);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
