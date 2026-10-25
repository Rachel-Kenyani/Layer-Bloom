import { useState } from 'preact/hooks';
import { Eye, EyeOff } from 'lucide-preact';

type SecretInputProps = { label: string; value: string; placeholder: string; onInput: (value: string) => void; onEnter: () => void };

export function SecretInput({ label, value, placeholder, onInput, onEnter }: Readonly<SecretInputProps>) {
  const [visible, setVisible] = useState(false);
  const toggleLabel = visible ? 'Hide key' : 'Show key';
  const inputProps = {
    value,
    placeholder,
    autocomplete: 'off',
    spellcheck: false,
    'aria-label': label,
    onInput: (event: Event) => onInput((event.currentTarget as HTMLInputElement).value),
    onKeyDown: (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        onEnter();
      }
    },
  };

  return (
    <div class="field">
      <span class="field-label">{label}</span>
      <span class="secret-input">
        {visible ? <input type="text" {...inputProps} /> : <input type="password" {...inputProps} />}
        <button type="button" class="secret-toggle" onClick={() => setVisible(!visible)} aria-label={toggleLabel} title={toggleLabel}>
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </span>
    </div>
  );
}
