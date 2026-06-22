import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Trash2, Sparkles, Loader2, Landmark, Smartphone, RefreshCw, LogIn, ChevronLeft, Upload, Check, AlertCircle, Calendar } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import Markdown from 'react-markdown';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  parts: { text: string }[];
}

export default function YewoChatbot() {
  const { user, refreshUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'wantok' | 'sms' | 'mobile_banking' | 'internet_banking'>('mobile_banking');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [plan, setPlan] = useState<'basic' | 'bundle' | 'premium' | 'pro' | 'unlimited'>('pro');
  const [type, setType] = useState<'payment' | 'subscription'>('subscription');
  const [screenshotBase64, setScreenshotBase64] = useState<string | null>(null);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentSubmissionSuccess, setPaymentSubmissionSuccess] = useState(false);
  const [demoQueriesCount, setDemoQueriesCount] = useState<number>(() => {
    const saved = localStorage.getItem('yewo_demo_queries_sent');
    return saved ? parseInt(saved, 10) : 0;
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMsg: ChatMessage = {
      id: 'welcome',
      role: 'model',
      parts: [{ 
        text: `Halo! I am **Yewo**, your CareerCraft Co-pilot. ✨ 

I can help you:
- Optimize your resume and write matching cover letters.
- Guide you through CareerCraft premium activation.
- Explore templates like our direct, ATS-optimized **Professional Template** with high accessibility.

What can I help you build today?`
      }]
    };
    setMessages([welcomeMsg]);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isLoading]);

  const clearConversation = () => {
    if (window.confirm("Are you sure you want to clean your conversation history?")) {
      const welcomeMsg: ChatMessage = {
        id: 'welcome',
        role: 'model',
        parts: [{ 
          text: `Halo! Conversation restarted. I am **Yewo**, ready to help you with your files, templates, or BSP payment activations. How are you doing today?` 
        }]
      };
      setMessages([welcomeMsg]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptNumber.trim()) {
      alert("Please provide the receipt/reference number.");
      return;
    }
    if (!amountStr.trim()) {
      alert("Please specify the amount paid.");
      return;
    }

    setIsSubmittingPayment(true);
    try {
      const res = await apiFetch('/api/payments/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          type,
          method: paymentMethod,
          receiptNumber: receiptNumber.trim(),
          amountStr: amountStr.trim(),
          screenshotUrl: screenshotBase64 || undefined
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to submit verification payment");
      }

      setPaymentSubmissionSuccess(true);
      
      // Instantly trigger profile refresh so their status updates to 'active' on-screen!
      if (typeof refreshUser === 'function') {
        await refreshUser();
      }

      // Add helper message in user history
      const successMsg: ChatMessage = {
        id: `m-payment-${Date.now()}`,
        role: 'model',
        parts: [{
          text: `🎯 **Payment Verification Request Received!**\n\n* **Plan**: \`${plan.toUpperCase()}\` (${type})\n* **Method**: \`${paymentMethod.toUpperCase()}\`\n* **Receipt / Ref**: \`${receiptNumber}\`\n* **Amount**: \`PGK ${amountStr}\`\n\n⚡ **Instant 24-Hour Premium Grace Access Activated!** You have complete unrestricted access to all resumes, cover letter builders, and AI optimization engines right now. Manual verification is pending (typically takes 2-4 hours).`
        }]
      };
      setMessages(prev => [...prev, successMsg]);

    } catch (err: any) {
      console.error(err);
      alert(err.message || "An error occurred while submitting payment.");
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleSuggestion = (promptText: string) => {
    if (isLoading) return;
    sendMessage(promptText);
  };

  const sendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed) return;

    if (!user) {
      if (demoQueriesCount >= 3) {
        const limitMsg: ChatMessage = {
          id: `limit-${Date.now()}`,
          role: 'model',
          parts: [{ 
            text: `🔒 **Free Trial Limit Reached**\n\nYou've used your 3 complimentary anonymous questions. To continue chatting with **Yewo**, build custom professional resumes, and optimize your career details, please **sign up** for a free account!` 
          }]
        };
        setMessages(prev => [...prev, { id: `u-${Date.now()}`, role: 'user', parts: [{ text: trimmed }] }, limitMsg]);
        return;
      }

      // Guest Demo Mode!
      const guestMessageCount = demoQueriesCount + 1;
      setDemoQueriesCount(guestMessageCount);
      localStorage.setItem('yewo_demo_queries_sent', guestMessageCount.toString());

      const newUserMessage: ChatMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        parts: [{ text: trimmed }]
      };

      setMessages(prev => [...prev, newUserMessage]);
      setInputValue('');
      setIsLoading(true);

      try {
        const chatHistory = messages
          .filter(m => m.id !== 'welcome')
          .map(m => ({
            role: m.role,
            parts: [{ text: m.parts[0].text }]
          }));

        const response = await apiFetch('/api/ai/demo-chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            history: chatHistory,
            message: trimmed
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Server error communicating with Yewo.');
        }

        const data = await response.json();
        
        const feedbackPrompt = guestMessageCount >= 3 
          ? `\n\n💡 **Demo questions completely used.** [Log In or Sign Up](/auth) to unlock full document customizing tools!` 
          : `\n\n💡 *Demo Mode: ${3 - guestMessageCount} free trial questions remaining.*`;

        const newModelMessage: ChatMessage = {
          id: `m-${Date.now()}`,
          role: 'model',
          parts: [{ text: (data.text || "I was unable to formulate a response. Please try again.") + feedbackPrompt }]
        };

        setMessages(prev => [...prev, newModelMessage]);
      } catch (error: any) {
        console.error("Yewo demo communication error:", error);
        const errorMessage: ChatMessage = {
          id: `m-err-${Date.now()}`,
          role: 'model',
          parts: [{ 
            text: `⚠️ **Yewo is offline for a quick update**\n\n${error.message || "An error occurred while connecting. Please try again in a few moments."}` 
          }]
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    const newUserMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      parts: [{ text: trimmed }]
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Format history in exact alignment with the backend PostAiChatSchema
      // We skip the welcome message to keep the token usage lean (backend will supply system prompt matching welcome)
      const chatHistory = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({
          role: m.role,
          parts: [{ text: m.parts[0].text }]
        }));

      const response = await apiFetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          history: chatHistory,
          message: trimmed
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Server error communicating with Yewo.');
      }

      const data = await response.json();
      
      const newModelMessage: ChatMessage = {
        id: `m-${Date.now()}`,
        role: 'model',
        parts: [{ text: data.text || "I was unable to formulate a response. Please try again." }]
      };

      setMessages(prev => [...prev, newModelMessage]);
    } catch (error: any) {
      console.error("Yewo communication error:", error);
      const errorMessage: ChatMessage = {
        id: `m-err-${Date.now()}`,
        role: 'model',
        parts: [{ 
          text: `⚠️ **Yewo is offline for a quick update**\n\n${error.message || "An error occurred while connecting. Please try again in a few moments."}` 
        }]
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const suggestionChips = [
    { label: "BSP / Wantok Info", prompt: "What are the BSP Bank of South Pacific and Wantok Wallet payment active details?" },
    { label: "Professional Template", prompt: "Tell me about the new ATS Professional Template details" },
    { label: "Resume Optimizer", prompt: "How do I optimize my resume for ATS tracking systems?" }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-[99] print:hidden no-select" id="yewo-chatbot-container">
      {/* Floating Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 bg-gradient-to-tr from-teal-500 to-indigo-600 hover:from-teal-600 hover:to-indigo-700 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all relative cursor-pointer group"
        aria-label="Open Yewo Chatbot"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <X className="w-6 h-6" key="close-icon" />
          ) : (
            <div className="relative flex items-center justify-center w-full h-full" key="open-icon">
              <MessageSquare className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-teal-500 text-[8px] font-bold text-white items-center justify-center">1</span>
              </span>
            </div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat Window Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: -20, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
            className="absolute bottom-16 right-0 w-[350px] sm:w-[400px] h-[550px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-150 dark:border-slate-800 flex flex-col overflow-hidden origin-bottom-right"
          >
            {/* Header */}
            <div className="px-4 py-3.5 bg-gradient-to-r from-teal-500 via-indigo-600 to-indigo-700 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                {showPaymentForm && (
                  <button 
                    onClick={() => {
                      setShowPaymentForm(false);
                      setPaymentSubmissionSuccess(false);
                    }}
                    className="mr-1 p-1 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5 text-white" />
                  </button>
                )}
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20 select-none">
                  <Sparkles className="w-4 h-4 text-teal-300" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight">
                    {showPaymentForm ? 'Local Payment Proof' : 'Yewo'}
                  </h3>
                  <p className="text-[10px] text-teal-100 font-medium">
                    {showPaymentForm ? 'Instant 24-hr Grace Period' : 'CareerCraft AI Assistant'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {!showPaymentForm && (
                  <button
                    onClick={clearConversation}
                    className="p-1.5 hover:bg-white/15 rounded-lg transition-colors cursor-pointer text-white/80 hover:text-white"
                    title="Clear history"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/15 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {!user && (
              <div className="bg-amber-500/10 border-b border-amber-200/20 px-4 py-1.5 flex items-center justify-between text-[11px] text-amber-800 dark:text-amber-400 font-medium shrink-0 shadow-sm">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                  <span>Yewo Guest Demo Mode</span>
                </span>
                <span className="font-mono bg-amber-50 dark:bg-black/20 text-amber-900 dark:text-amber-300 px-1.5 py-0.5 rounded text-[10px] font-bold">
                  {Math.max(0, 3 - demoQueriesCount)} q's left
                </span>
              </div>
            )}

            {showPaymentForm ? (
              /* Payment Proof Submission Wizard Form */
              <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-950 flex flex-col justify-between custom-scrollbar">
                {paymentSubmissionSuccess ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-4 space-y-4">
                    <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-sm">
                      <Check className="w-7 h-7 stroke-[3px]" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Proof Submitted Successfully!</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      ⚡ **Your 24-Hour Premium Grace Access is now active.** Explore premium resume templates and use Yewo Copilot unstoppably! Our team is verifying your payment reference. Turnaround is typically 2-4 hours. Thank you!
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPaymentForm(false);
                        setPaymentSubmissionSuccess(false);
                        setReceiptNumber('');
                        setAmountStr('');
                        setScreenshotBase64(null);
                      }}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition cursor-pointer"
                    >
                      Return to Chat
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handlePaymentSubmit} className="space-y-3.5">
                    {/* Grace disclaimer block */}
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-400 text-[11px] p-3 rounded-xl flex gap-1.5 leading-relaxed items-start">
                      <span className="text-sm font-bold mt-[-2px]">⚡</span>
                      <div>
                        <strong>Instant 24-Hour Access Enabled:</strong> Submit your details below to activate full premium services immediately. Our manual verification takes 2-4 hours.
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Payment Method</label>
                      <select
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={paymentMethod}
                        onChange={e => setPaymentMethod(e.target.value as any)}
                        required
                      >
                        <option value="mobile_banking">Mobile Banking (BSP Mobile/Kina)</option>
                        <option value="wantok">Wantok Wallet Transfer</option>
                        <option value="sms">SMS Mobile Payment</option>
                        <option value="internet_banking">Internet Banking</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Receipt / Ref #</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. BSP-83921"
                          value={receiptNumber}
                          onChange={e => setReceiptNumber(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Amount Paid (PGK)</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 45"
                          value={amountStr}
                          onChange={e => setAmountStr(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Upgrade Tier</label>
                        <select
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          value={plan}
                          onChange={e => setPlan(e.target.value as any)}
                        >
                          <option value="basic">Basic PGK 15</option>
                          <option value="bundle">Bundle PGK 25</option>
                          <option value="premium">Premium PGK 45</option>
                          <option value="pro">Pro Monthly PGK 35/mo</option>
                          <option value="unlimited">Pro Annual PGK 95/yr</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Type</label>
                        <select
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          value={type}
                          onChange={e => setType(e.target.value as any)}
                        >
                          <option value="payment">Single Purchase</option>
                          <option value="subscription">Recurring Subscription</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Screenshot Proof</label>
                      <div className="border border-dashed border-slate-200 dark:border-slate-850 rounded-xl p-3 text-center bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850/30 transition relative min-h-[75px] flex items-center justify-center">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        {screenshotBase64 ? (
                          <div className="flex items-center gap-3">
                            <img src={screenshotBase64} alt="Proof" className="w-10 h-10 object-cover rounded border border-slate-200" />
                            <div className="text-left">
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">✓ Screenshot ready</span>
                              <button type="button" onClick={(e) => { e.stopPropagation(); setScreenshotBase64(null); }} className="text-[9px] text-rose-500 font-medium hover:underline">Remove file</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-slate-400 text-[10.5px]">
                            <Upload className="w-4 h-4 text-indigo-500" />
                            <span>Click to upload BSP or Wantok receipt image</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowPaymentForm(false);
                          setPaymentSubmissionSuccess(false);
                        }}
                        className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingPayment}
                        className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold flex justify-center items-center gap-1.5 shadow-md"
                      >
                        {isSubmittingPayment ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          "Activate Grace Access"
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              /* Message Area */
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/30 custom-scrollbar">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.role !== 'user' && (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-teal-500 to-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shadow-sm select-none mr-2 mt-1 shrink-0">
                          Y
                        </div>
                      )}
                      <div
                        className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-[12.5px] leading-relaxed shadow-sm ${
                          msg.role === 'user'
                            ? 'bg-indigo-600 text-white rounded-tr-none'
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-150/70 dark:border-slate-700/60 rounded-tl-none'
                        }`}
                      >
                        <div className="markdown-body">
                          <Markdown>{msg.parts[0].text}</Markdown>
                        </div>

                        {msg.id === 'welcome' && !user && (
                          <div className="mt-3 p-3 bg-indigo-50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                            <p className="text-indigo-950 dark:text-indigo-300 font-medium text-[11.5px] mb-2">
                              💡 **Try Guest Demo Mode:** You can ask 3 general trial questions directly below! Create a free profile to unlock personalized CV designs.
                            </p>
                            <div className="flex gap-2.5 items-center">
                              <Link
                                to="/auth"
                                onClick={() => {
                                  setIsOpen(false);
                                }}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                              >
                                <LogIn className="w-3.5 h-3.5" /> Log In / Sign Up
                              </Link>
                              <span className="text-[11px] text-slate-500 font-medium font-mono">
                                ({3 - demoQueriesCount}/3 trial left)
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-teal-500 to-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shadow-sm mr-2 mt-1 shrink-0 animate-pulse">
                        Y
                      </div>
                      <div className="bg-white dark:bg-slate-800 text-slate-500 px-3.5 py-2.5 rounded-2xl rounded-tl-none border border-slate-150/70 dark:border-slate-700/60 shadow-sm flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-500" />
                        <span className="text-xs font-medium">Yewo is thinking...</span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick action banner to Verify PGK payment */}
                {user && (
                  <div className="mx-4 mb-2 p-2 bg-gradient-to-r from-teal-500/10 to-indigo-500/10 border border-teal-500/20 rounded-xl flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <Landmark className="w-3.5 h-3.5 text-teal-500" />
                      <span>Paid via BSP or Wantok?</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPaymentForm(true)}
                      className="px-2 py-1 bg-gradient-to-r from-teal-500 to-indigo-600 font-bold text-[10px] text-white rounded-lg shadow-xs hover:from-teal-600 hover:to-indigo-700 transition"
                    >
                      Get Instant Grace Access
                    </button>
                  </div>
                )}

                {/* Suggestions Block */}
                {messages.length === 1 && (
                  <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Suggested Actions</p>
                    <div className="flex flex-wrap gap-1.5">
                      {suggestionChips.map((chip, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSuggestion(chip.prompt)}
                          className="text-[11px] font-medium px-2.5 py-1 bg-slate-50 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/45 text-slate-600 dark:text-indigo-300 rounded-full border border-slate-150 dark:border-slate-700/80 hover:border-indigo-200 transition-all cursor-pointer text-left"
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input Action Sheet */}
                <form onSubmit={handleFormSubmit} className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2">
                  <input
                    type="text"
                    placeholder={
                      user 
                        ? "Ask Yewo anything..." 
                        : demoQueriesCount < 3 
                          ? `Ask Yewo (Demo: ${3 - demoQueriesCount} free q's)...` 
                          : "Limit reached. Sign up to continue!"
                    }
                    disabled={isLoading || (!user && demoQueriesCount >= 3)}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 placeholder-slate-400 text-slate-800 dark:text-slate-100 disabled:opacity-60 transition"
                  />
                  <button
                    type="submit"
                    disabled={!inputValue.trim() || isLoading || (!user && demoQueriesCount >= 3)}
                    className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl transition cursor-pointer flex items-center justify-center shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
