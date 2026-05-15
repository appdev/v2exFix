# 主题与节点屏蔽架构方案

- 日期：2026-05-16
- 执行者：Codex
- 角色：架构师
- 状态：待 QA 审核

## 1. 设计目标

实现本地“主题屏蔽”能力，包含标题关键字和指定节点两类规则。规则只影响客户端列表展示，不调用 V2EX 服务端忽略接口，不改变站点级屏蔽状态。

## 2. 模块划分

### 2.1 状态层

文件：`jotai/blockKeywordsAtom.ts`

- `topicTitleBlockKeywordsAtom`: `string[]`，持久化存储用户手动输入的标题关键字。
- `blockedNodeNamesAtom`: `string[]`，持久化存储用户选择的节点 `name`。
- 保留 `blockKeywordsAtom` 作为标题关键字 atom 的兼容导出，避免未来遗漏旧引用。

### 2.2 规则计算层

新增文件：`utils/topicBlocking.ts`

- `splitTopicsByBlockRules(topics, rules)`: 输入 `Topic[]`、关键字和节点名，输出可见主题与被屏蔽主题。
- 被屏蔽主题附带命中原因：`关键字 xxx` 或 `节点 xxx`。
- 按 `topic.id` 去重统计，确保分页重复不会重复计数。

### 2.3 UI 基础组件

新增组件：

- `components/RemovableChip.tsx`: 设置页规则 chip，支持删除。
- `components/BottomSheet.tsx`: 本地 Modal bottom sheet，最高高度 90%，支持遮罩关闭、关闭按钮、下滑关闭。
- `components/topic/BlockedTopicsNotice.tsx`: 列表顶部提示和 bottom sheet 入口。
- `components/topic/BlockedTopicsSheet.tsx`: 展示当前列表被屏蔽主题及命中原因。

### 2.4 设置页

新增屏幕：`screens/TopicBlockSettingsScreen.tsx`

- 标题关键字区：手动输入、添加、清空、chip 删除。
- 屏蔽节点区：跳转节点选择器，支持多选，chip 删除。
- 节点展示从 `k.node.all` 中按 `name` 反查 `title`，失败时 fallback 到 `name`。

### 2.5 节点选择器

修改：`screens/SearchNodeScreen.tsx`、`types.tsx`

- 保持现有单选模式不变。
- 新增多选模式：`multiple: true`、`selectedNodeNames`、`onSelectNodes(nodes)`。
- 多选模式下显示选中态，点击节点切换选中，点击“完成”提交。

### 2.6 列表集成

优先覆盖使用 `TopicItem` 或 Topic-like 数据的列表：

- 首页最近、普通 tab、自定义节点 tab。
- 独立节点主题页。
- 我的主题收藏。
- 我的关注和关注成员主题。
- 用户主页主题。
- 历史最热。
- 搜索结果。

每个列表在渲染前执行过滤：

1. 从原始已加载数据计算 `visibleTopics` 和 `blockedTopics`。
2. `FlatList.data` 使用 `visibleTopics`。
3. `ListHeaderComponent` 或列表顶部插入 `BlockedTopicsNotice`。
4. bottom sheet 使用当前列表的 `blockedTopics`，不持久化历史。

## 3. 关键决策

- 节点规则只存 `node.name`，因为它是 URL 和接口中的稳定标识。
- 节点新增必须通过选择器，不允许手动输入，避免无效节点名。
- 过滤逻辑用纯函数集中管理，避免各列表复制匹配细节。
- bottom sheet 用本地组件实现，不引入新依赖，降低 Web 和移动端兼容风险。
- 搜索结果先映射为 Topic-like 数据再过滤，保留现有搜索结果列表样式。

## 4. 验证计划

- `npx tsc --noEmit`
- `git diff --check`
- 浏览器打开 `http://localhost:19006`
- 设置页进入“主题屏蔽”
- 添加关键字 chip，验证首页列表出现屏蔽提示
- 打开 bottom sheet，验证高度、命中原因和主题详情跳转
- 选择多个节点 chip，验证节点主题被隐藏
- 删除 chip，验证列表恢复
