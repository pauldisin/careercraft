import { CheckCircle2, Loader2, CreditCard, Landmark, Building2, Star, ShieldCheck, Award, Zap, Users, Smartphone, UploadCloud, MessageSquare, HelpCircle, Sparkles, Timer, Check, Layers, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import { trackEvent } from '../lib/analytics';
import SEO from '../components/SEO';
import toast from 'react-hot-toast';

export default function Pricing() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [selectedPayPerDownload, setSelectedPayPerDownload] = useState('bundle'); // Default to popular bundle
  const [selectedSubscription, setSelectedSubscription] = useState('unlimited');
  const [targetApps, setTargetApps] = useState<1 | 3 | 5 | 10>(3); // Interactive apps state (1, 3, 5, 10+)
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const [paymentProtocol, setPaymentProtocol] = useState<'stripe'|'local'>('stripe');
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualFormType, setManualFormType] = useState<{plan: string, type: 'payment'|'subscription'}>({plan: '', type: 'payment'});
  const [manualFormData, setManualFormData] = useState({
    method: 'wantok',
    receiptNumber: '',
    amountStr: '',
    screenshotUrl: ''
  });

  const [isScanning, setIsScanning] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const processUploadFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select or drop a valid receipt image.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.error("Screenshot exceeds 3MB limit. Please provide a compressed image.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Url = e.target?.result as string;
      setManualFormData(prev => ({ ...prev, screenshotUrl: base64Url }));
      
      setIsScanning(true);
      const loadingToastId = toast.loading("🤖 AI OCR Analyzing Receipt Screenshot...");
      try {
        const res = await apiFetch("/api/payments/ocr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ screenshotUrl: base64Url })
        });
        
        toast.dismiss(loadingToastId);
        if (res.ok) {
          const scanResult = await res.json();
          if (scanResult && scanResult.receiptNumber) {
            setManualFormData(prev => ({
              ...prev,
              receiptNumber: scanResult.receiptNumber || prev.receiptNumber
            }));
            toast.success(`✨ Success! AI OCR decoded receipt reference: #${scanResult.receiptNumber}`, { duration: 5000 });
          } else {
            toast.success("Screenshot loaded. Please input reference number copy manually if it did not auto-fill.", { duration: 4500 });
          }
        } else {
          toast.success("Screenshot loaded. Please input reference number copy manually if it did not auto-fill.", { duration: 4500 });
        }
      } catch (err: any) {
        toast.dismiss(loadingToastId);
        console.error("OCR Extraction failed gracefully", err);
        toast.error("AI OCR service was busy or offline. Form updated with screenshot—please write reference details below.");
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processUploadFile(e.target.files[0]);
    }
  };

  const handleCheckoutClick = (plan: string, type: 'payment' | 'subscription') => {
    if (!user) {
      navigate('/auth?redirect=/pricing');
      return;
    }
    if (paymentProtocol === 'stripe') {
      handleStripeCheckout(plan, type);
    } else {
      setManualFormType({ plan, type });
      // pre-fill amount
      let price = '';
      if (type === 'subscription') {
        price = plan === 'unlimited' ? '449' : '75';
      } else {
        price = plan === 'basic' ? '19' : (plan === 'bundle' ? '39' : '59');
      }
      setManualFormData(prev => ({ ...prev, amountStr: `K${price}.00` }));
      setShowManualForm(true);
    }
  };

  const handleStripeCheckout = async (plan: string, type: 'payment' | 'subscription') => {
    setIsCheckingOut(true);
    trackEvent('checkout_start', { plan, type, paymentMethod: 'stripe' });
    try {
      const response = await apiFetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan, type }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.message || data.error || 'Failed to create checkout session');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      setMessage({ type: 'error', text: error.message || 'Something went wrong. Please try again.' });
      setIsCheckingOut(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCheckingOut(true);
    try {
      const res = await apiFetch('/api/payments/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: manualFormType.plan,
          type: manualFormType.type,
          ...manualFormData
        })
      });
      if (!res.ok) throw new Error('Failed to submit');
      
      // Refresh user details to instantly activate active grace period
      if (typeof refreshUser === 'function') {
        await refreshUser();
      }

      toast.success('Payment submitted! ⚡ A 24-hour premium grace period has been activated instantly while our admin team manually verifies your receipt.');
      setShowManualForm(false);
      setManualFormData({ method: 'wantok', receiptNumber: '', amountStr: '', screenshotUrl: '' });
    } catch (err: any) {
      toast.error('Failed to submit verification.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="flex-1 bg-[#FDFCFB] dark:bg-slate-950 py-24 px-4 sm:px-6 lg:px-8 transition-colors duration-500">
      <SEO 
        title="Premium CareerCraft Pricing Plans | Unlock Your Career Potential"
        description="Choose the perfect CareerCraft plan to elevate your professional standing. Access our AI-driven resume builder, premium templates, and advanced ATS optimization tools."
        schemaMarkup={{
          "@context": "https://schema.org",
          "@type": "Product",
          "name": "CareerCraft Resume & Career Coaching Platform",
          "description": "Choose the perfect CareerCraft plan to elevate your professional standing. Access our AI-driven resume builder, premium templates, and advanced ATS optimization tools.",
          "offers": {
            "@type": "AggregateOffer",
            "priceCurrency": "PGK",
            "lowPrice": "0",
            "highPrice": "449",
            "offerCount": "4",
            "offers": [
              {
                "@type": "Offer",
                "name": "Free Tier",
                "price": "0",
                "priceCurrency": "PGK",
                "description": "Basic ATS scanning and standard template builder layout."
              },
              {
                "@type": "Offer",
                "name": "Basic Pay-Per-Download",
                "price": "19",
                "priceCurrency": "PGK",
                "description": "Download 1 Premium Resume PDF with lifetime access."
              },
              {
                "@type": "Offer",
                "name": "Bundle PDF Package",
                "price": "39",
                "priceCurrency": "PGK",
                "description": "Download 3 Premium Resume PDFs with unlimited draft saves."
              },
              {
                "@type": "Offer",
                "name": "Pro PDF Package",
                "price": "59",
                "priceCurrency": "PGK",
                "description": "Download 5 Premium Resume PDFs with full support."
              },
              {
                "@type": "Offer",
                "name": "Standard Monthly Subscription",
                "price": "75",
                "priceCurrency": "PGK",
                "description": "All access pass to builder and analyzer tools billed monthly."
              },
              {
                "@type": "Offer",
                "name": "Unlimited Annual Plan",
                "price": "449",
                "priceCurrency": "PGK",
                "description": "Unlimited downloads and full continuous premium features billed annually."
              }
            ]
          }
        }}
      />
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600 dark:text-indigo-400 mb-6 block">Investment in Excellence</span>
            <h1 className="font-serif text-6xl md:text-7xl text-slate-900 dark:text-white leading-tight tracking-tight mb-8">
              Elevate Your <span className="italic">Professional</span> Standing.
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              Join the next generation of professionals securing their dream roles using our AI-driven precision tools.
            </p>
          </motion.div>
          
          {message && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`mt-10 p-6 rounded-[2rem] text-sm font-bold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800'}`}
            >
              {message.text}
            </motion.div>
          )}
        </div>

        {/* INTERACTIVE PLAN MATCHER & CREDIT ALLOCATION WIDGET */}
        <div className="max-w-4xl mx-auto mb-20 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 md:p-12 shadow-sm text-left">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-slate-100 dark:border-slate-800 pb-8">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-55/60 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 text-[10px] font-black uppercase tracking-wider mb-3">
                <Sparkles className="w-3" /> Smart Plan Selector
              </span>
              <h2 className="text-2xl font-serif text-slate-900 dark:text-white leading-tight">
                Not sure which plan matches your goals?
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Tell us your targets, and we will calculate your optimal credit allocation automatically.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 px-4 py-2 rounded-2xl border border-slate-100 dark:border-slate-800">
              <HelpCircle className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>How do <strong>Credits</strong> work? See below.</span>
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-xs font-black uppercase tracking-widest text-slate-440 dark:text-slate-400 mb-4 text-center md:text-left">
              How many job applications or distinct resume drafts are you prepping?
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "1 Target Role", value: 1, desc: "Single focused draft" },
                { label: "2 - 3 Roles", value: 3, desc: "Resume + Cover Letter" },
                { label: "4 - 5 Roles", value: 5, desc: "Diverse target templates" },
                { label: "Unlimited Roles", value: 10, desc: "Continuous tuning & access" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setTargetApps(opt.value as any);
                    // Automatically pre-highlight matching card / plan choice
                    if (opt.value === 1) {
                      setSelectedPayPerDownload('basic');
                    } else if (opt.value === 3) {
                      setSelectedPayPerDownload('bundle');
                    } else if (opt.value === 5) {
                      setSelectedPayPerDownload('premium');
                    } else {
                      setSelectedSubscription('pro');
                    }
                  }}
                  className={`p-4 rounded-2xl text-center border-2 transition-all duration-300 ${
                    targetApps === opt.value
                      ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-sm scale-102"
                      : "border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-slate-50/40 dark:bg-slate-950/10"
                  }`}
                >
                  <div className={`text-xs font-black uppercase tracking-wider ${targetApps === opt.value ? "text-indigo-700 dark:text-indigo-400" : "text-slate-700 dark:text-slate-300"}`}>
                    {opt.label}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic matching logic presentation */}
          <AnimatePresence mode="wait">
            <motion.div
              key={targetApps}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="p-6 rounded-3xl bg-indigo-50/25 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
            >
              <div className="space-y-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 block font-sans">✓ Recruiter-Certified Match Recommendation</span>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-xl font-bold font-serif text-slate-900 dark:text-white">
                    {targetApps === 1 && "Basic Resume Pack"}
                    {targetApps === 3 && "Resume + Cover Letter Bundle (Recommended)"}
                    {targetApps === 5 && "Premium Templates Pack"}
                    {targetApps === 10 && "Pro Subscription (Elite Access)"}
                  </h3>
                  <span className="text-sm text-indigo-600 dark:text-indigo-400 font-black">
                    {targetApps === 1 && "K19.00 Total"}
                    {targetApps === 3 && "K39.00 Total"}
                    {targetApps === 5 && "K59.00 Total"}
                    {targetApps === 10 && "From K75.00/month"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed max-w-xl">
                  {targetApps === 1 && "Grants 1 Premium Document Credit. Best for a single focused draft where you only need one quick download. Perfect value for immediate submission."}
                  {targetApps === 3 && "Unlocks 3 Premium Document Credits. This lets you construct a tailored resume and corresponding cover letter side-by-side, plus a fallback custom version for secondary bids. Saves K20 over buying individual credits!"}
                  {targetApps === 5 && "Consists of 5 Premium Document credits, allowing you to adapt layouts across different executive template designs. Best choice for active candidates pursuing multiple sectors."}
                  {targetApps === 10 && "Complete elite pass. Bypasses the credit model entirely to grant you completely unlimited resume compiles, unlimited custom designs, ongoing cover letters, and VIP fast-track support."}
                </p>
              </div>

              <div className="w-full md:w-auto shrink-0 self-center">
                <button
                  type="button"
                  onClick={() => {
                    const sectionId = targetApps === 10 ? "subscription-tiers" : "pay-as-you-go-tiers";
                    const element = document.getElementById(sectionId);
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  className="w-full md:w-auto px-6 py-4 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-100 dark:shadow-none"
                >
                  Configure This Option <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Core Credit System Breakdown */}
          <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-850/80 grid md:grid-cols-3 gap-6 text-xs leading-relaxed text-slate-550 dark:text-slate-400">
            <div>
              <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-bold mb-1.5">
                <Layers className="w-4 h-4 text-indigo-500" />
                <span>What uses Credits?</span>
              </div>
              <p>Credits are only deducted once you execute a **final, high-fidelity download of your document (PDF or DOCX)**. In-app edits, AI co-pilot chats, custom matching, and ATS checklists are 100% free and unlimited.</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-bold mb-1.5">
                <Timer className="w-4 h-4 text-indigo-500" />
                <span>30-Day Free Workspace Updates</span>
              </div>
              <p>Once you purchase and compile a resume, you can apply updates, adjust font settings, change templates, or correct typos in that document version and **re-download it free** for up to 30 continuous days!</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-bold mb-1.5">
                <Award className="w-4 h-4 text-indigo-500" />
                <span>Unlimited Pro Model</span>
              </div>
              <p>Opting for our Monthly or Annual Pro subscriptions skips individual credit checks entirely. Enjoy infinite PDF and DOCX downloads of both resumes and custom-tailored cover letters for full flexibility.</p>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto mb-20">
          <div className="flex flex-col items-center gap-8">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Payment Method</h3>
            <div className="flex flex-wrap justify-center gap-4">
                <button 
                  onClick={() => setPaymentProtocol('stripe')}
                  className={`px-8 py-4 rounded-full border-2 font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all duration-300 ${paymentProtocol === 'stripe' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 shadow-lg shadow-indigo-200/50 dark:shadow-none scale-105' : 'border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-800 dark:text-slate-400 dark:hover:border-slate-700'}`}
                >
                  <CreditCard className="w-4 h-4" /> Credit Card
                </button>
                <button 
                  onClick={() => setPaymentProtocol('local')}
                  className={`px-8 py-4 rounded-full border-2 font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all duration-300 ${paymentProtocol === 'local' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 shadow-lg shadow-indigo-200/50 dark:shadow-none scale-105' : 'border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-800 dark:text-slate-400 dark:hover:border-slate-700'}`}
                >
                  <Smartphone className="w-4 h-4" /> Local Bank / Wantok
                </button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto items-start">
          {/* Pay Per Download */}
          <motion.div
            id="pay-as-you-go-tiers"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white dark:bg-slate-900 rounded-[3rem] p-12 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col relative overflow-hidden group"
          >
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-900 dark:text-white">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-serif text-3xl text-slate-900 dark:text-white">Pay As You Go</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">For the decisive professional.</p>
                </div>
              </div>
              
              <div className="space-y-4 flex-1">
                {[
                  { 
                    id: 'basic', 
                    title: 'Basic Resume', 
                    desc: 'One-time download', 
                    price: 'K19',
                    credits: '1 Document Credit',
                    highlights: [
                      'Allocates 1 Premium Credit for compilation',
                      'Perfect for single clean Resume exports',
                      'Free real-time ATS compatibility checklists',
                      'Unlimited lifetime drafting & revision'
                    ]
                  },
                  { 
                    id: 'bundle', 
                    title: 'Resume + Cover Letter', 
                    desc: 'The complete package', 
                    price: 'K39', 
                    popular: true, 
                    oldPrice: 'K59',
                    credits: '3 Document Credits',
                    highlights: [
                      'Allocates 3 Premium Credits (K20 savings!)',
                      'Perfect for Resume + matching Cover Letter + 1 backup copy',
                      'AI Cover Letter sync matches job listings',
                      'Free updates for 30 days after download'
                    ]
                  },
                  { 
                    id: 'premium', 
                    title: 'Premium Templates', 
                    desc: 'Stand out from the crowd', 
                    price: 'K59',
                    credits: '5 Document Credits',
                    highlights: [
                      'Allocates 5 Premium Credits for versatile compiles',
                      'Unlocks full luxury Executive Formats',
                      'Test and adapt multiple style copies',
                      'Priority background processing engine'
                    ]
                  }
                ].map(item => (
                  <div 
                    key={item.id}
                    onClick={() => setSelectedPayPerDownload(item.id)}
                    className={`flex flex-col p-6 rounded-[2rem] border-2 transition-all duration-300 cursor-pointer relative ${
                      selectedPayPerDownload === item.id 
                        ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-900/10' 
                        : 'border-slate-50 dark:border-slate-800/50 hover:border-indigo-200 dark:hover:border-indigo-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                        <h3 className={`font-black text-sm uppercase tracking-widest transition-colors ${selectedPayPerDownload === item.id ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-900 dark:text-white'}`}>
                          {item.title}
                        </h3>
                        <div className="text-right">
                          {item.oldPrice && <div className="text-xs text-slate-400 line-through mb-1">{item.oldPrice}</div>}
                          <div className="text-3xl font-black text-slate-900 dark:text-white">{item.price}</div>
                        </div>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.desc}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <span className="px-2 py-0.5 bg-indigo-50 dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 text-[9px] font-black uppercase tracking-widest rounded">
                        {item.credits} Included
                      </span>
                    </div>

                    {selectedPayPerDownload === item.id && (
                      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                        {item.highlights.map((hlt, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                            <span className="text-emerald-500 font-bold shrink-0">✓</span>
                            <span>{hlt}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {item.popular && (
                      <div className="absolute -top-3 left-8 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] shadow-lg">
                        Most Popular (Save K20)
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button 
                onClick={() => handleCheckoutClick(selectedPayPerDownload, 'payment')}
                disabled={isCheckingOut}
                className="w-full mt-12 px-10 py-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-black text-xs uppercase tracking-[0.3em] hover:bg-slate-800 dark:hover:bg-slate-100 transition-all disabled:opacity-70 flex items-center justify-center gap-3 shadow-2xl"
              >
                {isCheckingOut ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : (paymentProtocol === 'local' ? `Verify Payment` : `Complete Purchase`)}
              </button>
              <p className="text-center text-[10px] font-black uppercase tracking-widest text-slate-440 dark:text-slate-400 mt-6">Secure One-Time Transaction</p>
              <p className="text-center text-[10px] text-slate-400 mt-2">Credits are consumed only upon final document generation. ATS analysis is always unlimited and free.</p>
            </div>
            
            {/* Background Accent */}
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-slate-50 dark:bg-slate-800/30 rounded-full blur-3xl opacity-50" />
          </motion.div>

          {/* Subscription */}
          <motion.div
            id="subscription-tiers"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-slate-900 dark:bg-indigo-600 rounded-[3rem] p-12 text-white shadow-2xl flex flex-col relative overflow-hidden lg:-translate-y-8"
          >
            <div className="absolute top-0 right-0 bg-amber-400 text-amber-950 text-[10px] font-black px-8 py-3 rounded-bl-[2rem] uppercase tracking-[0.3em] shadow-xl z-20">
              Elite Access
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center">
                  <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
                </div>
                <div>
                  <h2 className="font-serif text-3xl">Pro Subscription</h2>
                  <p className="text-white/60 text-sm">For the career-focused leader.</p>
                </div>
              </div>
              
              <div className="space-y-4 flex-1">
                {[
                  { id: 'pro', title: 'Monthly Pro', desc: 'Maximum flexibility', price: 'K75', period: '/mo' },
                  { id: 'unlimited', title: 'Annual Pro', desc: 'The strategic choice', price: 'K449', period: '/yr', save: 'Save 50%', oldPrice: 'K898' }
                ].map(item => (
                  <div 
                    key={item.id}
                    onClick={() => setSelectedSubscription(item.id)}
                    className={`flex items-center justify-between p-6 rounded-[2rem] transition-all duration-300 cursor-pointer relative border-2 ${
                      selectedSubscription === item.id 
                        ? 'bg-white/10 border-white' 
                        : 'bg-white/5 border-transparent hover:bg-white/10'
                    }`}
                  >
                    {item.save && (
                      <div className="absolute -top-3 left-8 bg-emerald-500 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] shadow-lg">
                        {item.save}
                      </div>
                    )}
                    <div>
                      <h3 className="font-black text-sm uppercase tracking-widest text-white">{item.title}</h3>
                      <p className="text-xs text-white/50 mt-1">{item.desc}</p>
                    </div>
                    <div className="text-right">
                      {item.oldPrice && <div className="text-xs text-white/30 line-through mb-1">{item.oldPrice}</div>}
                      <div className="text-3xl font-black text-white">{item.price}<span className="text-sm font-medium opacity-50">{item.period}</span></div>
                    </div>
                  </div>
                ))}

                <div className="pt-10 space-y-5">
                  {[
                    '✨ UNLIMITED compilation downloads (Infinite document credits included)',
                    'Unlimited AI resume & cover letter generation matching',
                    'Access to all premium executive templates',
                    'Advanced ATS optimization scoring & checkouts',
                    'Priority 2-hour concierge support queue'
                  ].map((feature, i) => (
                    <div key={i} className="flex items-start gap-4 text-white/80">
                      <div className="w-5 h-5 bg-emerald-500/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      </div>
                      <span className="text-sm font-medium leading-relaxed">
                        {feature.startsWith('✨') ? (
                          <span className="text-emerald-300 font-bold">{feature}</span>
                        ) : (
                          feature
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => handleCheckoutClick(selectedSubscription, 'subscription')}
                disabled={isCheckingOut}
                className="w-full mt-12 px-10 py-6 bg-white text-slate-900 rounded-full font-black text-xs uppercase tracking-[0.3em] hover:bg-indigo-50 transition-all disabled:opacity-70 flex items-center justify-center gap-3 shadow-2xl"
              >
                {isCheckingOut ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : (paymentProtocol === 'local' ? `Verify Payment` : `Activate Pro Access`)}
              </button>
            </div>
            
            {/* Background Accents */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          </motion.div>
        </div>

        <AnimatePresence>
          {showManualForm && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
              onClick={() => setShowManualForm(false)}
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto"
              >
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-500" />
                <h3 className="text-xl font-serif text-slate-900 dark:text-white mb-1">Verify Local Payment</h3>
                
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-400 text-xs px-4 py-3 rounded-2xl mb-5 flex items-start gap-2">
                  <span className="text-lg">⚡</span>
                  <div>
                    <p className="font-bold">Instant 24-Hour Grace Period Active</p>
                    <p className="text-[11px] opacity-90 mt-0.5">Submit your receipt below to gain immediate premium access for 24 hours. Manual verification typically takes 2-4 hours.</p>
                  </div>
                </div>

                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                  Transfer the required amount to our official accounts and submit details below to activate instant access.
                </p>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl mb-6 text-sm text-slate-700 dark:text-slate-300 space-y-1.5">
                  <p><strong>Wantok Wallet:</strong> +675 7912 3456</p>
                  <div className="border-t border-slate-250 dark:border-slate-800/60 my-2 pt-2" />
                  <p className="text-[11px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">Direct Bank Deposit Details</p>
                  <p><strong>Business Name:</strong> CareerCraft</p>
                  <p><strong>Bank Name:</strong> Bank of South Pacific (BSP)</p>
                  <p><strong>Account Number:</strong> 7015449890</p>
                  <p><strong>Branch:</strong> Buka</p>
                  <div className="border-t border-slate-250 dark:border-slate-800/60 my-2 pt-2" />
                  <p className="text-[11px] font-black uppercase tracking-wider text-teal-600 dark:text-teal-400 flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" /> WhatsApp Support & Proof Submission
                  </p>
                  <p className="text-slate-600 dark:text-slate-300">
                    Need instant activation or help? Chat on WhatsApp Business:{' '}
                    <a 
                      href="https://wa.me/67572271021" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-teal-600 dark:text-teal-400 font-bold hover:underline"
                    >
                      +675 72271021
                    </a>
                  </p>
                  <div className="border-t border-slate-250 dark:border-slate-800/60 my-2 pt-2" />
                  <p><strong>Amount to send:</strong> {manualFormData.amountStr}</p>
                </div>

                <form onSubmit={handleManualSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Payment Method</label>
                    <select
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      value={manualFormData.method}
                      onChange={e => setManualFormData({...manualFormData, method: e.target.value})}
                      required
                    >
                      <option value="wantok">Wantok Wallet</option>
                      <option value="sms">SMS Mobile Payment</option>
                      <option value="mobile_banking">Mobile Banking (BSP/Kina)</option>
                      <option value="internet_banking">Internet Banking</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Receipt / Reference Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 94837261"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      value={manualFormData.receiptNumber}
                      onChange={e => setManualFormData({...manualFormData, receiptNumber: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                      Upload Receipt Screenshot
                    </label>
                    <div
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                        dragActive 
                          ? "border-indigo-600 bg-indigo-50/10" 
                          : "border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 bg-slate-50/50 dark:bg-slate-950/20"
                      }`}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        id="receipt-file-uploader"
                      />
                      
                      {manualFormData.screenshotUrl ? (
                        <div className="space-y-3">
                          <img 
                            src={manualFormData.screenshotUrl} 
                            alt="Receipt preview" 
                            className="max-h-32 mx-auto rounded-lg border border-slate-250 dark:border-slate-800 object-contain shadow-md"
                          />
                          <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center gap-1">
                            {isScanning ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Analyzing receipt via AI OCR...
                              </>
                            ) : (
                              "✓ Screen Attached & Extracted successfully"
                            )}
                          </p>
                          <button
                            type="button"
                            onClick={() => setManualFormData(prev => ({ ...prev, screenshotUrl: '' }))}
                            className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-650"
                          >
                            Remove and select another
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2 pointer-events-none">
                          <UploadCloud className="w-8 h-8 mx-auto text-slate-400" />
                          <div className="text-xs text-slate-600 dark:text-slate-400">
                            <span className="font-bold text-indigo-600 dark:text-indigo-400">Click to upload receipt</span> or drag and drop image
                          </div>
                          <p className="text-[10px] text-slate-400">Supports JPG, PNG, GIF up to 3MB</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <details className="text-left group">
                    <summary className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300">
                      Or paste an Image URL manually
                    </summary>
                    <div className="mt-2 pl-2 border-l-2 border-indigo-500">
                      <input
                        type="url"
                        placeholder="Link to Imgur, Google Drive, or screenshot host"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        value={manualFormData.screenshotUrl}
                        onChange={e => setManualFormData({...manualFormData, screenshotUrl: e.target.value})}
                      />
                    </div>
                  </details>
                  <div className="flex gap-4 mt-8 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowManualForm(false)}
                      className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-widest"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCheckingOut}
                      className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest flex justify-center items-center gap-2 disabled:opacity-70"
                    >
                      {isCheckingOut ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Submit Proof'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Trust Badges */}
        <div className="mt-32 pt-20 border-t border-slate-100 dark:border-slate-800 flex flex-col items-center gap-12">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Security & Excellence Guaranteed</p>
          <div className="flex flex-wrap justify-center gap-16 md:gap-24 opacity-30 grayscale">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6" />
              <span className="font-black text-sm uppercase tracking-widest">SSL Secure</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-6 h-6" />
              <span className="font-black text-sm uppercase tracking-widest">Top Rated</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-6 h-6" />
              <span className="font-black text-sm uppercase tracking-widest">Growing Community</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
