import type { Provider } from '../../shared/messages.ts';
import { postJson } from './request.ts';

export type Call = { apiKey: string; model: string; instructions: string; layerList: string; images: string[]; signal: AbortSignal };

type OpenAiReply = { choices?: { message?: { content?: string } }[] };
type AnthropicReply = { content?: { type: string; text?: string }[] };
type GeminiReply = { candidates?: { content?: { parts?: { text?: string }[] } }[] };

async function openAiStyle(
  url: string,
  { apiKey, model, instructions, layerList, images, signal }: Call,
  forceJson: boolean,
): Promise<string> {
  const body: Record<string, unknown> = {
    model,
    messages: [
      { role: 'system', content: instructions },
      {
        role: 'user',
        content: [
          ...images.map((data) => ({ type: 'image_url', image_url: { url: `data:image/png;base64,${data}` } })),
          { type: 'text', text: layerList },
        ],
      },
    ],
  };
  if (forceJson) {
    body.response_format = { type: 'json_object' };
  }
  const data = await postJson<OpenAiReply>(url, { Authorization: `Bearer ${apiKey}` }, body, signal);
  return data.choices?.[0]?.message?.content ?? '';
}

export const ADAPTERS: Record<Provider, (call: Call) => Promise<string>> = {
  openai: (call) => openAiStyle('https://api.openai.com/v1/chat/completions', call, true),

  openrouter: (call) => openAiStyle('https://openrouter.ai/api/v1/chat/completions', call, false),

  async anthropic({ apiKey, model, instructions, layerList, images, signal }) {
    const data = await postJson<AnthropicReply>(
      'https://api.anthropic.com/v1/messages',
      {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        // Required for calls from a browser window; safe here because it's the user's own key.
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      {
        model,
        max_tokens: 8000,
        system: instructions,
        messages: [
          {
            role: 'user',
            content: [
              ...images.map((data) => ({ type: 'image', source: { type: 'base64', media_type: 'image/png', data } })),
              { type: 'text', text: layerList },
            ],
          },
        ],
      },
      signal,
    );
    return data.content?.find((block) => block.type === 'text')?.text ?? '';
  },

  async gemini({ apiKey, model, instructions, layerList, images, signal }) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
    const data = await postJson<GeminiReply>(
      url,
      { 'x-goog-api-key': apiKey },
      {
        systemInstruction: { parts: [{ text: instructions }] },
        contents: [
          {
            role: 'user',
            parts: [...images.map((data) => ({ inline_data: { mime_type: 'image/png', data } })), { text: layerList }],
          },
        ],
        generationConfig: { responseMimeType: 'application/json' },
      },
      signal,
    );
    return data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('') ?? '';
  },
};
