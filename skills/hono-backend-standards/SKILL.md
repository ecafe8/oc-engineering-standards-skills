---
name: hono-backend-standards
description: Hono + TypeScript 后端编码规范:JWT 认证与安全、统一网关层、API 契约与客户端、项目结构、统一响应格式、错误处理体系、环境变量管理、pino 日志、模块分层、Drizzle 数据库迁移、bun:test 测试。适用于构建、重构、评审 Hono API 或 TypeScript 后端。
---

# Hono 后端编码规范

编辑前先确认仓库确实使用 Hono,并检查其运行时、数据库、校验与日志选型。对所有代码应用 `typescript-standards`(TypeScript 通用编码规范)。

## 技术栈

使用 JWT(JSON Web Token)进行用户认证和授权,确保安全性。

## 认证与安全

- 所有外部 API 流量必须通过 HTTPS/TLS;内部服务通信应使用私有网络、mTLS 或等效的服务间认证机制。
- 密码不得明文存储,也不应使用可逆加密存储;使用带盐的慢哈希算法(例如 Argon2id、scrypt 或 bcrypt),并通过专用密钥管理方案保护加密密钥和服务端密钥。
- JWT 仅作为一种认证凭证方案。使用时必须校验签名算法、issuer、audience、过期时间和必要的 subject/权限声明;访问令牌应设置较短有效期,并设计刷新令牌轮换和密钥轮换策略。
- JWT payload 不得放置密码、令牌、密钥或其他不应暴露给客户端的敏感信息。服务端不得仅根据客户端提交的用户 ID 或权限字段授权。
- 错误响应、日志、追踪信息和网关头部不得泄露密码、令牌、密钥、数据库连接串或内部堆栈。

## 统一网关层

- 可以提供统一 API 网关作为所有公网 API 的单一入口,负责 TLS 终止、路由、请求 ID、限流、基础 CORS、WAF 策略和统一 JWT 初步校验。
- 网关必须清理客户端传入的身份头部,再注入经过验证的身份上下文;后端服务不得无条件信任客户端发送的 `X-User-*` 等头部。
- 后端服务仍需执行 JWT 或内部签名上下文的独立校验,并负责资源级授权、租户隔离和业务权限判断。网关认证不能替代服务端授权。
- 网关与业务服务之间应使用受保护的内部网络或 mTLS;内部服务不能因为处于内网就完全跳过身份校验。
- 健康检查、公开接口和认证接口应明确标记为允许匿名访问的路由,其余 API 默认需要认证。
- 网关只处理通用横切能力,不承载业务规则、数据库访问或领域授权逻辑;避免形成不可独立演进的单体网关。

## API 契约与客户端

- API 契约独立于具体客户端技术栈,RESTful HTTP API 和 JSON 数据格式是跨语言、跨平台的基础契约。
- 使用 OpenAPI、JSON Schema 或等价的机器可读定义描述公开的路径、方法、参数、认证方式、状态码和响应结构。
- TypeScript 客户端可以在基础 API 契约之上使用 Hono RPC,RPC 只提供类型安全的调用适配,不替代 REST/JSON 契约。
- 非 TypeScript 客户端(例如 Python、Java、Go、Swift 或 Kotlin)直接按照 HTTP API 契约调用,不依赖 `hono/client` 或 TypeScript 类型。
- 服务端业务 schema 与 API 契约应保持一致;使用 Zod 时,应根据同一 schema 生成或维护运行时校验和 API 文档。
- API 契约类型应放在独立的契约模块中,客户端只依赖契约,不直接引入服务端的数据库、Bun 运行时或业务实现。

## 项目结构

- 遵循命名约定,文件和目录名称应使用 `kebab-case` 命名法。
- `./lib` 目录下存放所有库相关的代码,如数据库连接、第三方服务集成等。
  - `./lib/db` 目录下存放数据库连接和配置相关的代码。
  - `./lib/db/schemas` 目录下存放数据库模式定义文件。
  - `./lib/db/migrations` 目录下存放数据库迁移脚本。
  - `./lib/db/client.ts` 文件用于创建和导出数据库客户端实例。
- `./config` 目录下存放应用级配置,例如 `./config/env.ts` 中的环境变量 schema 和已校验的 `env` 对象。
- `./errors` 目录下存放跨模块共享的错误基类、错误码和错误处理中间件;模块特有的错误放在对应模块的 `errors/` 目录中。
- `./middleware` 目录下存放通用 Hono 中间件,例如 `error-handler.ts`、认证和请求 ID 中间件。
- `./modules` 目录下存放所有业务模块相关的代码,确保模块化开发和维护。
  - 模块目录名使用业务领域的单数 kebab-case,例如 `photo`、`order`;模块内部的职责目录统一使用复数形式。
  - 每个模块应包含其路由、控制器、服务和模型等相关代码。
  - `./modules/[module]/services` 目录下存放该模块特有的服务代码,如数据库操作、第三方 API 调用等。
  - `./modules/[module]/controllers` 目录下存放该模块特有的控制器代码,负责提取 HTTP 输入、执行参数校验、调用 Service 并构建响应;业务规则放在 Service 中。
  - `./modules/[module]/routes` 目录下存放该模块特有的路由定义代码。
  - `./modules/[module]/errors` 目录下存放该模块特有的错误定义。
  - `./modules/[module]/helpers` 目录下存放该模块特有的辅助代码。
  - `./modules/[module]/constants` 目录下存放该模块特有的常量定义。
  - `./modules/[module]/types` 目录下存放该模块特有的类型定义。
    - `enum.ts`、`schema.ts`、`type.ts` 等文件名表示文件职责,可以使用单数,不要求与目录的复数形式一致。
    - `./modules/[module]/types/enum.ts` 文件用于定义该模块特有的枚举类型。
    - `./modules/[module]/types/schema.ts` 文件用于定义该模块特有的 Zod 验证模式。
    - `./modules/[module]/types/type.ts` 文件用于定义该模块特有的其他类型别名,以及从 schema 中派生的类型。
    - `./modules/[module]/types/index.ts` 文件用于集中导出该模块的所有类型定义。
- `./utils` 目录下存放整站公共工具函数。
- `./types` 目录下存放所有全局类型定义文件。

## 前后端约定

- 所有 API 路由应以 `/api/` 前缀开头,健康检查等基础设施路由可以使用明确的非业务路径。
- 使用 RESTful 风格设计 API,确保资源命名、HTTP 方法和状态码具有一致性。
- 所有请求和响应均使用 JSON 格式;文件上传等特殊场景必须在契约中明确 `multipart/form-data` 等格式。
- 使用 `{ "code": string, "message": string, "data": unknown }` 作为统一的业务响应格式:
  - 其中 `code` 为字符串类型的错误码,`message` 为描述信息,`data` 为具体的响应数据。
  - 如果请求成功,`code` 应为 `"SUCCESS"`,`message` 可为空字符串,也可为业务所需的成功消息,`data` 包含实际数据。
  - 如果请求失败,`code` 应为具体的错误码字符串,`message` 包含错误描述,`data` 可为 `null` 或包含错误相关的数据。

## 错误处理

- 异步操作应在能够补充上下文或执行恢复逻辑的边界使用 `try/catch`;不要无差别捕获后静默忽略错误。
- API 请求错误必须由统一的错误处理中间件分类处理,并返回契约中定义的 HTTP 状态码和错误码。
- 错误码应遵循统一命名规范;业务错误、参数校验错误和未知系统错误必须可以区分。
- 对客户端返回的 `message` 和 `data` 进行脱敏,禁止暴露密码、令牌、数据库连接信息、堆栈和内部路径。
- 未知错误应记录带有 requestId 的完整服务端日志,但对外只返回稳定的通用错误响应。

## TypeScript

- 类型定义文件应放置在 `types/` 目录下,确保类型定义的集中管理和易于维护,方便打包时自动包含。
- 使用接口(`interface`)和类型别名(`type`)定义复杂的数据结构,确保代码的可读性和可维护性。
- 避免使用 `any` 类型,尽量使用具体的类型定义,以确保类型安全。
- 使用枚举(`enum`)定义一组相关的常量值,确保代码的可读性和可维护性。
- 使用类型断言(`as`)时,应确保类型转换的正确性,避免潜在的类型错误。
- 定义通用类型时,使用泛型(`<T>`)以提高代码的灵活性和可重用性。
- 使用类型守卫(`typeof`、`instanceof`)进行类型检查,确保代码的类型安全。

## 错误处理体系

- 所有业务错误应继承 `AppError` 基类(定义在 `./errors/app-error.ts`)。
- 错误码常量定义在 `./errors/error-codes.ts`,使用 `as const` 对象而非枚举。
- 全局 `errorHandlerMiddleware` 统一捕获三类异常:
  - `AppError` → 使用其 code/message/statusCode 构建统一响应。
  - `ZodError` → 格式化 `.issues` 为 `[{ path, message }]`,返回 422。
  - 未知错误 → 记录完整日志,返回 500 + `INTERNAL_ERROR`(不泄漏内部信息)。
- Controller 中使用 Zod `.parse()` 而非 `.safeParse()`,验证失败自动抛出 ZodError 由全局 handler 处理。

## 环境变量管理

- 所有环境变量必须在 `./config/env.ts` 中使用 Zod Schema 校验。
- 应用启动时执行 `safeParse`,校验失败则打印错误并 `process.exit(1)`(fail-fast)。
- 不允许在业务代码中直接读取 `process.env`,统一通过 `env` 对象访问。
- `.env.example` 文件提交到仓库,文档化所有必需的环境变量及默认值。

## 日志规范

- 使用 pino 进行结构化日志输出,开发环境使用 pino-pretty 格式化。
- 所有日志必须携带 `requestId` 字段,实现请求级链路追踪。
- Logger 实例定义在 `./utils/logger.ts`,通过 `import { logger }` 使用。

## 模块分层模式

数据流:`HTTP Request → Route → (Zod parse) → Controller → Service → DB (Drizzle) → Response`

- **Controller**(薄层):提取请求参数/body,Zod 校验,调用 Service,返回 `success(c, data)`。
- **Service**(业务逻辑):包含所有业务规则,使用 Drizzle 操作数据库,抛出 AppError 子类。

## 数据库迁移工作流

- `db:generate` — 根据 Schema 变更生成迁移文件。
- `db:migrate` — 执行迁移(生产环境使用)。
- `db:push` — 直接推送 Schema 到数据库(仅开发环境使用)。
- `db:studio` — 启动 Drizzle Studio 可视化管理数据库。
- Drizzle Schema 定义在 `./lib/db/schemas/` 下,每张表一个文件,字段命名 snake_case。

## 测试规范

- 使用 Bun 内置的 `bun:test` 作为测试框架,不额外引入 Vitest。
- 使用 `bun test` 运行测试,测试文件命名为 `*.test.ts`(单元测试)或 `*.integration.test.ts`(集成测试)。
- 使用 `import { describe, expect, test } from 'bun:test'` 编写测试;需要隔离外部依赖时使用 Bun 的 mock API。
- 集成测试直接测试路由,不依赖真实服务器。
- Hono 路由测试使用 `app.request()` 直接构造请求和断言响应,不启动监听端口。
- Service 层单元测试通过 mock `db` 实现隔离。
- 使用 `bun test --coverage` 检查测试覆盖率,并在 CI 中执行 `bun test`。
