# AI Agent Engineering Standards Skills

面向 AI Agent 的工程规范技能集合，为 TypeScript、React、Next.js、移动端、后端以及 Cloudflare 应用提供统一的开发、重构和代码评审规范。

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

## 安装

使用 `npx skills add` 安装本仓库的技能：

```bash
npx skills add ecafe8/oc-engineering-standards-skills
```

安装指定技能：

```bash
npx skills add ecafe8/oc-engineering-standards-skills --skill typescript-standards
```

安装后，AI Agent 会根据当前项目使用的技术栈和任务内容自动加载匹配的技能。

## 使用方式

技能会在以下场景提供规范约束：

- 创建或修改 TypeScript/JavaScript 代码
- 开发 React、Next.js、Expo、Taro 或 TanStack Start 应用
- 开发 Hono 后端 API
- 进行代码重构、架构设计或代码评审
- 修改路由、构建配置、别名、认证、数据库或部署配置

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

所有技能都遵循 `typescript-standards` 中的通用 TypeScript 约定。React 相关技能进一步遵循 `react-frontend-standards`，框架专用技能在此基础上补充项目结构和平台约定。

## 目录结构

```text
skills/
├── typescript-standards/
├── react-frontend-standards/
├── nextjs-standards/
├── expo-router-standards/
├── taro-weapp-standards/
├── hono-backend-standards/
└── tanstack-cloudflare-standards/
```

每个技能目录包含一个 `SKILL.md` 文件，其中包括技能元数据、适用范围、编码规范和验证要求。

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
