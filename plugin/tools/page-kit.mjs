// Shared pieces for rendering listing images: fonts, logo, the live plugin, and the WebKit snapshot tool. macOS only.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

export const root = `${import.meta.dirname}/..`;
export const cache = `${root}/.cache`;

const font = (file) => readFileSync(`${root}/../node_modules/@fontsource/${file}`).toString('base64');
const fontFace = (family, weight, file) =>
  `@font-face{font-family:'${family}';font-weight:${weight};src:url(data:font/woff2;base64,${font(file)}) format('woff2')}`;

export const fontFaces = [
  fontFace('Montserrat', 700, 'montserrat/files/montserrat-latin-700-normal.woff2'),
  fontFace('Montserrat', 600, 'montserrat/files/montserrat-latin-600-normal.woff2'),
  fontFace('Inter', 400, 'inter/files/inter-latin-400-normal.woff2'),
  fontFace('Inter', 600, 'inter/files/inter-latin-600-normal.woff2'),
].join('\n');

export const logo = readFileSync(`${root}/assets/logo.svg`, 'utf8');

/** The built plugin window, escaped for an iframe's srcdoc so the real UI can be driven with fake Figma messages. */
const pluginHtml = readFileSync(`${root}/dist/ui.html`, 'utf8').replaceAll('&', '&amp;').replaceAll('"', '&quot;');
export const pluginFrame = `<iframe srcdoc="${pluginHtml}"></iframe>`;

/** Script prefix that defines `w` (the plugin window) and `m(message)` to send it a Figma message, with animations off for stable snapshots. */
export const inPlugin = `const w=document.querySelector('iframe').contentWindow;const m=(x)=>w.postMessage({pluginMessage:x},'*');
if(!w.document.getElementById('no-motion')){const s=w.document.createElement('style');s.id='no-motion';s.textContent='*{transition:none!important;animation:none!important}';w.document.head.append(s);}`;

/** A fetch replacement that answers like Claude with the given renames. */
export function fakeClaude(renames) {
  const reply = JSON.stringify({ content: [{ type: 'text', text: JSON.stringify({ renames }) }] });
  return `w.fetch=async()=>new Response(${JSON.stringify(reply)},{status:200});`;
}

/** Writes the page, runs each script in turn and saves one PNG per script as `${name}-<n>.png` in .cache. */
export function snap(name, html, scripts, width, height) {
  mkdirSync(cache, { recursive: true });
  if (!existsSync(`${cache}/snap`)) {
    execFileSync('/usr/bin/swiftc', ['-O', `${root}/tools/snap.swift`, '-o', `${cache}/snap`]);
  }
  writeFileSync(`${cache}/${name}.html`, html);
  execFileSync(`${cache}/snap`, [`${cache}/${name}.html`, `${cache}/${name}`, ...scripts], {
    env: { ...process.env, SNAP_WIDTH: String(width), SNAP_HEIGHT: String(height) },
  });
}

const CHIPS = [
  { from: 'Frame 58', to: 'Job Entry', x: 6, y: 8, r: -6 },
  { from: 'Group 12', to: 'Nav Links', x: 44, y: 4, r: 4 },
  { from: 'Rectangle 3', to: 'Hero Image', x: 3, y: 97, r: 5 },
  { from: 'Vector', to: 'Star Icon', x: 40, y: 90, r: -4 },
];

/** Backdrop CSS: a soft burgundy/orchid/emerald mesh, a dot grid, and floating rename chips. Add `class="dark"` to body for dark. */
export const backdropCss = `
body{background:
  radial-gradient(40% 55% at 92% 8%,rgba(227,161,192,.55),transparent 70%),
  radial-gradient(35% 45% at 70% 100%,rgba(52,195,143,.28),transparent 70%),
  radial-gradient(30% 40% at 0% 100%,rgba(107,15,53,.16),transparent 70%),
  linear-gradient(135deg,#fdf7f9,#fbeef3 55%,#f1f8f4)}
body.dark{background:
  radial-gradient(40% 55% at 92% 8%,rgba(107,15,53,.75),transparent 70%),
  radial-gradient(35% 45% at 70% 100%,rgba(18,147,106,.35),transparent 70%),
  linear-gradient(135deg,#0a0a0a,#160a10)}
.dots{position:absolute;inset:0;background-image:radial-gradient(rgba(107,15,53,.16) 1.4px,transparent 1.4px);background-size:28px 28px;
  -webkit-mask-image:radial-gradient(70% 70% at 30% 50%,#000,transparent);z-index:0}
body.dark .dots{background-image:radial-gradient(rgba(227,161,192,.18) 1.4px,transparent 1.4px)}
.chip{position:absolute;z-index:0;display:flex;gap:10px;align-items:center;padding:10px 16px;border-radius:12px;font-size:18px;
  background:rgba(255,255,255,.7);border:1px solid #eedde5;box-shadow:0 10px 30px rgba(107,15,53,.08);opacity:.85}
body.dark .chip{background:rgba(30,30,30,.7);border-color:#2c2c2c;color:#f5eef1}
.chip s{color:#a08a94}
.chip b{color:#12936a;font-weight:600}
body.dark .chip b{color:#34c38f}
.left,.window,.panel{z-index:1}`;

export const backdropHtml = `<div class="dots"></div>${CHIPS.map(
  ({ from, to, x, y, r }) =>
    `<div class="chip" style="left:${x}%;top:${y}%;transform:translate(-${x}%,-${y}%) rotate(${r}deg)"><s>${from}</s>→<b>${to}</b></div>`,
).join('')}`;
