import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ColorBlindMode = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';

interface Settings {
  darkMode: boolean;
  colorBlindMode: ColorBlindMode;
  narration: boolean;
  language: string;
  totalCo2Saved: number;
}

interface SettingsContextValue extends Settings {
  setDarkMode: (v: boolean) => void;
  setColorBlindMode: (v: ColorBlindMode) => void;
  setNarration: (v: boolean) => void;
  setLanguage: (v: string) => void;
  setTotalCo2Saved: (v: number) => void;
  speak: (text: string) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('gr_dark') === 'true');
  const [colorBlindMode, setColorBlindMode] = useState<ColorBlindMode>(
    () => (localStorage.getItem('gr_cb') as ColorBlindMode) || 'none'
  );
  const [narration, setNarration] = useState(() => localStorage.getItem('gr_narr') === 'true');
  const [language, setLanguage] = useState(() => localStorage.getItem('gr_lang') || 'en');
  const [totalCo2Saved, setTotalCo2Saved] = useState(0);

  // Persist settings
  useEffect(() => { localStorage.setItem('gr_dark', String(darkMode)); }, [darkMode]);
  useEffect(() => { localStorage.setItem('gr_cb', colorBlindMode); }, [colorBlindMode]);
  useEffect(() => { localStorage.setItem('gr_narr', String(narration)); }, [narration]);
  useEffect(() => { localStorage.setItem('gr_lang', language); }, [language]);

  // Apply dark mode class to <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Apply color blind filter class
  useEffect(() => {
    document.documentElement.dataset.cb = colorBlindMode;
  }, [colorBlindMode]);

  // Narration function using Web Speech API
  const speak = (text: string) => {
    if (!narration) return;
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.lang = language === 'en' ? 'en-GB' : language;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <SettingsContext.Provider
      value={{
        darkMode, setDarkMode,
        colorBlindMode, setColorBlindMode,
        narration, setNarration,
        language, setLanguage,
        totalCo2Saved, setTotalCo2Saved,
        speak,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
