# iPadOS 注意事项

- **多栏布局**:主要界面使用 `NavigationSplitView`;compact 宽度自动折叠为栈,确保 compact 下仍可用。
- **自适应**:以 `horizontalSizeClass` 和容器尺寸决定布局,不以设备类型判断;支持所有方向。
- **多任务与窗口**:支持 Split View、Slide Over、Stage Manager 及 iPadOS 26 自由缩放窗口;内容随任意尺寸重排,设置合理最小尺寸。
- **多窗口**:需要时启用多场景(`UIApplicationSupportsMultipleScenes`),`WindowGroup(for:)` 打开数据驱动的新窗口,`@Environment(\.openWindow)`;每个窗口状态独立。
- **菜单栏**(iPadOS 26):用 `.commands` 定义菜单命令,与 macOS 共享。
- **键盘**:常用操作提供 `.keyboardShortcut`;按住 Command 显示快捷键;支持 Tab 焦点导航。
- **指针**:`.hoverEffect`、`.onHover`、右键 `.contextMenu`;点击目标与悬停反馈一致。
- **Apple Pencil**:需要时支持 PencilKit、`.onPencilDoubleTap`、`.onPencilSqueeze`;Scribble 在系统文本框自动可用。
- **拖放**:`Transferable` + `.draggable` / `.dropDestination`,支持跨 App 拖放。
- **外接显示器**:Stage Manager 下窗口可移到外屏,不依赖固定屏幕尺寸。
- **测试**:最小与最大 iPad、1/3 分屏宽度、窗口缩放、硬件键盘、指针。
