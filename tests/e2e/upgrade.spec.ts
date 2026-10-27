import { test, expect } from "@playwright/test";
import type { Decision, ModernReport } from "../../src/lib/schema";
const initial: Decision = {
  title: "比较两份实习",
  domain: "career",
  depth: "standard",
  options: ["A", "B"].map((id) => ({
    id,
    name: `实习 ${id}`,
    facts: "每周三天",
    judgments: "",
    unknowns: "导师情况",
  })),
  criteria: [
    { id: "time", name: "学习时间", priority: "must", requirement: "每周两天" },
    { id: "growth", name: "经验积累", priority: "consider", requirement: "" },
  ],
  preferences: "准备考试",
  constraints: "",
  questions: [],
  factorPreferences: [],
};
function result(d: Decision): ModernReport {
  return {
    version: 2,
    exchange:{gain:"保留学习时间",cost:"放弃另一团队的机会",why:"备考是当前优先目标"},
    summary: "主要权衡学习时间与经验",
    conclusion: "当前倾向实习 A，实际工时需与约定一致。",
    recommendedOptionId: "A",
    reasons: [
      {
        title: "学习时间可安排",
        explanation: "每周保留两天",
        basis: "每周三天",
        source: "user_fact",
        criterionIds: [d.criteria![0].id],
      },
    ],
    prerequisites: ["工时与约定一致"],
    switchConditions: ["另一方案提供更合适的指导"],
    comparisons: d.criteria!.map((c) => ({
      criterionId: c.id,
      assessments: d.options.map((o) => ({
        optionId: o.id,
        assessment: "符合当前要求",
        basis: "每周三天",
        source: "user_fact",
        status: "met",
      })),
    })),
    tradeoffs: d.options.map((o) => ({
      optionId: o.id,
      risk: "实际工时可能变化",
      opportunityCost: "放弃另一团队体验",
      basis: "用户提供的方案",
      impacts:
        d.depth === "quick"
          ? []
          : [
              {
                horizon: "medium",
                effect: "可能积累经验",
                condition: "实际参与项目",
              },
            ],
    })),
    unknowns: [
      {
        criterionId:"growth",optionIds:["A","B"],
        question: "导师每周可以指导多久？",
        why: "影响经验积累",
        dimension: "指导支持",
        verifyWith: "向导师确认安排",
      },
    ],
    omittedFactors: [{ name: "通勤负担", why: "可能影响学习时间" }],
  };
}
test("criteria, comparison, verification, revision and local save work end to end", async ({
  page,
}, info) => {
  let requests = 0;
  await page.route("**/api/parse-decision", async (route) => {
    await new Promise((r) => setTimeout(r, 350));
    await route.fulfill({
      json: { data: { status: "ready", decision: initial } },
    });
  });
  await page.route("**/api/analyze-decision", async (route) => {
    requests++;
    const d = route.request().postDataJSON().decision;
    await new Promise((r) => setTimeout(r, 450));
    await route.fulfill({ json: { data: result(d) } });
  });
  await page.goto("/");
  await page
    .locator("textarea")
    .first()
    .fill("我有两份实习，需要同时准备考试，请帮我比较。");
  await page.getByRole("button", { name: "帮我梳理", exact: false }).click();
  await expect(page.getByLabel("分析进度")).toBeVisible();
  await expect(page).toHaveURL(/\/confirm$/);
  await expect(page.locator("select option")).toHaveText([
    "工作",
    "学习",
    "生活",
    "其他",
  ]);
  await page.getByRole("button", { name: /下一步/ }).click();
  await expect(page).toHaveURL(/\/confirm\/focus/);
  await page.getByLabel("新决策标准").fill("通勤时间");
  await page.getByRole("button", { name: "添加", exact: true }).click();
  await expect(page.getByLabel("标准 3 名称")).toHaveValue("通勤时间");
  await page.getByLabel("删除标准 通勤时间").click();
  await page
    .getByRole("group", { name: "经验积累重要程度" })
    .getByRole("button", { name: "优先考虑" })
    .click();
  await page.getByRole("button", { name: "简明分析", exact: true }).click();
  const start = Date.now();
  await page.getByRole("button", { name: "生成分析报告", exact: true }).click();
  await expect(page.getByLabel("分析进度")).toBeVisible();
  expect(Date.now() - start).toBeLessThan(1000);
  await expect(page).toHaveURL(/\/report$/);
  await expect(
    page.getByRole("heading", { name: "实习 A", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("heading",{name:"这次选择，真正的取舍"})).toBeVisible();
  await expect(page.getByRole("heading",{name:"哪些方案目前可行？"})).toBeVisible();
  await page.screenshot({path:info.outputPath("report-hierarchy.png"),fullPage:false});
  const feedback = page.getByLabel("报告反馈");
  await feedback.getByRole("button", {name:"存在错误",exact:true}).click();
  await feedback.getByRole("button", {name:"推断缺少依据",exact:true}).click();
  await feedback.getByLabel("有什么发现或建议？（选填）").fill("测试反馈：请说明依据");
  await feedback.getByRole("button", {name:"保存本机反馈",exact:true}).click();
  await expect(feedback).toContainText("未发送给开发者");
  expect(requests).toBe(1);
  await page.reload();
  await expect(page.getByLabel("报告反馈").getByRole("button",{name:"存在错误",exact:true})).toHaveAttribute("aria-pressed","true");
  const download = page.waitForEvent("download");
  await page.getByRole("button", {name:"导出已保存反馈"}).click();
  expect((await download).suggestedFilename()).toBe("nextstep-feedback.json");
  await page.getByRole("button", {name:"删除这条反馈"}).click();
  await expect(page.getByLabel("报告反馈")).toContainText("这条反馈已删除");
  await page.getByRole("link", { name: "方案对比", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "学习时间", exact: true }),
  ).toBeVisible();
  expect(await page.locator(".comparison-card .comparison-cell").count()).toBe(4);
  await page.screenshot({
    path: info.outputPath("comparison.png"),
    fullPage: true,
  });
  await page.getByRole("link", { name: "待核实", exact: true }).click();
  await page
    .getByLabel("核实结果：导师每周可以指导多久？")
    .fill("导师确认每周一小时");
  await page.getByRole("button", { name: "根据新信息更新报告" }).click();
  await expect(page).toHaveURL(/\/report$/);
  await expect(
    page.getByRole("heading", { name: "本次倾向未改变" }),
  ).toBeVisible();
  await expect(page.locator(".revision-card")).toContainText("核实结果");
  expect(requests).toBe(2);
  await page.getByRole("button", { name: "保存", exact: true }).click();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "实习 A", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("nextstep:history:v1") ?? "[]").length,
    ),
  ).toBe(2);
});
test("service failure preserves confirmed information and permits retry", async ({
  page,
}) => {
  await page.addInitScript(
    (d) =>
      localStorage.setItem(
        "nextstep:draft:v1",
        JSON.stringify({
          raw: "两份实习如何选择",
          mode: "live",
          decision: d,
          current: null,
        }),
      ),
    initial,
  );
  let attempt = 0;
  await page.route("**/api/analyze-decision", async (route) => {
    attempt++;
    await route.fulfill(
      attempt === 1
        ? { status: 504, json: { error: { message: "AI 请求超时，请重试。" } } }
        : { json: { data: result(initial) } },
    );
  });
  await page.goto("/confirm/focus");
  await page.getByRole("button", { name: "生成分析报告", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "AI 请求超时，请重试。" }),
  ).toBeVisible();
  await expect(page.getByLabel("标准 1 名称")).toHaveValue("学习时间");
  await page.getByRole("button", { name: "生成分析报告", exact: true }).click();
  await expect(page).toHaveURL(/\/report$/);
});

test("home has one optional guide and loading does not pretend steps are completed", async ({page}, info) => {
  await page.route("**/api/parse-decision", async route => {
    await new Promise(r => setTimeout(r, 1800));
    await route.fulfill({json:{data:{status:"ready",decision:initial}}});
  });
  await page.goto("/");
  await expect(page.locator(".splash-overlay")).toHaveCount(0);
  await expect(page.locator(".example-chips")).toHaveCount(0);
  await page.getByRole("button",{name:"实习 / 工作",exact:true}).click();
  await expect(page.getByLabel("描述你的问题")).toHaveValue(/不能妥协/);
  await expect(page.locator(".submission-note")).toContainText("发送给 AI 模型服务");
  await page.screenshot({path:info.outputPath("home.png"),fullPage:true});
  await page.getByRole("button",{name:"帮我梳理",exact:true}).click();
  await expect(page.getByLabel("分析进度")).toBeVisible();
  await expect(page.getByLabel("分析进度")).toContainText("等待 AI 服务返回结果");
  await expect(page.locator(".feedback-stage")).toHaveCount(0);
  await expect(page).toHaveURL(/\/confirm$/);
});
