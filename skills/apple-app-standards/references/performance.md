# 性能与可观测性

## SwiftUI

- `body` 只做计算,不做 I/O、格式化大数据或创建昂贵对象;格式化结果缓存到模型。
- 视图拆小,让依赖最小化——`@Observable` 按属性追踪,只读取需要的属性。
- 列表使用 `List` 或 `LazyVStack`/`LazyVGrid`;`ForEach` 使用稳定 `id`,不使用 `indices` 或每次生成的 UUID。
- 避免在 `body` 中条件切换整个视图类型导致身份丢失;用修饰符参数表达状态变化。
- 图片按显示尺寸下采样,异步加载并缓存;不在主线程解码大图。
- 不滥用 `AnyView`、`GeometryReader`、`.id()` 强制重建。

## 启动与资源

- 冷启动目标:首帧 < 400ms(在最低支持设备测量)。启动路径只初始化必需依赖,其他延迟到首屏后。
- 不在 `init`/`App.init` 中进行同步 I/O 或网络。
- 内存:关注大集合、图片缓存上限;响应内存警告。
- 电量:合并网络请求,后台任务最小化,定位使用最低精度。
- App 体积:资源使用 Asset Catalog(按设备裁剪),按需资源/背景资源处理大文件。

## 工具

| 问题 | 工具 |
| --- | --- |
| 视图更新过多、卡顿 | Instruments SwiftUI 模板、Hangs、`Self._printChanges()`(仅调试) |
| CPU 热点 | Time Profiler |
| 内存泄漏与增长 | Leaks、Allocations、Memory Graph |
| 启动 | App Launch 模板、`XCTApplicationLaunchMetric` |
| 并发 | Swift Concurrency 模板 |
| AI 推理 | Foundation Models Instrument |
| 线上指标 | Xcode Organizer、MetricKit |

## 可观测性

- 关键流程用 `OSSignposter` 打点,便于 Instruments 测量区间。
- 集成 MetricKit(`MXMetricManager`)收集崩溃、卡顿、启动、能耗诊断并上报自有后端;如用第三方崩溃平台,确保符号表(dSYM)上传。
- 性能回归:为关键操作写 `measure` 测试并在 CI 记录基线。
