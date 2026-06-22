import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { validatePassword } from '../lib/password-policy';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !email) {
      toast.error('Invalid reset link.');
      return;
    }
    
    // Check password policy on frontend
    const checkResult = validatePassword(password, false);
    if (!checkResult.valid) {
      toast.error(checkResult.message || 'Password does not meet complexity requirements.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, password }),
      });
      if (!response.ok) throw new Error('Failed to reset password');
      toast.success('Password reset successfully. Please log in.');
      navigate('/auth');
    } catch (error: any) {
      toast.error(error.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <div className="max-w-md w-full p-8 rounded-2xl shadow-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
        <h2 className="text-2xl font-bold mb-6 text-center">Set New Password</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="New Password"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-medium"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
