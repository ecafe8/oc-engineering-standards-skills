# 极光背景（Aurora）

用几条不同周期的竖向渐变光幕形成缓慢流动的背景。装饰层不参与交互或读屏；内容对比度独立于背景动画保持充足。

```html
<section class="aurora-scene">
  <div class="aurora" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
  <div class="aurora-scene__content"><p>ARCTIC SKY</p><h2>Look north tonight</h2></div>
</section>
```

```css
.aurora-scene { position: relative; isolation: isolate; min-height: 320px; overflow: hidden; color: white; background: linear-gradient(#071020, #112b42); }
.aurora { position: absolute; z-index: -1; inset: 0; overflow: hidden; }
.aurora i { position: absolute; bottom: -40%; width: 38%; height: 120%; border-radius: 50% 50% 0 0; filter: blur(18px); opacity: .7; transform-origin: 50% 100%; background: linear-gradient(to top, transparent, rgb(55 232 177 / 80%) 28%, rgb(100 130 255 / 45%) 70%, transparent); animation: aurora-wave 12s ease-in-out infinite alternate; }
.aurora i:nth-child(1) { left: 0; animation-duration: 11s; }
.aurora i:nth-child(2) { left: 24%; animation-delay: -4s; animation-duration: 15s; }
.aurora i:nth-child(3) { left: 48%; animation-delay: -7s; animation-duration: 13s; }
.aurora i:nth-child(4) { left: 72%; animation-delay: -2s; animation-duration: 17s; }
.aurora-scene__content { position: relative; padding: 48px 28px; text-shadow: 0 2px 14px rgb(0 0 0 / 55%); }
.aurora-scene__content p { font-size: 12px; }

@keyframes aurora-wave {
  to { transform: translateX(24px) skewX(18deg) scaleY(1.12); }
}

@media (prefers-reduced-motion: reduce) {
  .aurora i { animation: none; }
}
```

模糊层面积大时应做真实设备测量；可减少光幕数量、模糊半径和动画区域。