# 流光边框（Border Beam）

用旋转的锥形渐变表示明确的处理中状态。状态完成后停止流动并改为静态成功描边；不要让装饰动画冒充真实进度。

```html
<div class="beam-frame" data-status="busy">
  <div class="beam-frame__content" role="status" aria-live="polite">
    <span>正在生成方案…</span>
  </div>
</div>
```

```css
@property --beam-angle {
  syntax: "<angle>";
  inherits: false;
  initial-value: 0deg;
}

.beam-frame {
  position: relative;
  isolation: isolate;
  padding: 2px;
  overflow: hidden;
  border-radius: 14px;
  background: #343944;
}

.beam-frame::before {
  position: absolute;
  z-index: 0;
  inset: 0;
  background: conic-gradient(from var(--beam-angle), transparent 0 72%, #9db4ff 82%, #fff 86%, transparent 92%);
  content: "";
}

.beam-frame[data-status="busy"]::before { animation: beam-rotate 1.8s linear infinite; }
.beam-frame[data-status="done"] { background: #35a878; }
.beam-frame[data-status="done"]::before { display: none; }

.beam-frame__content { position: relative; z-index: 1; padding: 16px; border-radius: 12px; color: #f5f6fa; background: #17191f; }

@keyframes beam-rotate { to { --beam-angle: 360deg; } }

@media (prefers-reduced-motion: reduce) {
  .beam-frame[data-status="busy"]::before { animation: none; }
}
```

应用真实任务状态设置 `data-status="busy"`、`done` 或 `idle`。不支持 `@property` 的浏览器可显示静止渐变，不影响内容或状态文本。