import { useState } from 'preact/hooks';
import type { AiSettings, Provider } from '../../shared/messages.ts';
import { Banner } from '../components/Banner.tsx';
import { Button } from '../components/Button.tsx';
import { SecretInput } from '../components/SecretInput.tsx';
import { Select } from '../components/Select.tsx';
import { keyProblem, PROVIDERS } from '../providers.ts';

const PROVIDER_OPTIONS = (Object.keys(PROVIDERS) as Provider[]).map((value) => ({ value, label: PROVIDERS[value].label }));

type SetupProps = { onSave: (settings: AiSettings) => void };

export function Setup({ onSave }: Readonly<SetupProps>) {
  const [provider, setProvider] = useState<Provider>('openai');
  const [apiKey, setApiKey] = useState('');
  const [problem, setProblem] = useState<string | null>(null);

  function save() {
    const trimmedKey = apiKey.trim();
    const foundProblem = keyProblem(provider, trimmedKey);
    setProblem(foundProblem);
    if (!foundProblem) {
      onSave({ provider, apiKey: trimmedKey });
    }
  }

  return (
    <div class="stack">
      <p>Choose your AI provider and paste your own API key.</p>
      <Select
        label="Provider"
        value={provider}
        options={PROVIDER_OPTIONS}
        onChange={(value) => {
          setProvider(value);
          setProblem(null);
        }}
      />
      <SecretInput label="API key" value={apiKey} placeholder={PROVIDERS[provider].keyHint} onInput={setApiKey} onEnter={save} />
      <a class="key-link" href={PROVIDERS[provider].keyUrl} target="_blank" rel="noreferrer">
        Get your key from {PROVIDERS[provider].shortLabel} ↗
      </a>
      {problem && <Banner tone="error">{problem}</Banner>}
      <Button onClick={save}>Save key</Button>
      <Banner tone="info">
        When you save it, Figma stores your key using clientStorage. It is sent directly to {PROVIDERS[provider].shortLabel} only to make
        requests. Clicking Suggest names with AI sends selected layer details and any screenshots you enable to that provider. Layer Bloom
        does not receive your key or layer data. Provider API fees and its privacy and retention terms may apply. Set a provider-side
        spending limit if available.{' '}
        <a
          class="privacy-link"
          href="https://github.com/Rachel-Kenyani/Layer-Bloom/blob/main/plugin/privacy-policy.md"
          target="_blank"
          rel="noreferrer"
        >
          Privacy policy
        </a>
      </Banner>
    </div>
  );
}
