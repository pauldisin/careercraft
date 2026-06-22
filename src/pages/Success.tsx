import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Loader2, FileText } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { trackEvent } from '../lib/analytics';

export default function Success() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    trackEvent('checkout_success', { 
      session_id: searchParams.get('session_id'),
      plan: searchParams.get('plan'),
      type: searchParams.get('type')
    });
    
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/resume-builder');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 text-center"
      >
        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
        </div>
        
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Payment Successful!</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          Thank you for your purchase. Your account has been updated with your new credits/subscription.
        </p>

        <div className="space-y-4">
          <Link
            to="/resume-builder"
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
          >
            <FileText className="w-5 h-5" /> Back to Resume Builder
          </Link>
          
          <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Redirecting in {countdown} seconds...
          </p>
        </div>
      </motion.div>
    </div>
  );
}
