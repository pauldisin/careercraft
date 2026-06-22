import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Loader2, LogIn, UserPlus, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { trackEvent } from '../lib/analytics';
import { validatePassword } from '../lib/password-policy';
import SEO from '../components/SEO';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signIn, signUp } = useAuth();

  const from = location.state?.from?.pathname || '/account';

  // Redirect if already logged in

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isForgotPassword) {
        const response = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        if (!response.ok) throw new Error('Failed to send reset link');
        toast.success('If an account exists, a reset link has been sent to your email.');
        setIsForgotPassword(false);
      } else if (isLogin) {
        await signIn(email, password);
        toast.success('Successfully logged in!');
        trackEvent('login_success');
        navigate(from, { replace: true });
      } else {
        // Enforce strong password policies on registration
        const checkResult = validatePassword(password, false);
        if (!checkResult.valid) {
          toast.error(checkResult.message || 'Password does not meet complexity requirements.');
          setLoading(false);
          return;
        }

        await signUp(email, password);
        toast.success('Registration successful!');
        trackEvent('signup_success');
        navigate(from, { replace: true });
      }
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <SEO 
        title={isForgotPassword ? 'Reset Password | CareerCraft' : isLogin ? 'Sign In | CareerCraft' : 'Sign Up | CareerCraft'}
        description={isForgotPassword ? 'Request a password reset link for your CareerCraft account.' : isLogin ? 'Log in to your CareerCraft account to build, analyze, and optimize your resume.' : 'Create a CareerCraft account to access our AI-powered resume builder, analyzer, and career prep tools.'}
      />
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800">
        <div>
          <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl flex items-center justify-center mx-auto mb-4">
            {isForgotPassword ? (
              <KeyRound className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            ) : isLogin ? (
              <LogIn className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            ) : (
              <UserPlus className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            )}
          </div>
          <h2 className="text-center text-3xl font-extrabold text-slate-900 dark:text-white">
            {isForgotPassword ? 'Reset password' : isLogin ? 'Welcome back' : 'Create an account'}
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
            {isForgotPassword ? (
              <>
                Remember your password?{' '}
                <button
                  onClick={() => setIsForgotPassword(false)}
                  className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                >
                  Log in
                </button>
              </>
            ) : (
              <>
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setIsForgotPassword(false);
                  }}
                  className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                >
                  {isLogin ? 'Sign up' : 'Log in'}
                </button>
              </>
            )}
          </p>
        </div>

        <div className="mt-8">
          <div className="mt-6 relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-sm font-medium leading-6">
              <span className="bg-white dark:bg-slate-900 px-6 text-slate-500 dark:text-slate-400">
                Or continue with email
              </span>
            </div>
          </div>
        </div>

        <form className="mt-6 space-y-6" onSubmit={handleAuth}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 sm:text-sm transition-colors"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            {!isForgotPassword && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => setIsForgotPassword(true)}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 sm:text-sm transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isForgotPassword ? (
              'Send reset link'
            ) : isLogin ? (
              'Sign in'
            ) : (
              'Sign up'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
