# iPhone Duo 适配

iPhone Duo 是可折叠 iPhone:紧凑的**外屏**与大尺寸**内屏**,两块屏各有前置摄像头,中间铰链支持多种姿态(合上、完全展开、书本式半折、桌面支撑、立放)。它仍是 iPhone(`os(iOS)`、idiom 为 phone),iOS 的设计与开发规范全部适用。

官方资料(新 API 签名以此为准,写代码前核对):

- HIG:`https://developer.apple.com/design/human-interface-guidelines/designing-for-iphone-duo`
- 开发:`https://developer.apple.com/documentation/technologyoverviews/preparing-your-app-for-iphone-duo`
- 准备清单:`https://developer.apple.com/iphone-duo/prepare/`
- API:SwiftUI `ReservedRegion`、`ArrangementView`(iOS 27.1+);UIKit `UIView.ReservedRegion`、`UIArrangementViewController`
- Xcode 内置适配 skill:Xcode 中让助手 "get my app ready for iPhone Duo",或 `xcrun agent skills export` 导出给其他 Agent 使用

## 1. SDK 与表现

| 构建 SDK | 在 iPhone Duo 上的表现 |
| --- | --- |
| iOS 26 及更早 | 可运行但不自适应:展开时居中显示并留白;合上时位于状态栏和摄像头左侧 |
| iOS 27 | 内屏可填满大部分区域,但仍避开右侧状态栏 |
| iOS 27.1+(推荐) | 全屏显示,工具栏与标签栏竖向排列在状态栏下方 |

- 要支持 iPhone Duo,使用 Xcode 27.1+ / iOS 27.1 SDK 构建。上线前确认所有页面适应竖排栏。
- 部署最低版本可保持不变;27.1 专用 API(`ReservedRegion`、`ArrangementView` 等)必须用 `if #available(iOS 27.1, *)` 保护,低版本走普通自适应布局。

## 2. 设计原则

- **按尺寸自适应,不为姿态单独设计**:外屏按 compact 宽度布局,内屏按 regular 宽度布局,覆盖所有姿态。尺寸变化时让既有布局自然扩展,不要重新设计一套界面。
- **跨屏一致**:合上/展开时功能、状态、选中项、滚动位置、输入内容保持不变。内屏可多显示一层层级(如外屏只有列表或详情,内屏并排显示列表和详情),但信息结构不变。
- **跨姿态功能一致**:空间不足时控件可进入溢出菜单,但任何姿态下都能访问到同样的功能和内容。
- **折叠时小幅调整**:只移动必要元素以保持可见和可点击,避免大幅重排或控件消失。网格优先使用**偶数列**,让内容在折痕处均匀分开。
- **位移(displacement)**:非滚动的浮动元素(提示、浮动控件、媒体控制)在半折时移动到更合适的一侧,相关元素一起移动以保持关联。连续滚动内容(文章、信息流、列表)不做位移。
  - 书本式半折:提示等元素移到 trailing 侧(合上后会出现在外屏)。
  - 桌面支撑:上半区放远距离观看的内容,下半区放可点击的控件。
- **iPad 化**:内屏上的布局应像 iPad 布局的自然延伸。

## 3. 安全区与保留区域

### 安全区

- 交互型前景内容放在安全区内;背景内容(图片、颜色)可超出安全区(`.ignoresSafeArea()` 或使用视图 bounds)。
- **安全区和边距通常不对称**(侧边竖排栏、外屏摄像头位于角落),每条边单独处理,不要假设两侧相等:

```swift
// 错误:假设左右 inset 相同
let width = view.bounds.width - view.safeAreaInsets.left * 2
// 正确:每条边分别计算
let width = view.bounds.inset(by: view.safeAreaInsets).width
```

- 需要相对整屏居中的 UI(如不滚动的装饰性内容)可以不加偏移,但必须确保交互元素不被遮挡。

### 保留区域(Reserved Regions)

| 区域 | 类型 | 状态 |
| --- | --- | --- |
| 外屏前置摄像头 | occlusion | 始终存在;实时活动时扩展为灵动岛 |
| 内屏前置摄像头 | occlusion | 仅在摄像头工作时生效,UI 会让位 |
| 折痕区域 | division | 半折时生效;完全展开时不生效(宽度为 0) |

- 系统组件(提示、上下文菜单、sheet、split view、标签栏)会自动避开保留区域;优先使用系统组件,大多数 App 不需要自己读取。
- **需要自行处理的情况**:自定义浮层、浮动控件、用明确 frame 或自定义 `Layout` 定位内容的视图。列表、表格、滚动视图、集合视图默认**不会**在折痕处拆分内容;如果某一行跨越折痕导致难以阅读,需要自行处理。
- 在负责定位内容的视图中读取,保证坐标系一致:

```swift
@available(iOS 27.1, *)
struct FoldAwareContent: View {
    var body: some View {
        GeometryReader { proxy in
            if let fold = proxy.reservedRegions(kind: .division).first {
                let frame = fold.frame
                if frame.height > frame.width {
                    HStack(spacing: 0) {
                        LeadingPane().frame(width: frame.minX)
                        Color.clear.frame(width: frame.width)
                        TrailingPane().frame(width: proxy.size.width - frame.maxX)
                    }
                } else {
                    VStack(spacing: 0) {
                        LeadingPane().frame(height: frame.minY)
                        Color.clear.frame(height: frame.height)
                        TrailingPane().frame(height: proxy.size.height - frame.maxY)
                    }
                }
            } else {
                LeadingPane()
            }
        }
    }
}
```

- `frame` 使用当前视图坐标系,已包含 `margins`,无需再额外加间距;在自定义 `Layout` 中计算时从 `(0, 0)` 起算,放置子视图时再加 `bounds.origin`。
- 默认只返回 active 区域;用 `options: .includeInactive` 获取非活动区域,可提前预留空间以避免布局跳动,或据此决定网格使用偶数列。
- RTL 下区域 frame 默认会镜像;不随布局方向翻转的定位使用 `layoutDirectionBehavior: .fixed`。
- `ReservedRegion` 遵循 `Identifiable`,可用 `id` 跨查询跟踪同一区域。
- UIKit:`view.reservedRegions(kind:options:)`,在 `layoutSubviews` / `viewDidLayoutSubviews` 中使用。

## 4. Arrangement View

两个关联视图需要随方向和折叠自动排列时,用 `ArrangementView`,不要自己读取折痕:

| 样式 | 适用 | 行为 |
| --- | --- | --- |
| `.split` | 原本用 `HStack`/`VStack` 并排的两个视图 | 横向时 primary 在 leading、secondary 在 trailing;竖向时 primary 在上;外屏横向合上时只显示 primary |
| `.overlay` | 原本用 `ZStack` 叠放的视图(视频 + 播放控件) | 平展时 primary 叠在 secondary 上;半折时分到折痕两侧(secondary 在 leading/上方,primary 在 trailing/下方) |

```swift
if #available(iOS 27.1, *) {
    ArrangementView {
        PlayerControls()
    } secondary: {
        VideoPlayer()
    }
    .arrangementViewStyle(.overlay)
} else {
    ZStack(alignment: .bottom) { VideoPlayer(); PlayerControls() }
}
```

- 用 `.split.axes(.horizontal)` 等限制排列轴;用 `splitArrangementLayoutRatio`、`splitArrangementLayoutSize` 调整尺寸。
- **不要**把 Arrangement View 放进 `NavigationSplitView`、`List`、`ScrollView`、`Grid` 等容器;也**不要**在其中放 `NavigationSplitView`、`TabView`。导航容器放在它外层。
- UIKit 使用 `UIArrangementViewController`。

## 5. 竖排栏(Vertical Controls)

外屏,以及内屏横向时,系统会把导航栏、工具栏、标签栏、状态栏、灵动岛竖向放在侧边(内屏竖向时仍为横排)。两个 App 分屏时,各自的栏位于外侧边缘。竖排栏与硬件对齐,在 RTL 语言下**不翻转**。

- 使用系统提供的栏:SwiftUI 在 `NavigationStack`/`NavigationSplitView` 内使用 `.toolbar`;UIKit 在导航控制器中设置 `toolbarItems`/`navigationItem`。**不要**自行用 `UIToolbar`/`UINavigationBar`/`UITabBar` 或自定义视图拼栏,否则不会竖排。
- **每个工具栏项同时提供图标和标题**:竖排时只显示图标,横排时优先显示图标,溢出菜单中同时显示图标和标题。只有标题或使用自定义视图的项**不会**竖排显示。
- 顺序:顶部放主要导航(返回、关闭),然后是主要操作(完成)。完成按钮使用 `.topBarPinnedTrailing`;自定义返回/关闭按钮使用 `.cancellationAction`。
- 用 `visibilityPriority(_:)` 控制空间不足时的溢出顺序,用 `axisBehavior(_:)` 控制某项是否参与竖排,不常用的操作放入 `ToolbarOverflowMenu`。
- Sheet:外屏默认竖排,可用 `toolbarVerticalBehavior(_:)` 关闭;内屏通过 `presentationPlacement(_:)` 指定位置(居中/leading 为横排,trailing 为竖排)。Inspector 始终横排;Split View 中侧栏/内容栏横排、详情栏竖排。
- 自定义视图需要感知竖排栏时读取 `@Environment(\.toolbarVerticalEdge)`(UIKit:`traitCollection.verticalBarEdge`)。
- 头图或背景图需要延伸到竖排栏下方时,使用 `.backgroundExtensionEffect()`(UIKit:`UIBackgroundExtensionView`)。
- 由于控件只在一侧,内容区不对称:依赖安全区,不要把内容居中计算写死。

## 6. 代码排查清单(禁止的写法)

| 问题写法 | 替代 |
| --- | --- |
| `UIScreen.main.bounds` / 保存 `UIScreen` 引用 | 视图或窗口 bounds;SwiftUI 用 `GeometryReader`/`onGeometryChange`;需要屏幕时动态读取 `view.window?.windowScene?.screen` |
| 在启动或 `viewIsAppearing` 时只读取一次尺寸 | 在 `layoutSubviews`/`viewDidLayoutSubviews` 中布局;尺寸变化处理放在 `viewWillTransition(to:with:)` |
| `UIScreen.main.scale` | `traitCollection.displayScale` / `@Environment(\.displayScale)` |
| `UIWindow(frame: UIScreen.main.bounds)` | `UIWindow(windowScene:)` |
| 用 `UIDevice.current.orientation`、`statusBarOrientation`、`interfaceOrientation`(包括 `effectiveGeometry.interfaceOrientation`)决定布局 | 比较可用空间的宽高 |
| `userInterfaceIdiom == .phone / .pad` 决定布局 | size class 或可用空间 |
| 把 `horizontalSizeClass == .regular` 当作 iPad | iPhone 也会出现 regular;按能力和空间判断 |
| 机型尺寸常量(`bounds.height == 844`、机型列表) | 自适应布局 |
| 全屏媒体使用 `.scaleAspectFill` / `.aspectRatio(contentMode: .fill)` | 按宽高比在 fill/fit 间选择,或设置焦点区域,避免宽屏下裁掉关键内容 |
| 锁定方向 | 支持所有方向 |
| 自绘导航栏、工具栏、标签栏 | 系统栏 + `.toolbar` |

## 7. 相机

- 设备有外屏摄像头、内屏摄像头和后置摄像头;开合与旋转会导致 App 换屏,当前摄像头的朝向也可能反转。按摄像头朝向选择设备,并跟踪变化(AVKit "Choosing a camera by the direction it faces")。
- 完全展开并使用后置摄像头时,可以在外屏向被拍摄者显示内容(AVFoundation "Registering a camera capture accessory on iPhone Duo")。
- 内屏摄像头工作时会成为保留区域,UI 需要让位。

## 8. 测试

- 工具:Device Hub 中的 iOS 可调尺寸模拟器;macOS 27 的 iPhone 镜像(把窗口拉到两个方向的极端尺寸);Xcode 27.1 的 **iPhone Duo 模拟器**(最完整);有条件时用真机。
- 测试矩阵:外屏竖/横 × 内屏完全展开竖/横 × 书本半折 × 桌面支撑 × 内屏分屏(左右两侧) × RTL × 最大 Dynamic Type。
- 每个页面、sheet、popover 检查:
  - 尺寸变化后布局正确,没有拉伸、裁切或错位;
  - 竖排栏中的项都有图标,并按优先级正确溢出;
  - 没有控件落在折痕或摄像头区域内;
  - 开合时状态、滚动位置、输入内容保留;
  - 镜头切换和朝向正确(相机类 App)。
- XCUITest:在 iPhone Duo 模拟器的 destination 上运行冒烟测试计划;断言基于 `accessibilityIdentifier`,不依赖坐标。快照测试覆盖外屏、内屏和半折三种尺寸。
- 单元测试:把折痕/保留区域的计算抽成纯函数,用固定的 `CGRect` 输入测试。

## 9. 上架

- 在 App Store Connect 上传 iPhone Duo 截图后,产品页会显示"已为 iPhone Duo 优化"标识。按截图规范提供各方向的截图。
- 使用 App Store Connect 的预览工具查看素材在 iPhone Duo 上的效果。
- 可提交推荐申请,在 Helpful Details 中注明支持 iPhone Duo 及所有姿态。
