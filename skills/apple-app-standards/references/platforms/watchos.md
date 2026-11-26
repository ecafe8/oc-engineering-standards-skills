# watchOS 注意事项

- **定位**:watchOS App 是"一瞥"体验——任务在数秒内完成;只放最关键功能,不移植整个 iPhone App。
- **独立性**:默认构建独立 Watch App(无需 iPhone 安装);与 iPhone 数据同步用 WatchConnectivity 或 CloudKit,网络直接用 `URLSession`。
- **导航**:`NavigationStack`、垂直分页 `TabView(.verticalPage)`、`NavigationSplitView`(列表-详情);层级浅。
- **布局**:内容可滚动适配各表盘尺寸;使用 `.containerBackground` 与系统材质;26 下控件为玻璃样式;使用边缘到边缘设计。
- **输入**:数码表冠(`.digitalCrownRotation`)、双指互点手势(`.handGestureShortcut(.primaryAction)`)、听写;文本输入尽量避免。
- **复杂功能与小组件**:WidgetKit 实现表盘复杂功能和智能叠放;用 `relevance` 提升在智能叠放中的排序;更新预算有限。
- **控件**:watchOS 26 支持控制中心控件(`ControlWidget`)。
- **后台**:后台刷新预算有限,使用 `.backgroundTask` 与后台 `URLSession`;运动场景用 `HKWorkoutSession`。
- **实时活动**:iPhone 的 Live Activities 会自动出现在智能叠放,检查其在手表上的布局。
- **通知**:自定义长通知界面;动作按钮简短。
- **性能与电量**:避免持续动画和频繁网络;常亮显示(Always On)下降低刷新频率,读取 `isLuminanceReduced` 隐藏敏感信息。
- **健康与运动**:HealthKit、CoreMotion 权限在手表上同样需要用途说明。
- **测试**:最小与最大表盘模拟器;`-destination 'platform=watchOS Simulator,name=...'`;Always On 状态;与 iPhone 配对和独立两种场景。
