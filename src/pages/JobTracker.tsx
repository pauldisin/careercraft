import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Briefcase, 
  Plus, 
  Search, 
  Calendar, 
  DollarSign, 
  Link as LinkIcon, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Users, 
  ChevronRight, 
  TrendingUp, 
  FileText, 
  Trash2, 
  Edit3, 
  ArrowRight, 
  Filter, 
  Download, 
  Upload, 
  Check, 
  X,
  ExternalLink,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import Tooltip from '../components/Tooltip';
import SEO from '../components/SEO';

export interface JobApplication {
  id: string;
  companyName: string;
  jobTitle: string;
  dateApplied: string;
  status: 'Applied' | 'Interviewing' | 'Rejected' | 'Offer';
  salary?: string;
  location?: string;
  jobLink?: string;
  notes?: string;
}

const DEFAULT_APPLICATIONS: JobApplication[] = [
  {
    id: 'app_1',
    companyName: 'Google',
    jobTitle: 'Senior Software Engineer',
    dateApplied: '2026-05-15',
    status: 'Interviewing',
    salary: 'K180,000 - K220,000',
    location: 'Mountain View, CA (Hybrid)',
    jobLink: 'https://careers.google.com',
    notes: 'Technical phone screen completed. Preparing for virtual onsite loops on system design and algorithms.'
  },
  {
    id: 'app_2',
    companyName: 'Stripe',
    jobTitle: 'Frontend Engineer',
    dateApplied: '2026-05-20',
    status: 'Offer',
    salary: 'K165,000',
    location: 'San Francisco, CA (Remote)',
    jobLink: 'https://stripe.com/jobs',
    notes: 'Offer received! 401k match, excellent healthcare. Need to review equity schedule and reply by Friday.'
  },
  {
    id: 'app_3',
    companyName: 'Netflix',
    jobTitle: 'Full Stack Engineer',
    dateApplied: '2026-05-10',
    status: 'Rejected',
    salary: 'K240,000',
    location: 'Los Gatos, CA',
    jobLink: 'https://jobs.netflix.com',
    notes: 'Resume selected but profile mismatch for the specific team vacancy. Recruiter kept my details on file for later.'
  },
  {
    id: 'app_4',
    companyName: 'Vercel',
    jobTitle: 'Developer Advocate',
    dateApplied: '2026-06-01',
    status: 'Applied',
    salary: 'K140,000',
    location: 'Remote',
    jobLink: 'https://vercel.com/careers',
    notes: 'Applied with the refined CareerCraft customized PDF resume. Initial automated sequence acknowledged receipt.'
  }
];

export default function JobTracker() {
  const { user } = useAuth();
  
  // Storage key is user-dependent to avoid leakage between login sessions
  const storageKey = useMemo(() => {
    return user ? `careercraft_jobs_${user.id}` : 'careercraft_jobs_guest';
  }, [user]);

  // Load applications
  const [applications, setApplications] = useState<JobApplication[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to parse stored job applications, falling back to defaults', e);
    }
    return DEFAULT_APPLICATIONS;
  });

  // Save applications
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(applications));
  }, [applications, storageKey]);

  // View state & Filtering
  const [viewMode, setViewMode] = useState<'canvas' | 'table'>('canvas'); // 'canvas' is Kanban Columns, 'table' is full detailed list
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // New & Editing Application Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<JobApplication | null>(null);
  const [formCompany, setFormCompany] = useState('');
  const [formJobTitle, setFormJobTitle] = useState('');
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formStatus, setFormStatus] = useState<JobApplication['status']>('Applied');
  const [formSalary, setFormSalary] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formLink, setFormLink] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Reset modal state
  const openAddModal = () => {
    setEditingApp(null);
    setFormCompany('');
    setFormJobTitle('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormStatus('Applied');
    setFormSalary('');
    setFormLocation('');
    setFormLink('');
    setFormNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (app: JobApplication) => {
    setEditingApp(app);
    setFormCompany(app.companyName);
    setFormJobTitle(app.jobTitle);
    setFormDate(app.dateApplied);
    setFormStatus(app.status);
    setFormSalary(app.salary || '');
    setFormLocation(app.location || '');
    setFormLink(app.jobLink || '');
    setFormNotes(app.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCompany.trim() || !formJobTitle.trim()) {
      toast.error('Company Name and Job Title are required.');
      return;
    }

    if (editingApp) {
      // Edit
      setApplications(prev => prev.map(app => app.id === editingApp.id ? {
        ...app,
        companyName: formCompany.trim(),
        jobTitle: formJobTitle.trim(),
        dateApplied: formDate,
        status: formStatus,
        salary: formSalary.trim() || undefined,
        location: formLocation.trim() || undefined,
        jobLink: formLink.trim() || undefined,
        notes: formNotes.trim() || undefined
      } : app));
      toast.success('Application updated successfully.');
    } else {
      // Create new
      const newApp: JobApplication = {
        id: `app_${Date.now()}`,
        companyName: formCompany.trim(),
        jobTitle: formJobTitle.trim(),
        dateApplied: formDate,
        status: formStatus,
        salary: formSalary.trim() || undefined,
        location: formLocation.trim() || undefined,
        jobLink: formLink.trim() || undefined,
        notes: formNotes.trim() || undefined
      };
      setApplications(prev => [newApp, ...prev]);
      toast.success('New job application logged!');
    }
    setIsModalOpen(false);
  };

  const handleDeleteApplication = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete your application for ${name}?`)) {
      setApplications(prev => prev.filter(app => app.id !== id));
      toast.success('Application logs removed.');
    }
  };

  const handleQuickStatusChange = (id: string, nextStatus: JobApplication['status']) => {
    setApplications(prev => prev.map(app => app.id === id ? { ...app, status: nextStatus } : app));
    toast.success(`Moved application status to ${nextStatus}.`);
  };

  // Metrics computation
  const stats = useMemo(() => {
    const total = applications.length;
    const applied = applications.filter(a => a.status === 'Applied').length;
    const interviewing = applications.filter(a => a.status === 'Interviewing').length;
    const rejected = applications.filter(a => a.status === 'Rejected').length;
    const offers = applications.filter(a => a.status === 'Offer').length;
    
    // Success metric: of the completed outcomes (reject + offer), what ratio are offers?
    const outcomesCount = rejected + offers;
    const winRate = outcomesCount > 0 ? Math.round((offers / outcomesCount) * 100) : 0;
    
    // Active pipeline includes applied and interviewing
    const activePipelineCount = applied + interviewing;
    const activeRate = total > 0 ? Math.round((activePipelineCount / total) * 100) : 0;

    return { total, applied, interviewing, rejected, offers, winRate, activeRate };
  }, [applications]);

  // Filtered dataset for grid/table displays
  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      const matchSearch = 
        app.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (app.location && app.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (app.notes && app.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus = statusFilter === 'All' || app.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [applications, searchQuery, statusFilter]);

  // Export as CSV
  const handleExportCSV = () => {
    if (applications.length === 0) {
      toast.error("No applications to export.");
      return;
    }
    const headers = ['Company', 'Job Title', 'Applied Date', 'Status', 'Salary Est', 'Location', 'Job Link', 'Notes'];
    const rows = applications.map(app => [
      app.companyName,
      app.jobTitle,
      app.dateApplied,
      app.status,
      app.salary || '',
      app.location || '',
      app.jobLink || '',
      app.notes || ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CareerCraft_Job_Applications_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Job applications CSV export complete!");
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="job-tracker-dashboard">
      <SEO 
        title="Job Application Tracker | CareerCraft" 
        description="Streamline your job search and visual outcomes. Track application checkpoints, schedule screens, and compute your pipeline win rate." 
      />

      {/* Hero header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 font-bold font-mono text-[10px] tracking-widest uppercase rounded">
              Career Optimization
            </span>
          </div>
          <h1 className="text-3xl font-serif font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Briefcase className="w-8 h-8 text-indigo-600 dark:text-indigo-455" />
            Job Application Tracker
          </h1>
          <p className="text-slate-550 dark:text-slate-400 text-sm mt-1 max-w-2xl leading-relaxed">
            Record, pipeline, and streamline your recruitment progress across dream ventures. Monitor active rates, interview cycles, and evaluate final offers.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          
          <button
            onClick={openAddModal}
            className="px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-indigo-500/10 transition-all cursor-pointer hover:-translate-y-0.5"
            id="add-application-btn"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> Add Application
          </button>
        </div>
      </div>

      {/* KPI Overviews and Progress Charts Block */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
        
        {/* KPI: Total */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1 text-slate-400 dark:text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Tracked</span>
            <Briefcase className="w-4 h-4" />
          </div>
          <div className="mt-2.5">
            <h3 className="text-3xl font-black text-slate-900 dark:text-white leading-none">{stats.total}</h3>
            <p className="text-[10px] text-slate-450 dark:text-slate-500 font-medium mt-1">Application processes started</p>
          </div>
        </div>

        {/* KPI: Applied */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1 text-slate-400 dark:text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Applied</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2.5">
            <h3 className="text-3xl font-black text-slate-700 dark:text-slate-300 leading-none">{stats.applied}</h3>
            <p className="text-[10px] text-slate-450 dark:text-slate-500 font-medium mt-1">Awaiting initial responses</p>
          </div>
        </div>

        {/* KPI: Interviewing */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1 text-amber-500/80">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Interviewing</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="mt-2.5">
            <h3 className="text-3xl font-black text-amber-655 text-amber-600 dark:text-amber-500 leading-none">{stats.interviewing}</h3>
            <p className="text-[10px] text-slate-450 dark:text-slate-500 font-medium mt-1">Active screeners or onsite loops</p>
          </div>
        </div>

        {/* KPI: Offers received */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1 text-emerald-500/80">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Offers</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="mt-2.5">
            <h3 className="text-3xl font-black text-emerald-600 dark:text-emerald-450 leading-none">{stats.offers}</h3>
            <p className="text-[10px] text-slate-450 dark:text-slate-500 font-medium mt-1">Written career offers secured</p>
          </div>
        </div>

        {/* Visual overview of progress pipeline */}
        <div className="md:col-span-4 lg:col-span-2 bg-gradient-to-tr from-indigo-50/50 via-white to-white dark:from-slate-900/60 dark:to-slate-900 border border-slate-200 dark:border-slate-805 p-5 rounded-3xl shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Search Analytics</span>
              <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-bold px-1.5 py-0.5 rounded font-mono">Win Ratio: {stats.winRate}%</span>
            </div>
            
            {/* Visual SVG Horizontal Progress Block */}
            <div className="mt-4 space-y-3">
              <div>
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  <span>Pipeline Activity</span>
                  <span className="text-indigo-600 dark:text-indigo-400">{stats.activeRate}% Active</span>
                </div>
                
                {/* Horizontal segmented progression bar representing relative densities */}
                <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                  {stats.total === 0 ? (
                    <div className="w-full bg-slate-200 dark:bg-slate-755 animate-pulse" />
                  ) : (
                    <>
                      <div 
                        title={`Applied: ${stats.applied}`} 
                        className="bg-slate-400 dark:bg-slate-500 h-full transition-all duration-500" 
                        style={{ width: `${(stats.applied / stats.total) * 100}%` }} 
                      />
                      <div 
                        title={`Interviewing: ${stats.interviewing}`} 
                        className="bg-amber-400 dark:bg-amber-500 h-full transition-all duration-500" 
                        style={{ width: `${(stats.interviewing / stats.total) * 100}%` }} 
                      />
                      <div 
                        title={`Offers: ${stats.offers}`} 
                        className="bg-emerald-500 h-full transition-all duration-500" 
                        style={{ width: `${(stats.offers / stats.total) * 100}%` }} 
                      />
                      <div 
                        title={`Rejected: ${stats.rejected}`} 
                        className="bg-rose-400 dark:bg-rose-500 h-full transition-all duration-500" 
                        style={{ width: `${(stats.rejected / stats.total) * 100}%` }} 
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Small legend indicators */}
              <div className="flex flex-wrap items-center gap-y-1.5 gap-x-3 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500" /> Applied ({stats.applied})
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Interv. ({stats.interviewing})
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Offer ({stats.offers})
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Rejected ({stats.rejected})
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and View Toggles Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4.5 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-3xs">
        
        {/* Left: Search input */}
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-405 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
            placeholder="Search company, job role, notes context..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            id="tracker-search-input"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2 text-xs font-semibold text-slate-405 hover:text-slate-700"
            >
              Clear
            </button>
          )}
        </div>

        {/* Right: Quick statuses filter & View toggles */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
          
          {/* Status Select dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-slate-505 dark:text-slate-400 font-bold uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="All">All statuses</option>
              <option value="Applied">Applied</option>
              <option value="Interviewing">Interviewing</option>
              <option value="Offer">Offers</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>

          {/* Canvas (Columns Panel) vs Spreadsheet List layout selection toggle */}
          <div className="flex items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-0.5 rounded-xl shrink-0">
            <button
              onClick={() => setViewMode('canvas')}
              className={`px-3 py-1 text-[11px] font-bold tracking-wider rounded-lg transition-all ${
                viewMode === 'canvas'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-3xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              Columns View
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 text-[11px] font-bold tracking-wider rounded-lg transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-3xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              Spreadsheet View
            </button>
          </div>
        </div>
      </div>

      {applications.length === 0 ? (
        /* Empty dashboard welcome state */
        <div className="text-center py-16 px-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl" id="empty-tracker-notice">
          <Briefcase className="w-12 h-12 text-slate-350 dark:text-slate-600 mx-auto mb-4 animate-bounce" />
          <h2 className="text-xl font-serif font-bold text-slate-900 dark:text-white mb-2">Build Your Job Tracking Canvas</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto leading-relaxed mb-6">
            Keep visual records of every firm you apply to. Toggle layouts, tag salaries, and update statuses to gauge metrics.
          </p>
          <button
            onClick={openAddModal}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md shadow-indigo-505/10 transition-colors cursor-pointer"
          >
            Log Your First Application
          </button>
        </div>
      ) : filteredApplications.length === 0 ? (
        /* No matches found in filters */
        <div className="text-center py-12 px-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl italic text-xs text-slate-400 dark:text-slate-550">
          ⚠️ No tracked applications match your current searching filter "{searchQuery || statusFilter}".
        </div>
      ) : viewMode === 'canvas' ? (
        /* Kanban Lane View */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5" id="kanban-kanban-board">
          
          {/* Status Column generator function */}
          {['Applied', 'Interviewing', 'Offer', 'Rejected'].map((colStatus) => {
            const statusTyped = colStatus as JobApplication['status'];
            const columnApps = filteredApplications.filter(app => app.status === statusTyped);
            
            // Layout Colors
            let bannerClass = "";
            let bgLightClass = "";
            let dotColor = "";
            
            if (statusTyped === 'Applied') {
              bannerClass = "text-slate-700 bg-slate-100 dark:text-slate-200 dark:bg-slate-800/80";
              bgLightClass = "bg-slate-50/50 dark:bg-slate-950/20";
              dotColor = "bg-slate-400 dark:bg-slate-500";
            } else if (statusTyped === 'Interviewing') {
              bannerClass = "text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/20";
              bgLightClass = "bg-amber-50/10 dark:bg-amber-955/5";
              dotColor = "bg-amber-500";
            } else if (statusTyped === 'Offer') {
              bannerClass = "text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/20";
              bgLightClass = "bg-emerald-50/10 dark:bg-emerald-955/5";
              dotColor = "bg-emerald-550";
            } else {
              bannerClass = "text-rose-700 bg-rose-50/80 dark:text-rose-400 dark:bg-rose-950/20";
              bgLightClass = "bg-rose-50/5 dark:bg-rose-955/5";
              dotColor = "bg-rose-450";
            }

            return (
              <div 
                key={colStatus} 
                className={`flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800/65 ${bgLightClass} p-3.5 min-h-[500px] shadow-3xs`}
              >
                {/* Column header banner */}
                <div className={`p-2.5 rounded-xl ${bannerClass} font-bold text-[11px] uppercase tracking-wider flex items-center justify-between mb-4`}>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
                    <span>{colStatus}</span>
                  </div>
                  <span className="font-mono text-[9px] bg-white/70 dark:bg-slate-900/50 px-1.5 py-0.5 rounded shadow-2xs">
                    {columnApps.length}
                  </span>
                </div>

                {/* Applications list inside column */}
                <div className="flex-1 space-y-3 overflow-y-auto max-h-[600px] pr-1">
                  {columnApps.length === 0 ? (
                    <div className="text-center py-10 text-[10px] text-slate-400 dark:text-slate-500 italic border border-dashed border-slate-200 dark:border-slate-800/80 rounded-xl bg-white/40 dark:bg-slate-900/10">
                      Empty Lane
                    </div>
                  ) : (
                    columnApps.map((app) => (
                      <div
                        key={app.id}
                        className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-805 rounded-xl text-xs flex flex-col hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs transition-all relative group"
                      >
                        <div className="flex items-start justify-between gap-2.5 mb-1.5">
                          <div>
                            <h4 className="font-black text-slate-800 dark:text-white leading-tight break-words">{app.companyName}</h4>
                            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-tight mt-0.5">{app.jobTitle}</p>
                          </div>
                          
                          {/* App Controls */}
                          <div className="flex items-center opacity-70 group-hover:opacity-100 transition-opacity gap-1 shrink-0">
                            <button
                              onClick={() => openEditModal(app)}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-500 hover:text-indigo-600 dark:hover:text-white cursor-pointer"
                              title="Edit Details"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteApplication(app.id, app.companyName)}
                              className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-md text-slate-400 hover:text-rose-555 cursor-pointer"
                              title="Delete Log"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-450" />
                            </button>
                          </div>
                        </div>

                        {/* App Sub-elements */}
                        <div className="space-y-1.5 mb-2.5 pt-1.5 border-t border-slate-100 dark:border-slate-850">
                          
                          {/* Date Applied Row */}
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Applied: {new Date(app.dateApplied).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </div>

                          {/* Location Row (if specified) */}
                          {app.location && (
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500">
                              <MapPin className="w-3.5 h-3.5" />
                              <span className="truncate">{app.location}</span>
                            </div>
                          )}

                          {/* Salary Row (if specified) */}
                          {app.salary && (
                            <div className="flex items-center gap-1.5 text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50/50 dark:bg-indigo-950/10 px-1.5 py-0.5 rounded w-fit">
                              <DollarSign className="w-3 h-3 stroke-[2.5]" />
                              <span>{app.salary}</span>
                            </div>
                          )}

                          {/* Link Row (if specified) */}
                          {app.jobLink && (
                            <a
                              href={app.jobLink}
                              target="_blank"
                              referrerPolicy="no-referrer"
                              className="inline-flex items-center gap-1 text-[10px] text-indigo-500 hover:text-indigo-650 hover:underline font-bold mt-1.5"
                            >
                              <ExternalLink className="w-3 h-3" /> Job posting url
                            </a>
                          )}
                        </div>

                        {/* Notes Snippet */}
                        {app.notes && (
                          <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded-lg text-[10px] text-slate-500 dark:text-slate-400 leading-normal line-clamp-2 italic break-words">
                            "{app.notes}"
                          </div>
                        )}

                        {/* Quick Action Progression Controls */}
                        <div className="flex items-center justify-end gap-1.5 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-850">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mr-auto">Transition:</span>
                          
                          {statusTyped !== 'Applied' && (
                            <button
                              onClick={() => handleQuickStatusChange(app.id, 'Applied')}
                              className="px-1.5 py-0.5 text-[9px] font-semibold bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100 rounded border border-slate-200 dark:border-slate-700 cursor-pointer"
                              title="Move back to Applied"
                            >
                              Apply
                            </button>
                          )}
                          
                          {statusTyped !== 'Interviewing' && (
                            <button
                              onClick={() => handleQuickStatusChange(app.id, 'Interviewing')}
                              className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/40 rounded cursor-pointer"
                              title="Move to Interviewing"
                            >
                              Intv.
                            </button>
                          )}

                          {statusTyped !== 'Offer' && (
                            <button
                              onClick={() => handleQuickStatusChange(app.id, 'Offer')}
                              className="px-1.5 py-0.5 text-[9px] font-bold bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/40 rounded cursor-pointer"
                              title="Move to Offer"
                            >
                              Offer
                            </button>
                          )}

                          {statusTyped !== 'Rejected' && (
                            <button
                              onClick={() => handleQuickStatusChange(app.id, 'Rejected')}
                              className="px-1.5 py-0.5 text-[9px] font-bold bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/40 rounded cursor-pointer"
                              title="Move to Rejected"
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Detailed Spreadsheet / Table View */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden" id="tracker-spreadsheet-layout">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-950/50 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 text-slate-500 border-b border-slate-150 dark:border-slate-800/80">
                <tr>
                  <th className="py-3.5 px-4 font-black">Company</th>
                  <th className="py-3.5 px-4 font-black">Job Role</th>
                  <th className="py-3.5 px-4 font-black">Applied Date</th>
                  <th className="py-3.5 px-4 font-black">Status</th>
                  <th className="py-3.5 px-4 font-black">Salary Guide</th>
                  <th className="py-3.5 px-4 font-black">Location</th>
                  <th className="py-3.5 px-4 font-black">Notes Context</th>
                  <th className="py-3.5 px-4 font-black text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {filteredApplications.map((app) => {
                  let badge = null;
                  if (app.status === 'Applied') {
                    badge = <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 rounded-full">Applied</span>;
                  } else if (app.status === 'Interviewing') {
                    badge = <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 rounded-full">Interviewing</span>;
                  } else if (app.status === 'Offer') {
                    badge = <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 rounded-full">Offer</span>;
                  } else {
                    badge = <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-rose-105 bg-rose-100 dark:bg-rose-955/30 text-rose-700 dark:text-rose-400 rounded-full">Rejected</span>;
                  }

                  return (
                    <tr 
                      key={app.id} 
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10 transition-colors"
                      id={`row-${app.id}`}
                    >
                      <td className="py-4 px-4 font-black text-slate-950 dark:text-white text-xs">{app.companyName}</td>
                      <td className="py-4 px-4 font-semibold text-slate-700 dark:text-slate-300">{app.jobTitle}</td>
                      <td className="py-4 px-4 font-mono text-slate-500 dark:text-slate-400">{app.dateApplied}</td>
                      <td className="py-4 px-4">{badge}</td>
                      <td className="py-4 px-4 font-mono font-semibold text-indigo-650 dark:text-indigo-400">{app.salary || '—'}</td>
                      <td className="py-4 px-4 text-slate-550 dark:text-slate-400 max-w-[150px] truncate">{app.location || '—'}</td>
                      <td className="py-4 px-4 text-slate-500 dark:text-slate-400 italic max-w-[200px] truncate" title={app.notes}>
                        {app.notes ? `"${app.notes}"` : '—'}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(app)}
                            className="p-1 px-2.5 py-1 border border-slate-205 dark:border-slate-800 text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-white rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteApplication(app.id, app.companyName)}
                            className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-450 hover:text-rose-555 hover:border-rose-100 rounded-lg cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-rose-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Creation and Modification Modal Form */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4">
            
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.55 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-xs"
              id="tracker-modal-backdrop"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col z-[11001]"
              id="tracker-modal-box"
            >
              
              {/* Modal header */}
              <div className="p-5 border-b border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl text-indigo-600">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {editingApp ? 'Modify Tracked Application' : 'Log New Application'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 hover:bg-slate-150 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4 text-slate-705 dark:text-slate-200 stroke-[2.5]" />
                </button>
              </div>

              {/* Form body */}
              <form onSubmit={handleSaveApplication} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
                
                {/* 2 columns fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Company Name */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Stripe, Google, Acme Corp..."
                      className="px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      value={formCompany}
                      onChange={(e) => setFormCompany(e.target.value)}
                    />
                  </div>

                  {/* Job Title */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      Job Title / Role *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Senior Frontend Developer..."
                      className="px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      value={formJobTitle}
                      onChange={(e) => setFormJobTitle(e.target.value)}
                    />
                  </div>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Date Applied */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      Applied Date
                    </label>
                    <input
                      type="date"
                      required
                      className="px-3.5 py-2 text-xs font-mono font-semibold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                    />
                  </div>

                  {/* Status Selection */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      Application Status
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as JobApplication['status'])}
                      className="px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                    >
                      <option value="Applied">Applied</option>
                      <option value="Interviewing">Interviewing</option>
                      <option value="Offer">Offer</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Salary estimation */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
                      Salary Estimate <span className="lowercase font-medium text-[9px] text-slate-400">(optional)</span>
                    </label>
                    <div className="relative">
                      <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="e.g. K140k - K160k, or K150,000..."
                        className="w-full pl-8 pr-3 py-2 text-xs font-semibold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        value={formSalary}
                        onChange={(e) => setFormSalary(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Job Location */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
                      Location / Mode <span className="lowercase font-medium text-[9px] text-slate-400">(optional)</span>
                    </label>
                    <div className="relative">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="e.g. NYC (Hybrid), Remote, SF..."
                        className="w-full pl-8 pr-3 py-2 text-xs font-semibold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        value={formLocation}
                        onChange={(e) => setFormLocation(e.target.value)}
                      />
                    </div>
                  </div>

                </div>

                {/* Job URL Link */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    Job Spec URL link <span className="lowercase font-medium text-[9px] text-slate-400">(optional)</span>
                  </label>
                  <div className="relative">
                    <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="url"
                      placeholder="e.g. https://careers.company.com/role..."
                      className="w-full pl-8 pr-3 py-2 text-xs font-semibold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      value={formLink}
                      onChange={(e) => setFormLink(e.target.value)}
                    />
                  </div>
                </div>

                {/* Tracking Notes and Interview Milestones */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Notes & Interview Milestones
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Preparation notes, interviewer contact details, follow-up timeline, or next stage checklists..."
                    className="px-3.5 py-2.5 text-xs font-semibold text-slate-950 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all leading-relaxed"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                  />
                </div>

                {/* Actions bottom strip */}
                <div className="pt-4 border-t border-slate-150 dark:border-slate-800 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4.5 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition-all shadow-indigo-500/10 hover:-translate-y-0.5 cursor-pointer"
                  >
                    {editingApp ? 'Save Changes' : 'Record Application'}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
