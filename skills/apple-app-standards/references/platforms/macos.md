# macOS 注意事项

- **原生体验**:不是放大的 iPad App。使用 `NavigationSplitView` 侧边栏、工具栏、菜单、多窗口、右键菜单与键盘快捷键。
- **场景**:`WindowGroup`(主窗口,可多开)、`Window`(单例窗口)、`Settings`(偏好设置,Cmd+,)、`MenuBarExtra`(菜单栏 App)、`DocumentGroup`(文档 App)。
- **菜单与命令**:`.commands { CommandGroup / CommandMenu }`;所有常用操作有菜单项与快捷键;使用 `@FocusedValue` 让菜单作用于当前窗口。
- **窗口**:设置 `defaultSize`、`windowResizability`、`.frame(minWidth:minHeight:)`;恢复窗口状态;`.windowToolbarStyle` 匹配内容。
- **输入**:鼠标悬停、右键、拖放、全键盘访问、触控板手势;表格用 `Table` 支持排序、多选。
- **控件尺寸**:macOS 控件更紧凑,使用 `.controlSize`;不要沿用 44pt 触控尺寸导致界面稀疏。
- **App Sandbox**:Mac App Store 必须开启沙盒;文件访问通过 `fileImporter`/打开面板并使用安全作用域书签持久化;仅申请必要的 entitlements。
- **Hardened Runtime 与公证**:App Store 外分发需 Developer ID 签名 + Hardened Runtime + `notarytool` 公证 + staple。
- **生命周期**:关闭最后一个窗口时是否退出需明确;支持 App 在无窗口时响应 Dock 点击重新打开。
- **AppKit 桥接**:缺少能力时使用 `NSViewRepresentable`/`NSHostingView`;AppKit 代码限定在 macOS 专用文件中。
- **架构**:构建 Universal 二进制,除非最低版本只支持 Apple 芯片。
- **登录项/后台**:使用 `SMAppService`,不用旧的 helper 方式。
- **测试**:`-destination 'platform=macOS'`;多窗口、深浅色、窗口最小尺寸、全键盘操作。
