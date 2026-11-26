# 自动化测试与 CI

## XCUITest 规则

- 元素定位只使用 `accessibilityIdentifier`(命名见 `naming.md`),不依赖文案、坐标或层级索引,保证多语言可运行。
- Page Object(Screen)模式:每个页面一个 `struct FeedScreen { let app: XCUIApplication }`,暴露动作与断言,测试中不散落查询。
- 启动参数/环境注入测试模式:`app.launchArguments = ["-uiTesting"]`、`app.launchEnvironment["MOCK_SCENARIO"] = "emptyFeed"`;App 在测试模式下使用 Mock 依赖、关闭动画、重置数据。仅在 Debug/测试构建编译此分支。
- 等待使用 `waitForExistence(timeout:)` 或 `XCTNSPredicateExpectation`,禁止 `sleep`。
- 系统弹窗(权限)使用 `addUIInterruptionMonitor` 或预先通过 `simctl privacy` 授权。
- 每个关键用户旅程(启动、登录、核心创建/编辑、购买、设置)至少一条端到端用例。
- 无障碍审计:`try app.performAccessibilityAudit()` 纳入冒烟测试。
- 性能:`measure(metrics: [XCTApplicationLaunchMetric()])` 监控启动时间。
- 失败时自动附截图与 UI 层级(`XCTAttachment`,`lifetime = .keepAlways` 仅失败时)。

## 测试计划(.xctestplan)

| 计划 | 内容 | 触发 |
| --- | --- | --- |
| `Unit` | 全部单元测试,随机顺序、并行 | 每次 PR |
| `Smoke` | 关键 UI 旅程 + 无障碍审计 | 每次 PR |
| `Full` | 全部 UI 测试、多配置(深色、AX 字号、RTL 伪语言、德语长文案) | 合并主干 / 每晚 |
| `Sanitizers` | Thread/Address Sanitizer 配置跑单元测试 | 每晚 |

## 设备矩阵

| 平台 | 最低 | 最新 |
| --- | --- | --- |
| iOS | 最低部署版本的小屏 iPhone | 最新 iPhone |
| iPhone Duo | iPhone Duo 模拟器(Xcode 27.1+)外屏 | 内屏展开 / 半折 |
| iPadOS | iPad(分屏用例) | 最新 iPad Pro |
| macOS | `platform=macOS` | — |
| watchOS | 小尺寸手表 | Ultra |

```bash
xcrun simctl list devices available
xcodebuild test -scheme MyApp -testPlan Smoke \
  -destination 'platform=iOS Simulator,OS=latest,name=<iPhone 机型>' \
  -destination 'platform=iOS Simulator,OS=latest,name=<iPad 机型>' \
  -resultBundlePath build/Smoke.xcresult
xcrun xcresulttool get test-results summary --path build/Smoke.xcresult
```

- 设备名随 Xcode 版本变化,CI 中先用 `simctl list` 解析可用设备,或使用 `OS=latest`。
- 使用 `build-for-testing` + `test-without-building` 拆分构建与测试,支持分片并行。
- 模拟器预置:`simctl boot`、`simctl status_bar ... override`(截图一致)、`simctl privacy grant`、`simctl push`(测试推送)。

## CI

- 选择:Xcode Cloud(与 App Store Connect 集成最好)或 GitHub Actions macOS runner;发布自动化可用 fastlane。
- 流水线:环境检查 -> 依赖解析(`-resolvePackageDependencies`,检查 `Package.resolved` 未变) -> lint -> 单元测试 + 覆盖率 -> Smoke UI -> 归档(主干)。
- 固定 Xcode 版本(默认 27.1+,`xcode-select` / `DEVELOPER_DIR`;runner 需 macOS 26.6+),缓存 SPM 与 DerivedData。
- 上传 `.xcresult` 作为产物;失败用例展示截图。
- 不稳定测试:隔离到 quarantine 标签并建缺陷单,不默认重试掩盖;`-retry-tests-on-failure` 仅用于诊断。
- 签名在 CI 使用 App Store Connect API Key 与自动签名或 match;证书和密钥只放 CI Secret。
