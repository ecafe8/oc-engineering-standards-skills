# 彩带光标拖尾（Cursor Trail）

Canvas 绘制短暂渐隐的指针轨迹。模板限制轨迹点数量、仅在鼠标输入和允许动态效果时启动；它是纯装饰，不承担提示或交互功能。

```html
<div class="trail-area" data-trail-area>
  <canvas data-trail aria-hidden="true"></canvas>
  <p>Move your pointer</p>
</div>
```

```css
.trail-area { position: relative; min-height: 260px; overflow: hidden; background: #101522; color: white; }
.trail-area canvas { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.trail-area p { position: relative; padding: 24px; }

@media (prefers-reduced-motion: reduce) {
  .trail-area canvas { display: none; }
}
```

```js
const area = document.querySelector("[data-trail-area]");
const canvas = area.querySelector("[data-trail]");
const context = canvas.getContext("2d");
const points = [];
const motionAllowed = matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)").matches;
let frame = 0;

function resize() {
  const bounds = area.getBoundingClientRect();
  const ratio = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(bounds.width * ratio);
  canvas.height = Math.round(bounds.height * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function draw(now) {
  const bounds = area.getBoundingClientRect();
  while (points.length && now - points[0].time > 650) points.shift();
  context.clearRect(0, 0, bounds.width, bounds.height);

  for (let index = 1; index < points.length; index += 1) {
    const point = points[index];
    const previous = points[index - 1];
    const age = (now - point.time) / 650;
    context.beginPath();
    context.moveTo(previous.x, previous.y);
    context.lineTo(point.x, point.y);
    context.lineWidth = 2 + (index / points.length) * 12;
    context.lineCap = "round";
    context.strokeStyle = `hsla(${(now / 20 + index * 8) % 360}, 90%, 65%, ${1 - age})`;
    context.stroke();
  }

  if (points.length) frame = requestAnimationFrame(draw);
  else frame = 0;
}

if (motionAllowed) {
  resize();
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(area);
  area.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse") return;
    const bounds = area.getBoundingClientRect();
    points.push({ x: event.clientX - bounds.left, y: event.clientY - bounds.top, time: performance.now() });
    if (points.length > 36) points.shift();
    if (!frame) frame = requestAnimationFrame(draw);
  });
}
```

若轨迹需要跨越更大区域或增加火花，优先使用粒子库或进一步限制粒子数；框架组件中断开 `ResizeObserver` 并移除监听器。