# macOS 官网分发与 Sparkle 更新

默认渠道:macOS App 通过官网以 Developer ID 签名分发,使用 [Sparkle 2](https://sparkle-project.org/documentation/) 自动更新。项目已上 Mac App Store 或已有其他更新方案时以项目为准。Sparkle 配置项和工具参数随版本变化,接入前用 Context7(`/websites/sparkle-project`)或官网核对。

## 1. 渠道与 target

| 渠道 | 更新方式 | 要求 |
| --- | --- | --- |
| 官网(默认) | Sparkle 2 | Developer ID 签名、Hardened Runtime、公证、HTTPS |
| Mac App Store(可选) | App Store 自带 | **禁止**包含 Sparkle 或任何自更新机制 |

- 只走官网:一个 macOS target 直接依赖 Sparkle(SPM:`https://github.com/sparkle-project/Sparkle`,锁定 2.x 版本)。
- 同时上商店:两个 target 共享源码。官网 target 设置编译条件 `SPARKLE` 并链接 Sparkle;商店 target 不链接 Sparkle,`Info.plist` 中也不含 `SU*` 键。归档后检查商店包:`otool -L <App>.app/Contents/MacOS/<App> | grep -i sparkle` 应无输出。
- Sparkle 2.10+ 要求 macOS 12+,与默认基线(macOS 26)兼容。

## 2. 代码结构

更新能力和其他系统能力一样封装在协议后,业务代码不直接 import Sparkle:

```swift
// Core/SystemServices
@MainActor
protocol AppUpdater: AnyObject, Observable {
    var canCheckForUpdates: Bool { get }
    var automaticallyChecksForUpdates: Bool { get set }
    func checkForUpdates()
}

@MainActor @Observable
final class NoopUpdater: AppUpdater {   // 商店版、测试、预览
    var canCheckForUpdates = false
    var automaticallyChecksForUpdates = false
    func checkForUpdates() {}
}
```

```swift
// App/macOS(仅官网 target)
#if SPARKLE
import Sparkle

@MainActor @Observable
final class SparkleUpdater: AppUpdater {
    private let controller = SPUStandardUpdaterController(
        startingUpdater: true, updaterDelegate: nil, userDriverDelegate: nil)
    private var observation: NSKeyValueObservation?
    private(set) var canCheckForUpdates = false

    init() {
        observation = controller.updater.observe(\.canCheckForUpdates, options: [.initial, .new]) { [weak self] updater, _ in
            MainActor.assumeIsolated { self?.canCheckForUpdates = updater.canCheckForUpdates }
        }
    }

    var automaticallyChecksForUpdates: Bool {
        get { controller.updater.automaticallyChecksForUpdates }
        set { controller.updater.automaticallyChecksForUpdates = newValue }
    }

    func checkForUpdates() { controller.updater.checkForUpdates() }
}
#endif
```

- 在 App 层创建一次并通过 `@Environment` 注入;不要在多个地方创建 `SPUStandardUpdaterController`。
- 入口:App 菜单中"检查更新…"(`CommandGroup(after: .appInfo)`,按钮按 `canCheckForUpdates` 禁用),`Settings` 中提供"自动检查更新"开关。
- 菜单栏/后台类 App 实现 `SPUStandardUserDriverDelegate` 的 gentle reminders,避免更新窗口在后台突然弹出。
- 需要按频道(beta)分发时,通过 `SPUUpdaterDelegate` 的 `allowedChannels(for:)` 返回用户选择的频道。
- 深度自定义 UI 才实现 `SPUUserDriver`;默认用标准 UI。

## 3. Info.plist 与 entitlements

| 键 | 值 / 说明 |
| --- | --- |
| `SUFeedURL` | HTTPS appcast 地址;按环境由 xcconfig 注入 |
| `SUPublicEDKey` | `generate_keys` 输出的 EdDSA 公钥 |
| `SUEnableAutomaticChecks` | `YES`,首次启动不再询问(或保留询问,按产品决定) |
| `SUScheduledCheckInterval` | 检查间隔秒数,默认 86400 |
| `SUVerifyUpdateBeforeExtraction` | `YES`,解压前校验签名 |
| `SURequireSignedFeed` | `YES`,appcast 和发布说明也需签名(Sparkle 2.9+) |
| `SURequireFeedBundleIdentifier` | 可用时开启,防止跨产品降级(2.11+,上线前确认版本) |
| `CFBundleVersion` | 必须单调递增,Sparkle 用它比较版本 |

沙盒 App 额外需要(不沙盒则跳过):

- `SUEnableInstallerLauncherService = YES`。
- entitlements 中 `com.apple.security.temporary-exception.mach-lookup.global-name` 添加 `$(PRODUCT_BUNDLE_IDENTIFIER)-spks`、`$(PRODUCT_BUNDLE_IDENTIFIER)-spki`。
- App 已有 `com.apple.security.network.client` 时**不要**启用 Downloader XPC 服务;只有确实不需要网络权限时才设 `SUEnableDownloaderService = YES`(发布说明视图有已知限制)。

官网渠道的 App 是否开启沙盒由产品决定;开启沙盒更安全,但按上述配置额外处理。

## 4. 签名、打包与公证

1. `xcodebuild archive` + `xcodebuild -exportArchive`(Developer ID 方式)。走 Xcode 归档导出才能正确重签 Sparkle 内部的 XPC 服务和辅助工具;不要手工只签外层 App。
2. 打包为 dmg(推荐,内含 `/Applications` 链接)或只含 App 的 zip/`aar`,减少 App Translocation 问题。
3. `xcrun notarytool submit --wait`,然后 `xcrun stapler staple`。
4. 校验:`codesign --verify --deep --strict`、`spctl --assess --type execute`。

## 5. 发布 appcast

1. 把新版本压缩包放入保存历史版本的更新目录(目录需保留旧包,才能生成增量包)。
2. 同名 `.html` 或 `.md` 文件作为发布说明,本地化可提供多语言版本。
3. 运行 `generate_appcast <更新目录>`:生成或更新 appcast、EdDSA 签名、`*.delta` 增量包;开启签名 feed 时同时签名 appcast 与发布说明。之后修改 appcast 必须重新运行,不要手工编辑。
4. 上传压缩包、delta、发布说明、appcast 到 HTTPS 静态服务器或 CDN;appcast 最后上传,避免指向不存在的文件。
5. 用上一个正式版本实际执行一次自动更新验证。

appcast 条目可选控制:

- `sparkle:minimumSystemVersion`:新版本要求的最低 macOS,低于该版本的用户停留在旧版。
- `sparkle:phasedRolloutInterval`:灰度放量间隔,默认对新版本启用。
- `sparkle:criticalUpdate`:安全修复等关键更新,谨慎使用。
- `sparkle:channel`:beta 等频道,未标记的为默认正式频道。

## 6. 密钥与安全

- EdDSA 私钥由 `generate_keys` 生成并存入发布机 Keychain;CI 通过 `-x` 导出后存入 CI Secret,运行时用 `-f`/`--ed-key-file` 导入。**不得**提交到仓库,也不放在托管更新文件的服务器上。
- 私钥丢失时按官方密钥轮换流程处理(Developer ID 签名的 App 可轮换);离线保存一份加密备份。
- 只通过 HTTPS 提供 appcast 和更新包,不添加 ATS 例外。
- Sparkle 本身也要跟进安全版本升级,升级时阅读其发布说明。

## 7. CI 流水线

官网发布流水线:lint/测试 -> 归档导出(Developer ID)-> 打包 dmg -> 公证 + staple -> 签名校验 -> `generate_appcast` -> 上传(appcast 最后)-> 用旧版本冒烟验证更新。证书、App Store Connect API Key(公证用)、EdDSA 私钥都存放在 CI Secret。

## 8. 测试

- 单元测试使用 `NoopUpdater` 或 Mock,不访问真实 appcast。
- 发布前用测试 appcast(单独的 `SUFeedURL`,由 Staging xcconfig 注入)在干净的 Mac 上验证:手动检查、自动检查、增量更新、全量更新、跳过版本、降级保护、灰度。
- 检查异常场景:App 在 dmg 内或只读位置运行、App Translocation、无网络、签名不匹配(应拒绝安装)。Sparkle 默认在无法更新时不提示,产品如需提示,在 delegate 中处理。

## 9. 不推荐的方案

- **自己写下载替换逻辑**:原子替换、权限、重启、回滚、签名校验、降级攻击都需要自己实现,风险高。
- **Squirrel.Mac**:主要服务 Electron 生态,原生 Swift App 没有理由选择。
- **只提示新版本并跳转官网**:仅适合更新极少或企业内部分发,体验较差。
- 企业受管设备可通过 MDM 推送 `pkg`,与 Sparkle 二选一,避免冲突。
