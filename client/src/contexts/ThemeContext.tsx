import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

// Theme context interface
interface ThemeContextType {
  theme: "light" | "dark" | "system";
  setTheme: (theme: "light" | "dark" | "system") => void;
  actualTheme: "light" | "dark"; // The actual theme being applied (resolves 'system')
}

// Create context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme provider props
interface ThemeProviderProps {
  children: ReactNode;
}

// Theme provider component
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<"light" | "dark" | "system">(
    "system"
  );
  const [actualTheme, setActualTheme] = useState<"light" | "dark">("light");

  // Function to get system theme preference
  const getSystemTheme = (): "light" | "dark" => {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return "light";
  };

  // Function to apply theme to document
  const applyTheme = (newTheme: "light" | "dark") => {
    const root = document.documentElement;
    if (newTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    setActualTheme(newTheme);
  };

  // Function to resolve theme (handles 'system' option)
  const resolveTheme = (
    currentTheme: "light" | "dark" | "system"
  ): "light" | "dark" => {
    if (currentTheme === "system") {
      return getSystemTheme();
    }
    return currentTheme;
  };

  // Set theme function
  const setTheme = (newTheme: "light" | "dark" | "system") => {
    setThemeState(newTheme);
    const resolvedTheme = resolveTheme(newTheme);
    applyTheme(resolvedTheme);

    // Save to localStorage
    localStorage.setItem("theme", newTheme);
  };

  // Initialize theme on mount
  useEffect(() => {
    // Get saved theme from localStorage or default to 'system'
    const savedTheme = localStorage.getItem("theme") as
      | "light"
      | "dark"
      | "system"
      | null;
    const initialTheme = savedTheme || "system";

    setThemeState(initialTheme);
    const resolvedTheme = resolveTheme(initialTheme);
    applyTheme(resolvedTheme);
  }, []);

  // Listen for system theme changes when theme is set to 'system'
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const systemTheme = getSystemTheme();
      applyTheme(systemTheme);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const value: ThemeContextType = {
    theme,
    setTheme,
    actualTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

// Custom hook to use theme context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export default ThemeProvider;

