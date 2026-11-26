# Swift 6 并发

## 构建设置

- `SWIFT_VERSION = 6`;Xcode 27.1 编译器为 Swift 6.4。Package 使用 `swift-tools-version: 6.2` 及以上(与团队最低 Xcode 对齐,推荐 6.4),默认 Swift 6 模式。
- App target 与 UI 相关模块(Swift 6.2+):`SWIFT_DEFAULT_ACTOR_ISOLATION = MainActor`、`SWIFT_APPROACHABLE_CONCURRENCY = YES`;Package 中对应 `.defaultIsolation(MainActor.self)`。网络、持久化等非 UI 模块保持 `nonisolated` 默认。
- 迁移旧项目:先 Swift 5 模式 + `SWIFT_STRICT_CONCURRENCY = complete` 清理警告,逐模块切换到 Swift 6。

## 规则

- UI 类型(视图模型、导航、协调器)标注 `@MainActor`;视图本身已隔离到主 actor。
- 跨隔离域传递的类型必须 `Sendable`:优先值类型;引用类型用 `final class` + 不可变属性,或 actor,或 `Mutex`(Synchronization 框架)保护状态。
- `@unchecked Sendable`、`nonisolated(unsafe)`、`@preconcurrency import` 仅作过渡,必须附注原因与移除计划。
- CPU 密集工作移出主 actor:`@concurrent` 函数(6.2+)或独立 actor,不用 `Task.detached` 作为默认手段。
- 使用结构化并发:`async let`、`withTaskGroup`、`withThrowingDiscardingTaskGroup`;视图中的异步工作用 `.task`/`.task(id:)`,随视图生命周期自动取消。
- 非结构化 `Task {}` 需有持有者并在适当时机 `cancel()`;长循环检查 `Task.isCancelled` / `try Task.checkCancellation()`。
- actor 方法中 `await` 之后不要假设状态未变(重入);在 await 前后重新读取状态。
- 回调 API 转换:`withCheckedThrowingContinuation`,确保每条路径恰好 resume 一次;事件流用 `AsyncStream`,设置 `onTermination` 清理资源。
- 不在 actor 或主线程上使用阻塞调用(`semaphore.wait()`、同步网络)。
- Combine 仅用于既有代码;新代码使用 `AsyncSequence` 与 Observation。

## 示例

```swift
actor ImageCache {
    private var storage: [URL: Data] = [:]

    func data(for url: URL, loader: @Sendable (URL) async throws -> Data) async throws -> Data {
        if let cached = storage[url] { return cached }
        let data = try await loader(url)
        storage[url] = data   // 重入:重新写入是幂等的
        return data
    }
}
```

## 测试

- 异步测试直接 `async`;用 `confirmation` 验证回调次数;不使用 `sleep` 等待。
- 主 actor 代码的测试函数或 Suite 标注 `@MainActor`。
- 开启 Thread Sanitizer 运行一次完整测试计划(见 `ui-automation.md`)。
