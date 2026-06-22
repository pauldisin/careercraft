import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CreditCard, Zap, Settings, Shield, Loader2, ExternalLink, User, Save, Share2, Info, Copy, Download, Trash2, Lock, Camera, Upload } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { apiFetch } from '../lib/api';
import { validatePassword } from '../lib/password-policy';
 
export default function Account() {
  const { dbUser, isAdmin, isLoading: authLoading, signOut, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isManagingBilling, setIsManagingBilling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({ name: '', email: '' });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  
  // File upload for user avatar state
  const [isUploading, setIsUploading] = useState(false);
  const [isRemovingPic, setIsRemovingPic] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    
    if (dbUser) {
      setUser(dbUser);
      setProfileData({ name: dbUser.name || '', email: dbUser.email || '' });
      setIsLoading(false);
      fetchTransactions();
    } else {
      setIsLoading(false);
    }
  }, [dbUser, authLoading]);

  const fetchTransactions = async () => {
    try {
      const response = await apiFetch('/api/user/transactions');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `Failed to fetch transactions (${response.status})`);
      }
      const data = await response.json();
      setTransactions(data);
    } catch (error: any) {
      console.error('Failed to fetch transactions:', error);
      toast.error(error.message || 'Failed to load transaction history');
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const getInitials = () => {
    if (!user?.name) {
      return user?.email ? user.email.slice(0, 2).toUpperCase() : 'U';
    }
    const parts = user.name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const processAvatarFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file (PNG, JPG, or GIF).');
      return;
    }
    if (file.size > 1.5 * 1024 * 1024) {
      toast.error('The image is too large. Please select an image under 1.5MB.');
      return;
    }

    setIsUploading(true);
    const loadingToastId = toast.loading('Uploading and optimizing profile photo...');
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Url = e.target?.result as string;
        
        try {
          const response = await apiFetch('/api/user', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ avatar_url: base64Url })
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || errorData.error || 'Failed to sync your photo.');
          }
          
          await refreshUser();
          toast.dismiss(loadingToastId);
          toast.success('Your profile photo has been updated!');
        } catch (err: any) {
          toast.dismiss(loadingToastId);
          toast.error(err.message || 'Failed to save photo.');
        } finally {
          setIsUploading(false);
        }
      };
      
      reader.onerror = () => {
        toast.dismiss(loadingToastId);
        toast.error('Failed to read image file.');
        setIsUploading(false);
      };
      
      reader.readAsDataURL(file);
    } catch (err) {
      toast.dismiss(loadingToastId);
      toast.error('Error uploading file.');
      setIsUploading(false);
    }
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processAvatarFile(e.target.files[0]);
    }
  };

  const handleAvatarDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragOver(true);
    } else if (e.type === 'dragleave') {
      setIsDragOver(false);
    }
  };

  const handleAvatarDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processAvatarFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!window.confirm('Are you sure you want to remove your profile photo?')) return;
    
    setIsRemovingPic(true);
    const loadingToastId = toast.loading('Removing profile photo...');
    try {
      const response = await apiFetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: null })
      });
      
      if (!response.ok) {
        throw new Error('Failed to clear profile photo.');
      }
      
      await refreshUser();
      toast.dismiss(loadingToastId);
      toast.success('Your profile photo has been removed.');
    } catch (err: any) {
      toast.dismiss(loadingToastId);
      toast.error(err.message || 'Failed to remove photo.');
    } finally {
      setIsRemovingPic(false);
    }
  };

  const handleUpdateProfile = async () => {
    setIsSavingProfile(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const response = await apiFetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profileData.name })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Could not update profile.');
      }
      
      setUser((prev: any) => ({ ...prev, name: profileData.name }));
      toast.success('Profile updated successfully.');
      setIsEditingProfile(false);
    } catch (err: any) {
      toast.error(err.message || 'Could not update profile.');
      setError(err.message || 'Could not update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!passwordData.currentPassword) {
      toast.error('Current password is required.');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    const checkResult = validatePassword(passwordData.newPassword, isAdmin);
    if (!checkResult.valid) {
      toast.error(checkResult.message || 'Password does not meet complexity requirements.');
      return;
    }

    setIsSavingPassword(true);
    setError(null);
    try {
      const response = await apiFetch('/api/auth/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          currentPassword: passwordData.currentPassword,
          password: passwordData.newPassword 
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Could not update password.');
      }
      
      toast.success('Password updated successfully.');
      setIsChangingPassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      
    } catch (err: any) {
      toast.error(err.message || 'Could not update password.');
      setError(err.message || 'Could not update password.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleManageBilling = async () => {
    setIsManagingBilling(true);
    setError(null);
    try {
      const response = await apiFetch('/api/billing-portal', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else if (data.message) {
        toast.success(data.message, { duration: 6000 });
        setIsManagingBilling(false);
      } else {
        throw new Error(data.error || 'Failed to open billing portal');
      }
    } catch (err: any) {
      console.error('Billing portal error:', err);
      const msg = err.message || '';
      if (msg.toLowerCase().includes('no active subscription') || msg.toLowerCase().includes('customer portal') || msg.toLowerCase().includes('billing_portal_failed')) {
        setError('Your subscription is handled offline or manually verified. You do not have an active Stripe subscription to manage, but your premium features remain fully enabled.');
      } else {
        setError(msg || 'Could not open billing portal. Please try again.');
      }
      setIsManagingBilling(false);
    }
  };

  const handleCopyReferralCode = () => {
    if (user?.referral_code) {
      navigator.clipboard.writeText(user.referral_code);
      toast.success('Referral code copied to clipboard!');
    }
  };

  const [isExportingData, setIsExportingData] = useState(false);
  const handleExportData = async () => {
    setIsExportingData(true);
    try {
      const response = await apiFetch('/api/user/export');
      if (!response.ok) throw new Error('Failed to export data');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'my_career_craft_data.json';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Your data has been exported successfully.');
    } catch (error) {
      toast.error('Failed to export data.');
    } finally {
      setIsExportingData(false);
    }
  };

  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you absolutely sure you want to delete your account? This action cannot be undone and all your resumes and data will be permanently lost.')) {
      return;
    }
    
    setIsDeletingAccount(true);
    try {
      const response = await apiFetch('/api/user', {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete account');
      
      toast.success('Your account has been deleted.');
      signOut();
      navigate('/');
    } catch (error) {
      toast.error('Failed to delete account.');
      setIsDeletingAccount(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 transition-colors duration-300">
      {/* Top Navigation / Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 dark:bg-white p-2 rounded-lg shadow-lg">
              <User className="w-5 h-5 text-white dark:text-slate-900" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-none">Account Settings</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Manage your professional profile</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Link
              to="/pricing"
              className="px-4 py-2 bg-emerald-600 text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 dark:shadow-none"
            >
              Upgrade
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {isAdmin && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-200 dark:border-indigo-800/80 rounded-3xl text-indigo-950 dark:text-indigo-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-indigo-200 dark:shadow-none">
                <Shield className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-black uppercase tracking-tight text-indigo-900 dark:text-indigo-100">Administrator Privileges</h3>
                <p className="text-xs text-indigo-700/80 dark:text-indigo-300/80 mt-1">You are logged in as an administrator. You can view user stats, manage system settings, and accept or reject manual payment verifications.</p>
              </div>
            </div>
            <Link
              to="/admin"
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-200 dark:shadow-none whitespace-nowrap text-center"
            >
              Go to Admin Dashboard
            </Link>
          </motion.div>
        )}

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-2xl text-red-700 dark:text-red-400 text-sm font-medium flex items-center gap-3"
          >
            <Shield className="w-5 h-5" />
            {error}
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Profile & Security */}
          <div className="lg:col-span-8 space-y-8">
            {/* Profile Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-100 dark:border-slate-800 mb-8">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* Interactive Uploadable Avatar wrapper */}
                  <div 
                    onDragEnter={handleAvatarDrag}
                    onDragOver={handleAvatarDrag}
                    onDragLeave={handleAvatarDrag}
                    onDrop={handleAvatarDrop}
                    className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl overflow-hidden group border-2 transition-all flex items-center justify-center ${
                      isDragOver 
                        ? 'border-indigo-500 bg-indigo-50/10 scale-105 shadow-lg' 
                        : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-400'
                    }`}
                  >
                    {isUploading ? (
                      <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center backdrop-blur-xs z-10 w-full h-full">
                        <Loader2 className="w-6 h-6 animate-spin text-white" />
                      </div>
                    ) : null}

                    {user?.avatar_url ? (
                      <img 
                        src={user.avatar_url} 
                        alt="Profile avatar" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-2xl tracking-tight uppercase">
                        {getInitials()}
                      </div>
                    )}

                    {/* Image overlay actions */}
                    <label className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-all gap-1 text-white select-none">
                      <Camera className="w-5 h-5 text-white/90" />
                      <span className="text-[9px] font-black uppercase tracking-wider text-white/85">Change</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleAvatarFileChange} 
                        className="hidden" 
                      />
                    </label>
                  </div>

                  {/* Descriptions and prompt */}
                  <div className="text-center sm:text-left space-y-2">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">Personal Profile</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Your profile photo and basic credentials</p>
                    <div className="flex flex-wrap gap-2 items-center justify-center sm:justify-start pt-1">
                      <label className="px-3 py-1.5 bg-slate-150 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[9px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 rounded-full cursor-pointer transition-all border border-slate-200/50 dark:border-slate-700/50">
                        Upload Photo
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleAvatarFileChange} 
                          className="hidden" 
                        />
                      </label>
                      {user?.avatar_url && (
                        <button
                          onClick={handleRemoveAvatar}
                          disabled={isRemovingPic}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-[9px] font-black uppercase tracking-widest text-red-650 dark:text-red-400 rounded-full transition-all flex items-center gap-1 border border-transparent"
                        >
                          <Trash2 className="w-3 h-3" />
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {!isEditingProfile && (
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="px-4 py-2 text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-full transition-all border border-transparent hover:border-indigo-500/20"
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="group">
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                  {isEditingProfile ? (
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white transition-all"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-slate-50/50 dark:bg-slate-950/50 border border-transparent rounded-xl text-lg font-bold text-slate-900 dark:text-white">
                      {user?.name || 'Not provided'}
                    </div>
                  )}
                </div>
                
                <div className="group">
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Email Address</label>
                  <div className="px-4 py-3 bg-slate-50/50 dark:bg-slate-950/50 border border-transparent rounded-xl text-lg font-bold text-slate-900 dark:text-white flex items-center justify-between">
                    {user?.email || 'Not provided'}
                    <Shield className="w-4 h-4 text-emerald-500" />
                  </div>
                </div>

                <div className="group">
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Member Since</label>
                  <div className="px-4 py-3 bg-slate-50/50 dark:bg-slate-950/50 border border-transparent rounded-xl font-bold text-slate-700 dark:text-slate-300">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Unknown'}
                  </div>
                </div>

                <div className="group">
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Last Activity</label>
                  <div className="px-4 py-3 bg-slate-50/50 dark:bg-slate-950/50 border border-transparent rounded-xl font-bold text-slate-700 dark:text-slate-300">
                    {user?.last_login ? new Date(user.last_login).toLocaleString() : 'Unknown'}
                  </div>
                </div>
              </div>

              {isEditingProfile && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex justify-end gap-3 mt-8 pt-8 border-t border-slate-100 dark:border-slate-800"
                >
                  <button
                    onClick={() => {
                      setIsEditingProfile(false);
                      setProfileData({ name: user?.name || '', email: user?.email || '' });
                    }}
                    className="px-6 py-2 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateProfile}
                    disabled={isSavingProfile}
                    className="px-8 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl flex items-center gap-2 disabled:opacity-70"
                  >
                    {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                  </button>
                </motion.div>
              )}
            </motion.div>

            {/* Security & Password */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                    <Shield className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Security</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Manage your password and account security</p>
                  </div>
                </div>
                {!isChangingPassword && (
                  <button
                    onClick={() => setIsChangingPassword(true)}
                    className="px-4 py-2 text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-full transition-all"
                  >
                    Change Password
                  </button>
                )}
              </div>

              {isChangingPassword ? (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-6"
                >
                  <div className="group max-w-md">
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Current Password</label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="group">
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">New Password</label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="group">
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Confirm New Password</label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => {
                        setIsChangingPassword(false);
                        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      }}
                      className="px-6 py-2 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdatePassword}
                      disabled={isSavingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                      className="px-8 py-2 bg-indigo-600 text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 dark:shadow-none flex items-center gap-2 disabled:opacity-70"
                    >
                      {isSavingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Update Password
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="px-4 py-3 bg-slate-50/50 dark:bg-slate-950/50 border border-transparent rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  Your account is secured with a password.
                </div>
              )}
            </motion.div>

            {/* Data Privacy & Compliance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                  <Lock className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Data Privacy</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Manage your data in compliance with GDPR and CCPA</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Download Data */}
                <div className="flex flex-col gap-4 p-6 bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-2xl">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Download Your Data</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Get a copy of all your personal data, resumes, and transaction history in JSON format.</p>
                  </div>
                  <button
                    onClick={handleExportData}
                    disabled={isExportingData}
                    className="mt-auto w-full px-4 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {isExportingData ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    Export My Data
                  </button>
                </div>

                {/* Delete Account */}
                <div className="flex flex-col gap-4 p-6 bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl">
                  <div>
                    <h3 className="text-sm font-bold text-red-700 dark:text-red-400 mb-2">Delete Account</h3>
                    <p className="text-xs text-red-600/70 dark:text-red-400/70">Permanently delete your account and all associated data. This action cannot be undone.</p>
                  </div>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isDeletingAccount}
                    className="mt-auto w-full px-4 py-3 bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {isDeletingAccount ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    Delete Account
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Transaction History */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                  <ExternalLink className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Billing History</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Your recent payments and invoices</p>
                </div>
              </div>

              {isLoadingTransactions ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                </div>
              ) : transactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800">
                        <th className="pb-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date</th>
                        <th className="pb-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Plan</th>
                        <th className="pb-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Amount</th>
                        <th className="pb-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-5 text-slate-600 dark:text-slate-400 text-sm font-medium">
                            {new Date(tx.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-5">
                            <span className="text-slate-900 dark:text-white font-bold capitalize">
                              {tx.plan}
                            </span>
                          </td>
                          <td className="py-5 text-slate-900 dark:text-white font-black">
                            K{(tx.amount / 100).toFixed(2)}
                          </td>
                          <td className="py-5">
                            <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-full">
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  <p className="text-sm text-slate-500 dark:text-slate-400">No transaction records found.</p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Column: Subscription & Credits */}
          <div className="lg:col-span-4 space-y-8">
            {/* Subscription Status */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden"
            >
              {/* Decorative Background */}
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl" />
              
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <Shield className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Subscription</h2>
              </div>

              <div className="mb-10">
                <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Current Tier</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900 dark:text-white capitalize">
                    {user?.subscription_plan === 'none' ? 'Free' : user?.subscription_plan}
                  </span>
                  {user?.subscription_status === 'active' && (
                    <span className="text-emerald-500 font-black text-[10px] uppercase tracking-widest">Active</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  {user?.subscription_plan === 'none' 
                    ? 'Upgrade to unlock premium templates and unlimited downloads.' 
                    : 'You have full access to all premium features and templates.'}
                </p>
              </div>

              {user?.subscription_status === 'active' ? (
                <button
                  onClick={handleManageBilling}
                  disabled={isManagingBilling}
                  className="w-full px-6 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-70"
                >
                  {isManagingBilling ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</>
                  ) : (
                    <><Settings className="w-4 h-4" /> Manage Billing</>
                  )}
                </button>
              ) : (
                <Link
                  to="/pricing"
                  className="w-full px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-3"
                >
                  <Zap className="w-4 h-4" /> Upgrade Now
                </Link>
              )}
            </motion.div>

            {/* Credits */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <CreditCard className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Credits</h2>
                <span title="Credits are used for premium document exports and AI-powered optimizations." className="cursor-help flex"><Info className="w-4 h-4 text-slate-400" /></span>
              </div>

              <div className="mb-10">
                <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Available Balance</div>
                <div className="text-5xl font-black text-slate-900 dark:text-white">
                  {user?.credits || 0}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
                  Credits are used for premium document exports and AI-powered optimizations.
                </p>
              </div>

              <Link
                to="/pricing"
                className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-3"
              >
                Top Up Balance
              </Link>
            </motion.div>

            {/* Referral Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-xl">
                  <Share2 className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Referral</h2>
              </div>
              
              <div className="mb-2">
                 <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Your Referral Code</div>
                 <div className="font-bold text-slate-900 dark:text-white mb-4 bg-slate-100 dark:bg-slate-800 p-2 rounded text-lg text-center flex items-center justify-between">
                    <span className="flex-1 text-center">{user?.referral_code || 'N/A'}</span>
                    {user?.referral_code && (
                      <button onClick={handleCopyReferralCode} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition" title="Copy code">
                         <Copy className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      </button>
                    )}
                 </div>
              </div>
              
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Share this code with your friends to get 1 free credit per signup!
              </div>
            </motion.div>

            {/* Account Security Tip */}
            <div className="p-6 bg-amber-50 dark:bg-amber-900/10 rounded-3xl border border-amber-100 dark:border-amber-900/20">
              <div className="flex items-center gap-3 mb-3">
                <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h3 className="text-xs font-black text-amber-900 dark:text-amber-400 uppercase tracking-widest">Security Tip</h3>
              </div>
              <p className="text-[11px] text-amber-800/70 dark:text-amber-400/70 leading-relaxed">
                Keep your account secure by using a strong, unique password and never sharing your login credentials.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
