# 文字解码（Text Scramble）

将短标题从旧文案解码为新文案。动画字符与静态辅助文本分离，避免辅助技术逐帧朗读乱码；较长内容不适合使用此效果。

```html
<p class="scramble" aria-live="polite">
  <span data-scramble aria-hidden="true">MAKE IT CLEAR</span>
  <span class="visually-hidden" data-scramble-label>MAKE IT CLEAR</span>
</p>
<button type="button" data-scramble-trigger>换一句</button>
```

```css
.visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
.scramble { font: 700 clamp(1.5rem, 5vw, 3rem) / 1.15 sans-serif; }
.scramble [data-scramble] { color: #385fc5; }

@media (prefers-reduced-motion: reduce) {
  .scramble [data-scramble] { transition: none; }
}
```

```js
const display = document.querySelector("[data-scramble]");
const label = document.querySelector("[data-scramble-label]");
const trigger = document.querySelector("[data-scramble-trigger]");
const phrases = ["MAKE IT CLEAR", "DESIGN WITH CARE", "BUILD WITH INTENT"];
const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
let phraseIndex = 0;
let frame = 0;

function showPhrase(target) {
  cancelAnimationFrame(frame);
  label.textContent = target;

  if (reduceMotion.matches) {
    display.textContent = target;
    return;
  }

  const chars = Array.from(target);
  const startedAt = performance.now();
  const duration = 700;

  function draw(now) {
    const progress = Math.min(1, (now - startedAt) / duration);
    const locked = Math.floor(progress * chars.length);
    display.textContent = chars.map((char, index) => {
      if (char === " " || index < locked) return char;
      return alphabet[Math.floor(Math.random() * alphabet.length)];
    }).join("");

    if (progress < 1) frame = requestAnimationFrame(draw);
  }

  frame = requestAnimationFrame(draw);
}

trigger.addEventListener("click", () => {
  phraseIndex = (phraseIndex + 1) % phrases.length;
  showPhrase(phrases[phraseIndex]);
});
```

采用固定文案白名单，不将用户输入拼接进 HTML。若自动轮播，增加暂停控制并避免频繁触发 live region 播报。