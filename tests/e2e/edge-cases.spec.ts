import { test, expect } from "@playwright/test";
test("incomplete edited draft survives reload and validation", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("使用示例体验").check();
  await page.getByRole("button", { name: "两份实习怎么选" }).click();
  await page.getByRole("button", { name: "开始分析", exact: true }).click();
  await expect(page).toHaveURL(/confirm$/);
  await page.getByRole("button", { name: "添加候选方案" }).click();
  await page.getByRole("button", { name: "下一步：目标与限制" }).click();
  await page.getByRole("button", { name: "下一步：补充问题" }).click();
  await page.getByRole("button", { name: "生成分析报告" }).click();
  await expect(page.locator("main [role=alert]")).toContainText(
    "请填写方案名称",
  );
  await page.waitForTimeout(300);
  await page.reload();
  await expect(page.getByLabel("方案 C 名称")).toHaveValue("");
  await page.getByLabel("方案 C 名称").fill("第三个方案");
  await page.getByRole("button", { name: "下一步：目标与限制" }).click();
  await page.getByRole("button", { name: "下一步：补充问题" }).click();
  await page.getByRole("button", { name: "生成分析报告" }).click();
  await expect(page).toHaveURL(/report/);
  await page.getByRole("link", { name: "方案详情" }).click();
  await expect(page.getByRole("tab", { name: "方案 C" })).toBeVisible();
});
test("corrupt storage produces recoverable error", async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem("nextstep:draft:v1", "invalid json"),
  );
  await page.goto("/");
  await expect(page.locator("main [role=alert]")).toContainText(
    "无法读取本地记录",
  );
  await expect(page.getByLabel("描述你的问题")).toBeEnabled();
});
