---
name: apple-app-standards
description: Apple 平台(iOS、iPadOS、macOS、watchOS,含 iPhone Duo 折叠屏)Swift/SwiftUI 应用开发规范:HIG 与 Liquid Glass UI 设计、iPhone Duo 外屏/内屏/折痕/保留区域/竖排栏适配、系统版本与设备兼容、SPM 模块化代码结构、Swift 6 并发、命名、系统 API 与权限调用、Apple Intelligence/Foundation Models 等端侧 AI 能力、SwiftLint/swift-format、Swift Testing/XCTest、XCUITest 与 xcodebuild 自动化测试、隐私清单、性能、发布上架、macOS 官网分发(Developer ID、公证、Sparkle 自动更新)。适用于创建、重构、评审 Xcode 工程、Swift Package、SwiftUI/UIKit/AppKit 代码、Widget/App Intents/Watch 扩展或 Apple 平台 CI 配置。非 Apple 原生项目(Expo、Flutter、Web)不需要加载。
compatibility: 需要 macOS 26.6+ 与 Xcode 27.1+(Swift 6.4 编译器)才能构建和运行测试;无 Xcode 环境时仅可做静态评审并须报告未验证项。新 API 签名需通过 Context7 或 developer.apple.com 核对。
---

# Apple 平台应用规范

面向 iOS、iPadOS、macOS、watchOS 的原生 Swift 应用。默认基线:使用 Xcode 27.1+ 与最新 SDK(iOS 27.1)构建,Swift 6 语言模式;SwiftUI 优先;最低部署 iOS/iPadOS 26、macOS 26、watchOS 26(N-1),Liquid Glass 与 Foundation Models 可直接使用,27 新 API 用 `#available` 保护。需要覆盖旧设备时可下调到 iOS 18 / macOS 15 / watchOS 11 的扩展基线,见 `compatibility.md`。目标项目已有不同基线或架构时,以项目为准,不擅自迁移。

## 参考文件

路径相对本 Skill 目录,按任务读取,不必全部加载:

| 主题 | 文件 |
| --- | --- |
| 工程与代码结构、架构、依赖注入 | `references/project-structure.md` |
| 命名规范 | `references/naming.md` |
| UI 设计、HIG、Liquid Glass、无障碍、本地化 | `references/ui-design-hig.md` |
| 系统版本、设备与多平台兼容 | `references/compatibility.md` |
| 系统 API、权限、扩展(Widget、App Intents、通知等) | `references/system-apis.md` |
| Apple Intelligence、Foundation Models、Vision/Speech 等端侧 AI | `references/apple-intelligence.md` |
| Swift 6 并发与数据竞争安全 | `references/concurrency.md` |
| 持久化、网络、Codable | `references/data-networking.md` |
| Lint、格式化、编译器警告 | `references/lint-format.md` |
| 单元测试、Swift Testing | `references/testing.md` |
| UI 自动化测试、测试计划、CI | `references/ui-automation.md` |
| 安全、隐私清单、日志 | `references/security-privacy.md` |
| 性能与可观测性 | `references/performance.md` |
| 构建配置、签名、版本、TestFlight、审核 | `references/release.md` |
| macOS 官网分发、公证、Sparkle 自动更新 | `references/macos-distribution.md` |
| 禁用/过时 API 与替代 | `references/deprecated-apis.md` |
| 平台注意事项 | `references/platforms/ios.md`、`ipados.md`、`macos.md`、`watchos.md` |
| iPhone Duo(折叠屏):外屏/内屏、折痕、保留区域、竖排栏、Arrangement View | `references/platforms/iphone-duo.md` |

模板配置:`assets/.swiftlint.yml`、`assets/.swift-format`。环境检查:`scripts/check-env.sh`。场景测试:`evals/evals.json`。

## 1. 调查目标项目

1. 确认 `AGENTS.md`、Git 状态、`.xcodeproj`/`.xcworkspace`/`Package.swift`、工程生成器(Tuist、XcodeGen)、targets、schemes、`.xctestplan`、`.xcconfig`、最低部署版本、Swift 语言模式与并发设置。保留用户修改。
2. 识别 UI 技术栈(SwiftUI / UIKit / AppKit / 混合)、架构(MV、MVVM、TCA 等)、持久化与依赖管理方式。遵循现状,新增代码与周边一致。
3. 运行 `scripts/check-env.sh` 或等效命令确认 Xcode、Swift、SwiftLint、swift-format 版本。缺少工具时报告,不伪造构建或测试结果。
4. 涉及新系统(27 及以后)API、iPhone Duo、AI 框架、Liquid Glass 或不确定的签名时,先查 Context7 或 `https://developer.apple.com/tutorials/data/documentation/<framework>.json`,不凭记忆编造 API。

## 2. 硬性规则

- **结构**:App target 只做组装;功能放在本地 Swift Package 的 Feature/Core 模块中。依赖方向单向:Feature -> Core,Feature 之间不互相依赖。见 `project-structure.md`。
- **UI**:SwiftUI 优先,仅在缺少能力时桥接 UIKit/AppKit。使用系统字体与 Dynamic Type、语义颜色、SF Symbols、`NavigationStack`/`NavigationSplitView`;所有交互元素可被 VoiceOver 读取且具备 `accessibilityIdentifier`(供 UI 测试)。
- **状态**:`@Observable` + `@State` 持有,`@Environment` 注入依赖;`body` 保持纯计算,副作用放入 `.task`。不新增 `ObservableObject`(遗留代码除外)。
- **并发**:Swift 6 语言模式、完整并发检查;UI 类型 `@MainActor`;跨隔离传递 `Sendable` 值。不使用 `DispatchQueue` 编排新业务逻辑,不用 `@unchecked Sendable` 或 `nonisolated(unsafe)` 掩盖问题(除非附带理由注释)。
- **兼容**:高于部署版本的 API 用 `if #available` / `@available` 保护并提供降级;平台差异优先拆文件,其次 `#if os(...)`,最后才运行时判断。
- **自适应尺寸**:iPhone 也可能出现任意 size class 组合并在运行中改变尺寸(iPhone Duo 开合、iPhone 镜像窗口缩放)。不使用 `UIScreen.main`、设备方向、`userInterfaceIdiom` 或机型尺寸决定布局;工具栏项同时提供图标和标题;交互内容避开安全区与保留区域(折痕、摄像头)。见 `platforms/iphone-duo.md`。
- **系统能力**:每个系统框架封装在协议后;权限在使用前按需请求,`Info.plist` 写明用途说明,完整处理拒绝/受限状态。
- **AI**:Foundation Models 调用前检查 `SystemLanguageModel.default.availability`,处理所有不可用原因并提供非 AI 降级路径;处理上下文超限与护栏错误。
- **安全**:密钥与令牌存 Keychain;不在源码、`Info.plist` 或 `UserDefaults` 存秘密;维护 `PrivacyInfo.xcprivacy`;日志使用 `Logger` 并标注隐私级别,禁止 `print`。
- **macOS 分发**:默认官网 Developer ID 分发 + 公证 + Sparkle 2 更新(EdDSA 签名、签名 feed、HTTPS);更新器封装在协议后;Mac App Store target 不得包含 Sparkle。
- **质量门禁**:SwiftLint + swift-format 无违规;Release 配置警告即错误;新代码使用 Swift Testing;关键流程有 XCUITest。

## 3. 实施流程

1. 按任务读取相关参考文件和对应平台文档。
2. 先定义 Core 层模型、协议与错误类型,再实现 Feature 的视图与状态,最后在 App target 组装依赖。
3. 为业务逻辑和状态写单元测试;系统 API 通过协议替身测试;关键路径补 UI 测试。
4. 新增权限、后台模式、App Group、能力(entitlements)或 Required Reason API 时,同步更新 `Info.plist`、entitlements 与隐私清单。
5. 涉及多平台的变更,在每个受影响平台的 destination 上构建。

## 4. 验证与交付

按项目已有入口(mise、Makefile、fastlane 或脚本)优先;没有时使用:

```bash
swift-format lint --strict --recursive Sources Tests
swiftlint lint --strict
xcodebuild -scheme <App> -destination 'platform=iOS Simulator,OS=latest,name=<iPhone 机型>' test
xcodebuild -scheme <App> -destination 'platform=macOS' build
```

报告:修改的模块与文件、新增权限/能力/隐私声明、实际运行的命令与结果、覆盖的平台与系统版本、未验证项(如缺少 Xcode、真机、Apple Intelligence 设备)。工具版本与统一任务入口可选参考 `mise-standards`;任务文档可选参考 `development-tasks`;二者均非前置条件。
