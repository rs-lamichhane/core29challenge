import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X, Moon, Sun, Eye, Volume2, VolumeX, Globe, Bell, BellOff, Accessibility, ChevronDown } from 'lucide-react';
import { useSettings, ColorBlindMode } from '../utils/SettingsContext';
import { LANGUAGES } from '../utils/constants';
import { isNotificationSupported, requestNotificationPermission, getNotificationPermission } from '../utils/notifications';

export default function SettingsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifPermission, setNotifPermission] = useState<string>('default');
  const [langOpen, setLangOpen] = useState(false);
  const {
    darkMode, setDarkMode,
    colorBlindMode, setColorBlindMode,
    narration, setNarration,
    language, setLanguage,
    speak,
  } = useSettings();

  const currentLang = LANGUAGES[language] || LANGUAGES.en;

  useEffect(() => {
    setNotifPermission(getNotificationPermission());
  }, []);

  const handleNotifToggle = async () => {
    if (notifPermission === 'granted') {
      speak('Notifications are enabled. To disable, update your browser settings.');
      return;
    }
    const granted = await requestNotificationPermission();
    setNotifPermission(granted ? 'granted' : 'denied');
    if (granted) speak('Push notifications enabled');
  };

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
          <>
            {/* Tap-to-close backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="settings-backdrop sm:block"
            />
            <motion.div
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="fixed top-0 left-0 z-50 h-full w-[85vw] max-w-[340px] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <Settings className="w-4 h-4" /> Settings
                </h3>
                <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-6 pb-[calc(1rem+env(safe-area-inset-bottom))]">

                {/* ─── Display ─── */}
                <div>
                  <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3 flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5" /> Display
                  </h4>
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

                {/* ─── Accessibility (Colour Blind + Narration) ─── */}
                <div>
                  <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3 flex items-center gap-1.5">
                    <Accessibility className="w-3.5 h-3.5" /> Accessibility
                  </h4>
                  <div className="space-y-2">
                    {/* Colour Vision dropdown */}
                    <div>
                      <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1.5">
                        <Eye className="w-3 h-3" /> Colour Vision
                      </p>
                      <select
                        value={colorBlindMode}
                        onChange={(e) => { setColorBlindMode(e.target.value as ColorBlindMode); speak(`Colour vision mode: ${e.target.value}`); }}
                        className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 rounded-xl border-2 border-gray-100 dark:border-gray-700 focus:border-brand-400 outline-none transition-all cursor-pointer appearance-none"
                        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                      >
                        {colorBlindOptions.map(opt => (
                          <option key={opt.key} value={opt.key}>{opt.label} — {opt.desc}</option>
                        ))}
                      </select>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-100 dark:border-gray-700 my-2" />

                    {/* Screen Narration */}
                    <button
                      onClick={() => {
                        const newVal = !narration;
                        setNarration(newVal);
                        if (newVal) {
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
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Screen Narration</span>
                          <p className="text-[10px] text-gray-400">Reads menu items and actions aloud</p>
                        </div>
                      </div>
                      <div className={`w-10 h-6 rounded-full transition-colors ${narration ? 'bg-brand-500' : 'bg-gray-300'}`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow-sm mt-0.5 transition-transform ${narration ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                      </div>
                    </button>
                  </div>
                </div>

                {/* ─── Notifications ─── */}
                {isNotificationSupported() && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3 flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5" /> Notifications
                    </h4>
                    <button
                      onClick={handleNotifToggle}
                      className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {notifPermission === 'granted' ? <Bell className="w-5 h-5 text-orange-500" /> : <BellOff className="w-5 h-5 text-gray-400" />}
                        <div className="text-left">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Push Notifications</span>
                          <p className="text-[10px] text-gray-400">
                            {notifPermission === 'granted' ? 'Enabled — achievements, streaks, battles' :
                              notifPermission === 'denied' ? 'Blocked — update browser settings' :
                                'Get notified for achievements & battles'}
                          </p>
                        </div>
                      </div>
                      <div className={`w-10 h-6 rounded-full transition-colors ${notifPermission === 'granted' ? 'bg-orange-500' : 'bg-gray-300'}`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow-sm mt-0.5 transition-transform ${notifPermission === 'granted' ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                      </div>
                    </button>
                  </div>
                )}

                {/* ─── Language (Dropdown) ─── */}
                <div>
                  <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" /> Language
                  </h4>
                  <div className="relative">
                    <button
                      onClick={() => setLangOpen(!langOpen)}
                      className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">{currentLang.flag}</span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{currentLang.label}</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {langOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden"
                        >
                          <div className="max-h-52 overflow-y-auto">
                            {Object.entries(LANGUAGES).map(([code, { label, flag }]) => (
                              <button
                                key={code}
                                onClick={() => {
                                  setLanguage(code);
                                  speak(`Language changed to ${label}`);
                                  setLangOpen(false);
                                }}
                                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0 ${language === code
                                  ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 font-semibold'
                                  : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'
                                  }`}
                              >
                                <span className="text-base">{flag}</span>
                                <span>{label}</span>
                                {language === code && <span className="ml-auto text-brand-500">✓</span>}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
