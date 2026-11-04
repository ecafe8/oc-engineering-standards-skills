# 工具、锁文件与环境

以下示例仅说明职责；先按目标项目的 mise 版本查验语法与支持范围。实际值来自用户要求、平台兼容性和目标仓库，而非示例。

## 工具与锁文件

- `mise.toml` 中的 `[tools]` 声明所需工具；修改前检查嵌套或其他生效配置，以及项目内可能重复声明的版本。
- `mise.lock` 记录 mise 的工具解析结果；`uv.lock`、`bun.lock` 等各管自己的应用依赖。工具锁文件的生成及锁定安装以所选版本和后端支持为前提。
- 新项目按需要解析和安装；已有项目升级前确认范围、评估兼容性，审查配置与锁文件差异并运行针对性检查。不可为了修复检查而擅自升级所有工具。
- 锁文件不保证离线安装、系统依赖、硬件或跨平台构建产物一致。缺少网络、凭据或平台资源要明确报告。

## 与 uv 的可选集成

只有目标项目选择 mise 管理解释器时才采用：

```toml
[tools]
python = "<已验证的版本>"
uv = "<已验证的版本>"

[env]
UV_PYTHON = { value = "{{ tools.python.path }}", tools = true }
UV_PYTHON_DOWNLOADS = "never"
```

将占位符替换为实际验证的版本；模板语法与 `UV_PYTHON_DOWNLOADS` 行为须对目标版本核对。此配置要求 mise 提供可用解释器，uv 不再自行下载；缺少解释器时应报告或按用户授权安装，而非悄悄切换来源。uv 负责项目环境与依赖；`requires-python` 是包的兼容范围，不等同于工具固定版本。若已有 `.venv`，检查其基础解释器；重建环境前确认目标可再生且用户允许，不删除不明数据。

## 环境和安全

- 配置默认值时避免提交令牌、连接串和其他敏感值；公开示例仅放占位符。阅读任务及模板后再授予信任。
- 明确本地、CI 和容器如何注入变量与加载文件；避免展示完整环境或秘密文件。路径、外部二进制、浏览器、模型和缓存按项目实际约定处理。
- 配置模板、任务目录、shell 引号等有版本和平台差异，复杂逻辑可放项目脚本并在目标平台验证。

## 官方依据

- [mise 配置](https://mise.jdx.dev/configuration.html)
- [mise 工具锁文件](https://mise.jdx.dev/dev-tools/mise-lock.html)
- [mise Python 与 uv 集成](https://mise.jdx.dev/lang/python.html#mise-uv)
- [mise 信任与安全](https://mise.jdx.dev/security.html)
