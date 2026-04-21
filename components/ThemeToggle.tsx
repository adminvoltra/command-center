'use client';

import { useTheme, type ThemePreference } from './ThemeProvider';

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export default function ThemeToggle({ ariaLabel = 'Theme' }: { ariaLabel?: string }) {
  const { preference, setPreference } = useTheme();

  return (
    <div role="group" aria-label={ariaLabel} className="segmented">
      {OPTIONS.map((opt) => {
        const active = preference === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            className="segmented-item"
            aria-pressed={active}
            onClick={() => setPreference(opt.value)}
          >
            <span className="segmented-dot" aria-hidden />
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
