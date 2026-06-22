import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Loader2, 
  Brain, 
  ChevronDown, 
  ChevronUp, 
  HelpCircle, 
  BookOpen, 
  CheckCircle, 
  AlertCircle,
  FileText,
  User,
  ArrowRight,
  RefreshCw,
  Award,
  Zap,
  Lock,
  ChevronRight,
  Clipboard,
  MessageSquare,
  Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import toast from 'react-hot-toast';
import SEO from '../components/SEO';
import jsPDF from 'jspdf';

interface ResumeSummary {
  id: string;
  title: string;
  template: string;
  created_at: string;
  updated_at: string;
  data?: string;
}

interface InterviewQuestion {
  id: number;
  question: string;
  category: string;
  intent: string;
  coachingTip: string;
  sampleAnswer: string;
}

export default function InterviewPrep() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State variables
  const [resumes, setResumes] = useState<ResumeSummary[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [manualResumeText, setManualResumeText] = useState<string>('');
  const [resumeSource, setResumeSource] = useState<'saved' | 'paste'>('paste');
  
  const [jobTitle, setJobTitle] = useState<string>('');
  const [jobDescription, setJobDescription] = useState<string>('');
  
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isLoadingResumes, setIsLoadingResumes] = useState<boolean>(false);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number | null>(0);
  
  // Questions list returned by the API
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  
  // User practice notes/answers, mapped by question.id
  const [practiceNotes, setPracticeNotes] = useState<Record<number, string>>({});
  
  // Staggered loading state texts
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const loadingPhrases = [
    "Analyzing your professional experience history...",
    "Scanning career accomplishments and notable projects...",
    "Brainstorming relevant target industry interview prompts...",
    "Constructing strategic behavioral evaluation models...",
    "Formulating recruitment intent and pro-tips for your role...",
    "Finalizing customized response answers based on your profile..."
  ];

  // Load saved resumes if user is authenticated
  useEffect(() => {
    if (user) {
      const fetchResumes = async () => {
        setIsLoadingResumes(true);
        try {
          const response = await apiFetch('/api/resumes');
          if (response.ok) {
            const data = await response.json();
            setResumes(data);
            if (data.length > 0) {
              setResumeSource('saved');
              setSelectedResumeId(data[0].id);
            }
          }
        } catch (error) {
          console.error('Error fetching resumes:', error);
        } finally {
          setIsLoadingResumes(false);
        }
      };
      
      fetchResumes();
    }
  }, [user]);

  // Loading text rotater
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      interval = setInterval(() => {
        setLoadingTextIndex((prev) => (prev + 1) % loadingPhrases.length);
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Load practice notes from localStorage when questions change
  useEffect(() => {
    if (questions.length > 0) {
      const storedNotes: Record<number, string> = {};
      questions.forEach((q) => {
        const saved = localStorage.getItem(`prep_note_${q.id}_${q.question.substring(0, 15)}`);
        if (saved) {
          storedNotes[q.id] = saved;
        }
      });
      setPracticeNotes(storedNotes);
    }
  }, [questions]);

  const handleSaveNote = (questionId: number, questionText: string, noteText: string) => {
    localStorage.setItem(`prep_note_${questionId}_${questionText.substring(0, 15)}`, noteText);
    setPracticeNotes(prev => ({ ...prev, [questionId]: noteText }));
    toast.success("Practice notes saved securely!");
  };

  const handleGenerateQuestions = async () => {
    let rawResumeText = '';

    if (resumeSource === 'paste') {
      if (!manualResumeText.trim()) {
        toast.error("Please paste or type your resume content first.");
        return;
      }
      rawResumeText = manualResumeText;
    } else {
      if (!selectedResumeId) {
        toast.error("Please select a saved resume, or paste one manually.");
        return;
      }
      const selectedObj = resumes.find(r => r.id === selectedResumeId);
      if (selectedObj) {
        // If resume JSON is available, extract text representation
        if (selectedObj.data) {
          try {
            const parsedData = JSON.parse(selectedObj.data);
            // Compile basic info, summary, exps, and skills into a readable string
            const name = parsedData.personalInfo?.fullName || '';
            const title = parsedData.personalInfo?.jobTitle || '';
            const summary = parsedData.summary || '';
            const experiences = (parsedData.experiences || []).map((exp: any) => 
              `${exp.jobTitle} at ${exp.company} (${exp.startDate || ''} - ${exp.endDate || ''}):\n` + 
              (exp.bulletPoints || []).join('\n')
            ).join('\n\n');
            const skills = parsedData.skills || '';
            const educations = (parsedData.educations || []).map((e: any) => `${e.degree} from ${e.school}`).join('\n');
            
            rawResumeText = `Candidate: ${name}\nRole: ${title}\n\nSummary:\n${summary}\n\nExperience:\n${experiences}\n\nSkills:\n${skills}\n\nEducation:\n${educations}`;
          } catch (e) {
            rawResumeText = selectedObj.data; // fallback if plain text
          }
        } else {
          rawResumeText = selectedObj.title; 
        }
      }
    }

    setIsGenerating(true);
    setLoadingTextIndex(0);
    setQuestions([]);
    setActiveQuestionIndex(0);

    try {
      const response = await apiFetch('/api/ai/interview-prep', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeText: rawResumeText,
          jobTitle: jobTitle.trim() || undefined,
          jobDescription: jobDescription.trim() || undefined
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate interview simulation.');
      }

      const resData = await response.json();
      if (resData.success && resData.data?.questions) {
        setQuestions(resData.data.questions);
        toast.success("AI interview questions generated successfully!");
      } else {
        throw new Error('Incorrect response format received.');
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Something went wrong. Please check your credentials and try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const exportToPDF = () => {
    if (questions.length === 0) {
      toast.error("No questions available to export.");
      return;
    }

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
      });

      // Page styling constants
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 40;
      const contentWidth = pageWidth - (margin * 2);

      let y = 60; // Starting Y coordinate

      const drawHeaderFooter = () => {
        // Small Header
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('CareerCraft AI Interview Prep Study Guide', margin, 35);
        doc.setDrawColor(240, 240, 240);
        doc.line(margin, 40, pageWidth - margin, 40);

        // Footer
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('https://careercraft.com', margin, pageHeight - 30);
      };

      const checkPageBreak = (neededHeight: number) => {
        if (y + neededHeight > pageHeight - margin) {
          doc.addPage();
          y = 60;
          drawHeaderFooter();
        }
      };

      // --- Header ---
      drawHeaderFooter();

      // Document Title
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(30, 41, 59); // slate-800
      doc.text('Interview Study Guide', margin, y);
      y += 28;

      // Subtitle / Job Title
      doc.setFont('Helvetica', 'oblique');
      doc.setFontSize(11);
      doc.setTextColor(71, 85, 105); // slate-600
      const roleText = jobTitle ? `Prepared for: ${jobTitle}` : 'Custom AI Simulator Round';
      doc.text(roleText, margin, y);
      y += 15;

      // Date
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139); // slate-500
      const dateText = `Generated: ${new Date().toLocaleDateString(undefined, { 
        year: 'numeric', month: 'long', day: 'numeric' 
      })}`;
      doc.text(dateText, margin, y);
      y += 30;

      // Divider line
      doc.setLineWidth(1);
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.line(margin, y, pageWidth - margin, y);
      y += 30;

      // --- Questions Loop ---
      questions.forEach((q, idx) => {
        // Estimate heights needed
        const questionLines = doc.splitTextToSize(`${idx + 1}. ${q.question}`, contentWidth) as string[];
        const categoryText = `Category: ${q.category || 'General'}`;
        const intentLines = doc.splitTextToSize(q.intent || '', contentWidth - 15) as string[];
        const coachingLines = doc.splitTextToSize(q.coachingTip || '', contentWidth - 15) as string[];
        const answerLines = doc.splitTextToSize(q.sampleAnswer || '', contentWidth - 15) as string[];
        
        const noteVal = practiceNotes[q.id]?.trim();
        const hasNote = !!noteVal;
        const noteLines = hasNote ? doc.splitTextToSize(noteVal, contentWidth - 15) as string[] : [];

        // Calculate approximate height of this question block
        const questionBlockHeight = 
          (questionLines.length * 15) + // question text
          20 + // category tag
          (intentLines.length * 12 + 15) + // intent
          (coachingLines.length * 12 + 15) + // coaching tip
          (answerLines.length * 12 + 25) + // sample answer
          (hasNote ? (noteLines.length * 12 + 25) : 0) + // practice note
          40; // spacing & margins

        checkPageBreak(questionBlockHeight);

        // Question Number & Text
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(30, 41, 59); // slate-800
        
        questionLines.forEach((line: string) => {
          doc.text(line, margin, y);
          y += 16;
        });
        y += 4;

        // Category text
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(79, 70, 229); // indigo-600
        doc.text(categoryText.toUpperCase(), margin, y);
        y += 16;

        // Why recruiters ask this
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139); // slate-500
        doc.text('WHY RECRUITERS ASK THIS:', margin, y);
        y += 12;

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(71, 85, 105); // slate-600
        intentLines.forEach((line: string) => {
          doc.text(line, margin + 10, y);
          y += 13;
        });
        y += 8;

        // Coaching tip
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(16, 185, 129); // emerald-550
        doc.text('COACHING STRATEGY:', margin, y);
        y += 12;

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(71, 85, 105); // slate-600
        coachingLines.forEach((line: string) => {
          doc.text(line, margin + 10, y);
          y += 13;
        });
        y += 8;

        // Sample Answer
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139); // slate-500
        doc.text('SAMPLE MODEL ANSWER:', margin, y);
        y += 12;

        const answerStartHeight = y - 4;
        doc.setFont('Helvetica', 'oblique');
        doc.setFontSize(9.5);
        doc.setTextColor(30, 41, 59); // slate-800
        answerLines.forEach((line: string) => {
          doc.text(line, margin + 10, y);
          y += 13;
        });
        const answerEndHeight = y - 6;
        doc.setDrawColor(199, 210, 254); // indigo-200 border-l
        doc.setLineWidth(2);
        doc.line(margin + 4, answerStartHeight, margin + 4, answerEndHeight);
        y += 10;

        // User notes if exist
        if (hasNote) {
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(79, 70, 229); // indigo-600
          doc.text('MY PRACTICE RESPONSE:', margin, y);
          y += 12;

          const noteStartHeight = y - 4;
          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(9.5);
          doc.setTextColor(15, 23, 42); // slate-900
          noteLines.forEach((line: string) => {
            doc.text(line, margin + 10, y);
            y += 13;
          });
          const noteEndHeight = y - 6;
          doc.setDrawColor(16, 185, 129); // emerald border-l
          doc.setLineWidth(2);
          doc.line(margin + 4, noteStartHeight, margin + 4, noteEndHeight);
          y += 10;
        }

        // Separator between questions
        if (idx < questions.length - 1) {
          y += 10;
          checkPageBreak(30);
          doc.setDrawColor(241, 245, 249); // slate-100 splitter
          doc.setLineWidth(1);
          doc.line(margin, y, pageWidth - margin, y);
          y += 25;
        }
      });

      // Save final document
      const cleanJobTitle = jobTitle ? jobTitle.trim().replace(/[^a-zA-Z0-9]/g, '_') : 'Simulation';
      doc.save(`CareerCraft_Interview_Study_Guide_${cleanJobTitle}.pdf`);
      toast.success("Study Guide PDF downloaded successfully!");
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      toast.error("An error occurred during PDF generation.");
    }
  };

  const exportToICS = () => {
    if (questions.length === 0) {
      toast.error("No questions available to export.");
      return;
    }

    try {
      let icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//CareerCraft//Interview Prep Simulator//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH'
      ].join('\r\n') + '\r\n';

      const formatICSDate = (date: Date): string => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };

      const escapeICSText = (text: string): string => {
        return text
          .replace(/\\/g, '\\\\')
          .replace(/;/g, '\\;')
          .replace(/,/g, '\\,')
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '');
      };

      const cleanJobTitle = jobTitle ? jobTitle.trim() : 'Next Career Step';

      // Spaced schedule: 1 question per day starting tomorrow at 9 AM for 30 minutes
      questions.forEach((q, idx) => {
        const now = new Date();
        const studyDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1 + idx, 9, 0, 0);
        const studyEndDate = new Date(studyDate.getTime() + 30 * 60 * 1000); 

        const stamp = formatICSDate(now);
        const start = formatICSDate(studyDate);
        const end = formatICSDate(studyEndDate);

        const uid = `interview_prep_${q.id}_idx${idx}_${now.getTime()}@careercraft.com`;

        let description = `🎯 INTERVIEW PREP STUDY SEQUENCE\\n`;
        description += `Question 0${idx + 1} of 05\\n\\n`;
        description += `❓ QUESTION:\\n${q.question}\\n\\n`;
        description += `🏷️ CATEGORY: ${q.category}\\n\\n`;
        description += `💡 RECRUITER INTENT:\\n${q.intent || 'N/A'}\\n\\n`;
        description += `📈 COACHING STRATEGY:\\n${q.coachingTip || 'N/A'}\\n\\n`;
        description += `✨ EXEMPLAR STAR MODEL ANSWER:\\n"${q.sampleAnswer || 'N/A'}"`;

        const noteVal = practiceNotes[q.id]?.trim();
        if (noteVal) {
          description += `\\n\\n✍️ MY PRACTICE WORK:\\n"${noteVal}"`;
        }

        icsContent += [
          'BEGIN:VEVENT',
          `UID:${uid}`,
          `DTSTAMP:${stamp}`,
          `DTSTART:${start}`,
          `DTEND:${end}`,
          `SUMMARY:${escapeICSText(`Prep [${q.category}]: ${q.question.substring(0, 40)}...`)}`,
          `DESCRIPTION:${escapeICSText(description)}`,
          'STATUS:CONFIRMED',
          'SEQUENCE:0',
          'BEGIN:VALARM',
          'TRIGGER:-PT15M',
          'ACTION:DISPLAY',
          'DESCRIPTION:Time to review your target interview prep case!',
          'END:VALARM',
          'END:VEVENT'
        ].join('\r\n') + '\r\n';
      });

      icsContent += 'END:VCALENDAR';

      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      const cleanTitleStr = cleanJobTitle.replace(/[^a-zA-Z0-9]/g, '_');
      link.setAttribute('download', `CareerCraft_Study_Plan_${cleanTitleStr}.ics`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Study plan downloaded! Import this .ics file into Google Calendar, Outlook, or Apple Calendar to schedule daily reviews.");
    } catch (err) {
      console.error("Failed to generate Calendar schedule:", err);
      toast.error("An error occurred during Calendar schedule generation.");
    }
  };

  const getCategoryClass = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('behavioral')) return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-805/30';
    if (cat.includes('technical')) return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-805/30';
    if (cat.includes('situational')) return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-805/30';
    if (cat.includes('leadership')) return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-300/20';
    return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-750';
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] dark:bg-slate-950 py-24 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <SEO 
        title="AI Interview Prep Simulator | CareerCraft" 
        description="Simulate real corporate recruitment rounds. Upload your resume and generate targeted custom interview questions based on your background and target industry roles." 
      />

      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 dark:bg-indigo-950/30 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-4"
          >
            <Brain className="w-3.5 h-3.5 animate-pulse text-indigo-500" />
            Interview Coaching Module
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="font-serif text-4xl sm:text-5xl font-normal text-slate-900 dark:text-white mb-4 tracking-tight"
          >
            AI Interview <span className="ring-offset-2 italic font-serif">Prep Simulator</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="text-slate-500 dark:text-slate-400 text-base"
          >
            Elevate your professional storytelling. Bridge your background to target job criteria, inspect hidden hiring panels intent, and model perfect STAR exemplars.
          </motion.p>
        </div>

        {/* Lock State for Non-Authenticated Users */}
        {!user ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-12 text-center max-w-xl mx-auto shadow-sm"
          >
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-indigo-500" />
            </div>
            <h2 className="font-serif text-2xl text-slate-900 dark:text-white mb-3">Authentication Required</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed">
              To leverage the high-efficacy AI Interview Simulator, fetch your saved templates, and evaluate custom questions based safely on your profile, sign in to your dashboard.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => navigate('/auth')} 
                className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-2xl flex items-center justify-center gap-2 hover:shadow-lg transition-all"
              >
                Sign In or Register <ArrowRight className="w-4 h-4" />
              </button>
              <button 
                onClick={() => navigate('/')} 
                className="w-full sm:w-auto px-6 py-3 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
              >
                Back to Homepage
              </button>
            </div>
          </motion.div>
        ) : (
          /* Main Interactive Layout Grid */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column Config Panel */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-[2.5rem] p-6 shadow-sm">
                <h3 className="font-serif text-lg text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-500" /> Setup Calibration
                </h3>
                
                {/* Resume Selection Source Header Toggle */}
                <div className="mb-6">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Resume Source
                  </label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl">
                    <button
                      type="button"
                      disabled={resumes.length === 0}
                      onClick={() => setResumeSource('saved')}
                      className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                        resumeSource === 'saved'
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                      } ${resumes.length === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Saved ({resumes.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setResumeSource('paste')}
                      className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                        resumeSource === 'paste'
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                      }`}
                    >
                      <Clipboard className="w-3.5 h-3.5" />
                      Manual Paste
                    </button>
                  </div>
                </div>

                {/* Source options content */}
                {resumeSource === 'saved' ? (
                  <div className="space-y-4 mb-6">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Select Saved Resume
                    </label>
                    {isLoadingResumes ? (
                      <div className="flex items-center gap-2 text-xs text-slate-400 py-3">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading resumes...
                      </div>
                    ) : (
                      <select
                        value={selectedResumeId}
                        onChange={(e) => setSelectedResumeId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-850 px-4 py-3 rounded-2xl text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      >
                        {resumes.map(r => (
                          <option key={r.id} value={r.id}>{r.title}</option>
                        ))}
                      </select>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 mb-6">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Paste Resume Contents
                    </label>
                    <textarea
                      placeholder="Paste your plain-text CV/Resume parameters here. Be as detailed as possible with experiences, project roles, and skills list..."
                      value={manualResumeText}
                      onChange={(e) => setManualResumeText(e.target.value)}
                      rows={6}
                      className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-850 px-4 py-3 rounded-2xl text-xs font-medium text-slate-800 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                )}

                <hr className="border-slate-100 dark:border-slate-800/70 mb-6" />

                {/* Target Role details */}
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Target Role Title (Highly Recommended)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Senior Systems Analyst"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-850 px-4 py-3 rounded-2xl text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Target Job Description (Optional context)
                    </label>
                    <textarea
                      placeholder="Paste target job descriptions or essential checklist indicators requested by recruiters. Yewo will dynamically adjust behaviors based on matching these criteria..."
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      rows={4}
                      className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-850 px-4 py-3 rounded-2xl text-xs font-medium text-slate-800 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                {/* Primary CTA */}
                <button
                  type="button"
                  onClick={handleGenerateQuestions}
                  disabled={isGenerating}
                  className="w-full py-4 text-xs font-black uppercase tracking-widest text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 rounded-2xl shadow-md flex items-center justify-center gap-2 hover:shadow-lg transition-all"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      Calibrating Questions...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Simulate Round One
                    </>
                  )}
                </button>
              </div>

              {/* Tips & Guidance Card */}
              <div className="bg-slate-50/50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-[2rem] p-5">
                <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                  recruitment-grade coaching
                </h4>
                <ul className="space-y-3">
                  <li className="flex gap-2.5 items-start text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5"></span>
                    <span><strong>STAR Structure Alignment:</strong> Highlight Specific elements of your experiences based strictly on historical points of achievements.</span>
                  </li>
                  <li className="flex gap-2.5 items-start text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5"></span>
                    <span><strong>Psychological Intent:</strong> Demystifying why recruiters ask generic questions lets you skip superficial answers and talk details.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Right Column Questions Interactive Display */}
            <div className="lg:col-span-7">
              <AnimatePresence mode="wait">
                {/* Phase 1: Generating Loading State */}
                {isGenerating && (
                  <motion.div
                    key="simulator-loading-card"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-12 text-center min-h-[460px] flex flex-col justify-center items-center shadow-sm"
                  >
                    <div className="relative w-24 h-24 mb-8">
                      {/* Ambient Glowing Outer Rings */}
                      <span className="absolute inset-0 rounded-full border-2 border-indigo-500/20 animate-ping"></span>
                      <span className="absolute inset-2 rounded-full border border-indigo-500/40 animate-pulse"></span>
                      <div className="absolute inset-4 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-805/40 rounded-full flex items-center justify-center">
                        <Brain className="w-10 h-10 text-indigo-500 animate-bounce" />
                      </div>
                    </div>
                    <h3 className="font-serif text-2xl text-slate-900 dark:text-white mb-2">Simulating Panel Interview</h3>
                    <p className="text-slate-400 dark:text-slate-500 text-xs font-medium font-mono uppercase tracking-widest max-w-sm mb-4">
                      Yewo Career Guide Engine
                    </p>
                    <div className="h-6 overflow-hidden max-w-md mx-auto">
                      <AnimatePresence mode="wait">
                        <motion.p
                          key={loadingTextIndex}
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: -20, opacity: 0 }}
                          transition={{ duration: 0.35 }}
                          className="text-indigo-600 dark:text-indigo-400 text-xs font-semibold tracking-wide"
                        >
                          {loadingPhrases[loadingTextIndex]}
                        </motion.p>
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}

                {/* Phase 2: Empty State (Show before first simulation) */}
                {!isGenerating && questions.length === 0 && (
                  <motion.div
                    key="simulator-empty-card"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-slate-50/50 dark:bg-slate-900/40 border-2 border-dashed border-slate-200 dark:border-slate-800/80 rounded-[2.5rem] p-12 text-center min-h-[460px] flex flex-col justify-center items-center select-none"
                  >
                    <div className="w-14 h-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center shadow-inner mb-6">
                      <HelpCircle className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                    </div>
                    <h3 className="font-serif text-xl text-slate-800 dark:text-white mb-2">Awaiting Calibration</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-xs max-w-xs leading-relaxed mb-6">
                      Fill out your resume details on the configuration panel, specify your targeted field and run the generator to unpack recruitment coaching logic.
                    </p>
                    <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                      <div className="border border-slate-100 bg-white/40 dark:border-slate-850 dark:bg-slate-950/20 p-4 rounded-2xl flex flex-col items-center">
                        <Zap className="w-4 h-4 text-indigo-500 mb-1" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300">Targeted</span>
                        <span className="text-[10px] text-slate-400 mt-1">Direct experience parsing</span>
                      </div>
                      <div className="border border-slate-100 bg-white/40 dark:border-slate-850 dark:bg-slate-950/20 p-4 rounded-2xl flex flex-col items-center">
                        <Award className="w-4 h-4 text-emerald-500 mb-1" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300">STAR Format</span>
                        <span className="text-[10px] text-slate-400 mt-1">Exemplars ready to study</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Phase 3: Display Generated Questions */}
                {!isGenerating && questions.length > 0 && (
                  <motion.div
                    key="simulator-questions-panel"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-6"
                  >
                    {/* Panel Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-[1.5rem] gap-4 shadow-sm">
                      <div>
                        <h3 className="font-serif text-base text-slate-900 dark:text-white">Active Round Prompts</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          5 custom targeted interview scenarios
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        <button
                          onClick={exportToPDF}
                          className="py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-semibold text-xs text-slate-700 dark:text-slate-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          title="Download PDF Study Guide"
                        >
                          <FileText className="w-3.5 h-3.5 text-indigo-500" /> Study PDF
                        </button>
                        <button
                          onClick={exportToICS}
                          className="py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-semibold text-xs text-slate-700 dark:text-slate-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          title="Download ICS Calendar Schedule"
                        >
                          <Calendar className="w-3.5 h-3.5 text-emerald-500" /> Sync Calendar
                        </button>
                        <button
                          onClick={handleGenerateQuestions}
                          className="py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-semibold text-xs text-slate-700 dark:text-slate-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-indigo-500" /> Resimulate
                        </button>
                      </div>
                    </div>

                    {/* Staggered Cards container */}
                    <div className="space-y-4">
                      {questions.map((q, idx) => {
                        const isActive = activeQuestionIndex === idx;
                        return (
                          <motion.div
                            key={q.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: idx * 0.08 }}
                            className={`border rounded-[2rem] overflow-hidden transition-all duration-300 ${
                              isActive
                                ? 'bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-805/40 shadow-lg shadow-indigo-100/10'
                                : 'bg-white/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-805/40 hover:border-slate-300 shadow-sm cursor-pointer'
                            }`}
                            onClick={() => {
                              if (!isActive) {
                                setActiveQuestionIndex(idx);
                              }
                            }}
                          >
                            {/* Card Header Summary line */}
                            <div className="p-6 flex items-center justify-between gap-4 select-none">
                              <div className="flex items-center gap-4">
                                <span className="w-7 h-7 uppercase font-black tracking-widest text-[10px] rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-750 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
                                  0{idx + 1}
                                </span>
                                <h4 className="font-serif font-bold text-sm text-slate-900 dark:text-white leading-tight">
                                  {q.question}
                                </h4>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${getCategoryClass(q.category)}`}>
                                  {q.category}
                                </span>
                                {isActive ? (
                                  <ChevronUp className="w-4 h-4 text-slate-400" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-slate-400" />
                                )}
                              </div>
                            </div>

                            {/* Card Detail expand element */}
                            <AnimatePresence initial={false}>
                              {isActive && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.3 }}
                                >
                                  <div className="px-6 pb-6 border-t border-slate-100 dark:border-slate-800 pt-5 space-y-5">
                                    
                                    {/* Recruiter intent */}
                                    <div className="space-y-1">
                                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                        <MessageSquare className="w-3.5 h-3.5 text-indigo-500" /> WHY RECRUITERS ASK THIS:
                                      </span>
                                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-serif pl-5">
                                        {q.intent}
                                      </p>
                                    </div>

                                    {/* Coaching strategies */}
                                    <div className="space-y-1">
                                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-mono">
                                        <Award className="w-3.5 h-3.5 text-emerald-500" /> COACHING STRATEGY:
                                      </span>
                                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-5 font-mono">
                                        {q.coachingTip}
                                      </p>
                                    </div>

                                    {/* Sample response */}
                                    <div className="bg-slate-50 dark:bg-slate-950 px-5 py-4 rounded-2xl border border-slate-100 dark:border-slate-850 relative">
                                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 absolute top-3.5 right-4 pointer-events-none">
                                        EXEMPLARY STAR MODEL ANSWER
                                      </span>
                                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
                                        SAMPLE SKELETON ANSWER:
                                      </span>
                                      <p className="text-xs text-slate-700 dark:text-slate-300 italic leading-relaxed pl-3 border-l-2 border-indigo-400">
                                        "{q.sampleAnswer}"
                                      </p>
                                    </div>

                                    {/* Practice tool interactiveness */}
                                    <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4" onClick={(e) => e.stopPropagation()}>
                                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                                        My Practice Response & Pitch Prep
                                      </label>
                                      <textarea
                                        placeholder="Draft your bullet responses here. Think about connecting specific projects or statistics from your timeline..."
                                        value={practiceNotes[q.id] || ''}
                                        onChange={(e) => setPracticeNotes(prev => ({ ...prev, [q.id]: e.target.value }))}
                                        rows={3}
                                        className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-850 px-4 py-3 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                      />
                                      <div className="flex justify-between items-center mt-1">
                                        <span className="text-[9px] text-slate-400 dark:text-slate-500">
                                          Saved locally on your device
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => handleSaveNote(q.id, q.question, practiceNotes[q.id] || '')}
                                          className="py-1 px-3 bg-slate-900 hover:bg-slate-850 dark:bg-slate-850 dark:hover:bg-slate-800 rounded-lg text-[10px] font-bold uppercase tracking-wider text-white transition-all flex items-center gap-1"
                                        >
                                          <CheckCircle className="w-3 h-3 text-emerald-400" /> Save Notes
                                        </button>
                                      </div>
                                    </div>

                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
