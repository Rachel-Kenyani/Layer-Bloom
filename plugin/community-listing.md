# Figma Community listing

Copy these into Figma's publish form.

## Name

Layer Bloom

## Tagline

Turn "Frame 58" into names that make sense. AI suggests, you decide.

## Description

Layer Bloom is a focused layer-naming tool, not a general-purpose AI chat interface. It suggests clearer names for selected layers based on their structure and contents.

Your layers panel deserves better than Frame 58, Group 12 and Screenshot 2026-06-11 at 9.48 PM. Nothing changes until you review and approve suggestions. One click renames everything you ticked, and one Cmd+Z undoes it all.

What you get:

- Connect your own API key and account: OpenAI, Claude, Gemini or OpenRouter
- Pick a naming style: Title Case, Slash/Paths or kebab-case
- Edit or skip any suggestion, and click a name to jump to that layer
- Components stay safe, with no messy overrides
- Light and dark mode

Scanning stays local. When you click **Suggest names with AI**, selected layer IDs, names, types, hierarchy, sizes and layout details, plus up to 120 characters of each text layer, go directly to the provider you chose. If enabled, up to three selected nodes are also sent as screenshots (longest edge capped at 512 pixels). Layer Bloom has no server and does not receive your key or layer data. Your provider's privacy and retention terms apply, and API usage may be billed separately.

Free and open source. Provider API usage may be billed separately. Questions or ideas? `rachelkenyani@gmail.com`

Documentation and setup: https://github.com/Rachel-Kenyani/Layer-Bloom/blob/main/README.md

Privacy policy: https://github.com/Rachel-Kenyani/Layer-Bloom/blob/main/plugin/privacy-policy.md

## Tags

rename, layers, layer names, AI, cleanup, organize, naming, design systems, handoff, productivity

## Support contact

`rachelkenyani@gmail.com`

## Images

- Cover (1920×960): `plugin/assets/cover.png`
- Carousel (1920×1080), in this order:
  1. `plugin/assets/carousel/1-hero.png`
  2. `plugin/assets/carousel/2-your-own-ai.png`
  3. `plugin/assets/carousel/3-see-the-mess.png`
  4. `plugin/assets/carousel/4-naming-style.png`
  5. `plugin/assets/carousel/5-review.png`
  6. `plugin/assets/carousel/6-undo-and-dark.png`

Regenerate them with `yarn build && yarn listing`.

## Playground file

1. In Figma, create a new design file named **Layer Bloom Playground**.
2. Plugins → Development → Import plugin from manifest → `plugin/tools/playground/manifest.json`.
3. Run **Layer Bloom Playground Builder** once. It builds a messy landing page and a "How to try" card.
4. Share the file (Share → Anyone with the link can view), then pick it in the "Include a playground file" step.
