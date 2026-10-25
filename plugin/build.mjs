// Builds dist/code.js (Figma side) and dist/ui.html (the window, with script, styles and fonts inlined,
// because Figma loads the window as a single file).
import * as esbuild from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';

const watch = process.argv.includes('--watch');
const root = `${import.meta.dirname}/`;

const shared = { bundle: true, minify: !watch, logLevel: 'info', absWorkingDir: root };

const page = (script, styles) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<style>${styles}</style>
</head>
<body>
<div id="app"></div>
<script>${script}</script>
</body>
</html>`;

const inlineIntoHtml = {
  name: 'inline-into-html',
  setup(build) {
    build.onEnd(async ({ outputFiles, errors }) => {
      if (errors.length > 0) {
        return;
      }
      const text = (extension) => outputFiles.find((file) => file.path.endsWith(extension))?.text ?? '';
      // Stop "</script>" inside the bundle from closing the script tag early.
      const script = text('.js').replaceAll('</script', '<\\/script');
      await mkdir(`${root}dist`, { recursive: true });
      await writeFile(`${root}dist/ui.html`, page(script, text('.css')));
    });
  },
};

const code = await esbuild.context({
  ...shared,
  entryPoints: ['src/main/code.ts'],
  outfile: 'dist/code.js',
  target: 'es2017',
});

const ui = await esbuild.context({
  ...shared,
  entryPoints: ['src/ui/index.tsx'],
  outdir: 'dist/ui',
  write: false,
  target: 'es2020',
  jsx: 'automatic',
  jsxImportSource: 'preact',
  loader: { '.woff2': 'dataurl' },
  plugins: [inlineIntoHtml],
});

if (watch) {
  await Promise.all([code.watch(), ui.watch()]);
} else {
  await Promise.all([code.rebuild(), ui.rebuild()]);
  await Promise.all([code.dispose(), ui.dispose()]);
}
