import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X, Moon, Sun, Eye, Volume2, VolumeX, Globe } from 'lucide-react';
import { useSettings, ColorBlindMode } from '../utils/SettingsContext';
import { LANGUAGES } from '../utils/constants';

export default function SettingsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const {
    darkMode, setDarkMode,
    colorBlindMode, setColorBlindMode,
    narration, setNarration,
    language, setLanguage,
    speak,
  } = useSettings();

  const colorBlindOptions: { key: ColorBlindMode; label: string; desc: string }[] = [
    { key: 'none', label: 'Normal', desc: 'Default colours' },
    { key: 'protanopia', label: 'Protanopia', desc: 'Red-blind' },
    { key: 'deuteranopia', label: 'Deuteranopia', desc: 'Green-blind' },
    { key: 'tritanopia', label: 'Tritanopia', desc: 'Blue-blind' },
  ];

  return (
    <>
      {/* Settings gear button */}
      <button
        onClick={() => { setIsOpen(true); speak('Settings panel opened'); }}
        className="fixed bottom-5 left-5 z-40 w-11 h-11 bg-gray-700 dark:bg-gray-600 hover:bg-gray-800 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
        aria-label="Open settings"
      >
        <Settings className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="fixed top-0 left-0 z-50 h-full w-full sm:w-[340px] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Settings className="w-4 h-4" /> Settings & Accessibility
              </h3>
              <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
              {/* Dark Mode */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3">Display</h4>
                <button
                  onClick={() => { setDarkMode(!darkMode); speak(darkMode ? 'Light mode enabled' : 'Dark mode enabled'); }}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {darkMode ? <Moon className="w-5 h-5 text-purple-400" /> : <Sun className="w-5 h-5 text-yellow-500" />}
                    <div className="text-left">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Dark Mode</span>
                      <p className="text-[10px] text-gray-400">{darkMode ? 'On' : 'Off'}</p>
                    </div>
                  </div>
                  <div className={`w-10 h-6 rounded-full transition-colors ${darkMode ? 'bg-purple-500' : 'bg-gray-300'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow-sm mt-0.5 transition-transform ${darkMode ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                  </div>
                </button>
              </div>

              {/* Colour Blind Mode */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" /> Colour Blind Mode
                </h4>
                <div className="space-y-2">
                  {colorBlindOptions.map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => { setColorBlindMode(opt.key); speak(`Colour blind mode: ${opt.label}`); }}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                        colorBlindMode === opt.key
                          ? 'border-brand-400 bg-brand-50 dark:bg-brand-900/30 dark:border-brand-500'
                          : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-gray-200'
                      }`}
                    >
                      <div className="text-left">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{opt.label}</span>
                        <p className="text-[10px] text-gray-400">{opt.desc}</p>
                      </div>
                      {colorBlindMode === opt.key && (
                        <div className="w-5 h-5 bg-brand-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Menu Narration */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3">Accessibility</h4>
                <button
                  onClick={() => {
                    const newVal = !narration;
                    setNarration(newVal);
                    if (newVal) {
                      // Speak after enabling
                      setTimeout(() => {
                        if ('speechSynthesis' in window) {
                          const u = new SpeechSynthesisUtterance('Screen narration enabled');
                          u.rate = 0.95;
                          window.speechSynthesis.speak(u);
                        }
                      }, 100);
                    }
                  }}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {narration ? <Volume2 className="w-5 h-5 text-brand-500" /> : <VolumeX className="w-5 h-5 text-gray-400" />}
                    <div className="text-left">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Menu Narration</span>
                      <p className="text-[10px] text-gray-400">Reads menu items and actions aloud</p>
                    </div>
                  </div>
                  <div className={`w-10 h-6 rounded-full transition-colors ${narration ? 'bg-brand-500' : 'bg-gray-300'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow-sm mt-0.5 transition-transform ${narration ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                  </div>
                </button>
              </div>

              {/* Language */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" /> Language
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(LANGUAGES).map(([key, { label, flag }]) => (
                    <button
                      key={key}
                      onClick={() => { setLanguage(key); speak(`Language changed to ${label}`); }}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all ${
                        language === key
                          ? 'border-brand-400 bg-brand-50 dark:bg-brand-900/30'
                          : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-gray-200'
                      }`}
                    >
                      <span className="text-lg">{flag}</span>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-200">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
