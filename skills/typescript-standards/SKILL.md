---
name: typescript-standards
description: TypeScript/JavaScript 通用编码规范:语言与设计、命名原则与命名方式、目录职责与单向依赖、类型安全、错误处理、JSDoc、Biome、测试。适用于创建、重构、评审或配置任意 TypeScript/JavaScript 代码。
---

# TypeScript 通用编码规范

除非仓库已有更具体的既定约定,否则所有 TypeScript/JavaScript 代码都应应用本规范。

## 语言与设计

- 使用 TypeScript 语言
- 使用 ES6 语法
- 使用 async/await 语法
- 使用模块化编程
- 使用函数式编程
- 使用面向对象编程
- 使用单一职责原则
- 使用别名路径引用,避免使用相对路径;使用工作区已配置的别名,不要在未更新项目配置的情况下自造别名

## 命名原则

- 使用有意义的名称,避免使用缩写和拼音
- 按"职责/能力"命名,不按"实现机制/模式"命名
- 避免使用魔法数字和字符串,使用常量代替
- 避免使用全局变量,使用模块化和依赖注入
- 避免使用过于宽泛的名称,保持具体和明确

## 命名方式

- 使用 文件夹 + index.ts|tsx 创建并命名文件:`[功能模块名]/index.ts`
- 使用 kebab-case 命名法,例如:`file-api/index.ts`
- 使用 kebab-case 命名组件目录,例如:`custom-component/index.tsx`;导出的 React 组件名使用 PascalCase
- 使用 PascalCase 命名类和接口,例如:`class UserProfile {}`
- 使用 camelCase 命名变量和函数,例如:`const userName = 'Alice'; function getUserName() {}`
- 使用 ALL_CAPS 命名常量,例如:`const API_URL = 'https://api.example.com';`
- 使用 _ 前缀命名私有成员,例如:`private _userId: string;`

## 目录职责与单向依赖(新代码必须遵守)

- `utils/`:通用纯帮助函数(如 cookie、fetch 封装),不得依赖 lib/modules/app/mock 等任何内部目录。
- `lib/`:三方库实例与协议封装(gql-client、http 客户端、query client、`lib/graphql/` 下真实后端 GraphQL 客户端实例等),只依赖 utils/config/packages。
- `modules/<domain>/`:业务域代码(常量/标签、selections、query keys、GraphQL query options、纯业务函数等),按业务建 kebab-case 目录,文件名省略域名前缀,以 `index.ts` 桶导出为对外入口;可依赖 lib/utils。

## TypeScript 类型规范

- 所有新代码都使用 TypeScript
- 在可行的情况下遵循函数式编程原则
- 使用接口定义数据结构和类型
- 优先使用不可变数据(const、readonly)
- 使用可选链(?.)和空值合并(??)运算符
- 所有函数都需要定义输入参数类型和返回值类型
- 对未知类型使用 `unknown`,不使用 `any`
- 对永不返回的函数(例如抛出错误)使用 `never`
- 对不返回值的函数使用 `void`
- 对不返回值的异步函数使用 `Promise<void>`
- 使用类型守卫(`typeof`、`instanceof`)进行类型检查,确保类型安全

## 错误处理

- 对异步操作使用 try/catch 代码块,在能够补充上下文或执行恢复逻辑的边界捕获
- 不要无差别捕获后静默忽略错误;重新抛出或上报时保留有用的上下文信息
- 在 React 组件中实现合适的错误边界
- 始终记录带有上下文信息的错误日志,但不得记录密码、令牌、密钥等敏感信息
- 错误响应、日志、追踪信息不得泄露密码、令牌、密钥、数据库连接串或内部堆栈

## 文档、格式化与测试

- 使用 JSDoc 注释函数和类,提供类型信息和使用说明;不添加仅复述代码的注释
- 使用 Biome 作为代码格式化工具,确保代码风格一致(仓库已配置其他格式器、检查器时,沿用仓库配置)
- 使用 Git 进行版本控制,遵循 Git Flow 工作流程
- 使用单元测试框架编写测试用例,确保代码质量和可靠性
- 修改后运行仓库配置的类型检查、lint、测试等校验命令,并优先使用仓库中已有的脚本
