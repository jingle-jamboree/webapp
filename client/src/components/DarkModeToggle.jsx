import React, { useState, useEffect } from 'react';
import {Sun, Moon} from 'lucide-react'

export default function DarkModeToggle() {
  const [isDarkMode, setIsDarkMode] = useState(
    // Check local storage or user preference
    () => localStorage.getItem('theme') === 'dark'
  );

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const handleToggle = () => {
    setIsDarkMode((prev) => !prev);
  };

  return (
    <button
      onClick={handleToggle}
      className="inline-flex items-center justify-center p-2 transition-colors
                 rounded-xl bg-gray-200 dark:bg-gray-800 hover:bg-gray-300
                 dark:hover:bg-gray-700 focus:outline-none"
      aria-label="Toggle dark mode"
    >
      {isDarkMode ? <Moon /> : <Sun />}
    </button>
  );
}
