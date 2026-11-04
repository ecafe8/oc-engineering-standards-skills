# 初始化顺序与任务

下列配置位于目标仓库根目录。`{{BUN_VERSION}}` 等大写占位符必须替换为实际解析并验证的值，不能直接交付。mise 的 `{{ tools.python.path }}` 是运行期模板，应保留。

本文保留初始化所需的最小集成示例；日常 mise 工具、环境和任务维护优先参考 `mise-standards`，uv 依赖和环境维护优先参考 `uv-standards`（若已安装）。

## 1. 工具版本

用户指定版本优先；否则选择能满足成员依赖与目标平台的稳定版本，并记录解析结果。不要复制 Skill 创建时开发机上的版本作为永久默认值。

```toml
min_version = "{{MISE_MIN_VERSION}}"

[tools]
bun = "{{BUN_VERSION}}"
python = "{{PYTHON_VERSION}}"
uv = "{{UV_VERSION}}"

[env]
UV_PYTHON = { value = "{{ tools.python.path }}", tools = true }
UV_PYTHON_DOWNLOADS = "never"
```

mise 安装 Python；uv 显式选用该安装路径并禁止自行下载另一个解释器。上述动态环境语法必须在所选 mise 版本验证，`min_version` 填入已验证支持的版本。虚拟环境由 uv 创建，不同时启用另一套 venv 创建机制。

如 IDE 需要 `.python-version`，与 mise 的精确 Python 版本同步；它只是兼容文件，不是第二个版本来源。`requires-python` 则表达包兼容范围，不必固定为同一个补丁版本。

安装 mise 本身属于环境准备：若缺失，按官方文档和当前平台安装，或说明阻塞。对需要信任的项目配置先阅读内容，再按当前工具提示处理。

## 2. 配置语言工作区

先创建真实成员清单，再按 `workspaces.md` 配置根 workspace。根 `packageManager` 设置为 `bun@` 加精确 Bun 版本。

根 TypeScript 配置开启严格检查，按运行环境选择模块解析方式，包含实际成员与测试路径。面向 Bun 的源码包可导出 TS 源码；面向 Node 或 npm 消费者时补充真实构建与声明文件输出，不把源码直出称为通用发布方案。

Biome 配置及 TypeScript 参数按选定版本生成；不要从旧模板复制已废弃配置。质量任务使用显式路径列表，避免扫描引用仓库和产物。

## 3. 任务契约

建议采用以下任务。先确保每个委托命令存在，再添加任务：

| mise 任务 | 职责 |
| --- | --- |
| `install` | 从已提交锁文件安装双工作区 |
| `format` | 显式格式化，可修改文件 |
| `format-check` | 只检查格式，不修改文件 |
| `lint` | 运行已配置的静态规则检查 |
| `typecheck` | 运行 TypeScript 类型检查 |
| `test-ts` | 运行 Bun 测试，只发现 TS/JS 测试 |
| `test-python` | 运行 pytest，只发现 Python 测试 |
| `check` | 顺序运行格式、Lint、类型检查及两类测试 |
| `doctor` | 报告工具版本和 Python 解释器身份 |

根 `package.json` 的 `check:ts` 串联只读格式检查、Lint、类型检查和 TS 测试，`test:ts` 指定实际测试目录。不要把聚合 `check` 回调为自身，或让 Bun 再次执行 Python 测试。

mise 任务片段：

```toml
[tasks.install]
description = "按锁文件安装依赖"
run = ["bun install --frozen-lockfile", "uv sync --locked --all-packages"]

[tasks.test-ts]
description = "运行 TypeScript 测试"
run = "bun run test:ts"

[tasks.test-python]
description = "运行 Python 测试"
run = "uv run --locked --all-packages pytest"

[tasks.check]
description = "运行全部只读检查"
run = ["bun run check:ts", "uv run --locked --all-packages pytest"]

[tasks.doctor]
description = "报告工具版本与 Python 解释器"
run = [
  "mise --version",
  "bun --version",
  "uv --version",
  "python --version",
  "uv run --locked --all-packages python -c 'import sys; print(sys.version); print(sys.executable); print(sys.base_prefix)'",
]
```

数组按顺序执行，失败停止。根任务在根配置目录执行；引入成员级配置后重新检查工作目录。Windows 等目标平台需验证任务 shell 的引号行为，必要时把复杂命令移入跨平台脚本。

`format`、`format-check`、`lint`、`typecheck` 分别委托根对应 Bun 脚本。若增加 Python 格式检查工具，再扩充相应任务；没有配置 Python 类型检查时，不宣称 `typecheck` 覆盖 Python。

## 4. 首次解析与日常安装

初次创建仓库，没有锁文件时执行：

```bash
mise install
mise exec -- bun install
mise exec -- uv lock
mise run install
mise run check
mise run doctor
```

如所选 mise 支持所需后端锁定，执行 `mise lock` 并验证安装，提交生成的 `mise.lock`。若受平台或后端支持限制，保留精确工具版本并记录限制；不要手写工具下载地址或校验和。

语言锁文件由工具生成。记录冻结安装前后的 Git 差异或文件摘要，确认 `mise run install` 不改写锁文件。

新机器及 CI 只需执行 `mise install`、`mise run install`、`mise run check`、`mise run doctor`。更新依赖时才有意重新解析锁文件；不要在每次检查前执行升级。

## 官方依据

- [mise Python 与 uv 集成](https://mise.jdx.dev/lang/python.html#mise-uv)
- [mise TOML 任务](https://mise.jdx.dev/tasks/toml-tasks.html)
- [mise 锁文件](https://mise.jdx.dev/dev-tools/mise-lock.html)

这些链接是滚动文档；使用时结合实际版本核对，不把最新语法直接套用到旧工具链。
