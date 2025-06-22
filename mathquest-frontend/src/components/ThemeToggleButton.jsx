import React from 'react';
import { useAuth } from '../context/AuthContext';

const ThemeToggleButton = ({ darkMode, setDarkMode }) => {
  const { currentUser } = useAuth();

  return (
    <button
      className={`fixed ${currentUser ? 'top-4 right-16' : 'top-20 right-4'} z-50 px-4 py-2 rounded bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-md md:top-4 md:right-4`}
      onClick={() => setDarkMode((prev) => !prev)}
      aria-label="Toggle dark mode"
    >
      {darkMode ? '🌙 Dark' : '☀️ Light'}
    </button>
  );
};

export default ThemeToggleButton; 