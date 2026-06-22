import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, Lock, AlertCircle, Sparkles, FileText, Globe, RefreshCcw } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export default function PaywallModal({ 
  isOpen, 
  onClose, 
  title = "Unlock Premium Features", 
  description = "You've used your free trial. Upgrade to download your document or access premium features."
}: PaywallModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 dark:border-slate-800 relative my-8"
        >
          {/* Close button */}
          <button 
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-full transition-colors z-10 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-6 sm:p-10">
            {/* Header section with Icon */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-950/60 rounded-2xl flex items-center justify-center shrink-0">
                <Lock className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <span className="text-[10px] font-black tracking-widest text-indigo-600 dark:text-indigo-400 uppercase bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-md mb-1.5 inline-block">
                  Premium Pass Required
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white leading-tight">{title}</h2>
              </div>
            </div>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
              {description}
            </p>

            {/* Trial Limitations vs Premium Benefits Comparison Grid */}
            <div className="grid md:grid-cols-2 gap-5 mb-8">
              {/* Free Trial Limitation status card */}
              <div className="p-5 rounded-2xl bg-amber-50/50 dark:bg-slate-950/40 border border-amber-150/40 dark:border-slate-800/85">
                <div className="flex items-center gap-2 mb-3.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <h4 className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">Free Trial Limits</h4>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                  <li className="flex items-start gap-2">
                    <span className="text-rose-500 font-bold shrink-0 mt-0.5">✕</span>
                    <span>No premium resume templates (Classic, Results-oriented, etc.)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-500 font-bold shrink-0 mt-0.5">✕</span>
                    <span>No high-fidelity PDF/DOCX layouts styling download</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-500 font-bold shrink-0 mt-0.5">✕</span>
                    <span>No multi-version backup history or comparative diff highlights</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-500 font-bold shrink-0 mt-0.5">✕</span>
                    <span>No advanced custom AI tone adjective fine-tuning</span>
                  </li>
                </ul>
              </div>

              {/* Premium Perks card */}
              <div className="p-5 rounded-2xl bg-emerald-50/20 dark:bg-emerald-950/5 border border-emerald-500/20 dark:border-emerald-990/20">
                <div className="flex items-center gap-2 mb-3.5">
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">Upgrade Benefits</h4>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Unlimited design templates & premium layout accents</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Instant export in pristine PDF, DOCX, & RTF layouts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Rollback versions history & diff alignment highlighting</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Premium ATS Optimization check & instant tailored rewrites</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Plans Pricing Option Grid */}
            <div className="grid sm:grid-cols-2 gap-5 mb-8">
              {/* Single Download Pay-as-you-go Option */}
              <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 relative flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Pay Per Document</h3>
                    <span className="text-[9px] bg-slate-200 dark:bg-slate-800 font-bold px-2 py-0.5 rounded text-slate-600 dark:text-slate-400 uppercase">
                      Flexible
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                    Perfect if you only need one customized resume or cover letter right now.
                  </p>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white mb-5">
                    K19 <span className="text-xs font-normal text-slate-500">/ 1 document credit</span>
                  </div>
                </div>
                <Link 
                  to="/pricing" 
                  onClick={onClose}
                  className="block w-full py-2.5 px-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs uppercase tracking-wider text-center hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors shadow-sm"
                >
                  Purchase 1 Credit
                </Link>
              </div>

              {/* Monthly Subscription Option */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 dark:from-indigo-950 dark:to-indigo-900 text-white relative overflow-hidden flex flex-col justify-between shadow-xl shadow-indigo-100 dark:shadow-none">
                <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 text-[8px] font-black px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                  Best Value
                </div>
                <div>
                  <h3 className="font-bold mb-2 text-sm text-indigo-50 dark:text-indigo-200 flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-emerald-400" />
                    Pro Subscription Membership
                  </h3>
                  <p className="text-xs text-indigo-150 dark:text-indigo-300 mb-4">
                    Unlock every single premium tool, design style, and unlimited monthly downloads.
                  </p>
                  <div className="text-2xl font-bold mb-5 flex items-baseline gap-1">
                    K75 <span className="text-xs font-normal text-indigo-200 dark:text-indigo-400">/ month</span>
                  </div>
                </div>
                <Link 
                  to="/pricing"
                  onClick={onClose}
                  className="block w-full py-2.5 px-4 bg-white hover:bg-indigo-50 text-indigo-600 rounded-xl font-bold text-xs uppercase tracking-wider text-center transition-colors shadow-md"
                >
                  Unshackle Boundless Access
                </Link>
              </div>
            </div>

            {/* Paywall Footer assurance terms */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-150 dark:border-slate-800">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> 
                <span>Secure SSL Checkout</span>
              </div>
              <div className="flex items-center gap-1.5">
                <RefreshCcw className="w-3.5 h-3.5 text-emerald-500" /> 
                <span>Credits never expire</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-500" /> 
                <span>Upgraded documents forever editable</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
