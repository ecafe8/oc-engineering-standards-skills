---
name: tanstack-cloudflare-standards
description: TanStack Start + Cloudflare Workers 项目结构规范:以 src/app 为路由目录、TanStack Router 文件路由、路径布局与认证路由组、Server Functions(-server.ts)、routeFileIgnorePrefix、Vite/Cloudflare 配置、状态管理。适用于开发、重构、评审部署到 Cloudflare Workers 的 TanStack Start 应用。
---

# TanStack Start + Cloudflare Workers 项目结构规范

编辑前先确认仓库确实使用 TanStack Start 与 Cloudflare Workers,并检查当前的 Vite、路由、TypeScript 与部署配置。同时应用 `typescript-standards`(TypeScript 通用编码规范)与 `react-frontend-standards`(React 前端编码规范)。

## 核心原则

- 代码应遵循清晰的页面化结构,确保每个页面职责单一,易于维护和扩展
- 页面中组件化,确保组件可复用,提升开发效率。确保每个组件职责单一
- 遵循命名约定,文件和目录名称应使用 kebab-case 命名法
- 本规范采用 `src/app` 作为路由目录（保持 Next.js 风格）,并在 Vite 中通过 `routesDirectory: 'app'` 显式声明
- `src/types` 目录下存放所有类型定义文件

## 目录结构

```
src/
├── app/                       # 路由页面目录
│   ├── __root.tsx            # 根布局组件
│   ├── index.tsx             # 首页
│   ├── _authenticated.tsx    # 认证路由组（对应 (auth)）
│   ├── _authenticated/       # 需要认证的页面（pathless layout）
│   │   ├── dashboard/
│   │   │   ├── index.tsx
│   │   │   ├── components/   # 页面特有组件
│   │   │   │   └── stats-card.tsx
│   │   │   └── stores/       # 页面特有状态
│   │   │       └── dashboard-store.ts
│   │   └── settings/
│   │       └── index.tsx
│   ├── about/
│   │   └── index.tsx
│   ├── auth/
│   │   ├── login.tsx
│   │   └── components/
│   │       └── login-form.tsx
│   └── api/                  # API 路由（Server Functions）
│       ├── users.ts
│       └── products.ts
│
├── components/               # 整站可复用的 UI 组件
│   ├── ui/
│   │   ├── button.tsx
│   │   └── input.tsx
│   └── common/
│       ├── header.tsx
│       └── footer.tsx
│
├── layouts/                  # 布局组件
│   ├── auth-layout.tsx
│   └── public-layout.tsx
│
├── stores/                   # 整站公共状态管理
│   ├── user-store.ts        # 用户认证状态
│   └── theme-store.ts       # 主题状态
│
├── types/                    # 类型定义
│   ├── user.ts
│   └── api.ts
│
├── utils/                    # 公共工具函数
│   ├── auth.ts
│   └── formatters.ts
│
└── hooks/                    # 公共自定义 Hooks
    └── use-auth.ts
```

## 路由规范

### 根布局 (__root.tsx)

```tsx
// src/app/__root.tsx
import { createRootRoute, Outlet } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <div>
      <Outlet />
    </div>
  )
}
```

### 认证路由组 (_authenticated.tsx)

```tsx
// src/app/_authenticated.tsx
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated')({
  component: AuthenticatedLayout,
  beforeLoad: async ({ context }) => {
    if (!context.user) {
      throw redirect({ to: '/auth/login' })
    }
  },
})

function AuthenticatedLayout() {
  return (
    <div>
      <Outlet />
    </div>
  )
}
```

### 页面路由示例

```tsx
// src/app/_authenticated/dashboard/index.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  return <div>仪表盘</div>
}
```

保留框架保留路由文件(如 `__root.tsx`);使用 pathless 布局和路由组时不得改变预期的 URL 结构。

## 组件规范

### 页面特有组件

- 放在页面目录下的 `components/` 文件夹
- 使用 kebab-case 命名:`stats-card.tsx`

### 全局复用组件

- 放在 `src/components/` 目录下
- 按功能分类:`ui/`、`common/`
- 使用 kebab-case 命名

## Server Functions

Server Functions 放在对应页面目录下,以 `-` 前缀命名,避免被路由生成器误识别:

```tsx
// src/app/home/-server.ts
import { createServerFn } from '@tanstack/react-start'

export const getRuntimeInfo = createServerFn({ method: 'GET' })
  .handler(async () => {
    // 服务端逻辑，可直接访问 Cloudflare Worker bindings
    const { env } = await import('cloudflare:workers')
    return { appName: env.APP_NAME }
  })
```

在页面组件中引用:

```tsx
// src/app/home/index.tsx
import { createFileRoute } from '@tanstack/react-router'
import { getRuntimeInfo } from './-server'

export const Route = createFileRoute('/home')({
  loader: () => getRuntimeInfo(),
  component: HomePage,
})
```

Server Functions 保持在服务端专用模块中,只向客户端暴露所需数据;校验服务端输入,密钥与 Cloudflare bindings 不得进入客户端 bundle。

## 状态管理

### 全局 Store

```tsx
// (Jotai)
// src/stores/user-store.ts
import { atom } from 'jotai'
export const userAtom = atom<User | null>(null)
```

### 页面 Store

- 放在页面目录下的 `stores/` 文件夹
- 仅管理页面级状态

服务端数据放在 loader 或既定的 query 层;小型客户端状态使用项目配置的状态方案并就近管理。

## 命名约定

- 文件和目录:`kebab-case` (如:`user-profile.tsx`)
- 组件函数:`PascalCase` (如:`UserProfile`)
- 变量和函数:`camelCase` (如:`getUserData`)
- 类型和接口:`PascalCase` (如:`UserProfileProps`)

### 非路由文件（TanStack Router 约定）

TanStack Router CLI 默认会把路由目录下所有 `.tsx/.ts` 文件都视为路由文件。对于页面目录内的 Server Functions、工具函数等辅助文件,需要加 `-` 前缀以排除路由生成:

```
home/
├── index.tsx        # ✅ 路由文件 → /home
├── -server.ts       # ✅ 非路由文件（-前缀），存放 Server Functions
└── -utils.ts        # ✅ 非路由文件（-前缀），存放页面工具函数
```

此行为由 TanStack Router 的 `routeFileIgnorePrefix` 配置项控制,默认值为 `"-"`。可在 `tsr.config.json` 中覆盖:

```json
// tsr.config.json
{
  "target": "react",
  "routesDirectory": "./src/app",
  "routeFileIgnorePrefix": "-"
}
```

## 导入规范

```tsx
// 使用 @/ 别名引用 src 目录
import { Button } from '@/components/ui/button'
import { useUserStore } from '@/stores/user-store'
import type { User } from '@/types/user'
```

使用仓库已配置的别名,不要在未更新项目配置的情况下自造别名。

## Cloudflare Workers 配置

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import viteReact from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tanstackStart({
      router: {
        routesDirectory: 'app',
      },
    }),
    viteReact(),
  ],
})
```

- 没有明确的迁移需求时,保留既有的 Vite 插件顺序与运行时配置。
- 通过项目支持的 Cloudflare 运行时机制访问 Worker bindings(如 `cloudflare:workers`)。
- 不要假设 Workers 运行时存在 Node API;保持 Worker 运行时代码与浏览器代码的边界。

## 最佳实践

- 每个页面职责单一,避免臃肿
- 组件保持小而专注,职责单一
- 使用 Server Functions 处理服务端逻辑
- 类型定义集中管理,保持类型安全
- 页面级状态就近管理,全局状态谨慎使用

## 校验

- 修改路由文件、路由配置、别名、Server Functions、Vite 配置或 Worker bindings 后,运行仓库的类型检查与路由生成检查
- 宣称完成前,运行相应的生产构建或 Cloudflare 部署校验
