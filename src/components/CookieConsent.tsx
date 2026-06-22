import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Settings, X, ChevronRight, Info } from 'lucide-react';
import { triggerAnalyticsIfConsented } from '../lib/analytics';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analyticsConsent, setAnalyticsConsent] = useState(false);

  useEffect(() => {
    // Check if user has already made a selection
    const consent = localStorage.getItem('cc_cookie_consent');
    if (!consent) {
      // Delay slightly for smooth entrance
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      // If was granted, trigger analytics
      if (consent === 'granted') {
        triggerAnalyticsIfConsented();
      }
    }
  }, []);

  useEffect(() => {
    // Listen for custom event to re-open settings from the policy page
    const handleOpenSettings = () => {
      const consent = localStorage.getItem('cc_cookie_consent');
      setAnalyticsConsent(consent === 'granted');
      setShowBanner(true);
      setShowDetails(true);
    };

    window.addEventListener('open-cookie-settings', handleOpenSettings);
    return () => window.removeEventListener('open-cookie-settings', handleOpenSettings);
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('cc_cookie_consent', 'granted');
    triggerAnalyticsIfConsented();
    setShowBanner(false);
    setShowDetails(false);
  };

  const handleDeclineAll = () => {
    localStorage.setItem('cc_cookie_consent', 'denied');
    setShowBanner(false);
    setShowDetails(false);
  };

  const handleSaveCustom = () => {
    const status = analyticsConsent ? 'granted' : 'denied';
    localStorage.setItem('cc_cookie_consent', status);
    if (analyticsConsent) {
      triggerAnalyticsIfConsented();
    }
    setShowBanner(false);
    setShowDetails(false);
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-2xl"
          id="cookie-consent-banner"
        >
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-serif font-semibold text-slate-900 dark:text-white">
                  Cookie & Local Storage Preferences
                </h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-4xl">
                We use cookies and local storage to keep your session authenticated, remember your theme settings, and gather anonymous analytics metrics via Google Analytics.
                Please review and select your preferences. To learn more, read our{' '}
                <a href="/cookies" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                  Cookie Policy
                </a>.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto shrink-0">
              <button
                id="btn-cookie-settings"
                onClick={() => setShowDetails(!showDetails)}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <Settings className="w-4 h-4 animate-spin-slow" />
                {showDetails ? 'Hide Options' : 'Custom Preferences'}
              </button>
              <button
                id="btn-cookie-decline"
                onClick={handleDeclineAll}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-center"
              >
                Refuse All
              </button>
              <button
                id="btn-cookie-accept"
                onClick={handleAcceptAll}
                className="w-full sm:w-auto px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm text-center"
              >
                Accept All
              </button>
            </div>
          </div>

          {/* Expandable Preferences details */}
          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="max-w-7xl mx-auto mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Option 1: Strictly Necessary (Always On) */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-start gap-3">
                    <div className="mt-1">
                      <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-slate-900 dark:text-white text-sm">
                          Strictly Necessary (Authentication & Basic Session)
                        </span>
                        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-0.5 rounded-full">
                          Required
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Essential local storage values (`auth_token`, local user states) loaded purely for identity validation and billing session state. Without these, you will not be able to log in or use premium layouts. No tracking telemetry is transmitted.
                      </p>
                    </div>
                  </div>

                  {/* Option 2: Performance & Analytics (Configurable) */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-start gap-3">
                    <div className="mt-1">
                      <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-slate-900 dark:text-white text-sm">
                          Performance & Analytics (Google Analytics)
                        </span>
                        <div className="relative flex items-center">
                          <input
                            type="checkbox"
                            id="toggle-analytics-consent"
                            className="sr-only peer"
                            checked={analyticsConsent}
                            onChange={(e) => setAnalyticsConsent(e.target.checked)}
                          />
                          <div 
                            onClick={() => setAnalyticsConsent(!analyticsConsent)}
                            className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 cursor-pointer"
                          ></div>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Allows us to anonymize pageviews, scroll events, and UI click analytics via Google Analytics to help improve templating paths and optimization features. Disabling this shuts down all external analytical tracking operations.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    id="btn-save-cookie-custom"
                    onClick={handleSaveCustom}
                    className="px-5 py-2 text-sm font-medium text-white bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 rounded-lg transition-colors shadow-sm"
                  >
                    Save Selected Preferences
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
