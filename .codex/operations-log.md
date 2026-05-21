# Operations Log

## 2026-05-15 - 主题标题关键字屏蔽需求调研

- 执行者：Codex
- 任务分级：L2。原因：本次为跨模块只读调研与产品需求文档产出，结论会影响后续设置页、主题列表、状态存储和列表交互实现；未修改业务代码。
- 关键命令：
  - `rg --files -g 'AGENTS.md' -g '!node_modules' -g '!Pods' -g '!build' -g '!DerivedData'`：当前仓库未发现额外子目录 `AGENTS.md`。
  - `rg -n "type Topic|interface Topic|TopicItem|BlackList|BlankList|blockKeywords|parseTopicItems" -g '!node_modules' -g '!build'`：定位主题模型、主题列表组件、现有屏蔽页和关键字 atom。
  - `sed -n '1,260p' screens/SettingScreen.tsx`：确认设置页已有“屏蔽列表”和“主题设置”等入口，适合新增“主题屏蔽”设置入口。
  - `sed -n '1,220p' servicies/types.ts`：确认 `Topic` 包含 `id`、`title`、`member`、`node`、`reply_count` 等主题列表展示字段。
  - `sed -n '1,260p' servicies/helper.ts`：确认 `parseTopicItems` 会解析 V2EX HTML 列表并基于服务端 `ignored_topics`、`blocked` 直接剔除主题。
  - `sed -n '320,620p' screens/HomeScreen.tsx`、`sed -n '1,220p' screens/NodeTopicsScreen.tsx`：确认首页 tab、最近、节点列表等主题列表主要以 `FlatList` 渲染 `Topic[]`。
  - `sed -n '1,620p' screens/BlackListScreen.tsx`：确认现有“屏蔽列表”包含“屏蔽用户”和“忽略主题”，其语义来自 V2EX 服务端，不等同于本地标题关键字屏蔽。
- 关键判断：
  - “主题”在本项目中对应 `servicies/types.ts` 的 `Topic`，列表项主要通过 `components/topic/TopicItem.tsx` 展示。
  - 新需求应定义为本地客户端过滤，不调用 V2EX 服务端 `ignore/unignore`，避免和站点级“忽略主题”混淆。
  - “已屏蔽 XXX 个主题”建议表示当前列表当前已加载数据中因标题关键字被隐藏的数量；点击后查看当前列表被隐藏的主题集合。
  - 现有 `jotai/blockKeywordsAtom.ts` 只是内存 atom，需求应要求持久化关键字配置，否则重启后设置会丢失。
- 产出：
  - `docs/requirements/topic-title-keyword-blocking.md`
- 验证：
  - 本次未改业务代码，无需编译测试；通过 `git diff --check` 检查新增 Markdown 无空白错误。

## 2026-05-15 - Web 浏览器开发测试环境修复

- 执行者：Codex
- 任务分级：L2。原因：目标是让 Expo Web 可作为本地开发测试入口，改动涉及依赖、Metro 开发服务配置和请求层 Web 分支；移动端正式运行路径保持不变。
- 关键问题：
  - `npx expo start --web --port 19006 --host localhost` 初次打包失败，原因是 `react-native-youtube-iframe` 的 Web 端 peer dependency `react-native-web-webview` 缺失。
  - 补齐依赖后，Playwright 暴露运行时错误：`@react-native-community/cookies: Invalid platform. This library only supports Android and iOS.`。
  - 修复原生 cookie 引入后，页面可挂载，但浏览器直接请求 `https://www.v2ex.com` 被 CORS 拦截。
- 实现：
  - 使用 `corepack yarn add react-native-web-webview@1.0.2` 更新 `package.json` 和 `yarn.lock`。
  - 新增 `utils/cookie.web.ts`，Web 开发环境使用浏览器 cookie/no-op 清理，避免引入原生 cookie 库。
  - 在 `metro.config.js` 增加 `__v2ex_proxy` 本地开发代理，转发到 `https://www.v2ex.com`。
  - 在 `utils/request/index.ts` 中仅对 Web 非生产环境使用 `/__v2ex_proxy` 作为 axios baseURL；移动端继续使用 `getBaseURL()`。
- 验证：
  - `npx prettier --write metro.config.js utils/request/index.ts utils/cookie.web.ts`：通过。
  - `git diff --check`：通过。
  - `npx tsc --noEmit`：通过。
  - `npx expo start --web --port 19006 --host localhost --clear`：Web bundle 成功。
  - Playwright 打开 `http://localhost:19006`：页面跳转到 `/Home`，控制台无 error，仅剩 React Native Web deprecation warnings；首页主题列表显示真实 V2EX 数据。

## 2026-05-16 - 首页功能调研与主题屏蔽产品评估

- 执行者：Codex
- 任务分级：L2。原因：基于真实首页和代码结构评估主题屏蔽需求，结论影响后续产品范围和实现优先级；本次未改业务逻辑。
- 关键命令与工具：
  - `curl -sI --max-time 5 http://localhost:19006`：确认本地 Web 服务可访问。
  - Browser 打开 `http://localhost:19006`：打开应用首页。
  - Playwright 打开 `http://localhost:19006` 并等待跳转到 `/Home`：确认首页真实数据加载。
  - Playwright DOM 文本提取：确认首页包含搜索、横向 tab、主题列表、侧边抽屉入口和主题详情入口。
  - `sed -n '1,220p' jotai/homeTabsAtom.ts`：确认首页默认 tab 列表。
  - `sed -n '1,760p' screens/HomeScreen.tsx`：确认首页列表类型、刷新、分页和 tab 管理入口。
  - `sed -n '1,380p' components/Profile.tsx`：确认侧边抽屉功能入口。
- 关键观察：
  - 首页默认 tab 包括最近、最热、技术、创意、好玩、Apple、酷工作、交易、城市、问与答、全部、R2、VXNA、节点、关注、刚更新。
  - 首页顶部包含搜索框和发帖按钮，左侧头像/登录入口打开侧边抽屉。
  - 主题列表项以标题为核心决策信息，同时展示作者、节点、赞同、回复、活跃时间和最后回复人。
  - VXNA 使用 `Xna` 模型，不建议首期纳入 `Topic` 标题关键字屏蔽。
- 产出：
  - `docs/requirements/topic-title-keyword-blocking-product-evaluation.md`
- 验证：
  - 文档产出后执行 `git diff --check`。

## 2026-05-16 - 主题屏蔽查看交互调整

- 执行者：Codex
- 任务分级：L1。原因：本次仅调整需求文档中的产品交互表述，不修改业务代码或构建配置。
- 用户反馈：
  - “已屏蔽 X 个主题”的点击结果建议使用类似 bottom sheet 的底部弹窗，最高高度为屏幕高度的 90%。
- 调整内容：
  - 将查看被屏蔽主题的交互从“独立页面或弹层”收敛为 bottom sheet。
  - 明确 bottom sheet 最高高度为屏幕高度 90%、内容不足时按内容高度展示。
  - 明确 sheet 内部列表滚动、关闭方式、点击主题后关闭 sheet 并进入主题详情。
- 影响文件：
  - `docs/requirements/topic-title-keyword-blocking.md`
  - `docs/requirements/topic-title-keyword-blocking-product-evaluation.md`
- 验证：
  - `git diff --check`：通过。
  - `rg -n "独立页面|查看页/弹层|bottom sheet|90%|已屏蔽主题" docs/requirements/topic-title-keyword-blocking.md docs/requirements/topic-title-keyword-blocking-product-evaluation.md`：确认交互口径已收敛为 bottom sheet。

## 2026-05-16 - 节点屏蔽与 chip 管理需求补充

- 执行者：Codex
- 任务分级：L2。原因：本次为跨模块产品调研和需求文档更新，影响设置页、节点选择器、本地状态和主题列表过滤口径；未修改业务代码。
- 关键命令：
  - `rg -n "nodes/all|allNodes|Node|节点|useQuery\\(|get.*Nodes|api/nodes|SearchNode" -g '!node_modules' -g '!ios/Pods' -g '!android/.gradle'`：定位全部节点接口、节点模型、节点搜索和节点 tab 添加流程。
  - `sed -n '1,140p' servicies/node.ts`：确认 `k.node.all` 请求 `/api/nodes/all.json`，返回 `Promise<Node[]>`。
  - `sed -n '48,92p' servicies/types.ts`：确认 `Node` 字段包含 `name`、`title`、`aliases`、`id` 等。
  - `sed -n '1,140p' screens/SearchNodeScreen.tsx`：确认当前节点搜索已基于 `k.node.all`，搜索字段包含 `title`、`title_alternative`、`name`、`aliases`。
  - `sed -n '116,178p' screens/SortTabsScreen.tsx`：确认现有添加首页节点 tab 流程复用 `SearchNode` 单选节点。
  - `node -e "fetch('https://www.v2ex.com/api/nodes/all.json')..."`：验证 V2EX 全部节点接口当前返回 200，本次样本 count 为 1347。
- 关键判断：
  - 项目已有获取全部节点的接口和预取路径：`k.node.all` / `/api/nodes/all.json`，可直接作为节点屏蔽选择器数据源。
  - 节点屏蔽应保存稳定的 `node.name` 数组；展示 chip 时通过全部节点数据补 `title / name`，节点数据暂不可用时 fallback 展示 `name`。
  - 标题屏蔽和节点屏蔽的新增方式必须区分：标题关键字由用户手动输入，节点必须从全部节点中搜索选择并支持多选。
  - 设置页规则管理采用可删除 chip：关键字 chip 展示关键字文本，节点 chip 展示节点标题和 name。
- 产出：
  - `docs/requirements/topic-title-keyword-blocking.md`：扩展为“主题与节点屏蔽需求文档”。
  - `docs/requirements/topic-title-keyword-blocking-product-evaluation.md`：补充节点屏蔽价值、接口依据、chip 管理和多选节点选择器方案。
- 验证：
  - `git diff --check`：通过。
  - `rg -n "不新增按作者、节点|不建议首期加入.*节点|独立页面|查看页/弹层" docs/requirements/topic-title-keyword-blocking.md docs/requirements/topic-title-keyword-blocking-product-evaluation.md`：无输出，确认需求文档未残留旧的节点非目标或独立页面表述。
  - `rg -n "[ \\t]+$" docs/requirements/topic-title-keyword-blocking.md docs/requirements/topic-title-keyword-blocking-product-evaluation.md .codex/operations-log.md`：无输出，确认本次文档无行尾空白。

## 2026-05-16 - 主题与节点屏蔽架构方案和 QA 门禁

- 执行者：Codex
- 任务分级：L3。原因：后续实现会跨设置、导航、状态、节点选择器和多个主题列表；先按架构师和 QA 流程建立开发门禁。
- 关键上下文：
  - 仓库内无额外 `AGENTS.md`。
  - `servicies/node.ts` 已有 `k.node.all`，请求 `/api/nodes/all.json`。
  - `SearchNodeScreen` 当前为单选节点搜索，可扩展为兼容单选的多选模式。
  - 首页、节点页、收藏、关注、用户页、历史最热和搜索均存在 Topic 或 Topic-like 列表。
- 架构产出：
  - `.codex/structured-request.json`
  - `.codex/context-scan.json`
  - `.codex/architecture-topic-blocking.md`
- QA 门禁：
  - `.codex/qa-architecture-review.md`
  - QA 结论：通过，可以进入开发阶段。

## 2026-05-16 - 主题与节点屏蔽代码实现与 QA

- 执行者：Codex
- 任务分级：L3。原因：跨设置、导航、状态、节点选择器、多个主题列表和 Web QA。
- 实现摘要：
  - 新增持久化规则 atom：标题关键字和屏蔽节点 `name`。
  - 新增 `utils/topicBlocking.ts` 和 `utils/useTopicBlockRules.ts`，集中处理规则匹配、去重和命中原因。
  - 新增 `TopicBlockSettingsScreen`，支持关键字输入、节点多选、可删除 chip。
  - 扩展 `SearchNodeScreen` 为兼容单选的多选节点选择器。
  - 新增 `BottomSheet`、`RemovableChip`、`BlockedTopicsNotice`、`BlockedTopicsSheet`。
  - 首页、节点页、收藏、关注、用户页、历史最热、搜索结果均接入本地过滤和屏蔽提示。
- 验证：
  - `npx prettier --write ...`：通过。
  - `npx tsc --noEmit`：通过。
  - `git diff --check`：通过。
  - Browser QA：通过，详见 `.codex/testing.md`。
- QA 截图：
  - `.codex/artifacts/topic-block-settings.png`
  - `.codex/artifacts/topic-block-bottom-sheet.png`
- 审查：
  - `.codex/review-report.md`，综合评分 92/100，结论通过。

## 2026-05-16 - Web 测试改动对真机影响核查

- 执行者：Codex
- 任务分级：L2。原因：只读核查，但结论影响真机运行路径判断，涉及网络层、平台文件解析、Metro 开发服务和依赖。
- 关键命令：
  - `sed -n '1,220p' utils/request/index.ts`：确认 `getRequestBaseURL()` 仅在 `Platform.OS === 'web' && process.env.NODE_ENV !== 'production'` 时返回 `/__v2ex_proxy`，其他平台仍返回 `getBaseURL()`。
  - `ls utils/cookie* && sed -n '1,160p' utils/cookie.ts && sed -n '1,160p' utils/cookie.web.ts`：确认 Web 使用 `cookie.web.ts`，原生仍使用 `cookie.ts` 和 `@react-native-cookies/cookies`。
  - `sed -n '1,220p' metro.config.js`：确认新增代理是 Metro dev server 中间件，仅拦截 `/__v2ex_proxy`。
  - `rg -n "react-native-web-webview|__v2ex_proxy|getRequestBaseURL|Platform.OS === 'web'|from '@/utils/cookie'" ...`：确认相关引用范围。
- 结论：
  - Web 测试修改不会改变 Android/iOS 真机请求 baseURL。
  - Web cookie 适配文件不会被 Android/iOS 平台解析使用。
  - Metro 代理只存在开发服务器层，不进入 App 运行时。
  - `react-native-web-webview` 是 Web bundle 依赖补齐，不替换原生 `react-native-webview`。

## 2026-05-16 - Android Release GitHub Action

- 执行者：Codex
- 任务分级：L2。原因：新增 CI 发布配置，影响 Android release 构建和 GitHub Release 发布流程；未修改业务运行时代码。
- 关键上下文：
  - `git ls-files android` 无输出，`git status --ignored android` 显示 `android/` 为忽略目录，因此 CI 不能依赖仓库内已有原生 Android 工程。
  - `.nvmrc` 指定 Node `v22.19.0`，`yarn.lock` 为 Yarn v1 锁文件。
  - `app.json` 的 Expo 版本号为 release APK 命名来源。
- 实现：
  - 新增 `.github/workflows/android-release.yml`。
  - workflow 初始设计在 `main` 分支 push 和手动触发时运行；后续按用户要求调整为仅支持手动触发，避免每次 push 自动发布 APK。
  - CI 使用 `android-actions/setup-android@v4` 安装 Android SDK 36、Build Tools 36、NDK 27.1 和 CMake，避免 GitHub runner 上 `sdkmanager` 不在 PATH 导致发布失败。
  - CI 在生成 Android 工程后使用 `gradle/actions/setup-gradle@v4` 配置 Gradle 构建环境。
  - 安装依赖时显式使用 `--production=false`，避免 Yarn v1 因 production 环境跳过构建所需 devDependencies。
  - 使用 `npx expo prebuild --platform android --clean` 生成 Android 工程，再以 `NODE_ENV=production` 执行 `./gradlew assembleRelease`。
  - 使用最近 10 条提交生成 `release-notes.md`，并通过 GitHub CLI 创建或更新 `android-<short-sha>` Release。

## 2026-05-16 - ReplyBox 导航栏偏移回归调试

- 执行者：Codex
- 任务分级：L2。原因：修改 Android 键盘场景下回复输入框布局代码，影响回复输入框与输入法、导航栏的相对位置。
- 实现：
  - ReplyBox 外层底部偏移改为仅使用 `keyboardOffset`，避免把整个输入框抬高后露出页面内容。
  - 将导航栏高度转移到 ReplyBox 底部按钮行内部，键盘弹出时 `paddingBottom` 使用 `safeAreaInsets.bottom + 10`。
  - 确认 React Native 数字样式单位为 dp，本次使用数值 `10`，不使用 tailwind `px` 字符串。
- 验证：
  - `npx prettier --check components/topic/ReplyBox.tsx`：通过。
  - `git diff --check -- components/topic/ReplyBox.tsx`：通过。
  - `npx tsc --noEmit`：通过。
  - `JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" ./gradlew :app:assembleRelease --no-daemon --stacktrace`：通过。
  - `adb -s 44dfe0af install -r android/app/build/outputs/apk/release/app-release.apk`：安装成功。
  - `adb -s 44dfe0af shell am start -n com.liaoliao666.v2ex/.MainActivity`：已启动。

## 2026-05-16 - Android Release CI Metaspace 修复

- 执行者：Codex
- 任务分级：L2。原因：修复 GitHub Actions release 构建失败，改动范围限定在 CI 构建配置和留痕文档。
- 用户反馈：
  - GitHub Actions release 构建在 `:expo-updates:kspReleaseKotlin` 失败，核心异常为 `java.lang.OutOfMemoryError: Metaspace`。
  - `React Compiler enabled` 为 Expo 构建日志提示，不是失败根因。
- 实现：
  - 在 `npx expo prebuild --platform android --clean` 后新增 `Tune Gradle memory for CI` 步骤。
  - 显式覆盖生成出的 `android/gradle.properties`：`MaxMetaspaceSize=3072m`、`org.gradle.workers.max=1`、`org.gradle.parallel=false`。
  - 将 Kotlin 编译策略设为 `in-process`，并关闭 Kotlin/KSP incremental，减少 clean CI release 构建中的额外 worker 和 classloader 压力。
  - `assembleRelease` 增加 `--max-workers=1`，与 Gradle properties 保持一致。
- 验证：
  - `npx prettier --check .github/workflows/android-release.yml`：通过。
  - `ruby -e 'require "yaml"; YAML.load_file(".github/workflows/android-release.yml")'`：通过。
  - `git diff --check -- .github/workflows/android-release.yml .codex/operations-log.md`：通过。

## 2026-05-16 - App 版本升级到 1.9.0

- 执行者：Codex
- 任务分级：L2。原因：修改 Expo 发布配置，影响 App 展示版本、iOS buildNumber 和 OTA runtime 匹配。
- 关键上下文：
  - `app.json` 当前 `expo.version` 为 `1.8.8`，`ios.buildNumber` 为 `1.8.8.1`，`runtimeVersion` 为 `1.8.7`。
  - 历史版本提交会同步 `expo.version` 与 `ios.buildNumber`；本次同时把 `runtimeVersion` 对齐到 `1.9.0`，避免新大版本继续使用旧 runtime。
- 实现：
  - `expo.version` 更新为 `1.9.0`。
  - `ios.buildNumber` 更新为 `1.9.0.1`。
  - `runtimeVersion` 更新为 `1.9.0`。
- 验证：
  - `node -e "const app=require('./app.json').expo; ..."`：通过，输出版本为 `1.9.0`、buildNumber 为 `1.9.0.1`、runtimeVersion 为 `1.9.0`。
  - `npx expo config --type public --json | node -e ...`：通过，Expo 解析后的配置同样为 `1.9.0` / `1.9.0.1` / `1.9.0`；npm 输出现有 `auto-install-peers` 配置警告，不影响结果。
  - `git diff --check -- app.json .codex/operations-log.md`：通过。

## 2026-05-16 - Android 版本号和 JNI ABI 过滤

- 执行者：Codex
- 任务分级：L2。原因：修改 Android 发布版本号和原生 ABI 构建/打包配置，影响 APK 版本元数据和 JNI so 打包范围。
- 关键上下文：
  - `expo.version` 已为 `1.9.0`，但 `android.versionCode` 未配置；生成工程 `android/app/build.gradle` 仍是 `versionCode 1`。
  - `expo-build-properties` 支持通过 `android.buildArchs` 写入 `reactNativeArchitectures`，可限制构建 ABI。
  - 生成工程已有 `reactNativeArchitectures=armeabi-v7a,arm64-v8a`，但 `android.packagingOptions.excludes` 只排除了 `lib/x86/**`。
- 实现：
  - 在 `app.json` 增加 `android.versionCode: 1090001`，对应 `1.9.0.1`。
  - 在 `expo-build-properties.android` 增加 `buildArchs: ["armeabi-v7a", "arm64-v8a"]`。
  - 将 JNI 排除规则扩展为 `lib/x86/**` 和 `lib/x86_64/**`，只保留 ARM ABI。
- 验证：
  - `CI=1 npx expo prebuild --platform android --clean --no-install`：通过，生成工程同步为 `versionCode 1090001`、`versionName "1.9.0"`、`reactNativeArchitectures=armeabi-v7a,arm64-v8a`、`android.packagingOptions.excludes=lib/x86/**,lib/x86_64/**`。
  - prebuild 自动改动了 `package.json` 的 `android`/`ios` scripts，已撤回该无关改动。
  - `JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" ./gradlew :app:assembleRelease --no-daemon --stacktrace`：通过，生成 `android/app/build/outputs/apk/release/app-release.apk`。
  - `aapt dump badging android/app/build/outputs/apk/release/app-release.apk`：确认 APK 为 `versionCode='1090001'`、`versionName='1.9.0'`。
  - `unzip -l android/app/build/outputs/apk/release/app-release.apk | ...`：确认 APK JNI ABI 仅包含 `arm64-v8a`、`armeabi-v7a`；未发现 `lib/x86/` 或 `lib/x86_64/`。

## 2026-05-20 - 登录输入框密码管理软件支持调查

- 执行者：Codex
- 任务分级：L3，只读调查。原因：涉及登录主流程与账号/密码凭据填充行为，结论会影响后续实现方向。
- 关键上下文：
  - `screens/LoginScreen.tsx` 的原生登录表单使用 `StyledTextInput`，用户名输入框设置 `autoComplete="username"`，密码输入框设置 `secureTextEntry` 和 `autoComplete="current-password"`。
  - `components/StyledTextInput.tsx` 将 `...props` 透传给 React Native `TextInput`，没有吞掉 autocomplete/autofill 相关属性。
  - React Native 0.81.5 会把 `autoComplete="current-password"` 映射为 Android `password` hint 和 iOS `textContentType="password"`，把 `autoComplete="username"` 映射为平台 username hint。
  - `app.json` 只配置了 iOS push entitlement，没有配置 `com.apple.developer.associated-domains` / `webcredentials`；Android 侧也没有看到 Digital Asset Links / `asset_statements` 相关配置。
  - 当前原生登录表单通过解析 V2EX `/signin` 的动态字段名后自行 POST 登录；这不是系统浏览器表单，密码管理器无法直接利用网页 DOM 的 `autocomplete`/`name`/`type` 信息。
- 判断：
  - 输入框已具备基础原生 autofill hint，因此问题不是“提示属性完全缺失”。
  - 对网站凭据自动匹配较弱的主要原因是 App 与 `www.v2ex.com` 缺少平台级可信关联；iOS 需要 Associated Domains / webcredentials 和站点的 apple-app-site-association，Android Credential Manager/Google Password Manager 场景需要 Digital Asset Links。
  - 可提升兼容性的代码补强是显式增加 `textContentType="username"`、`textContentType="password"`、Android `importantForAutofill="yes"`，并把密码框的 `autoComplete` 可选改为 Android 原生值 `password` 或保留 `current-password` 由 RN 映射。
- 验证：
  - `rg` 检索登录输入框、`StyledTextInput`、RN TextInput 源码、`app.json` 平台关联配置。
  - 未修改业务代码，未执行构建。

## 2026-05-20 - 登录输入框密码管理软件支持修复

- 执行者：Codex
- 任务分级：L3。原因：修改 `screens/LoginScreen.tsx` 登录主流程文件，但变更限定为原生输入框 autofill 语义属性，不改变登录请求、Cookie、验证码或 2FA 状态流。
- 实现：
  - 用户名输入框新增 `textContentType="username"`、`importantForAutofill="yes"`、`autoCorrect={false}`。
  - 密码输入框保留 `secureTextEntry` 和 `autoComplete="current-password"`，新增 `textContentType="password"`、`importantForAutofill="yes"`、`autoCorrect={false}`。
  - 图形验证码输入框新增 `autoComplete="off"`、`textContentType="none"`、`importantForAutofill="no"`，避免被凭据填充启发式识别为登录字段。
  - 2FA 输入框新增 `autoComplete="one-time-code"`、`textContentType="oneTimeCode"`、`importantForAutofill="yes"`。
- 边界：
  - 本次修复提升原生输入框可识别性，但不新增 App 内密码保存。
  - 完整网站凭据匹配仍需要 iOS Associated Domains / webcredentials 与 Android Digital Asset Links，由 App 和 `www.v2ex.com` 站点共同配置。
- 验证：
  - `npx prettier --check screens/LoginScreen.tsx .codex/structured-request.json .codex/context-scan.json .codex/operations-log.md`：通过。
  - `npx tsc --noEmit`：通过。
  - `git diff --check -- screens/LoginScreen.tsx .codex/structured-request.json .codex/context-scan.json .codex/operations-log.md`：通过。
  - npm 输出项目现有 `auto-install-peers` 配置警告，不影响验证结果。

## 2026-05-21 - 中文提交和推送

- 执行者：Codex
- 任务分级：L2。原因：用户明确要求提交并推送到远程仓库，涉及远程发布但不新增业务逻辑修改。
- 提交前检查：
  - `git status --short --branch`：确认当前分支为 `main`，相对 `origin/main` 无 ahead/behind，仅有登录输入框修复和 `.codex` 留痕文件改动。
  - `git fetch --prune`：通过，远程可访问并同步了新增 tag。
  - `npx tsc --noEmit`：通过。
  - `git diff --check`：通过。
  - `npx prettier --check screens/LoginScreen.tsx .codex/structured-request.json .codex/context-scan.json .codex/operations-log.md .codex/review-report.md .codex/testing.md`：通过。
- 计划：
  - 使用中文提交信息提交当前工作树改动。
  - 执行 `git push origin main` 推送到远程。

## 2026-05-21 - App 版本提升到 1.9.1

- 执行者：Codex
- 任务分级：L2。原因：修改 Expo 发布配置，影响 App 展示版本、OTA runtime、iOS buildNumber 和 Android versionCode。
- 关键上下文：
  - `app.json` 是当前仓库 App 发布版本的来源；`package.json` 的 `version` 不作为发布版本。
  - 当前已跟踪文件只有 `app.json` 和 `package.json`；本地 `android/` 生成目录包含旧版本号但未被 Git 跟踪，本次不修改生成产物。
- 实现：
  - `expo.version` 从 `1.9.0` 提升到 `1.9.1`。
  - `runtimeVersion` 从 `1.9.0` 提升到 `1.9.1`。
  - `ios.buildNumber` 从 `1.9.0.1` 提升到 `1.9.1.1`。
  - `android.versionCode` 从 `1090001` 提升到 `1090101`。
- 验证：
  - `node -e "const app=require('./app.json').expo; ..."`：通过，确认版本字段为 `1.9.1`、`1.9.1`、`1.9.1.1`、`1090101`。
  - `npx expo config --type public --json | node -e ...`：通过，Expo 解析后的公共配置同样为 `1.9.1`、`1.9.1`、`1.9.1.1`、`1090101`。
  - `npx prettier --check app.json`：通过。
  - `git diff --check -- app.json`：通过。

## 2026-05-21 - 提交并推送 1.9.1 版本提升

- 执行者：Codex
- 任务分级：L2。原因：用户明确要求提交并推送到远程仓库。
- 提交前检查：
  - `git status --short --branch`：确认当前分支为 `main`，相对 `origin/main` 无 ahead/behind，待提交文件为 `app.json` 和 `.codex/operations-log.md`。
  - `git fetch --prune`：通过，远程可访问且无分支落后。
  - `node -e "const app=require('./app.json').expo; ..."`：确认当前版本字段为 `1.9.1`、`1.9.1`、`1.9.1.1`、`1090101`。
  - `npx expo config --type public --json | node -e ...`：通过。
  - `npx prettier --check app.json .codex/operations-log.md`：通过。
  - `git diff --check -- app.json .codex/operations-log.md`：通过。
- 计划：
  - 使用中文提交信息提交当前版本提升。
  - 执行 `git push origin main` 推送到远程。
