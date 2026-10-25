import type { ComponentChildren } from 'preact';

type ButtonProps = {
  children: ComponentChildren;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
};

export function Button({ children, onClick, variant = 'primary', disabled = false }: Readonly<ButtonProps>) {
  return (
    <button type="button" class={`button button-${variant}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

type LinkButtonProps = { children: ComponentChildren; onClick: () => void };

export function LinkButton({ children, onClick }: Readonly<LinkButtonProps>) {
  return (
    <button type="button" class="link-button" onClick={onClick}>
      {children}
    </button>
  );
}

type IconButtonProps = { label: string; onClick: () => void; children: ComponentChildren };

export function IconButton({ label, onClick, children }: Readonly<IconButtonProps>) {
  return (
    <button type="button" class="icon-button" onClick={onClick} aria-label={label} title={label}>
      {children}
    </button>
  );
}
