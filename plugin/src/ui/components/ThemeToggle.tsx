import { Moon, Sun } from 'lucide-preact';
import type { Theme } from '../../shared/messages.ts';
import { IconButton } from './Button.tsx';

type ThemeToggleProps = { theme: Theme; onChange: (theme: Theme) => void };

export function ThemeToggle({ theme, onChange }: Readonly<ThemeToggleProps>) {
  if (theme === 'dark') {
    return (
      <IconButton label="Switch to light mode" onClick={() => onChange('light')}>
        <Sun size={16} />
      </IconButton>
    );
  }
  return (
    <IconButton label="Switch to dark mode" onClick={() => onChange('dark')}>
      <Moon size={16} />
    </IconButton>
  );
}
