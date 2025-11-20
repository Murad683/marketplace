import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { themes } from "../theme/theme";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // localStorage-dan mövcud dəyəri oxuyuruq
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved === "dark" ? "dark" : "light";
  });

  // theme dəyişəndə yadda saxla və html-ə ötür
  useEffect(() => {
    localStorage.setItem("theme", theme);
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === "light" ? "dark" : "light"));
  }

  const activeTheme = useMemo(() => themes[theme] ?? themes.light, [theme]);

  const value = {
    theme,
    isDark: theme === "dark",
    palette: activeTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {/* Burdakı div-in className-i tailwind-in dark variantını aktiv edir */}
      <div className={theme === "dark" ? "dark" : ""} data-theme={theme}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
