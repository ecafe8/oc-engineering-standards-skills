# 目录与边界

下列均为目标仓库根目录的相对路径。名称仅为示例，用实际项目名替换 `acme`；只创建当前需要的成员。

```text
mise.toml               # 工具版本、环境变量与任务
mise.lock               # 工具解析锁定；由 mise 生成
package.json            # Bun workspace、仓库级开发工具
bun.lock                # 全部 JS/TS 成员共用
tsconfig.json
biome.json
pyproject.toml          # uv workspace、仓库级测试依赖
uv.lock                 # 全部 Python 成员共用
.gitignore
README.md
AGENTS.md
apps/                   # 可运行的 TS 应用；按需创建
packages/
  core/
    package.json
    src/index.ts
    tests/core.test.ts
services/
  worker/
    pyproject.toml
    src/acme_worker/
      __init__.py
      __main__.py
    tests/test_worker.py
tests/                  # 跨模块测试；按需创建
scripts/                # 仓库维护脚本；按需创建
docs/                   # 项目文档；按需创建
.devcontainer/          # 可选开发容器
.github/workflows/      # 选择 GitHub CI 时创建
```

## 成员职责

- `apps/*`：启动入口与应用装配，可依赖 `packages/*`。
- `packages/*`：按能力拆分的 TS 包，不依赖应用入口；领域核心不依赖具体平台适配。
- `services/*`：Python 可安装包，是否常驻服务由需求决定。共享 Python 库也可加入独立的 `python-packages/*`，并更新 uv 成员列表。
- TS 与 Python 默认通过明确的进程或网络协议交互；目录相邻不代表可互相导入源码。
- Python 包发行名可用 `acme-worker`，导入名用 `acme_worker`，二者在打包配置中保持对应。
- 简单成员保持简单。需要业务模块分层时再引入 `modules/<domain>/`，不要为空示例预建 routes/controller/service 全套文件。

## 可选目录

- `examples/` 默认不加入工作区；只有可运行且需要共享依赖的示例才显式加入匹配规则。
- `sources/` 若作为外部只读参考区，排除于安装、格式检查、测试发现及发布。
- `test-data/fixtures/` 放输入资源，`test-data/outputs/` 放输出；较大数据不提交，容器输入可只读挂载。
- 不把 `**` 这样的无限递归模式作为 workspace 或测试的默认范围。

## 忽略规则

合并而非覆盖目标仓库 `.gitignore`。至少忽略 `node_modules/`、`.venv/`、`__pycache__/`、`.pytest_cache/`、`*.pyc`、构建产物和本地环境文件。保留可提交的 `.env.example`，提交根锁文件，不用通配规则误忽略所有 `*.lock`。

`AGENTS.md` 只记录稳定约定和命令入口；具体版本以配置为准，避免多处维护版本表。
