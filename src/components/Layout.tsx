import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { FileText, FileSignature, BarChart, Menu, X, Moon, Sun, CreditCard, User, ShieldAlert, LogIn, LogOut, LayoutTemplate, ChevronDown, ArrowUp, Users, Target, Brain, Briefcase } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Logo from './Logo';
import Footer from './Footer';
import Tooltip from './Tooltip';
import CookieConsent from './CookieConsent';
import YewoChatbot from './YewoChatbot';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useAuth();

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMoreMenuOpen(false);
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const mainNav = [
    { name: 'Resume Builder', href: '/resume-builder', icon: FileText },
    { name: 'Cover Letter', href: '/cover-letter', icon: FileSignature },
    { name: 'Templates', href: '/templates', icon: LayoutTemplate },
    { name: 'Pricing', href: '/pricing', icon: CreditCard },
  ];

  const moreNav = [
    { name: 'Analyzer', href: '/analyzer', icon: BarChart },
    { name: 'Keyword Suggestor', href: '/keyword-suggestor', icon: Target },
    { name: 'Interview Prep', href: '/interview-prep', icon: Brain },
    { name: 'About Us', href: '/about', icon: Users },
  ];

  const userNav = user ? [
    { name: 'My Resumes', href: '/my-resumes', icon: FileText },
    { name: 'Job Tracker', href: '/job-tracker', icon: Briefcase },
    { name: 'Account', href: '/account', icon: User },
    ...(isAdmin ? [{ name: 'Admin', href: '/admin', icon: ShieldAlert }] : [])
  ] : [];

  const allNavItems = [...mainNav, ...moreNav, ...userNav];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans transition-colors duration-200">
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled 
            ? 'bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 py-3' 
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-10">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="flex items-center gap-2.5 group">
                  <Logo className="w-7 h-7 transition-transform duration-300 group-hover:scale-105 rounded-lg" iconClassName="w-4 h-4" />
                  <span className="font-serif font-medium text-lg tracking-tight text-slate-900 dark:text-white">
                    CareerCraft
                  </span>
                </Link>
              </div>
              <nav className="hidden lg:ml-8 lg:flex lg:space-x-1 items-center">
                {mainNav.map((item) => {
                  const active = location.pathname.startsWith(item.href);
                  return (
                    <Link 
                      key={item.name}
                      to={item.href}
                      className={`px-3 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                        active 
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' 
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                      }`}
                      aria-current={active ? 'page' : undefined}
                    >
                      {item.name}
                    </Link>
                  );
                })}

                <div className="relative ml-2" ref={moreMenuRef}>
                  <button 
                    onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                      isMoreMenuOpen || [...moreNav, ...userNav].some(item => location.pathname.startsWith(item.href))
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    aria-haspopup="true"
                    aria-expanded={isMoreMenuOpen}
                  >
                    {user ? 'Menu' : 'More'}
                    <ChevronDown className={`w-4 h-4 ml-1 transition-transform duration-200 ${isMoreMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  <AnimatePresence>
                    {isMoreMenuOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-48 rounded-xl shadow-lg bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800 z-50 origin-top-right overflow-hidden"
                      >
                        <div className="py-1">
                          {[...moreNav, ...userNav].map((item) => {
                            const active = location.pathname.startsWith(item.href);
                            return (
                              <Link
                                key={item.name}
                                to={item.href}
                                onClick={() => setIsMoreMenuOpen(false)}
                                className={`flex items-center px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:bg-slate-50 dark:focus-visible:bg-slate-800 ${
                                  active
                                    ? 'bg-slate-50 dark:bg-slate-800/50 text-indigo-600 dark:text-indigo-400'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                                }`}
                                aria-current={active ? 'page' : undefined}
                              >
                                <item.icon className={`w-4 h-4 mr-3 ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                                {item.name}
                              </Link>
                            );
                          })}
                          {user && (
                            <>
                              <div className="h-px bg-slate-100 dark:bg-slate-800 my-1 mx-2"></div>
                              <button 
                                onClick={() => {
                                  setIsMoreMenuOpen(false);
                                  handleSignOut();
                                }}
                                className="w-full text-left flex items-center px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white transition-colors focus:outline-none focus-visible:bg-slate-50 dark:focus-visible:bg-slate-800"
                              >
                                <LogOut className="w-4 h-4 mr-3 text-slate-400" />
                                Sign Out
                              </button>
                            </>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </nav>
            </div>
            <div className="hidden lg:flex lg:items-center lg:space-x-3">
              <button
                onClick={toggleDarkMode}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              
              {!user && (
                <>
                  <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1"></div>
                  <Link 
                    to="/auth"
                    className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    Log In
                  </Link>
                  <Tooltip content="Create your first AI-powered resume">
                    <Link 
                      to="/resume-builder"
                      className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-full hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                      Get Started
                    </Link>
                  </Tooltip>
                </>
              )}
            </div>
            <div className="-mr-2 flex items-center lg:hidden space-x-2">
              <button
                onClick={toggleDarkMode}
                className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 transition-colors"
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-menu"
                aria-label="Toggle mobile menu"
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              id="mobile-menu"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed inset-0 z-40 pt-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-lg overflow-y-auto"
            >
              <div className="pt-2 pb-4 px-4 space-y-1">
                <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Menu
                </div>
                {allNavItems.map((item) => {
                  const isActive = location.pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`${
                        isActive
                          ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                      } block px-4 py-3 rounded-xl text-base font-medium flex items-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
                      {item.name}
                    </Link>
                  );
                })}
                
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  {user ? (
                    <button
                      onClick={() => {
                        handleSignOut();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full text-left text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white block px-4 py-3 rounded-xl text-base font-medium flex items-center transition-colors"
                    >
                      <LogOut className="w-5 h-5 mr-3 text-slate-400 dark:text-slate-500" />
                      Sign Out
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <Link
                        to="/auth"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="w-full text-left text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white block px-4 py-3 rounded-xl text-base font-medium flex items-center transition-colors"
                      >
                        <LogIn className="w-5 h-5 mr-3 text-slate-400 dark:text-slate-500" />
                        Log In
                      </Link>
                      <Link
                        to="/resume-builder"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="w-full text-center text-white bg-indigo-600 hover:bg-indigo-700 block px-4 py-3 rounded-xl text-base font-medium transition-colors shadow-sm"
                      >
                        Get Started
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1 flex flex-col pt-20">
        <Outlet />
      </main>
      <Footer />
      <CookieConsent />
      <YewoChatbot />

      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-50 p-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 dark:focus:ring-white"
            aria-label="Back to top"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
