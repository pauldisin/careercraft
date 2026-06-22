import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Printer, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  Settings, 
  Ruler, 
  CheckSquare, 
  Square, 
  HelpCircle, 
  Sparkles, 
  Maximize, 
  SlidersHorizontal,
  ThumbsUp,
  FileWarning
} from 'lucide-react';
import { ResumeData } from '../types';

interface PrinterGuidelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ResumeData;
  pdfFontScale: number;
  showA4Guides: boolean;
  showPageNumbers: boolean;
  isOverOnePage: boolean;
  onToggleA4Guides: () => void;
  onTogglePageNumbers: () => void;
  onOptimizeFontScale: () => void;
}

interface GuidelineItem {
  id: string;
  category: 'browser' | 'layout' | 'design';
  title: string;
  description: string;
  tip: string;
}

const CONSTANT_GUIDELINES: GuidelineItem[] = [
  {
    id: 'background-graphics',
    category: 'browser',
    title: 'Enable "Background Graphics"',
    description: 'Ensure color blocks, horizontal separators, accent headers, and custom timeline icons render accurately.',
    tip: 'In the browser Print Settings dialog, open "More settings" and check the "Background graphics" box.'
  },
  {
    id: 'disable-headers',
    category: 'browser',
    title: 'Disable Browser Headers & Footers',
    description: 'Avoid default browser text like current date, page URL, and document title appearing on the edges.',
    tip: 'Uncheck "Headers and footers" in the browser Print dialogue options panel.'
  },
  {
    id: 'scaling-none',
    category: 'browser',
    title: 'Set Print Scale to "Default" or 100%',
    description: 'Prevent the operating system from double-scaling the pre-computed grid offsets of your resume canvas.',
    tip: 'Ensure Scale says "Default" or "100%" (do not choose "Fit to printable area" if margins get cropped).'
  },
  {
    id: 'margins-none',
    category: 'browser',
    title: 'Set Print Margins to "None" or "Minimum"',
    description: 'Our template renders precise safety margins natively. Adding custom browser margins will shrink your page.',
    tip: 'Set "Margins" dropdown in browser printer utility settings directly to "None" or "Minimum".'
  },
  {
    id: 'paper-size-a4',
    category: 'layout',
    title: 'Verify Paper Size (A4 vs Letter)',
    description: 'Matches the page grid structure configured on the editor view.',
    tip: 'Double-check if the recipient region prefers the corporate A4 format or absolute US Letter format in paper selections.'
  },
  {
    id: 'font-scale',
    category: 'design',
    title: 'Keep body text above 9.5pt',
    description: 'Ensures immediate legibility for hiring executives during physical paper assessments.',
    tip: 'Use our global Font Scale slider to adjust. Keep the value between 85% and 115%.'
  }
];

export default function PrinterGuidelinesModal({
  isOpen,
  onClose,
  data,
  pdfFontScale,
  showA4Guides,
  showPageNumbers,
  isOverOnePage,
  onToggleA4Guides,
  onTogglePageNumbers,
  onOptimizeFontScale
}: PrinterGuidelinesModalProps) {
  const [visitedItems, setVisitedItems] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'all' | 'browser' | 'layout' | 'design'>('all');
  const [diagnostics, setDiagnostics] = useState<{
    score: number;
    warningsCount: number;
    checks: Array<{
      id: string;
      title: string;
      status: 'pass' | 'warning' | 'fail';
      message: string;
      actionLabel?: string;
      onAction?: () => void;
    }>;
  }>({ score: 100, warningsCount: 0, checks: [] });

  // Run auto diagnostics based on active props
  useEffect(() => {
    const checks: typeof diagnostics.checks = [];
    let score = 100;
    let warningsCount = 0;

    // Check 1: Font scale bounds
    if (pdfFontScale < 0.85) {
      score -= 15;
      warningsCount++;
      checks.push({
        id: 'font-scale-low',
        title: 'Font Scale Too Small',
        status: 'warning',
        message: `Currently at ${Math.round(pdfFontScale * 100)}%. Text blocks below 85% can become hard to read when printed physically.`,
        actionLabel: 'Optimize Font Scale',
        onAction: onOptimizeFontScale
      });
    } else if (pdfFontScale > 1.15) {
      score -= 10;
      warningsCount++;
      checks.push({
        id: 'font-scale-high',
        title: 'Font Scale Large',
        status: 'warning',
        message: `Currently at ${Math.round(pdfFontScale * 100)}%. Large sizes consume excessive whitespace and might cause layout breakages.`,
        actionLabel: 'Optimize Font Scale',
        onAction: onOptimizeFontScale
      });
    } else {
      checks.push({
        id: 'font-scale-ok',
        title: 'Print-Safe Font Scale',
        status: 'pass',
        message: `Currently configured at ${Math.round(pdfFontScale * 100)}%, which falls securely inside the safe range.`
      });
    }

    // Check 2: Multi-page overflow issues
    if (isOverOnePage) {
      score -= 25;
      warningsCount++;
      checks.push({
        id: 'page-overflow',
        title: 'Page Boundary Alert',
        status: 'fail',
        message: 'Your resume content spills over onto a second page. This can look accidental. Enable A4 Guides to see the page splits.',
        actionLabel: !showA4Guides ? 'Enable A4 Guides' : undefined,
        onAction: !showA4Guides ? onToggleA4Guides : undefined
      });
    } else {
      checks.push({
        id: 'page-overflow-ok',
        title: 'Fits within Single Page',
        status: 'pass',
        message: 'Awesome! Your resume content fits perfectly on a single page, avoiding orphan headings.'
      });
    }

    // Check 3: Essential contact detail integrity
    const contact = data.personalInfo || { fullName: '', email: '', phone: '', location: '', jobTitle: '', linkedin: '' };
    const missingContact = [];
    if (!contact.email) missingContact.push('Email');
    if (!contact.phone) missingContact.push('Phone');
    if (!contact.location) missingContact.push('Location');

    if (missingContact.length > 0) {
      score -= Math.min(20, missingContact.length * 7);
      warningsCount++;
      checks.push({
        id: 'missing-contact',
        title: 'Primary Contact Missing',
        status: 'warning',
        message: `Your resume is missing active contact details: ${missingContact.join(', ')}. Hardcopy recipients won't find direct contact numbers.`
      });
    } else {
      checks.push({
        id: 'contact-ok',
        title: 'Complete Contact Fields',
        status: 'pass',
        message: 'All vital direct communication channels are documented and readily clickable.'
      });
    }

    // Check 4: Alignment rulers / helpful layout indicators
    if (!showA4Guides) {
      checks.push({
        id: 'guides-info',
        title: 'Visual Assistance Off',
        status: 'warning',
        message: 'The visual clipping helpers are hidden. Enable A4 Guides to preview physical page margins.',
        actionLabel: 'Enable Guides',
        onAction: onToggleA4Guides
      });
    } else {
      checks.push({
        id: 'guides-pass',
        title: 'Visual Guides Enabled',
        status: 'pass',
        message: 'A4 cropping indicators are currently rendering on screen to prevent unexpected document clipping.'
      });
    }

    setDiagnostics({
      score: Math.max(10, score),
      warningsCount,
      checks
    });
  }, [data, pdfFontScale, showA4Guides, isOverOnePage, onOptimizeFontScale, onToggleA4Guides]);

  const toggleItemVisited = (id: string) => {
    setVisitedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredGuidelines = CONSTANT_GUIDELINES.filter(
    item => activeTab === 'all' || item.category === activeTab
  );

  const completedCount = Object.values(visitedItems).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / CONSTANT_GUIDELINES.length) * 100);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6" id="printer-friendly-modal-container">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
          id="printer-friendly-backdrop"
        />

        {/* Modal Sheet */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl max-h-[85vh] sm:max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col"
          id="printer-friendly-modal-content"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-950 dark:text-white text-base">Printer-Friendly Guidelines</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Ensure perfect physical print and PDF exporting quality</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-405 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
              id="close-printer-guidelines-modal-btn"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Real-Time Diagnostic Dashboard */}
          <div className="bg-slate-100/50 dark:bg-slate-950/40 px-6 py-4 border-b border-slate-200/50 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-4 w-full md:w-auto">
              {/* Circular Mini Score Gauge */}
              <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="stroke-slate-200 dark:stroke-slate-800"
                    strokeWidth="3.5"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={`stroke-indigo-600 dark:stroke-indigo-400`}
                    strokeWidth="3.5"
                    strokeDasharray={`${diagnostics.score}, 100`}
                    strokeLinecap="round"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-xs font-serif font-black text-slate-900 dark:text-white">
                  {diagnostics.score}%
                </span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-250 flex items-center gap-1.5">
                  Live Printer-Ready Index: 
                  <span className={`text-[10px] px-2 py-0.2 rounded-full font-extrabold tracking-wide uppercase ${
                    diagnostics.score >= 80 
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' 
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-95/30 dark:text-amber-400'
                  }`}>
                    {diagnostics.score >= 80 ? 'Highly Optimised' : 'Needs attention'}
                  </span>
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                  Dynamic assessment of your active typography scaling limits, page overflows, and margin guidelines.
                </p>
              </div>
            </div>

            {/* Print Action Shortcut buttons in Guidelines header */}
            <div className="flex gap-2 w-full md:w-auto shrink-0 justify-end">
              <button
                onClick={() => {
                  onClose();
                  setTimeout(() => {
                    window.print();
                  }, 400);
                }}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer transition-all shrink-0"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Open Print Panel</span>
              </button>
            </div>
          </div>

          {/* Modal scroll area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6" id="printer-friendly-scrollable">
            
            {/* REAL-TIME ENGINE DIAGNOSTIC SECTION */}
            <div className="space-y-3 bg-indigo-50/20 dark:bg-indigo-950/10 p-5 rounded-2xl border border-indigo-150 dark:border-indigo-900/30">
              <div className="flex items-center gap-2 text-xs font-black text-indigo-750 dark:text-indigo-400 uppercase tracking-widest">
                <SlidersHorizontal className="w-4 h-4 text-indigo-500" />
                <span>Structural Diagnostic Tests</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {diagnostics.checks.map((check) => (
                  <div 
                    key={check.id} 
                    className="p-3 bg-white dark:bg-slate-850 rounded-xl border border-slate-150 dark:border-slate-800/80 flex items-start gap-2.5 shadow-xs transition-transform hover:translate-y-[-1px]"
                  >
                    {check.status === 'pass' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    ) : check.status === 'fail' ? (
                      <FileWarning className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {check.title}
                      </p>
                      <p className="text-[10px] text-slate-505 dark:text-slate-400 leading-normal">
                        {check.message}
                      </p>
                      {check.actionLabel && check.onAction && (
                        <button
                          onClick={check.onAction}
                          className="text-[9px] font-black tracking-wide bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/85 dark:text-indigo-400 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-900/40 inline-flex items-center mt-1 cursor-pointer hover:underline transition-all"
                        >
                          {check.actionLabel}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* GUIDELINE CHECKLIST WITH CATEGORIES AND TRACKING */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">
                  <CheckSquare className="w-4 h-4 text-indigo-500" />
                  <span>Printing Best Practices Checklist</span>
                </div>
                <div className="text-[11px] font-semibold text-slate-505 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                  Checklist Progress: {completedCount} / {CONSTANT_GUIDELINES.length} completed ({progressPercent}%)
                </div>
              </div>

              {/* Category Filter Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-150 dark:border-slate-800/80 w-max shrink-0 max-w-full overflow-x-auto select-none">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === 'all' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-500'}`}
                >
                  All Items
                </button>
                <button
                  onClick={() => setActiveTab('browser')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === 'browser' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-500'}`}
                >
                  Browser Options
                </button>
                <button
                  onClick={() => setActiveTab('layout')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === 'layout' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-500'}`}
                >
                  Layout Specs
                </button>
                <button
                  onClick={() => setActiveTab('design')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === 'design' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-500'}`}
                >
                  Document Design
                </button>
              </div>

              {/* Checklist list cards */}
              <div className="space-y-3">
                {filteredGuidelines.map((item) => {
                  const isChecked = !!visitedItems[item.id];
                  return (
                    <div 
                      key={item.id}
                      onClick={() => toggleItemVisited(item.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex gap-3.5 items-start relative select-none ${
                        isChecked 
                          ? 'bg-slate-50/40 dark:bg-slate-950/20 border-slate-200/55 dark:border-slate-800' 
                          : 'bg-white dark:bg-slate-850 hover:bg-slate-50/30 border-slate-150 dark:border-slate-800/80'
                      }`}
                    >
                      {/* Checkbox item state indicator */}
                      <button className="shrink-0 mt-0.5 text-indigo-600 dark:text-indigo-400 active:scale-90 transition-transform">
                        {isChecked ? (
                          <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        ) : (
                          <div className="w-5 h-5 rounded-md border-2 border-slate-300 dark:border-slate-650" />
                        )}
                      </button>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white leading-normal">
                            {item.title}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-black tracking-wide uppercase ${
                            item.category === 'browser' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400' :
                            item.category === 'layout' ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400' :
                            'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400'
                          }`}>
                            {item.category === 'browser' ? 'Browser' : item.category === 'layout' ? 'Layout' : 'Design'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-505 dark:text-slate-400 font-medium leading-relaxed">
                          {item.description}
                        </p>
                        
                        <div className="text-[10px] font-semibold text-indigo-605 dark:text-indigo-350 bg-indigo-50/40 dark:bg-indigo-950/20 px-3 py-1.5 rounded-lg border border-indigo-100/50 dark:border-indigo-900/15 mt-2 flex items-start gap-1.5 leading-snug">
                          <Info className="w-3.5 h-3.5 shrink-0 text-indigo-500 mt-0.5" />
                          <span><span className="font-bold">Instructions:</span> {item.tip}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* GENERAL HELP SECTION ON OPERATING SYSTEM ACTIONS */}
            <div className="bg-gradient-to-r from-slate-100/60 to-slate-50/60 dark:from-slate-850/60 dark:to-slate-850/60 rounded-2xl p-4 border border-slate-200/50 dark:border-slate-800 flex gap-3">
              <HelpCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5 animate-bounce" />
              <div className="text-[10px] text-slate-505 leading-relaxed space-y-1">
                <p className="font-bold text-slate-705 dark:text-slate-300 uppercase tracking-widest text-[9px]">How to ensure quality across different browsers?</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1.5">
                  <div className="space-y-0.5">
                    <span className="font-extrabold text-slate-750 dark:text-slate-200">Chrome & Edge:</span>
                    <p>Open Printer Settings → Check the "Background Graphics" selector box → set Margins directly to "Minimum" or "None" to preserve formatting offsets.</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-extrabold text-slate-750 dark:text-slate-200">Safari on macOS:</span>
                    <p>Open the Print settings menu → Enable "Print Backgrounds" option → set Paper format boundaries accordingly to avoid multi-page clipping.</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-extrabold text-slate-750 dark:text-slate-200">Firefox:</span>
                    <p>Check the "Print Background Colors" option → Ensure alignment fits page dimensions without native printer scales overriding the document.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Footer Controls */}
          <div className="px-6 py-4 border-t border-slate-150 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/60 shrink-0">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Review Checklist prior to printing!
            </span>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350 font-bold text-xs rounded-xl transition-all cursor-pointer border border-slate-200 dark:border-slate-850"
                id="close-guidelines-bottom-btn"
              >
                Done, Close
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
