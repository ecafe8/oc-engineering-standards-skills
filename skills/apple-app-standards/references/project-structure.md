# 工程与代码结构

## 推荐布局

```text
MyApp/
├── MyApp.xcodeproj            # 或 Project.swift(Tuist)/ project.yml(XcodeGen)
├── App/
│   ├── iOS/                   # iOS/iPadOS App target 入口、Info.plist、entitlements
│   ├── macOS/
│   ├── watchOS/
│   └── Shared/                # MyAppApp.swift、AppDependencies.swift、Assets.xcassets
├── Extensions/                # Widget、Intents、Share、Notification Service 等扩展 target
├── Packages/
│   ├── Core/                  # Package.swift 内含多个 library product
│   │   ├── Sources/
│   │   │   ├── Models/        # 纯值类型、领域模型,无 UI 依赖
│   │   │   ├── Networking/    # APIClient 协议与实现
│   │   │   ├── Persistence/   # SwiftData/Core Data 封装
│   │   │   ├── SystemServices/# 定位、通知、HealthKit、AI 等系统能力协议与实现
│   │   │   └── DesignSystem/  # 颜色、字体、间距、通用组件
│   │   └── Tests/
│   └── Features/
│       ├── Sources/
│       │   ├── Onboarding/
│       │   ├── Feed/
│       │   └── Settings/
│       └── Tests/
├── UITests/
├── TestPlans/                 # *.xctestplan
├── Configs/                   # Base.xcconfig、Debug/Staging/Release.xcconfig
├── .swiftlint.yml
└── .swift-format
```

- App target 只包含 `@main` 入口、Scene 组装、依赖容器创建、平台资源;业务代码放进 Package。
- 依赖方向:App -> Features -> Core。Feature 之间通过 Core 中的协议或路由值通信,不直接 import 对方。
- 小项目可先只有一个 `Packages/AppKit` 风格的包加多个 target;规模增长后再拆,但不要把逻辑放回 App target。
- `.pbxproj` 冲突频繁的团队考虑 Tuist/XcodeGen;项目已有方案则沿用,不擅自引入。Xcode 16+ 的文件夹同步组(buildable folders)也能减少冲突。

## 架构:MV + @Observable(默认)

- 简单页面:视图直接读写 `@Observable` 模型/服务(MV)。
- 有复杂状态、异步流程或需要单测的页面:引入 `<Feature>Model`(即轻量 ViewModel),`@MainActor @Observable final class`。
- 已采用 TCA、Clean Architecture 等的项目保留其方案。

```swift
@MainActor
@Observable
final class FeedModel {
    private(set) var state: LoadState<[Post]> = .idle
    private let client: any FeedClient

    init(client: any FeedClient) { self.client = client }

    func load() async {
        state = .loading
        do { state = .loaded(try await client.fetchFeed()) }
        catch { state = .failed(error) }
    }
}

struct FeedView: View {
    @State private var model: FeedModel
    init(client: any FeedClient) { _model = State(initialValue: FeedModel(client: client)) }

    var body: some View {
        content
            .task { await model.load() }
    }
}
```

## 依赖注入

- 系统与外部依赖定义为协议(`Sendable`),在 App 层组装实现,通过初始化器或 `@Environment` 注入。
- 使用 `@Entry` 定义环境值:

```swift
extension EnvironmentValues {
    @Entry var feedClient: any FeedClient = LiveFeedClient()
}
```

- 不使用全局单例承载可变状态;系统单例(如 `UNUserNotificationCenter.current()`)只出现在 Live 实现中。

## 视图组织

- 单个视图文件建议 < 200 行;拆分子视图为独立 `struct`,不用返回 `some View` 的计算属性堆砌大视图。
- 预览:每个可复用视图提供 `#Preview`,使用 Mock 依赖与 `@Previewable`。
- 导航:路由用 `Hashable` 枚举表达,`NavigationStack(path:)` 由 Feature 或 App 层的 Router 持有。

## 资源

- 颜色、图片放 Asset Catalog,使用 Xcode 生成的类型安全符号(`Color(.brandPrimary)` / `.brandPrimary`)。
- 文案使用 String Catalog(`Localizable.xcstrings`);Package 内资源通过 `Bundle.module` 访问。
