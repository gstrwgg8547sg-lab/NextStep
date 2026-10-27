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

export function streamJson(work: Promise<unknown>, errorMap: ErrorMap): Response {
  const encoder = new TextEncoder();
  let closed = false;
  let keepalive: ReturnType<typeof setInterval>;
  let deadline: ReturnType<typeof setTimeout>;
  const cleanup = () => { clearInterval(keepalive); clearTimeout(deadline); };
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const finish = (payload: unknown) => {
        if (closed) return;
        closed = true;
        cleanup();
        controller.enqueue(encoder.encode(JSON.stringify(payload)));
        controller.close();
      };
      // Send the first byte immediately. Heartbeats do not imply analysis progress.
      controller.enqueue(encoder.encode(" "));
      keepalive = setInterval(() => {
        if (!closed) controller.enqueue(encoder.encode(" "));
      }, 2000);
      deadline = setTimeout(() => finish({ error: {
        code: "AI_TIMEOUT", message: "AI 响应超时，请重试；你的输入已保留。",
      } }), 40000);
      void work.then(data => finish({ data }), e => {
        const err = mapError(e instanceof Error ? e.message : "UNKNOWN", errorMap);
        finish({ error: { code: err.code, message: err.message } });
      });
    },
    cancel() { closed = true; cleanup(); },
  });
  return new Response(stream, { headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store, no-transform",
    "X-Accel-Buffering": "no",
  } });
}
