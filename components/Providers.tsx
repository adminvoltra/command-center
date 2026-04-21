'use client';

import { AppContextProvider } from '@/lib/AppContextProvider';
import { ReactNode } from 'react';
import { ThemeProvider } from './ThemeProvider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AppContextProvider>{children}</AppContextProvider>
    </ThemeProvider>
  );
}
