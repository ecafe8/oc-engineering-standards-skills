# 水面涟漪（Water Ripple）

下面给出低分辨率 Canvas 高度场的最小实现。只有发生输入或波面仍在运动时才绘制；Canvas 是装饰层，用户无需依赖它才能理解或操作界面。

```html
<div class="water" data-water>
  <canvas data-water-canvas aria-hidden="true"></canvas>
  <button type="button" data-water-drop>Drop a ripple</button>
</div>
```

```css
.water { position: relative; display: grid; min-height: 260px; overflow: hidden; place-items: center; background: #123b61; touch-action: manipulation; }
.water canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
.water button { position: relative; z-index: 1; padding: 12px 20px; border: 1px solid rgb(255 255 255 / 45%); border-radius: 12px; color: white; background: rgb(255 255 255 / 18%); -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); }
.water button:focus-visible { outline: 3px solid white; outline-offset: 4px; }

@media (prefers-reduced-motion: reduce) {
  .water canvas { display: none; }
  .water button { -webkit-backdrop-filter: none; backdrop-filter: none; }
}
```

```js
const surface = document.querySelector("[data-water]");
const canvas = surface.querySelector("[data-water-canvas]");
const context = canvas.getContext("2d");
const button = surface.querySelector("[data-water-drop]");
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
const scale = 3;
let width = 0;
let height = 0;
let current;
let previous;
let frame = 0;

function resize() {
  const bounds = surface.getBoundingClientRect();
  canvas.width = Math.round(bounds.width);
  canvas.height = Math.round(bounds.height);
  width = Math.max(3, Math.ceil(canvas.width / scale));
  height = Math.max(3, Math.ceil(canvas.height / scale));
  current = new Float32Array(width * height);
  previous = new Float32Array(width * height);
}

function addDrop(clientX, clientY) {
  const bounds = surface.getBoundingClientRect();
  const x = Math.floor((clientX - bounds.left) / scale);
  const y = Math.floor((clientY - bounds.top) / scale);
  if (x < 2 || y < 2 || x >= width - 2 || y >= height - 2) return;
  current[y * width + x] += 420;
  if (!reduceMotion.matches && !frame) frame = requestAnimationFrame(draw);
}

function draw() {
  let energy = 0;
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = y * width + x;
      const next = ((current[index - 1] + current[index + 1] + current[index - width] + current[index + width]) / 2 - previous[index]) * 0.97;
      previous[index] = next;
      energy += Math.abs(next);
    }
  }
  [current, previous] = [previous, current];

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgb(18 59 97 / 70%)";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = "rgb(180 225 255 / 30%)";
  context.lineWidth = 1;
  for (let y = 1; y < height - 1; y += 4) {
    context.beginPath();
    for (let x = 1; x < width - 1; x += 2) {
      const slope = current[y * width + x - 1] - current[y * width + x + 1];
      const px = x * scale;
      const py = y * scale + slope * 0.08;
      if (x === 1) context.moveTo(px, py);
      else context.lineTo(px, py);
    }
    context.stroke();
  }

  if (energy > 2) frame = requestAnimationFrame(draw);
  else frame = 0;
}

if (!reduceMotion.matches) {
  resize();
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(surface);
  surface.addEventListener("pointerdown", (event) => addDrop(event.clientX, event.clientY));
  button.addEventListener("click", () => {
    const bounds = button.getBoundingClientRect();
    addDrop(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2);
  });
}
```

这是视觉演示用的简化波面，不是精确流体模拟。限制 Canvas 尺寸和更新频率；在组件卸载时断开 observer、取消待执行帧并移除事件监听器。