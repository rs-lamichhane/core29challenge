import { useState, useRef, useEffect } from 'react';
import { useSettings } from '../utils/SettingsContext';
import { LANGUAGES } from '../utils/constants';
import { Globe, ChevronDown } from 'lucide-react';

export default function LanguageBar() {
  const { language, setLanguage, speak } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const current = LANGUAGES[language] || LANGUAGES.en;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="w-full bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800 z-40 relative">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-1 sm:py-1.5 flex items-center justify-end">
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-200 transition-all"
          >
            <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-400" />
            <span className="text-sm">{current.flag}</span>
            <span className="hidden sm:inline">{current.label}</span>
            <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {isOpen && (
            <div className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
              {Object.entries(LANGUAGES).map(([code, { label, flag }]) => (
                <button
                  key={code}
                  onClick={() => {
                    setLanguage(code);
                    speak(`Language changed to ${label}`);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-xs transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0 ${language === code
                      ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 font-semibold'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'
                    }`}
                >
                  <span className="text-base">{flag}</span>
                  <span>{label}</span>
                  {language === code && <span className="ml-auto text-brand-500">&#10003;</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
