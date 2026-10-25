import type { ComponentChildren } from 'preact';

type CheckboxProps = {
  /** "mixed" shows a dash, for "some but not all". */
  checked: boolean | 'mixed';
  onChange: (checked: boolean) => void;
  label?: ComponentChildren;
  ariaLabel?: string;
};

export function Checkbox({ checked, onChange, label, ariaLabel }: Readonly<CheckboxProps>) {
  const box = (
    <input
      type="checkbox"
      class="checkbox"
      checked={checked === true}
      ref={(element) => {
        if (element) {
          element.indeterminate = checked === 'mixed';
        }
      }}
      aria-label={ariaLabel}
      onChange={(event) => onChange(event.currentTarget.checked)}
    />
  );

  if (!label) {
    return box;
  }
  return (
    <label class="checkbox-row">
      {box}
      <span>{label}</span>
    </label>
  );
}
