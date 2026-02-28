import { useSettings } from '../utils/SettingsContext';
import { LANGUAGES } from '../utils/constants';
import { Globe } from 'lucide-react';

export default function LanguageBar() {
  const { language, setLanguage, speak } = useSettings();

  return (
    <div className="w-full bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800 z-40 relative">
      <div className="max-w-4xl mx-auto px-4 py-1.5 flex items-center gap-2 overflow-x-auto scrollbar-hide">
        <Globe className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        {Object.entries(LANGUAGES).map(([code, { label, flag }]) => (
          <button
            key={code}
            onClick={() => {
              setLanguage(code);
              speak(`Language changed to ${label}`);
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
              language === code
                ? 'bg-brand-500 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <span className="text-sm">{flag}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
