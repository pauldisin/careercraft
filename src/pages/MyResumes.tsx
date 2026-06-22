import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { exportElementToPDF } from '../lib/pdfExporter';
import { motion } from 'motion/react';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Calendar, 
  LayoutTemplate,
  Loader2,
  Search,
  ChevronRight,
  AlertCircle,
  History,
  RotateCcw,
  X,
  Eye,
  FileDown,
  GitCompare,
  ArrowLeftRight,
  Award,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AnimatePresence } from 'motion/react';
import { apiFetch } from '../lib/api';
import { trackEvent } from '../lib/analytics';

interface ResumeSummary {
  id: string;
  title: string;
  template: string;
  created_at: string;
  updated_at: string;
  data?: string;
}

interface ResumeVersion {
  id: string;
  created_at: string;
  template: string;
}

const calculateATSScore = (dataStr?: string): number => {
  if (!dataStr) return 0;
  try {
    const resumeData = JSON.parse(dataStr);
    let score = 0;

    // 1. Personal Information (Max 25 pts)
    let pInfoScore = 0;
    const pi = resumeData.personalInfo || {};
    if (pi.fullName && pi.fullName.trim()) pInfoScore += 5;
    if (pi.jobTitle && pi.jobTitle.trim()) pInfoScore += 5;
    if (pi.email && pi.email.trim()) pInfoScore += 5;
    if (pi.phone && pi.phone.trim()) pInfoScore += 5;
    if (pi.location && pi.location.trim()) pInfoScore += 5;
    score += pInfoScore;

    // 2. Summary (Max 15 pts)
    let summaryScore = 0;
    const cleanSummary = (resumeData.summary || "").trim();
    if (cleanSummary.length > 120) {
      summaryScore = 15;
    } else if (cleanSummary.length > 40) {
      summaryScore = 10;
    } else if (cleanSummary.length > 0) {
      summaryScore = 5;
    }
    score += summaryScore;

    // 3. Experience (Max 25 pts)
    let expScore = 0;
    const exps = resumeData.experiences || [];
    if (exps.length >= 2) {
      expScore += 15;
    } else if (exps.length === 1) {
      expScore += 10;
    }
    
    if (exps.length > 0) {
      const averageBullets = exps.reduce((acc: number, exp: any) => acc + (exp.bulletPoints || []).length, 0) / exps.length;
      if (averageBullets >= 3) {
        expScore += 10;
      } else if (averageBullets > 0) {
        expScore += 5;
      }
    }
    score += expScore;

    // 4. Education (Max 15 pts)
    let eduScore = 0;
    const edus = resumeData.educations || [];
    if (edus.length >= 1) {
      eduScore += 10;
      const hasDegree = edus.some((e: any) => e.degree && e.degree.trim() && e.graduationYear);
      if (hasDegree) {
        eduScore += 5;
      }
    }
    score += eduScore;

    // 5. Skills (Max 10 pts)
    let skillsScore = 0;
    const skillsList = (resumeData.skills || "").split(",").map((s: string) => s.trim()).filter(Boolean);
    if (skillsList.length >= 6) {
      skillsScore = 10;
    } else if (skillsList.length >= 3) {
      skillsScore = 6;
    } else if (skillsList.length > 0) {
      skillsScore = 3;
    }
    score += skillsScore;

    // 6. Extras (Max 10 pts)
    let extraScore = 0;
    const hasProjects = (resumeData.projects || []).length > 0;
    const hasCerts = (resumeData.certifications || []).length > 0;
    const hasAchievements = (resumeData.achievements || []).length > 0;
    
    if (hasProjects) extraScore += 4;
    if (hasCerts) extraScore += 3;
    if (hasAchievements) extraScore += 3;
    score += extraScore;

    return Math.min(100, Math.max(0, score));
  } catch (e) {
    console.error("Error parsing resume data for scoring:", e);
    return 0;
  }
};

export default function MyResumes() {
  const [resumes, setResumes] = useState<ResumeSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResumeForHistory, setSelectedResumeForHistory] = useState<ResumeSummary | null>(null);
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [isReverting, setIsReverting] = useState<string | null>(null);
  
  const [previewResume, setPreviewResume] = useState<ResumeSummary | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [expandedResumes, setExpandedResumes] = useState<Record<string, { data: any, isLoading: boolean }>>({});
  const [expandedVersions, setExpandedVersions] = useState<Record<string, boolean>>({});
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<'pdf' | 'docx' | 'rtf'>('pdf');
  const previewRef = useRef<HTMLDivElement>(null);

  // Comparison View state
  const [comparingResume, setComparingResume] = useState<ResumeSummary | null>(null);
  const [compareVersionA, setCompareVersionA] = useState<string>('current');
  const [compareVersionB, setCompareVersionB] = useState<string>('');
  const [compareDataA, setCompareDataA] = useState<any>(null);
  const [compareDataB, setCompareDataB] = useState<any>(null);
  const [isLoadingCompareA, setIsLoadingCompareA] = useState(false);
  const [isLoadingCompareB, setIsLoadingCompareB] = useState(false);
  const [compareVersions, setCompareVersions] = useState<ResumeVersion[]>([]);
  const [isLoadingCompareVersions, setIsLoadingCompareVersions] = useState(false);
  
  const navigate = useNavigate();

  const fetchResumeDataForPreview = async (resumeId: string) => {
    if (expandedResumes[resumeId]?.data) return;

    setExpandedResumes(prev => ({ ...prev, [resumeId]: { data: null, isLoading: true } }));
    try {
      const response = await apiFetch(`/api/resumes/${resumeId}`);
      if (!response.ok) throw new Error('Failed to fetch resume');
      const data = await response.json();
      setExpandedResumes(prev => ({ ...prev, [resumeId]: { data: data.data, isLoading: false } }));
    } catch (error) {
      toast.error('Could not load summary');
      setExpandedResumes(prev => ({ ...prev, [resumeId]: { data: null, isLoading: false } }));
    }
  };

  const handleDownload = async (format: 'pdf' | 'docx' | 'rtf') => {
    if (!previewData || !previewResume) return;
    
    setIsDownloading(true);
    setDownloadFormat(format);
    
    try {
      if (format === 'pdf' && previewRef.current) {
        const filename = `${previewData.personalInfo?.fullName || 'Resume'}.pdf`;
        await exportElementToPDF(previewRef.current, {
          filename,
          onError: (err) => {
            throw err;
          }
        });
        toast.success("Resume downloaded as PDF");
        trackEvent('download_resume', { format });
        return;
      }

      const exportData = {
        ...previewData,
        template: previewResume.template
      };

      const response = await apiFetch(`/api/export/${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exportData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to generate ${format.toUpperCase()}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${previewData.personalInfo?.fullName || 'Resume'}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      trackEvent('download_resume', { format });
    } catch (error: any) {
      toast.error(error.message || `Failed to generate ${format.toUpperCase()}`);
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const response = await apiFetch('/api/resumes');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `Failed to fetch resumes (${response.status})`);
      }
      const data = await response.json();
      setResumes(data);
    } catch (error: any) {
      console.error('Error fetching resumes:', error);
      toast.error(error.message || 'Could not load your resumes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this resume?')) return;

    try {
      const response = await apiFetch(`/api/resumes/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `Failed to delete (${response.status})`);
      }
      setResumes(resumes.filter(r => r.id !== id));
      toast.success('Resume deleted');
      trackEvent('delete_resume');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete resume');
    }
  };

  const fetchVersions = async (resume: ResumeSummary) => {
    setSelectedResumeForHistory(resume);
    setIsLoadingVersions(true);
    try {
      const response = await apiFetch(`/api/resumes/${resume.id}/versions`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `Failed to fetch versions (${response.status})`);
      }
      const data = await response.json();
      setVersions(data);
    } catch (error: any) {
      console.error('Error fetching versions:', error);
      toast.error(error.message || 'Could not load version history');
    } finally {
      setIsLoadingVersions(false);
    }
  };

  const handlePreview = async (resume: ResumeSummary) => {
    setPreviewResume(resume);
    setIsLoadingPreview(true);
    trackEvent('preview_resume');
    try {
      const response = await apiFetch(`/api/resumes/${resume.id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Failed to fetch resume details');
      }
      const data = await response.json();
      setPreviewData(data.data);
    } catch (error: any) {
      toast.error(error.message || 'Could not load preview');
      setPreviewResume(null);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleRevert = async (versionId: string) => {
    if (!selectedResumeForHistory) return;
    if (!window.confirm('Are you sure you want to revert to this version? Current changes will be saved as a new version.')) return;

    setIsReverting(versionId);
    try {
      const response = await apiFetch(`/api/resumes/${selectedResumeForHistory.id}/revert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `Failed to revert (${response.status})`);
      }
      
      toast.success('Resume reverted successfully');
      trackEvent('revert_resume_version');
      setSelectedResumeForHistory(null);
      fetchResumes();
    } catch (error: any) {
      console.error('Error reverting resume:', error);
      toast.error(error.message || 'Failed to revert resume');
    } finally {
      setIsReverting(null);
    }
  };

  const handleDeleteVersion = async (versionId: string) => {
    if (!selectedResumeForHistory) return;
    if (!window.confirm('Are you sure you want to delete this version? This action cannot be undone.')) return;

    try {
      const response = await apiFetch(`/api/resumes/${selectedResumeForHistory.id}/versions/${versionId}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `Failed to delete version (${response.status})`);
      }
      
      toast.success('Version deleted successfully');
      // Update the versions list locally to avoid refetching
      setVersions(versions.filter(v => v.id !== versionId));
    } catch (error: any) {
      console.error('Error deleting version:', error);
      toast.error(error.message || 'Failed to delete version');
    }
  };

  const fetchCompareVersions = async (resume: ResumeSummary) => {
    setIsLoadingCompareVersions(true);
    try {
      const response = await apiFetch(`/api/resumes/${resume.id}/versions`);
      if (response.ok) {
        const data = await response.json();
        setCompareVersions(data || []);
        
        // Default compareVersionA of Left panel to 'current'
        setCompareVersionA('current');
        loadCompareData(resume.id, 'current', 'A');

        // Default compareVersionB of Right panel to the most recent version if available
        if (data && data.length > 0) {
          setCompareVersionB(data[0].id);
          loadCompareData(resume.id, data[0].id, 'B');
        } else {
          setCompareVersionB('');
          setCompareDataB(null);
        }
      }
    } catch (err) {
      console.error('Failed to load comparison versions:', err);
    } finally {
      setIsLoadingCompareVersions(false);
    }
  };

  const loadCompareData = async (resumeId: string, versionId: string, panel: 'A' | 'B') => {
    if (panel === 'A') {
      setIsLoadingCompareA(true);
    } else {
      setIsLoadingCompareB(true);
    }

    try {
      if (versionId === 'current') {
        const response = await apiFetch(`/api/resumes/${resumeId}`);
        if (response.ok) {
          const result = await response.json();
          if (panel === 'A') {
            setCompareDataA(result.data);
          } else {
            setCompareDataB(result.data);
          }
        }
      } else {
        const response = await apiFetch(`/api/resumes/${resumeId}/versions/${versionId}`);
        if (response.ok) {
          const result = await response.json();
          if (panel === 'A') {
            setCompareDataA(result.data);
          } else {
            setCompareDataB(result.data);
          }
        }
      }
    } catch (err) {
      console.error(`Failed to load comparison data for panel ${panel}:`, err);
      toast.error('Could not load version details for comparison');
    } finally {
      if (panel === 'A') {
        setIsLoadingCompareA(false);
      } else {
        setIsLoadingCompareB(false);
      }
    }
  };

  const getSkillsList = (skillsInput: any): string[] => {
    if (!skillsInput) return [];
    if (typeof skillsInput === 'string') {
      return skillsInput.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    if (Array.isArray(skillsInput)) {
      return skillsInput.map((s: any) => typeof s === 'string' ? s : (s.name || '')).filter(Boolean);
    }
    return [];
  };

  const highlightDiff = (textA: string, textB: string) => {
    if (!textA) return <span className="text-slate-900 dark:text-white">{textB || ''}</span>;
    if (!textB) return null;

    const wordsA = new Set(textA.toLowerCase().match(/\b\w+\b/g) || []);
    const wordsB = textB.split(/(\s+)/);

    return (
      <span className="text-slate-900 dark:text-white leading-relaxed">
        {wordsB.map((part, index) => {
          const cleanWord = part.toLowerCase().replace(/[^\w]/g, '');
          const isNew = cleanWord && !wordsA.has(cleanWord);
          if (isNew) {
            return (
              <mark key={index} className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-850 dark:text-emerald-400 px-1 rounded font-bold border-b border-emerald-500/30">
                {part}
              </mark>
            );
          }
          return <span key={index}>{part}</span>;
        })}
      </span>
    );
  };

  const filteredResumes = resumes.filter(r => 
    r.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FDFCFB] dark:bg-slate-950 py-16 px-4 sm:px-6 lg:px-8 transition-colors duration-500">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 border-b border-slate-200 dark:border-slate-800 pb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">Executive Dashboard</span>
            </div>
            <h1 className="font-serif text-5xl md:text-6xl text-slate-900 dark:text-white tracking-tight">
              My <span className="italic text-indigo-600 dark:text-indigo-400">Resumes</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-4 text-lg font-medium max-w-md">
              Your collection of professional narratives, crafted for excellence and career growth.
            </p>
          </div>
          <button
            onClick={() => navigate('/resume-builder')}
            className="group flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-bold text-lg hover:scale-105 transition-all shadow-2xl active:scale-95"
          >
            <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
            Create New Blueprint
          </button>
        </div>

        <div className="relative mb-12 max-w-2xl">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search your professional blueprints..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-14 pr-6 py-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-900 dark:text-white shadow-sm font-medium"
          />
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">Loading your resumes...</p>
          </div>
        ) : filteredResumes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredResumes.map((resume, index) => (
              <motion.div
                key={resume.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => navigate(`/resume-builder?id=${resume.id}`)}
                className="group relative bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all cursor-pointer shadow-sm hover:shadow-2xl hover:shadow-indigo-500/5"
              >
                <div className="flex items-start justify-between mb-8">
                  <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition-all duration-500">
                    <FileText className="w-7 h-7" />
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (expandedResumes[resume.id]?.data) {
                           setExpandedResumes(prev => { const next = {...prev}; delete next[resume.id]; return next; });
                        } else {
                           fetchResumeDataForPreview(resume.id);
                        }
                      }}
                      className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all"
                      title={expandedResumes[resume.id]?.data ? "Collapse" : "Quick Preview"}
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreview(resume);
                      }}
                      className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all"
                      title="Full Preview"
                    >
                      <FileText className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedVersions(prev => ({ ...prev, [resume.id]: !prev[resume.id] }));
                        if (!expandedVersions[resume.id]) fetchVersions(resume);
                      }}
                      className={`p-2.5 rounded-xl transition-all ${expandedVersions[resume.id] ? 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900/30' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'}`}
                      title={expandedVersions[resume.id] ? "Hide Versions" : "Version History"}
                    >
                      <History className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setComparingResume(resume);
                        fetchCompareVersions(resume);
                      }}
                      className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all"
                      title="Side-by-Side Comparison"
                    >
                      <GitCompare className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, resume.id)}
                      className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-serif text-2xl text-slate-900 dark:text-white mb-4 line-clamp-1">
                  {resume.title}
                </h3>

                {(() => {
                  const score = calculateATSScore(resume.data);
                  const strokeColor = score >= 85 ? '#10b981' : score >= 65 ? '#6366f1' : score >= 40 ? '#f59e0b' : '#f43f5e';
                  const scoreLabel = score >= 85 ? 'Excellent' : score >= 65 ? 'Strong' : score >= 40 ? 'Good' : 'Weak';
                  const circleRadius = 26;
                  const circumference = 2 * Math.PI * circleRadius;
                  const strokeDashoffset = circumference - (score / 100) * circumference;

                  return (
                    <div className="flex items-center gap-4 bg-slate-50/50 dark:bg-slate-800/10 border border-slate-100 dark:border-slate-800/60 rounded-2xl p-4 mb-4 select-none" onClick={(e) => e.stopPropagation()}>
                      <div className="relative flex items-center justify-center shrink-0 w-16 h-16">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle
                            cx="32"
                            cy="32"
                            r={circleRadius}
                            className="stroke-slate-100 dark:stroke-slate-800"
                            strokeWidth="4"
                            fill="transparent"
                          />
                          <motion.circle
                            cx="32"
                            cy="32"
                            r={circleRadius}
                            stroke={strokeColor}
                            strokeWidth="4"
                            fill="transparent"
                            strokeDasharray={circumference}
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-sm font-black text-slate-900 dark:text-white leading-none">{score}</span>
                          <span className="text-[7.5px] font-black uppercase text-slate-400 tracking-wider">ATS</span>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">ATS Optimization</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                            score >= 85 ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400' :
                            score >= 65 ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' :
                            score >= 40 ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400' :
                            'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400'
                          }`}>
                            {scoreLabel}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {score >= 85 ? "Superbly optimized for corporate screening algorithms." :
                           score >= 65 ? "Good match strength. Enhance bullets for a boost." :
                           score >= 40 ? "Needs improvement. Complete summaries & skills." :
                           "Add skills, summaries & work history to pass ATS check."}
                        </p>
                      </div>
                    </div>
                  );
                })()}
                
                {expandedResumes[resume.id]?.isLoading ? (
                  <div className="text-sm text-slate-500 mb-8"><Loader2 className="w-4 h-4 animate-spin inline mr-2"/>Loading preview...</div>
                ) : expandedResumes[resume.id]?.data ? (
                  <div className="mb-4 text-sm text-slate-600 dark:text-slate-400 line-clamp-3 bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
                    <strong>Summary:</strong> {expandedResumes[resume.id].data.summary || 'No summary available.'}
                  </div>
                ) : null}

                {expandedVersions[resume.id] ? (
                  <div className="mb-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Version History</h4>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setComparingResume(resume);
                          fetchCompareVersions(resume);
                        }}
                        className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 px-2 py-1 rounded transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <GitCompare className="w-3 h-3" /> Side-by-Side Compare
                      </button>
                    </div>
                    {isLoadingVersions && selectedResumeForHistory?.id === resume.id ? (
                      <div className="flex items-center justify-center py-4"><Loader2 className="w-4 h-4 text-indigo-600 animate-spin" /></div>
                    ) : versions.length > 0 ? (
                      <div className="space-y-2">
                        {versions.map((version, vIdx) => (
                          <div key={version.id} className="flex items-center justify-between text-xs bg-white dark:bg-slate-900 px-3 py-2 rounded-lg">
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {vIdx === 0 ? 'Current' : `V${versions.length - vIdx}`}
                            </span>
                            <span className="text-slate-400">{new Date(version.created_at).toLocaleDateString()}</span>
                            {vIdx !== 0 && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setSelectedResumeForHistory(resume); handleRevert(version.id); }}
                                className="text-indigo-600 font-bold hover:underline"
                              >Revert</button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 text-center py-2">No versions found</p>
                    )}
                  </div>
                ) : null}

                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400 font-medium">
                    <LayoutTemplate className="w-4 h-4 text-indigo-500" />
                    <span className="capitalize">{resume.template} Template</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400 font-medium">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                    <span>Updated {new Date(resume.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-2">
                    Open Blueprint <ChevronRight className="w-4 h-4" />
                  </span>
                  <div className="flex -space-x-2">
                    {[1, 2].map(i => (
                      <div key={i} className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800" />
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800">
            <div className="inline-flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-800 rounded-full mb-6">
              <AlertCircle className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No resumes found</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto">
              {searchQuery ? `No resumes matching "${searchQuery}"` : "You haven't saved any resumes yet. Start building your professional profile today!"}
            </p>
            {!searchQuery && (
              <button
                onClick={() => navigate('/resume-builder')}
                className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40"
              >
                Build My First Resume
              </button>
            )}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewResume && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setPreviewResume(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
                    <Eye className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Resume Preview</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]">{previewResume.title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload('pdf')}
                    disabled={isDownloading}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                  >
                    {isDownloading && downloadFormat === 'pdf' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                    PDF
                  </button>
                  <button
                    onClick={() => handleDownload('docx')}
                    disabled={isDownloading}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                  >
                    {isDownloading && downloadFormat === 'docx' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                    DOCX
                  </button>
                  <button
                    onClick={() => handleDownload('rtf')}
                    disabled={isDownloading}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                  >
                    {isDownloading && downloadFormat === 'rtf' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                    RTF
                  </button>
                  <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />
                  <button
                    onClick={() => navigate(`/resume-builder?id=${previewResume.id}`)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setPreviewResume(null)}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto bg-slate-50 dark:bg-slate-950 flex-1 flex justify-center">
                {isLoadingPreview ? (
                  <div className="flex flex-col items-center justify-center py-24">
                    <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Loading preview...</p>
                  </div>
                ) : previewData ? (
                  <div ref={previewRef} className="bg-white w-full max-w-[21cm] min-h-[29.7cm] shadow-lg p-8 md:p-12 text-slate-800 font-sans">
                    {/* Simple rendering of the resume data */}
                    <div className="border-b-2 border-slate-800 pb-6 mb-6 text-center">
                      <h1 className="text-4xl font-bold text-slate-900 mb-2">{previewData.personalInfo?.fullName || 'Your Name'}</h1>
                      <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-600">
                        {previewData.personalInfo?.email && <span>{previewData.personalInfo.email}</span>}
                        {previewData.personalInfo?.phone && <span>{previewData.personalInfo.phone}</span>}
                        {previewData.personalInfo?.location && <span>{previewData.personalInfo.location}</span>}
                      </div>
                    </div>

                    {previewData.summary && (
                      <div className="mb-8">
                        <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider mb-3">Professional Summary</h2>
                        <p className="text-slate-700 leading-relaxed">{previewData.summary}</p>
                      </div>
                    )}

                    {previewData.experiences?.length > 0 && (
                      <div className="mb-8">
                        <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider mb-4">Experience</h2>
                        <div className="space-y-6">
                          {previewData.experiences.map((exp: any, i: number) => (
                            <div key={i}>
                              <div className="flex justify-between items-baseline mb-1">
                                <h3 className="text-md font-bold text-slate-900">{exp.role}</h3>
                                <span className="text-sm text-slate-600 font-medium">{exp.startDate} - {exp.endDate || 'Present'}</span>
                              </div>
                              <div className="text-slate-700 font-medium mb-2">{exp.company}</div>
                              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{exp.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {previewData.educations?.length > 0 && (
                      <div className="mb-8">
                        <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider mb-4">Education</h2>
                        <div className="space-y-4">
                          {previewData.educations.map((edu: any, i: number) => (
                            <div key={i} className="flex justify-between items-baseline">
                              <div>
                                <h3 className="text-md font-bold text-slate-900">{edu.degree}</h3>
                                <div className="text-slate-700">{edu.school}</div>
                              </div>
                              <span className="text-sm text-slate-600 font-medium">{edu.graduationDate}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {previewData.skills && (
                      <div className="mb-8">
                        <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider mb-3">Skills</h2>
                        <div className="flex flex-wrap gap-2">
                          {previewData.skills.split(',').map((skill: string, i: number) => (
                            <span key={i} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm">
                              {skill.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {previewData.certifications && (
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider mb-3">Certifications</h2>
                        {typeof previewData.certifications === 'string' ? (
                          <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{previewData.certifications}</p>
                        ) : Array.isArray(previewData.certifications) && previewData.certifications.length > 0 ? (
                          <div className="space-y-4">
                            {previewData.certifications.map((cert: any, i: number) => (
                              <div key={i} className="flex justify-between items-baseline">
                                <div>
                                  <h3 className="text-md font-bold text-slate-900">{cert.name}</h3>
                                  {cert.issuer && <div className="text-slate-700">{cert.issuer}</div>}
                                </div>
                                {cert.date && <span className="text-sm text-slate-600 font-medium">{cert.date}</span>}
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 text-slate-500">
                    <AlertCircle className="w-12 h-12 mb-4 text-slate-400" />
                    <p>Failed to load resume data.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Version History Modal */}
      <AnimatePresence>
        {selectedResumeForHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Version History</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]">{selectedResumeForHistory.title}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedResumeForHistory(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 max-h-[60vh] overflow-y-auto">
                {isLoadingVersions ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">Loading versions...</p>
                  </div>
                ) : versions.length > 0 ? (
                  <div className="space-y-3">
                    {versions.map((version, idx) => (
                      <div
                        key={version.id}
                        className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all group"
                      >
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            {idx === 0 ? 'Current Version' : `Version ${versions.length - idx}`}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(version.created_at).toLocaleString()}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <LayoutTemplate className="w-3 h-3" />
                              <span className="capitalize">{version.template}</span>
                            </span>
                          </div>
                        </div>
                        {idx !== 0 && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleRevert(version.id)}
                              disabled={isReverting !== null}
                              className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-200 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isReverting === version.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <RotateCcw className="w-3 h-3" />
                              )}
                              {isReverting === version.id ? 'Reverting...' : 'Revert'}
                            </button>
                            <button
                              onClick={() => handleDeleteVersion(version.id)}
                              disabled={isReverting !== null}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete Version"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-slate-500 dark:text-slate-400">No version history found.</p>
                  </div>
                )}
              </div>

              <div className="p-6 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">Pro Tip:</span> Reverting to a previous version will create a new version of your current resume, so you never lose any work.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Side-by-Side Comparison Modal */}
      <AnimatePresence>
        {comparingResume && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setComparingResume(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl text-indigo-600 dark:text-indigo-400">
                    <GitCompare className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white flex flex-wrap items-center gap-2">
                      Resume Version Comparison <span className="font-sans text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300 font-bold uppercase tracking-wider">Side-by-Side Engine</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Comparing variations of: <span className="font-semibold text-slate-700 dark:text-slate-350">{comparingResume.title}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setComparingResume(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer self-start sm:self-auto"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Selectors Panel */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800/80 shrink-0 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                {/* Left Panel Version Selector */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400 min-w-16">Left Side:</span>
                  <select
                    value={compareVersionA}
                    onChange={(e) => {
                      setCompareVersionA(e.target.value);
                      loadCompareData(comparingResume.id, e.target.value, 'A');
                    }}
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                  >
                    <option value="current">Current Active Draft</option>
                    {compareVersions.map((v, i) => (
                      <option key={v.id} value={v.id}>
                        Version {compareVersions.length - i} ({new Date(v.created_at).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Right Panel Version Selector */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400 min-w-16">Right Side:</span>
                  <select
                    value={compareVersionB}
                    onChange={(e) => {
                      setCompareVersionB(e.target.value);
                      loadCompareData(comparingResume.id, e.target.value, 'B');
                    }}
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                  >
                    <option value="current">Current Active Draft</option>
                    {compareVersions.map((v, i) => (
                      <option key={v.id} value={v.id}>
                        Version {compareVersions.length - i} ({new Date(v.created_at).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Main Comparison Screens */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Visual Keyword Stats Diff */}
                {(compareDataA || compareDataB) && (
                  <div className="bg-gradient-to-br from-indigo-50/50 to-slate-50 dark:from-indigo-950/15 dark:to-slate-900/30 p-5 rounded-2xl border border-indigo-100/40 dark:border-indigo-900/30">
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 mb-4 flex items-center gap-1.5 font-sans">
                      <ArrowLeftRight className="w-3.5 h-3.5" /> Keyword Advancements & ATS Adjustments
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Added keywords (in B but not in A) */}
                      <div>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block mb-2">
                          + Newly Incorporated Keywords (In Right, missing from Left)
                        </span>
                        {(() => {
                          const listA = getSkillsList(compareDataA?.skills);
                          const listB = getSkillsList(compareDataB?.skills);
                          const added = listB.filter(s => !listA.some(sa => sa.toLowerCase() === s.toLowerCase()));
                          
                          if (added.length === 0) {
                            return <p className="text-xs text-slate-400 italic">No new keyword additions found. Keep optimizing!</p>;
                          }
                          return (
                            <div className="flex flex-wrap gap-1.5">
                              {added.map((keyword, kid) => (
                                <span key={kid} className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/80 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-lg uppercase tracking-wider">
                                  + {keyword}
                                </span>
                              ))}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Removed keywords */}
                      <div>
                        <span className="text-xs font-bold text-slate-505 block mb-2">
                          - Replaced / Interchanged (In Left, missing from Right)
                        </span>
                        {(() => {
                          const listA = getSkillsList(compareDataA?.skills);
                          const listB = getSkillsList(compareDataB?.skills);
                          const removed = listA.filter(s => !listB.some(sb => sb.toLowerCase() === s.toLowerCase()));
                          
                          if (removed.length === 0) {
                            return <p className="text-xs text-slate-400 italic">No keywords were removed/omitted.</p>;
                          }
                          return (
                            <div className="flex flex-wrap gap-1.5">
                              {removed.map((keyword, kid) => (
                                <span key={kid} className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-medium rounded-lg">
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                {/* Splitted Columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                  
                  {/* Left Column Content */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2">
                      <span className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Left Revision Content</span>
                      <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                        {compareVersionA === 'current' ? 'Live Draft' : 'Past Version'}
                      </span>
                    </div>

                    {isLoadingCompareA ? (
                      <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-150 border-dashed">
                        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
                        <p className="text-xs text-slate-400">Loading left pane...</p>
                      </div>
                    ) : compareDataA ? (
                      <div className="bg-slate-50/50 dark:bg-slate-950/20 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/60 space-y-6">
                        {/* Name & Contact Info preview */}
                        <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Candidate Profile</h4>
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white">{compareDataA.personalInfo?.fullName || 'Untitled Builder'}</h3>
                          <p className="text-xs text-slate-500 mt-1">{compareDataA.personalInfo?.email} • {compareDataA.personalInfo?.phone}</p>
                        </div>

                        {/* Summary Section */}
                        {compareDataA.summary && (
                          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Professional Summary</h4>
                            <p className="text-xs text-slate-705 dark:text-slate-350 leading-relaxed whitespace-pre-wrap">{compareDataA.summary}</p>
                          </div>
                        )}

                        {/* Skills summary list */}
                        {compareDataA.skills && (
                          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Skills Inventory ({getSkillsList(compareDataA.skills).length})</h4>
                            <div className="flex flex-wrap gap-1">
                              {getSkillsList(compareDataA.skills).map((skill, si) => (
                                <span key={si} className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md font-medium">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-10 text-slate-400 italic text-xs bg-slate-50 dark:bg-slate-900/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                        No resume data retrieved.
                      </div>
                    )}
                  </div>


                  {/* Right Column Content */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2">
                      <span className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Right Revision Content</span>
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Comparison Highlight Active
                      </span>
                    </div>

                    {isLoadingCompareB ? (
                      <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-150 border-dashed">
                        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
                        <p className="text-xs text-slate-400">Loading right pane...</p>
                      </div>
                    ) : compareDataB ? (
                      <div className="bg-slate-50/50 dark:bg-slate-950/20 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/60 space-y-6">
                        {/* Name & Contact Info preview */}
                        <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Candidate Profile</h4>
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                            {compareDataA ? highlightDiff(compareDataA.personalInfo?.fullName, compareDataB.personalInfo?.fullName) : (compareDataB.personalInfo?.fullName || 'Untitled Builder')}
                          </h3>
                          <p className="text-xs text-slate-505 mt-1">
                            {compareDataA ? highlightDiff(compareDataA.personalInfo?.email, compareDataB.personalInfo?.email) : compareDataB.personalInfo?.email}
                          </p>
                        </div>

                        {/* Summary Section with comparison highlights! */}
                        {compareDataB.summary && (
                          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Professional Summary</h4>
                            <p className="text-xs text-slate-705 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                              {compareDataA ? highlightDiff(compareDataA.summary, compareDataB.summary) : compareDataB.summary}
                            </p>
                          </div>
                        )}

                        {/* Skills summary list with newly added tags highlighted! */}
                        {compareDataB.skills && (
                          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Skills Inventory ({getSkillsList(compareDataB.skills).length})</h4>
                            <div className="flex flex-wrap gap-1">
                              {getSkillsList(compareDataB.skills).map((skill, si) => {
                                const listA = getSkillsList(compareDataA?.skills);
                                const isNewSkill = !listA.some(sa => sa.toLowerCase() === skill.toLowerCase());
                                return (
                                  <span
                                    key={si}
                                    className={`text-[10px] px-2 py-0.5 rounded-md font-medium transition-all ${
                                      isNewSkill
                                        ? 'bg-emerald-50 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300/40'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                    }`}
                                  >
                                    {skill} {isNewSkill && '✨'}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-10 text-slate-400 italic text-xs bg-slate-50 dark:bg-slate-900/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                        {compareVersions.length === 0 ? (
                          <div className="p-4">
                            <p className="font-semibold text-slate-700 mb-1">Single draft candidate detected.</p>
                            <p className="text-[10px] text-slate-500 leading-relaxed">Please make some adjustments in the builder or save edits to begin version history comparison side-by-side.</p>
                          </div>
                        ) : (
                          'Select a comparison version on the right to start.'
                        )}
                      </div>
                    )}
                  </div>

                </div>

                {/* Side-by-Side Experience Diff */}
                {(compareDataA || compareDataB) && (
                  <div className="pt-6 border-t border-slate-200 dark:border-slate-850">
                    <h4 className="text-xs font-extrabold text-slate-505 uppercase tracking-[0.2em] mb-4 text-slate-550 dark:text-slate-450">Work History Side-by-Side (Diff Highlighted)</h4>
                    {(() => {
                      const expsA = Array.isArray(compareDataA?.experiences) ? compareDataA.experiences : [];
                      const expsB = Array.isArray(compareDataB?.experiences) ? compareDataB.experiences : [];
                      const maxLen = Math.max(expsA.length, expsB.length);
                      const indices = Array.from({ length: maxLen }, (_, idx) => idx);

                      if (indices.length === 0) {
                        return <p className="text-xs text-slate-400 italic">No work experience entries recorded on either revision.</p>;
                      }

                      return (
                        <div className="space-y-4">
                          {indices.map(idx => {
                            const expA = expsA[idx];
                            const expB = expsB[idx];
                            
                            return (
                              <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-slate-100 dark:border-slate-805/40 pb-4">
                                {/* Left revision Experience block */}
                                <div className="p-4 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-slate-200/40 dark:border-slate-800">
                                  {expA ? (
                                    <>
                                      <div className="flex justify-between items-baseline mb-1">
                                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">{expA.role || expA.jobTitle}</h4>
                                        <span className="text-[10px] text-slate-505">{expA.startDate} - {expA.endDate || 'Present'}</span>
                                      </div>
                                      <span className="text-[11px] font-semibold text-slate-650 dark:text-slate-405 block mb-2">{expA.company}</span>
                                      <p className="text-[11px] text-slate-505 dark:text-slate-350 whitespace-pre-wrap leading-relaxed">{expA.description}</p>
                                    </>
                                  ) : (
                                    <span className="text-slate-400 text-xs italic">No corresponding experience entry on this revision</span>
                                  )}
                                </div>

                                {/* Right revision Experience block with word highlighting */}
                                <div className="p-4 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-slate-200/40 dark:border-slate-800">
                                  {expB ? (
                                    <>
                                      <div className="flex justify-between items-baseline mb-1">
                                        <h4 className="text-xs font-bold text-slate-905 dark:text-white">
                                          {expA ? highlightDiff(expA.role || expA.jobTitle, expB.role || expB.jobTitle) : (expB.role || expB.jobTitle)}
                                        </h4>
                                        <span className="text-[10px] text-slate-505">{expB.startDate} - {expB.endDate || 'Present'}</span>
                                      </div>
                                      <span className="text-[11px] font-semibold text-slate-650 dark:text-slate-405 block mb-2">
                                        {expA ? highlightDiff(expA.company, expB.company) : expB.company}
                                      </span>
                                      <p className="text-[11px] text-slate-505 dark:text-slate-350 whitespace-pre-wrap leading-relaxed">
                                        {expA ? highlightDiff(expA.description, expB.description) : expB.description}
                                      </p>
                                    </>
                                  ) : (
                                    <span className="text-slate-400 text-xs italic">No corresponding experience entry on this revision</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Side-by-Side Education Diff */}
                {(compareDataA || compareDataB) && (
                  <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                    <h4 className="text-xs font-extrabold text-slate-505 uppercase tracking-[0.2em] mb-4 text-slate-550 dark:text-slate-455">Education Side-by-Side (Diff Highlighted)</h4>
                    {(() => {
                      const edusA = Array.isArray(compareDataA?.educations) ? compareDataA.educations : [];
                      const edusB = Array.isArray(compareDataB?.educations) ? compareDataB.educations : [];
                      const maxLen = Math.max(edusA.length, edusB.length);
                      const indices = Array.from({ length: maxLen }, (_, idx) => idx);

                      if (indices.length === 0) {
                        return <p className="text-xs text-slate-400 italic">No education history recorded on either revision.</p>;
                      }

                      return (
                        <div className="space-y-4">
                          {indices.map(idx => {
                            const eduA = edusA[idx];
                            const eduB = edusB[idx];
                            
                            return (
                              <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-slate-100 dark:border-slate-805/40 pb-4">
                                {/* Left panel Education */}
                                <div className="p-4 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-slate-200/40 dark:border-slate-800">
                                  {eduA ? (
                                    <>
                                      <div className="flex justify-between items-baseline mb-1">
                                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">{eduA.degree}</h4>
                                        <span className="text-[10px] text-slate-505">{eduA.graduationDate || eduA.endDate}</span>
                                      </div>
                                      <span className="text-[11px] text-slate-650 dark:text-slate-405">{eduA.school}</span>
                                    </>
                                  ) : (
                                    <span className="text-slate-400 text-xs italic">No corresponding entry on this revision</span>
                                  )}
                                </div>

                                {/* Right panel Education with highlights */}
                                <div className="p-4 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-slate-200/40 dark:border-slate-800">
                                  {eduB ? (
                                    <>
                                      <div className="flex justify-between items-baseline mb-1">
                                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                                          {eduA ? highlightDiff(eduA.degree, eduB.degree) : eduB.degree}
                                        </h4>
                                        <span className="text-[10px] text-slate-550">{eduB.graduationDate || eduB.endDate}</span>
                                      </div>
                                      <span className="text-[11px] text-slate-650 dark:text-slate-405">
                                        {eduA ? highlightDiff(eduA.school, eduB.school) : eduB.school}
                                      </span>
                                    </>
                                  ) : (
                                    <span className="text-slate-400 text-xs italic">No corresponding entry on this revision</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                )}

              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 font-medium pb-6">
                <p className="text-center sm:text-left">
                  💡 ATS dynamic highlights: Newly introduced credentials and keywords are marked in <span className="text-emerald-600 dark:text-emerald-400 font-bold">green</span>.
                </p>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      if (comparingResume) {
                        navigate(`/resume-builder?id=${comparingResume.id}`);
                      }
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all font-bold text-xs cursor-pointer shadow-sm"
                  >
                    Open Builder
                  </button>
                  <button 
                    onClick={() => setComparingResume(null)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all font-bold text-xs cursor-pointer"
                  >
                    Close Comparison
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
