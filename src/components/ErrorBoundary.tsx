import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCcw, Copy, FileText, Check, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  capturedDrafts: { label: string; value: string }[];
  copiedIndex: number | null;
  copiedAll: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    capturedDrafts: [],
    copiedIndex: null,
    copiedAll: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true, 
      error,
      capturedDrafts: [],
      copiedIndex: null,
      copiedAll: false
    };
  }

  public componentDidCatch(error: Error, _errorInfo: ErrorInfo) {
    console.error('Uncaught error in boundary:', error, _errorInfo);
    
    try {
      // Scrape current inputs and textareas to capture unsaved text before they are unmounted
      const inputs = Array.from(document.querySelectorAll('input:not([type="password"]):not([type="hidden"]), textarea')) as (HTMLInputElement | HTMLTextAreaElement)[];
      const capturedDrafts = inputs
        .map(el => {
          let labelText = '';
          const id = el.id;
          if (id) {
            const associatedLabel = document.querySelector(`label[for="${id}"]`);
            if (associatedLabel) {
              labelText = associatedLabel.textContent || '';
            }
          }
          if (!labelText) {
            labelText = el.closest('div')?.querySelector('label')?.textContent || '';
          }
          if (!labelText) {
            labelText = el.getAttribute('aria-label') || el.name || el.placeholder || id || 'Input Element';
          }
          
          return {
            label: labelText.replace(/[:*]/g, '').trim(),
            value: el.value
          };
        })
        .filter(item => item.value && item.value.trim().length > 3);

      this.setState({ capturedDrafts });
      
      // Save to localStorage as a global safe failure backup
      if (capturedDrafts.length > 0) {
        localStorage.setItem('careercraft_recovered_drafts', JSON.stringify({
          timestamp: new Date().toISOString(),
          drafts: capturedDrafts
        }));
      }
    } catch (e) {
      console.warn('Failed to harvest unsaved user forms safely:', e);
    }
  }

  private handleCopyText = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    this.setState({ copiedIndex: index });
    setTimeout(() => {
      this.setState({ copiedIndex: null });
    }, 2000);
  };

  private handleCopyAll = () => {
    const fullText = this.state.capturedDrafts
      .map(d => `[${d.label}]\n${d.value}`)
      .join('\n\n=============================\n\n');
    
    navigator.clipboard.writeText(fullText);
    this.setState({ copiedAll: true });
    setTimeout(() => {
      this.setState({ copiedAll: false });
    }, 2000);
  };

  public render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || '';
      
      // Identify typical chunk loading exceptions
      const isChunkLoadError = !!(
        errorMessage && (
          errorMessage.toLowerCase().includes('dynamically imported module') ||
          errorMessage.toLowerCase().includes('loading chunk') ||
          errorMessage.toLowerCase().includes('loading css chunk') ||
          errorMessage.toLowerCase().includes('failed to fetch') ||
          errorMessage.toLowerCase().includes('dynamic import') ||
          errorMessage.toLowerCase().includes('error loading')
        )
      );

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 md:p-12 font-sans">
          <div className="max-w-xl w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-8 md:p-10">
            
            {/* Header Status Visual */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
              {isChunkLoadError ? (
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <ShieldAlert className="w-6 h-6 animate-pulse" />
                </div>
              ) : (
                <div className="w-12 h-12 bg-red-50 dark:bg-red-950/40 rounded-2xl flex items-center justify-center text-red-600 dark:text-red-400">
                  <AlertCircle className="w-6 h-6" />
                </div>
              )}
              <div>
                <span className="text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase">
                  {isChunkLoadError ? 'System Update Conflict' : 'Application Exception'}
                </span>
                <h2 className="text-xl font-black text-slate-950 dark:text-white uppercase tracking-tight leading-none mt-1">
                  {isChunkLoadError ? 'New Release Detected' : 'An Uncaught Crash Occurred'}
                </h2>
              </div>
            </div>

            {/* Error / Situation Summary Context */}
            {isChunkLoadError ? (
              <div className="space-y-4">
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  CareerCraft has recently been updated in the background. A cached asset reference from your dynamic active session looks for a previous code chunk that no longer aligns with the live build.
                </p>
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/45 rounded-2xl p-4 text-xs text-amber-800 dark:text-amber-400/95 leading-relaxed">
                  <strong>⚠️ Action Required:</strong> To apply this new version cleanly, you must perform a reload. We highly recommend verifying, copying, or saving your current typed progress using our automatic recoverer before reloading.
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  A client-side runtime script exception has nested itself in this component layer. We have gracefully caught the trace context safely to prevent global system freezes.
                </p>
                <div className="bg-slate-50 dark:bg-slate-950/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/80">
                  <p className="text-[10px] font-mono text-left text-slate-500 break-words line-clamp-3">
                    {errorMessage || 'Unknown stack trace element: dynamic runtime parameter lost.'}
                  </p>
                </div>
              </div>
            )}

            {/* Unsaved drafts recoverer UI container */}
            {this.state.capturedDrafts.length > 0 && (
              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Unsaved Workspace Drafts ({this.state.capturedDrafts.length})
                  </h3>
                  <button
                    onClick={this.handleCopyAll}
                    className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:underline flex items-center gap-1"
                  >
                    {this.state.copiedAll ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        Copied All!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy All Text
                      </>
                    )}
                  </button>
                </div>
                
                <div className="space-y-3 max-h-48 overflow-y-auto pr-1 border border-slate-100 dark:border-slate-800/60 rounded-2xl p-3 bg-slate-50/50 dark:bg-slate-950/20">
                  {this.state.capturedDrafts.map((draft, i) => (
                    <div 
                      key={i} 
                      className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/85 p-3 rounded-xl flex justify-between items-start gap-4 shadow-sm"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                          {draft.label}
                        </span>
                        <p className="text-xs text-slate-700 dark:text-slate-300 font-mono mt-1 line-clamp-2 select-all">
                          {draft.value}
                        </p>
                      </div>
                      <button
                        onClick={() => this.handleCopyText(draft.value, i)}
                        className="p-1 px-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all flex-shrink-0"
                        title="Copy to clipboard"
                      >
                        {this.state.copiedIndex === i ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-8 space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-100 dark:shadow-none flex items-center justify-center gap-2"
              >
                <RefreshCcw className="w-4 h-4" />
                {isChunkLoadError ? 'Apply Application Update & Reload' : 'Reload Application & Retry'}
              </button>
              
              {!isChunkLoadError && (
                <button
                  onClick={() => {
                    localStorage.removeItem('careercraft_recovered_drafts');
                    this.setState({ hasError: false, error: null, capturedDrafts: [] });
                  }}
                  className="w-full py-3 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Clear State & Return to Safety
                </button>
              )}
            </div>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

