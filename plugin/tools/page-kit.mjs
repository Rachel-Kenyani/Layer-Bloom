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
