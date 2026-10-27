import { runAnalyze } from "../../../lib/ai-engine";
import { streamJson } from "../../../lib/stream-route";

export const runtime = "edge";

const ERROR_MAP = {
  AI_STREAM_INTERRUPTED: { message: "模型响应中断，请重试；你的输入已保留。", status: 502 },
  AI_NOT_CONFIGURED: { message: "尚未配置 AI 服务", status: 503 },
  AI_TIMEOUT: { message: "AI 响应超时，请重试。", status: 504 },
  AI_OUTPUT_TRUNCATED: { message: "模型输出达到长度限制，请重试。", status: 502 },
  AI_INVALID_OUTPUT: { message: "AI 返回的数据未通过校验，请重试。", status: 502 },
  AI_NETWORK_ERROR: { message: "暂时无法连接 AI 服务，请重试。", status: 502 },
};

export async function POST(req: Request) {
  let body;
  try { body = await req.json(); } catch {
    return Response.json({ error: { code: "INVALID_INPUT", message: "请求内容无效，请重新提交。" } }, { status: 400 });
  }
  return streamJson(runAnalyze(body?.decision), ERROR_MAP);
}
