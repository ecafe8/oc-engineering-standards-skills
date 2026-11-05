# 三维倾斜（3D Tilt）

鼠标在卡片上的位置映射到有限的 X/Y 旋转角度；高光随指针移动，离开后回到中立状态。保留真实内容的可读性，不要让视角变形遮住文字。

```html
<article class="tilt-card" data-tilt>
  <div class="tilt-card__art" aria-hidden="true"></div>
  <div class="tilt-card__shine" aria-hidden="true"></div>
  <div class="tilt-card__content">
    <small>COLLECTOR SERIES</small>
    <h2>Golden Hour</h2>
  </div>
</article>
```

```css
.tilt-card {
  --rx: 0deg;
  --ry: 0deg;
  --px: 50%;
  --py: 50%;
  position: relative;
  width: min(280px, 100%);
  aspect-ratio: 5 / 7;
  overflow: hidden;
  border-radius: 16px;
  background: #28234a;
  transform: perspective(800px) rotateX(var(--rx)) rotateY(var(--ry));
  transform-style: preserve-3d;
  transition: transform 220ms ease-out;
}

.tilt-card__art,
.tilt-card__shine {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.tilt-card__art { background: linear-gradient(150deg, #f8b17a, #a54b78 55%, #30294f); transform: translateZ(18px); }
.tilt-card__shine { background: radial-gradient(circle at var(--px) var(--py), rgb(255 255 255 / 55%), transparent 42%); mix-blend-mode: screen; }
.tilt-card__content { position: absolute; inset: auto 18px 20px; color: white; transform: translateZ(36px); }

@media (prefers-reduced-motion: reduce) {
  .tilt-card { transform: none; transition: none; }
  .tilt-card__shine { display: none; }
}
```

```js
const tiltEnabled = matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)").matches;

if (tiltEnabled) {
  document.querySelectorAll("[data-tilt]").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const bounds = card.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width;
      const y = (event.clientY - bounds.top) / bounds.height;
      card.style.setProperty("--rx", `${(0.5 - y) * 16}deg`);
      card.style.setProperty("--ry", `${(x - 0.5) * 16}deg`);
      card.style.setProperty("--px", `${x * 100}%`);
      card.style.setProperty("--py", `${y * 100}%`);
    });

    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--ry", "0deg");
      card.style.setProperty("--px", "50%");
      card.style.setProperty("--py", "50%");
    });
  });
}
```

将最大角度控制在轻微范围。卡片可点击时，保持其原有语义和键盘焦点样式；框架组件卸载时移除监听器。