'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <button
      type='button'
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className='rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800'
      aria-label='Toggle theme'
    >
      {theme === 'dark' ? <Sun className='h-5 w-5 text-white' /> : <Moon className='h-5 w-5' />}
    </button>
  );
}

export default ThemeToggle;
