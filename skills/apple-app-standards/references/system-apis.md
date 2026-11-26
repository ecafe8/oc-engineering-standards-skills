# 系统 API 调用规范

## 通用流程

1. **封装**:在 `Core/SystemServices` 定义 `Sendable` 协议,Live 实现调用系统框架,测试与预览使用 Mock。视图不直接调用系统单例。
2. **声明**:`Info.plist` 写清用途字符串(`NS*UsageDescription`),说明对用户的价值,本地化;在 Signing & Capabilities 中添加 entitlements;后台能力加入 `UIBackgroundModes`。
3. **按需请求**:在用户触发相关功能时请求权限,必要时先展示自定义说明页;不在启动时集中弹窗。
4. **状态全覆盖**:处理 notDetermined、authorized、denied、restricted、limited/provisional;被拒后引导到设置(`UIApplication.openSettingsURLString` / `openURL`)。
5. **隐私清单**:使用 Required Reason API(UserDefaults、文件时间戳、磁盘空间、系统启动时间等)需在 `PrivacyInfo.xcprivacy` 声明。
6. **异步优先**:使用框架提供的 async API;只有 delegate/回调的,用 `withCheckedThrowingContinuation` 或 `AsyncStream` 包装,保证 continuation 恰好恢复一次。

```swift
protocol LocationService: Sendable {
    func authorizationStatus() async -> LocationAuthorization
    func requestWhenInUse() async -> LocationAuthorization
    func updates() -> AsyncThrowingStream<Coordinate, Error>
}
```

## 各框架要点

| 能力 | 推荐 API | 要点 |
| --- | --- | --- |
| App Intents / Siri / 快捷指令 / Spotlight | `AppIntent`、`AppEntity`、`AppShortcutsProvider`、`IndexedEntity` | 核心动作都暴露为 Intent;Intent 逻辑复用 Core 服务;实体提供 `displayRepresentation`;Apple Intelligence、Visual Intelligence、控制中心、Action 按钮均基于 App Intents |
| 小组件 | WidgetKit、`AppIntentConfiguration` | 时间线轻量;数据通过 App Group 共享;交互用 `Button(intent:)`;适配 accented/玻璃渲染模式 |
| 实时活动 | ActivityKit | 由 App 或推送更新;遵守更新频率与时长限制;Watch 与灵动岛布局 |
| 控件 | `ControlWidget`(iOS 18+) | 控制中心、锁屏、Action 按钮 |
| 通知 | UserNotifications | `requestAuthorization` 按需;支持 provisional;分类与动作;通知服务扩展处理富媒体;Time Sensitive 需 entitlement |
| 后台 | BackgroundTasks、`.backgroundTask` 修饰符 | 注册标识符写入 `BGTaskSchedulerPermittedIdentifiers`;可中断、可续传;26 起长任务用 `BGContinuedProcessingTask` 并报告进度 |
| 内购 | StoreKit 2 | `Product.products(for:)`、`purchase()`、监听 `Transaction.updates`;交易 `finish()`;SwiftUI 用 `StoreView`/`SubscriptionStoreView`;本地 `.storekit` 配置测试 |
| 登录 | AuthenticationServices | Sign in with Apple、Passkeys(`ASAuthorizationPlatformPublicKeyCredentialProvider`);有第三方登录时须提供 Sign in with Apple |
| 钥匙串 | Security | 封装 `KeychainStore`;合理设置 `kSecAttrAccessible`;共享用 Keychain Group |
| 照片 | PhotosUI | 优先 `PhotosPicker`(无需权限);仅需完整库访问时才请求 PhotoKit 权限并处理 limited |
| 相机 | AVFoundation | 会话在非主线程配置;处理中断与权限 |
| 定位 | CoreLocation | `CLLocationUpdate.liveUpdates()`、`CLMonitor`;最低精度与 when-in-use 优先 |
| 健康 | HealthKit | 先 `isHealthDataAvailable()`;最小数据类型集;读权限状态不可得,按无数据处理 |
| 地图 | MapKit for SwiftUI | `Map`、`Marker`、`MapCameraPosition` |
| 分享 | `ShareLink`、`Transferable` | 自定义类型实现 `Transferable`,也用于拖放与复制粘贴 |
| 网页 | `WebView`/`WebPage`(26+)、`SFSafariViewController` | 登录用 `ASWebAuthenticationSession` |
| 云同步 | CloudKit、SwiftData `ModelConfiguration(cloudKitDatabase:)` | 模型属性可选或有默认值;不使用唯一约束 |
| 文件 | `fileImporter`/`fileExporter`、`DocumentGroup` | 安全作用域 URL 成对 start/stop |
| 触感 | `.sensoryFeedback` | 不在 macOS/watchOS 假设相同硬件 |
| 打开系统设置/URL | `@Environment(\.openURL)` | |

## 扩展(Extension)

- 每个扩展是独立 target,共享代码通过 Package;共享数据通过 App Group 容器与共享 Keychain。
- 扩展内存与时长受限,不链接重量级依赖,不做长时间网络请求。
- Bundle ID 以主 App ID 为前缀;版本号与主 App 一致。
