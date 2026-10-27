/** Conservative fallback: compound questions stay open-ended, never offer partial answers. */
export function safeQuestionAnswers(question: string, answers?: string[]) {
  if (/分别|各自|以及|及其|和.{1,10}(分别|是怎样|是什么|如何)|频率[和、及]方式|时长[和、及]内容/.test(question)) return [];
  return [...new Set(answers ?? [])].filter(a => a.trim() && a.length <= 40);
}
