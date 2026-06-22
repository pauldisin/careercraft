/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import Layout from './components/Layout';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';
import { Toaster, toast } from 'react-hot-toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Loader2 } from 'lucide-react';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const ResumeBuilder = lazy(() => import('./pages/ResumeBuilder'));
const CoverLetterBuilder = lazy(() => import('./pages/CoverLetterBuilder'));
const Analyzer = lazy(() => import('./pages/Analyzer'));
const KeywordSuggestor = lazy(() => import('./pages/KeywordSuggestor'));
const JobTracker = lazy(() => import('./pages/JobTracker'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Account = lazy(() => import('./pages/Account'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Success = lazy(() => import('./pages/Success'));
const Cancel = lazy(() => import('./pages/Cancel'));

const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Auth = lazy(() => import('./pages/Auth'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
const MyResumes = lazy(() => import('./pages/MyResumes'));
const Templates = lazy(() => import('./pages/Templates'));
const About = lazy(() => import('./pages/About'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const CookiePolicy = lazy(() => import('./pages/CookiePolicy'));
const Blog = lazy(() => import('./pages/Blog'));
const CareerAdvice = lazy(() => import('./pages/CareerAdvice'));
const InterviewPrep = lazy(() => import('./pages/InterviewPrep'));
const HelpCenter = lazy(() => import('./pages/HelpCenter'));
const Contact = lazy(() => import('./pages/Contact'));

const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
  </div>
);

function RouteMetadata() {
  const location = useLocation();
  const path = location.pathname;

  let title = "CareerCraft - AI Resume & Cover Letter Builder";
  let description = "Elevate your professional narrative with AI-driven precision. Build ATS-optimized resumes and cover letters.";

  if (path === '/') {
    title = "CareerCraft - AI Resume & Cover Letter Builder";
    description = "Elevate your professional narrative with AI-driven precision. Build ATS-optimized resumes and cover letters and land your dream job with AI.";
  } else if (path === '/blog') {
    title = "CareerCraft Blog | Latest Resume Writing & Career Tips";
    description = "Expert career guidelines, template spotlights, and the latest on Yewo AI tool integrations from CareerCraft.";
  } else if (path === '/career-advice') {
    title = "Expert Career Advice & Strategy Guides | CareerCraft";
    description = "Step-by-step guides for preparing virtual interviews, salary negotiations, and conquering the Applicant Tracking System algorithms.";
  } else if (path === '/analyzer') {
    title = "Resume Analyzer & ATS Compatibility Match Score | CareerCraft";
    description = "Run your resume against the industry standards and get instant match grades, formatting advice, and checklist indicators.";
  } else if (path === '/keyword-suggestor') {
    title = "AI Keyword Suggestor & Resume Optimization | CareerCraft";
    description = "Compare resumes with target job context descriptions to generate specific keywords and phrasing structures built for compliance with ATS trackers.";
  } else if (path === '/pricing') {
    title = "Affordable Pro Career Pricing Packages | CareerCraft";
    description = "Explore premium plans. Unlock infinite cover letter versions, unlimited edits, tracking, and keyword analytics exports.";
  } else if (path === '/templates') {
    title = "Aesthetic, ATS-Optimized Professional Resume Templates | CareerCraft";
    description = "Deploy resume templates that combine minimalist styles, elegant whitespace, and high compliance standards for recruiter reviews.";
  } else if (path === '/about') {
    title = "About CareerCraft | Mission & Strategic Career Support";
    description = "Meet the team and trace our dedication toward creating standard accessible recruitment optimization tooling.";
  } else if (path === '/contact') {
    title = "Help Desk & Customer Care support | CareerCraft Team";
    description = "Do you have integrations, token usage, or custom template questions? Contact our dedicated support team.";
  }

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
}

export default function App() {
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      const message = event.message || '';
      const err = event.error;
      const errMsg = err?.message || '';
      
      if (
        message.includes('dynamically imported module') || 
        message.includes('Failed to fetch') || 
        message.includes('ChunkLoadError') ||
        errMsg.includes('dynamically imported module') ||
        errMsg.includes('Failed to fetch') ||
        errMsg.includes('ChunkLoadError')
      ) {
        const lastReload = sessionStorage.getItem('last_chunk_reload');
        const now = Date.now();
        if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
          sessionStorage.setItem('last_chunk_reload', String(now));
          window.location.reload();
          return;
        }
      }

      console.group('%c🚨 [CareerCraft Global Error Boundary]', 'color: #ef4444; font-weight: bold; font-size: 13px;');
      console.warn('Source:', message);
      if (err?.stack) {
        console.warn('Trace:', err.stack);
      }
      console.groupEnd();
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      event.preventDefault(); // Stop default browser printing if we handle it
      const err = event.reason;
      if (!err) return;
      const message = err.message || String(err);
      
      if (
        message.includes('dynamically imported module') || 
        message.includes('Failed to fetch') || 
        message.includes('ChunkLoadError')
      ) {
        const lastReload = sessionStorage.getItem('last_chunk_reload');
        const now = Date.now();
        if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
          sessionStorage.setItem('last_chunk_reload', String(now));
          window.location.reload();
          return;
        }
      }

      console.group('%c⚡ [CareerCraft Unhandled Rejection]', 'color: #f59e0b; font-weight: bold; font-size: 13px;');
      console.warn('Reason:', message);
      if (err?.stack) {
        console.warn('Trace:', err.stack);
      }
      console.groupEnd();

      // Avoid showing spammy quota errors in hot-toast UI, but show a user-friendly generic system notification if not ignorable
      if (message && !message.includes('quota') && !message.includes('Quota') && !message.includes('RESOURCE_EXHAUSTED')) {
        toast.error(`System status: ${message.slice(0, 75)}${message.length > 75 ? '...' : ''}`, {
          id: 'unhandled-rejection-warning',
          duration: 4000
        });
      }
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    console.log('%c🛡️ Centralized Diagnostic Error Monitor active on Client Layer.', 'color: #10b981; font-weight: 600;');

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <HelmetProvider>
      <ErrorBoundary>
        <AuthProvider>
          <BrowserRouter>
            <RouteMetadata />
            <Toaster position="top-right" />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<LandingPage />} />
                  <Route path="auth" element={<Auth />} />
                  <Route path="reset-password" element={<ResetPassword />} />
                  <Route path="auth/callback" element={<AuthCallback />} />
                  <Route path="resume-builder" element={<ResumeBuilder />} />
                  <Route path="templates" element={<Templates />} />
                  <Route path="cover-letter" element={
                    <ProtectedRoute>
                      <CoverLetterBuilder />
                    </ProtectedRoute>
                  } />
                  <Route path="analyzer" element={
                    <ProtectedRoute>
                      <Analyzer />
                    </ProtectedRoute>
                  } />
                  <Route path="keyword-suggestor" element={
                    <ProtectedRoute>
                      <KeywordSuggestor />
                    </ProtectedRoute>
                  } />
                  <Route path="job-tracker" element={
                    <ProtectedRoute>
                      <JobTracker />
                    </ProtectedRoute>
                  } />
                  <Route path="pricing" element={<Pricing />} />
                  <Route path="success" element={<Success />} />
                  <Route path="cancel" element={<Cancel />} />

                  <Route path="about" element={<About />} />
                  <Route path="privacy" element={<PrivacyPolicy />} />
                  <Route path="terms" element={<TermsOfService />} />
                  <Route path="cookies" element={<CookiePolicy />} />
                  <Route path="blog" element={<Blog />} />
                  <Route path="career-advice" element={<CareerAdvice />} />
                  <Route path="interview-prep" element={<InterviewPrep />} />
                  <Route path="help" element={<HelpCenter />} />
                  <Route path="contact" element={<Contact />} />
                  <Route path="my-resumes" element={
                    <ProtectedRoute>
                      <MyResumes />
                    </ProtectedRoute>
                  } />
                  <Route path="account" element={
                    <ProtectedRoute>
                      <Account />
                    </ProtectedRoute>
                  } />
                  <Route path="admin" element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  } />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </ErrorBoundary>
    </HelmetProvider>
  );
}
