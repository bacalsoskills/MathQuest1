import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const ThemeToggleButton = () => {
  const { currentUser } = useAuth();
  const { darkMode, toggleTheme, isInitialized, getCurrentTheme } = useTheme();

  // Don't render until theme is initialized to prevent flash
  if (!isInitialized) {
    return null;
  }

  // Get the actual current theme from DOM to ensure accuracy
  const currentTheme = getCurrentTheme();

  return (
    <button
      className={`fixed ${currentUser ? 'top-4 right-16' : 'top-20 right-4'} z-50 px-4 py-2 rounded bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-md md:top-4 md:right-4 transition-all duration-200 hover:bg-gray-300 dark:hover:bg-gray-700`}
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
    >
      {currentTheme ? '🌙 Dark' : '☀️ Light'}
    </button>
  );
};

export default ThemeToggleButton; 