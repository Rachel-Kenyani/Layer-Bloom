// Renders carousel slides 2–6 (1920×1080) to assets/carousel/. macOS only; run `yarn build` first.
import { copyFileSync, mkdirSync } from 'node:fs';
import { cache, fakeClaude, fontFaces, inPlugin, logo, pluginFrame, root, snap } from './page-kit.mjs';

const SLIDES = [
  {
    file: '2-your-own-ai',
    eyebrow: 'Bring your own AI',
    title: 'OpenAI, Claude, Gemini or OpenRouter',
    body: 'Paste your own key once. It stays on your computer, and your layers go only to the AI you pick.',
  },
  {
    file: '3-see-the-mess',
    eyebrow: 'Scan',
    title: 'See every messy name at a glance',
    body: 'Select a frame and scan. Generic names like “Frame 12” get a pencil, and a click jumps to the layer.',
  },
  {
    file: '4-naming-style',
    eyebrow: 'Your conventions',
    title: 'Title Case, Slash paths or kebab-case',
    body: 'Pick the naming style your team already uses. Layer Bloom remembers it.',
  },
  {
    file: '5-review',
    eyebrow: 'You decide',
    title: 'Nothing changes until you say so',
    body: 'Grouped by parent frame. Untick, edit or ask “Why?” for any suggestion, then rename in one click.',
  },
  {
    file: '6-undo-and-dark',
    eyebrow: 'Safe by design',
    title: 'One click renames. One Cmd+Z undoes.',
    body: 'Components stay untouched, no overrides. Light and dark mode included.',
    dark: true,
  },
];

const layers = [
  { id: '1', type: 'FRAME', name: 'Frame 1', depth: 0 },
  { id: '2', type: 'FRAME', name: 'Frame 2', depth: 1, parentId: '1' },
  { id: '3', type: 'RECTANGLE', name: 'Rectangle 3', depth: 2, parentId: '2' },
  { id: '4', type: 'GROUP', name: 'Group 7', depth: 2, parentId: '2' },
  { id: '5', type: 'FRAME', name: 'Frame 12', depth: 1, parentId: '1' },
  { id: '6', type: 'TEXT', name: 'Plan your team’s week in minutes', text: 'Plan your team’s week in minutes', depth: 2, parentId: '5' },
  { id: '7', type: 'RECTANGLE', name: 'Rectangle 18', depth: 2, parentId: '5' },
  { id: '8', type: 'FRAME', name: 'Frame 24', depth: 1, parentId: '1' },
  { id: '9', type: 'FRAME', name: 'Frame 25', depth: 2, parentId: '8' },
  { id: '10', type: 'VECTOR', name: 'Vector', depth: 3, parentId: '9' },
  { id: '11', type: 'FRAME', name: 'Frame 26', depth: 2, parentId: '8' },
  { id: '12', type: 'INSTANCE', name: 'Button', componentName: 'Button/Primary', depth: 2, parentId: '5' },
];
const renames = [
  { id: '1', newName: 'Landing Page', reason: 'Whole page layout.' },
  { id: '2', newName: 'Navigation Bar', reason: 'Logo, links and sign-up button.' },
  { id: '3', newName: 'Logo Mark', reason: 'Small square next to the brand name.' },
  { id: '4', newName: 'Nav Links', reason: 'Home, Pricing, About, Blog.' },
  { id: '5', newName: 'Hero Section', reason: 'Headline, intro and call to action.' },
  { id: '7', newName: 'Hero Image', reason: 'Large image beside the headline.' },
  { id: '8', newName: 'Feature Cards', reason: 'Three feature cards in a row.' },
  { id: '9', newName: 'Feature Card – Shared Boards', reason: 'First card.' },
  { id: '10', newName: 'Star Icon', reason: 'Star-shaped vector.' },
  { id: '11', newName: 'Feature Card – Scheduling', reason: 'Second card.' },
];

const page = `<!doctype html><html><head><meta charset="utf-8"><style>
${fontFaces}
*{box-sizing:border-box;margin:0}
body{width:1920px;height:1080px;overflow:hidden;font-family:Inter,sans-serif;color:#2e0d1b;
  background:radial-gradient(circle at 80% 15%,#f8dbe8 0,transparent 45%),radial-gradient(circle at 65% 100%,#dff2e8 0,transparent 40%),#fdf9f8}
body.dark{color:#f5eef1;background:radial-gradient(circle at 80% 15%,#3a1426 0,transparent 45%),radial-gradient(circle at 65% 100%,#0c2a20 0,transparent 40%),#0a0a0a}
.left{position:absolute;left:140px;top:0;bottom:0;width:820px;display:flex;flex-direction:column;justify-content:center;gap:28px}
.brand{display:flex;align-items:center;gap:16px;font-family:Montserrat;font-weight:700;font-size:30px;color:#6b0f35}
body.dark .brand{color:#e3a1c0}
.brand svg{width:56px;height:56px}
.eyebrow{font-family:Montserrat;font-weight:600;font-size:24px;letter-spacing:.12em;text-transform:uppercase;color:#12936a}
body.dark .eyebrow{color:#34c38f}
h1{font-family:Montserrat;font-weight:700;font-size:76px;line-height:1.05;letter-spacing:-1.5px}
p{font-size:30px;line-height:1.45;color:#6d5862}
body.dark p{color:#b9adb3}
.window{position:absolute;right:180px;top:105px;width:380px;height:600px;transform:scale(1.45);transform-origin:top right;border-radius:14px;overflow:hidden;
  box-shadow:0 40px 80px rgba(46,13,27,.3);border:1px solid #eedde5;background:#fff}
body.dark .window{border-color:#2c2c2c;box-shadow:0 40px 80px rgba(0,0,0,.6)}
.window iframe{width:380px;height:600px;border:0}
</style></head><body>
<div class="left">
  <div class="brand">${logo}Layer Bloom</div>
  <div class="eyebrow" id="eyebrow"></div>
  <h1 id="title"></h1>
  <p id="body"></p>
</div>
<div class="window">${pluginFrame}</div>
</body></html>`;

const caption = ({ eyebrow, title, body, dark }) =>
  `document.getElementById('eyebrow').textContent=${JSON.stringify(eyebrow)};document.getElementById('title').textContent=${JSON.stringify(title)};document.getElementById('body').textContent=${JSON.stringify(body)};document.body.classList.toggle('dark',${Boolean(dark)});`;
const click = (selector, text = '') =>
  `[...w.document.querySelectorAll('${selector}')].find((element)=>element.textContent.includes(${JSON.stringify(text)})).click();`;
const settings = `{provider:'anthropic',apiKey:'sk-ant-xxxxxxxxxxxxxxxxxxxx7f2a'}`;

const steps = [
  `m({type:'init',settings:null,preferences:{theme:'light',namingStyle:'title'},selectionCount:1});
   setTimeout(()=>{ ${click('.select-trigger')} },150);`,
  `${click('.select-trigger')}
   m({type:'saved-settings',settings:${settings}});
   m({type:'scan-result',layers:${JSON.stringify(layers)},skippedCount:0,limitReached:false});
   setTimeout(()=>{ ${click('.tree-toggle')} },150);`,
  `${click('.tree-toggle')} ${click('.select-trigger')}`,
  `${click('.select-option', 'Title')} ${fakeClaude(renames)}
   setTimeout(()=>{ ${click('.button-primary', 'Suggest')} },50);
   setTimeout(()=>{ w.document.querySelectorAll('.suggestion .checkbox')[2].click(); ${click('.reason .link-button', 'Why')} },250);`,
  `m({type:'renames-applied',renamedCount:9,missedCount:0}); setTimeout(()=>{ ${click('.icon-button')} },100);`,
];

mkdirSync(`${root}/assets/carousel`, { recursive: true });
snap(
  'carousel',
  page,
  SLIDES.map((slide, index) => `{ ${inPlugin} ${caption(slide)} ${steps[index]} }`),
  1920,
  1080,
);
SLIDES.forEach((slide, index) => copyFileSync(`${cache}/carousel-${index}.png`, `${root}/assets/carousel/${slide.file}.png`));
console.log(`Saved ${SLIDES.length} slides to assets/carousel/`);
