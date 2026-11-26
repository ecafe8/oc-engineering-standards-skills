# iOS 注意事项

- **场景生命周期**:使用 SwiftUI `App`/`Scene`;监听 `@Environment(\.scenePhase)` 处理前后台、保存状态;状态恢复用 `@SceneStorage`。
- **布局**:支持竖屏为主,评估横屏;适配灵动岛、Home Indicator、键盘(`.scrollDismissesKeyboard`、`safeAreaInset`)。
- **TabView**:26 下标签栏为玻璃样式,可 `.tabBarMinimizeBehavior(.onScrollDown)`、`tabViewBottomAccessory`;标签不超过 5 个。
- **Sheet**:使用 `presentationDetents`、`presentationDragIndicator`;26 下半屏 sheet 为玻璃效果,移除自定义背景。
- **系统集成**:锁屏/主屏/StandBy 小组件、实时活动与灵动岛、控制中心控件、Action 按钮(App Intents)、Spotlight、分享扩展。
- **后台**:除音频、定位、VoIP 等明确模式外,后台执行时间有限;用 BackgroundTasks 调度,26+ 用户发起的长任务用 `BGContinuedProcessingTask`。
- **推送**:APNs 令牌上报,区分开发/生产环境;通知服务扩展做解密与富媒体。
- **设备差异**:不同摄像头、ProMotion(120Hz 动画流畅)、无 Home 键;运行时检查能力而非机型。
- **可在 Mac 运行**:iOS App 默认可在 Apple 芯片 Mac 上运行,检查是否需要在 App Store Connect 中关闭或适配(`isiOSAppOnMac`)。
- **测试**:最小屏(SE 尺寸或最小支持机型)+ 最新机型;横竖屏;最大 Dynamic Type。
- **iPhone Duo(折叠屏)**:使用 iOS 27.1+ SDK 构建才能全屏适配;外屏/内屏、折痕、竖排栏、Arrangement View 见 `iphone-duo.md`。普通 iPhone 也应遵守其中的"代码排查清单",因为 iPhone 镜像同样会改变窗口尺寸。
