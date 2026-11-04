# AI Agent Engineering Standards Skills

面向 AI Agent 的工程规范技能集合，覆盖 TypeScript、React、Next.js、移动端、后端、Cloudflare、Python 工具链、Monorepo 初始化和开发任务文档。

## 技能列表

| 技能 | 适用场景 |
| --- | --- |
| `typescript-standards` | TypeScript/JavaScript 通用编码规范、类型安全、命名、目录职责、错误处理、测试和格式化 |
| `react-frontend-standards` | React + TypeScript 前端项目、Tailwind CSS、Jotai、React Query、共享 UI 组件和 API 约定 |
| `nextjs-standards` | Next.js App Router、路由组、布局、Proxy、API Routes、Server/Client Components 和 Jotai |
| `expo-router-standards` | Expo Router 应用、文件路由、深链接、平台专用模块和移动端构建校验 |
| `taro-weapp-standards` | Taro 微信小程序、页面组织、app 配置、WXSS 兼容性和小程序构建校验 |
| `hono-backend-standards` | Hono + TypeScript 后端、JWT、安全、API 契约、错误处理、Drizzle、日志和 Bun 测试 |
| `tanstack-cloudflare-standards` | TanStack Start + Cloudflare Workers、文件路由、Server Functions、Vite 和 Worker 配置 |
| `design-md` | 从项目源码或公开网站 URL 生成规范化 `DESIGN.md`，提取设计 token、配色、字体、间距、主题与组件样式 |
| `development-tasks` | 创建和维护可追踪的开发任务文档、依赖、验收条件、进度与验证证据 |
| `mise-standards` | mise 工具版本、环境变量、任务、锁文件及本地/CI/容器统一入口 |
| `uv-standards` | uv Python 项目与 workspace 的依赖、锁文件、解释器和虚拟环境维护 |
| `monorepo-bootstrap` | 使用 mise、Bun 和 uv 初始化或维护 TypeScript + Python 多语言 Monorepo |

## 安装

使用 `npx skills add` 安装本仓库的技能：

```bash
npx skills add ecafe8/oc-engineering-standards-skills
```

安装指定技能：

```bash
npx skills add ecafe8/oc-engineering-standards-skills --skill typescript-standards
npx skills add ecafe8/oc-engineering-standards-skills --skill mise-standards
```

安装后，AI Agent 会根据当前项目使用的技术栈和任务内容自动加载匹配的技能。每个 Skill 都应可单独安装；请保留所选 Skill 目录中的 `SKILL.md`、`references/`、`scripts/` 和 `evals/`（若存在）。跨 Skill 提及只作为可选补充，不是运行前提。

## 使用方式

技能会在以下场景提供规范约束：

- 创建或修改 TypeScript/JavaScript 代码
- 开发 React、Next.js、Expo、Taro 或 TanStack Start 应用
- 开发 Hono 后端 API
- 管理 mise/uv 工具链，初始化 TypeScript + Python Monorepo
- 创建、拆分或维护带验收证据的开发任务文档
- 进行代码重构、架构设计或代码评审
- 修改路由、构建配置、别名、认证、数据库或部署配置
- 从项目源码或公开网站 URL 提取设计系统并生成 `DESIGN.md`

框架专用技能会在确认项目使用对应框架后生效，不会将某个框架的目录或 API 约定错误应用到其他项目。

## 技能依赖关系

```text
typescript-standards
├── react-frontend-standards
│   ├── nextjs-standards
│   ├── expo-router-standards
│   ├── taro-weapp-standards
│   └── tanstack-cloudflare-standards
└── hono-backend-standards
```

TypeScript/React 相关技能按此关系叠加规范。`development-tasks`、`mise-standards`、`uv-standards`、`monorepo-bootstrap` 和 `design-md` 可独立使用；它们之间的交叉引用仅为可选补充，不是安装或运行前提。

`monorepo-bootstrap` 在适用时可补充参考 mise 和 uv 维护规范，但自身包含初始化双工作区所需的核心指引。每个 Skill 的参考文件均随其目录存放，并通过相对路径引用。

## 目录结构

```text
skills/
├── typescript-standards/
├── react-frontend-standards/
├── nextjs-standards/
├── expo-router-standards/
├── taro-weapp-standards/
├── hono-backend-standards/
├── tanstack-cloudflare-standards/
├── development-tasks/
├── mise-standards/
├── uv-standards/
├── monorepo-bootstrap/
└── design-md/
```

每个技能目录都包含 `SKILL.md`，可选包含 `references/`、`scripts/` 和 `evals/`。单独安装时应保留所选技能目录整体，以一并获取它的参考文档和资源。

`design-md` 额外采用渐进式披露结构：`references/` 按源类型拆分参考文档（项目模式、URL 模式、URL 采集协议），`scripts/` 提供可选的能力探测、页面采集与规范校验脚本，`evals/` 提供评测用例。这些脚本是加速器而非前置条件，每个脚本能力都有对应的手工步骤，因此该技能在没有 shell 的 Agent 环境中同样可用。

## 设计原则

- 优先遵循项目已有的技术栈、脚本、目录结构和工具配置。
- 采用 TypeScript、类型安全、模块化和单一职责设计。
- 使用清晰的错误处理、统一的 API 契约和安全边界。
- 修改完成后运行项目已有的类型检查、Lint、测试和构建命令。
- 不凭空假设框架配置、包管理器命令或部署环境。

## 贡献

新增或修改技能时，请确保：

- 技能名称使用 kebab-case。
- `SKILL.md` 包含有效的 `name` 和 `description` 元数据。
- 明确说明适用范围，避免与其他技能职责重复。
- 示例代码与规范保持一致。
- 文档和示例默认使用 ASCII 字符，除非确有必要使用其他字符。

## 许可证

本项目基于 [MIT License](./LICENSE) 发布。
