# 构建配置、签名与发布

## 构建配置

- 配置:`Debug`、`Staging`(可选)、`Release`;差异写在 `Configs/*.xcconfig`,不在 Build Settings 界面散改。
- 环境值(API 地址、功能开关)通过 xcconfig -> `Info.plist` 变量 -> 类型安全的 `AppConfiguration` 读取;不使用大量 `#if DEBUG` 分支切换业务。
- 不同环境使用不同 Bundle ID 后缀与图标,便于并存安装。
- `Info.plist`、entitlements 纳入版本控制并审阅变更。

## 签名

- 开发使用自动签名;团队/CI 使用 App Store Connect API Key 或 fastlane match 统一管理。
- 证书、描述文件、`.p8` 密钥不入库。
- 能力(Push、App Groups、iCloud、HealthKit 等)在开发者后台、entitlements 与各 target 保持一致。

## 版本

- `MARKETING_VERSION` 使用语义化版本 `主.次.修订`;`CURRENT_PROJECT_VERSION` 单调递增(CI 构建号或时间戳)。
- 主 App 与所有扩展、Watch App 版本号一致。
- 维护 `CHANGELOG`,发布说明本地化。

## macOS 官网分发

macOS 默认通过官网分发:Developer ID 签名、公证、dmg 打包、Sparkle 2 自动更新。完整流程、appcast 发布、密钥管理与测试见 `macos-distribution.md`。以下"发布流程"适用于 iOS/iPadOS/watchOS 及选择上 Mac App Store 的 macOS App。

## 发布流程

1. 主干通过全部 CI 门禁。
2. `xcodebuild archive` 或 Xcode Cloud 归档,上传 dSYM。
3. TestFlight 内部测试 -> 外部测试(需 Beta 审核)。
4. 提交前清单:
   - 隐私清单、隐私标签、权限用途说明一致。
   - 截图与预览覆盖所有支持设备尺寸与主要语言;适配了 iPhone Duo 时上传其截图以获得"已优化"标识。
   - 演示账号与审核备注(需要登录时)。
   - 内购在 App Store Connect 配置并通过沙盒测试。
   - 删除调试菜单、测试后门(只在测试构建编译)。
5. 分阶段发布(Phased Release),观察 Organizer 崩溃与 MetricKit 指标。

## 常见审核风险

- 有第三方登录但未提供 Sign in with Apple(4.8)。
- 提供账号注册但无法在 App 内删除账号(5.1.1)。
- 数字商品未使用内购(3.1.1)。
- 权限用途说明模糊或启动即请求权限(5.1.1)。
- 功能不完整、占位内容、崩溃(2.1)。
- 隐私标签与实际数据收集不符(5.1.2)。

## 用户体验运营

- 评分请求使用 `@Environment(\.requestReview)`,在用户完成正向操作后调用,不在启动时、不在错误后。
- 新功能提示使用 TipKit,控制频率。
