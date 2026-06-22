import { motion } from 'motion/react';
import { XCircle, ArrowLeft, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Cancel() {
  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 text-center"
      >
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
        </div>
        
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Payment Cancelled</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          Your payment was not completed. No charges were made to your account.
        </p>

        <div className="space-y-4">
          <Link
            to="/pricing"
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
          >
            <CreditCard className="w-5 h-5" /> Try Again
          </Link>
          
          <Link
            to="/"
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            <ArrowLeft className="w-5 h-5" /> Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
