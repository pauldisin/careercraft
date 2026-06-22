import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  UploadCloud, 
  Loader2, 
  BarChart, 
  AlertCircle, 
  CheckCircle2, 
  Zap, 
  Target, 
  Layout, 
  Copy, 
  Check, 
  Sparkles, 
  BookOpen, 
  FileText 
} from 'lucide-react';
import PaywallModal from '../components/PaywallModal';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { apiFetch } from '../lib/api';
import GrammarCheckTextarea from '../components/GrammarCheckTextarea';
import { trackEvent } from '../lib/analytics';
import SEO from '../components/SEO';
import { getResumeAnalysisPrompt } from '../lib/prompts';

export default function Analyzer() {
  const { user, dbUser } = useAuth();
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [hasUsedAnalysisTrial, setHasUsedAnalysisTrial] = useState(false);
  const [activeInfoTab, setActiveInfoTab] = useState<'why' | 'limits'>('why');
  const [activeResultTab, setActiveResultTab] = useState<'ats' | 'bullets' | 'keywords'>('ats');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  
  useEffect(() => {
    if (dbUser) {
      setHasUsedAnalysisTrial(dbUser.has_used_analysis_trial === 1);
    } else {
      setHasUsedAnalysisTrial(false);
    }
  }, [dbUser]);

  const [analysis, setAnalysis] = useState<{
    score: number;
    atsCompatibility: string;
    keywordDensityFeedback: string;
    actionVerbFeedback: string;
    formattingConsistencyFeedback: string;
    weakWording: string[];
    presentKeywords?: { keyword: string; count: number }[];
    missingKeywords: string[];
    formattingIssues: string;
    suggestions: string[];
    matchAnalysis: string;
    bulletPointStrength?: {
      original: string;
      critique: string;
      rewritten: string;
    }[];
    keywordOptimization?: {
      keyword: string;
      status: 'present' | 'missing';
      importance: 'high' | 'medium' | 'low';
      suggestedPhrasing: string;
    }[];
  } | null>(null);


  const analyzeResume = async () => {
    if (hasUsedAnalysisTrial && !(dbUser && (dbUser.subscription_status === 'active' || dbUser.credits > 0))) {
      setIsPaywallOpen(true);
      return;
    }

    setIsAnalyzing(true);
    try {
      const prompt = getResumeAnalysisPrompt(resumeText, jobDescription);

      let response;
      try {
        response = await apiFetch('/api/ai/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            type: 'analysis',
            config: {
              responseMimeType: 'application/json',
            }
          })
        });
      } catch (fetchErr: any) {
        console.error('Network fetch error during analysis:', fetchErr);
        throw new Error('Connection to the service was lost or the server is restarting. Please try again in 5-10 seconds.');
      }

      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');

      if (!response.ok) {
        let errorMessage = 'Failed to analyze resume';
        if (isJson) {
          const errorData = await response.json().catch(() => ({}));
          errorMessage = errorData.message || errorData.error || errorMessage;
        } else {
          errorMessage = 'The server is temporarily offline or restarting. Please try again in a few seconds.';
        }
        throw new Error(errorMessage);
      }

      if (!isJson) {
        throw new Error('Service returned an unexpected response format. Please try again in a few seconds.');
      }

      const data = await response.json();
      
      let result;
      try {
        let cleanedText = data.text || '{}';
        cleanedText = cleanedText.trim();
        if (cleanedText.startsWith('```json')) {
          cleanedText = cleanedText.slice(7, -3).trim();
        } else if (cleanedText.startsWith('```')) {
          cleanedText = cleanedText.slice(3, -3).trim();
        }
        result = JSON.parse(cleanedText);
      } catch (parseErr) {
        console.error('Failed to parse AI output JSON:', data.text);
        throw new Error('The AI model generated formatting that we couldn\'t parse. Please retry generating suggestions.');
      }

      setAnalysis(result);
      trackEvent('analyze_resume', { hasJobDescription: !!jobDescription });
      setHasUsedAnalysisTrial(true);
    } catch (error: any) {
      console.error('Error analyzing resume:', error);
      toast.error(error.message || 'Failed to analyze resume. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 transition-colors duration-300">
      <SEO 
        title="Resume Analyzer & ATS Compatibility Check | CareerCraft"
        description="Analyze your resume against job descriptions to improve your ATS compatibility score and get actionable feedback from our AI-driven tools."
        type="website"
      />
      {/* Top Navigation / Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-purple-600 p-2 rounded-lg shadow-lg shadow-purple-200 dark:shadow-none">
              <BarChart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-none">Resume Intelligence</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Smart ATS Optimization</p>
            </div>
          </div>
          
          {analysis && (
            <button
              onClick={() => {
                setAnalysis(null);
                setResumeText('');
                setJobDescription('');
                setActiveResultTab('ats');
                setCopiedIndex(null);
              }}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-sm font-semibold transition-all"
            >
              <UploadCloud className="w-4 h-4" />
              New Analysis
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Inputs */}
          <div className="lg:col-span-5 space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm"
            >
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-6">Analysis Inputs</h2>
              
              <div className="space-y-6">
                <div className="group">
                  <GrammarCheckTextarea
                    label="Resume Content"
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    rows={12}
                    placeholder="Paste your resume text here..."
                  />
                </div>

                <div className="group">
                  <GrammarCheckTextarea
                    label="Job Description (Optional)"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    rows={6}
                    placeholder="Paste the job requirements for a targeted analysis..."
                  />
                </div>

                <button
                  onClick={analyzeResume}
                  disabled={isAnalyzing || !resumeText.trim()}
                  className="w-full px-6 py-4 bg-purple-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-purple-700 active:scale-[0.98] transition-all shadow-xl shadow-purple-200 dark:shadow-none flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" /> {hasUsedAnalysisTrial && !(dbUser && (dbUser.subscription_status === 'active' || dbUser.credits > 0)) ? 'Analyze Resume' : 'Start Free Analysis'}
                    </>
                  )}
                </button>
              </div>
            </motion.div>

            {/* Interactive Transparency & FAQ Panel */}
            <div className="bg-slate-100 dark:bg-slate-900/50 rounded-2xl p-1.5 border border-slate-200 dark:border-slate-800">
              <div className="flex gap-1 bg-slate-200/50 dark:bg-slate-950/40 p-1 rounded-xl mb-3">
                <button
                  type="button"
                  onClick={() => setActiveInfoTab('why')}
                  className={`flex-1 py-2 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                    activeInfoTab === 'why'
                      ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  🎯 Quick Tips
                </button>
                <button
                  type="button"
                  onClick={() => setActiveInfoTab('limits')}
                  className={`flex-1 py-2 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                    activeInfoTab === 'limits'
                      ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  ⚖️ AI Limits & Best Input
                </button>
              </div>

              <div className="p-4.5 bg-white default:bg-[#fff] dark:bg-slate-900/30 rounded-xl border border-slate-150/50 dark:border-slate-850">
                {activeInfoTab === 'why' ? (
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase">How Yewo Evaluates Resumes</h3>
                    <ul className="space-y-3">
                      {[
                        'Keyword Alignment: Checks if relevant skills matching the target role are present.',
                        'Action Verbs: Verifies active verbs are matched with quantifiable achievements.',
                        'Clean Layouts: Flag complicated graphic grids that standard parsing bots fail to read.',
                        'Role Matching: Highlights missing credentials or core certificates.'
                      ].map((text, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                          <span>{text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase">Understanding AI Limits & Roles</h3>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                        <span><strong>Preparatory baseline:</strong> This tool acts as a predictive best-practice sandbox. Since actual employer ATS modules vary, Yewo scores prioritize standard parsing capabilities.</span>
                      </li>
                      <li className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                        <span><strong>Best inputs, best results:</strong> Paste complete, detailed bullet points and full recruiter job details. Short or single-line inputs can yield generic feedbacks.</span>
                      </li>
                      <li className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <AlertCircle className="w-3.5 h-3.5 text-purple-500 mt-0.5 shrink-0" />
                        <span><strong>Use human intuition:</strong> Treat suggestions as smart co-pilot feedback. Combine with thorough manual checks before sharing with any recruitment panel.</span>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-7">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden min-h-[800px] flex flex-col"
            >
              {/* Results Toolbar */}
              <div className="bg-slate-50 dark:bg-slate-950/50 px-8 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400/20 border border-red-400/40" />
                    <div className="w-3 h-3 rounded-full bg-amber-400/20 border border-amber-400/40" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400/20 border border-emerald-400/40" />
                  </div>
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">Analysis Report</span>
                </div>
              </div>

              {/* Interactive Tabs */}
              {analysis && (
                <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 p-2 gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveResultTab('ats')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-1 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                      activeResultTab === 'ats'
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    ATS Audit
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveResultTab('bullets')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-1 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                      activeResultTab === 'bullets'
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Bullet Coach
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveResultTab('keywords')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-1 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                      activeResultTab === 'keywords'
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <Target className="w-3.5 h-3.5" />
                    Keywords
                  </button>
                </div>
              )}

              {/* Results Content */}
              <div className="flex-1 p-8 sm:p-12 overflow-y-auto">
                {analysis ? (
                  <motion.div
                    key={activeResultTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-8"
                  >
                    
                    {/* TAB 1: ATS AUDIT */}
                    {activeResultTab === 'ats' && (
                      <div className="space-y-8">
                        {/* Score Visualization */}
                        <div className="flex flex-col items-center select-none bg-slate-50/50 dark:bg-slate-955/20 p-6 rounded-2xl border border-slate-100 dark:border-slate-850">
                          <div className="relative w-44 h-44">
                            <svg className="w-full h-full" viewBox="0 0 100 100">
                              <circle
                                className="text-slate-200 dark:text-slate-800 stroke-current"
                                strokeWidth="8"
                                fill="transparent"
                                r="42"
                                cx="50"
                                cy="50"
                              />
                              <circle
                                className="text-purple-600 stroke-current transition-all duration-1000 ease-out"
                                strokeWidth="8"
                                strokeDasharray={264}
                                strokeDashoffset={264 - (264 * analysis.score) / 100}
                                strokeLinecap="round"
                                fill="transparent"
                                r="42"
                                cx="50"
                                cy="50"
                                transform="rotate(-90 50 50)"
                              />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center font-sans">
                              <span className="text-4xl font-black text-slate-900 dark:text-white leading-none">{analysis.score}</span>
                              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">ATS Score</span>
                            </div>
                          </div>
                          
                          <div className="mt-6 text-center max-w-md">
                            <h3 className="text-sm font-black text-slate-800 dark:text-slate-300 uppercase tracking-wider mb-2">Executive Summary</h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic">
                              "{analysis.matchAnalysis}"
                            </p>
                          </div>
                        </div>

                        {/* ATS Compatibility & Formatting Consistency */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-slate-50 dark:bg-slate-950/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center gap-2.5 mb-4 border-b border-slate-200/10 pb-2.5">
                                <div className="bg-emerald-100 dark:bg-emerald-900/30 p-1.5 rounded-lg text-emerald-600">
                                  <CheckCircle2 className="w-4 h-4" />
                                </div>
                                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-tight text-xs">ATS Compatibility Check</h4>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">
                                {analysis.atsCompatibility}
                              </p>
                            </div>
                          </div>

                          <div className="bg-slate-50 dark:bg-slate-950/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center gap-2.5 mb-4 border-b border-slate-200/10 pb-2.5">
                                <div className="bg-amber-100 dark:bg-amber-900/30 p-1.5 rounded-lg text-amber-600">
                                  <Layout className="w-4 h-4" />
                                </div>
                                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-tight text-xs">Formatting Consistency</h4>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">
                                {analysis.formattingConsistencyFeedback}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Formatting Issues Card */}
                        {analysis.formattingIssues && (
                          <div className="bg-amber-500/5 dark:bg-amber-500/10 p-6 rounded-2xl border border-amber-500/20">
                            <div className="flex items-center gap-2.5 mb-3">
                              <AlertCircle className="w-4.5 h-4.5 text-amber-500" />
                              <h4 className="font-bold text-slate-800 dark:text-slate-350 uppercase tracking-tight text-xs">Structural Parsing Blockers</h4>
                            </div>
                            <p className="text-xs text-slate-700 dark:text-slate-400 leading-relaxed font-semibold">
                              {analysis.formattingIssues}
                            </p>
                          </div>
                        )}

                        {/* Tactical Recommendations */}
                        <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-900/20">
                          <div className="flex items-center gap-2.5 mb-4 border-b border-indigo-100/40 dark:border-indigo-950/40 pb-2.5">
                            <div className="bg-indigo-100 dark:bg-indigo-900/30 p-1.5 rounded-lg">
                              <BarChart className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h4 className="font-bold text-indigo-900 dark:text-indigo-400 uppercase tracking-tight text-xs">Strategic Suggestions</h4>
                          </div>
                          <ul className="space-y-3 font-sans">
                            {analysis.suggestions.map((sug, idx) => (
                              <li key={idx} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-3">
                                <div className="w-5 h-5 rounded-full bg-indigo-200 dark:bg-indigo-900/50 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 text-indigo-800 dark:text-indigo-300 font-mono">
                                  {idx + 1}
                                </div>
                                <span className="pt-0.5 font-medium leading-relaxed">{sug}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}


                    {/* TAB 2: BULLET POINT STRENGTH COACH */}
                    {activeResultTab === 'bullets' && (
                      <div className="space-y-6">
                        <div className="bg-purple-500/5 dark:bg-purple-500/10 p-6 rounded-2xl border border-purple-500/20 space-y-3">
                          <div className="flex items-center gap-2.5">
                            <div className="bg-purple-100 dark:bg-purple-900/30 p-1.5 rounded-lg text-purple-600">
                              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-tight text-xs">Interactive Bullet Strengths</h4>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">
                            {analysis.actionVerbFeedback || "Active, metrics-driven bullet points dramatically improve your ATS success rate. Review weaker sections matched from your experience and copy our high-impact optimized versions below:"}
                          </p>
                          
                          {analysis.weakWording && analysis.weakWording.length > 0 && (
                            <div className="border-t border-purple-100 dark:border-purple-900/30 pt-4 mt-2">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 font-mono">Flagged Generic / Passive Phrases</span>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {analysis.weakWording.map((word, idx) => (
                                  <span key={idx} className="px-2.5 py-1 bg-purple-100/30 text-purple-750 dark:text-purple-400 rounded text-xs font-mono font-bold border border-purple-200/25">
                                    "{word}"
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {analysis.bulletPointStrength && analysis.bulletPointStrength.length > 0 ? (
                          <div className="space-y-6">
                            {analysis.bulletPointStrength.map((bp, idx) => (
                              <div key={idx} className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col font-sans">
                                {/* Header banner */}
                                <div className="bg-slate-50 dark:bg-slate-900 px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                  <span className="text-[11px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5 font-mono">
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                                    Coach Critique & Transformation #{idx + 1}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(bp.rewritten);
                                      setCopiedIndex(idx);
                                      toast.success("Optimized bullet copied for insertion!");
                                      setTimeout(() => setCopiedIndex(null), 2500);
                                    }}
                                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-black uppercase tracking-wide flex items-center gap-1.5 transition active:scale-95 cursor-pointer font-bold font-sans"
                                  >
                                    {copiedIndex === idx ? (
                                      <>
                                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                                        Copied
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3.5 h-3.5" />
                                        Copy Rewrite
                                      </>
                                    )}
                                  </button>
                                </div>
                                {/* Body */}
                                <div className="p-5 space-y-4">
                                  <div>
                                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-red-500 block mb-1 font-mono">Your Original Resume Bullet:</span>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 bg-red-500/5 p-3 rounded-lg border border-red-500/10 italic leading-relaxed">
                                      "{bp.original}"
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-amber-500 block mb-1 font-mono">Recruiter Critique:</span>
                                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed font-sans">
                                      {bp.critique}
                                    </p>
                                  </div>
                                  <div className="bg-emerald-500/5 dark:bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/25">
                                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 block mb-1 font-mono">High-Impact Alternate Proposal (Copy Ready):</span>
                                    <p className="text-xs font-bold text-slate-850 dark:text-white leading-relaxed font-sans">
                                      "{bp.rewritten}"
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/10 rounded-2xl border border-slate-200 dark:border-slate-800">
                            <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                            <p className="text-xs text-slate-500 uppercase tracking-widest font-black font-mono">Awaiting Resume Context</p>
                            <p className="text-[11px] text-slate-400 max-w-xs mx-auto mt-1 font-sans">If candidate details are too scarce, make sure input contains detailed work descriptions.</p>
                          </div>
                        )}
                      </div>
                    )}


                    {/* TAB 3: KEYWORDS GRID & OPTIMIZATION */}
                    {activeResultTab === 'keywords' && (
                      <div className="space-y-6">
                        <div className="bg-blue-500/5 dark:bg-blue-500/10 p-6 rounded-2xl border border-blue-200/50 dark:border-blue-900/30">
                          <div className="flex items-center gap-2.5 mb-2.5 font-sans">
                            <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-lg text-blue-600">
                              <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-tight text-xs font-sans">Target Keywords Density Summary</h4>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">
                            {analysis.keywordDensityFeedback || "To pass modern ATS filters, your resume needs correct frequency of these keywords. Here is an overview of identified terms, their target importance, and examples of how to integrate them:"}
                          </p>
                        </div>

                        {analysis.keywordOptimization && analysis.keywordOptimization.length > 0 ? (
                          <div className="grid grid-cols-1 gap-4 font-sans">
                            {analysis.keywordOptimization.map((ko, idx) => (
                              <div key={idx} className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm font-sans">
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-850 pb-2.5">
                                  <div className="flex items-center gap-2 font-sans">
                                    <span className="text-xs font-bold text-slate-900 dark:text-white font-mono bg-slate-50 dark:bg-slate-900 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-800">
                                      {ko.keyword}
                                    </span>
                                    
                                    {ko.status === 'present' ? (
                                      <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-bold uppercase text-[9px] rounded-full flex items-center gap-1 font-mono">
                                        <CheckCircle2 className="w-2.5 h-2.5" /> Present
                                      </span>
                                    ) : (
                                      <span className="px-2.5 py-0.5 bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 font-bold uppercase text-[9px] rounded-full flex items-center gap-1 font-mono">
                                        <AlertCircle className="w-2.5 h-2.5 animate-pulse" /> Missing
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono font-sans">
                                    <span>Prio Tier:</span>
                                    <span className={`px-2 py-0.5 rounded font-extrabold ${
                                      ko.importance === 'high' 
                                        ? 'bg-red-100 dark:bg-red-950/20 text-red-655 dark:text-red-400' 
                                        : ko.importance === 'medium'
                                          ? 'bg-amber-100 dark:bg-amber-950/20 text-amber-600'
                                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-450'
                                    }`}>
                                      {ko.importance}
                                    </span>
                                  </div>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                  <span className="text-[9px] font-extrabold text-slate-450 dark:text-slate-500 block mb-1 uppercase tracking-widest font-mono">Aesthetic Contextual Integration Example:</span>
                                  <p className="text-xs text-slate-600 dark:text-slate-350 italic font-medium leading-relaxed font-sans">
                                    "{ko.suggestedPhrasing}"
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          /* Backward-compatible general dual-column list */
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 font-sans">
                              <h5 className="text-[11px] font-black font-mono text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                Detected Keywords
                              </h5>
                              {analysis.presentKeywords && analysis.presentKeywords.length > 0 ? (
                                <div className="space-y-2">
                                  {analysis.presentKeywords.map((pk, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-150/50 dark:border-slate-800">
                                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono">{pk.keyword}</span>
                                      <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full font-bold">
                                        {pk.count}x
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-slate-500 italic">No job-specific keywords detected.</p>
                              )}
                            </div>

                            <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 font-sans">
                              <h5 className="text-[11px] font-black font-mono text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                                <AlertCircle className="w-4 h-4 text-amber-500 animate-pulse" />
                                Missing Keyword Terms
                              </h5>
                              {analysis.missingKeywords && analysis.missingKeywords.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {analysis.missingKeywords.map((kw, idx) => (
                                    <span key={idx} className="px-2.5 py-1.5 bg-amber-50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-900/40 text-amber-700 dark:text-amber-400 rounded-md text-[10px] font-bold tracking-wide uppercase font-mono">
                                      {kw}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-slate-500 italic font-sans">All key terms appear to be covered.</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <div className="h-[600px] flex flex-col items-center justify-center text-center space-y-6">
                    <div className="w-24 h-24 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center animate-pulse">
                      <BarChart className="w-10 h-10 text-slate-400 dark:text-slate-600" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">Ready for Analysis?</h3>
                      <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto">Paste your resume text and an optional job description to receive a comprehensive ATS compatibility report.</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      
      {isPaywallOpen && (
        <PaywallModal 
          isOpen={isPaywallOpen} 
          onClose={() => setIsPaywallOpen(false)} 
          title="Unlock Pro Analysis"
          description="You've used your 1 free analysis trial. Upgrade to Pro for unlimited resume scoring and optimization."
        />
      )}
    </div>
  );
}
