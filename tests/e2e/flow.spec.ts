import { test, expect } from "@playwright/test";
test("empty input, no service, and clearly labeled demo", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "开始分析", exact: true }).click();
  await expect(page.locator("main [role=alert]")).toContainText("至少 10 字");
  await page.getByRole("button", { name: "两份实习怎么选" }).click();
  await page.getByRole("button", { name: "开始分析", exact: true }).click();
  await expect(page.locator("main [role=alert]")).toContainText(
    "尚未配置 AI 服务",
  );
  await page.getByRole("button", { name: "重试分析", exact: true }).click();
  await expect(page.locator("main [role=alert]")).toContainText(
    "尚未配置 AI 服务",
  );
  await page.getByLabel("使用示例体验").check();
  await page.getByLabel("描述你的问题").fill("我真的不知道应该怎么办才好了");
  await page.getByRole("button", { name: "开始分析", exact: true }).click();
  await expect(page.locator("main [role=alert]")).toContainText(
    "示例体验仅支持",
  );
});
for (const scenario of [
  { button: "两份实习怎么选", title: "比较两份实习 Offer" },
  { button: "研究方向如何选择", title: "选择研究方向" },
])
  test(`${scenario.title} full demo lifecycle`, async ({ page }, testInfo) => {
    await page.goto("/");
    await page.getByLabel("使用示例体验").check();
    await page.getByRole("button", { name: scenario.button }).click();
    await page.getByRole("button", { name: "开始分析", exact: true }).click();
    await expect(page).toHaveURL(/confirm$/);
    await expect(page.getByLabel("决策主题")).toHaveValue(scenario.title);
    await page.getByRole("button", { name: "添加候选方案" }).click();
    await page.getByLabel("方案 C 名称").fill("备选方案");
    await page.getByRole("button", { name: "删除方案 C" }).click();
    await page.getByLabel("方案 A 名称").fill("我的方案 A");
    await page.getByRole("button", { name: "下一步：目标与限制" }).click();
    await expect(page).toHaveURL(/confirm\/focus/);
    await page.getByLabel("必须满足的条件").fill("每周需要保留两天学习时间");
    await page.getByRole("button", { name: "下一步：补充问题" }).click();
    await expect(page).toHaveURL(/confirm\/questions/);
    await page.getByRole("button", { name: "跳过此问题" }).first().click();
    await page.getByRole("button", { name: "生成分析报告" }).click();
    await expect(page).toHaveURL(/report$/);
    await expect(
      page.getByText("示例体验 · 用于熟悉操作流程"),
    ).toBeVisible();
    await page.getByRole("link", { name: "方案详情" }).click();
    await expect(page).toHaveURL(/report\/options/);
    await page.getByRole("tab", { name: "方案 B" }).click();
    await expect(page.getByRole("tab", { name: "方案 B" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await page.getByRole("link", { name: "还有哪些未知？" }).click();
    await expect(page).toHaveURL(/report\/factors/);
    await page.getByRole("button", { name: "已保留" }).first().click();
    await page.getByLabel("添加自定义关注因素").fill("通勤时间");
    await page.getByRole("button", { name: "添加因素", exact: true }).click();
    await page.getByRole("button", { name: "重新分析", exact: true }).click();
    await expect(
      page.getByText("条件或关注因素已修改。", { exact: false }),
    ).toHaveCount(0);
    await page.goto("/report");
    await page.getByRole("button", { name: "保存到本地" }).click();
    await expect(page.getByText("已保存到本机")).toBeVisible();
    await page.getByRole("link", { name: "修改信息", exact: true }).click();
    await page.getByLabel("必须满足的条件").fill("每周需要保留三天学习时间");
    await page.getByRole("button", { name: "下一步：补充问题" }).click();
    await page.getByRole("button", { name: "生成分析报告" }).click();
    await expect(page.locator(".summary")).toContainText("三天");
    await page.getByRole("button", { name: "保存到本地" }).click();
    await page.reload();
    await expect(page.locator(".summary")).toContainText("三天");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath("report.png"),
      fullPage: true,
    });
    await page.getByRole("link", { name: "NextStep 首页" }).click();
    await page.getByRole("button", { name: "最近分析", exact: true }).click();
    await expect(page.getByRole("button", { name: "打开报告" })).toHaveCount(2);
    await page.getByRole("button", { name: "打开报告" }).last().click();
    await expect(page.locator(".summary")).toContainText("两天");
  });
test("mobile layout, draft recovery and direct-route guard", async ({
  page,
}, testInfo) => {
  await page.goto("/confirm");
  await expect(page.getByText("还没有待确认的信息")).toBeVisible();
  await page.getByRole("link", { name: "返回首页", exact: true }).click();
  await page
    .getByLabel("描述你的问题")
    .fill("我正在两个研究方向之间犹豫，希望先了解实际条件。");
  await page.waitForTimeout(300);
  await page.reload();
  await expect(page.getByLabel("描述你的问题")).toHaveValue(
    "我正在两个研究方向之间犹豫，希望先了解实际条件。",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("home.png"),
    fullPage: true,
  });
});
