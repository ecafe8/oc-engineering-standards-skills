# 第三方推荐技能

本仓库自有技能之外的优秀第三方 Agent Skills 精选清单。

这些技能**不收录**在本仓库 `skills/` 目录中,也不能通过 `npx skills add ecafe8/oc-engineering-standards-skills` 安装;请按各条目给出的命令从原始来源安装,以获得持续更新。

## 收录标准

- 实测可用,安装方式明确。
- 许可证宽松(如 MIT),来源清晰可查。
- 维护活跃,或由框架/包官方随版本发布。
- 与本仓库自有技能职责不重复,或形成明确互补。

## 发现渠道

- `npx skills find [关键词]`:搜索技能注册表,`--owner <org>` 可按组织浏览。
- GitHub topic:[agent-skills](https://github.com/topics/agent-skills)。
- [TanStack Intent Registry](https://tanstack.com/intent/registry):随 npm 包发布技能的官方清单。

## 官方框架自带

由框架/库官方发布的技能,通常与包版本绑定,随包升级而更新。**不要复制进项目或本仓库**,以免版本漂移。

### TanStack AI Agent Skills

- 来源:[TanStack/ai](https://github.com/TanStack/ai) · [官方文档](https://tanstack.com/ai/latest/docs/getting-started/agent-skills)
- 许可证:MIT
- 适用场景:让 Agent 编写当前版本的 TanStack AI 代码(`chat()`、adapters、middleware、聊天持久化、Code Mode 等),或从 Vercel AI SDK 迁移、0.x 升级 1.0。
- 安装:

  ```bash
  # 全局安装 discovery skills(每台机器一次)
  npx skills add TanStack/ai -g --skill tanstack-ai --skill tanstack-ai-migration

  # 在项目根目录生成 任务 -> 技能文件 的映射(提交进仓库,团队共享)
  npx @tanstack/intent@latest install
  ```

- 注意事项:
  - 两层结构:discovery skills 负责"何时用、选哪个包";package skills 位于 `node_modules/<package>/skills/`,与已安装版本一致。
  - `npm update` 后技能自动更新;仅在新增带技能的包或刷新任务映射时重跑 `intent install`。
  - 覆盖 `@tanstack/ai`、`ai-persistence`、`ai-memory`、`ai-mcp`、`ai-sandbox`、`ai-code-mode`、`ai-skills` 等包,详见官方文档。
- 最近核实:2026-11

## 社区

### logo-design-skill

- 来源:[kaankiziltug/logo-design-skill](https://github.com/kaankiziltug/logo-design-skill)
- 许可证:MIT(1400+ 参考 logo 库仅供学习研究,商标相关限制见仓库 `TRADEMARKS.md`)
- 适用场景:logo、wordmark、monogram、app icon、favicon 的设计与重设计;SVG 工艺审计(16px、单色、对比度、竞品货架测试);生成品牌指南、演示板和完整图标套件。
- 安装:

  ```bash
  npx skills add kaankiziltug/logo-design-skill --skill logo-design
  ```

  Claude Code 也可用插件市场安装,其他 Agent 的手动安装方式见仓库 README。

- 注意事项:
  - 自带工具需要 Python 3.8+(仅标准库);PNG/ICO 导出依赖本地可用渲染器(cairosvg、rsvg-convert、Inkscape、Chromium 系浏览器等)。
  - 配合能查看图像的模型效果最佳:技能会把自己的 SVG 草稿渲染成 PNG 自检后再展示。
  - 含 1400+ 参考 SVG,体积较大;工作流在"概念检查点"停下,确认方向后才产出完整套件。
- 最近核实:2026-11
