import { motion } from 'motion/react';
import { Target, Users, Zap, Shield, Sparkles } from 'lucide-react';
import SEO from '../components/SEO';

export default function About() {
  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 transition-colors duration-300 py-12 px-4 sm:px-6 lg:px-8">
      <SEO 
        title="About CareerCraft | AI-Powered Resume & Career Tools" 
        description="Learn about CareerCraft, our mission to democratize career advancement, and the team building AI-powered resume and cover letter tools."
      />
      <div className="max-w-4xl mx-auto space-y-16">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6"
        >
          <div className="inline-flex items-center justify-center p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl mb-4">
            <Sparkles className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            About CareerCraft
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Empowering professionals to build compelling narratives, land dream roles, and navigate their careers with AI-driven precision.
          </p>
        </motion.div>

        {/* Mission Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-900 rounded-3xl p-8 md:p-12 border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-xl">
              <Target className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Our Mission</h2>
          </div>
          <div className="space-y-4 text-slate-600 dark:text-slate-400 leading-relaxed text-lg">
            <p>
              At CareerCraft, we believe that everyone deserves a fair shot at their dream job. However, the modern hiring process is often opaque, heavily reliant on Applicant Tracking Systems (ATS), and biased towards those who know the "rules of the game."
            </p>
            <p>
              Our mission is to democratize career advancement by providing intelligent, accessible tools that help you translate your unique experiences into the language that recruiters and algorithms understand. We bridge the gap between your potential and your next opportunity.
            </p>
          </div>
        </motion.div>

        {/* Benefits/Features Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="bg-purple-100 dark:bg-purple-900/30 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
              <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">AI-Powered Precision</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We leverage cutting-edge generative AI to analyze job descriptions, optimize keywords, and craft compelling narratives that highlight your true value.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="bg-amber-100 dark:bg-amber-900/30 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
              <Shield className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Privacy & Security</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Your career data is personal. We employ robust security measures to ensure your information remains private, secure, and entirely under your control.
            </p>
          </div>
        </motion.div>

        {/* Team Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-slate-900 rounded-3xl p-8 md:p-12 border border-slate-200 dark:border-slate-800 shadow-sm text-center"
        >
          <div className="inline-flex items-center justify-center p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl mb-6">
            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">The Team Behind CareerCraft</h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg max-w-2xl mx-auto">
            We are a passionate team of engineers, designers, and career strategists dedicated to building the future of work. With backgrounds spanning tech, recruitment, and education, we've combined our expertise to create a platform that truly understands what it takes to stand out in today's competitive job market.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
