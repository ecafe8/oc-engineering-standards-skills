# 安全与隐私

## 隐私清单与声明

- App 与每个含 Required Reason API 的 target/SDK 提供 `PrivacyInfo.xcprivacy`:收集的数据类型、是否用于追踪、追踪域名、Required Reason API 及理由代码。
- 第三方 SDK 必须自带签名的隐私清单;归档后用 Xcode 的 Privacy Report 核对。
- App Store Connect 的隐私营养标签与清单、实际行为一致。
- 跨 App 追踪前请求 ATT(`ATTrackingManager.requestTrackingAuthorization`),未授权不访问 IDFA、不向追踪域名发数据。
- 权限用途字符串具体、真实、本地化。

## 数据保护

- 令牌、密码、密钥存 Keychain,选择最严格可用的 `kSecAttrAccessible`(如 `AfterFirstUnlockThisDeviceOnly`)。
- 不在源码、`Info.plist`、xcconfig 提交服务端密钥;客户端只放可公开的标识,敏感调用走自有后端。
- 文件使用 Data Protection(`.completeUnlessOpen` 等);敏感缓存不进入 iCloud 备份。
- 生物识别使用 LocalAuthentication,作为便利层而非唯一安全边界;关键操作服务端校验。
- 剪贴板、截图敏感页面(如支付)按需隐藏内容(`privacySensitive()`、切到后台时遮盖)。
- 深链接与 URL scheme 输入视为不可信,校验参数;优先 Universal Links。
- WebView 不注入敏感数据,限制可导航域名。

## 网络安全

- ATS 保持开启,不添加 `NSAllowsArbitraryLoads`;例外需按域名且说明原因。
- 高安全业务考虑公钥固定,并有轮换方案。

## 日志

```swift
import OSLog

extension Logger {
    static let feed = Logger(subsystem: Bundle.main.bundleIdentifier ?? "app", category: "Feed")
}

Logger.feed.info("Loaded \(items.count) items for user \(userID, privacy: .private)")
```

- 使用 `Logger`(OSLog);禁止 `print`。
- 用户数据默认 `.private`,只有非敏感值才 `.public`;不记录令牌、密码、完整请求体。
- 级别:`debug`(开发细节)、`info`、`notice`(默认)、`error`、`fault`(程序错误)。

## 依赖与供应链

- 只使用 SPM;提交 `Package.resolved`;依赖锁定到版本范围,升级时审阅变更。
- 引入第三方依赖前评估维护状态、许可证、隐私清单与二进制签名。
