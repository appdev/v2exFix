# 测试记录

- 日期：2026-05-16
- 执行者：Codex
- 任务：主题与节点屏蔽实现验证

## 静态验证

- `npx prettier --write ...`：通过。格式化本次新增和修改的代码、文档。
- `npx tsc --noEmit`：通过。
- `git diff --check`：通过。

## 浏览器 QA

测试目标：`http://localhost:19006`

验证结果：

- 设置页可以打开“主题屏蔽”页面。
- 标题关键字区展示现有关键字 chip。
- 输入临时关键字 `QA验证` 后可以生成 chip；随后点击 chip 删除按钮，确认临时关键字已移除。
- 点击“添加节点”进入节点选择器。
- 节点选择器展示全部节点列表，包含 `Project Babel / babel`、`V2EX / v2ex`、`iPhone / iphone` 等节点。
- 选择 `iPhone / iphone` 后，“完成(1)”提交成功，设置页出现节点 chip。
- 首页列表按节点规则隐藏 iPhone 节点主题，并展示 `已屏蔽 2 个主题`。
- 点击提示打开 bottom sheet，标题为“已屏蔽主题”，副标题包含当前列表和数量。
- bottom sheet 展示命中原因：`命中：节点 iPhone`。
- 删除临时 iPhone 节点 chip 后，节点区恢复“暂无屏蔽节点”。
- 切换“最热”tab 后，基于现有 `中转` 关键字展示 `已屏蔽 4 个主题`。
- 点击提示打开 bottom sheet，展示命中原因：`命中：关键字 中转`。
- 浏览器 console error：无。

截图：

- `.codex/artifacts/topic-block-settings.png`
- `.codex/artifacts/topic-block-bottom-sheet.png`

## 遗留风险

- Web 验证在宽屏 tablet layout 下完成；移动端正式运行仍建议在真机或模拟器做一次手势和高度回归。
- 当前 bottom sheet 为本地 Modal 实现，已验证点击遮罩/关闭按钮路径；下滑关闭在 Web 自动化中未覆盖，需要移动端补充手势验证。
