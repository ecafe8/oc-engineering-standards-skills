# 单元测试

## 框架选择

| 类型 | 框架 |
| --- | --- |
| 单元、集成测试(新代码) | Swift Testing(`import Testing`) |
| UI 测试、性能测试(`measure`) | XCTest / XCUITest |
| 快照测试(可选) | swift-snapshot-testing |
| 既有 XCTest 用例 | 保留,逐步迁移;同一 target 可共存 |

## 测试金字塔与范围

- **必须**:Core 层模型、映射、解码、业务规则;Feature 的状态模型(加载、错误、空态、用户操作);持久化迁移;权限与可用性分支(通过 Mock)。
- **推荐**:关键视图的快照(浅色/深色、大字号);App Intents 的 `perform()`。
- **不测**:SwiftUI 布局细节、系统框架本身行为。
- 覆盖率目标:Core ≥ 80%,Features ≥ 60%;以关键分支覆盖为准,不追求数字。

## 规则

- 每个 Package target 有对应测试 target:`FeedTests` 测 `Feed`。
- 测试文件 `<Type>Tests.swift`;Suite 为 `struct`,用 `@Suite("描述")`;测试名用可读描述:

```swift
@Suite("FeedModel")
@MainActor
struct FeedModelTests {
    @Test("加载成功后进入 loaded 状态")
    func loadSuccess() async throws {
        let model = FeedModel(client: MockFeedClient(result: .success([.fixture])))
        await model.load()
        #expect(model.state == .loaded([.fixture]))
    }

    @Test("解码不同状态码", arguments: [400, 404, 500])
    func httpErrors(status: Int) async {
        let model = FeedModel(client: MockFeedClient(result: .failure(.http(status))))
        await model.load()
        #expect(model.state.isFailed)
    }
}
```

- 使用 `#expect` 断言、`#require` 解包前置条件,`#expect(throws:)` 测试错误;参数化测试代替复制粘贴。
- 每个测试独立:在 `init` 中构建依赖,不共享可变全局状态;Swift Testing 默认并行运行,必须可并行。必须串行时使用 `.serialized` 并说明原因。
- 依赖用协议 Mock/Stub/Spy;不访问真实网络、真实钥匙串、真实模型、当前时间与随机数——注入 `Clock`、`Date` 提供者、UUID 生成器。
- 异步:直接 `await`;回调用 `confirmation`;禁止 `sleep`。
- 测试数据使用 `fixture` 静态工厂,放在测试 target 的 `Fixtures/` 中;JSON 样例作为测试资源。
- 用 `.tags(...)` 标记(如 `.network`、`.slow`),在测试计划中筛选;`.disabled("原因")` 必须写原因,`.bug(...)` 关联缺陷。
- 失败测试不得通过删除或弱化断言修复。

## 运行

```bash
swift test --parallel                         # 纯 Package
xcodebuild test -scheme MyApp -testPlan Unit \
  -destination 'platform=iOS Simulator,OS=latest,name=<iPhone 机型>' \
  -enableCodeCoverage YES -resultBundlePath build/Unit.xcresult
```
