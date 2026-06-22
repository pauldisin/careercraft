import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileText, FileDown, AlertCircle, CheckCircle2, Coins, Sparkles } from 'lucide-react';

interface DownloadConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  documentType: 'resume' | 'cover letter';
  format: 'pdf' | 'docx' | 'txt' | 'rtf';
  isTrial: boolean;
  requiresCredit: boolean;
  creditsBalance?: number;
  previewNode?: React.ReactNode;
  isOverOnePage?: boolean;
  shrinkToFit?: boolean;
  onShrinkToFitChange?: (val: boolean) => void;
  showPageNumbers?: boolean;
  onShowPageNumbersChange?: (val: boolean) => void;
  watermark?: 'none' | 'draft' | 'careercraft';
  onWatermarkChange?: (val: 'none' | 'draft' | 'careercraft') => void;
  pdfAccentColor?: string;
  onPdfAccentColorChange?: (color: string) => void;
  fontFamily?: string;
  onFontFamilyChange?: (font: string) => void;
}

export default function DownloadConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  documentType,
  format,
  isTrial,
  requiresCredit,
  creditsBalance,
  previewNode,
  isOverOnePage = false,
  shrinkToFit = false,
  onShrinkToFitChange,
  showPageNumbers = false,
  onShowPageNumbersChange,
  watermark = 'none',
  onWatermarkChange,
  pdfAccentColor,
  onPdfAccentColorChange,
  fontFamily,
  onFontFamilyChange
}: DownloadConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md max-h-[85vh] sm:max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                {format === 'pdf' ? <FileText className="w-5 h-5" /> : <FileDown className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Download {documentType === 'resume' ? 'Resume' : 'Cover Letter'}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Format: {format.toUpperCase()}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
            {previewNode && (
              <div className="w-full h-48 bg-slate-100 dark:bg-slate-800/50 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 relative flex justify-center items-start">
                <div className="transform scale-[0.3] origin-top mt-4 pointer-events-none">
                  {previewNode}
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-100/80 dark:to-slate-900/80 pointer-events-none" />
              </div>
            )}

            <div className="text-center space-y-1.5 animate-fade-in">
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white">Confirm Document Export</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Your high-quality {documentType} generates instantly inside your downloads directory.
              </p>
            </div>

            {/* A4 Page Optimization / Shrink-to-Fit Panel */}
            {format === 'pdf' && (
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      📏 Page Status
                    </span>
                    <p className="text-[11px] text-slate-505 dark:text-slate-400">
                      {isOverOnePage 
                        ? "Exceeds 1 A4 page (will spill over to page 2)" 
                        : "Perfect size! Content fits beautifully on a single A4 page"}
                    </p>
                  </div>
                  {isOverOnePage ? (
                    <span className="text-[9px] bg-amber-100 text-amber-800 dark:bg-amber-955/30 dark:text-amber-400 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider shrink-0">
                      Multi-Page
                    </span>
                  ) : (
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 dark:bg-emerald-955/20 dark:text-emerald-400 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider shrink-0">
                      1 Page Fit
                    </span>
                  )}
                </div>

                {isOverOnePage && onShrinkToFitChange && (
                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        Shrink-to-Fit Option
                      </span>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal">
                        Proportionally scale down font sizes, padding, and line height to fit on exactly one page.
                      </p>
                    </div>
                    
                    <button
                      type="button"
                      id="toggle-shrink-to-fit"
                      onClick={() => onShrinkToFitChange(!shrinkToFit)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        shrinkToFit ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          shrinkToFit ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                )}

                {onShowPageNumbersChange && (
                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Show Page Numbers
                      </span>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal">
                        Add a centered footer with "Page X of Y" to the final exported document.
                      </p>
                    </div>
                    
                    <button
                      type="button"
                      id="toggle-show-page-numbers"
                      onClick={() => onShowPageNumbersChange(!showPageNumbers)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        showPageNumbers ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          showPageNumbers ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                )}

                {onWatermarkChange && (
                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Document Watermark
                        </span>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal">
                          Display a semi-transparent watermark across the background.
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
                      {(['none', 'draft', 'careercraft'] as const).map((opt) => (
                        <button
                          key={opt}
                          id={`watermark-opt-${opt}`}
                          type="button"
                          onClick={() => onWatermarkChange(opt)}
                          className={`py-1.5 text-[10px] font-extrabold rounded-lg transition-all uppercase tracking-wider ${
                            watermark === opt
                              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                          }`}
                        >
                          {opt === 'none' ? 'None' : opt === 'draft' ? 'Draft' : 'CareerCraft'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {onFontFamilyChange && (
                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Resume Font Family
                      </span>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal font-medium">
                        Switch between available resume fonts to preview and export.
                      </p>
                    </div>

                    <select
                      id="pdf-font-family-select"
                      value={fontFamily || 'Inter'}
                      onChange={(e) => onFontFamilyChange(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white text-xs font-medium cursor-pointer"
                    >
                      <option value="Inter" style={{ fontFamily: 'Inter, sans-serif' }}>Inter (Clean & Professional)</option>
                      <option value="Cormorant Garamond" style={{ fontFamily: '"Cormorant Garamond", serif' }}>Cormorant Garamond (Elegant & Editorial)</option>
                      <option value="Lora" style={{ fontFamily: 'Lora, serif' }}>Lora (Classic & Formal)</option>
                      <option value="Outfit" style={{ fontFamily: 'Outfit, sans-serif' }}>Outfit (Modern & Creative)</option>
                      <option value="Space Grotesk" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>Space Grotesk (Bold & Tech-Forward)</option>
                    </select>
                  </div>
                )}

                {onPdfAccentColorChange && (
                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Export Accent Color
                      </span>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal font-medium">
                        Change the template's accent color specifically for this PDF download.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5 items-center justify-between pt-1">
                      <div className="flex gap-2">
                        {[
                          { name: 'Indigo', value: '#4f46e5' },
                          { name: 'Emerald', value: '#059669' },
                          { name: 'Rose', value: '#e11d48' },
                          { name: 'Blue', value: '#2563eb' },
                          { name: 'Amber', value: '#d97706' },
                          { name: 'Slate', value: '#475569' },
                        ].map((color) => (
                          <button
                            key={color.value}
                            type="button"
                            id={`pdf-accent-${color.name.toLowerCase()}`}
                            onClick={() => onPdfAccentColorChange(color.value)}
                            className={`h-6 w-6 rounded-full border-2 border-transparent transition-all cursor-pointer ${
                              pdfAccentColor === color.value 
                                ? 'ring-2 ring-offset-2 ring-indigo-550 border-white dark:border-slate-800 scale-110' 
                                : 'hover:scale-110'
                            }`}
                            style={{ backgroundColor: color.value }}
                            title={color.name}
                          />
                        ))}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-mono text-slate-400">Hex:</span>
                        <input
                          type="text"
                          id="pdf-accent-hex-input"
                          value={pdfAccentColor || ''}
                          onChange={(e) => onPdfAccentColorChange(e.target.value)}
                          className="w-16 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-705 rounded text-[10px] font-mono text-slate-805 dark:text-slate-200 uppercase outline-none focus:ring-1 focus:ring-indigo-500"
                          placeholder="#HEX"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Status Card - Highly transparent trial check vs credit cost details */}
            <div className={`p-4.5 rounded-2xl border ${
              isTrial 
                ? 'bg-amber-50/50 border-amber-200 dark:bg-amber-950/10 dark:border-amber-900/30' 
                : requiresCredit
                  ? 'bg-indigo-50 border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800/30'
                  : 'bg-emerald-50/30 border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-900/20'
            }`}>
              <div className="flex items-start gap-3">
                {isTrial ? (
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                ) : requiresCredit ? (
                  <Coins className="w-5 h-5 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                )}
                
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <h5 className={`text-xs font-black uppercase tracking-wider ${
                      isTrial 
                        ? 'text-amber-800 dark:text-amber-400' 
                        : requiresCredit
                          ? 'text-indigo-800 dark:text-indigo-300'
                          : 'text-emerald-800 dark:text-emerald-400'
                    }`}>
                      {isTrial ? '🎁 One-Time Free Trial Download' : requiresCredit ? '💎 Deducts 1 Credit' : '✨ Unlimited Subscription Active'}
                    </h5>
                    
                    {/* Real-time credits transparency tracker */}
                    {creditsBalance !== undefined && requiresCredit && (
                      <span className="text-[10px] font-mono text-indigo-650 dark:text-indigo-300 font-bold bg-indigo-100 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md">
                        Bal: {creditsBalance} cr
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-medium">
                    {isTrial ? (
                      <span>
                        This is your **one-time** trial download. Upgrading to a Pro Membership or buying credits (from K19) allows you to unleash customized accent colors, elite fonts, and exports in DOCX or PDF format on subsequent modifications.
                      </span>
                    ) : requiresCredit ? (
                      <span>
                        Downloading compiles this document and consumes **exactly 1 credit** from your current balance of {creditsBalance ?? 0} remaining credit(s).
                      </span>
                    ) : (
                      <span>
                        Your pro active subscription benefits are enabled! You have unrestricted access to unlimited document edits, layouts, and downloads.
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Balance Preview or Warnings */}
            {requiresCredit && creditsBalance !== undefined && (
              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium px-1 flex items-center justify-between">
                <span>Current Balance: <strong className="text-slate-700 dark:text-slate-300 font-mono">{creditsBalance} cr</strong></span>
                <span>After Download: <strong className="text-slate-700 dark:text-slate-300 font-mono">{Math.max(0, creditsBalance - 1)} cr</strong></span>
              </div>
            )}
            
            {isTrial && (
              <div className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>Subsequent edits and exports will require standard doc credits. Get a head start and enjoy!</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4.5 border-t border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex gap-3 shrink-0">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100 dark:shadow-none flex items-center justify-center gap-2 cursor-pointer text-center"
            >
              {format === 'pdf' ? <FileText className="w-4 h-4" /> : <FileDown className="w-4 h-4" />}
              Confirm & Save
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
