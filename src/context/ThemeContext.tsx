import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
type ViewportMode = 'responsive' | 'mobile_preview';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  viewportMode: ViewportMode;
  toggleViewportMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dyser_theme');
      if (saved === 'dark' || saved === 'light') return saved;
    }
    return 'light';
  });

  const [viewportMode, setViewportMode] = useState<ViewportMode>('responsive');

  useEffect(() => {
    try {
      localStorage.setItem('dyser_theme', theme);
    } catch (_) {}

    const root = document.documentElement;
    const body = document.body;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      if (body) {
        body.classList.add('dark');
        body.classList.remove('light');
      }
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      if (body) {
        body.classList.remove('dark');
        body.classList.add('light');
      }
      root.style.colorScheme = 'light';
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const toggleViewportMode = () => {
    setViewportMode(prev => (prev === 'responsive' ? 'mobile_preview' : 'responsive'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, viewportMode, toggleViewportMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
