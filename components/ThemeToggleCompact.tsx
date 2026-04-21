'use client';

import { useTheme, type ThemePreference } from './ThemeProvider';

const ORDER: ThemePreference[] = ['system', 'light', 'dark'];

function glyph(pref: ThemePreference) {
  if (pref === 'light') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>
    );
  }
  if (pref === 'dark') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </svg>
  );
}

function labelFor(pref: ThemePreference) {
  return pref === 'system' ? 'System theme' : pref === 'light' ? 'Light theme' : 'Dark theme';
}

export default function ThemeToggleCompact() {
  const { preference, setPreference } = useTheme();

  const next = () => {
    const i = ORDER.indexOf(preference);
    setPreference(ORDER[(i + 1) % ORDER.length]);
  };

  return (
    <button
      type="button"
      className="theme-btn"
      aria-label={`${labelFor(preference)} — click to cycle`}
      title={labelFor(preference)}
      onClick={next}
    >
      {glyph(preference)}
    </button>
  );
}
