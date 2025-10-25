// src/context/ThemeContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';

// 1. Create the Context (AND EXPORT IT!)
export const ThemeContext = createContext(null); // 🔑 Export added here!

// 2. Create the Provider Component
export const ThemeProvider = ({ children }) => {
  // State to hold the current theme ('light' or 'dark')
  const [theme, setTheme] = useState(() => {
    // ⬇️ Check localStorage first
    try {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            return savedTheme;
        }
        // ⬇️ Then check OS preference
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch (e) {
        // Safe fallback
        return 'light';
    }
  });

  // 3. useEffect to apply the class and save preference
  useEffect(() => {
    const root = window.document.documentElement; // This targets the <html> tag

    // 🔑 Key step: Add or remove the 'dark' class
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    // Save the preference to storage
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Function to toggle the theme
  const toggleTheme = () => {
    setTheme(currentTheme => (currentTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// 4. Create a custom hook for easy access
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        // ⬅️ This is the line throwing the error!
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};