import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SEO from '../components/SEO';

export default function HelpCenter() {
  const [activeFaqId, setActiveFaqId] = useState<string | null>(null);

  const faqItems = [
    {
      id: 'download-resume',
      question: 'How do I download my resume?',
      answer: (
        <p className="m-0">
          Once you are happy with your resume, click the <strong>"Export"</strong> or <strong>"Download"</strong> button in the Resume Builder preview section to download it as a PDF.
        </p>
      )
    },
    {
      id: 'free-tier',
      question: 'Can I use the AI tool for free?',
      answer: (
        <p className="m-0">
          We offer a free tier with limited AI generations. For unlimited access to our AI features and premium templates, please check our <Link to="/pricing" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">Pricing page</Link>.
        </p>
      )
    },
    {
      id: 'cancel-subscription',
      question: 'How do I cancel my subscription?',
      answer: (
        <p className="m-0">
          You can manage or cancel your subscription at any time through your <Link to="/account" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">Account settings</Link>.
        </p>
      )
    },
    {
      id: 'ats-friendly',
      question: 'How do I make my resume ATS-friendly?',
      answer: (
        <p className="m-0">
          To optimize for ATS (Applicant Tracking Systems), use a clean structure without multi-column overlap, incorporate key matches under skills/experience directly from target job listings, avoid text boxes/shapes, and employ standard, easy-to-parse headings.
        </p>
      )
    },
    {
      id: 'resume-length',
      question: 'What is the recommended length for a professional resume?',
      answer: (
        <p className="m-0">
          For most candidates, a concise <strong>one-page</strong> resume is industry standard. Candidates with over 10+ years of specialized experience or deep leadership backgrounds can use a structured <strong>two-page</strong> format. Focus purely on high-impact accomplishment details.
        </p>
      )
    },
    {
      id: 'multiple-resumes',
      question: 'Can I build multiple specialized resumes?',
      answer: (
        <p className="m-0">
          Absolutely! Our platform allows you to create, copy, and manage several different resumes. This allows you to tailor your applications directly to different job openings and optimize each document's keyword scores.
        </p>
      )
    },
    {
      id: 'parser-guide',
      question: 'How does the automated AI parsing tool work?',
      answer: (
        <p className="m-0">
          Simply upload your historic PDF or Word document in the dashboard. Our parsing engine reads the layout architecture, pulls your experience, skills, and education history, and instantly sets up a modern, editable formatting template inside CareerCraft.
        </p>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-[#FDFCFB] dark:bg-slate-950 py-24 px-4 sm:px-6 lg:px-8">
      <SEO 
        title="Help Center | CareerCraft" 
        description="Find answers to frequently asked questions about CareerCraft resume builds, subscription plans, ATS compatibility, and Yewo AI chatbot guidance." 
        schemaMarkup={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "How do I download my resume?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Once you are happy with your resume, click the 'Export' or 'Download' button in the Resume Builder preview section to download it as a PDF."
              }
            },
            {
              "@type": "Question",
              "name": "Can I use the AI tool for free?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "We offer a free tier with limited AI generations. For unlimited access to our AI features and premium templates, please check our Pricing page."
              }
            },
            {
              "@type": "Question",
              "name": "How do I cancel my subscription?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "You can manage or cancel your subscription at any time through your Account settings."
              }
            },
            {
              "@type": "Question",
              "name": "How do I make my resume ATS-friendly?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "To optimize for ATS (Applicant Tracking Systems), use a clean structure without multi-column overlap, incorporate key matches under skills/experience directly from target job listings, avoid text boxes or nested shapes, and employ standard, easy-to-parse headings."
              }
            },
            {
              "@type": "Question",
              "name": "What is the recommended length for a professional resume?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "For most candidates, a concise one-page resume is industry standard. Candidates with over 10+ years of specialized experience or deep leadership backgrounds can use a structured two-page format. Focus purely on high-impact accomplishment details."
              }
            },
            {
              "@type": "Question",
              "name": "Can I build multiple specialized resumes?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Absolutely! Our platform allows you to create, copy, and manage several different resumes. This allows you to tailor your applications directly to different job openings and optimize each document's keyword scores."
              }
            },
            {
              "@type": "Question",
              "name": "How does the automated AI parsing tool work?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Simply upload your historic PDF or Word document in the dashboard. Our parsing engine reads the layout architecture, pulls your experience, skills, and education history, and instantly sets up a modern, editable formatting template inside CareerCraft."
              }
            }
          ]
        }}
      />
      <div className="max-w-3xl mx-auto prose dark:prose-invert">
        <h1 className="font-serif text-4xl mb-8">Help Center</h1>
        
        <p>Welcome to the CareerCraft Help Center. We are here to ensure you create the best resume possible. Below you can find answers to frequently asked questions.</p>
        
        <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white mt-8 mb-6">Frequently Asked Questions</h2>
        
        <div className="space-y-4 my-8 not-prose">
          {faqItems.map((item) => {
            const isOpen = activeFaqId === item.id;
            return (
              <div 
                key={item.id}
                id={`faq-item-${item.id}`}
                className="group border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden transition-all duration-300 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700"
              >
                <button
                  type="button"
                  id={`faq-btn-${item.id}`}
                  onClick={() => setActiveFaqId(isOpen ? null : item.id)}
                  className="w-full flex items-center justify-between p-5 text-left font-semibold text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-3">
                    <HelpCircle className="w-5 h-5 text-indigo-500 shrink-0" />
                    <span>{item.question}</span>
                  </div>
                  <ChevronDown 
                    className={`w-5 h-5 text-slate-400 transition-transform duration-300 shrink-0 ${
                      isOpen ? 'transform rotate-180 text-indigo-500' : 'group-hover:text-slate-600 dark:group-hover:text-slate-300'
                    }`} 
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div className="border-t border-slate-100 dark:border-slate-800/80 p-5">
                        <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50/50 dark:bg-slate-900/40 rounded-xl p-4">
                          {item.answer}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        <h2 className="mt-12 text-2xl font-serif font-bold text-slate-900 dark:text-white">Yewo AI & ATS Score Transparency</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          At CareerCraft, we believe in full transparency regarding AI-driven features. **Yewo** is designed as a powerful preparatory tool to optimize your document structure, structure metrics, and align keywords before official submissions. Below is what you should keep in mind:
        </p>

        <div className="space-y-6 mt-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-150 dark:border-slate-800">
            <h4 className="font-semibold text-slate-900 dark:text-white m-0 text-sm">💡 How is my ATS Compatibility Score calculated?</h4>
            <p className="text-xs text-slate-600 dark:text-slate-450 mt-2 mb-0 leading-relaxed">
              Our analyzer scores compatibility out of 100 based on three core pillars:
            </p>
            <ul className="text-xs text-slate-600 dark:text-slate-450 mt-2 mb-0 space-y-1.5 leading-relaxed">
              <li><strong>Keyword Matching:</strong> Scanning if the critical hard/soft skill tokens specified in the job description appear naturally in your text.</li>
              <li><strong>Action Verb Strength:</strong> Verification of metrics-driven leadership indicators instead of passive duties.</li>
              <li><strong>Formatting Integrity:</strong> Identifying complex, multi-column layouts or nested shapes that standard parser engines struggle to read.</li>
            </ul>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-150 dark:border-slate-800">
            <h4 className="font-semibold text-slate-900 dark:text-white m-0 text-sm">⚠️ What are the limitations of Yewo AI?</h4>
            <p className="text-xs text-slate-600 dark:text-slate-450 mt-2 mb-0 leading-relaxed">
              While Yewo is highly sophisticated, it operates within clear boundaries:
            </p>
            <ul className="text-xs text-slate-600 dark:text-slate-450 mt-2 mb-0 space-y-1.5 leading-relaxed">
              <li><strong>Contextual Accuracy:</strong> AI evaluates semantic similarity. It cannot authenticate your actual level of competence or verify historical work accuracy.</li>
              <li><strong>ATS Machine Variations:</strong> There is no single universal "ATS standard". Different talent programs use different parsing systems with proprietary algorithms. Yewo provides a highly standardized baseline representing best practices.</li>
              <li><strong>No Cultural Fit Evaluation:</strong> The AI cannot assess your soft character strengths, work style compatibilities, or cultural fits.</li>
            </ul>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-150 dark:border-slate-800">
            <h4 className="font-semibold text-slate-900 dark:text-white m-0 text-sm">🛠️ How can I get the best results from Yewo?</h4>
            <p className="text-xs text-slate-600 dark:text-slate-450 mt-2 mb-0 leading-relaxed">
              To maximize analysis accuracy, adhere to these simple input practices:
            </p>
            <ul className="text-xs text-slate-600 dark:text-slate-450 mt-2 mb-0 space-y-1.5 leading-relaxed">
              <li><strong>Provide a Complete Job Description:</strong> Supplying the actual target job description (rather than just job titles) enables surgical keyword mapping.</li>
              <li><strong>Input Standard Continuous Text:</strong> Avoid sending raw lists of disjointed words or highly stylized bullet fragments; complete achievements evaluate best.</li>
              <li><strong>Combine with Human Intuition:</strong> Treat Yewo's suggestions as high-quality feedback. Always review the final PDF document manually or ask a trusted peer to doublecheck before submitting.</li>
            </ul>
          </div>
        </div>

        <h2 className="mt-12 text-2xl font-serif font-bold text-slate-900 dark:text-white">Still need help?</h2>
        <p className="text-slate-600 dark:text-slate-400">
          If you couldn't find the answer to your question, don't worry. Our engineering, billing, and resume analysis support desks are here to handle your request.
        </p>

        <div className="mt-6 p-6 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-155 dark:border-indigo-950/50 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white m-0 mb-1">Submit a Structured Support Request</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 m-0">
              Launch our contact wizard to route support requests or local bank billing receipt documents directly to the correct desk.
            </p>
          </div>
          <Link
            to="/contact"
            id="btn-help-to-contact"
            className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
          >
            Create Support Ticket
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl flex flex-col md:flex-row gap-4 justify-between items-start md:items-center text-sm font-sans text-slate-500 dark:text-slate-400">
          <p className="m-0">
            <strong>Prefer standard email?</strong> Reach out via <a href="mailto:support@careercraft.example" className="text-indigo-600 dark:text-indigo-400 hover:underline">support@careercraft.example</a>
          </p>
          <span className="text-xs">Replies received within 24 business hours.</span>
        </div>
      </div>
    </div>
  );
}
