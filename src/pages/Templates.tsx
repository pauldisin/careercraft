import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { ArrowRight, LayoutTemplate, ShieldCheck, Eye, X, Star, CheckCircle, Award, Sparkles, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import Tooltip from '../components/Tooltip';
import { trackEvent } from '../lib/analytics';
import SEO from '../components/SEO';
import { ResumeTemplateRenderer } from '../components/ResumeTemplates';

const categories = [
  { id: 'all', name: 'All Blueprints' },
  { id: 'tech', name: 'Tech & AI' },
  { id: 'business', name: 'Corporate & Creative' },
  { id: 'specialized', name: 'Professional Services' }
];

const templates = [
  { 
    title: 'Senior Software Engineer', 
    industry: 'Technology', 
    level: 'Senior', 
    content: 'Architected a microservices platform handling 1M+ daily requests. Led a team of 12 engineers and reduced latency by 40%. Platforms include AWS, Redis, and Go.', 
    template: 'modern',
    category: 'tech',
    description: 'A modern, tech-focused template for senior software engineers, optimized for ATS scan structures.',
    benefits: ['Highlights system architecture & code impact', 'ATS-compliant technology stack chips', 'Clean, modern typography for maximum readability']
  },
  { 
    title: 'Marketing Manager', 
    industry: 'Marketing', 
    level: 'Mid-Level', 
    content: 'Managed K500k monthly ad spend across Meta and Google. Increased conversion rates by 25% and lowered CPA by 15% through high-frequency testing.', 
    template: 'corporate',
    category: 'business',
    description: 'A corporate template tailored for marketing professionals, focusing on measurable business outcomes and campaigns.',
    benefits: ['Quantifiable business results priority', 'Bold professional headers that command attention', 'Structured elegantly for campaign performance metrics']
  },
  { 
    title: 'Registered Nurse', 
    industry: 'Healthcare', 
    level: 'Mid-Level', 
    content: 'Provided high-quality patient care in a fast-paced ICU environment. Specialized in post-operative recovery, trauma care, and clinical leadership.', 
    template: 'minimal',
    category: 'specialized',
    description: 'A clean, minimal template for healthcare professionals, emphasizing hands-on clinical skills and care certifications.',
    benefits: ['Clear bedside & clinical skills visibility', 'Uncluttered professional layout for easy screening', 'Emphasizes nursing licensure and certifications']
  },
  { 
    title: 'Financial Analyst', 
    industry: 'Finance', 
    level: 'Entry-Level', 
    content: 'Conducted deep-dive financial modeling for complex M&A transactions. Prepared quarterly forecasting reports for executive board stakeholders.', 
    template: 'corporate',
    category: 'specialized',
    description: 'A corporate resume template for finance professionals, emphasizing thorough analysis, modeling, and reporting.',
    benefits: ['Professional and authoritative aesthetic style', 'Structured data rows for valuation methods', 'ATS-friendly design prioritizing raw financial achievements']
  },
  { 
    title: 'Project Manager', 
    industry: 'Construction', 
    level: 'Senior', 
    content: 'Oversaw K50M commercial development and infrastructure projects. Managed 20+ direct subcontractors and ensured 100% on-time delivery.', 
    template: 'modern',
    category: 'specialized',
    description: 'A modern layout for senior project managers, highlighting large-scale accomplishments and budgets.',
    benefits: ['Action-oriented statement formatting', 'Key project delivery summaries highlighted', 'ATS-optimized design for general contracting domains']
  },
  { 
    title: 'UX Designer', 
    industry: 'Design', 
    level: 'Mid-Level', 
    content: 'Redesigned the flagship mobile app for a Fortune 500 retailer. Conducted 50+ user interviews, built interactive Figma prototypes, and boosted NPS by 30 points.', 
    template: 'minimal',
    category: 'tech',
    description: 'A minimal template perfect for creative UX/UI designers, focusing on research-driven and user-centered metrics.',
    benefits: ['Focus on design-centric high-impact typography', 'Clean, spacious layout with optimal readability', 'Highlights core design tools and user-centric results']
  },
  { 
    title: 'Sales Executive', 
    industry: 'SaaS', 
    level: 'Senior', 
    content: 'Consistently exceeded sales targets by 150%. Closed K2M in new software business contracts within the first fiscal year. Expert in Salesforce CRM.', 
    template: 'corporate',
    category: 'business',
    description: 'A performance-driven corporate template for sales leaders aiming to showcase rapid territory growth.',
    benefits: ['High impact quota metrics placement', 'Strong action verbs integration for pipeline leadership', 'ATS-optimized to match key enterprise sales filters']
  },
  { 
    title: 'Data Scientist', 
    industry: 'AI & Data', 
    level: 'Mid-Level', 
    content: 'Developed machine learning models for predictive manufacturing maintenance. Reduced equipment downtime by 20% using Python, Pandas, and TensorFlow.', 
    template: 'modern',
    category: 'tech',
    description: 'A modern, data-focused template, perfect for machine learning engineers and technical analytics specialists.',
    benefits: ['Highlights complex mathematical and predictive projects', 'Tech skills section configured for direct ATS mapping', 'Sophisticated, modern professional look']
  },
  { 
    title: 'Chief Executive Officer', 
    industry: 'Executive', 
    level: 'Executive', 
    content: 'Scaled a Series B enterprise startup to K100M ARR. Led global expansion into 15 new sovereign markets and managed an active workforce of 500+ professionals.', 
    template: 'executive',
    category: 'business',
    description: 'An executive template designed for C-level leadership, focusing on corporate strategy, scale, and P&L delegation.',
    benefits: ['Strategic and boardroom leadership highlights', 'Professional and confident dual-column layout', 'ATS-compliant formatting for high-caliber appointments']
  },
  { 
    title: 'Creative Director', 
    industry: 'Design', 
    level: 'Senior', 
    content: 'Spearheaded the rebranding of a global luxury fashion house. Managed 30+ creatives and won 3 Cannes Lions awards for design innovation.', 
    template: 'creative',
    category: 'business',
    description: 'A standout creative layout designed for creative leads to showcase visual direction and brand leadership.',
    benefits: ['Distinctive design-forward styling touches', 'Highlights visual portfolio links and creative assets', 'Balances creative expression with rigorous ATS guidelines']
  },
  { 
    title: 'Principal Systems Architect', 
    industry: 'Technology', 
    level: 'Executive', 
    content: 'Pioneered zero-trust enterprise network topologies for Fortune 100 leaders. Managed K25M capital expenditure budgets and reduced tech-debt by 35%.', 
    template: 'professional',
    category: 'tech',
    description: 'A premium, modern professional template integrating Teal accents, dark navy highlights, structural pipes and customizable ATS layouts.',
    benefits: ['High impact visual hierarchy matching WCAG AA specifications', 'Designed with a dynamic two-column toggle for ATS compatibility', 'Clean, high-density professional presentation structure']
  },
];

// Generates high-fidelity tailored dataset for template previews to replace generic placeholder info
function getPreviewDataForTemplate(t: typeof templates[0], previewName: string, previewJobTitle: string) {
  const nameToUse = previewName || 'Alex Morgan';
  const titleToUse = previewJobTitle || t.title;

  return {
    personalInfo: {
      fullName: nameToUse,
      email: nameToUse.toLowerCase().replace(/\s+/g, '.') + '@careercraft.com',
      phone: '+1 (555) 019-2834',
      location: t.industry === 'Healthcare' ? 'Chicago, IL' : t.industry === 'Finance' ? 'New York, NY' : 'San Francisco, CA',
      jobTitle: titleToUse,
      linkedin: 'linkedin.com/in/' + nameToUse.toLowerCase().replace(/\s+/g, ''),
    },
    summary: `${titleToUse} with a proven track record in ${t.industry.toLowerCase()} frameworks. Specialized in driving operational performance, team alignment, and executive-level corporate objectives.`,
    experiences: [
      {
        id: 'exp1',
        company: t.industry === 'Technology' ? 'TechNova Solutions' 
               : t.industry === 'Marketing' ? 'Vanguard Media Group'
               : t.industry === 'Healthcare' ? 'Mercy General Hospital'
               : t.industry === 'Finance' ? 'Apex Capital Partners'
               : t.industry === 'Construction' ? 'BuildCorp Enterprises'
               : t.industry === 'Design' ? 'Pixel Craft Studios'
               : t.industry === 'SaaS' ? 'CloudSync Technologies'
               : t.industry === 'AI & Data' ? 'NeuralMind Analytics'
               : t.industry === 'Executive' ? 'Global Alpha Holdings'
               : 'Global Brands Inc',
        role: t.title,
        startDate: '2021',
        endDate: 'Present',
        description: t.content,
        bulletPoints: [
          'Spearheaded development of core deliverables, leading to a measurable 30% increase in productivity.',
          'Formulated standard operating procedures now mandated across all departments.'
        ]
      },
      {
        id: 'exp2',
        company: 'Previous Visionary Co',
        role: 'Associate ' + t.title.replace('Senior ', '').replace('Chief ', ''),
        startDate: '2018',
        endDate: '2021',
        description: `Collaborated with key stakeholders to execute multi-phase roadmaps, resulting in a 15% improvement in process efficiency and workflow execution.`,
        bulletPoints: []
      }
    ],
    educations: [
      {
        id: 'edu1',
        institution: t.industry === 'Healthcare' ? 'Johns Hopkins University' : t.industry === 'Finance' ? 'Wharton School of Business' : 'Stanford University',
        degree: t.industry === 'Healthcare' ? 'Master of Science in Nursing' : t.industry === 'Finance' ? 'Bachelor of Science in Economics' : 'Bachelor of Science in Computer Science',
        graduationYear: '2018'
      }
    ],
    skills: t.benefits ? t.benefits.map(b => b.split(' ')[0]).join(', ') + ', Leadership, Communication, Analysis' : 'Leadership, Strategy, Analysis, Communication',
    certifications: [
      {
        id: 'cert1',
        name: t.industry === 'Technology' ? 'AWS Certified Solutions Architect Code 301' : t.industry === 'Healthcare' ? 'Registered Nurse Board Certification' : 'Project Management Professional (PMP)',
        issuer: 'Professional Board Body',
        date: '2022'
      }
    ],
    projects: [
      {
        id: 'proj1',
        name: t.industry === 'Technology' ? 'OpenSource System Infrastructure' : 'Strategic Initiative Alpha',
        technologies: t.industry === 'Technology' ? 'TypeScript, React, Node.js' : 'Agile, Scrum, Metrics',
        description: 'Pioneered and optimized the technical delivery program, increasing overall user volume capacity by 25%.',
        url: ''
      }
    ],
    achievements: [
      {
        id: 'ach1',
        title: 'Outstanding Excellence & Performance Award',
        description: 'Earned organization-wide recognition for stellar individual contributions and leadership.'
      }
    ],
    referees: []
  };
}

export default function Templates() {
  const [previewName, setPreviewName] = useState('Alex Morgan');
  const [previewTitle, setPreviewTitle] = useState('Senior Software Engineer');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [previewedTemplate, setPreviewedTemplate] = useState<typeof templates[0] | null>(null);
  const [hoveredTemplateForPreview, setHoveredTemplateForPreview] = useState<typeof templates[0] | null>(null);
  const [hoverCoords, setHoverCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const filteredTemplates = templates.filter(t => {
    if (selectedCategory === 'all') return true;
    return t.category === selectedCategory;
  });

  return (
    <div className="min-h-screen bg-[#FDFCFB] dark:bg-slate-950 py-24 px-4 sm:px-6 lg:px-8 transition-colors duration-500">
      <SEO 
        title="Resume Templates Gallery | CareerCraft"
        description="Choose from our collection of ATS-optimized templates designed for every industry and experience level."
        schemaMarkup={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          "itemListElement": templates.map((t, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "name": t.title,
            "description": t.description,
            "url": "https://careercraft.com/templates"
          }))
        }}
      />
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600 dark:text-indigo-400 mb-6 block">The Template Gallery</span>
            <h1 className="font-serif text-6xl md:text-7xl text-slate-900 dark:text-white leading-tight tracking-tight mb-8">
              Executive <span className="italic">Blueprints</span>.
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium mb-12">
              Choose from our collection of ATS-optimized templates designed for every industry and experience level.
            </p>
            
            {/* Interactive Preview Controls */}
            <div className="bg-white dark:bg-slate-905 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-2xl mx-auto flex flex-col sm:flex-row gap-4 mb-10">
              <div className="flex-1 text-left">
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Display Name</label>
                <input 
                  type="text" 
                  value={previewName} 
                  onChange={(e) => setPreviewName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-905 dark:text-white font-sans text-sm focus:outline-none focus:ring-2 focus:ring-indigo-505"
                />
              </div>
              <div className="flex-1 text-left">
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Job Title</label>
                <input 
                  type="text" 
                  value={previewTitle} 
                  onChange={(e) => setPreviewTitle(e.target.value)}
                  placeholder="Enter your job title"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-905 dark:text-white font-sans text-sm focus:outline-none focus:ring-2 focus:ring-indigo-505"
                />
              </div>
            </div>

            {/* Category Filter Pills (UX Recommendation #2) */}
            <div className="flex flex-wrap justify-center gap-2 mb-16 max-w-3xl mx-auto">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    trackEvent('filter_templates_category', { category: cat.id });
                  }}
                  className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-indigo-650 text-white shadow-xl shadow-indigo-100 dark:shadow-none font-bold'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Hover Tip Banner */}
            <div className="hidden lg:flex items-center justify-center gap-2 mb-12 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              <span>Pro-tip: Hover over any template blueprint to inspect its high-fidelity structure in real-time before selecting!</span>
            </div>
          </motion.div>
        </div>

        {/* Gallery Cards Grid Layout */}
        <motion.div 
          layout 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          <AnimatePresence mode="popLayout">
            {filteredTemplates.map((resume, idx) => (
              <motion.div 
                layout
                key={resume.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.25 }}
                className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm hover:shadow-2xl transition-all group relative flex flex-col overflow-hidden"
                onMouseEnter={(e) => {
                  setHoveredTemplateForPreview(resume);
                  setHoverCoords({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => {
                  setHoverCoords({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => {
                  setHoveredTemplateForPreview(null);
                }}
              >
                <div className="flex items-center justify-between mb-6">
                  <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[9px] font-black uppercase tracking-widest">
                    {resume.industry}
                  </span>
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                    {resume.level}
                  </span>
                </div>
                
                {/* Clicking card's realistic mini-preview triggers Live Full-Screen Preview overlay (UX Recommendation #3) */}
                <div 
                  onClick={() => {
                    setPreviewedTemplate(resume);
                    trackEvent('open_full_preview_modal', { template: resume.template, title: resume.title });
                  }}
                  className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 mb-6 shadow-sm relative overflow-hidden h-48 select-none cursor-zoom-in group/preview"
                >
                  <div 
                    style={{ 
                      transform: 'scale(0.24)', 
                      transformOrigin: 'top left',
                      width: '416.6%',
                      height: '416.6%',
                    }}
                    className="absolute top-0 left-0 bg-white dark:bg-slate-900 group-hover/preview:opacity-95 transition-opacity"
                  >
                    <ResumeTemplateRenderer 
                      template={resume.template}
                      accentColor="#4f46e5"
                      fontFamily="Inter"
                      data={getPreviewDataForTemplate(resume, previewName, previewTitle)}
                    />
                  </div>
                  {/* Hover Overlay Visual Feedback */}
                  <div className="absolute inset-0 bg-slate-950/0 hover:bg-slate-95 /10 dark:hover:bg-slate-950/20 group-hover/preview:bg-slate-950/5 z-[5] transition-colors flex items-center justify-center">
                    <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-[9px] font-bold uppercase tracking-widest opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center gap-1">
                      <Eye className="w-3 h-3" /> Click to Preview
                    </div>
                  </div>
                  {/* Fade out bottom overlay */}
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white dark:from-slate-950 to-transparent pointer-events-none z-10" />
                </div>

                <h3 className="font-serif text-xl text-slate-900 dark:text-white mb-2 leading-tight">{resume.title}</h3>
                <p className="text-xs text-slate-405 dark:text-slate-500 uppercase font-bold tracking-wider mb-3">Template: <span className="text-slate-800 dark:text-slate-300 font-mono capitalize">{resume.template}</span></p>
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 italic leading-relaxed mb-8 flex-grow">
                  "{resume.content}"
                </p>
                
                <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="text-[10px]">
                      <p className="font-black text-slate-900 dark:text-white uppercase tracking-widest">ATS Score</p>
                      <p className="text-emerald-600 font-bold">98/100</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {/* Preview Button */}
                    <Tooltip content="Full Preview Screen" position="top">
                      <button
                        id={`btn-preview-${resume.title.replace(/\s+/g, '-').toLowerCase()}`}
                        onClick={() => {
                          setPreviewedTemplate(resume);
                          trackEvent('open_full_preview_modal', { template: resume.template, title: resume.title });
                        }}
                        className="w-10 h-10 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full flex items-center justify-center hover:scale-105 transition-transform border border-slate-200 dark:border-slate-700 cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </Tooltip>

                    {/* Use Template */}
                    <Tooltip content={`Use ${resume.title} template`} position="top">
                      <Link 
                        to={`/resume-builder?template=${resume.template}`} 
                        onClick={() => trackEvent('select_template_gallery', { template: resume.template, title: resume.title })}
                        className="w-10 h-10 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-md"
                      >
                        <ArrowRight className="w-5 h-5" />
                      </Link>
                    </Tooltip>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* AI bespoke options bottom callout badge */}
        <div className="mt-32 text-center">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="inline-flex flex-col md:flex-row items-center gap-6 p-2 pr-8 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-xl"
          >
            <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none">
              <LayoutTemplate className="w-8 h-8" />
            </div>
            <div className="text-left py-4 md:py-0">
              <p className="text-slate-900 dark:text-white font-serif text-xl">Looking for something unique?</p>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Our AI can generate bespoke layouts tailored to your specific career goals.</p>
            </div>
            <Tooltip content="Create a custom layout with AI" position="top">
              <Link to="/resume-builder" className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-all">
                Get Started
              </Link>
            </Tooltip>
          </motion.div>
        </div>
      </div>

      {/* Live Full-Screen Preview Slide-over / Modal (UX Recommendation #3) */}
      <AnimatePresence>
        {previewedTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-slate-905 rounded-[2.5rem] shadow-2xl w-full max-w-6xl h-[85vh] overflow-hidden border border-slate-200 dark:border-slate-850 relative flex flex-col"
            >
              {/* Header */}
              <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-lg font-serif text-slate-900 dark:text-white leading-tight">
                      Template Preview: <span className="italic font-normal">{previewedTemplate.title}</span>
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-xs">A professional ATS-compliant <span className="capitalize font-mono">{previewedTemplate.template}</span> architecture.</p>
                  </div>
                </div>
                <button
                  id="close-preview-modal-btn"
                  onClick={() => setPreviewedTemplate(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Grid content */}
              <div className="flex-1 overflow-y-auto p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
                
                {/* Left panel: Info & metadata */}
                <div className="col-span-1 lg:col-span-5 flex flex-col justify-between">
                  <div className="space-y-6">
                    <div>
                      <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-990/30 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-widest inline-block mb-3">
                        Professional Architecture
                      </span>
                      <h3 className="text-2xl font-serif text-slate-900 dark:text-white leading-tight mb-2">
                        {previewedTemplate.title} layout
                      </h3>
                      <p className="text-slate-650 dark:text-slate-300 text-sm leading-relaxed">
                        {previewedTemplate.description}
                      </p>
                    </div>

                    <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center">
                          <Star className="w-4 h-4 text-indigo-600..." />
                        </div>
                        <div>
                          <p className="text-slate-800 dark:text-slate-200 text-xs font-bold uppercase tracking-wider">ATS Score Guarantee</p>
                          <p className="text-slate-500 dark:text-slate-400 text-xs">Exceeds industry standard parser benchmarks (Score 98/100).</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-slate-800 dark:text-slate-200 text-xs font-bold uppercase tracking-wider">Universal Compatibility</p>
                          <p className="text-slate-500 dark:text-slate-400 text-xs">Includes specialized fields for Projects, Achievements, and Certifications.</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Key Structural Benefits</h4>
                      <ul className="space-y-2.5">
                        {previewedTemplate.benefits.map((benefit, bIdx) => (
                          <li key={bIdx} className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-350">
                            <span className="w-4 h-4 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[9px] font-bold mt-0.5">
                              ✓
                            </span>
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Actions CTA */}
                  <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3">
                    <Link
                      to={`/resume-builder?template=${previewedTemplate.template}`}
                      onClick={() => setPreviewedTemplate(null)}
                      className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-black text-xs uppercase tracking-widest text-center shadow-lg shadow-indigo-100 dark:shadow-none hover:scale-[1.02] transition-transform"
                    >
                      Use This Template
                    </Link>
                    <button
                      id="preview-custom-cancel-btn"
                      onClick={() => setPreviewedTemplate(null)}
                      className="px-6 py-4 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-full font-black text-xs uppercase tracking-widest hover:bg-slate-55 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      Close Preview
                    </button>
                  </div>
                </div>

                {/* Right panel: Digital sheet true visual layout */}
                <div className="col-span-1 lg:col-span-7 bg-slate-55 dark:bg-slate-950 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col h-[60vh] max-h-[60vh]">
                  <div className="text-xs text-slate-400 dark:text-slate-500 mb-3 flex items-center justify-between font-mono">
                    <span>A4 Paper Rendering (Live Interactive)</span>
                    <span>100% Visual Fidelity</span>
                  </div>
                  <div className="flex-1 overflow-y-auto bg-white rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md p-8 sm:p-10 select-none">
                    <ResumeTemplateRenderer 
                      template={previewedTemplate.template}
                      accentColor="#4f46e5"
                      fontFamily="Inter"
                      data={getPreviewDataForTemplate(previewedTemplate, previewName, previewTitle)}
                    />
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Live High-Fidelity Hover Preview Modal */}
      <AnimatePresence>
        {hoveredTemplateForPreview && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            style={{
              position: 'fixed',
              top: `${Math.min(window.innerHeight - 440, Math.max(20, hoverCoords.y - 180))}px`,
              left: `${hoverCoords.x + 35 + 320 > window.innerWidth ? hoverCoords.x - 355 : hoverCoords.x + 35}px`,
              zIndex: 100,
            }}
            className="hidden lg:flex flex-col w-[320px] h-[420px] bg-white/95 dark:bg-slate-900/95 border border-indigo-200 dark:border-indigo-805/40 text-slate-900 dark:text-white rounded-[2rem] shadow-2xl p-5 pointer-events-none overflow-hidden backdrop-blur-md"
            id="hover-template-quick-preview-modal"
          >
            {/* Template Header Card info */}
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[8px] font-black uppercase tracking-widest">
                {hoveredTemplateForPreview.industry}
              </span>
              <span className="text-[8px] text-indigo-500 dark:text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-2 h-2 animate-spin" /> Live Preview
              </span>
            </div>
            
            <h4 className="font-serif text-sm text-slate-900 dark:text-white leading-tight">
              {hoveredTemplateForPreview.title}
            </h4>
            <div className="flex items-center justify-between mt-0.5 mb-2.5">
              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">
                Theme: <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 capitalize">{hoveredTemplateForPreview.template}</span>
              </span>
              <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">
                ATS Score: 98/100
              </span>
            </div>

            {/* A4 Paper miniature representation */}
            <div className="flex-grow bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 overflow-hidden relative shadow-inner">
              <div
                style={{
                  transform: 'scale(0.30)',
                  transformOrigin: 'top left',
                  width: '333%',
                  height: '333%',
                }}
                className="absolute top-2 left-2 bg-white text-slate-900 rounded shadow"
              >
                <ResumeTemplateRenderer 
                  template={hoveredTemplateForPreview.template}
                  accentColor="#4f46e5"
                  fontFamily="Inter"
                  data={getPreviewDataForTemplate(hoveredTemplateForPreview, previewName, previewTitle)}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
