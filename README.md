# 🔥 Karhutla.js

**A tiny, dependency-free WebGL smoke overlay that covers your website in haze until visitors scroll it away, to raise awareness of Indonesia's forest and peatland fires (*karhutla*).**

Paste one script. Your page disappears into drifting smoke. Visitors scroll to clear it, and for a moment feel what millions breathe every dry season.

[Live demo](#demo) · [Quick start](#quick-start) · [Options](#options) · [API](#api) · [Good practice](#good-practice)

---

## Why

Every dry season, fires in Indonesia's forests and peatlands send smoke across Southeast Asia. Most fires are started by people clearing land, and drained peat can smoulder underground for weeks. Karhutla.js turns that into a few seconds of experience on any website, with a corner link to learn more.

## Features

- **Zero dependencies.** One file, no build step, MIT licensed.
- **Real-time smoke.** Fractal-noise WebGL shader that drifts, swirls and clears from the center outward (or in random patches).
- **Scroll to clear.** The page is held until the smoke is gone, then scrolls normally. Or let it follow the scroll position, or clear on a timer.
- **Show it sparingly.** Frequency control: every visit, once ever, or *N* times per *M* days.
- **Keep content readable.** Raise any element (like your hero title) above the smoke with `keepOnTop`.
- **Corner badge.** Optional floating icon that links to a search ("Indonesia Forest Fire" or "Karhutla Indonesia") and fades with the smoke.
- **Bilingual.** English and Bahasa Indonesia defaults for the badge link (`?lang=id` or `<html lang="id">`).
- **Performance aware.** Adaptive resolution, FPS cap, three quality levels, and a plain-fade fallback when WebGL is unavailable.
- **Accessible.** Motion freezes for visitors who prefer reduced motion; keyboard scrolling (arrows, PageUp/PageDown, Space, End) clears the smoke.

## Quick start

Download [`karhutla.js`](./karhutla.js), host it next to your page, and add this before `</body>`:

```html
<script src="karhutla.js"></script>
<script>
  Karhutla.init({
    thickness: 0.8,
    color: "#8f8a85",
    scrollDistance: 1.6,
    keepOnTop: [".hero-title"],
    frequency: { mode: "limit", times: 2, days: 7 },
    badge: { icon: "flame", position: "bottom-left" }
  });
</script>
```

Prefer a single paste? Inline the contents of `karhutla.js` inside a `<script>` tag, followed by the `Karhutla.init(...)` call.

It also works as a module:

```js
const Karhutla = require("./karhutla.js"); // CommonJS / bundlers
```

## Options

| Option | Default | Description |
| --- | --- | --- |
| `thickness` | `0.75` | Smoke density, `0` to `1`. |
| `speed` | `1` | Drift speed multiplier. |
| `scale` | `1.7` | Puff size. Higher means finer, smaller wisps. |
| `opacity` | `0.97` | Maximum opacity. |
| `push` | `0.6` | `0` to `1`. How far the smoke is pushed toward the edges while clearing. |
| `reveal` | `"center"` | `"center"` clears from the middle outward; `"random"` clears in patches. |
| `color` | `"#8f8a85"` | Hex string, `[r, g, b]` (0 to 255), or `"auto"` to follow the light/dark theme. |
| `disappear` | `"scroll"` | `"scroll"` or `"auto"` (timer). |
| `scrollMode` | `"lock"` | `"lock"` holds the page until cleared; `"track"` follows the real scroll position. |
| `scrollDistance` | `1.6` | Scroll needed to clear, in viewport heights. |
| `delay` / `duration` | `0` / `6` | Seconds, used when `disappear: "auto"`. |
| `keepOnTop` | `[]` | CSS selectors that stay above the smoke. Updatable with `setOptions`. |
| `allowScroll` | `[]` | Selectors that keep native scrolling in lock mode (menus, side panels). |
| `zIndex` | `9999` | Z-index of the smoke canvas. |
| `quality` | `"medium"` | `"low"`, `"medium"` or `"high"` (noise octaves). |
| `resolution` | `0.5` | Render scale. Lowered automatically if frames are slow. |
| `maxFps` | `30` | Frame-rate cap. |
| `adaptive` | `true` | Reduce resolution when the device struggles. |
| `frequency` | `{ mode: "always" }` | `{ mode: "once" }` or `{ mode: "limit", times: 2, days: 7 }`. |
| `storageKey` | `"karhutla"` | `localStorage` key for the frequency history. |
| `lang` | `"auto"` | `"en"`, `"id"` or `"auto"` (reads `?lang=` then `<html lang>`). |
| `badge` | `null` | Corner link icon, see below. |
| `onProgress(p)` | `null` | Called every frame with progress `0` to `1`. |
| `onComplete()` | `null` | Called when the smoke is fully cleared. |

### Badge

```js
badge: {
  icon: "flame",            // "flame" | "search" | raw "<svg>…</svg>"
  href: "https://…",        // defaults to a localized search link
  title: "Learn more",
  label: "",                // optional text next to the icon
  size: 56, opacity: 0.95,
  position: "bottom-left",  // top/bottom + left/right/center
  offsetX: 18, offsetY: 18,
  background: "#d32f2f", color: "#fff",
  pulse: true,              // gentle pulse animation
  follow: true              // fade out together with the smoke
}
```

## API

```js
const smoke = Karhutla.init({ /* options */ });

smoke.setOptions({ thickness: 0.5, color: "#d32f2f" }); // update live
smoke.clear(1.2);        // clear programmatically over 1.2 seconds
smoke.destroy();         // remove everything and restore scrolling
smoke.progress;          // 0 to 1
smoke.skipped;           // true if the frequency rule suppressed it

Karhutla.reset();        // forget the frequency history
Karhutla.defaults;       // the default options
```

## Demo

This repository includes a demo and campaign page (`index.html`) with:

- A GoFundMe-style layout in a forest-fire theme, with a full-screen hero whose title stays above the smoke.
- A **settings panel** that tunes every option live and generates the embed code (snippet or all-in-one).
- Presets (light haze, heavy smoke, wildfire red, dark soot).
- A **map of modelled air quality** (US AQI) for 24 cities across Indonesia and its neighbours, plus an optional live PM2.5 layer from [Windy](https://www.windy.com).
- A **news widget** with Indonesian and international headlines.
- An **EN / ID** language switcher (`?lang=id`).

Live air-quality and news requests need a normal browser tab. In sandboxed previews the page falls back to gray markers and a curated reading list.

## Good practice

- **Show it sparingly.** Use `frequency` (for example once per day) so returning visitors are not blocked.
- **Keep it short.** One or two screens of scrolling is enough.
- **Point to real help.** Set `badge.href` to a page you trust.
- **Skip critical flows.** Do not use it on checkout, login or emergency pages.
- **Keep your key content visible.** Use `keepOnTop` for the title or logo.

## What helps, beyond the website

- Never burn waste or land; open burning is prohibited.
- Report fires early from a safe distance: call **112** or your local disaster agency (BPBD).
- Track hotspots on **SiPongi** and **BMKG**. A hotspot is a satellite heat signal, not always a confirmed fire.
- On bad-air days stay indoors and wear an **N95/KN95** mask. Cloth masks do not filter PM2.5.

## Browser support

Any modern browser with WebGL 1. Without WebGL, the overlay falls back to a plain fade. Uses `matchMedia`, `requestAnimationFrame` and `localStorage` (optional).

## Data and sources

Statistics shown on the demo page come from Indonesia's Ministry of Forestry, the Ministry of Environment, SiPongi/BNPB and a Harvard–Columbia study of the 2015 haze. Air quality is modelled by CAMS via [Open-Meteo](https://open-meteo.com); headlines come from [GDELT](https://www.gdeltproject.org). Modelled readings are estimates, not ground sensors; use official stations for health decisions. Figures change daily.

## Contributing

Issues and pull requests are welcome, especially for translations, accessibility improvements and performance on low-end devices.

## License

[MIT](./LICENSE)
