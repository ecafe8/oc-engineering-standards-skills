---
name: monorepo-bootstrap
description: 使用 mise、Bun 和 uv 初始化 TypeScript + Python 多语言 Monorepo（单仓多包）。适用于创建仓库脚手架、规划双 workspace、生成根锁文件及统一本地/CI/开发容器入口，也适用于扩展或修复这套初始化方案。纯 mise 工具维护可选参考 mise-standards，纯 uv 项目维护可选参考 uv-standards；本 Skill 单独安装也包含完整双工作区初始化所需的核心指引。普通业务代码修改不需要加载本 Skill。
compatibility: 需要文件编辑和终端能力；安装与生成锁文件需要 mise、包索引或可用缓存。命令须在目标仓库执行，工具版本按目标平台与依赖兼容性选择。
---

# 多语言 Monorepo 初始化

交付一个能实际安装、运行和检查的最小仓库：mise 管理工具版本与任务，Bun 管理 TypeScript 工作区，uv 管理 Python 工作区。先观察目标仓库，再生成所需结构，最后用真实命令验证。

## 参考文件导航

以下参考路径均相对本 `SKILL.md` 所在的 Skill 目录；单独安装或移植时需保留该目录中的 `references/` 与 `evals/` 子目录。目标项目路径在正文中单独标注。

- 规划目录时读取 `references/layout.md`。
- 选择版本、配置任务和初始化时读取 `references/bootstrap.md`。
- 配置成员与依赖、处理安装问题时读取 `references/workspaces.md`。
- 需要 CI（持续集成）、开发容器或环境分层时读取 `references/environments.md`。
- Skill 场景评估见 `evals/evals.json`。

本 Skill 负责完整双工作区的初始化和集成顺序，并包含所需的 mise 与 uv 核心配置指引。单独维护 mise 工具版本、环境或任务时，`mise-standards` 是可选补充；单独维护 Python 依赖、workspace 或环境时，`uv-standards` 是可选补充。任一 Skill 未安装时，使用本目录中的参考文件和目标工具官方文档继续工作；不得把跨 Skill 引用当成前置条件，也不要将其他项目的约定强加到目标仓库。

## 1. 判断目标与现状

1. 确认目标仓库路径。所有后续命令以该目录为工作目录，不把当前 Agent 所在仓库自动当成目标。
2. 阅读目标仓库的 `AGENTS.md`、Git 状态、现有配置、锁文件和已有目录。已有内容采用增量修改；保留用户工作。
3. 从用户需求提取：项目名与包作用域、初始应用/包/服务、Python 兼容范围、目标平台、是否需要 CI/开发容器。
4. 只询问会改变结构的缺失信息。其余采用下列默认值，简要说明后继续执行。

| 事项 | 新仓库默认选择 |
| --- | --- |
| 结构 | `apps/` 放 TS 应用，`packages/` 放 TS 共享包，`services/` 放 Python 包 |
| 初始成员 | 用户指定的最小成员；未指定时创建一个 TS 核心包和一个 Python 示例包 |
| Python 所有权 | mise 安装解释器，uv 管理根 `.venv/`、依赖与锁文件 |
| 质量工具 | TypeScript + Biome + bun:test；Python 使用 pytest |
| 工具版本 | 选择可安装、相互兼容的稳定版本，最终写入精确版本 |
| 扩展项 | CI、开发容器、Python 格式检查工具按需求加入 |

若已有 npm/pnpm/Poetry 等配置，先判断请求是否包含迁移。初始化同类工具配置不能悄悄变成包管理器迁移。若 Python 成员依赖或解释器要求不能共同解析，说明冲突并确认是否使用独立项目，而不是强塞进共享 uv workspace。

## 2. 固定职责与目录边界

- mise 负责 Bun、uv、Python 及必要工具的版本和统一任务入口；默认不额外安装 Node，只有目标工具确实需要时才加入。
- Bun 负责 JS/TS 成员与根 `bun.lock`；uv 负责 Python 成员与根 `uv.lock`。两个 workspace 共处一个仓库，但不是同一依赖解析器。
- `mise.lock` 记录工具解析结果，不能代替语言依赖锁文件。按实际 mise 版本和后端支持情况生成。
- 包依赖写在实际使用它的成员中；根目录保存仓库级开发工具，Python 根默认不作为可发布包。
- 不按完整目录树预建空包。不要从示例项目继承业务包名、云服务、模型依赖或媒体运行时。
- 可选参考区、产物目录和测试数据不进入成员匹配、测试发现或发布范围。

## 3. 生成最小可运行结构

按 `layout.md` 与 `bootstrap.md` 顺序执行：

1. 创建实际成员、根配置和必要忽略规则。
2. 固定工具版本，使根 `packageManager` 与 mise 中 Bun 版本一致。
3. 创建根 `package.json`、`tsconfig.json`、Biome 配置和成员 `package.json`。共享包用真实包名与 `exports` 导出，通过 `workspace:*` 声明内部依赖。
4. 创建根及成员 `pyproject.toml`，选择与工具版本兼容的构建后端。Python 包采用 `src/<import_name>/`；通过可安装的包验证导入，不用手工添加 `PYTHONPATH` 掩盖打包问题。
5. 为新建示例成员写一个具有实际行为断言的最小测试；真实成员则运行其已有测试。确保测试命令确实发现了两种语言的测试。
6. 设置 mise 的安装、格式检查、Lint（静态规则检查）、类型检查、两类测试、聚合检查和版本诊断任务。
7. 生成锁文件，再执行冻结安装。首次创建与日常安装是两个不同阶段。
8. 编写中文 `README.md` 与简短 `AGENTS.md`，记录实际目录、工具职责、命令与新增成员方法。

优先遵循目标仓库已有规范。涉及工具配置语法时，查阅对应版本的官方文档；可用时通过 Context7 获取。新版本无法获取或网络阻塞时，报告未完成项，不编造版本、锁文件或验证结果。

## 4. 验收

在目标仓库根目录执行实际生成的任务：

```bash
mise install
mise run install
mise run check
mise run doctor
```

同时检查：

- 冻结安装未修改 `bun.lock`、`uv.lock`；成员依赖与清单相符。
- TS 与 Python 测试分别执行，失败会传递非零退出码；`check` 不执行自动修复。
- Python 解释器符合 mise 固定版本；uv 环境可通过包名导入实际成员。
- 包发现范围与目录规划一致，没有第二套成员级语言锁文件或重复虚拟环境。
- 命令通过 `mise run` / `mise exec` 运行，不要求先手工激活 shell 或 `.venv`。
- README 中声明支持的平台有相应验证证据；只在本机验证时就明确记录本机范围。

重复调用本 Skill 时先比较现状，只补齐缺项；不重新生成正常锁文件、不重置包名、不覆盖用户脚本。

## 5. 交付摘要

报告目标路径、创建/修改的关键文件、所选版本、安装与检查命令、实际执行结果及阻塞项。若 CI 或容器仅生成配置而未运行，明确区分配置完成和运行验证完成。
