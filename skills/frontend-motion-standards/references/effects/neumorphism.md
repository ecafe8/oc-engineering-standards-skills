# 新拟态控制（Neumorphism）

用同色背景上的外凸/内凹阴影表现实体旋钮和按钮。阴影不能替代边界、文字标签或清晰的 focus 状态；交互值使用原生 range 控件保持键盘和辅助技术支持。

```html
<label class="thermostat">
  <span class="thermostat__label">Temperature</span>
  <output data-temperature for="temperature">22° · Comfort</output>
  <input id="temperature" data-temperature-control type="range" min="16" max="30" step="0.5" value="22" aria-label="温度">
</label>
```

```css
.thermostat { --surface: #e2e7ef; display: grid; gap: 18px; width: min(320px, 100%); padding: 24px; border-radius: 24px; color: #293448; background: var(--surface); box-shadow: 10px 10px 22px #b4bdcb, -10px -10px 22px #fff; }
.thermostat__label { font-size: 14px; }
.thermostat output { width: fit-content; padding: 16px 22px; border-radius: 50%; background: var(--surface); box-shadow: inset 5px 5px 10px #b4bdcb, inset -5px -5px 10px #fff; font-size: 24px; font-variant-numeric: tabular-nums; }
.thermostat input { width: 100%; accent-color: #bd5b37; }
.thermostat input:focus-visible { outline: 3px solid #294f9f; outline-offset: 5px; }
```

```js
const control = document.querySelector("[data-temperature-control]");
const output = document.querySelector("[data-temperature]");

function updateTemperature() {
  const value = Number(control.value);
  const mode = value >= 25 ? "Heat" : value <= 19 ? "Cool" : "Comfort";
  output.value = `${value}° · ${mode}`;
}

control.addEventListener("input", updateTemperature);
updateTemperature();
```

不要用纯阴影区分开/关；必要时添加 `aria-pressed` 按钮状态或明确的颜色/文本指示。确保浅色背景上的文字和边界有足够对比度。