// Renders the Figma Community cover (1920×960) to assets/cover.png. macOS only; run `yarn build` first.
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const root = `${import.meta.dirname}/..`;
const font = (file) => readFileSync(`${root}/../node_modules/@fontsource/${file}`).toString('base64');
const fontFace = (family, weight, file) =>
  `@font-face{font-family:'${family}';font-weight:${weight};src:url(data:font/woff2;base64,${font(file)}) format('woff2')}`;
const logo = readFileSync(`${root}/assets/logo.svg`, 'utf8');
const plugin = readFileSync(`${root}/dist/ui.html`, 'utf8').replaceAll('&', '&amp;').replaceAll('"', '&quot;');

const before = ['Frame 54', 'Frame 100', 'Frame 117', 'Frame 108', '001 - Pixeledge', '001 - Pixeledge', '001 - Pixeledge', 'Frame 58'];
const after = [
  'Resume Content',
  'Summary Section',
  'Main Content',
  'Experience List',
  'Job Entry – PixelEdge',
  'Job Entry – Recess',
  'Job Entry – Elimu Shop',
  'Role And Dates',
];
const depths = [0, 1, 1, 2, 3, 3, 3, 4];
const rows = (names, highlight) =>
  names
    .map(
      (name, index) =>
        `<li style="padding-left:${16 + depths[index] * 18}px" class="${highlight ? 'fresh' : ''}"><span class="hash">#</span>${name}</li>`,
    )
    .join('');

const page = `<!doctype html><html><head><meta charset="utf-8"><style>
${fontFace('Montserrat', 700, 'montserrat/files/montserrat-latin-700-normal.woff2')}
${fontFace('Montserrat', 600, 'montserrat/files/montserrat-latin-600-normal.woff2')}
${fontFace('Inter', 400, 'inter/files/inter-latin-400-normal.woff2')}
${fontFace('Inter', 600, 'inter/files/inter-latin-600-normal.woff2')}
*{box-sizing:border-box;margin:0}
body{width:1920px;height:960px;overflow:hidden;font-family:Inter,sans-serif;color:#2e0d1b;
  background:radial-gradient(circle at 85% 20%,#f8dbe8 0,transparent 45%),radial-gradient(circle at 70% 95%,#dff2e8 0,transparent 40%),#fdf9f8}
.left{position:absolute;left:120px;top:0;bottom:0;width:640px;display:flex;flex-direction:column;justify-content:center;gap:28px}
.logo svg{width:132px;height:132px;filter:drop-shadow(0 12px 28px rgba(107,15,53,.25))}
h1{font-family:Montserrat;font-weight:700;font-size:104px;line-height:1;color:#6b0f35;letter-spacing:-2px}
.tagline{font-family:Montserrat;font-weight:600;font-size:38px;line-height:1.25}
.tagline em{font-style:normal;color:#6b0f35;background:#f8e7ef;padding:0 10px;border-radius:10px}
.pills{display:flex;gap:12px;flex-wrap:wrap}
.pill{font-size:20px;font-weight:600;padding:10px 18px;border-radius:999px;background:#fff;border:1px solid #eedde5}
.pill.green{background:#e2f3ea;border-color:#bfe5d2;color:#0b4a35}
.panel{position:absolute;top:150px;width:360px;background:#1e1e1e;border-radius:18px;padding:22px 0;color:#e8e8e8;box-shadow:0 30px 60px rgba(46,13,27,.22)}
.panel h2{font-family:Montserrat;font-size:15px;letter-spacing:.12em;text-transform:uppercase;color:#9a9a9a;padding:0 22px 14px}
.panel ul{list-style:none;padding:0;font-size:19px}
.panel li{padding:9px 16px;white-space:nowrap}
.panel li.fresh{color:#fff}
.hash{color:#7c7c7c;margin-right:10px;font-weight:600}
.before{left:800px;top:130px;transform:rotate(-2deg)}
.before li{color:#bdbdbd}
.after{left:960px;top:470px;transform:rotate(1.5deg);background:#161616;border:2px solid #34c38f}
.after h2{color:#34c38f}
.window{position:absolute;right:90px;top:110px;width:380px;height:600px;transform:scale(1.25);transform-origin:top right;border-radius:14px;overflow:hidden;
  box-shadow:0 40px 80px rgba(46,13,27,.3);border:1px solid #eedde5;background:#fff}
.window iframe{width:380px;height:600px;border:0}
</style></head><body>
<div class="left">
  <div class="logo">${logo}</div>
  <h1>Layer Bloom</h1>
  <p class="tagline">Turn <em>Frame 58</em> into names that make sense. AI suggests, you decide.</p>
  <div class="pills"><span class="pill">OpenAI</span><span class="pill">Claude</span><span class="pill">Gemini</span><span class="pill">OpenRouter</span><span class="pill green">Free · any Figma plan</span></div>
</div>
<div class="panel before"><h2>Before</h2><ul>${rows(before, false)}</ul></div>
<div class="panel after"><h2>After</h2><ul>${rows(after, true)}</ul></div>
<div class="window"><iframe srcdoc="${plugin}"></iframe></div>
</body></html>`;

mkdirSync(`${root}/.cache`, { recursive: true });
writeFileSync(`${root}/.cache/cover.html`, page);

const layers = [
  { id: '1', type: 'FRAME', name: 'Rachel Kenyani CV', depth: 0 },
  { id: '2', type: 'FRAME', name: 'Frame 54', depth: 1, parentId: '1' },
  { id: '3', type: 'FRAME', name: 'Frame 117', depth: 2, parentId: '2' },
  { id: '4', type: 'FRAME', name: '001 - Pixeledge', depth: 3, parentId: '3' },
  { id: '5', type: 'FRAME', name: '001 - Pixeledge', depth: 3, parentId: '3' },
  { id: '6', type: 'FRAME', name: 'Frame 58', depth: 4, parentId: '4' },
];
const renames = [
  { id: '2', newName: 'Resume Content', reason: 'Holds the whole CV.' },
  { id: '3', newName: 'Main Content', reason: 'Experience and skills.' },
  { id: '4', newName: 'Job Entry – PixelEdge', reason: 'PixelEdge role.' },
  { id: '5', newName: 'Job Entry – Recess', reason: 'Recess role.' },
  { id: '6', newName: 'Role And Dates', reason: 'Title and dates.' },
];
const reply = JSON.stringify({ content: [{ type: 'text', text: JSON.stringify({ renames }) }] });
const inPlugin = `const w=document.querySelector('iframe').contentWindow;const m=(x)=>w.postMessage({pluginMessage:x},'*');`;

if (!existsSync(`${root}/.cache/snap`)) {
  execFileSync('/usr/bin/swiftc', ['-O', `${root}/tools/snap.swift`, '-o', `${root}/.cache/snap`]);
}
execFileSync(
  `${root}/.cache/snap`,
  [
    `${root}/.cache/cover.html`,
    `${root}/.cache/cover`,
    `{ ${inPlugin} w.fetch=async()=>new Response(${JSON.stringify(reply)},{status:200});
     m({type:'init',settings:{provider:'anthropic',apiKey:'sk-ant-xxxxxxxxxxxxxxxxxxxx7f2a'},preferences:{theme:'light',namingStyle:'title'},selectionCount:1});
     m({type:'scan-result',layers:${JSON.stringify(layers)},skippedCount:0,limitReached:false});
     setTimeout(()=>[...w.document.querySelectorAll('.button-primary')].find((b)=>b.textContent.includes('Suggest')).click(),200); }`,
  ],
  { env: { ...process.env, SNAP_WIDTH: '1920', SNAP_HEIGHT: '960' } },
);
copyFileSync(`${root}/.cache/cover-0.png`, `${root}/assets/cover.png`);
console.log('Saved assets/cover.png');
