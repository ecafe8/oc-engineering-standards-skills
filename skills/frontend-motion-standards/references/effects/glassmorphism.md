# 毛玻璃（Glassmorphism）

半透明前景、背景模糊、细描边和克制高光构成玻璃表面。质感来自卡片背后的内容；保证前景文字对比度，并提供不支持 `backdrop-filter` 时的实色回退。

```html
<div class="glass-scene">
  <div class="glass-scene__shape" aria-hidden="true"></div>
  <article class="glass-panel">
    <small>WEATHER · HANGZHOU</small>
    <strong>22°</strong>
    <span>晴间多云</span>
  </article>
</div>
```

```css
.glass-scene {
  position: relative;
  display: grid;
  min-height: 320px;
  overflow: hidden;
  place-items: center;
  background: radial-gradient(circle at 25% 25%, #f5b277, transparent 34%), linear-gradient(145deg, #55446f, #152f48);
}

.glass-scene__shape {
  position: absolute;
  width: 180px;
  aspect-ratio: 1;
  border-radius: 50%;
  background: #ec8068;
  filter: blur(1px);
  animation: glass-drift 12s ease-in-out infinite alternate;
}

.glass-panel {
  position: relative;
  display: grid;
  gap: 8px;
  width: min(260px, calc(100% - 32px));
  padding: 22px;
  border: 1px solid rgb(255 255 255 / 45%);
  border-radius: 18px;
  color: #fff;
  background: rgb(255 255 255 / 16%);
  box-shadow: inset 0 1px rgb(255 255 255 / 35%), 0 20px 50px rgb(0 0 0 / 22%);
  -webkit-backdrop-filter: blur(18px) saturate(1.35);
  backdrop-filter: blur(18px) saturate(1.35);
}

.glass-panel strong { font-size: 48px; font-weight: 300; line-height: 1; }

@keyframes glass-drift {
  to { transform: translate(70px, 24px) scale(1.12); }
}

@supports not (backdrop-filter: blur(1px)) {
  .glass-panel { background: #4a465c; }
}

@media (prefers-reduced-motion: reduce) {
  .glass-scene__shape { animation: none; }
}
```

滤镜和大面积玻璃可能带来明显绘制成本；优先限制在小区域，低端设备上验证滚动和合成表现。