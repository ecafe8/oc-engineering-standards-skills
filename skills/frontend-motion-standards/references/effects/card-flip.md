# 卡片翻转（Card Flip）

适用于闪卡或正反两面的简短信息。使用原生按钮支持键盘；翻面状态同步到 `aria-pressed`，并将不可见的一面从辅助技术树中隐藏。

```html
<button class="flashcard" type="button" data-flashcard aria-pressed="false" aria-label="翻转记忆卡片">
  <span class="flashcard__face flashcard__front" data-front>问题：什么是透视？</span>
  <span class="flashcard__face flashcard__back" data-back aria-hidden="true">透视决定 3D 变形的空间感。</span>
</button>
```

```css
.flashcard { position: relative; width: min(320px, 100%); min-height: 190px; padding: 0; border: 0; border-radius: 16px; color: #1d2734; background: transparent; font: inherit; cursor: pointer; perspective: 900px; text-align: left; }
.flashcard:focus-visible { outline: 3px solid #3866c5; outline-offset: 5px; }
.flashcard__face { position: absolute; inset: 0; display: grid; align-content: center; padding: 24px; border: 1px solid #d5d9df; border-radius: inherit; background: #f7f8fa; box-shadow: 0 14px 30px rgb(20 30 50 / 14%); backface-visibility: hidden; -webkit-backface-visibility: hidden; transition: transform 480ms cubic-bezier(.2, .8, .2, 1); }
.flashcard__back { color: white; background: #243b72; transform: rotateY(180deg); }
.flashcard[aria-pressed="true"] .flashcard__front { transform: rotateY(180deg); }
.flashcard[aria-pressed="true"] .flashcard__back { transform: rotateY(360deg); }

@media (prefers-reduced-motion: reduce) {
  .flashcard__face { transition: none; }
}
```

```js
const flashcard = document.querySelector("[data-flashcard]");
const front = flashcard.querySelector("[data-front]");
const back = flashcard.querySelector("[data-back]");

flashcard.addEventListener("click", () => {
  const flipped = flashcard.getAttribute("aria-pressed") !== "true";
  flashcard.setAttribute("aria-pressed", String(flipped));
  front.setAttribute("aria-hidden", String(flipped));
  back.setAttribute("aria-hidden", String(!flipped));
});
```

避免把复杂表单或有焦点子控件放在翻转面内；内容切换后仍保持按钮焦点。