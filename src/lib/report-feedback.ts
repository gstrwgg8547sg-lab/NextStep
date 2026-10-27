import { z } from "zod";
export const feedbackKey = "nextstep:feedback:v1";
export const FeedbackSchema = z
  .object({
    reportId: z.string().min(1).max(100),
    rating: z.enum(["helpful", "unhelpful", "error"]),
    reasons: z
      .array(
        z.enum(["missing", "repeated", "unsupported", "conflicting", "other"]),
      )
      .max(5),
    comment: z.string().max(500),
    updatedAt: z.string().datetime(),
  })
  .strict();
export type ReportFeedback = z.infer<typeof FeedbackSchema>;
export function readFeedback(): ReportFeedback[] {
  return z
    .array(FeedbackSchema)
    .max(200)
    .parse(JSON.parse(localStorage.getItem(feedbackKey) ?? "[]"));
}
export function saveFeedback(value: ReportFeedback) {
  const item = FeedbackSchema.parse(value);
  localStorage.setItem(
    feedbackKey,
    JSON.stringify(
      [
        item,
        ...readFeedback().filter((x) => x.reportId !== item.reportId),
      ].slice(0, 200),
    ),
  );
}
export function deleteFeedback(reportId: string) {
  localStorage.setItem(
    feedbackKey,
    JSON.stringify(readFeedback().filter((x) => x.reportId !== reportId)),
  );
}
export function downloadFeedback(value: ReportFeedback) {
  const blob = new Blob(
    [
      JSON.stringify(
        { version: 1, feedback: FeedbackSchema.parse(value) },
        null,
        2,
      ),
    ],
    { type: "application/json" },
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "nextstep-feedback.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
