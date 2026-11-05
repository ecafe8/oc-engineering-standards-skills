# 前端效果词典

此目录把用户提供的 46 个示例按用途整理为四组，供 `SKILL.md` 的效果选择步骤按需查阅。经典组的 12 项分别链接到独立实现模板，Agent 只需读取命中的效果文件。名称用于沟通和检索，不代表每个项目都应实现，也不保证示例中的 API 在所有浏览器可用。视觉质感可与动效组合，但不应误称为运动行为。

## 趋势效果（8）

| 效果 | 类型与常见用途 |
| --- | --- |
| 液态玻璃（Liquid Glass） | 玻璃折射、背景模糊；卡片或控件表面 |
| 模糊渐显（Blur Reveal） | 首屏标题入场 |
| 滚动文字点亮（Scroll Text Reveal） | 短句随滚动逐字强调 |
| 交互点阵（Interactive Dot Grid） | 鼠标或点击驱动的 Canvas 背景 |
| 可变字重悬停（Variable Font Hover） | 字重随指针位置变化 |
| 边框追光（Glow Border） | 指针位置驱动的卡片描边高光 |
| 粘滞融合（Gooey） | SVG 滤镜形成融合形状，常用于菜单展开 |
| 自动高度过渡（`interpolate-size`） | 内容展开/折叠；需检测支持并提供回退 |

## 高频场景（12）

| 效果 | 类型与常见用途 |
| --- | --- |
| 打字机与轮换词（Typewriter） | 标题文字逐字输入；保留可读的完整文本 |
| 连线粒子（Particles） | Canvas 氛围背景；限制数量并在不可见时暂停 |
| 程序坞放大（Dock） | 桌面导航的距离响应；触屏需有直接导航方式 |
| 彩纸庆祝（Confetti） | 支付、达成目标等重要成功反馈 |
| 3D 封面流（Coverflow） | 可点击或拖动的画廊轮播 |
| 滚动卡片堆叠（Scroll Stack） | 分步叙事与内容层次 |
| 通知动态列表（Animated List） | 新条目插入及旧条目移出 |
| 集成光束（Animated Beam） | 节点、数据或服务间的流程示意 |
| CTA 按钮效果（Shimmer / Rainbow / Pulse） | 重要行动的有限强调；每个视图控制强调数量 |
| 复古网格与流星（Retro Grid / Meteors） | 装饰性首屏背景 |
| 阅读进度与主题转场（Progress / Theme Transition） | 滚动进度及浅深主题切换 |
| 手绘圈注（Rough Notation） | 少量关键词的 SVG 标注 |

## 经典效果（12）

| 效果 | 类型与常见用途 |
| --- | --- |
| [三维倾斜（3D Tilt）](effects/3d-tilt.md) | 卡片指针视差与高光 |
| [毛玻璃（Glassmorphism）](effects/glassmorphism.md) | 背景模糊与半透明表面；注意对比度和成本 |
| [流光边框（Border Beam）](effects/border-beam.md) | 表达处理中状态，不要作为无意义常驻装饰 |
| [聚光灯（Spotlight）](effects/spotlight.md) | 指针或触摸照亮局部内容；确保内容不依赖遮罩才可见 |
| [便当盒网格（Bento Grid）](effects/bento-grid.md) | 网格单元强调或尺寸变化 |
| [文字解码（Text Scramble）](effects/text-scramble.md) | 短标题的短暂过渡；最终文本需可访问 |
| [磁吸按钮与光标变形（Magnetic / Cursor Morph）](effects/magnetic-cursor.md) | 桌面指针增强；保留原生光标语义和触屏替代 |
| [极光背景（Aurora）](effects/aurora.md) | 多层缓慢背景运动 |
| [卡片翻转（Card Flip）](effects/card-flip.md) | 闪卡或双面信息；支持点击和键盘切换 |
| [彩带光标拖尾（Cursor Trail）](effects/cursor-trail.md) | 创意站点的 Canvas 装饰；限制粒子并支持关闭 |
| [新拟态控制（Neumorphism）](effects/neumorphism.md) | 旋钮、按键等实体感控件；保证状态对比度 |
| [点击涟漪（Ripple）](effects/water-ripple.md) | 点击位置的操作反馈 |

## 进阶效果（14）

| 效果 | 类型与常见用途 |
| --- | --- |
| 滚动渐显（Scroll Reveal） | 元素进入视口时出现；首屏内容不能等待动画 |
| 视差滚动（Parallax） | 多层内容的纵深；控制幅度并支持减少动态效果 |
| 吸顶叙事（Sticky Scroll） | 固定一侧，另一侧分段讲述 |
| 滚动驱动动画（Scroll-driven Animation） | CSS 时间线与滚动进度绑定；需静态回退 |
| 平滑滚动（Smooth Scroll） | 改变滚动手感的可选增强；避免破坏原生行为 |
| 错峰入场（Stagger） | 列表或组内元素依次出现；长列表缩短或取消延迟 |
| 数字滚动（Count Up） | 统计值变化；最终值应可读且语义正确 |
| 页面视图转场（View Transitions） | 同一元素在页面或状态之间连续过渡；需回退 |
| 弹簧动画（Spring） | 拖拽释放、回弹和直接操作反馈 |
| 文字扫光（Shimmer Text） | 短暂标题强调，不用于大段正文 |
| 无限跑马灯（Marquee） | 重复品牌或短标签；可暂停且不影响阅读 |
| 骨架屏（Skeleton） | 等待期间占位；尺寸贴近真实内容以减少布局跳动 |
| 噪点颗粒（Grain） | 静态或轻微变化的表面纹理；注意面积和重绘成本 |
| 液态形变（Blob Morph） | 缓慢形状变化的装饰背景；减少动态效果时静止 |

## 组合示例

- SaaS 首屏：标题模糊渐显 + 一个主要 CTA 的短反馈；避免再叠加全屏粒子和视差。
- 内容叙事：吸顶叙事或滚动渐显二选一作为主效果；正文在动画关闭时仍完整呈现。
- 交互卡片：轻微 3D 倾斜 + 局部高光；触屏改为无倾斜静态表现。
- 数据加载：匹配真实布局的骨架屏，完成后直接显示内容；不要把循环骨架动画误当进度。
- 操作成功：按钮状态变化或短暂涟漪；彩纸仅用于确有庆祝意义的完成事件。