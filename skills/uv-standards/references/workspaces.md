# workspace、依赖与锁文件

以下是概念示例，不要求所有项目采用此目录或版本。命令以目标 workspace 根目录为工作目录，版本相关选项先查目标 uv 文档；若项目通过 mise 调用 uv，使用项目已有入口或 `mise exec --`。

## 成员和内部依赖

```toml
# 根 pyproject.toml 片段
[tool.uv.workspace]
members = ["services/*"]
```

```toml
# services/worker/pyproject.toml 片段
[project]
name = "acme-worker"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = ["acme-common"]

[tool.uv.sources]
acme-common = { workspace = true }
```

`acme-common` 必须是实际 workspace 成员的发行名；构建配置和兼容范围按实际项目填写。内部依赖同时存在于依赖列表和 source 映射中，避免从索引解析同名包。新增成员时检查 glob 匹配、其 `pyproject.toml` 与包发现；如项目还有其他语言的 workspace，同步检查排除规则。

## 常见操作

```bash
uv add --package acme-worker <dependency>  # 修改目标成员及工作区锁文件
uv lock --check                            # 检查锁文件与清单一致性
uv sync --locked --all-packages            # 锁定同步所有成员
uv run --locked --package acme-worker pytest
```

将包名和依赖替换为实际值，检查成员是否声明测试工具及测试发现范围。`--package` 选择发行名，`--project` 接受项目路径；两者用途不同。对单成员操作，不要无意修改其他成员依赖；审查 `uv.lock` 的解析变化。只在有意更新依赖时运行会变更清单或锁文件的命令。

默认 `uv run` / `uv sync` 的安装范围不是“工作区所有成员”；按目标操作选择。`uv lock --check` 不更新锁文件，但其他命令仍可能修改环境或缓存。`--locked` 在锁需要更新时失败；`--frozen` 跳过该一致性检查，仅用于经确认需要该行为的情况，例如缺少完整成员清单的某些容器中间层；最终仍应有完整一致性验证。

## 官方依据

- [uv workspaces](https://docs.astral.sh/uv/concepts/projects/workspaces/)
- [管理依赖](https://docs.astral.sh/uv/concepts/projects/dependencies/)
- [锁定与同步](https://docs.astral.sh/uv/concepts/projects/sync/)
