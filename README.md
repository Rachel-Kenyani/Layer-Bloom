# Layer Bloom

A Figma plugin that renames messy layers — `Frame 58`, `Group 12`, `Screenshot 2026-06-11…` — into clear names based on what's inside them. The AI suggests, you review, one click applies, and one Cmd+Z undoes it all.

![Plugin icon](plugin/assets/icon-128.png)

## Features

- **Bring your own key** — OpenAI, Anthropic (Claude), Google Gemini or OpenRouter.
- **Review before anything changes** — tick, untick or edit each suggestion. Click a layer name to jump to it in Figma.
- **Naming styles** — Title Case (`Job Entry – PixelEdge`), slash paths (`Card/Job/PixelEdge`) or kebab-case (`job-entry-pixeledge`).
- **Optional screenshots** — lets the AI recognise icons, images and cards that have no text.
- **One undo step** for every batch of renames.
- **Safe with components** — instances are named after their component and never edited inside, so no overrides are created.
- Works on every Figma plan.
- Light and dark mode.

## Privacy

- Your API key is stored with `figma.clientStorage`, **only on your computer**. It is never sent to the plugin author.
- When you ask for suggestions, these go **directly to the AI provider you chose**, and nowhere else:
  - layer names, types, sizes and nesting
  - the first 120 characters of text layers
  - screenshots of the selection, **only if you tick "Also send screenshots"**
- The plugin's manifest only allows network access to the four AI providers. Figma blocks every other address.
- Fonts and icons are bundled into the plugin; nothing else is loaded from the internet.

Your provider's own data policy applies to what you send them. Use a dedicated API key with a monthly spending limit.

## Using it

1. Run the plugin, choose a provider and paste your API key ([OpenAI](https://platform.openai.com/api-keys), [Anthropic](https://console.anthropic.com/settings/keys), [Gemini](https://aistudio.google.com/apikey), [OpenRouter](https://openrouter.ai/keys)).
2. Select frames or groups and click **Scan selected layers**.
3. Pick a naming style and click **Suggest names with AI**.
4. Review, then **Rename**. Press Cmd+Z (Ctrl+Z on Windows) to undo.

Locked and hidden layers are skipped. Up to 300 layers are scanned per run.

## Development

Requires Node.js 24, Yarn 1 and the Figma desktop app.

```sh
yarn install
yarn build        # type-check, then bundle to plugin/dist/
yarn watch        # rebuild on save
yarn verify       # type-check, lint (ESLint + SonarJS rules) and tests
yarn format       # Prettier
yarn screenshots  # macOS: render every stage to plugin/screenshots/
yarn icons        # macOS: render assets/logo.svg to PNG icons
yarn listing      # macOS: render the Community cover and carousel images to plugin/assets/
```

Load it in Figma: **Plugins → Development → Import plugin from manifest…** and choose `plugin/manifest.json`.

### Playground file

`plugin/tools/playground/` is a one-off helper plugin that builds a deliberately messy landing page — every layer badly named — for people to try Layer Bloom on. Import its `manifest.json` the same way, run it once in an empty Figma file, and publish that file as the Community playground.

### How it's organised

```text
plugin/
  manifest.json
  build.mjs              bundles everything into dist/code.js and a single dist/ui.html
  src/shared/messages.ts every message between the two halves, typed
  src/main/              runs inside Figma: scan, rename, focus, screenshots, storage
  src/ui/                the window (Preact)
    state.ts             one reducer for every stage transition
    ai/                  prompt, provider adapters, batching, reply checking
    components/          small themed controls
    stages/              Setup, Ready, Scanned, Working, Review, Done
  tests/                 Node's built-in test runner
```

AI model names live in `src/ui/providers.ts`, each with a fallback used automatically if the main model is retired.

## Support

Questions, bugs or ideas: [rachelkenyani@gmail.com](mailto:rachelkenyani@gmail.com)

## License

[MIT](LICENSE)
