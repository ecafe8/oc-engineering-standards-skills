---
name: expo-router-standards
description: Expo 与 Expo Router 应用规范:保留路由文件名(_layout、+not-found、+html、(tabs))、屏幕名称稳定性、平台专用文件与 Metro 平台解析、@workspace/mobile/* 别名、移动端类型检查与构建校验。适用于开发、重构、评审 Expo Router 路由、布局、深链接、原生/Web 模块或 Expo 配置。
---

# Expo 应用规范

编辑前先确认仓库确实使用 Expo Router,并检查其路由目录、Metro 配置、别名与 package scripts。同时应用 `typescript-standards`(TypeScript 通用编码规范)。

## 项目结构与命名

- 保留 Expo Router 保留文件名不变:`app/_layout.tsx`、`app/+not-found.tsx`、`app/+html.tsx`、路由组(如 `app/(tabs)`)、动态段,以及其他以 `+` 或 `_` 开头的框架定义文件。
- 可复用组件、hooks 和常量以 kebab-case 目录组织,入口为 `index.ts` 或 `index.tsx`。
- 仅在行为按平台差异时才使用平台专用入口,并保留平台后缀,例如 `use-color-scheme/index.ts` 和 `use-color-scheme/index.web.ts`。
- 导出的 React 组件名使用 PascalCase;hooks、函数和变量使用 camelCase;文件和目录名保持 kebab-case。
- 在移动应用内部使用已配置的 `@workspace/mobile/*` 别名导入;仅对框架要求的资源(如 `require('../assets/...')`)保留相对路径。
- 工作区专用别名已配置时,不要再添加第二个通用的 `@/*` 别名。

## 路由与平台行为

- 路由文件定义导航结构,不应移动到普通组件目录中。
- 当屏幕名称被 `Stack.Screen`、`Tabs.Screen` 或深链接引用时,保持名称稳定。
- 当模块有独立的原生与 Web 实现时,使用 Expo 和 Metro 的平台解析,而不是运行时平台判断。

## TypeScript 与校验

- `app/` 路由文件与可复用模块必须在 `apps/mobile/tsconfig.json` 下保持类型安全。
- 修改路由名称、别名、平台文件或资源路径后,运行移动端类型检查。
- 导航或原生配置变更时,验证相关的 Expo 开发或生产构建。
