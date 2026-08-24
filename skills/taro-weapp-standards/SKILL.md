---
name: taro-weapp-standards
description: Taro 与微信小程序应用规范:框架入口文件(app.tsx、app.config.ts、app.css、global.d.ts)、页面组织(src/pages/<page-name>/index.tsx)、weapp-tailwindcss/WXSS 兼容、平台专用文件后缀、@workspace/shared/* 别名、Taro 类型检查与小程序构建校验。适用于开发、重构、评审 Taro 页面、app.config、微信小程序组件或 Taro 构建配置。
---

# Taro 应用规范

编辑前先确认项目确实使用 Taro,并识别其配置的 app 目录、package scripts、别名与目标平台。同时应用 `typescript-standards`(TypeScript 通用编码规范)与 `react-frontend-standards`(React 前端编码规范)。

## 项目结构与命名

- 保留 `src/app.tsx`、`src/app.config.ts`、`src/app.css` 和 `src/types/global.d.ts` 作为框架入口/配置文件;不要为了通用命名一致性而重命名它们。
- 页面组织为 `src/pages/<page-name>/index.tsx`,`<page-name>` 使用 kebab-case;保留 Taro 页面配置所需的 `index.tsx` 入口。
- 可复用组件、hooks 和工具以 kebab-case 目录组织,入口为 `index.ts` 或 `index.tsx`。
- 导出的 React 组件名使用 PascalCase;hooks、函数和变量使用 camelCase;文件和目录名保持 kebab-case。
- 页面和组件命名必须与 `app.config.ts`、路由配置以及平台专用配置保持一致。
- 使用工作区别名(如 `@workspace/shared/*`)导入包;避免使用未在 TypeScript 和 Taro 打包器中配置的临时别名。

## 微信小程序兼容

- Taro 组件和选择器可能使用平台专用 API 和标签;不要为了匹配纯 Web 约定而重命名框架 API,也不要用 Web DOM 假设替换框架 API。
- 保持 WXSS 专用文件和选择器与已配置的 `weapp-tailwindcss` 流水线兼容。
- 当 Taro 或打包器使用平台专用文件后缀选择实现时,保留这些后缀。

## TypeScript 与校验

- 页面模块必须在 `apps/mp/tsconfig.json` 下保持类型安全。
- 修改页面目录、别名、`app.config.ts` 或打包器配置后,运行 Taro 类型检查。
- 修改页面名称或路由配置后,还必须验证微信小程序构建,因为仅靠 TypeScript 解析无法校验 Taro 页面发现。
- 检查 package scripts 确定实际命令,不要假设命令名称。
