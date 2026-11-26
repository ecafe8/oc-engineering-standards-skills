# Apple Intelligence 与端侧 AI 调用规范

AI 相关框架迭代快。写代码前必须用 Context7(`/websites/developer_apple_foundationmodels`)或 developer.apple.com 核对当前 SDK 的签名、可用平台与版本;本文只列稳定原则。

## 能力选型

| 需求 | 首选 |
| --- | --- |
| 文本生成、摘要、抽取、分类、结构化输出、工具调用 | Foundation Models(`SystemLanguageModel`) |
| 系统级写作/图像能力 | Writing Tools(系统文本控件自动获得)、Image Playground(`imagePlaygroundSheet`)、Genmoji(`NSAdaptiveImageGlyph`) |
| 让 Siri / Apple Intelligence / Visual Intelligence 调用 App 功能 | App Intents(`AppIntent`、`AppEntity`、assistant schemas) |
| 文字识别、条码、人脸、图像分析 | Vision(Swift API,如 `RecognizeTextRequest`) |
| 语言识别、分词、词嵌入 | NaturalLanguage |
| 语音转文字 | Speech(26+ `SpeechAnalyzer`/`SpeechTranscriber`;旧版 `SFSpeechRecognizer`) |
| 翻译 | Translation(`translationTask`、`TranslationSession`) |
| 自定义模型 | Core ML(Create ML 训练或转换);大模型可评估 MLX Swift |

优先端侧;需要云端模型时,向用户明确告知并获得同意,遵守隐私政策与审核指南 5.1。

## Foundation Models

### 可用性(必须)

默认基线(26+)无需版本分支即可 `import FoundationModels`;扩展基线需 `#available(iOS 26, macOS 26, *)`。27 SDK 新增了 `PrivateCloudComputeLanguageModel`(私有云计算模型,可用性原因含 `systemNotReady`),使用前查文档并告知用户数据会离开设备。

```swift
import FoundationModels

switch SystemLanguageModel.default.availability {
case .available:
    showAIFeature()
case .unavailable(.deviceNotEligible):
    hideAIFeature()                     // 设备不支持,永久降级
case .unavailable(.appleIntelligenceNotEnabled):
    showEnableAppleIntelligenceHint()   // 引导用户到设置
case .unavailable(.modelNotReady):
    showRetryLater()                    // 模型下载中
@unknown default:
    hideAIFeature()
}
```

- 所有 AI 功能都有非 AI 的降级路径;核心流程不能依赖模型可用。
- 观察可用性变化(视图中读取并在出现时刷新),不在启动时缓存一次就结束。
- 检查语言支持:`supportedLanguages` / `supportsLocale(_:)`。

### 会话

- 通过协议封装(`TextAssistant`),视图不直接持有 `LanguageModelSession`,便于测试与替换。
- `instructions` 定义角色和约束,由开发者编写;用户输入只放进 prompt,不拼接进 instructions,防止提示词注入。
- 一个会话串行处理请求;检查 `session.isResponding`,避免并发调用同一会话。
- 交互式输出用 `streamResponse` 并逐步渲染;首屏前可调用 `prewarm()`。
- 上下文窗口有限(约 4096 token,含 instructions、prompt、输出);长任务拆分或创建新会话并携带摘要。

### 结构化输出

```swift
@Generable
struct TripPlan {
    @Guide(description: "Short trip title")
    var title: String
    @Guide(description: "Daily activities", .count(3))
    var days: [String]
}

let response = try await session.respond(to: prompt, generating: TripPlan.self)
```

- 优先 `@Generable` 类型而非解析自由文本;用 `@Guide` 约束范围、数量、枚举值。
- 属性顺序即生成顺序,先放依赖性低的字段。

### 工具调用

```swift
struct SearchRecipesTool: Tool {
    let name = "searchRecipes"
    let description = "Searches local recipes."

    @Generable
    struct Arguments {
        @Guide(description: "Keyword")
        var keyword: String
    }

    func call(arguments: Arguments) async throws -> [String] {
        try await recipeStore.search(arguments.keyword)
    }
}
```

- 工具只暴露最小能力,执行前校验参数;涉及写操作或隐私数据时需用户确认。
- 工具名称、描述简短,避免占用上下文。

### 错误处理

捕获 `LanguageModelSession.GenerationError`:

| 错误 | 处理 |
| --- | --- |
| `exceededContextWindowSize` | 新建会话,缩短 prompt 或输出后重试 |
| `guardrailViolation` | 向用户展示中性提示,不重试同一内容 |
| `unsupportedLanguageOrLocale` | 降级或提示语言不支持 |
| 其他(限流、取消等) | 记录日志,提供重试 |

### 测试与评估

- 单元测试使用 Mock 实现协议,不依赖真实模型。
- 使用 Xcode 的 Foundation Models Instrument 与 Playground(`#Playground`)调试 prompt;为关键 prompt 建立固定样例集,系统更新后回归评估。
- 模型输出不确定:UI 测试只断言结构与状态,不断言具体文本。

## 隐私与合规

- 不把用户数据发送到第三方服务而不告知;端侧处理也要在隐私说明中如实描述。
- AI 生成内容需可识别(标注、可编辑、可撤销),对重要决策保留人工确认。
- 遵守 Apple 的 Foundation Models 可接受使用要求,不用于被禁止的用途。
