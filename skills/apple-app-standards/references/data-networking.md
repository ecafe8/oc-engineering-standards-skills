# 数据持久化与网络

## 持久化选型

| 数据 | 方案 |
| --- | --- |
| 少量偏好设置 | `@AppStorage` / `UserDefaults`(非敏感) |
| 秘密、令牌 | Keychain |
| 结构化本地数据 | SwiftData(新项目默认);复杂需求或既有项目用 Core Data |
| 文件、缓存 | `FileManager`,缓存放 Caches 目录,可再生数据不备份 |
| 跨设备同步 | CloudKit / SwiftData CloudKit 集成;键值 `NSUbiquitousKeyValueStore` |
| App 与扩展共享 | App Group 容器 |

### SwiftData

- `@Model` 放在 Core/Persistence;视图用 `@Query`,写操作通过封装的仓储或 `ModelContext`。
- 后台批量处理使用 `@ModelActor`;跨 actor 只传 `PersistentIdentifier`,不传模型实例。
- 模型变更使用 `VersionedSchema` + `SchemaMigrationPlan`;发布前用旧版本数据验证迁移。
- 测试与预览使用 `ModelConfiguration(isStoredInMemoryOnly: true)`。

## 网络

- 使用 `URLSession` 的 async API;定义 `APIClient` 协议,Endpoint 用类型描述(路径、方法、请求体、响应类型)。
- 统一错误类型:传输错误、HTTP 状态、解码错误、业务错误分开;对用户展示本地化文案。
- 仅 HTTPS(ATS 默认开启,不添加全局例外);敏感服务考虑证书固定(公钥)。
- 设置超时;幂等请求可指数退避重试;尊重取消。
- 大文件使用下载任务与后台 `URLSession` 配置。
- 监听网络状态用 `NWPathMonitor`,不在请求前阻断——以实际请求结果为准。
- 第三方网络库仅在确有必要时引入。

## Codable

- DTO 与领域模型分离;DTO 在 Networking 层映射为领域模型。
- 共享配置好的 `JSONDecoder`(日期策略、`keyDecodingStrategy`);字段不一致时使用 `CodingKeys`。
- 可选字段显式 `Optional`;未知枚举值提供降级 case,避免整体解码失败。
- 解码代码有基于 JSON 样例的单元测试。
