import { useState } from 'preact/hooks';
import type { AiSettings } from '../../shared/messages.ts';
import { PROVIDERS } from '../providers.ts';
import { Banner } from './Banner.tsx';
import { LinkButton } from './Button.tsx';

type KeyStatusProps = { settings: AiSettings; onForget: () => void };

export function KeyStatus({ settings, onForget }: Readonly<KeyStatusProps>) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <Banner tone="warning">
        Remove the saved key? You can enter a new one straight away.
        <span class="banner-actions">
          <LinkButton onClick={onForget}>Remove key</LinkButton>
          <LinkButton onClick={() => setConfirming(false)}>Keep it</LinkButton>
        </span>
      </Banner>
    );
  }
  return (
    <p class="settings-line">
      Using {PROVIDERS[settings.provider].shortLabel} · key …{settings.apiKey.slice(-4)} ·{' '}
      <LinkButton onClick={() => setConfirming(true)}>Change key</LinkButton>
    </p>
  );
}
