"use client";
import { useEffect, useState } from "react";
import {
  readFeedback,
  saveFeedback,
  deleteFeedback,
  downloadFeedback,
  type ReportFeedback as Feedback,
} from "@/lib/report-feedback";
const ratings = {
  helpful: "有帮助",
  unhelpful: "帮助不大",
  error: "存在错误",
} as const;
const reasons = {
  missing: "遗漏关键条件",
  repeated: "重复已知信息",
  unsupported: "推断缺少依据",
  conflicting: "前后矛盾",
  other: "其他",
} as const;
export function ReportFeedback({ reportId }: { reportId: string }) {
  const [rating, setRating] = useState<Feedback["rating"] | null>(null);
  const [selected, setSelected] = useState<Feedback["reasons"]>([]);
  const [comment, setComment] = useState("");
  const [saved, setSaved] = useState<Feedback | null>(null);
  const [notice, setNotice] = useState("");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const item = readFeedback().find((x) => x.reportId === reportId);
      if (item) {
        setRating(item.rating);
        setSelected(item.reasons);
        setComment(item.comment);
        setSaved(item);
      }
    } catch {
      setNotice("无法读取本机反馈，请检查浏览器存储。");
    }
    setReady(true);
  }, [reportId]);
  function save() {
    if (!rating) return;
    try {
      const item = {
        reportId,
        rating,
        reasons: selected,
        comment: comment.trim(),
        updatedAt: new Date().toISOString(),
      };
      saveFeedback(item);
      setSaved(item);
      setNotice("反馈已保存在本机，未发送给开发者。");
    } catch {
      setNotice("保存失败：浏览器存储不可用或数据损坏，请保留你的文字。");
    }
  }
  return (
    <section className="card plain-card report-feedback" aria-label="报告反馈">
      <h2 className="section-title">这份分析有没有帮助你看清取舍？</h2>
      <div className="chips" role="group" aria-label="帮助程度">
        {Object.entries(ratings).map(([key, label]) => (
          <button
            key={key}
            disabled={!ready}
            aria-pressed={rating === key}
            onClick={() => {
              setRating(key as Feedback["rating"]);
              setNotice("");
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {rating && (
        <>
          <fieldset>
            <legend>原因（选填，可多选）</legend>
            <div className="chips">
              {Object.entries(reasons).map(([key, label]) => (
                <button
                  key={key}
                  aria-pressed={selected.includes(
                    key as Feedback["reasons"][number],
                  )}
                  onClick={() =>
                    setSelected((xs) =>
                      xs.includes(key as Feedback["reasons"][number])
                        ? xs.filter((x) => x !== key)
                        : [...xs, key as Feedback["reasons"][number]],
                    )
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
          <label htmlFor="feedback-comment">有什么发现或建议？（选填）</label>
          <textarea
            id="feedback-comment"
            className="textarea"
            maxLength={500}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="例如：哪条依据有误，或哪项取舍帮到了你。请勿填写敏感信息。"
          />
          <button className="button outline" onClick={save}>
            {saved ? "更新本机反馈" : "保存本机反馈"}
          </button>
        </>
      )}
      {saved && (
        <div className="feedback-actions">
          <button
            className="text-button"
            onClick={() => downloadFeedback(saved)}
          >
            导出已保存反馈
          </button>
          <button
            className="text-button"
            onClick={() => {
              try {
                deleteFeedback(reportId);
                setSaved(null);
                setRating(null);
                setSelected([]);
                setComment("");
                setNotice("这条反馈已删除。");
              } catch {
                setNotice("删除失败，请重试。");
              }
            }}
          >
            删除这条反馈
          </button>
        </div>
      )}
      {notice && <p role="status">{notice}</p>}
      <p className="report-footnote">
        仅保存在当前浏览器，不会自动上传。导出只包含这条反馈与报告编号，不包含决策正文；如需参与测试，可自行将文件交给研究者。
      </p>
    </section>
  );
}
