# 聚光灯（Spotlight）

用径向遮罩或高光跟随鼠标，做局部探照效果。以下示例只叠加高光，不隐藏真实内容；如果采用揭示遮罩，遮罩下的信息仍须有可访问的静态版本。

```html
<div class="spotlight" data-spotlight>
  <div class="spotlight__grid" aria-hidden="true"></div>
  <article class="spotlight__content">
    <h2>细节都藏在暗处</h2>
    <p>8pt 网格 · 圆角 16 · 阴影 0 12 32</p>
  </article>
</div>
```

```css
.spotlight { --x: 50%; --y: 50%; --radius: 130px; position: relative; min-height: 240px; overflow: hidden; color: #e5efff; background: #080d18; }
.spotlight__grid { position: absolute; inset: 0; pointer-events: none; background: radial-gradient(circle at var(--x) var(--y), rgb(120 170 255 / 25%), transparent var(--radius)); }
.spotlight__content { position: absolute; inset: 0; display: grid; align-content: center; justify-items: center; padding: 24px; text-align: center; }
.spotlight__content p { margin: 0; }

@media (prefers-reduced-motion: reduce) {
  .spotlight { --x: 50% !important; --y: 50% !important; --radius: 180px !important; }
}
```

```js
const canSpotlight = matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)").matches;

if (canSpotlight) {
  document.querySelectorAll("[data-spotlight]").forEach((surface) => {
    surface.addEventListener("pointermove", (event) => {
      const bounds = surface.getBoundingClientRect();
      surface.style.setProperty("--x", `${event.clientX - bounds.left}px`);
      surface.style.setProperty("--y", `${event.clientY - bounds.top}px`);
      surface.style.setProperty("--radius", event.buttons ? "240px" : "130px");
    });

    surface.addEventListener("pointerleave", () => {
      surface.style.setProperty("--x", "50%");
      surface.style.setProperty("--y", "50%");
      surface.style.setProperty("--radius", "130px");
    });
  });
}
```

只在精确指针设备启用跟随；触屏不需要模拟鼠标光圈。高频场景应限制绘制区域并测量滤镜成本。