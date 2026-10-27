/** Decode complete SSE messages across arbitrary UTF-8/network boundaries. */
export async function readSseContent(body: ReadableStream<Uint8Array> | null) {
  if (!body) throw new Error("AI_INVALID_OUTPUT");
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "", content = "", finished = false;
  const event = (text: string) => {
    const data = text.split(/\r?\n/).filter(l => l.startsWith("data:"))
      .map(l => l.slice(5).trimStart()).join("\n").trim();
    if (!data || data === "[DONE]") return;
    let value;
    try { value = JSON.parse(data); } catch { throw new Error("AI_INVALID_OUTPUT"); }
    if (value.error) throw new Error("AI_NETWORK_ERROR");
    const choice = value.choices?.[0];
    if (typeof choice?.delta?.content === "string") content += choice.delta.content;
    if (content.length > 100000) throw new Error("AI_OUTPUT_TRUNCATED");
    if (choice?.finish_reason === "length") throw new Error("AI_OUTPUT_TRUNCATED");
    if (choice?.finish_reason === "stop") finished = true;
  };
  try {
    while (true) {
      const { done, value } = await reader.read();
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
      let boundary;
      while ((boundary = /\r?\n\r?\n/.exec(buffer))) {
        event(buffer.slice(0, boundary.index));
        buffer = buffer.slice(boundary.index + boundary[0].length);
      }
      if (done) { if (buffer.trim()) event(buffer); break; }
    }
    if (!finished) throw new Error("AI_STREAM_INTERRUPTED");
    if (!content) throw new Error("AI_INVALID_OUTPUT");
    return content;
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
