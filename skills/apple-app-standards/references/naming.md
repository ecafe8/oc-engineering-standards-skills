# 命名规范

遵循 [Swift API Design Guidelines](https://www.swift.org/documentation/api-design-guidelines/):使用处清晰优先于简洁。

## 代码标识符

| 对象 | 规则 | 示例 |
| --- | --- | --- |
| 类型、协议、枚举、associatedtype | UpperCamelCase | `FeedModel`、`FeedClient` |
| 属性、方法、变量、枚举 case | lowerCamelCase | `fetchFeed()`、`case loading` |
| 布尔值 | 断言式 `is/has/can/should` | `isEnabled`、`hasUnreadItems` |
| 协议(描述是什么) | 名词 | `Collection`、`FeedClient` |
| 协议(描述能力) | `-able` / `-ible` / `-ing` | `Identifiable`、`ProgressReporting` |
| 缩写 | 整体大写或整体小写 | `userID`、`urlString`、`HTTPClient` |
| 工厂方法 | `make` 前缀 | `makeRequest()` |
| 可变/非变对 | 动词 / 名词或 -ed/-ing | `sort()` / `sorted()` |
| 异步方法 | 不加 `Async` 后缀 | `func load() async` |
| 常量 | lowerCamelCase,置于类型命名空间 | `enum Layout { static let spacing = 8.0 }` |

- 禁止匈牙利命名、`k` 前缀常量、无意义缩写(`mgr`、`btn`)。
- 参数标签让调用读起来像英文短语:`move(from:to:)`、`remove(at:)`。
- 实现类型命名:协议 `FeedClient`,实现 `LiveFeedClient`、`MockFeedClient`;不用 `FeedClientProtocol`/`FeedClientImpl`(遗留代码除外)。
- 错误类型以 `Error` 结尾:`enum FeedError: Error`。

## 文件与目录

- 一个文件一个主要类型,文件名与类型同名:`FeedModel.swift`。
- 扩展文件:`Type+Capability.swift`,如 `Date+Formatting.swift`、`FeedView+Accessibility.swift`。
- 平台专用文件:`Type+iOS.swift`、`Type+macOS.swift`,配合 target 成员或 `#if os`。
- 视图:`<Name>View`;屏幕级视图 `<Feature>Screen` 或 `<Feature>View`,项目内统一一种。
- 状态模型:`<Feature>Model`(或项目既有的 `ViewModel` 后缀,统一即可)。
- 目录名 UpperCamelCase,与模块名对应;模块名不含 `Module`/`Kit` 冗余后缀,除非已是项目约定。

## 工程元素

| 对象 | 规则 | 示例 |
| --- | --- | --- |
| Bundle ID | 反向域名,全小写,扩展追加后缀 | `com.example.myapp`、`com.example.myapp.widget` |
| Target | 产品名 + 平台/类型 | `MyApp`、`MyAppWidgetExtension`、`MyAppUITests` |
| Scheme | 与 target 对应,环境用配置区分 | `MyApp`(Debug/Staging/Release) |
| App Group | `group.` + Bundle ID | `group.com.example.myapp` |
| Asset | lowerCamelCase 语义名 | `brandPrimary`、`emptyStateIllustration` |
| 本地化 key | 使用自然语言源文案;需要结构化 key 时 `feature.screen.element` | `"feed.empty.title"` |
| accessibilityIdentifier | `feature.element` 或 `feature.element.index` | `"feed.refreshButton"` |
| Logger category | 模块名 | `Logger(subsystem: bundleID, category: "Feed")` |
| 测试 | 见 `testing.md` | |
