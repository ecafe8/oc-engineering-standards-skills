# 禁用/过时 API 与替代

新代码不得使用左列;修改遗留代码时顺带迁移需评估范围并告知用户。

| 避免 | 使用 | 说明 |
| --- | --- | --- |
| `NavigationView` | `NavigationStack` / `NavigationSplitView` | |
| `NavigationLink(destination:isActive:)` | `NavigationLink(value:)` + `navigationDestination(for:)` | |
| `ObservableObject` + `@Published` | `@Observable` | iOS 17+ |
| `@StateObject` / `@ObservedObject` / `@EnvironmentObject` | `@State` / 直接属性 / `@Environment(Type.self)` | 配合 `@Observable` |
| `EnvironmentKey` 手写样板 | `@Entry` | |
| `.onAppear { Task { ... } }` | `.task { ... }` | 自动取消 |
| `onChange(of:perform:)` 单参数 | `onChange(of:) { old, new in }` | |
| `.foregroundColor` | `.foregroundStyle` | |
| `.cornerRadius()` | `.clipShape(.rect(cornerRadius:))` | |
| `.navigationBarTitle` | `.navigationTitle` | |
| `.navigationBarItems` | `.toolbar` | |
| `Alert` / `ActionSheet` 类型 | `.alert(_:isPresented:actions:)` / `.confirmationDialog` | |
| `tabItem` | `Tab` | iOS 18+ |
| `GeometryReader` 读尺寸做布局 | `containerRelativeFrame`、`Layout`、`onGeometryChange` | |
| `UIScreen.main.bounds` | 容器尺寸 / size class | 多窗口、iPhone Duo 开合时不可靠 |
| `UIScreen.main.scale` | `@Environment(\.displayScale)` / `traitCollection.displayScale` | |
| `UIWindow(frame:)` | `UIWindow(windowScene:)` | |
| `UIDevice.current.orientation` / `interfaceOrientation` 做布局 | 比较可用宽高 | iPhone Duo |
| `userInterfaceIdiom` 做布局 | size class / 可用空间 | |
| 自绘 `UIToolbar`/`UITabBar` 或纯文字/自定义视图工具栏项 | 系统栏 + 同时有图标和标题的 `ToolbarItem` | iPhone Duo 竖排栏 |
| `UIApplication.shared.windows` | Scene / `@Environment` | |
| `DispatchQueue.main.async` | `@MainActor` / `MainActor.run` | |
| `DispatchQueue.global().async` 业务编排 | async/await、`@concurrent` | |
| `DispatchSemaphore` 等待异步 | `await` | 可能死锁 |
| 回调式 `URLSession.dataTask` | `try await URLSession.shared.data(for:)` | |
| Combine 新业务管线 | `AsyncSequence`、Observation | 既有保留 |
| `NotificationCenter` 字符串通知 | 类型化 `NotificationCenter.Message`(26+) 或 `notifications(named:)` async 序列 | |
| `print` / `NSLog` | `Logger` | |
| `DateFormatter` / `NumberFormatter` 手动 | `.formatted()` / `FormatStyle` | |
| `NSLocalizedString` + `.strings` | `String(localized:)` + String Catalog | |
| `XCTAssert*` 新单元测试 | `#expect` / `#require`(Swift Testing) | UI 测试仍用 XCTest |
| StoreKit 1 `SKPaymentQueue` | StoreKit 2 `Product` / `Transaction` | |
| `SFSpeechRecognizer` 新功能 | `SpeechAnalyzer`(26+,低版本降级保留) | |
| `VNRequest` 旧 API 新代码 | Vision Swift API(`RecognizeTextRequest` 等) | iOS 18+ |
| `UIImpactFeedbackGenerator` 于 SwiftUI | `.sensoryFeedback` | |
| `WKWebView` 包装于 SwiftUI | `WebView` / `WebPage` | 26+,低版本保留包装 |
| `CocoaPods` / Carthage 新依赖 | SPM | |
| `AnyView` 类型擦除 | `@ViewBuilder` / `some View` | |
