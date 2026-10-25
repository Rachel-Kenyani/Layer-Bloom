import { useEffect, useRef, useState } from 'preact/hooks';
import { Check, ChevronDown } from 'lucide-preact';

type Option<T extends string> = { value: T; label: string };

type SelectProps<T extends string> = {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
};

function focusSibling(event: KeyboardEvent, direction: 'next' | 'previous'): void {
  const item = (event.currentTarget as HTMLElement).parentElement;
  const sibling = direction === 'next' ? item?.nextElementSibling : item?.previousElementSibling;
  sibling?.querySelector('button')?.focus();
}

export function Select<T extends string>({ label, value, options, onChange }: Readonly<SelectProps<T>>) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const selectedOption = useRef<HTMLButtonElement>(null);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    selectedOption.current?.focus();
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [open]);

  function close() {
    setOpen(false);
    trigger.current?.focus();
  }

  function onOptionKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      close();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusSibling(event, 'next');
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusSibling(event, 'previous');
    }
  }

  return (
    <div class="field" ref={root}>
      <span class="field-label">{label}</span>
      <button ref={trigger} type="button" class="select-trigger" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span>{selected?.label}</span>
        <span class={open ? 'chevron chevron-open' : 'chevron'}>
          <ChevronDown size={16} />
        </span>
      </button>
      {open && (
        <ul class="select-menu" aria-label={label}>
          {options.map((option) => (
            <li key={option.value}>
              <button
                ref={option.value === value ? selectedOption : undefined}
                type="button"
                class="select-option"
                aria-current={option.value === value}
                onClick={() => {
                  onChange(option.value);
                  close();
                }}
                onKeyDown={onOptionKeyDown}
              >
                <span>{option.label}</span>
                {option.value === value && <Check size={14} />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
