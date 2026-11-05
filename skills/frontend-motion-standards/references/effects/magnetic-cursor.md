# 磁吸按钮与光标变形（Magnetic / Cursor Morph）

桌面精确指针靠近按钮时，按钮小幅朝指针偏移；自定义光圈靠近按钮时变宽。示例仅对鼠标启用、限制最大位移，离开区域后复位。不要在整个页面隐藏系统光标。

```html
<div class="magnetic-area" data-magnetic-area>
  <button class="magnetic-button" type="button">开始使用</button>
  <span class="magnetic-cursor" data-magnetic-cursor aria-hidden="true"></span>
</div>
```

```css
.magnetic-area { position: relative; display: grid; min-height: 180px; place-items: center; }
.magnetic-button { --dx: 0px; --dy: 0px; position: relative; z-index: 1; padding: 14px 24px; border: 0; border-radius: 999px; color: white; background: #263c77; transform: translate(var(--dx), var(--dy)); transition: transform 180ms ease-out; }
.magnetic-button:focus-visible { outline: 3px solid #e8ad58; outline-offset: 4px; }
.magnetic-cursor { position: absolute; z-index: 2; width: 24px; height: 24px; border: 1px solid #263c77; border-radius: 50%; opacity: 0; pointer-events: none; transform: translate(-50%, -50%); transition: width 180ms, height 180ms, border-radius 180ms, opacity 180ms; }
.magnetic-area[data-pointer="mouse"] .magnetic-cursor { opacity: 1; }
.magnetic-cursor.is-morphed { border-radius: 999px; background: rgb(38 60 119 / 10%); }

@media (hover: none), (prefers-reduced-motion: reduce) {
  .magnetic-button { transform: none; transition: none; }
  .magnetic-cursor { display: none; }
}
```

```js
const area = document.querySelector("[data-magnetic-area]");
const buttons = [...area.querySelectorAll(".magnetic-button")];
const cursor = area.querySelector("[data-magnetic-cursor]");
const mouseOnly = matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)").matches;

if (mouseOnly) {
  area.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse") return;
    const bounds = area.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    area.dataset.pointer = "mouse";
    cursor.style.left = `${x}px`;
    cursor.style.top = `${y}px`;

    let nearest = null;
    let nearestDistance = 84;
    for (const button of buttons) {
      const rect = button.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      const distance = Math.hypot(dx, dy);
      if (distance < nearestDistance) {
        nearest = { button, rect, dx, dy };
        nearestDistance = distance;
      }
    }

    for (const button of buttons) {
      button.style.setProperty("--dx", "0px");
      button.style.setProperty("--dy", "0px");
    }
    cursor.classList.toggle("is-morphed", Boolean(nearest));
    if (nearest) {
      nearest.button.style.setProperty("--dx", `${nearest.dx * 0.12}px`);
      nearest.button.style.setProperty("--dy", `${nearest.dy * 0.12}px`);
      cursor.style.width = `${nearest.rect.width + 12}px`;
      cursor.style.height = `${nearest.rect.height + 12}px`;
    } else {
      cursor.style.width = "24px";
      cursor.style.height = "24px";
    }
  });

  area.addEventListener("pointerleave", () => {
    delete area.dataset.pointer;
    cursor.classList.remove("is-morphed");
    for (const button of buttons) {
      button.style.setProperty("--dx", "0px");
      button.style.setProperty("--dy", "0px");
    }
  });
}
```

保留原生光标作为默认体验；若产品确需隐藏系统光标，应限于局部创意区域，并测试焦点、文本选择、触屏和 reduced-motion。