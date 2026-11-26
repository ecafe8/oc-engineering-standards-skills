# Lint 与格式化

## 工具分工

| 工具 | 职责 | 配置 |
| --- | --- | --- |
| swift-format(Apple 官方,Xcode 16+ 内置 `swift format`) | 格式化与基础风格 | `.swift-format`(模板 `assets/.swift-format`) |
| SwiftLint | 语义与最佳实践规则 | `.swiftlint.yml`(模板 `assets/.swiftlint.yml`) |
| Swift 编译器 | 并发检查、警告即错误 | 构建设置 |
| Xcode Analyze | 静态分析 | `xcodebuild analyze` |
| Periphery(可选) | 未使用代码 | `.periphery.yml` |

项目已使用 SwiftFormat(nicklockwood)时保留,不同时启用两个格式化器;以统一结果为准。

## 规则

- 缩进 4 空格,行宽 120;尾随逗号开启;import 排序。
- 禁止:强制解包 `!`、`try!`、强制类型转换 `as!`(测试与 `IBOutlet` 遗留除外)、隐式解包可选值、`print`/`NSLog`(使用 `Logger`)、`fatalError` 于非不可达路径。
- 函数体 ≤ 50 行、类型体 ≤ 300 行、文件 ≤ 500 行、圈复杂度 ≤ 10(警告),超过须拆分或注明理由。
- 禁用规则时使用最小范围:`// swiftlint:disable:next <rule>` 并写明原因;不在文件顶部整体关闭。
- 文档注释:公开 API(Package 中 `public`)使用 `///`,包含参数、返回、抛出说明。
- 访问控制:默认最小可见性;Package 中仅导出必要符号;类型默认 `final`。

## 编译器设置

| 设置 | Debug | Release |
| --- | --- | --- |
| `SWIFT_TREAT_WARNINGS_AS_ERRORS` | NO | YES |
| `GCC_TREAT_WARNINGS_AS_ERRORS` | NO | YES |
| `SWIFT_STRICT_CONCURRENCY` | complete | complete |
| `ENABLE_USER_SCRIPT_SANDBOXING` | YES | YES |

## 执行方式

- 本地:Xcode Build Phase 运行 SwiftLint(或 SwiftLint Build Tool Plugin),仅警告不阻断调试。
- 提交前:pre-commit / lefthook 运行 `swift format lint --strict` 与 `swiftlint lint --strict` 于暂存文件。
- CI:全量 `--strict`,任何违规失败。
- 工具版本固定(mise、Mint 或 SPM plugin),避免本地与 CI 规则不一致。

```bash
swift format format --in-place --recursive Sources Tests
swift format lint --strict --recursive Sources Tests
swiftlint lint --strict --reporter github-actions-logging
```
