import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    // Check localStorage first
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    
    // Fallback to system preference
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    
    return false;
  });

  const [isInitialized, setIsInitialized] = useState(false);

  // Sync with DOM on mount to ensure consistency
  useEffect(() => {
    const isDarkInDOM = document.documentElement.classList.contains('dark');
    const savedTheme = localStorage.getItem('theme');
    
    // If DOM state doesn't match our state, sync them
    if (darkMode !== isDarkInDOM) {
      if (darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    
    // If localStorage doesn't match our state, update it
    if (savedTheme !== (darkMode ? 'dark' : 'light')) {
      localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    }
    
    // Double-check DOM state after a brief delay to catch any race conditions
    setTimeout(() => {
      const finalDarkState = document.documentElement.classList.contains('dark');
      if (finalDarkState !== darkMode) {
        setDarkMode(finalDarkState);
      }
    }, 100);
    
    setIsInitialized(true);
    document.body.classList.add('theme-ready');
  }, []);

  useEffect(() => {
    // Only apply theme changes after initialization
    if (isInitialized) {
      if (darkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    }
  }, [darkMode, isInitialized]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      // Only update if user hasn't manually set a preference
      const savedTheme = localStorage.getItem('theme');
      if (!savedTheme) {
        setDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    setDarkMode(prev => {
      const newMode = !prev;
      // Immediately apply to DOM for instant feedback
      if (newMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
      return newMode;
    });
  };

  const getCurrentTheme = () => {
    return document.documentElement.classList.contains('dark');
  };

  const value = {
    darkMode,
    setDarkMode,
    toggleTheme,
    isInitialized,
    getCurrentTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}; 