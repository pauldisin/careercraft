import { useState, useEffect, useRef, Fragment } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  Search, 
  Layers, 
  Gauge, 
  Zap, 
  RefreshCw, 
  ChevronRight, 
  ListTodo, 
  FileCheck, 
  BookOpen, 
  Code2 
} from 'lucide-react';
import { ResumeData } from '../types';

interface AtsCompatibilityIndicatorProps {
  data: ResumeData;
  pdfFontScale: number;
  onNavigateToSection: (sectionId: string, stepIndex: number) => void;
}

interface AtsReport {
  overallScore: number;
  keywordScore: number;
  formatScore: number;
  structureScore: number;
  matchedActionVerbs: string[];
  matchedIndustryKeywords: string[];
  missingIndustryKeywords: string[];
  issues: {
    id: string;
    type: 'critical' | 'warning' | 'info' | 'success';
    message: string;
    suggestion: string;
    sectionId: string;
    stepIndex: number;
  }[];
}

const INDUSTRY_PRESETS: Record<string, string[]> = {
  'Software Engineer': ['react', 'typescript', 'javascript', 'node.js', 'api', 'database', 'aws', 'cloud', 'git', 'docker', 'system design', 'agile'],
  'Product Manager': ['strategy', 'roadmap', 'agile', 'scrum', 'analytics', 'stakeholders', 'product lifecycle', 'kpis', 'cross-functional', 'user research'],
  'Data Professional': ['python', 'sql', 'machine learning', 'tableau', 'statistics', 'modeling', 'big data', 'pandas', 'visualization', 'data analytics'],
  'Sales & Marketing': ['sales', 'revenue', 'campaign', 'seo', 'crm', 'pipeline', 'lead generation', 'negotiation', 'social media', 'roi', 'growth'],
  'General Management': ['leadership', 'operations', 'budget', 'project management', 'collaboration', 'stakeholders', 'improvement', 'strategic planning', 'efficiency'],
};

// Expanded active ATS action verbs
const COMMON_ACTION_VERBS = [
  'developed', 'managed', 'designed', 'optimized', 'implemented', 'achieved', 
  'streamlined', 'analyzed', 'facilitated', 'increased', 'led', 'architected', 
  'engineered', 'spearheaded', 'automated', 'coordinated', 'transformed', 
  'conceptualized', 'formulated', 'negotiated', 'launched', 'scaled'
];

export default function AtsCompatibilityIndicator({ 
  data, 
  pdfFontScale, 
  onNavigateToSection 
}: AtsCompatibilityIndicatorProps) {
  const [selectedDomain, setSelectedDomain] = useState<string>('Software Engineer');
  const [customKeywordsInput, setCustomKeywordsInput] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [report, setReport] = useState<AtsReport | null>(null);

  // Run analyzing periodically when resume data or settings change
  useEffect(() => {
    setIsScanning(true);
    const timer = setTimeout(() => {
      calculateAtsScore();
      setIsScanning(false);
    }, 800); // 800ms debounce simulation for standard periodic scan feel

    return () => clearTimeout(timer);
  }, [data, pdfFontScale, selectedDomain, customKeywordsInput]);

  const calculateAtsScore = () => {
    // 1. Gather all content as clean lowercased string for search/match checks
    const pInfo = data.personalInfo || { fullName: '', email: '', phone: '', location: '', jobTitle: '', linkedin: '' };
    const summaryText = (data.summary || '').toLowerCase();
    
    const experienceBulletsText = (data.experiences || [])
      .flatMap(exp => exp.bulletPoints || [])
      .join(' ')
      .toLowerCase();
    
    const experienceRolesText = (data.experiences || [])
      .map(exp => exp.role || '')
      .join(' ')
      .toLowerCase();

    const skillsText = (data.skills || '').toLowerCase() + ',' + 
      (data.skillsWithLevels || []).map(s => s.name).join(',').toLowerCase();

    const projectsText = (data.projects || [])
      .map(p => `${p.name} ${p.description} ${p.technologies || ''}`)
      .join(' ')
      .toLowerCase();

    const allTextCombined = `
      ${pInfo.fullName || ''} ${pInfo.jobTitle || ''} 
      ${summaryText} 
      ${experienceBulletsText} ${experienceRolesText} 
      ${skillsText} 
      ${projectsText}
    `.toLowerCase();

    let score = 0;
    const issues: AtsReport['issues'] = [];

    // --- SECTION A: Formatting & Layout Compliance (Max 35 pts) ---
    let formatScore = 0;
    
    // Check 1: Sizing bounds
    if (pdfFontScale >= 0.85 && pdfFontScale <= 1.15) {
      formatScore += 10;
    } else {
      issues.push({
        id: 'font-scale',
        type: 'warning',
        message: 'Font Scaling Warning',
        suggestion: `Your current PDF font scale (${Math.round(pdfFontScale * 100)}%) is too extreme. Sparing rules for optimal parsing require scale values between 85% and 115%. Use the 'Auto-Fit' button or Reset.`,
        sectionId: 'preview',
        stepIndex: 9,
      });
    }

    // Check 2: Bullet points presence in experience
    const exps = data.experiences || [];
    if (exps.length > 0) {
      const missingBullets = exps.some(exp => (exp.bulletPoints || []).length === 0);
      if (!missingBullets) {
        formatScore += 15;
      } else {
        formatScore += 5;
        issues.push({
          id: 'missing-bullets',
          type: 'critical',
          message: 'Paragraph Text Detected',
          suggestion: 'Some work experience entries lack bullet achievements. Standard parsing filters are optimized for quick summary scanning of listed bullet points starting with action verbs.',
          sectionId: 'experience',
          stepIndex: 3,
        });
      }
    } else {
      issues.push({
        id: 'no-experience',
        type: 'critical',
        message: 'No Experience Entries',
        suggestion: 'Add at least 1 professional work experience entry to set up your primary timeline block.',
        sectionId: 'experience',
        stepIndex: 3,
      });
    }

    // Check 3: Essential Contact Fields Presence
    let contactScore = 10;
    if (!pInfo.email || !pInfo.email.trim()) {
      contactScore -= 3;
      issues.push({
        id: 'contact-email',
        type: 'critical',
        message: 'Primary Contact Email Missing',
        suggestion: 'Specify your email address at the top. Recruiters require structured contact fields for automated outreach databases.',
        sectionId: 'personal-info',
        stepIndex: 1,
      });
    }
    if (!pInfo.phone || !pInfo.phone.trim()) {
      contactScore -= 3;
      issues.push({
        id: 'contact-phone',
        type: 'warning',
        message: 'Direct Calling Phone Missing',
        suggestion: 'Add your active phone details to ensure automatic profile contact parsing.',
        sectionId: 'personal-info',
        stepIndex: 1,
      });
    }
    if (!pInfo.location || !pInfo.location.trim()) {
      contactScore -= 4;
      issues.push({
        id: 'contact-location',
        type: 'warning',
        message: 'Geographical Location Missing',
        suggestion: 'Recruiters filter profiles by Region/City. Add your City & Country details.',
        sectionId: 'personal-info',
        stepIndex: 1,
      });
    }
    formatScore += contactScore;

    // --- SECTION B: Structure & Length (Max 30 pts) ---
    let structureScore = 0;

    // Check 1: Section balance
    let sectionsFound = 0;
    if (pInfo.fullName) sectionsFound++;
    if (summaryText.length > 0) sectionsFound++;
    if (exps.length > 0) sectionsFound++;
    if (skillsText.length > 5) sectionsFound++;
    if ((data.educations || []).length > 0) sectionsFound++;

    if (sectionsFound >= 5) {
      structureScore += 15;
    } else {
      structureScore += sectionsFound * 2.5;
      issues.push({
        id: 'lean-structure',
        type: 'warning',
        message: 'Lean Document Structure',
        suggestion: `Your document currently features ${sectionsFound}/5 of primary candidate sections. Maximize fields across Personal, Summary, Experience, Skills, and Education.`,
        sectionId: 'summary',
        stepIndex: 2,
      });
    }

    // Check 2: Word Count / Density density
    const totalWords = allTextCombined.split(/\s+/).filter(Boolean).length;
    if (totalWords >= 250 && totalWords <= 700) {
      structureScore += 15;
    } else if (totalWords > 0 && totalWords < 250) {
      structureScore += 7;
      issues.push({
        id: 'length-short',
        type: 'info',
        message: 'Low Document Density',
        suggestion: 'Your resume is slightly sparse. Expand descriptions, details, or listed skills to achieve optimal ATS density (250 - 700 words).',
        sectionId: 'summary',
        stepIndex: 2,
      });
    } else if (totalWords > 700) {
      structureScore += 10;
      issues.push({
        id: 'length-long',
        type: 'info',
        message: 'Excessive Document Length',
        suggestion: `Currently at ${totalWords} words. Resumes exceeding 700 words are vulnerable to content indexing drop-offs. Try streamlining bullet achievements.`,
        sectionId: 'experience',
        stepIndex: 3,
      });
    }

    // --- SECTION C: Action Verbs & Keywords Analysis (Max 35 pts) ---
    let keywordScore = 0;

    // Verb checking
    const foundVerbs = COMMON_ACTION_VERBS.filter(verb => allTextCombined.includes(verb));
    const verbMatchFraction = Math.min(foundVerbs.length / 5, 1); // target at least 5 action verbs
    keywordScore += Math.round(verbMatchFraction * 15);

    if (foundVerbs.length < 5) {
      issues.push({
        id: 'action-verbs',
        type: 'warning',
        message: 'Active Action Verbs Sparseness',
        suggestion: `Identified only ${foundVerbs.length} high-impact Action Verbs. Incorporate terms like 'architected', 'spearheaded', 'optimized', 'scaled', 'streamlined' into your job bullet achievements.`,
        sectionId: 'experience',
        stepIndex: 3,
      });
    }

    // Skill Tag quantity
    const uniqueSkillsCount = (data.skills || '').split(',').map(s => s.trim()).filter(Boolean).length +
      (data.skillsWithLevels || []).length;
    
    if (uniqueSkillsCount >= 8) {
      keywordScore += 10;
    } else if (uniqueSkillsCount >= 4) {
      keywordScore += 6;
      issues.push({
        id: 'skills-lean',
        type: 'info',
        message: 'List More Core Skills',
        suggestion: `Your resume lists ${uniqueSkillsCount} skills. Try documenting at least 8 specialized core technical and key soft keyword tags to improve scanning hit-rates.`,
        sectionId: 'skills',
        stepIndex: 7,
      });
    } else {
      issues.push({
        id: 'skills-missing',
        type: 'critical',
        message: 'Fitted Skill Tag Module Necessary',
        suggestion: 'Structured skill elements are standard benchmarks for search terms matching. Highlight key terminology tags for automated filtration.',
        sectionId: 'skills',
        stepIndex: 7,
      });
    }

    // Target Industry / Custom Keyword Match
    let industryKeywords: string[] = [];
    if (selectedDomain && INDUSTRY_PRESETS[selectedDomain]) {
      industryKeywords = [...INDUSTRY_PRESETS[selectedDomain]];
    }

    // Blend user input keywords if supplied 
    if (customKeywordsInput.trim()) {
      const userSplits = customKeywordsInput.toLowerCase().split(/[,,;|]+/)
        .map(kw => kw.trim())
        .filter(Boolean);
      if (userSplits.length > 0) {
        industryKeywords = [...new Set([...industryKeywords, ...userSplits])];
      }
    }

    const matchedKeywords: string[] = [];
    const missingKeywords: string[] = [];

    industryKeywords.forEach(kw => {
      // Create flexible regex to match keywords as whole words or clear substrings
      try {
        const escaped = kw.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(`\\b${escaped}\\b`, 'i');
        if (regex.test(allTextCombined) || allTextCombined.includes(kw.toLowerCase())) {
          matchedKeywords.push(kw);
        } else {
          missingKeywords.push(kw);
        }
      } catch (e) {
        if (allTextCombined.includes(kw.toLowerCase())) {
          matchedKeywords.push(kw);
        } else {
          missingKeywords.push(kw);
        }
      }
    });

    if (industryKeywords.length > 0) {
      const matchPercentage = matchedKeywords.length / industryKeywords.length;
      keywordScore += Math.round(matchPercentage * 10);
      
      if (matchPercentage < 0.6) {
        issues.push({
          id: 'targeted-keywords',
          type: 'warning',
          message: `${selectedDomain} Keyword Check`,
          suggestion: `Incorporate targeted technical terms: ${missingKeywords.slice(0, 4).join(', ')} to boost alignment indices.`,
          sectionId: 'skills',
          stepIndex: 7,
        });
      }
    } else {
      // default padding if no presets exist
      keywordScore += 10;
    }

    // Total Overall Score (Format + Structure + Keywords) Sum = 35 + 30 + 35 = 100
    const overallScore = Math.min(100, formatScore + structureScore + keywordScore);

    // Sort issues: active critical first, followed by warning, info, and success items
    const severityMap = { critical: 0, warning: 1, info: 2, success: 3 };
    const sortedIssues = [...issues].sort((a, b) => severityMap[a.type] - severityMap[b.type]);

    setReport({
      overallScore: isNaN(overallScore) ? 0 : overallScore,
      keywordScore,
      formatScore,
      structureScore,
      matchedActionVerbs: foundVerbs,
      matchedIndustryKeywords: matchedKeywords,
      missingIndustryKeywords: missingKeywords,
      issues: sortedIssues
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500 stroke-emerald-500';
    if (score >= 50) return 'text-amber-500 stroke-amber-500';
    return 'text-rose-500 stroke-rose-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-500/10';
    if (score >= 50) return 'bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-500/10';
    return 'bg-rose-50 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-500/10';
  };

  const getSaturateColor = (score: number) => {
    if (score >= 80) return 'from-emerald-500 to-teal-550 dark:from-emerald-600 dark:to-teal-500';
    if (score >= 50) return 'from-amber-500 to-orange-550 dark:from-amber-600 dark:to-orange-500';
    return 'from-rose-500 to-red-550 dark:from-rose-600 dark:to-red-500';
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 w-full" id="ats-indicator-wrapper">
      {/* Scrollable analysis panel body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        
        {/* Real-time Indicator Dashboard */}
        <div className="bg-white dark:bg-slate-850 rounded-3xl p-5 border border-slate-100 dark:border-slate-800/80 shadow-md relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute -top-12 -left-12 w-28 h-28 bg-indigo-500/5 blur-[35px] rounded-full pointer-events-none" />
          
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-slate-400 dark:text-slate-505">
              Live Engine Parsing
            </span>
            <div className="flex items-center gap-1.5 text-xs text-slate-505 font-medium">
              {isScanning ? (
                <>
                  <RefreshCw className="w-3 h-3 text-indigo-500 animate-spin" />
                  <span className="text-indigo-550 dark:text-indigo-400">Scanning details...</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Real-time Synced</span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center py-4 text-center">
            {/* Circular Progress Ring */}
            <div className="relative w-32 h-32 flex items-center justify-center mb-4 select-none">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                {/* Track circle */}
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  className="stroke-slate-100 dark:stroke-slate-800"
                  strokeWidth="8"
                  fill="transparent"
                />
                {/* Score bar circle */}
                <motion.circle
                  cx="60"
                  cy="60"
                  r="50"
                  className={getScoreColor(report?.overallScore || 0)}
                  strokeWidth="10"
                  strokeDasharray={`${2 * Math.PI * 50}`}
                  initial={{ strokeDashoffset: `${2 * Math.PI * 50}` }}
                  animate={{ 
                    strokeDashoffset: `${2 * Math.PI * 50 * (1 - (report?.overallScore || 0) / 100)}` 
                  }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              
              {/* Score Value inside progress block */}
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-3xl font-serif font-black text-slate-900 dark:text-white leading-none">
                  {report?.overallScore || 0}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-505 font-bold uppercase tracking-wider mt-1">
                  % COMPATIBLE
                </span>
              </div>
            </div>

            {/* Score rating subtitle */}
            <div className="w-full">
              <div className={`px-4 py-2 rounded-2xl text-xs font-bold ${getScoreBg(report?.overallScore || 0)} flex items-center justify-center gap-1.5`}>
                <Gauge className="w-4 h-4 shrink-0" />
                <span>
                  Estimated ATS Rating: {(report?.overallScore || 0) >= 80 ? 'Excellent Match' : (report?.overallScore || 0) >= 50 ? 'Medium Match' : 'Unoptimized'}
                </span>
              </div>
              <p className="text-[11px] text-slate-450 dark:text-slate-400 mt-2.5 leading-relaxed max-w-xs mx-auto">
                Based on parsing compatibility patterns, structural tags, font bounds, action keyword richness, and ATS-layout standard norms.
              </p>
            </div>
          </div>
        </div>

        {/* Modular Analysis Domain Preset Panel Selector */}
        <div className="space-y-3 bg-white dark:bg-slate-850 rounded-3xl p-5 border border-slate-100 dark:border-slate-800/80 shadow-md">
          <div className="flex items-center gap-1.5 text-xs text-indigo-650 dark:text-indigo-400 font-extrabold uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            <span>Target Role & Keyword Matcher</span>
          </div>
          <p className="text-[11px] text-slate-505 leading-relaxed">
            Test candidate keyword matches against common technical roles, or add custom targeted job keywords below.
          </p>

          <div className="space-y-4 pt-1">
            {/* Domain Dropdown Selector */}
            <div className="relative">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block mb-1 uppercase">Target Domain Preset</label>
              <select
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-850 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                id="select-ats-domain-preset"
              >
                {Object.keys(INDUSTRY_PRESETS).map((domain) => (
                  <option key={domain} value={domain}>{domain}</option>
                ))}
              </select>
            </div>

            {/* Custom Job Description Keywords Input */}
            <div className="relative">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block mb-1 uppercase">
                Custom Target Keywords (Optional)
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="e.g. Kubernetes, Golang, Leadership, Spanish"
                  value={customKeywordsInput}
                  onChange={(e) => setCustomKeywordsInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 text-xs text-slate-700 dark:text-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-400"
                  id="input-ats-custom-keywords"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3" />
              </div>
            </div>

            {/* Keyword Match Visual feedback tags */}
            {report && (report.matchedIndustryKeywords.length > 0 || report.missingIndustryKeywords.length > 0) && (
              <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3.5 mt-2 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-405">Target Keyword Match Ratio</span>
                  <span className="text-xs font-mono font-black text-indigo-600 dark:text-indigo-400">
                    {report.matchedIndustryKeywords.length} / {report.matchedIndustryKeywords.length + report.missingIndustryKeywords.length} Matched
                  </span>
                </div>
                
                {/* Horizontal Progress mini */}
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full"
                    style={{ 
                      width: `${((report.matchedIndustryKeywords.length / (report.matchedIndustryKeywords.length + report.missingIndustryKeywords.length || 1)) * 100)}%` 
                    }}
                  />
                </div>

                {/* Grid list matched vs missing */}
                <div className="space-y-2 mt-2">
                  {report.matchedIndustryKeywords.length > 0 && (
                    <div>
                      <span className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 block mb-1 tracking-wider">
                        Matched keywords ({report.matchedIndustryKeywords.length})
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {report.matchedIndustryKeywords.slice(0, 12).map((kw) => (
                          <span 
                            key={kw} 
                            className="text-[9px] font-bold px-2 py-0.5 bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 rounded-md border border-emerald-500/10"
                          >
                            ✓ {kw}
                          </span>
                        ))}
                        {report.matchedIndustryKeywords.length > 12 && (
                          <span className="text-[9px] text-slate-400 font-bold px-1.5 py-0.5">
                            +{report.matchedIndustryKeywords.length - 12} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {report.missingIndustryKeywords.length > 0 && (
                    <div>
                      <span className="text-[9px] font-black uppercase text-slate-450 dark:text-slate-500 block mb-1 tracking-wider">
                        Missing Technical Terms ({report.missingIndustryKeywords.length})
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {report.missingIndustryKeywords.slice(0, 10).map((kw) => (
                          <span 
                            key={kw} 
                            className="text-[9px] font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 rounded-md border border-slate-200/40 dark:border-slate-800/60"
                          >
                            + {kw}
                          </span>
                        ))}
                        {report.missingIndustryKeywords.length > 10 && (
                          <span className="text-[9px] text-slate-400 font-bold px-1.5 py-0.5">
                            +{report.missingIndustryKeywords.length - 10} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* List of optimization recommendation points */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-800 dark:text-slate-200 font-extrabold uppercase tracking-wider">
            <ListTodo className="w-4 h-4 text-slate-500" />
            <span>Optimization Checklist</span>
          </div>

          <div className="space-y-2.5">
            {report?.issues && report.issues.length > 0 ? (
              report.issues.map((issue) => (
                <div 
                  key={issue.id} 
                  className={`p-4 rounded-2xl border transition-all hover:bg-slate-50/40 dark:hover:bg-slate-850/40 relative overflow-hidden group ${
                    issue.type === 'critical' ? 'bg-rose-50/30 dark:bg-rose-950/5 border-rose-100 dark:border-rose-900/30' :
                    issue.type === 'warning' ? 'bg-amber-50/20 dark:bg-amber-955/5 border-amber-100 dark:border-amber-900/30' :
                    'bg-slate-50/50 dark:bg-slate-850/50 border-slate-150 dark:border-slate-800/80'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {issue.type === 'critical' ? (
                      <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    ) : issue.type === 'warning' ? (
                      <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    ) : (
                      <Info className="w-5 h-5 text-slate-450 dark:text-slate-400 shrink-0 mt-0.5" />
                    )}

                    <div className="flex-1 space-y-1">
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {issue.message}
                        <span className={`text-[9px] px-1.5 py-0.2 uppercase font-black rounded-sm ${
                          issue.type === 'critical' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-450' :
                          issue.type === 'warning' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-450' :
                          'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {issue.type === 'critical' ? 'Critical' : issue.type === 'warning' ? 'Warning' : 'Info'}
                        </span>
                      </h5>
                      <p className="text-[11px] text-slate-505 leading-relaxed">{issue.suggestion}</p>
                      
                      {/* Navigate to Section Button */}
                      <button
                        onClick={() => onNavigateToSection(issue.sectionId, issue.stepIndex)}
                        className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 pt-1.5 inline-flex cursor-pointer transition-colors"
                        id={`fix-${issue.id}-btn`}
                      >
                        Navigate to Section <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-emerald-50/30 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 p-5 rounded-3xl text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <h5 className="text-sm font-bold text-emerald-800 dark:text-emerald-450">Perfect ATS Compliance!</h5>
                <p className="text-xs text-emerald-600 dark:text-emerald-400/80 mt-1 max-w-xs mx-auto leading-relaxed">
                  Excellent work! Your resume formatting structure, font limits, and keyword criteria pass standard verification tests cleanly.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ATS Parsing Explainer Tip */}
        <div className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-850 dark:to-slate-850 rounded-2xl p-4 border border-slate-150 dark:border-slate-800/80 flex items-start gap-3">
          <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-[10px] text-slate-505 leading-relaxed">
            <span className="font-bold">What is ATS friendliness?</span> Application Tracking Systems scan candidates for specific roles by looking for standard semantic tags (e.g., Professional Experience), high matching coefficients of domain keyword skills, and simple layouts that avoid complex formatting barriers.
          </div>
        </div>

      </div>

      {/* Decorative Brand Footer */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 text-center shrink-0">
        <span className="text-[9px] uppercase tracking-[0.25em] font-black text-slate-400">
          CareerCraft ATS Analyzer V1.2.0
        </span>
      </div>
    </div>
  );
}
