# 便当盒网格（Bento Grid）

鼠标悬停或键盘聚焦某个单元时，调整 CSS Grid 轨道强调该内容。移动端和不支持 `:has()` 的浏览器保留静态网格，所有单元仍可直接操作。

```html
<section class="bento" aria-label="产品数据">
  <article class="bento__tile" tabindex="0"><h2>访问量</h2><strong>12,480</strong></article>
  <article class="bento__tile" tabindex="0"><h2>完成率</h2><strong>72%</strong></article>
  <article class="bento__tile" tabindex="0"><h2>团队</h2><strong>18 人</strong></article>
  <article class="bento__tile" tabindex="0"><h2>活动</h2><strong>实时</strong></article>
</section>
```

```css
.bento {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(120px, auto));
  gap: 12px;
}

.bento__tile {
  min-width: 0;
  padding: 16px;
  border: 1px solid #d5d9df;
  border-radius: 14px;
  background: #f7f8fa;
  transition: border-color 220ms ease, box-shadow 220ms ease;
}

.bento__tile h2 { margin: 0 0 12px; font-size: 14px; }
.bento__tile strong { font-size: 24px; font-variant-numeric: tabular-nums; }

@supports selector(.bento:has(.bento__tile:hover)) {
  .bento { grid-template-columns: 1fr 1fr 1fr; transition: grid-template-columns 420ms ease; }
  .bento:has(.bento__tile:first-child:is(:hover, :focus-visible)) { grid-template-columns: 2fr 0.7fr 0.7fr; }
  .bento:has(.bento__tile:last-child:is(:hover, :focus-visible)) { grid-template-columns: 0.7fr 0.7fr 2fr; }
  .bento__tile:is(:hover, :focus-visible) { border-color: #4268c8; box-shadow: 0 12px 28px rgb(25 40 70 / 16%); }
}

@media (max-width: 600px) {
  .bento { grid-template-columns: repeat(2, minmax(0, 1fr)); grid-template-rows: auto; }
}

@media (prefers-reduced-motion: reduce) {
  .bento, .bento__tile { transition: none; }
}
```

`grid-template-*` 动画支持依浏览器而异；不支持时单元维持正常网格。示例用 `tabindex="0"` 仅为演示聚焦状态，实际非交互数据卡不要无故加入 Tab 顺序。