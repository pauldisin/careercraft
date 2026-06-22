import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, MessageSquare, Clock, ArrowRight, ShieldCheck, AlertCircle, Sparkles, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { trackEvent } from '../lib/analytics';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const subjects = [
    { value: 'support', label: 'Technical & Account Support' },
    { value: 'billing', label: 'Billing, Receipts & Local Bank Payments' },
    { value: 'resume', label: 'AI Builder & Parser Help' },
    { value: 'business', label: 'Corporate or Academic Partnerships' },
    { value: 'other', label: 'Other General Inquiry' },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || data.message || 'Something went wrong. Please try again.');
      }

      setStatus('success');
      trackEvent('contact_form_submitted', { subject: formData.subject });
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err: any) {
      console.error('Contact submit error:', err);
      setStatus('error');
      setErrorMessage(err.message || 'An unexpected error occurred. Please check your connection.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] dark:bg-slate-950 py-24 px-4 sm:px-6 lg:px-8">
      <SEO title="Contact Us | CareerCraft" description="Get in touch with the CareerCraft support team." />

      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-55/10 dark:bg-indigo-950/30 rounded-full mb-4">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Support Channels
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight leading-none">
              Get in Touch with Us
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 font-sans">
              Have questions about resume optimization, local transfers, or your account subscriptions? Send us a line and our dedicated desk will assist you.
            </p>
          </motion.div>
        </div>

        {/* Form and Sidebar Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Essential Info Cards */}
          <div className="lg:col-span-5 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"
            >
              <h2 className="font-serif text-2xl font-bold text-slate-900 dark:text-white mb-6">
                Direct Contact Channels
              </h2>

              <div className="space-y-6">
                {/* Channel 1: Email */}
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl text-indigo-600 dark:text-indigo-400 shrink-0">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white mb-1">
                      General & Account Support
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                      Reach out for template advice, password resets, or general feedback.
                    </p>
                    <a
                      href="mailto:support@careercraft.example"
                      className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                    >
                      support@careercraft.example
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Channel 2: Billing Inquiry */}
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/50 rounded-xl text-amber-600 dark:text-amber-400 shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white mb-1">
                      Billing & Verification Desk
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                      Need help uploading a manual receipt or Wantok payment verification screenshot?
                    </p>
                    <a
                      href="mailto:billing@careercraft.example"
                      className="text-sm font-medium text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1"
                    >
                      billing@careercraft.example
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Response Timeline */}
                <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                  <Clock className="w-5 h-5 text-slate-500 dark:text-slate-400 shrink-0" />
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    <strong>Standard Turnaround:</strong> Responses are drafted within 24 business hours.
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Help Center CTA Card */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="p-6 bg-indigo-900/5 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-950 rounded-2xl"
            >
              <div className="flex gap-4">
                <MessageSquare className="w-10 h-10 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white mb-1">
                    Check the Help Center
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    Already looking for subscription cancellations, template options, or download guides? We may have already answered it.
                  </p>
                  <Link
                    to="/help"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Go to Help Center
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Dynamic Form Block */}
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"
              id="contact-form-container"
            >
              <AnimatePresence mode="wait">
                {status === 'success' ? (
                  <motion.div
                    key="success-state"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="text-center py-12"
                  >
                    <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="w-10 h-10" />
                    </div>
                    <h2 className="font-serif text-3xl font-bold text-slate-900 dark:text-white mb-4">
                      Message Sent!
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 max-w-lg mx-auto mb-8 font-sans">
                      Thank you for contacting CareerCraft. Your inquiry has been registered in our support queue, and we have fired a validation notification copy to our support desk. Check your email for further feedback within 24 hours.
                    </p>
                    <div className="flex justify-center gap-4">
                      <button
                        onClick={() => setStatus('idle')}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium text-sm shadow-sm"
                      >
                        Submit Another Inquiry
                      </button>
                      <Link
                        to="/"
                        className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors font-medium text-sm"
                      >
                        Return Home
                      </Link>
                    </div>
                  </motion.div>
                ) : (
                  <motion.form
                    key="contact-form"
                    onSubmit={handleSubmit}
                    className="space-y-6"
                  >
                    <h2 className="font-serif text-2xl font-bold text-slate-900 dark:text-white mb-2">
                      Send a Message
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                      Have specific issues? Fill in the fields below, and our support routing system will direct your question to the proper expert.
                    </p>

                    {status === 'error' && (
                      <div className="p-4 bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 rounded-r-lg flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                        <div>
                          <h4 className="font-semibold text-red-900 dark:text-red-300 text-sm">Submission Failed</h4>
                          <p className="text-xs text-red-700 dark:text-red-400 mt-1">{errorMessage}</p>
                        </div>
                      </div>
                    )}

                    {/* Name input */}
                    <div>
                      <label htmlFor="name" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Your Full Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        id="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="John Doe"
                        className="w-full h-11 px-4 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-shadow"
                      />
                    </div>

                    {/* Email input */}
                    <div>
                      <label htmlFor="email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Your Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="john@example.com"
                        className="w-full h-11 px-4 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-shadow"
                      />
                    </div>

                    {/* Subject Selector */}
                    <div>
                      <label htmlFor="subject" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Inquiry Topic / Reason
                      </label>
                      <select
                        name="subject"
                        id="subject"
                        required
                        value={formData.subject}
                        onChange={handleChange}
                        className="w-full h-11 px-4 py-2 border border-slate-200 dark:border-slate-800 bg-[#FDFCFB] dark:bg-slate-900 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-shadow"
                      >
                        <option value="">-- Choose a Topic --</option>
                        {subjects.map((sub) => (
                          <option key={sub.value} value={sub.value}>
                            {sub.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Message body */}
                    <div>
                      <label htmlFor="message" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Your Detailed Message
                      </label>
                      <textarea
                        name="message"
                        id="message"
                        required
                        rows={5}
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Please write out any steps or specific transaction details here..."
                        className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-shadow resize-none"
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      id="btn-contact-submit"
                      disabled={status === 'loading'}
                      className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg transition-colors font-medium text-sm flex items-center justify-center gap-2 shadow-sm"
                    >
                      {status === 'loading' ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Transmitting Message...
                        </>
                      ) : (
                        'Submit Support Ticket'
                      )}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
}
