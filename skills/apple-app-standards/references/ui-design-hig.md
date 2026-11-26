# UI 设计规范(HIG)

以 [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines) 为准。优先使用系统控件,自定义控件须达到系统控件同等的无障碍、动态字体和交互能力。

## 基础

- **字体**:使用文本样式(`.font(.body)`、`.title2`),支持 Dynamic Type 至 AX5;自定义字体用 `Font.custom(_:size:relativeTo:)`。不写死 `.system(size:)` 作为正文。
- **颜色**:语义色(`.primary`、`.secondary`、`Color(.systemBackground)`)或 Asset Catalog 中带 Light/Dark/高对比变体的颜色。不硬编码 RGB 于视图中。
- **图标**:SF Symbols 优先,随文本样式缩放;合理使用 `symbolRenderingMode` 与 `symbolEffect`。
- **布局**:尊重安全区与可读宽度;使用 stack、`Grid`、`ViewThatFits`、`containerRelativeFrame`;避免依赖固定屏幕尺寸,`GeometryReader` 仅在确需测量时使用。
- **点击区域**:iOS/iPadOS 最小 44x44pt,watchOS 依据系统控件尺寸,macOS 遵循控件尺寸规范。
- **间距与圆角**:来自 DesignSystem 常量;圆角使用 `.rect(cornerRadius:style: .continuous)` 或同心圆角(`ConcentricRectangle`,26+)。
- **反馈**:加载、空态、错误态三态齐全;破坏性操作使用 `role: .destructive` 并确认;触感使用 `.sensoryFeedback`。

## Liquid Glass

- 系统控件(TabView、toolbar、sheet、导航栏)在 26 SDK 下自动获得玻璃效果;先移除自定义背景再评估,不要叠加自绘模糊。
- 玻璃用于浮在内容之上的导航/控制层,不用于内容本身(列表行、卡片正文)。
- 自定义:`.glassEffect(_:in:)`,多个玻璃元素放入 `GlassEffectContainer` 以正确融合与变形;按钮用 `.buttonStyle(.glass)` / `.glassProminent`。
- 默认基线(26+)可直接使用;采用扩展基线(iOS 18 等)时,用 `if #available(iOS 26, macOS 26, watchOS 26, *)` 分支,旧系统使用 `.ultraThinMaterial` 或纯色背景。
- 尊重"降低透明度"与"增强对比度"(`accessibilityReduceTransparency`),必要时改用不透明背景。
- 签名不确定时先查文档,该 API 仍在演进。

## 导航模式

| 场景 | 组件 |
| --- | --- |
| 线性层级 | `NavigationStack(path:)` + `navigationDestination(for:)` |
| 多栏(iPad、Mac) | `NavigationSplitView` |
| 顶层分区 | `TabView` + `Tab`(26 可 `.tabViewStyle(.sidebarAdaptable)`) |
| 临时任务 | `.sheet`、`.fullScreenCover`(iOS)、`.inspector` |
| 搜索 | `.searchable`,26 可作为独立 search tab |

## 动效

- 使用 SwiftUI 动画、`PhaseAnimator`、`KeyframeAnimator`、`matchedGeometryEffect`、`.navigationTransition(.zoom)`。
- 读取 `accessibilityReduceMotion`,开启时改为淡入淡出或无动画。
- 动效时长短、可中断,不阻塞交互。

## 无障碍(必须)

- 图标按钮提供 `accessibilityLabel`;装饰图片 `.accessibilityHidden(true)`。
- 组合相关元素 `.accessibilityElement(children: .combine)`;自定义控件补充 traits、value、`accessibilityAction`。
- 不只用颜色传达信息;文本对比度至少 4.5:1。
- 支持键盘导航与焦点(`@FocusState`、`focusable`)、全键盘访问、Switch Control。
- 用 Xcode Accessibility Inspector 与 `XCUIApplication.performAccessibilityAudit()` 检查。

## 本地化

- 所有用户可见文案使用 `LocalizedStringKey`/`String(localized:)`,集中在 String Catalog;复数使用 Catalog 的变体。
- 数字、日期、货币、度量使用 `FormatStyle`(`.formatted()`),不手拼字符串。
- 布局使用 leading/trailing,支持 RTL;在 Scheme 中用伪语言(加长、RTL)测试。

## 深色模式与外观

- 所有页面在 Light/Dark、高对比、各 Dynamic Type 档位下可用;`#Preview` 覆盖关键组合。
- App 图标提供 Light/Dark/Tinted 变体(iOS 18+),使用 Icon Composer 生成分层图标。
