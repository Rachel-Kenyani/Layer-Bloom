type ErrorBody = { error?: { message?: string }; message?: string };

export class ProviderError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ProviderError';
    this.status = status;
  }
}

export function friendlyError(status: number): string {
  if (status === 401 || status === 403) {
    return 'Your API key was rejected. Use "Change key" to enter a valid one.';
  }
  if (status === 402 || status === 429) {
    return 'Out of credit, or too many requests. Check your billing with the provider, or wait a minute and try again.';
  }
  if (status === 404) {
    return "The AI model isn't available for your key.";
  }
  if (status === 413) {
    return 'The request was too big. Select fewer layers, or turn off screenshots.';
  }
  if (status >= 500) {
    return 'The AI provider is having problems right now. Try again in a few minutes.';
  }
  return 'The AI provider returned an error.';
}

export async function postJson<T>(url: string, headers: Record<string, string>, body: unknown, signal: AbortSignal): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (signal.aborted) {
      throw error;
    }
    throw new Error("Couldn't reach the AI provider. Check your internet connection and try again.", { cause: error });
  }

  const data: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    const { error, message } = data as ErrorBody;
    const detail = error?.message ?? message ?? response.statusText;
    throw new ProviderError(`${friendlyError(response.status)} (${response.status}: ${detail})`, response.status);
  }
  return data as T;
}
