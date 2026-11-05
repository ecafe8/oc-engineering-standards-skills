# 动效实现模板

以下是框架无关的起始模板，不是必须采用的组件 API。将颜色、时长、缓动、命名和 DOM 结构替换为项目约定；若项目使用 React、Vue 等框架，把监听器和 observer 放入对应生命周期，并在清理函数中释放。

## 控件状态反馈

适用于按钮、链接和可交互卡片。状态仍由 CSS 明确表达，动效只是补充反馈。

```css
.motion-control {
  transition:
    transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1),
    background-color 180ms ease,
    box-shadow 180ms ease;
}

@media (hover: hover) and (pointer: fine) {
  .motion-control:hover {
    transform: translateY(-1px);
  }
}

.motion-control:active {
  transform: scale(0.98);
}

.motion-control:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  .motion-control {
    transition: none;
  }

  .motion-control:hover,
  .motion-control:active {
    transform: none;
  }
}
```

```html
<button class="motion-control" type="button">保存更改</button>
```

## 滚动显现

内容默认可见；只有脚本、`IntersectionObserver` 和动态效果偏好都允许时才启用入场状态。减少动态效果或浏览器不支持 observer 时，内容保持静态可读。

```html
<section data-reveal>滚动到这里时轻微渐显</section>
```

```css
.motion-reveal-ready [data-reveal] {
  transition: opacity 450ms ease-out, transform 450ms ease-out;
}

.motion-reveal-ready [data-reveal][data-reveal-state="hidden"] {
  opacity: 0;
  transform: translateY(16px);
}

.motion-reveal-ready [data-reveal][data-reveal-state="shown"] {
  opacity: 1;
  transform: none;
}

@media (prefers-reduced-motion: reduce) {
  .motion-reveal-ready [data-reveal] {
    transition: none;
    opacity: 1;
    transform: none;
  }
}
```

```js
const revealTargets = document.querySelectorAll("[data-reveal]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

if (!reduceMotion.matches && "IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries, currentObserver) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;

      entry.target.dataset.revealState = "shown";
      currentObserver.unobserve(entry.target);
    }
  }, { threshold: 0.15 });

  for (const target of revealTargets) {
    target.dataset.revealState = "hidden";
    observer.observe(target);
  }

  document.documentElement.classList.add("motion-reveal-ready");

  reduceMotion.addEventListener("change", (event) => {
    if (!event.matches) return;

    observer.disconnect();
    for (const target of revealTargets) {
      target.dataset.revealState = "shown";
    }
    document.documentElement.classList.remove("motion-reveal-ready");
  }, { once: true });
}
```

对框架组件，避免在组件卸载后继续操作节点；在 effect cleanup 中调用 `observer.disconnect()`，并在初始化前确认 reduced-motion 偏好。

## 指针聚光

适用于桌面卡片的装饰性局部高光。内容本身始终可见；触屏、粗指针和减少动态效果时不启用跟随。

```html
<article class="spotlight-card" data-spotlight>
  <div class="spotlight-card__content">
    <h2>卡片标题</h2>
    <p>高光只增加层次，不承载必要信息。</p>
  </div>
</article>
```

```css
.spotlight-card {
  position: relative;
  isolation: isolate;
  overflow: hidden;
}

.spotlight-card::before {
  position: absolute;
  z-index: 0;
  inset: 0;
  background: radial-gradient(
    160px circle at var(--pointer-x, 50%) var(--pointer-y, 50%),
    rgb(255 255 255 / 18%),
    transparent 75%
  );
  content: "";
  opacity: 0;
  pointer-events: none;
  transition: opacity 180ms ease;
}

.spotlight-card__content {
  position: relative;
  z-index: 1;
}

@media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) {
  .spotlight-card:hover::before {
    opacity: 1;
  }
}
```

```js
const canUseSpotlight = window.matchMedia(
  "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)"
).matches;

if (canUseSpotlight) {
  document.addEventListener("pointermove", (event) => {
    if (!(event.target instanceof Element)) return;

    const card = event.target.closest("[data-spotlight]");
    if (!card) return;

    const bounds = card.getBoundingClientRect();
    card.style.setProperty("--pointer-x", `${event.clientX - bounds.left}px`);
    card.style.setProperty("--pointer-y", `${event.clientY - bounds.top}px`);
  }, { passive: true });
}
```

单页静态示例可用文档级委托；组件化项目应将监听范围缩小到组件，并在卸载时移除监听器。若指针事件造成绘制压力，再用 `requestAnimationFrame` 合并更新，并处理取消和清理。