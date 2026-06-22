import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FileText, FileSignature, BarChart, Zap, Star, ShieldCheck, Award, Sparkles, MessageSquare, Quote, Check, Users } from 'lucide-react';
import { motion } from 'motion/react';
import Tooltip from '../components/Tooltip';
import { trackEvent } from '../lib/analytics';
import SEO from '../components/SEO';

function SafeAvatar({ src, alt, fallbackText, className }: { src: string; alt: string; fallbackText: string; className?: string }) {
  const [error, setError] = useState(false);

  if (error || !src) {
    if (fallbackText === "AW") {
      return (
        <div className={`overflow-hidden rounded-full ${className}`}>
          <svg className="w-full h-full bg-slate-100 dark:bg-slate-800" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="50" fill="#E2E8F0" />
            <path d="M20 90 C 25 70, 75 70, 80 90" fill="#1E293B" />
            <path d="M42 70 L50 82 L58 70 Z" fill="#F8FAFC" />
            <path d="M46 72 L50 82 L54 72 Z" fill="#6366F1" />
            <circle cx="50" cy="45" r="18" fill="#FDBA74" />
            <path d="M32 40 C32 25, 68 25, 68 40 C68 30, 32 30, 32 40" fill="#334155" />
            <path d="M32 40 C35 34, 45 32, 50 35 C55 32, 65 34, 68 40 C62 38, 38 38, 32 40" fill="#334155" />
            <rect x="38" y="42" width="10" height="6" rx="2" stroke="#1E293B" strokeWidth="2" fill="none" />
            <rect x="52" y="42" width="10" height="6" rx="2" stroke="#1E293B" strokeWidth="2" fill="none" />
            <line x1="48" y1="45" x2="52" y2="45" stroke="#1E293B" strokeWidth="2" />
            <line x1="33" y1="44" x2="38" y2="44" stroke="#1E293B" strokeWidth="1.5" />
            <line x1="62" y1="44" x2="67" y2="44" stroke="#1E293B" strokeWidth="1.5" />
          </svg>
        </div>
      );
    }

    if (fallbackText === "JD") {
      return (
        <div className={`overflow-hidden rounded-full ${className}`}>
          <svg className="w-full h-full bg-slate-100 dark:bg-slate-800" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="50" fill="#EEF2F6" />
            <path d="M22 90 C25 72, 75 72, 78 90" fill="#4F46E5" />
            <circle cx="50" cy="46" r="16" fill="#FED7AA" />
            <circle cx="50" cy="24" r="9" fill="#1E293B" />
            <path d="M34 44 C34 32, 66 32, 66 44 C66 40, 34 40, 34 44" fill="#1E293B" />
            <path d="M34 43 C38 35, 62 35, 66 43" fill="#1E293B" />
            <circle cx="32" cy="46" r="2.5" fill="#F59E0B" />
            <circle cx="68" cy="46" r="2.5" fill="#F59E0B" />
          </svg>
        </div>
      );
    }

    if (fallbackText === "AS") {
      return (
        <div className={`overflow-hidden rounded-full ${className}`}>
          <svg className="w-full h-full bg-slate-100 dark:bg-slate-800" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="50" fill="#E0F2FE" />
            <path d="M20 90 C25 72, 75 72, 80 90" fill="#0D9488" />
            <circle cx="50" cy="46" r="17" fill="#FDBA74" />
            <path d="M33 38 C33 26, 67 26, 67 38 C67 32, 33 32, 33 38" fill="#475569" />
            <path d="M31 36 Q50 20 69 36" fill="#475569" />
          </svg>
        </div>
      );
    }

    if (fallbackText === "MK") {
      return (
        <div className={`overflow-hidden rounded-full ${className}`}>
          <svg className="w-full h-full bg-slate-100 dark:bg-slate-800" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="50" fill="#FEF3C7" />
            <path d="M22 90 C25 72, 75 72, 78 90" fill="#DB2777" />
            <path d="M30 45 C30 25, 70 25, 70 45 C70 65, 30 65, 30 45" fill="#78350F" />
            <circle cx="50" cy="44" r="16" fill="#FFDDA6" />
            <path d="M34 38 C34 26, 66 26, 66 38" stroke="#78350F" strokeWidth="6" strokeLinecap="round" fill="none" />
            <path d="M32 40 L35 55" stroke="#78350F" strokeWidth="6" strokeLinecap="round" />
            <path d="M68 40 L65 55" stroke="#78350F" strokeWidth="6" strokeLinecap="round" />
          </svg>
        </div>
      );
    }

    if (fallbackText === "TL") {
      return (
        <div className={`overflow-hidden rounded-full ${className}`}>
          <svg className="w-full h-full bg-slate-100 dark:bg-slate-800" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="50" fill="#FEE2E2" />
            <path d="M20 90 C25 72, 75 72, 80 90" fill="#DC2626" />
            <circle cx="50" cy="45" r="17" fill="#FDBA74" />
            <circle cx="50" cy="27" r="10" fill="#1E293B" />
            <circle cx="42" cy="29" r="8" fill="#1E293B" />
            <circle cx="58" cy="29" r="8" fill="#1E293B" />
            <path d="M37 50 C37 60, 63 60, 63 50" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" fill="none" />
          </svg>
        </div>
      );
    }

    // Default general dynamic gradient fallback
    const hashString = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      return Math.abs(hash);
    };

    const gradients = [
      'from-indigo-500 to-purple-600',
      'from-emerald-400 to-teal-600',
      'from-amber-400 to-orange-500',
      'from-pink-500 to-rose-600',
      'from-blue-500 to-indigo-600',
      'from-fuchsia-500 to-purple-700',
    ];

    const gradient = gradients[hashString(fallbackText) % gradients.length];
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br ${gradient} text-white font-bold select-none text-center shadow-inner ${className}`}>
        {fallbackText}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => {
        console.warn(`Failed to load image: ${src}. Falling back to initials: ${fallbackText}`);
        setError(true);
      }}
      referrerPolicy="no-referrer"
    />
  );
}

export default function LandingPage() {
  return (
    <div className="flex flex-col flex-1 bg-[#FDFCFB] dark:bg-slate-950 transition-colors duration-500">
      <SEO 
        title="CareerCraft - AI Resume & Cover Letter Builder"
        description="Elevate your professional narrative with AI-driven precision. Build ATS-optimized resumes and cover letters."
        schemaMarkup={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "CareerCraft",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "All",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "PGK"
          }
        }}
      />
      {/* Hero Section - Split Layout */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden border-b border-slate-200 dark:border-slate-800">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-slate-50 dark:bg-slate-900/50 hidden lg:block" />
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-500/5 blur-[120px] rounded-full" />
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-emerald-500/5 blur-[120px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full py-20 lg:py-0">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm mb-8">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 dark:text-slate-400">The Gold Standard in AI Careers</span>
              </div>
              
              <h1 className="font-serif text-6xl md:text-8xl text-slate-900 dark:text-white leading-[0.9] tracking-tight mb-8">
                Crafting <span className="italic text-indigo-600 dark:text-indigo-400">Excellence</span> <br />
                for Your Career.
              </h1>
              
              <p className="text-xl text-slate-600 dark:text-slate-400 mb-10 leading-relaxed max-w-xl font-medium">
                Elevate your professional narrative with AI-driven precision. We transform your experience into a compelling story that commands attention from world-class recruiters.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                <Tooltip content="Create your first AI-powered resume" position="bottom">
                  <Link
                    to="/resume-builder"
                    onClick={() => trackEvent('click_cta_hero')}
                    className="group relative px-10 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-bold text-lg overflow-hidden transition-all hover:pr-12"
                  >
                    <span className="relative z-10">Start Building Now</span>
                    <ArrowRight className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 opacity-0 group-hover:opacity-100 transition-all" />
                  </Link>
                </Tooltip>
                
                <div className="flex flex-col items-start">
                  <div className="flex -space-x-3 mb-2">
                    {['JD', 'AS', 'MK', 'TL'].map((initials, idx) => (
                      <SafeAvatar 
                        key={idx}
                        src={`https://picsum.photos/seed/user${idx + 1}/100/100`} 
                        alt="User" 
                        fallbackText={initials}
                        className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-900 object-cover shadow-sm text-[10px]"
                      />
                    ))}
                    <div className="w-10 h-10 rounded-full bg-indigo-600 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                      +2k
                    </div>
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-slate-900 dark:text-white">Trusted by 2,000+</p>
                    <p className="text-slate-500">Professionals globally</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="relative z-10 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[3rem] shadow-2xl border border-slate-200 dark:border-slate-800">
                {/* Mock Resume UI */}
                <div className="aspect-[3/4] bg-white dark:bg-slate-950 rounded-2xl p-6 sm:p-8 font-sans border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col">
                  {/* Header */}
                  <div className="flex items-center gap-5 mb-6 border-b border-slate-100 dark:border-slate-800 pb-6">
                    <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden shrink-0 border-2 border-white dark:border-slate-900 shadow-sm flex items-center justify-center">
                      <SafeAvatar 
                        src="https://picsum.photos/seed/alexander/200/200" 
                        alt="Profile" 
                        fallbackText="AW"
                        className="w-full h-full object-cover text-sm" 
                      />
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2">Alexander Wright</h3>
                      <p className="text-[10px] sm:text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Senior Product Designer</p>
                      <div className="flex items-center gap-3 mt-2 text-[8px] sm:text-[9px] text-slate-500 dark:text-slate-400 font-medium">
                        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">📍</span> San Francisco, CA</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">✉️</span> alexander.wright@design.com</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-6 flex-1">
                    {/* Left Column - Main Content */}
                    <div className="flex-1">
                      <div className="mb-5">
                        <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                          Experience
                        </h4>
                        <div className="mb-4 relative pl-3 border-l-2 border-slate-100 dark:border-slate-800">
                          <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-white dark:bg-slate-950 border-2 border-indigo-600"></div>
                          <div className="flex justify-between items-baseline mb-1">
                            <span className="text-[11px] font-bold text-slate-900 dark:text-white">Lead Designer</span>
                            <span className="text-[8px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded">2021 - Present</span>
                          </div>
                          <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400 block mb-2">TechVision Inc.</span>
                          <ul className="text-[8px] sm:text-[9px] text-slate-600 dark:text-slate-300 space-y-1.5 list-none">
                            <li className="relative pl-2 before:content-[''] before:absolute before:left-0 before:top-1.5 before:w-1 before:h-1 before:bg-slate-300 dark:before:bg-slate-600 before:rounded-full">Spearheaded the redesign of the core SaaS platform, increasing user retention by 40%.</li>
                            <li className="relative pl-2 before:content-[''] before:absolute before:left-0 before:top-1.5 before:w-1 before:h-1 before:bg-slate-300 dark:before:bg-slate-600 before:rounded-full">Managed a team of 5 product designers across 3 timezones.</li>
                          </ul>
                        </div>
                        <div className="relative pl-3 border-l-2 border-slate-100 dark:border-slate-800">
                          <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                          <div className="flex justify-between items-baseline mb-1">
                            <span className="text-[11px] font-bold text-slate-900 dark:text-white">UI/UX Designer</span>
                            <span className="text-[8px] font-medium text-slate-400">2018 - 2021</span>
                          </div>
                          <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400 block mb-2">Creative Solutions</span>
                          <ul className="text-[8px] sm:text-[9px] text-slate-600 dark:text-slate-300 space-y-1.5 list-none">
                            <li className="relative pl-2 before:content-[''] before:absolute before:left-0 before:top-1.5 before:w-1 before:h-1 before:bg-slate-300 dark:before:bg-slate-600 before:rounded-full">Developed comprehensive design systems used by over 50 engineers.</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Sidebar */}
                    <div className="w-1/3">
                      <div className="mb-5">
                        <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Skills
                        </h4>
                        <div className="space-y-2.5">
                          {[
                            { name: 'Product Design', level: 95 },
                            { name: 'UI/UX', level: 90 },
                            { name: 'Figma', level: 98 },
                            { name: 'User Research', level: 85 }
                          ].map(skill => (
                            <div key={skill.name}>
                              <div className="flex justify-between text-[8px] mb-1">
                                <span className="font-bold text-slate-700 dark:text-slate-300">{skill.name}</span>
                              </div>
                              <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-slate-800 dark:bg-slate-200 rounded-full" style={{ width: `${skill.level}%` }}></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          Education
                        </h4>
                        <div>
                          <p className="text-[9px] font-bold text-slate-900 dark:text-white leading-tight">B.S. Interaction Design</p>
                          <p className="text-[8px] text-slate-500 mt-0.5">Stanford University</p>
                          <p className="text-[8px] text-slate-400 font-medium mt-0.5">2014 - 2018</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Fade out bottom */}
                  <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white dark:from-slate-950 to-transparent pointer-events-none" />
                </div>
                
                {/* Floating Stats */}
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute -top-4 -right-4 sm:-top-8 sm:-right-8 bg-emerald-600 text-white p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl border-4 border-white dark:border-slate-900 z-20"
                >
                  <ShieldCheck className="w-6 h-6 sm:w-8 sm:h-8 mb-1 sm:mb-2" />
                  <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest opacity-80">ATS Verified</p>
                  <p className="text-xl sm:text-3xl font-black">99%</p>
                </motion.div>

                <motion.div 
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 5, repeat: Infinity }}
                  className="absolute -bottom-4 -left-4 sm:-bottom-8 sm:-left-8 bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-700 z-20"
                >
                  <Award className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500 mb-1 sm:mb-2" />
                  <p className="text-[8px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest">Top Rated</p>
                  <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">Editor's Choice</p>
                </motion.div>
              </div>
              
              {/* Decorative Elements */}
              <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border border-slate-200 dark:border-slate-800 rounded-full opacity-50" />
              <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] border border-slate-100 dark:border-slate-900 rounded-full opacity-30" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-28 bg-white dark:bg-slate-1000 border-b border-slate-100 dark:border-slate-900/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-16">
            <div className="max-w-md text-center lg:text-left">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-650 dark:text-indigo-400 mb-3 block">Global Placement</span>
              <h2 className="font-serif text-4xl sm:text-5xl text-slate-900 dark:text-white leading-tight">
                Empowering leaders at the world's <span className="italic text-indigo-650 dark:text-indigo-400">most ambitious</span> companies.
              </h2>
              <p className="mt-4 text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                Our templates and content frameworks are optimized according to the hiring guidelines of tier-one technology, consulting, and finance institutes.
              </p>
            </div>
            
            <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-8 lg:max-w-2xl">
              {[
                { name: 'Google', color: 'hover:text-amber-500 hover:border-amber-500/30' },
                { name: 'Goldman Sachs', color: 'hover:text-blue-500 hover:border-blue-500/30' },
                { name: 'McKinsey', color: 'hover:text-indigo-500 hover:border-indigo-500/30' },
                { name: 'Tesla', color: 'hover:text-red-500 hover:border-red-500/30' },
                { name: 'Airbnb', color: 'hover:text-rose-500 hover:border-rose-500/30' },
              ].map(brand => (
                <div 
                  key={brand.name} 
                  className={`px-6 py-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-base sm:text-lg font-black tracking-tight select-none transition-all duration-300 hover:shadow-sm hover:scale-105 ${brand.color}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 transition-colors group-hover:bg-indigo-505" />
                    {brand.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Feature Bento Grid */}
      <section className="py-40 bg-slate-50 dark:bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600 dark:text-indigo-400 mb-6 block">The Ecosystem</span>
            <h2 className="font-serif text-6xl text-slate-900 dark:text-white mb-8">Built for Modern Careers</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-xl leading-relaxed">
              A suite of intelligent tools designed to navigate the complexities of the modern job market with ease and sophistication.
            </p>
          </div>

          <div className="grid md:grid-cols-12 gap-8">
            <motion.div 
              whileHover={{ y: -8 }}
              className="md:col-span-8 bg-white dark:bg-slate-900 rounded-[3rem] p-12 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative group transition-all"
            >
              <div className="relative z-10">
                <div className="w-14 h-14 bg-indigo-600 rounded-[1.25rem] flex items-center justify-center text-white mb-10 shadow-xl shadow-indigo-200 dark:shadow-none">
                  <FileText className="w-7 h-7" />
                </div>
                <h3 className="font-serif text-4xl text-slate-900 dark:text-white mb-6">Intelligent Resume Architect</h3>
                <p className="text-slate-500 dark:text-slate-400 text-lg max-w-md mb-10 leading-relaxed">
                  Our core engine analyzes your career trajectory and reconstructs it using high-impact terminology favored by executive recruiters.
                </p>
                <Link to="/resume-builder" onClick={() => trackEvent('click_cta_feature')} className="inline-flex items-center gap-3 font-black text-indigo-600 dark:text-indigo-400 group-hover:gap-6 transition-all uppercase tracking-widest text-xs">
                  Explore the Builder <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
              <div className="absolute bottom-0 right-0 w-1/2 h-full bg-slate-50 dark:bg-slate-800/50 -mb-24 -mr-24 rounded-tl-[4rem] border-t border-l border-slate-200 dark:border-slate-700 p-12 hidden lg:block">
                <div className="space-y-6">
                  <div className="h-5 w-full bg-slate-200 dark:bg-slate-700 rounded-full" />
                  <div className="h-5 w-5/6 bg-slate-200 dark:bg-slate-700 rounded-full" />
                  <div className="h-5 w-full bg-slate-200 dark:bg-slate-700 rounded-full" />
                  <div className="h-5 w-4/6 bg-slate-200 dark:bg-slate-700 rounded-full" />
                </div>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ y: -8 }}
              className="md:col-span-4 bg-slate-900 dark:bg-indigo-600 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden transition-all"
            >
              <div className="relative z-10">
                <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-[1.25rem] flex items-center justify-center mb-10">
                  <Zap className="w-7 h-7" />
                </div>
                <h3 className="font-serif text-4xl mb-6">ATS Optimization</h3>
                <p className="text-white/70 text-lg mb-10 leading-relaxed">
                  Pass through the digital gatekeepers with 100% compatibility across all major platforms.
                </p>
                <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden mb-4">
                  <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: '98%' }}
                    transition={{ duration: 1.5 }}
                    className="h-full bg-white"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Compatibility Score</p>
                  <p className="text-xl font-black">98%</p>
                </div>
              </div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 blur-3xl rounded-full" />
            </motion.div>

            <motion.div 
              whileHover={{ y: -8 }}
              className="md:col-span-4 bg-white dark:bg-slate-900 rounded-[3rem] p-12 border border-slate-200 dark:border-slate-800 shadow-sm transition-all"
            >
              <div className="w-14 h-14 bg-emerald-500 rounded-[1.25rem] flex items-center justify-center text-white mb-10 shadow-xl shadow-emerald-200 dark:shadow-none">
                <FileSignature className="w-7 h-7" />
              </div>
              <h3 className="font-serif text-3xl text-slate-900 dark:text-white mb-6">Cover Letter Suite</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                Persuasive, personalized narratives that bridge the gap between your resume and the job requirements.
              </p>
              <Link to="/cover-letter" className="inline-flex items-center gap-2 font-black text-emerald-600 uppercase tracking-widest text-xs">
                Get Started <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            <motion.div 
              whileHover={{ y: -8 }}
              className="md:col-span-8 bg-white dark:bg-slate-900 rounded-[3rem] p-12 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-12 items-center transition-all"
            >
              <div className="flex-1">
                <div className="w-14 h-14 bg-purple-600 rounded-[1.25rem] flex items-center justify-center text-white mb-10 shadow-xl shadow-purple-200 dark:shadow-none">
                  <BarChart className="w-7 h-7" />
                </div>
                <h3 className="font-serif text-3xl text-slate-900 dark:text-white mb-6">Real-time Analysis</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
                  Instant feedback on your resume's strength, clarity, and impact. No more guessing if your resume is "good enough".
                </p>
                <Link to="/analyzer" className="inline-flex items-center gap-2 font-black text-purple-600 uppercase tracking-widest text-xs">
                  Analyze Now <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="flex-1 w-full bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-700">
                <div className="flex items-end gap-3 h-40">
                  {[40, 70, 45, 90, 65, 85, 95].map((h, i) => (
                    <motion.div 
                      key={i}
                      initial={{ height: 0 }}
                      whileInView={{ height: `${h}%` }}
                      transition={{ delay: i * 0.1, duration: 0.8 }}
                      className="flex-1 bg-indigo-600 rounded-t-xl shadow-lg shadow-indigo-200 dark:shadow-none"
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials & Career Success Stories */}
      <section className="py-40 bg-white dark:bg-slate-950 relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute top-1/2 left-0 w-80 h-80 bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/5 blur-[125px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-24">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-650 dark:text-indigo-400 mb-6 block">Proof of Impact</span>
            <h2 className="font-serif text-5xl sm:text-6xl text-slate-900 dark:text-white mb-8">Stories of Transformation</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-lg sm:text-xl leading-relaxed">
              Read how ambitious professionals leverage CareerCraft to craft standout portfolios, optimize ATS performance, and secure world-class positions.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Jenkins",
                role: "Senior Software Engineer at Netflix",
                quote: "The ATS Optimizer raised my matching score from 65% to 94% using the Tech Slate template. Got the first callback within 48 hours and an eventual offer!",
                metric: "+35% Comp Increase",
                rating: 5,
                seed: "sarah"
              },
              {
                name: "Marcus Vance",
                role: "Financial Analyst at J.P. Morgan",
                quote: "The AI analyzer highlighted critical wording gaps in my transactions summary. It helped translate heavy asset metrics into executive-ready bullet lists.",
                metric: "ATS Match: Custom 97%",
                rating: 5,
                seed: "marcus"
              },
              {
                name: "Lina Rodriguez",
                role: "Senior Product Marketing Manager at Stripe",
                quote: "CareerCraft helped me tell a cohesive campaign growth story instead of just listing boring responsibilities. It guided my formatting with pristine grace.",
                metric: "Hired in 18 Days",
                rating: 5,
                seed: "lina"
              },
              {
                name: "Dr. Devon Patel",
                role: "Biomedical Director at Pfizer",
                quote: "Tailoring a deeply technical research background to modern, readable layouts is exceptionally tough. The intelligent suggestions and templates made it seamless.",
                metric: "Executive Placement",
                rating: 5,
                seed: "devon"
              },
              {
                name: "Elena Rostova",
                role: "Operations Director at Uber",
                quote: "Crafting a clean, Swiss-minimalist narrative was wonderful. The tool rejects typical AI jargon and optimizes for objective, business impact elements.",
                metric: "Promoted to Director",
                rating: 5,
                seed: "elena"
              },
              {
                name: "Kenji Tanaka",
                role: "Lead UX Designer at Nintendo",
                quote: "The cover letter generator syncs with the resume context beautifully. It saved me hours of duplicate writing and targeted the design team's core values.",
                metric: "100% Custom Tailored",
                rating: 5,
                seed: "kenji"
              }
            ].map((story, i) => (
              <motion.div
                key={story.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                whileHover={{ y: -6 }}
                className="group flex flex-col justify-between p-8 rounded-[2.5rem] bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 hover:bg-white dark:hover:bg-slate-900 hover:shadow-xl hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-300"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex gap-1 text-amber-500">
                      {Array.from({ length: story.rating }).map((_, rIdx) => (
                        <Star key={rIdx} className="w-4 h-4 fill-amber-500 text-amber-500" />
                      ))}
                    </div>
                    <span className="px-3.5 py-1 text-[10px] font-bold text-indigo-650 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-400 rounded-full tracking-wider uppercase">
                      {story.metric}
                    </span>
                  </div>

                  <div className="relative mb-6">
                    <Quote className="w-10 h-10 text-indigo-500/10 absolute -left-4 -top-4 pointer-events-none" />
                    <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed relative z-10 italic">
                      "{story.quote}"
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/60">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border-2 border-white dark:border-slate-900 shadow-sm flex items-center justify-center">
                    <SafeAvatar 
                      src={`https://picsum.photos/seed/${story.seed}/100/100`} 
                      alt={story.name} 
                      fallbackText={story.name.split(' ').map(n => n[0]).join('')}
                      className="w-full h-full object-cover text-xs" 
                    />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-slate-900 dark:text-white text-base leading-snug">
                      {story.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {story.role}
                    </p>
                  </div>
                  <div className="ml-auto flex items-center justify-center w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
                    <Check className="w-3 h-3" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Social Proof High Impact Stats Summary */}
          <div className="mt-20 p-8 sm:p-12 rounded-[3rem] bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-slate-800/80 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[500px] h-full bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
            
            <div className="grid sm:grid-cols-3 gap-8 sm:gap-12 relative z-10 text-center">
              <div>
                <p className="text-[10px] font-black tracking-[0.3em] uppercase text-indigo-400 mb-2">CAREER PROGRESSION</p>
                <h3 className="font-serif text-5xl md:text-6xl font-bold mb-2">93.4%</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-normal font-medium">Of users report increased response and interview call rates within 14 days.</p>
              </div>
              <div className="border-t sm:border-t-0 sm:border-l sm:border-r border-white/10 pt-8 sm:pt-0 sm:px-6">
                <p className="text-[10px] font-black tracking-[0.3em] uppercase text-indigo-400 mb-2">AVERAGE SALARY GAIN</p>
                <h3 className="font-serif text-5xl md:text-6xl font-bold mb-2">+32%</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-normal font-medium">Mean compensation increase reported by verified professional tier subscribers.</p>
              </div>
              <div className="border-t sm:border-t-0 pt-8 sm:pt-0">
                <p className="text-[10px] font-black tracking-[0.3em] uppercase text-indigo-400 mb-2">RESUMES GENERATED</p>
                <h3 className="font-serif text-5xl md:text-6xl font-bold mb-2">25k+</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-normal font-medium">Successfully processed documents matching contemporary ATS tracking protocols perfectly.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Branded Yewo AI Chatbot Spotlight Section */}
      <section className="py-32 bg-slate-950 text-white relative overflow-hidden" id="yewo-spotlight-section">
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-teal-500/10 blur-[130px] rounded-full" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 blur-[130px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="grid lg:grid-cols-12 gap-16 items-center">
            
            {/* Left Box: Info Spotlight */}
            <div className="lg:col-span-6 space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 shadow-sm">
                <Sparkles className="w-4 h-4 text-teal-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-teal-300">MEET YOUR DEDICATED CO-PILOT</span>
              </div>
              
              <h2 className="font-serif text-5xl md:text-7xl leading-tight text-white">
                Say Hello to <span className="italic text-teal-400">Yewo AI</span>.
              </h2>
              
              <p className="text-lg text-slate-300 leading-relaxed font-normal">
                Yewo isn't just a generic digital companion. Specifically trained on modern professional standards, recruiter keywords, and premium ATS frameworks, Yewo is integrated directly into your CareerCraft workspace.
              </p>

              {/* Unique Capabilities */}
              <div className="space-y-4">
                {[
                  { title: "Direct Activation Concierge", desc: "Instantly guides you through setting up BSP Direct Deposits & Wantok Wallet premium access." },
                  { title: "Surgical Resume Writing Hints", desc: "Suggests active, metric-focused phrasing alignment for our modern templates." },
                  { title: "Smart Cover Letter Tailoring", desc: "Generates custom opening pitches matched to specific job qualifications instantly." }
                ].map((cap, i) => (
                  <div key={i} className="flex gap-4 items-start bg-white/5 p-5 rounded-2xl border border-white/10">
                    <span className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 font-serif flex items-center justify-center font-bold shrink-0">{i+1}</span>
                    <div>
                      <h4 className="font-bold text-sm text-white mb-1">{cap.title}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">{cap.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Box: Chat Sandbox Demonstration Preview & Testimonials */}
            <div className="lg:col-span-6 space-y-8">
              <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-5 mb-6">
                  <div className="w-3.5 h-3.5 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 select-none shrink-0">
                    <MessageSquare className="w-2 h-2 text-teal-400" />
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">Interactive Career Expert</span>
                  <div className="flex gap-1.5 ml-auto">
                    <div className="w-2 h-2 bg-slate-700 rounded-full" />
                    <div className="w-2 h-2 bg-slate-700 rounded-full" />
                  </div>
                </div>

                <div className="space-y-4 font-sans text-xs">
                  {/* Message 1 */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-850 flex items-center justify-center font-bold text-[10px] text-slate-300 shrink-0 select-none border border-slate-850">U</div>
                    <div className="bg-slate-800/80 text-slate-300 p-3.5 rounded-2xl rounded-tl-none border border-slate-750/30">
                      "Help me tailor my resume for a logistics officer supervisor job."
                    </div>
                  </div>

                  {/* Message 2 */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-400 to-indigo-500 text-slate-950 flex items-center justify-center font-black text-[10px] shrink-0 select-none">Y</div>
                    <div className="bg-slate-950 text-slate-200 p-3.5 rounded-2xl rounded-tl-none border border-slate-800/70 flex flex-col gap-2">
                      <p className="font-semibold text-teal-300">Excellent! Let's update your resume summary block to add high-impact fleet management metrics:</p>
                      <ul className="list-disc pl-4 space-y-1 block font-mono text-[10.5px] text-slate-400">
                        <li>Supervised transport routing profiles for 40+ container freights.</li>
                        <li>Reduced processing friction by 18% using custom scheduling trackers.</li>
                      </ul>
                      <p className="text-[10px] text-slate-500 mt-1">Ready to sync these items onto your Professional template?</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Custom Reviews and Public perception */}
              <div className="space-y-6">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-teal-400">SUCCESS CONVERSATIONS WITH YEWO</p>
                <div className="grid sm:grid-cols-2 gap-6">
                  {[
                    { quote: "Yewo walked me through BSP Mobile Direct Deposit layout & restructured my bio. Absolutely amazing experience.", name: "Gideon Kua", role: "Logistics Officer" },
                    { quote: "The Professional template suggested by Yewo instantly parsed in regional job systems. Highly recommend!", name: "Esther Sione", role: "Graduate Trainee" }
                  ].map((t, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/10 p-6 rounded-2xl relative">
                      <div className="flex gap-1 mb-3 text-amber-500">
                        {[1, 2, 3, 4, 5].map(star => <Star key={star} className="w-3 h-3 fill-amber-500" />)}
                      </div>
                      <p className="text-xs text-slate-300 italic leading-relaxed mb-4">"{t.quote}"</p>
                      <div>
                        <p className="font-bold text-xs text-white leading-none mb-1">{t.name}</p>
                        <p className="text-[10px] text-slate-500 font-medium">{t.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>


      {/* Final CTA */}
      <section className="py-48 bg-white dark:bg-slate-950 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent" />
        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          <h2 className="font-serif text-7xl md:text-9xl text-slate-900 dark:text-white mb-12 leading-[0.85] tracking-tighter">
            The next chapter of your <span className="italic text-indigo-600 dark:text-indigo-400">professional story</span> begins here.
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
            <Tooltip content="Start crafting your resume" position="top">
              <Link
                to="/resume-builder"
                onClick={() => trackEvent('click_cta_footer')}
                className="w-full sm:w-auto px-16 py-8 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-black text-xl shadow-2xl hover:scale-105 transition-all uppercase tracking-widest"
              >
                Build Your Future
              </Link>
            </Tooltip>
            <Link
              to="/pricing"
              className="w-full sm:w-auto px-16 py-8 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-full font-black text-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all uppercase tracking-widest"
            >
              View Plans
            </Link>
          </div>
          <p className="mt-16 text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Join 25,000+ professionals who landed their dream roles.</p>
        </div>
        
        {/* Background Accents */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-gradient-to-t from-indigo-500/5 to-transparent pointer-events-none" />
      </section>
    </div>
  );
}
