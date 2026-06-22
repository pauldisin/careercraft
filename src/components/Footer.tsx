import { Link } from 'react-router-dom';
import { Twitter, Linkedin, Github, Mail } from 'lucide-react';
import Logo from './Logo';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4 group">
              <Logo className="w-6 h-6 transition-transform group-hover:scale-110" iconClassName="w-4 h-4" />
              <span className="font-serif font-bold text-xl text-slate-900 dark:text-white tracking-tight">CareerCraft</span>
            </Link>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Empowering professionals to build standout resumes and cover letters with the power of artificial intelligence.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors">
                <span className="sr-only">Twitter</span>
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors">
                <span className="sr-only">LinkedIn</span>
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors">
                <span className="sr-only">GitHub</span>
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Product</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/resume-builder" className="text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Resume Builder</Link>
              </li>
              <li>
                <Link to="/cover-letter" className="text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Cover Letter Generator</Link>
              </li>
              <li>
                <Link to="/templates" className="text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Templates</Link>
              </li>
              <li>
                <Link to="/analyzer" className="text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Resume Analyzer</Link>
              </li>
              <li>
                <Link to="/keyword-suggestor" className="text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Keyword Suggestor</Link>
              </li>
              <li>
                <Link to="/pricing" className="text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Pricing</Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Resources</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/about" className="text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">About Us</Link>
              </li>
              <li>
                <Link to="/help" className="text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Help Center</Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/privacy" className="text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Terms of Service</Link>
              </li>
              <li>
                <Link to="/cookies" className="text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Cookie Policy</Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            &copy; {currentYear} CareerCraft. All rights reserved.
          </p>
          <div className="mt-4 md:mt-0 flex space-x-6">
            <span className="text-sm text-slate-500 dark:text-slate-400">Built with React & Tailwind CSS</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
