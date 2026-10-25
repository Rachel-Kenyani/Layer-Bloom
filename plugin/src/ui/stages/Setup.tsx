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
        Your key is saved only on this computer. Layer names, text and any screenshots you choose to send go only to{' '}
        {PROVIDERS[provider].shortLabel}, to suggest names. Tip: use a dedicated key with a monthly spending limit.
      </Banner>
    </div>
  );
}
