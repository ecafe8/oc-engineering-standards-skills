# 系统版本与设备兼容

## 部署基线

构建工具:Xcode 27.1+(Swift 6.4 编译器,Swift 6 语言模式),SDK iOS 27.1 / iPadOS 27 / macOS 27 / watchOS 27。App Store 要求使用较新 SDK 提交,且 iPhone Duo 全屏适配需要 iOS 27.1 SDK。

| 平台 | 默认最低版本(N-1) | 扩展基线(需覆盖旧设备时) | 需 `#available` 保护 |
| --- | --- | --- | --- |
| iOS / iPadOS | 26.0 | 18.0 | 27 / 27.1 API(如 `ReservedRegion`、`ArrangementView`) |
| macOS | 26.0 | 15.0 | 27 API |
| watchOS | 26.0 | 11.0 | 27 API |

- 默认基线下 Liquid Glass、Foundation Models 框架、`WebView`、`SpeechAnalyzer` 等 26 API 可直接使用,无需版本分支;Foundation Models 仍须做运行时可用性检查(设备与 Apple Intelligence 状态)。
- 采用扩展基线时,所有 26 API 都要用 `#available(iOS 26, macOS 26, watchOS 26, *)` 保护并提供降级。
- 版本选择以项目的用户系统分布为准;提高最低版本需在变更说明中记录并评估用户占比。
- Mac Catalyst 已知问题(Xcode 27.1):iOS 27.1 专属 API 在 Catalyst 下编译失败,用 `#if !targetEnvironment(macCatalyst)` 隔离;如需 Catalyst 运行目标,设置 Mac Catalyst 27.0 最低部署。
- 统一在 `.xcconfig` 或 Package.swift `platforms:` 中设置,Package 与 App target 保持一致。

## 可用性检查

```swift
if #available(iOS 27.1, *) {
    ArrangementView { controls } secondary: { player }
        .arrangementViewStyle(.overlay)
} else {
    ZStack(alignment: .bottom) { player; controls }
}
```

- 对整个类型/函数使用 `@available(iOS 27.1, *)` 并在调用点检查,避免散落的分支。
- 封装成 View 扩展(如 `.adaptiveGlass()`)集中处理降级,视图中不重复写判断。
- 未来提高最低版本后,清理已无意义的 `#available` 分支。
- 能力检查与版本检查分开:设备能力(相机、NFC、Apple Intelligence、HealthKit)用运行时 API 判断,如 `HKHealthStore.isHealthDataAvailable()`、`SystemLanguageModel.default.availability`。

## 平台差异处理顺序

1. **共享代码**:SwiftUI 视图、模型、服务尽量共享。
2. **平台专用文件**:`Settings+macOS.swift` 只加入 macOS target,或在 Package 中用 `.when(platforms:)` 条件依赖。
3. **条件编译**:`#if os(iOS)`、`#if os(macOS)`、`#if os(watchOS)`、`#if canImport(UIKit)`;iPadOS 与 iOS 共享 `os(iOS)`,运行时用 `horizontalSizeClass` 区分布局,而非 `UIDevice.current.userInterfaceIdiom` 判断功能。
4. **运行时判断**:仅用于同一二进制内的真实差异(如 iOS App 运行在 Apple 芯片 Mac 上:`ProcessInfo.processInfo.isiOSAppOnMac`)。

## 屏幕与窗口

- 不假设屏幕尺寸、方向或刘海;以容器尺寸和 size class 自适应。
- iPhone 不再总是 compact:iPhone Duo 内屏与 iPhone 镜像窗口可出现 regular 宽度,且尺寸会在运行中改变。不用 `userInterfaceIdiom`、设备方向或 `UIScreen.main` 决定布局(详见 `platforms/iphone-duo.md`)。
- iPad:Split View、Slide Over、Stage Manager、iPadOS 26+ 自由窗口缩放;macOS:任意窗口尺寸,设置合理 `minWidth/minHeight`。
- watchOS:41mm 到 Ultra 49mm 的多种表盘尺寸;内容需可滚动。

## Mac 方案选择

| 方案 | 适用 |
| --- | --- |
| 原生 SwiftUI 多平台 target(推荐) | 新项目,共享 SwiftUI 代码,Mac 体验最好 |
| Mac Catalyst | 大量 UIKit 代码的 iPad App,快速移植 |
| Designed for iPad(Apple 芯片) | 零成本运行,体验最低 |

## 其他兼容项

- 架构:Mac 构建通用二进制(arm64 + x86_64),除非明确放弃 Intel 并在 macOS 最低版本上体现。
- 第三方依赖:确认支持所有目标平台与最低版本,否则用条件依赖隔离。
- 数据迁移:SwiftData/Core Data 模型变更必须提供版本化迁移,在旧版本数据上测试升级。
- 深链接与 Universal Links 在所有平台注册一致。
