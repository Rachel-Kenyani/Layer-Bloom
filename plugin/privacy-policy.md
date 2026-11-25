# Layer Bloom Privacy Policy

Last updated: November 25, 2026

This policy explains how the Layer Bloom Figma plugin handles information. It does not cover Figma's services or the separate services operated by AI providers.

## What the plugin processes

Scanning a selection happens in Figma and does not contact an AI provider. The plugin sends data only after you click **Suggest names with AI**.

For that request, the plugin sends the provider you selected:

- Layer IDs, names, types, hierarchy, dimensions, child counts, layout details and component names when available.
- The first 120 characters of each text layer.
- Up to three screenshots of selected nodes, with the longest edge capped at 512 pixels, only if you enable **Also send screenshots**.
- Your API key, as authentication for the request, and the instructions needed to generate names.

The plugin scans the selected nodes and their descendants, up to 300 layers per run. It does not send the whole Figma document. Suggestions are returned to the plugin for your review; renames are applied in Figma only after you choose to apply them.

## Where information goes

Requests go directly from the plugin to the provider you select: OpenAI, Anthropic, Google Gemini or OpenRouter. Layer Bloom has no server and does not receive your API key or layer data. Each provider handles requests under its own terms and privacy, security and retention practices. Review the selected provider's policies before sending design information.

AI providers may charge for API usage under your account. Layer Bloom does not charge for those services.

## Storage and deletion

The plugin saves your API key, theme and naming-style preferences using Figma's `clientStorage`. The key is used to authenticate requests to your selected provider. You can remove the saved key from the plugin using **Change key** and **Remove key**.

Layer Bloom does not operate a server or store request data outside the plugin. To ask a provider about information it received or retained, use that provider's account and privacy processes.

## Contact

For questions about this policy or Layer Bloom's data practices, contact [rachelkenyani@gmail.com](mailto:rachelkenyani@gmail.com).
