import { useState, useEffect } from "react";

export type Theme = "light" | "dark";

export function getInitialTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") {
    return saved;
  }
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

export function applyTheme(theme: "light" | "dark") {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
  localStorage.setItem("theme", theme);
}

export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return getInitialTheme();
  });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return { theme, setTheme, toggleTheme };
}
