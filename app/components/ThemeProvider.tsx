'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ThemeProviderProps } from 'next-themes/dist/types';

function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider attribute='class' defaultTheme='dark' forcedTheme='dark' enableSystem={false}>
      {children}
    </NextThemesProvider>
  );
}

export default ThemeProvider;
