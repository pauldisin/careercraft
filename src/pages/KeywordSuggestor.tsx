import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Target, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  Copy, 
  Check, 
  FileText, 
  FileSignature, 
  ArrowRight,
  Filter,
  RefreshCw,
  TrendingUp,
  Sliders,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { apiFetch } from '../lib/api';
import GrammarCheckTextarea from '../components/GrammarCheckTextarea';
import { trackEvent } from '../lib/analytics';
import SEO from '../components/SEO';
import PaywallModal from '../components/PaywallModal';

interface ResumeListItem {
  id: string;
  title: string;
  template: string;
  created_at: string;
  updated_at: string;
}

interface KeywordSuggestion {
  keyword: string;
  category: string;
  importance: 'High' | 'Medium' | 'Low' | string;
  matchStatus: 'Found' | 'Missing' | 'Underrepresented' | string;
  reason: string;
  phrasingExample: string;
}

interface SuggestionData {
  matchScore: number;
  summary: string;
  suggestedKeywords: KeywordSuggestion[];
  atsOptimizationTips: string[];
}

export default function KeywordSuggestor() {
  const { user, dbUser } = useAuth();
  
  // State for resumes
  const [resumes, setResumes] = useState<ResumeListItem[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [isLoadingResumes, setIsLoadingResumes] = useState(false);
  
  // Inputs
  const [inputMethod, setInputMethod] = useState<'select' | 'paste'>('select');
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  
  // Analysis
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionData | null>(null);
  
  // UI controls
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterImportance, setFilterImportance] = useState<string>('all');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [hasUsedTrial, setHasUsedTrial] = useState(false);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);

  useEffect(() => {
    if (dbUser) {
      setHasUsedTrial(dbUser.has_used_analysis_trial === 1);
    }
  }, [dbUser]);

  // Fetch saved resumes on login
  useEffect(() => {
    if (user) {
      fetchResumes();
    } else {
      setInputMethod('paste');
    }
  }, [user]);

  const fetchResumes = async () => {
    setIsLoadingResumes(true);
    try {
      const resp = await apiFetch('/api/resumes');
      if (resp.ok) {
        const data = await resp.json();
        setResumes(data || []);
        if (data && data.length > 0) {
          setSelectedResumeId(data[0].id);
          loadResumeContent(data[0].id);
        } else {
          setInputMethod('paste');
        }
      } else {
        setInputMethod('paste');
      }
    } catch (err) {
      console.error('Failed to fetch resumes:', err);
      setInputMethod('paste');
    } finally {
      setIsLoadingResumes(false);
    }
  };

  const loadResumeContent = async (id: string) => {
    if (!id) return;
    try {
      const resp = await apiFetch(`/api/resumes/${id}`);
      if (resp.ok) {
        const resume = await resp.json();
        if (resume && resume.data) {
          const parsedText = parseResumeToText(resume.data);
          setResumeText(parsedText);
        }
      }
    } catch (err) {
      console.error('Failed to load resume details:', err);
      toast.error('Could not load resume data. Please paste manually.');
    }
  };

  const handleResumeSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedResumeId(id);
    loadResumeContent(id);
  };

  const parseResumeToText = (data: any): string => {
    if (!data) return '';
    let text = '';

    if (data.personalInfo) {
      const { firstName, lastName, title, professionalSummary } = data.personalInfo;
      if (firstName || lastName) text += `Name: ${firstName || ''} ${lastName || ''}\n`;
      if (title) text += `Target Role: ${title}\n`;
      if (professionalSummary) text += `Summary: ${professionalSummary}\n\n`;
    }

    if (Array.isArray(data.experiences) && data.experiences.length > 0) {
      text += 'Work Experience:\n';
      data.experiences.forEach((exp: any, idx: number) => {
        text += `- ${exp.jobTitle || 'Role'} at ${exp.company || 'Company'} (${exp.startDate || ''} - ${exp.endDate || ''})\n`;
        if (exp.location) text += `  Location: ${exp.location}\n`;
        if (exp.description) text += `  Highlights: ${exp.description}\n`;
      });
      text += '\n';
    }

    if (Array.isArray(data.skills) && data.skills.length > 0) {
      text += 'Skills:\n';
      const skillNames = data.skills.map((s: any) => typeof s === 'string' ? s : (s.name || '')).filter(Boolean);
      text += skillNames.join(', ') + '\n\n';
    }

    if (Array.isArray(data.projects) && data.projects.length > 0) {
      text += 'Projects:\n';
      data.projects.forEach((proj: any) => {
        text += `- ${proj.name || 'Project'} (${proj.role || ''}): ${proj.description || ''}\n`;
        if (proj.technologies) text += `  Tech: ${proj.technologies}\n`;
      });
      text += '\n';
    }

    if (Array.isArray(data.educations) && data.educations.length > 0) {
      text += 'Education:\n';
      data.educations.forEach((edu: any) => {
        text += `- ${edu.degree || 'Degree'} in ${edu.fieldOfStudy || ''} from ${edu.school || ''} (${edu.startDate || ''} - ${edu.endDate || ''})\n`;
      });
    }

    return text.trim();
  };

  const handleCopyText = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success('Suggested phrasing copied to clipboard!');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const runAnalysis = async () => {
    if (!resumeText.trim()) {
      toast.error('Please enter or select a resume before starting analysis.');
      return;
    }
    if (!jobDescription.trim()) {
      toast.error('Please paste a job description to optimize against.');
      return;
    }

    if (hasUsedTrial && !(dbUser && (dbUser.subscription_status === 'active' || dbUser.credits > 0))) {
      setIsPaywallOpen(true);
      return;
    }

    setIsAnalyzing(true);
    try {
      const resp = await apiFetch('/api/ai/suggest-keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText,
          jobDescription,
        }),
      });

      if (resp.ok) {
        const responseData = await resp.json();
        if (responseData && responseData.success && responseData.data) {
          setSuggestions(responseData.data);
          setHasUsedTrial(true);
          trackEvent('keyword_suggestions_generated', {
            resumeLength: resumeText.length,
            jdLength: jobDescription.length,
          });
          toast.success('Keywords analyzed successfully!');
        } else {
          throw new Error('Analysis failed to return expected suggestions.');
        }
      } else {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to complete keyword suggestion analysis.');
      }
    } catch (err: any) {
      console.error('Error during keyword suggestions:', err);
      toast.error(err.message || 'Failed to complete keyword suggestion analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Filter recommendations
  const filteredKeywords = suggestions?.suggestedKeywords.filter((k) => {
    const statusMatch = filterStatus === 'all' || k.matchStatus.toLowerCase() === filterStatus.toLowerCase();
    const importanceMatch = filterImportance === 'all' || k.importance.toLowerCase() === filterImportance.toLowerCase();
    return statusMatch && importanceMatch;
  }) || [];

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 transition-colors duration-300">
      <SEO 
        title="AI Keyword Suggestor & ATS Matcher | CareerCraft"
        description="Paste your job description alongside your resume to generate targeted keyword placement instructions that satisfy applicant tracking system scanners."
        type="website"
      />

      {/* Header and Nav */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-md shadow-indigo-100 dark:shadow-none">
              <Target className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-md sm:text-lg font-bold text-slate-900 dark:text-white leading-none">AI Keyword Suggestor</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Advanced ATS Keyword Enrichment Tool</p>
            </div>
          </div>

          {suggestions && (
            <button
              onClick={() => {
                setSuggestions(null);
                setJobDescription('');
                if (inputMethod === 'paste') setResumeText('');
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full font-semibold transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              New Matching
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Inputs Column */}
          <div className="lg:col-span-5 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5"
            >
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-2">
                <Sliders className="w-4 h-4" /> Configurator Inputs
              </h2>

              {/* Selector vs Paste Input method */}
              {user && resumes.length > 0 && (
                <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setInputMethod('select')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                      inputMethod === 'select'
                        ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    Select Saved Resume
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMethod('paste')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                      inputMethod === 'paste'
                        ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    Paste Text Manually
                  </button>
                </div>
              )}

              {inputMethod === 'select' && user && resumes.length > 0 ? (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                    Choose Your Source Resume
                  </label>
                  <select
                    value={selectedResumeId}
                    onChange={handleResumeSelectChange}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-semibold select-none text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {resumes.map((res) => (
                      <option key={res.id} value={res.id}>
                        {res.title}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-1">
                  <GrammarCheckTextarea
                    label="Paste Resume Text Content"
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    rows={10}
                    placeholder="Paste the full text of your resume here..."
                  />
                </div>
              )}

              <div className="space-y-1">
                <GrammarCheckTextarea
                  label="Target Job Description"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={8}
                  placeholder="Paste the target job outline, requirements, or responsibilities here..."
                />
              </div>

              <button
                onClick={runAnalysis}
                disabled={isAnalyzing}
                className="w-full px-5 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold uppercase tracking-widest text-xs active:scale-98 transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 dark:shadow-none disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Matching Resume...
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4" /> Optimize Keyword Suitability
                  </>
                )}
              </button>
            </motion.div>

            {/* ATS Tip Sidebar Box */}
            <div className="bg-indigo-50/50 dark:bg-indigo-950/25 border border-indigo-100 dark:border-indigo-900 rounded-2xl p-5 space-y-3.5">
              <h3 className="flex items-center gap-2 text-xs font-bold text-indigo-900 dark:text-indigo-400 uppercase tracking-wider">
                <HelpCircle className="w-4 h-4 shrink-0" /> ATS Optimization Tips
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Modern Applicant Tracking Systems don't just search for skills — they prioritize <strong>word proximity</strong> and <strong>phrasing credibility</strong>.
              </p>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <li className="flex gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                  <span>Always start bullet points with strong active action verbs.</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                  <span>Integrate complex keywords both in experience bullet lines and your skill tags block.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Output Column */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {suggestions ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Executive Score & Summary */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    <div className="md:col-span-4 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 pb-5 md:pb-0 md:pr-6">
                      <div className="relative w-32 h-32 select-none">
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                          <circle
                            className="text-slate-100 dark:text-slate-800 stroke-current"
                            strokeWidth="8"
                            fill="transparent"
                            r="42"
                            cx="50"
                            cy="50"
                          />
                          <circle
                            className="text-indigo-600 stroke-current transition-all duration-1000 ease-out"
                            strokeWidth="8"
                            strokeDasharray={264}
                            strokeDashoffset={264 - (264 * suggestions.matchScore) / 100}
                            strokeLinecap="round"
                            fill="transparent"
                            r="42"
                            cx="50"
                            cy="50"
                            transform="rotate(-90 50 50)"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">
                            {suggestions.matchScore}
                          </span>
                          <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest mt-1">
                            Match Score
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-8 flex flex-col justify-center space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full font-mono">
                          Optimized Alignment Report
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-indigo-500" /> ATS Compatibility Peak
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-850 dark:text-slate-200 uppercase tracking-wider">
                        Executive Optimization Summary
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic">
                        "{suggestions.summary}"
                      </p>
                    </div>
                  </div>

                  {/* Filters Toolbar */}
                  <div className="bg-slate-100/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 sm:px-6 sm:py-4 flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Filters</span>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] uppercase font-bold text-slate-450">Match status:</span>
                        <select
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                          className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold py-1 px-2 text-slate-700 dark:text-slate-300 focus:outline-none"
                        >
                          <option value="all">All Statuses</option>
                          <option value="Found">Found</option>
                          <option value="Missing">Missing</option>
                          <option value="Underrepresented">Underrepresented</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] uppercase font-bold text-slate-450">Priority:</span>
                        <select
                          value={filterImportance}
                          onChange={(e) => setFilterImportance(e.target.value)}
                          className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold py-1 px-2 text-slate-700 dark:text-slate-300 focus:outline-none"
                        >
                          <option value="all">All Priorities</option>
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Suggestions List */}
                  {filteredKeywords.length > 0 ? (
                    <div className="space-y-4">
                      {filteredKeywords.map((rec, idx) => (
                        <div
                          key={idx}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-200"
                        >
                          {/* Card header */}
                          <div className="bg-slate-50 dark:bg-slate-950 px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 flex-wrap">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <span className="text-xs font-black text-slate-850 dark:text-white bg-slate-200/50 dark:bg-slate-900 px-3 py-1 rounded-md border border-slate-300/30 dark:border-slate-850">
                                {rec.keyword}
                              </span>

                              {rec.matchStatus === 'Found' ? (
                                <span className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-750 dark:text-emerald-400 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Found
                                </span>
                              ) : rec.matchStatus === 'Underrepresented' ? (
                                <span className="bg-blue-50 dark:bg-blue-950/20 text-blue-750 dark:text-blue-400 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                  <RefreshCw className="w-3 h-3 animate-spin duration-3000" /> Underrepresented
                                </span>
                              ) : (
                                <span className="bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3 animate-pulse" /> Missing
                                </span>
                              )}

                              <span className="text-slate-400 text-xs font-bold capitalize">
                                • {rec.category}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">
                                Priority:
                              </span>
                              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase font-mono ${
                                rec.importance.toLowerCase() === 'high'
                                  ? 'bg-red-50 dark:bg-red-950/20 text-red-500'
                                  : rec.importance.toLowerCase() === 'medium'
                                    ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                              }`}>
                                {rec.importance}
                              </span>
                            </div>
                          </div>

                          {/* Card body */}
                          <div className="p-5 space-y-4 font-sans">
                            <div>
                              <span className="text-[9px] font-black uppercase tracking-widest text-slate-405 dark:text-slate-500 block mb-1 font-mono">
                                Optimization Justification & Context:
                              </span>
                              <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed font-semibold">
                                {rec.reason}
                              </p>
                            </div>

                            {/* Proposed action placement */}
                            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-150/50 dark:border-slate-850 p-4 rounded-xl relative group">
                              <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 block mb-1 font-mono">
                                Ready-to-Use High-Impact Phrasing (Copy-ready):
                              </span>
                              <p className="text-xs font-bold text-slate-900 dark:text-slate-200 leading-relaxed pr-10">
                                "{rec.phrasingExample}"
                              </p>

                              <button
                                type="button"
                                onClick={() => handleCopyText(rec.phrasingExample, idx)}
                                className="absolute right-3.5 top-3.5 p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-xs cursor-pointer"
                                title="Copy integration bullet"
                              >
                                {copiedIndex === idx ? (
                                  <Check className="w-4 h-4 text-emerald-500 animate-bounce" />
                                ) : (
                                  <Copy className="w-4 h-4 text-slate-450 hover:text-slate-650" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-250/20 rounded-2xl">
                      <Target className="w-8 h-8 text-slate-450 mx-auto opacity-50 mb-3" />
                      <p className="text-xs uppercase tracking-widest font-bold text-slate-500">No suggestions match filters</p>
                      <p className="text-xs text-slate-400/80 mt-1">Try relaxing your filter parameters to view other keyword indicators.</p>
                    </div>
                  )}

                  {/* ATS Strategy Panel */}
                  {suggestions.atsOptimizationTips && suggestions.atsOptimizationTips.length > 0 && (
                    <div className="bg-[#1e293b]/5 dark:bg-[#0f172a]/40 border border-slate-200 dark:border-slate-850 rounded-2xl p-6 space-y-4">
                      <h4 className="text-sm font-semibold text-slate-850 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2">
                        <Sparkles className="w-4.5 h-4.5 text-indigo-500" /> Complete ATS Strategic Audit Tips
                      </h4>
                      <ul className="space-y-3">
                        {suggestions.atsOptimizationTips.map((tip, index) => (
                          <li key={index} className="text-xs text-slate-750 dark:text-slate-400 flex items-start gap-2 leading-relaxed">
                            <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-400 shrink-0 mt-0.5 font-mono">
                              {index + 1}
                            </span>
                            <span className="pt-0.5 font-medium">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.8 }}
                  className="h-[600px] flex flex-col items-center justify-center text-center bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-850 rounded-3xl p-8"
                >
                  <div className="w-20 h-20 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-full flex items-center justify-center mb-5 animate-pulse">
                    <Target className="w-8 h-8 text-indigo-500" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white">Awaiting Matching Configuration</h3>
                  <p className="text-xs text-slate-450 dark:text-slate-400 max-w-sm mt-1.5 leading-relaxed">
                    Provide your target job context and resume above to render visual placement tips, match scores, importance weights, and copyable phrasings.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>

      {isPaywallOpen && (
        <PaywallModal 
          isOpen={isPaywallOpen} 
          onClose={() => setIsPaywallOpen(false)} 
          title="Unlock Keyword Suggestor"
          description="Upgrade to Pro for unlimited keyword matching alignments and ATS phrase optimization."
        />
      )}
    </div>
  );
}
