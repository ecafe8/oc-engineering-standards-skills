# 双工作区与成员管理

以下路径相对目标仓库根目录，名称与兼容范围需按项目替换。

本文保留双工作区初始化所需的最小示例；单独维护 Python 项目或 workspace 时优先参考 `uv-standards`（若已安装），避免把此处示例目录当作通用强制约定。

## Bun

根 `package.json` 最小成员配置：

```json
{
  "name": "acme-workspace",
  "private": true,
  "workspaces": ["packages/*", "apps/*"]
}
```

仅有 `packages/` 时只声明它；根开发依赖按实际需要安装 TypeScript、Biome 和 Bun 类型。根测试脚本显式覆盖真实测试目录，不能为了没有测试时退出成功而启用掩盖缺失测试的选项。

`packages/core/package.json` 示例：

```json
{
  "name": "@acme/core",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": { ".": "./src/index.ts" }
}
```

消费者在自身 `dependencies` 写入 `"@acme/core": "workspace:*"`。别名不能替代真实依赖声明，也不能通过相对路径绕过包导出访问其他包内部代码。

新增成员后，从根执行 `mise exec -- bun install` 更新根锁文件，再执行冻结安装与测试。新增第三方依赖时，以目标成员为工作目录调用 `mise exec -- bun add <dependency>`；开发依赖使用 `--dev`，并检查只有预期清单和根锁文件变化。

## uv

根为不打包的工作区项目，示例：

```toml
[project]
name = "acme-workspace"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = []

[tool.uv]
package = false

[tool.uv.workspace]
members = ["services/*"]

[tool.pytest.ini_options]
testpaths = ["services"]
addopts = "--import-mode=importlib"
```

使用 `mise exec -- uv add --dev pytest` 把 pytest 加入根开发依赖组。示例的 Python 范围不是版本推荐；根据实际成员和解释器选择修改它。

每个匹配目录必须含 `pyproject.toml`。成员采用可安装的 `src` 布局，生成与所选 uv 版本兼容的 `[build-system]`，并验证 `uv sync --locked --all-packages` 能安装成员。可使用该 uv 版本的包初始化功能生成构建配置，再检查其是否意外添加独立 `.python-version`、锁文件或其他根配置。

关键语义：

- uv workspace 共用根 `uv.lock` 和默认根 `.venv/`，不是每个服务一个隔离环境。
- `uv lock` 解析整个工作区；根目录执行普通 `uv sync` 不等于安装所有成员，因此全仓库开发任务显式使用 `--all-packages`。
- 根统一测试用 `uv run --locked --all-packages pytest`，确保所有成员可导入。
- 单成员运行用 `uv run --locked --package acme-worker python -m acme_worker`；`--package` 的参数是发行名。
- 目标仓库已有路径式入口时可沿用 `uv run --locked --project services/worker ...`，`--project` 的参数是路径。两者都不能被解释为创建独立虚拟环境。
- Python 内部依赖同时声明 `project.dependencies` 中的包名与 `[tool.uv.sources]` 中的 `{ workspace = true }`，避免错误地从包索引取同名包。
- 成员使用的第三方依赖写入该成员；整个工作区能 import 不代表成员依赖已正确声明。

新增成员依赖，在根执行 `mise exec -- uv add --package acme-worker <dependency>`；检查成员清单与根 `uv.lock`，再运行目标测试和冻结安装。

## 故障判断

| 现象 | 先检查 | 处理方向 |
| --- | --- | --- |
| 冻结安装失败 | 清单与锁文件是否同步、工具版本是否一致 | 有意的依赖变更才重新生成锁文件；CI 不自动修复 |
| Python 成员无法导入 | 是否安装所有成员、构建后端和发行名/导入名 | 修正打包配置或安装范围，不添加全局路径绕过 |
| Python 版本不一致 | `UV_PYTHON`、mise 版本、既有 `.venv` 的基础解释器 | 修正选择后重新同步；需重建时仅处理已确认可再生环境 |
| 成员依赖冲突 | Python 范围交集和共同依赖约束 | 解决约束或改为独立项目，不能靠多个成员锁文件伪装共享工作区 |
| TS 包无法解析 | `workspace:*`、包名、`exports`、工作区范围 | 修正真实包依赖与导出，再检查类型配置 |

`--locked` 会检查 uv 锁文件是否需要更新；`--frozen` 跳过该一致性检查，不应作为解决锁不匹配的方法。缺少下载缓存不代表配置错误，记录网络/缓存阻塞后停止对应验证。

## 官方依据

- [Bun workspaces](https://bun.sh/docs/pm/workspaces)
- [Bun install](https://bun.sh/docs/pm/cli/install)
- [uv workspaces](https://docs.astral.sh/uv/concepts/projects/workspaces/)
- [uv 锁定与同步](https://docs.astral.sh/uv/concepts/projects/sync/)
