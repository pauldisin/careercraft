import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, CreditCard, Activity, ShieldAlert, Loader2, Settings, Save, Key, Globe, BrainCircuit, CheckCircle, XCircle, FileText, TrendingUp, Tv, Smartphone, Tablet, ChevronRight, Sparkles, Download, Search, DollarSign, ArrowUpDown, ArrowUp, ArrowDown, Sun, Moon, RefreshCw, Bell, BellRing, ClipboardList, Cpu, Database, AlertCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart as RechartsBarChart, Bar, Legend, Cell, PieChart as RechartsPieChart, Pie, LineChart, Line, ComposedChart } from 'recharts';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { apiFetch } from '../lib/api';

export default function AdminDashboard() {
  const { isAdmin, user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'transactions' | 'verifications' | 'settings' | 'audit' | 'system'>('overview');
  const [stats, setStats] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(true);
  const [healthReport, setHealthReport] = useState<any>(null);
  const [isHealthLoading, setIsHealthLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [userPagination, setUserPagination] = useState<any>({ total: 0, page: 1, limit: 10, pages: 1 });
  const [usersPage, setUsersPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'last-month' | 'ytd' | 'all' | 'custom'>('30d');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    // default to 30 days ago
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    // default to today
    return new Date().toISOString().split('T')[0];
  });
  const [dashboardTheme, setDashboardTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('admin_dashboard_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });

  // Scalability Stress Testing States
  const [scalabilityHistory, setScalabilityHistory] = useState<any[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [testTarget, setTestTarget] = useState<'ai' | 'pdf' | 'database' | 'mixed'>('mixed');
  const [testConcurrency, setTestConcurrency] = useState<number>(10);
  const [testDuration, setTestDuration] = useState<number>(5);
  const [testMockExternal, setTestMockExternal] = useState<boolean>(true);
  const [activeTestResult, setActiveTestResult] = useState<any | null>(null);

  // Audit Logs Tab States
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditPagination, setAuditPagination] = useState<any>({ total: 0, page: 1, limit: 20, pages: 1 });
  const [auditPage, setAuditPage] = useState(1);
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [isAuditLoading, setIsAuditLoading] = useState(false);

  interface AdminNotification {
    id: string;
    type: 'signup' | 'purchase' | 'system';
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
  }

  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;

    // Connect to WebSocket using current protocol
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    let socket: WebSocket | null = null;
    let reconnectTimeout: any = null;

    function connect() {
      console.log('Connecting to Admin real-time notifications:', wsUrl);
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log('Admin real-time WebSocket connected');
        setSocketConnected(true);
      };

      socket.onmessage = (event) => {
        try {
          const notificationData = JSON.parse(event.data);
          const newNotification: AdminNotification = {
            id: notificationData.id,
            type: notificationData.type,
            title: notificationData.title,
            message: notificationData.message,
            timestamp: notificationData.timestamp || new Date().toISOString(),
            read: false
          };

          setNotifications(prev => [newNotification, ...prev]);

          toast.custom((t) => (
            <div
              className={`${
                t.visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
              } max-w-md w-full bg-white dark:bg-slate-900 shadow-xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 border border-slate-200 dark:border-slate-800 p-4 transition-all duration-350`}
            >
              <div className="flex-1 w-0">
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-0.5">
                    {newNotification.type === 'signup' ? (
                      <div className="p-2 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-full">
                        <Users className="w-5 h-5 animate-bounce" />
                      </div>
                    ) : (
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full">
                        <CreditCard className="w-5 h-5 animate-bounce" />
                      </div>
                    )}
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-xs font-black text-rose-500 uppercase tracking-widest">Real-Time Alert ⚡</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      {newNotification.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {newNotification.message}
                    </p>
                  </div>
                </div>
              </div>
              <div className="ml-4 flex-shrink-0 flex">
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="bg-transparent rounded-lg p-1 inline-flex text-slate-400 hover:text-slate-500 focus:outline-none"
                >
                  <span className="sr-only">Close</span>
                  <XCircle className="w-5 h-5 text-slate-400 hover:text-slate-600" />
                </button>
              </div>
            </div>
          ), { duration: 8000 });

          // Double bell synthesiser beep!
          try {
            const context = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = context.createOscillator();
            const gain = context.createGain();
            osc.connect(gain);
            gain.connect(context.destination);
            
            osc.type = "sine";
            osc.frequency.setValueAtTime(587.33, context.currentTime); // D5
            gain.gain.setValueAtTime(0.08, context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.45);
            osc.start(context.currentTime);
            osc.stop(context.currentTime + 0.5);

            const osc2 = context.createOscillator();
            const gain2 = context.createGain();
            osc2.connect(gain2);
            gain2.connect(context.destination);
            osc2.type = "sine";
            osc2.frequency.setValueAtTime(880, context.currentTime + 0.15); // A5
            gain2.gain.setValueAtTime(0.08, context.currentTime + 0.15);
            gain2.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.6);
            osc2.start(context.currentTime + 0.15);
            osc2.stop(context.currentTime + 0.65);
          } catch (audioErr) {
            // ignore
          }

        } catch (err) {
          console.error('Failed to parse WebSocket message metadata', err);
        }
      };

      socket.onclose = (event) => {
        console.log('Admin real-time WebSocket connection closed. Reconnecting...', event.reason);
        setSocketConnected(false);
        reconnectTimeout = setTimeout(connect, 4000);
      };

      socket.onerror = (err) => {
        console.error('WebSocket connection error:', err);
        socket?.close();
      };
    }

    connect();

    return () => {
      if (socket) {
        socket.onclose = null;
        socket.close();
      }
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [isAdmin]);

  useEffect(() => {
    if (dashboardTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('admin_dashboard_theme', dashboardTheme);

    return () => {
      const globalTheme = localStorage.getItem('theme');
      if (globalTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
  }, [dashboardTheme]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setUsersPage(1);
  };

  const renderSortIcon = (field: string) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity ml-1.5 shrink-0" />;
    }
    return sortOrder === 'asc'
      ? <ArrowUp className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 ml-1.5 shrink-0" />
      : <ArrowDown className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 ml-1.5 shrink-0" />;
  };

  const [transactions, setTransactions] = useState<any[]>([]);
  const [verifications, setVerifications] = useState<any[]>([]);
   const [settings, setSettings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeDropdownUserId, setActiveDropdownUserId] = useState<string | null>(null);
  const [resetPasswordForUser, setResetPasswordForUser] = useState<any | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Pre-calculate user growth and revenue trend datasets from response timeline
  const growthTimeline = (() => {
    if (!analyticsData || !analyticsData.timeline) return [];
    
    const totalUsersNow = analyticsData.totalUsers || 0;
    const totalRegistrantsInTimeline = analyticsData.timeline.reduce((sum: number, day: any) => sum + (day.registrants || 0), 0);
    
    // Start cumulative count at thirty days ago
    let userSum = Math.max(0, totalUsersNow - totalRegistrantsInTimeline);
    let revenueSum = 0;
    
    return analyticsData.timeline.map((day: any) => {
      userSum += (day.registrants || 0);
      revenueSum += (day.revenue || 0);
      return {
        ...day,
        cumulativeUsers: userSum,
        cumulativeRevenue: revenueSum
      };
    });
  })();

  const downloadCSVFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCSV = async (type: 'timeline' | 'users') => {
    try {
      if (type === 'timeline') {
        if (!analyticsData || !analyticsData.timeline) {
          toast.error('No analytics timeline data loaded to export.');
          return;
        }
        
        // Headers
        const headers = ['Date', 'New Registrants', 'Resumes Created', 'Purchases', 'Revenue (PGK)', 'Page Views', 'Sessions'];
        const rows = analyticsData.timeline.map((day: any) => [
          day.date,
          day.registrants,
          day.resumesCreated,
          day.purchases,
          Number(day.revenue).toFixed(2),
          day.pageViews,
          day.sessions
        ]);
        
        const csvContent = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
        downloadCSVFile(csvContent, `platform_revenue_and_traffic_metrics_${new Date().toISOString().split('T')[0]}.csv`);
        toast.success('Revenue and Traffic timeline exported successfully! 📊');
      } else {
        toast.loading('Compiling user metrics report...', { id: 'csv-export' });
        const res = await apiFetch('/api/admin/users?page=1&limit=100');
        if (!res.ok) {
          throw new Error('Could not fetch user registry.');
        }
        const data = await res.json();
        const exportUsers = data.users || [];
        
        if (exportUsers.length === 0) {
          toast.error('No user accounts found in the database.', { id: 'csv-export' });
          return;
        }

        const headers = ['User ID', 'Custom Name', 'Registered Email', 'Account Role', 'Subscription Status', 'Plan Level', 'Token Balance', 'Registered Date', 'Referral Code'];
        const rows = exportUsers.map((u: any) => [
          u.id,
          `"${(u.name || 'Anonymous User').replace(/"/g, '""')}"`,
          u.email || 'N/A',
          u.is_admin ? 'Admin' : 'End User',
          u.subscription_status || 'free',
          u.subscription_plan || 'none',
          u.credits ?? 10,
          u.created_at ? new Date(u.created_at).toISOString().split('T')[0] : 'N/A',
          u.referral_code || ''
        ]);

        const csvContent = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
        downloadCSVFile(csvContent, `user_metrics_report_${new Date().toISOString().split('T')[0]}.csv`);
        toast.success(`Exported ${exportUsers.length} active user records! 👥`, { id: 'csv-export' });
      }
    } catch (e: any) {
      toast.error(`Export failed: ${e.message}`, { id: 'csv-export' });
    }
  };

  const fetchUsersList = async (page: number, search: string = searchQuery, currentSortBy: string = sortBy, currentSortOrder: string = sortOrder) => {
    try {
      setIsUsersLoading(true);
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
      const sortParam = `&sortBy=${currentSortBy}&sortOrder=${currentSortOrder}`;
      const usersRes = await apiFetch(`/api/admin/users?page=${page}&limit=10${searchParam}${sortParam}`);
      if (usersRes.ok) {
        const queryData = await usersRes.json();
        setUsers(queryData.users);
        setUserPagination(queryData.pagination);
      }
    } catch (err: any) {
      toast.error('Failed to fetch user directory page');
    } finally {
      setIsUsersLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      const timer = setTimeout(() => {
        fetchUsersList(usersPage, searchQuery, sortBy, sortOrder);
      }, 350); // elegant search input debounce
      return () => clearTimeout(timer);
    }
  }, [isAdmin, usersPage, searchQuery, sortBy, sortOrder]);

  const fetchAuditLogs = async (page: number, search: string = auditSearchQuery) => {
    try {
      setIsAuditLoading(true);
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
      const auditRes = await apiFetch(`/api/admin/audit-logs?page=${page}&limit=20${searchParam}`);
      if (auditRes.ok) {
        const queryData = await auditRes.json();
        setAuditLogs(queryData.logs || []);
        setAuditPagination(queryData.pagination || { total: 0, page: 1, limit: 20, pages: 1 });
      }
    } catch (err: any) {
      toast.error('Failed to fetch audit log trail');
    } finally {
      setIsAuditLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin && activeTab === 'audit') {
      const timer = setTimeout(() => {
        fetchAuditLogs(auditPage, auditSearchQuery);
      }, 350); // elegant search input debounce
      return () => clearTimeout(timer);
    }
  }, [isAdmin, activeTab, auditPage, auditSearchQuery]);

  const fetchAnalytics = async (
    range: '7d' | '30d' | 'last-month' | 'ytd' | 'all' | 'custom',
    startDate?: string,
    endDate?: string
  ) => {
    try {
      setIsAnalyticsLoading(true);
      let queryStr = '';
      if (range === 'custom') {
        const start = startDate || customStartDate;
        const end = endDate || customEndDate;
        queryStr = `range=custom&startDate=${encodeURIComponent(start)}&endDate=${encodeURIComponent(end)}`;
      } else {
        const apiRange = range === '7d' ? '7' : range === '30d' ? '30' : range === 'last-month' ? 'last-month' : range === 'ytd' ? 'ytd' : 'all';
        queryStr = `range=${apiRange}`;
      }
      const analyticsRes = await apiFetch(`/api/admin/analytics?${queryStr}`);
      if (analyticsRes.ok) {
        const analyticsVal = await analyticsRes.json();
        setAnalyticsData(analyticsVal);
      }
    } catch (err: any) {
      toast.error('Failed to load updated analytics data');
    } finally {
      setIsAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      if (dateRange === 'custom') {
        if (customStartDate && customEndDate) {
          fetchAnalytics(dateRange, customStartDate, customEndDate);
        }
      } else {
        fetchAnalytics(dateRange);
      }
    }
  }, [isAdmin, dateRange, customStartDate, customEndDate]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAdminData = async (silent: boolean = false) => {
    try {
      if (!isAdmin) {
        throw new Error('Failed to fetch admin data. You do not have permission.');
      }
      if (!silent) setIsLoading(true);

      // Fetch Stats
      const statsRes = await apiFetch('/api/admin/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Fetch Transactions
      const transRes = await apiFetch('/api/admin/transactions');
      if (transRes.ok) {
        const transData = await transRes.json();
        setTransactions(transData);
      }

      // Fetch Verifications
      const verifRes = await apiFetch('/api/admin/payment-verifications');
      if (verifRes.ok) {
        const verifData = await verifRes.json();
        setVerifications(verifData);
      }

      // Fetch Settings
      const settingsRes = await apiFetch('/api/admin/settings');
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData);
      }

      // Fetch System Health Report
      await fetchHealthReport(silent);
    } catch (err: any) {
      setError(err.message);
    } finally {
      if (!silent) {
        setIsLoading(false);
        setIsAnalyticsLoading(false);
      }
    }
  };

  const fetchHealthReport = async (silent: boolean = false) => {
    try {
      if (!silent) setIsHealthLoading(true);
      const res = await apiFetch('/api/admin/health-report');
      if (res.ok) {
        const data = await res.json();
        setHealthReport(data);
      }
    } catch (err: any) {
      console.error('Failed to fetch health report:', err);
    } finally {
      if (!silent) setIsHealthLoading(false);
    }
  };

  const handleTriggerTestAlert = async (type: string, severity: 'critical' | 'warning', summary: string) => {
    try {
      const res = await apiFetch('/api/admin/trigger-test-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, severity, summary })
      });
      if (res.ok) {
        toast.success(`Successfully dispatched live test ${severity} error alert! 🔔`);
        fetchHealthReport();
      } else {
        toast.error('Failed to trigger test alert.');
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    }
  };

  const fetchScalabilityHistory = async () => {
    try {
      setIsHistoryLoading(true);
      const res = await apiFetch('/api/admin/scalability/history');
      if (res.ok) {
        const data = await res.json();
        setScalabilityHistory(data);
      }
    } catch (err) {
      console.error('Failed to fetch scalability history:', err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleRunScalabilityTest = async () => {
    if (isTesting) return;
    setIsTesting(true);
    setActiveTestResult(null);

    const testPromise = (async () => {
      const res = await apiFetch('/api/admin/scalability/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: testTarget,
          concurrency: Number(testConcurrency),
          durationSeconds: Number(testDuration),
          mockExternal: testMockExternal
        })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Stress test simulation failed');
      }
      const result = await res.json();
      setActiveTestResult(result);
      fetchScalabilityHistory();
      fetchHealthReport(true);
      return result;
    })();

    await toast.promise(testPromise, {
      loading: `Executing live scalability scenario [Target: ${testTarget.toUpperCase()} @ ${testConcurrency} mock clients]...`,
      success: 'Scalability stress-test simulation finished! 📊',
      error: (err) => `Simulated stress run aborted: ${err.message}`
    });

    setIsTesting(false);
  };

  const handleClearScalabilityHistory = async () => {
    try {
      const res = await apiFetch('/api/admin/scalability/clear', { method: 'POST' });
      if (res.ok) {
        setScalabilityHistory([]);
        setActiveTestResult(null);
        toast.success("Successfully purged past scalability history.");
      }
    } catch (err: any) {
      toast.error(`Clear failed: ${err.message}`);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin && activeTab === 'system') {
      fetchHealthReport();
      fetchScalabilityHistory();
    }
  }, [isAdmin, activeTab]);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    
    const refreshPromise = Promise.all([
      fetchAdminData(true),
      fetchAnalytics(dateRange, customStartDate, customEndDate),
      fetchUsersList(usersPage, searchQuery, sortBy, sortOrder),
      fetchHealthReport(true),
      fetchScalabilityHistory(),
      activeTab === 'audit' ? fetchAuditLogs(auditPage, auditSearchQuery) : Promise.resolve()
    ]);

    await toast.promise(refreshPromise, {
      loading: 'Refreshing system intelligence metrics and report timelines...',
      success: 'All dashboard charts, tables, and KPIs successfully updated! 🔄',
      error: 'Encountered issues updating from system endpoints'
    });
    
    setIsRefreshing(false);
  };

  const handleApprove = async (id: string) => {
    const notes = prompt('Any notes for approval? (Optional)', '');
    try {
      const res = await apiFetch(`/api/admin/payment-verifications/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notes || '' })
      });
      if (!res.ok) throw new Error('Approval failed');
      toast.success('Payment approved and access granted!');
      setVerifications(prev => prev.map(v => v.id === id ? { ...v, status: 'approved' } : v));
    } catch (err: any) {
      toast.error('Failed to approve');
    }
  };

  const handleReject = async (id: string) => {
    const notes = prompt('Reason for rejection?', 'Invalid receipt');
    if (!notes) return;
    try {
      const res = await apiFetch(`/api/admin/payment-verifications/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      });
      if (!res.ok) throw new Error('Rejection failed');
      toast.success('Payment rejected.');
      setVerifications(prev => prev.map(v => v.id === id ? { ...v, status: 'rejected' } : v));
    } catch (err: any) {
      toast.error('Failed to reject');
    }
  };

  const handleUpdateCredits = async (userId: string, currentCredits: number) => {
    const newCredits = prompt('Enter new credit amount:', currentCredits.toString());
    if (newCredits === null) return;
    
    const credits = parseInt(newCredits);
    if (isNaN(credits)) {
      toast.error('Invalid credit amount');
      return;
    }

    try {
      const response = await apiFetch(`/api/admin/users/${userId}/credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credits }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `Failed to update credits (${response.status})`);
      }
      
      setUsers(users.map(u => u.id === userId ? { ...u, credits } : u));
      toast.success('Credits updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update credits');
    }
  };

  const handleToggleRole = async (userId: string, currentIsAdmin: number) => {
    if (userId === currentUser?.id) {
      toast.error('You cannot change your own administrative privilege.');
      return;
    }

    const nextIsAdmin = currentIsAdmin === 1 ? 0 : 1;
    const confirmMsg = `Are you sure you want to ${nextIsAdmin === 1 ? 'promote' : 'demote'} this user ${nextIsAdmin === 1 ? 'to Admin' : 'to standard End User'}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const response = await apiFetch(`/api/admin/users/${userId}/role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAdmin: nextIsAdmin }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `Failed to update user role (${response.status})`);
      }

      setUsers(users.map(u => u.id === userId ? { ...u, is_admin: nextIsAdmin } : u));
      toast.success(nextIsAdmin === 1 ? 'User promoted to Admin! 🛡️' : 'User demoted to Standard User! 👥');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user role');
    }
  };

  const handleToggleSuspend = async (userId: string, currentIsSuspended: number) => {
    if (userId === currentUser?.id) {
      toast.error('You cannot suspend your own administrative account.');
      return;
    }

    const nextIsSuspended = currentIsSuspended === 1 ? 0 : 1;
    const confirmMsg = nextIsSuspended === 1
      ? 'Are you sure you want to SUSPEND this user? They will be blocked from accessing their account or making API calls.'
      : 'Are you sure you want to ACTIVATE/RE-ENABLE this user?';
    if (!window.confirm(confirmMsg)) return;

    try {
      const response = await apiFetch(`/api/admin/users/${userId}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isSuspended: nextIsSuspended }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `Failed to update suspension status (${response.status})`);
      }

      setUsers(users.map(u => u.id === userId ? { ...u, is_suspended: nextIsSuspended } : u));
      toast.success(nextIsSuspended === 1 ? 'User account has been suspended! 🚫' : 'User account has been active! ✅');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user suspension status');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordForUser) return;
    if (newPasswordValue.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    try {
      setIsResettingPassword(true);
      const response = await apiFetch(`/api/admin/users/${resetPasswordForUser.id}/password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPasswordValue }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `Failed to reset password (${response.status})`);
      }

      toast.success(`Password updated for ${resetPasswordForUser.name || 'user'}! 🔑`);
      setResetPasswordForUser(null);
      setNewPasswordValue('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user password');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleSaveSetting = async (key: string, value: string) => {
    try {
      const response = await apiFetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Failed to save setting');
      }

      setSettings(prev => {
        const existing = prev.find(s => s.key === key);
        if (existing) {
          return prev.map(s => s.key === key ? { ...s, value, updated_at: new Date() } : s);
        }
        return [...prev, { key, value, updated_at: new Date() }];
      });
      toast.success('Setting saved');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteSetting = async (key: string) => {
    if (!confirm(`Delete setting ${key}?`)) return;

    try {
      const response = await apiFetch(`/api/admin/settings/${key}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Failed to delete setting');
      }

      setSettings(prev => prev.filter(s => s.key !== key));
      toast.success('Setting deleted');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Access Denied</h2>
        <p className="text-slate-600 dark:text-slate-400 text-center max-w-md">
          {error}
        </p>
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
              <ShieldAlert className="w-5 h-5 text-white dark:text-slate-900" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-none">Admin Command</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">System intelligence & control</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-full border border-slate-200 dark:border-slate-700 flex-wrap gap-1 md:gap-0">
              {[
                { id: 'overview', icon: Activity, label: 'Overview' },
                { id: 'analytics', icon: Globe, label: 'Analytics' },
                { id: 'transactions', icon: CreditCard, label: 'Billing' },
                { id: 'verifications', icon: FileText, label: 'Verifications' },
                { id: 'settings', icon: Settings, label: 'Config' },
                { id: 'system', icon: Cpu, label: 'Monitoring' },
                { id: 'audit', icon: ClipboardList, label: 'Audit Logs' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeTab === tab.id
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <tab.icon className="w-3 h-3" />
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full transition-all flex items-center justify-center cursor-pointer border border-slate-200 dark:border-slate-700 hover:scale-105 active:scale-95 ${
                isRefreshing ? 'opacity-70 cursor-not-allowed' : ''
              }`}
              title="Refresh Dashboard Data"
              aria-label="Refresh Dashboard Data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-550' : 'text-slate-500 dark:text-slate-400'}`} />
            </button>

            {/* Real-time Notifications Bell Drop */}
            <div className="relative">
              <button
                onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full transition-all flex items-center justify-center cursor-pointer border border-slate-200 dark:border-slate-700 hover:scale-105 active:scale-95 relative"
                title="System Notifications"
                aria-label="System Notifications"
              >
                {notifications.some(n => !n.read) ? (
                  <BellRing className="w-4 h-4 text-rose-500 animate-pulse" />
                ) : (
                  <Bell className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                )}
                
                {/* Active socket connection visual indicator badge */}
                <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-white dark:border-slate-900 ${
                  socketConnected ? 'bg-emerald-500' : 'bg-rose-500'
                }`} title={socketConnected ? 'Real-Time stream connected' : 'Real-Time stream disconnected'} />

                {/* Unread badge */}
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute -bottom-1 -right-1 bg-rose-500 text-white font-bold text-[8px] px-1.5 py-0.5 rounded-full leading-tight">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown Drawer */}
              {showNotificationsDropdown && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-2 z-50 text-slate-850 dark:text-slate-100 overflow-hidden"
                >
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-indigo-500" /> Live Auditing
                      </h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {socketConnected ? 'Real-time stream active' : 'Stream disconnected'}
                      </p>
                    </div>
                    {notifications.length > 0 && (
                      <button 
                        onClick={() => {
                          setNotifications(p => p.map(n => ({...n, read: true})));
                          toast.success("All live events marked as read");
                        }}
                        className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                      >
                        Read All
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 dark:text-slate-500 flex flex-col items-center justify-center p-4">
                        <Bell className="w-8 h-8 opacity-30 mb-2" />
                        <p className="text-xs font-semibold">No real-time events yet</p>
                        <p className="text-[10px] text-slate-400 mt-1 max-w-[200px]">Signups or purchases will appear here instantly!</p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div 
                          key={notif.id} 
                          onClick={() => {
                            setNotifications(p => p.map(n => n.id === notif.id ? {...n, read: true} : n));
                          }}
                          className={`p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors flex gap-2.5 items-start ${
                            !notif.read ? 'bg-indigo-50/20 dark:bg-indigo-950/20' : ''
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {notif.type === 'signup' ? (
                              <div className="p-1.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                <Users className="w-3.5 h-3.5" />
                              </div>
                            ) : (
                              <div className="p-1.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                <CreditCard className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {notif.title}
                              </p>
                              {!notif.read && (
                                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full shrink-0 animate-ping" />
                              )}
                            </div>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                              {notif.message}
                            </p>
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 block">
                              {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {notifications.length > 0 && (
                    <div className="px-3 pt-2 pb-1 border-t border-slate-100 dark:border-slate-800 text-center">
                      <button 
                        onClick={() => {
                          setNotifications([]);
                          setShowNotificationsDropdown(false);
                          toast.success("Notification audit clear");
                        }}
                        className="text-[10px] text-red-500 hover:text-red-700 font-bold hover:underline"
                      >
                        Clear Audit Trail
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            <button
              onClick={() => setDashboardTheme(prev => prev === 'dark' ? 'light' : 'dark')}
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full transition-all flex items-center justify-center cursor-pointer border border-slate-200 dark:border-slate-700 hover:scale-105 active:scale-95"
              title="Toggle theme specifically for the dashboard layout"
              aria-label="Toggle Dashboard Theme"
            >
              {dashboardTheme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Dynamic Admin Actions Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 rounded-3xl shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-650 rounded-l-3xl" />
          <div className="pl-2">
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              Intelligence & Export Hub
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Securely backup system active user lists, subscription states, and dynamic revenue metrics into compliant formats.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleExportCSV('users')}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer border border-emerald-500/20 shrink-0"
              title="Download CSV spreadsheet of current active users"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export User Metrics</span>
            </button>
            <button
              onClick={() => handleExportCSV('timeline')}
              className="px-4 py-2.5 bg-indigo-650 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer border border-indigo-505/20 shrink-0"
              title="Download CSV timeline tracking daily traffic, pageviews & revenue"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Revenue Timeline</span>
            </button>
          </div>
        </div>

        {/* Global Date Range Selector */}
        <div className="flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm mb-8 gap-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5 select-none">
                <Activity className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                Reporting Period Filter
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Toggle the timeline period scope of visual charts, KPIs, and audit telemetry across the platform.</p>
            </div>
            <div className="flex flex-wrap bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 gap-1 shrink-0">
              {[
                { id: '7d', label: 'Last 7 Days' },
                { id: '30d', label: 'Last 30 Days' },
                { id: 'last-month', label: 'Last Month' },
                { id: 'ytd', label: 'Year-To-Date' },
                { id: 'all', label: 'All Time' },
                { id: 'custom', label: 'Custom Range' }
              ].map((range) => (
                <button
                  key={range.id}
                  onClick={() => setDateRange(range.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none ${
                    dateRange === range.id
                      ? 'bg-white dark:bg-slate-750 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Show date inputs if custom range is active */}
          {dateRange === 'custom' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col sm:flex-row sm:items-center gap-4 bg-slate-50/50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-150 dark:border-slate-800"
            >
              <div className="flex flex-col gap-1 w-full sm:w-auto">
                <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Start Date</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  max={customEndDate || undefined}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-650 transition-all outline-none text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex flex-col gap-1 w-full sm:w-auto">
                <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">End Date</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  min={customStartDate || undefined}
                  max={new Date().toISOString().split('T')[0]}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-650 transition-all outline-none text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex items-end self-start sm:self-auto h-full pb-1 sm:pl-2">
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium leading-loose">
                  Selected window: <span className="font-bold text-slate-700 dark:text-slate-300">{customStartDate || 'None'}</span> to <span className="font-bold text-slate-700 dark:text-slate-300">{customEndDate || 'None'}</span>
                </p>
              </div>
            </motion.div>
          )}
        </div>

        {activeTab === 'overview' ? (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'blue' },
                { label: 'Active Subscriptions', value: stats?.activeSubscriptions || 0, icon: Activity, color: 'emerald' },
                { label: 'Monthly Recurring Revenue', value: stats?.monthlyRecurringRevenue || 0, icon: DollarSign, color: 'indigo', prefix: 'K' },
                { label: 'Credits Issued', value: stats?.totalCredits || 0, icon: CreditCard, color: 'purple' }
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group"
                >
                  <div className={`absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-${stat.color}-500/5 rounded-full blur-2xl group-hover:bg-${stat.color}-500/10 transition-all`} />
                  <div className="flex items-center justify-between mb-6">
                    <div className={`p-3 bg-${stat.color}-50 dark:bg-${stat.color}-900/20 text-${stat.color}-600 dark:text-${stat.color}-400 rounded-2xl`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Real-time</span>
                  </div>
                  <div className="text-4xl font-black text-slate-900 dark:text-white mb-1">
                    {stat.prefix || ''}{stat.value.toLocaleString()}
                  </div>
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{stat.label}</div>
                </motion.div>
              ))}
            </div>

            {/* User Growth & Subscription Revenue Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* User Growth Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-500" />
                      User Growth Trends
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Total subscriber registry expansion ({dateRange === '7d' ? '7-day' : dateRange === '30d' ? '30-day' : dateRange === 'last-month' ? 'last month' : dateRange === 'ytd' ? 'year-to-date' : dateRange === 'custom' ? 'custom' : 'all-time'} audit timeline)</p>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded bg-indigo-550 inline-block" />
                      Cumulative Users
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded bg-cyan-400 inline-block" />
                      Daily Signups
                    </span>
                  </div>
                </div>
                
                <div className="h-64 w-full">
                  {isAnalyticsLoading ? (
                    <div className="flex justify-center items-center h-full">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-650" />
                    </div>
                  ) : growthTimeline.length === 0 ? (
                    <div className="flex justify-center items-center h-full text-xs text-slate-450 dark:text-slate-550">
                      No sign-up logs reported.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={growthTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                        <YAxis yAxisId="left" stroke="#4f46e5" fontSize={9} tickLine={false} axisLine={false} label={{ value: 'Total Users', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: '9px', fill: '#4f46e5', fontWeight: 'bold' } }} />
                        <YAxis yAxisId="right" orientation="right" stroke="#06b6d4" fontSize={9} tickLine={false} axisLine={false} label={{ value: 'Daily Signups', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fontSize: '9px', fill: '#06b6d4', fontWeight: 'bold' } }} />
                        <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '11px', color: '#fff' }} />
                        <Bar yAxisId="right" dataKey="registrants" name="Daily Signups" fill="#06b6d4" opacity={0.65} radius={[4, 4, 0, 0]} barSize={8} />
                        <Area yAxisId="left" type="monotone" dataKey="cumulativeUsers" name="Cumulative Users" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#growthGrad)" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </motion.div>

              {/* Subscription Revenue Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-emerald-500" />
                      Subscription Revenue
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Total subscription receipts and monetary progress ({dateRange === '7d' ? '7-day' : dateRange === '30d' ? '30-day' : dateRange === 'last-month' ? 'last month' : dateRange === 'ytd' ? 'year-to-date' : dateRange === 'custom' ? 'custom' : 'all-time'} audit timeline)</p>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-slate-650 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" />
                      Cumulative Rev (PGK)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block" />
                      Daily Revenue
                    </span>
                  </div>
                </div>

                <div className="h-64 w-full">
                  {isAnalyticsLoading ? (
                    <div className="flex justify-center items-center h-full">
                      <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                    </div>
                  ) : growthTimeline.length === 0 ? (
                    <div className="flex justify-center items-center h-full text-xs text-slate-450 dark:text-slate-550">
                      No premium logs reported.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={growthTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                        <YAxis yAxisId="left" stroke="#10b981" fontSize={9} tickLine={false} axisLine={false} label={{ value: 'Cumulative Rev (K)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: '9px', fill: '#10b981', fontWeight: 'bold' } }} />
                        <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" fontSize={9} tickLine={false} axisLine={false} label={{ value: 'Daily Rev (K)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fontSize: '9px', fill: '#f59e0b', fontWeight: 'bold' } }} />
                        <Tooltip formatter={(value: any) => [`K${Number(value).toFixed(2)}`]} contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '11px', color: '#fff' }} />
                        <Bar yAxisId="right" dataKey="revenue" name="Daily Revenue" fill="#f59e0b" opacity={0.7} radius={[4, 4, 0, 0]} barSize={8} />
                        <Area yAxisId="left" type="monotone" dataKey="cumulativeRevenue" name="Cumulative Revenue" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#revenueGrad)" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Users Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">User Directory</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Manage access and resource allocation</p>
                </div>
                <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-4">
                  {/* Elegant Search Bar */}
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                      <Search className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    </span>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setUsersPage(1);
                      }}
                      placeholder="Search name or email..."
                      className="w-full sm:w-64 pl-10 pr-8 py-2 text-xs font-semibold border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-650 transition-all shadow-sm"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setUsersPage(1);
                        }}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        title="Clear search"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 self-end xs:self-auto uppercase tracking-widest shrink-0">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-slate-400">Live Feed</span>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800">
                      <th 
                        onClick={() => handleSort('name')}
                        className="px-8 py-4 text-left text-[10px] font-black text-slate-450 dark:text-slate-550 uppercase tracking-widest cursor-pointer hover:text-indigo-650 dark:hover:text-indigo-400 transition-colors select-none"
                        title="Sort by Name"
                      >
                        <div className="flex items-center gap-1 group">
                          <span>Identity</span>
                          {renderSortIcon('name')}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('email')}
                        className="px-8 py-4 text-left text-[10px] font-black text-slate-450 dark:text-slate-550 uppercase tracking-widest cursor-pointer hover:text-indigo-650 dark:hover:text-indigo-400 transition-colors select-none"
                        title="Sort by Email"
                      >
                        <div className="flex items-center gap-1 group">
                          <span>Email</span>
                          {renderSortIcon('email')}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('created_at')}
                        className="px-8 py-4 text-left text-[10px] font-black text-slate-450 dark:text-slate-550 uppercase tracking-widest cursor-pointer hover:text-indigo-650 dark:hover:text-indigo-400 transition-colors select-none"
                        title="Sort by Registration Date"
                      >
                        <div className="flex items-center gap-1 group">
                          <span>Join Date</span>
                          {renderSortIcon('created_at')}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('subscription_plan')}
                        className="px-8 py-4 text-left text-[10px] font-black text-slate-450 dark:text-slate-550 uppercase tracking-widest cursor-pointer hover:text-indigo-650 dark:hover:text-indigo-400 transition-colors select-none"
                        title="Sort by Subscription Plan"
                      >
                        <div className="flex items-center gap-1 group">
                          <span>Plan Status</span>
                          {renderSortIcon('subscription_plan')}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('credits')}
                        className="px-8 py-4 text-left text-[10px] font-black text-slate-450 dark:text-slate-550 uppercase tracking-widest cursor-pointer hover:text-indigo-650 dark:hover:text-indigo-400 transition-colors select-none"
                        title="Sort by Token Balance"
                      >
                        <div className="flex items-center gap-1 group">
                          <span>Resources</span>
                          {renderSortIcon('credits')}
                        </div>
                      </th>
                      <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest select-none">Access Status</th>
                      <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest select-none">Account Role</th>
                      <th className="px-8 py-4 text-right text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest select-none">Quick Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-8 py-16 text-center text-xs font-semibold text-slate-400 dark:text-slate-500">
                          {isUsersLoading ? (
                            <div className="flex justify-center items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                              <span>Searching directory records...</span>
                            </div>
                          ) : (
                            <span>No matching users registered under those search terms.</span>
                          )}
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => (
                      <tr key={user.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-xs font-black text-slate-500">
                              {user.name?.charAt(0) || 'U'}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                                {user.name || 'Anonymous User'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className="text-xs font-mono font-medium text-slate-600 dark:text-slate-400">
                            {user.email || 'N/A'}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                            {user.created_at ? new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                              {user.subscription_plan || 'free'}
                            </span>
                            <span className="text-[9px] font-semibold text-slate-450 dark:text-slate-500">
                              Status: {user.subscription_status || 'inactive'}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <button 
                            onClick={() => handleUpdateCredits(user.id, user.credits)}
                            className="flex items-center gap-2 group/btn cursor-pointer bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200/50 dark:border-slate-800 transition-all font-medium"
                          >
                            <span className="text-xs font-black text-slate-900 dark:text-white">{user.credits}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Creds</span>
                            <Settings className="w-3 h-3 text-slate-400 group-hover/btn:rotate-90 transition-transform" />
                          </button>
                        </td>
                        <td className="px-8 py-5">
                          {user.id === currentUser?.id ? (
                            <span className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center gap-1.5 w-fit select-none">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Active (You)
                            </span>
                          ) : (
                            <button
                              onClick={() => handleToggleSuspend(user.id, user.is_suspended || 0)}
                              className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center gap-1.5 border transition-all cursor-pointer shadow-sm
                                ${user.is_suspended === 1
                                  ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/40'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/40'
                                }`}
                              title={user.is_suspended === 1 ? "Click to Re-enable/Activate account" : "Click to Suspend/Block account"}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${user.is_suspended === 1 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                              <span>{user.is_suspended === 1 ? 'Suspended' : 'Active'}</span>
                            </button>
                          )}
                        </td>
                        <td className="px-8 py-5">
                          {user.id === currentUser?.id ? (
                            <span className="inline-flex items-center gap-1.5 text-indigo-650 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest select-none">
                              <ShieldAlert className="w-3.5 h-3.5" /> Root Admin
                            </span>
                          ) : (
                            <button
                              onClick={() => handleToggleRole(user.id, user.is_admin || 0)}
                              className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center gap-1.5 border transition-all cursor-pointer shadow-sm
                                ${user.is_admin === 1
                                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900/40'
                                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-slate-900/30 dark:text-slate-400 dark:border-slate-800'
                                }`}
                              title="Click to toggle account role mapping"
                            >
                              <ShieldAlert className={`w-3.5 h-3.5 ${user.is_admin === 1 ? 'text-indigo-650 dark:text-indigo-400' : 'text-slate-450 dark:text-slate-550'}`} />
                              <span>{user.is_admin === 1 ? 'Admin' : 'End User'}</span>
                            </button>
                          )}
                        </td>
                        <td className="px-8 py-5 text-right relative">
                          <div className="inline-block text-left">
                            <button
                              onClick={() => setActiveDropdownUserId(activeDropdownUserId === user.id ? null : user.id)}
                              className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 transition-all inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span>Actions</span>
                              <ChevronRight className={`w-3 h-3 transform transition-transform ${activeDropdownUserId === user.id ? 'rotate-90' : 'rotate-0'}`} />
                            </button>

                            {activeDropdownUserId === user.id && (
                              <>
                                <div 
                                  className="fixed inset-0 z-30" 
                                  onClick={() => setActiveDropdownUserId(null)} 
                                />
                                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg py-1.5 z-40 text-left">
                                  {user.id === currentUser?.id ? (
                                    <div className="px-4 py-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase select-none">
                                      Your Own Account
                                    </div>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => {
                                          setResetPasswordForUser(user);
                                          setActiveDropdownUserId(null);
                                        }}
                                        className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                                      >
                                        <Key className="w-3.5 h-3.5 text-indigo-500" />
                                        Reset Password
                                      </button>

                                      <button
                                        onClick={() => {
                                          handleToggleSuspend(user.id, user.is_suspended || 0);
                                          setActiveDropdownUserId(null);
                                        }}
                                        className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                                      >
                                        {user.is_suspended === 1 ? (
                                          <>
                                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                            Activate Account
                                          </>
                                        ) : (
                                          <>
                                            <XCircle className="w-3.5 h-3.5 text-rose-500" />
                                            Suspend Account
                                          </>
                                        )}
                                      </button>

                                      <button
                                        onClick={() => {
                                          handleToggleRole(user.id, user.is_admin || 0);
                                          setActiveDropdownUserId(null);
                                        }}
                                        className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                                      >
                                        <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                                        {user.is_admin === 1 ? 'Make End User' : 'Make Root Admin'}
                                      </button>
                                    </>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )))}
                  </tbody>
                </table>
              </div>
              {userPagination.pages > 1 && (
                <div className="px-8 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Showing {Math.min(userPagination.total, (usersPage - 1) * userPagination.limit + 1)} to {Math.min(usersPage * userPagination.limit, userPagination.total)} of {userPagination.total} users
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setUsersPage(prev => Math.max(1, prev - 1))}
                      disabled={usersPage === 1 || isUsersLoading}
                      className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 text-xs font-bold rounded-lg transition-colors"
                    >
                      Previous
                    </button>
                    <span className="text-xs font-bold flex items-center px-2 text-slate-700 dark:text-slate-300">
                      Page {usersPage} of {userPagination.pages}
                    </span>
                    <button
                      onClick={() => setUsersPage(prev => Math.min(userPagination.pages, prev + 1))}
                      disabled={usersPage === userPagination.pages || isUsersLoading}
                      className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 text-xs font-bold rounded-lg transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        ) : activeTab === 'analytics' ? (
          isAnalyticsLoading ? (
            <div className="flex justify-center items-center py-24">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
            </div>
          ) : (
            <div className="space-y-8">
              {/* Simulation Disclaimer Banner */}
              {analyticsData?.isSimulated && (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex gap-3">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-xl text-amber-800 dark:text-amber-400 mt-0.5 md:mt-0 flex-shrink-0">
                      <ShieldAlert className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-amber-900 dark:text-amber-300 uppercase tracking-widest">Simulation & Demonstration Mode Active</h4>
                      <p className="text-[11px] text-amber-800 dark:text-amber-400/90 mt-1 max-w-4xl">
                        Because a live production third-party analytics API credential (e.g. Google Analytics / PostHog) is not linked in this sandbox, we have loaded high-fidelity web traffic calculations. 
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[9px] uppercase font-bold tracking-widest">
                        <span className="text-emerald-600 dark:text-emerald-400">● Real Database Metrics:</span>
                        <span className="text-slate-600 dark:text-slate-400">Total Registered Users, Saved Resumes, & Completed Checkouts</span>
                        <span className="text-amber-600 dark:text-amber-400">● Simulated Metric Classes:</span>
                        <span className="text-slate-600 dark:text-slate-400">Active Live Visitors, Page Views, Bounce Rates, & Session Tracking</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Traffic Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Active Now</span>
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                  </div>
                  <div className="text-3xl font-black text-slate-900 dark:text-white mb-1">
                    {analyticsData?.activeNow || 0}
                  </div>
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Live Visitors</div>
                  <div className="text-[10px] text-amber-500 mt-2 font-semibold">● Simulated calculation</div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">Page Views</span>
                    <TrendingUp className="w-4 h-4 text-indigo-505" />
                  </div>
                  <div className="text-3xl font-black text-slate-900 dark:text-white mb-1">
                    {analyticsData?.totalPageviewsInPeriod?.toLocaleString() || 0}
                  </div>
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">{dateRange === '7d' ? '7D' : dateRange === '30d' ? '30D' : dateRange === 'last-month' ? 'Last Month' : dateRange === 'ytd' ? 'YTD' : dateRange === 'custom' ? 'Custom' : 'All-Time'} Total Views</div>
                  <div className="text-[10px] text-amber-500 mt-2 font-semibold">⚡ Simulated representation</div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest animate-pulse">Sessions</span>
                    <Activity className="w-4 h-4 text-emerald-505" />
                  </div>
                  <div className="text-3xl font-black text-slate-900 dark:text-white mb-1">
                    {analyticsData?.totalSessionsInPeriod?.toLocaleString() || 0}
                  </div>
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">{dateRange === '7d' ? '7D' : dateRange === '30d' ? '30D' : dateRange === 'last-month' ? 'Last Month' : dateRange === 'ytd' ? 'YTD' : dateRange === 'custom' ? 'Custom' : 'All-Time'} Sessions</div>
                  <div className="text-[10px] text-amber-500 mt-2 font-semibold">⚡ Simulated traffic logs</div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Bounce Rate</span>
                    <TrendingUp className="w-4 h-4 text-rose-500 rotate-180" />
                  </div>
                  <div className="text-3xl font-black text-slate-900 dark:text-white mb-1">
                    {analyticsData?.averageBounceRate || '26.8%'}
                  </div>
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Avg Session Duration</div>
                  <div className="text-[10px] text-amber-500 mt-2 font-semibold">⚡ Demo indicator value</div>
                </div>
              </div>

              {/* Central Recharts traffic trend */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Google Analytics {dateRange === '7d' ? '7-Day' : dateRange === '30d' ? '30-Day' : dateRange === 'last-month' ? 'Last Month' : dateRange === 'ytd' ? 'Year-to-Date' : dateRange === 'custom' ? 'Custom Range' : 'All-Time'} Timeline (Simulated)</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Daily dynamic projection of website pageviews vs visitor sessions (Demo Mode)</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-bold text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-indigo-600 inline-block" />
                      <span>Page Views</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                      <span>Sessions</span>
                    </div>
                  </div>
                </div>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analyticsData?.timeline || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorPageViews" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '11px', color: '#fff' }} />
                      <Area type="monotone" dataKey="pageViews" name="Page Views" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPageViews)" />
                      <Area type="monotone" dataKey="sessions" name="Sessions" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSessions)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Side-by-side: Referrers & Devices */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left: Traffic Referrer sources */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                  <div className="mb-6">
                    <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">Acquisition Referrer Sources</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Primary traffic referrals logged via Google tag tracker</p>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart data={analyticsData?.trafficSources || []} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
                        <XAxis type="number" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                        <YAxis type="category" dataKey="source" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} width={120} />
                        <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '11px', color: '#fff' }} />
                        <Bar dataKey="sessions" name="Sessions" fill="#4f46e5" radius={[0, 8, 8, 0]} />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Right: Device proportion pie chart */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                  <div className="mb-6">
                    <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">Visitor Device Categories</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Physical platform breakdown of active sessions</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 h-64 items-center">
                    <div className="h-48 w-full relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={analyticsData?.deviceDistribution || []}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={75}
                            paddingAngle={5}
                            dataKey="count"
                            nameKey="name"
                          >
                            {(analyticsData?.deviceDistribution || []).map((entry: any, index: number) => {
                              const colors = ['#4f46e5', '#10b981', '#f59e0b'];
                              return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                            })}
                          </Pie>
                          <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '11px', color: '#fff' }} />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-4">
                      {analyticsData?.deviceDistribution?.map((item: any, i: number) => {
                        const colors = ['bg-indigo-600', 'bg-emerald-500', 'bg-amber-500'];
                        const icons = [Tv, Smartphone, Tablet];
                        const Icon = icons[i % icons.length];
                        return (
                          <div key={item.name} className="flex items-center gap-3">
                            <div className={`p-2 ${colors[i % colors.length]} bg-opacity-10 rounded-xl`}>
                              <Icon className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-center text-xs font-bold text-slate-900 dark:text-white">
                                <span>{item.name}</span>
                                <span>{item.percentage}%</span>
                              </div>
                              <p className="text-[10px] text-slate-400">{item.count} Active Sessions</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Table Grids: Business Content Popularity + URL Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left: Resume Template popularity */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-8">
                  <div className="mb-6">
                    <h3 className="text-[14px] font-black text-slate-900 dark:text-white uppercase tracking-wider">Top-Generated Templates</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Total resume creations segmented by target styling templates</p>
                  </div>
                  <div className="space-y-5">
                    {analyticsData?.templatesList?.map((item: any) => {
                      const totalRes = analyticsData?.totalResumes || 1;
                      const percentage = Math.min(100, Math.round((item.count / totalRes) * 105) || 5);
                      return (
                        <div key={item.template} className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">{item.template} Layout</span>
                            <span className="font-mono text-slate-500">{item.count} creations ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                            <div className="bg-indigo-600 h-full rounded-full transition-all" style={{ width: `${Math.max(5, percentage)}%` }} />
                          </div>
                        </div>
                      );
                    })}
                    {(!analyticsData?.templatesList || analyticsData.templatesList.length === 0) && (
                      <p className="text-xs text-slate-500 py-4 text-center">No template records found in the database directory yet.</p>
                    )}
                  </div>
                </div>

                {/* Right: URL top page views */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-8">
                  <div className="mb-6">
                    <h3 className="text-[14px] font-black text-slate-900 dark:text-white uppercase tracking-wider">Top Visited Pages (GA Tracker)</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">The most navigated client router path layouts in this platform</p>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {analyticsData?.topPages?.map((page: any) => (
                      <div key={page.path} className="py-3 flex items-center justify-between">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">{page.path}</span>
                          <span className="text-[10px] text-slate-400">{page.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">{page.pageviews.toLocaleString()}</span>
                          <p className="text-[9px] text-slate-400 uppercase tracking-widest">Page Views</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Custom Google Analytics credentials configurations */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Active Google Analytics Control deck</h4>
                      <p className="text-xs text-slate-500">Enable site-wide Google tag integration and real-time event tracking via Google Analytics (Gtag.js)</p>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-850/50 flex flex-col sm:flex-row items-center gap-4">
                      <div className="flex-1 w-full space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                          GOOGLE_ANALYTICS_ID (GA4 MEASUREMENT ID)
                        </label>
                        <input
                          type="text"
                          id="admin-ga-measurement-id-input"
                          defaultValue={settings.find(s => s.key === 'GOOGLE_ANALYTICS_ID')?.value || ''}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-all font-mono"
                          placeholder="e.g. G-XXXXXXXXXX"
                        />
                      </div>
                      <button
                        onClick={async () => {
                          const input = document.getElementById('admin-ga-measurement-id-input') as HTMLInputElement;
                          if (!input) return;
                          const gaId = input.value.trim();
                          
                          if (gaId && !gaId.toUpperCase().startsWith('G-')) {
                            const confirmCustom = confirm('Warning: Standard Google Analytics 4 Measurement IDs must start with "G-". Are you sure you want to save this tracker ID?');
                            if (!confirmCustom) return;
                          }

                          await handleSaveSetting('GOOGLE_ANALYTICS_ID', gaId);
                          toast.success(gaId ? `Google Analytics Measurement ID updated to: ${gaId}. Site-wide tags will automatically enable upon cookie consent grant!` : 'Google Analytics ID disabled. Native scripts unmounted.');
                        }}
                        className="w-full sm:w-auto px-5 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-black uppercase tracking-widest border border-slate-350 dark:border-slate-700 hover:scale-[1.02] active:scale-95 transition-all shadow-md shrink-0 cursor-pointer text-center"
                      >
                        Save Tracker ID
                      </button>
                    </div>

                    <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed font-semibold">
                      ● <strong>Implementation Notes:</strong> When a tracking ID is defined here, the site dynamically injects tracking code scripts pointing to <code>https://www.googletagmanager.com/gtag/js?id={'{ID}'}</code>. All users who opt "Accept All" via our secure site policy manager will be tracked completely securely, adhering strictly to global GDPR compliance constraints.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )
        ) : activeTab === 'transactions' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
          >
            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Global Transactions</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Complete audit trail of revenue events</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800">
                    <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Timestamp</th>
                    <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Entity ID</th>
                    <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Revenue</th>
                    <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Allocation</th>
                    <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-8 py-5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {new Date(tx.created_at).toLocaleString()}
                      </td>
                      <td className="px-8 py-5 text-[10px] font-mono text-slate-400 dark:text-slate-500">
                        {tx.user_id}
                      </td>
                      <td className="px-8 py-5 text-sm font-black text-slate-900 dark:text-white">
                        {`K${(tx.amount / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">{tx.plan}</span>
                          <span className="text-[9px] text-slate-400 uppercase tracking-tighter">{tx.type}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : activeTab === 'verifications' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
          >
            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Manual Payment Verifications</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Review and approve locally submitted manual payments</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800">
                    <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date</th>
                    <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">User ID</th>
                    <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Details</th>
                    <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Target Plan</th>
                    <th className="px-8 py-4 text-center text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {verifications.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-8 py-5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {new Date(v.created_at).toLocaleString()}
                        {v.status === 'pending' && <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest rounded-full">Pending</span>}
                        {v.status === 'approved' && <span className="ml-2 px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-full">Approved</span>}
                        {v.status === 'rejected' && <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-black uppercase tracking-widest rounded-full">Rejected</span>}
                      </td>
                      <td className="px-8 py-5 text-[10px] font-mono text-slate-400 dark:text-slate-500">
                        {v.user_id}
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col gap-1 text-sm text-slate-900 dark:text-white">
                          <div><strong>Method:</strong> <span className="uppercase">{v.method}</span></div>
                          <div><strong>Receipt:</strong> {v.receipt_number}</div>
                          <div><strong>Amount:</strong> {v.currency} {v.amount}</div>
                          {v.screenshot_url && (
                            <div className="mt-1">
                              <a href={v.screenshot_url} target="_blank" rel="noreferrer" className="text-indigo-650 dark:text-indigo-400 font-bold hover:underline text-xs">
                                View Screenshot Proof
                              </a>
                            </div>
                          )}

                          {/* Smart AI OCR Side-by-Side Badge / Analysis */}
                          {v.ocr_data && (() => {
                            try {
                              const ocr = JSON.parse(v.ocr_data);
                              const isRefMatch = ocr.receiptNumber && 
                                String(ocr.receiptNumber).replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === String(v.receipt_number).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

                              const formattedUserAmt = Number(v.amount);
                              const formattedOcrAmt = Number(ocr.amount);
                              const isAmountMatch = formattedUserAmt === formattedOcrAmt ||
                                                    formattedUserAmt === formattedOcrAmt * 100 ||
                                                    formattedUserAmt * 100 === formattedOcrAmt ||
                                                    Math.abs(formattedUserAmt - formattedOcrAmt) < 2 ||
                                                    Math.abs(formattedUserAmt / 100 - formattedOcrAmt) < 2;

                              return (
                                <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                                  <div className="flex items-center justify-between font-black text-[9px] text-indigo-650 dark:text-indigo-400 uppercase tracking-widest mb-1.5">
                                    <span>🤖 AI OCR Verification</span>
                                    <span className="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded text-[8px]">
                                      {ocr.confidenceScore || 90}% Confidence
                                    </span>
                                  </div>
                                  <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                                    <div className="flex items-center gap-2 justify-between">
                                      <span>Extracted Ref:</span>
                                      <span className={`font-mono font-bold ${isRefMatch ? "text-emerald-600" : "text-amber-600"}`}>
                                        {ocr.receiptNumber || 'None'}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 justify-between">
                                      <span>Extracted Amt:</span>
                                      <span className={`font-bold ${isAmountMatch ? "text-emerald-600" : "text-amber-600"}`}>
                                        {ocr.currency || 'PGK'} {ocr.amount}
                                      </span>
                                    </div>
                                    {ocr.merchantName && (
                                      <div className="flex items-center gap-2 justify-between text-[10px] opacity-80">
                                        <span>Merchant:</span>
                                        <span>{ocr.merchantName}</span>
                                      </div>
                                    )}
                                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 mt-1.5 text-[10px]">
                                      {isRefMatch && isAmountMatch ? (
                                        <span className="text-emerald-600 font-bold flex items-center gap-1">✓ High Trust: Matched Reference & Amount</span>
                                      ) : (
                                        <span className="text-amber-600 font-bold flex items-center gap-1">⚠️ Review: Fields mismatch or low certainty</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            } catch (e) {
                              return null;
                            }
                          })()}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">{v.plan}</span>
                          <span className="text-[10px] text-slate-400 uppercase tracking-tighter">{v.type}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        {v.status === 'pending' ? (
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => handleApprove(v.id)} className="p-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200 rounded-lg" title="Approve">
                              <CheckCircle className="w-5 h-5" />
                            </button>
                            <button onClick={() => handleReject(v.id)} className="p-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 rounded-lg" title="Reject">
                              <XCircle className="w-5 h-5" />
                            </button>
                          </div>
                        ) : (
                          <div className="text-center text-xs text-slate-500">
                            {v.notes && <div className="italic text-[10px]">"{v.notes}"</div>}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {verifications.length === 0 && (
                     <tr>
                       <td colSpan={5} className="px-8 py-8 text-center text-slate-500 dark:text-slate-400 text-sm">No manual payment verifications found.</td>
                     </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : activeTab === 'settings' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">System Configuration</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Manage environment variables and application secrets</p>
                </div>
                <button
                  onClick={() => {
                    const key = prompt('Enter new setting key:');
                    if (key) handleSaveSetting(key, '');
                  }}
                  className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg"
                >
                  Add Secret
                </button>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 mb-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <BrainCircuit className="w-24 h-24 text-indigo-500" />
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                      <BrainCircuit className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">AI Model Versioning</h4>
                      <p className="text-xs text-slate-500">Configure strategy for analysis quality and cost</p>
                    </div>
                  </div>

                  <div className="space-y-4 max-w-2xl">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Key className="w-3 h-3" />
                        GEMINI_MODEL
                        {settings.find(s => s.key === 'GEMINI_MODEL') && (
                          <span className="text-[9px] text-emerald-500 lowercase opacity-50 font-medium">
                            (Last updated: {new Date(settings.find(s => s.key === 'GEMINI_MODEL')!.updated_at).toLocaleDateString()})
                          </span>
                        )}
                      </label>
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          value={settings.find(s => s.key === 'GEMINI_MODEL')?.value || 'gemini-3.5-flash'}
                          onChange={(e) => handleSaveSetting('GEMINI_MODEL', e.target.value)}
                          placeholder="e.g. gemini-3.5-flash"
                          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-all font-mono"
                        />
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-1">Quick Presets:</span>
                        {[
                          { id: 'gemini-3.5-flash', label: 'Flash 3.5' },
                          { id: 'gemini-2.5-flash', label: 'Flash 2.5' },
                          { id: 'gemini-2.0-pro-exp-02-05', label: 'Pro 2.0 (Reasoning)' },
                          { id: 'gemini-3.1-pro-preview', label: 'Pro 3.1 (Advanced)' }
                        ].map(preset => {
                          const currentModel = settings.find(s => s.key === 'GEMINI_MODEL')?.value || 'gemini-3.5-flash';
                          const isActive = currentModel === preset.id;
                          return (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => handleSaveSetting('GEMINI_MODEL', preset.id)}
                              className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all duration-150 cursor-pointer ${
                                isActive 
                                  ? 'bg-indigo-600 text-white shadow-sm' 
                                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              {preset.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100/50 dark:border-indigo-800/30">
                      <h5 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2">Strategy & Impact</h5>
                      <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2 list-disc pl-4">
                        <li><strong>Quality:</strong> Pro models provide deeper reasoning and better formatting for complex resumes, while Flash is suitable for most standard formats.</li>
                        <li><strong>Cost:</strong> Flash models are significantly cheaper per token, reducing your API costs at scale.</li>
                        <li><strong>Speed:</strong> Flash models generate text much faster, leading to a better user experience for real-time generation.</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* PDF Generation Service Quality & Strategy */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-2xl">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">PDF Generation Orchestration</h4>
                      <p className="text-xs text-slate-500">Scale and balance document compile performance with cloud services</p>
                    </div>
                  </div>

                  <div className="space-y-6 max-w-2xl">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Cpu className="w-3 h-3" />
                        PDF_SERVICE_TYPE
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          { id: 'puppeteer', label: 'Local Chrome', desc: 'Warm pooled browser' },
                          { id: 'gotenberg', label: 'Gotenberg', desc: 'Docker API Cluster' },
                          { id: 'serverless', label: 'Serverless REST', desc: 'JSON remote service' }
                        ].map(typePreset => {
                          const currentType = settings.find(s => s.key === 'PDF_SERVICE_TYPE')?.value || 'puppeteer';
                          const isActive = currentType === typePreset.id;
                          return (
                            <button
                              key={typePreset.id}
                              type="button"
                              onClick={() => handleSaveSetting('PDF_SERVICE_TYPE', typePreset.id)}
                              className={`text-xs p-3.5 rounded-2xl font-bold transition-all duration-150 cursor-pointer text-left flex flex-col justify-between border ${
                                isActive 
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                                  : 'bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                              }`}
                            >
                              <div className="font-black text-xs">{typePreset.label}</div>
                              <div className={`text-[10px] mt-1 font-normal ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                                {typePreset.desc}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {(settings.find(s => s.key === 'PDF_SERVICE_TYPE')?.value || 'puppeteer') !== 'puppeteer' && (
                      <div className="space-y-4 pt-2">
                        <div className="flex flex-col gap-4">
                          <div className="flex-1 flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                              <Globe className="w-3 h-3" />
                              PDF_SERVICE_URL
                            </label>
                            <input
                              type="text"
                              defaultValue={settings.find(s => s.key === 'PDF_SERVICE_URL')?.value || ''}
                              onBlur={(e) => {
                                if (e.target.value !== (settings.find(s => s.key === 'PDF_SERVICE_URL')?.value || '')) {
                                  handleSaveSetting('PDF_SERVICE_URL', e.target.value);
                                }
                              }}
                              placeholder={settings.find(s => s.key === 'PDF_SERVICE_TYPE')?.value === 'gotenberg' ? 'e.g. http://localhost:8080 or https://gotenberg.myorg.co' : 'e.g. https://api.mycloudpdf.get'}
                              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-all font-mono"
                            />
                          </div>

                          {settings.find(s => s.key === 'PDF_SERVICE_TYPE')?.value === 'serverless' && (
                            <div className="flex-1 flex flex-col gap-2">
                              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Key className="w-3 h-3" />
                                PDF_SERVICE_TOKEN (Bearer authorization value)
                              </label>
                              <input
                                type="password"
                                defaultValue={settings.find(s => s.key === 'PDF_SERVICE_TOKEN')?.value || ''}
                                onBlur={(e) => {
                                  if (e.target.value !== (settings.find(s => s.key === 'PDF_SERVICE_TOKEN')?.value || '')) {
                                    handleSaveSetting('PDF_SERVICE_TOKEN', e.target.value);
                                  }
                                }}
                                placeholder="Sensitive Bearer Token"
                                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-all font-mono"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100/50 dark:border-blue-800/30">
                      <h5 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2">Performance & Fault-Tolerance Strategy</h5>
                      <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2 list-disc pl-4">
                        <li><strong>Gotenberg API:</strong> Offloads high memory layouts to headless clusters, keeping Express threads fast and responsive.</li>
                        <li><strong>Warm Pooled Puppeteer:</strong> Launches a recycled singleton Chromium instance to completely eliminate spawn latency.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-800/30 text-amber-800 dark:text-amber-400 text-xs flex gap-3 mb-6">
                  <ShieldAlert className="w-5 h-5 shrink-0" />
                  <div>
                    <strong>Security Notice:</strong> Sensitive platform credentials (such as Stripe keys, Gemini API keys, JWT Secret, etc.) have been migrated to secure Environment Variables. Please configure them via the AI Studio Settings menu. They are no longer editable from this database dashboard.
                  </div>
                </div>

                {['ADMIN_EMAIL', 'APP_URL'].map(key => {
                  const setting = settings.find(s => s.key === key);
                  return (
                    <div key={key} className="flex flex-col gap-2 p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800 group relative">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                          <Key className="w-3 h-3" />
                          {key}
                          {setting && (
                            <span className="text-[9px] text-emerald-500 lowercase opacity-50 font-medium">
                              (Last updated: {new Date(setting.updated_at).toLocaleDateString()})
                            </span>
                          )}
                        </label>
                        {setting && (
                          <button 
                            onClick={() => handleDeleteSetting(key)}
                            className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 transition-all p-1"
                          >
                            <ShieldAlert className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          defaultValue={setting?.value || ''}
                          onBlur={(e) => {
                            if (e.target.value !== (setting?.value || '')) {
                              handleSaveSetting(key, e.target.value);
                            }
                          }}
                          className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-all"
                          placeholder={`Enter value for ${key}...`}
                        />
                      </div>
                    </div>
                  );
                })}

                {/* Additional custom settings (Non-sensitive) */}
                {settings.filter(s => 
                  !['ADMIN_EMAIL', 'APP_URL', 'GEMINI_MODEL'].includes(s.key) &&
                  !s.key.toUpperCase().includes('SECRET') && 
                  !s.key.toUpperCase().includes('KEY') && 
                  !s.key.toUpperCase().includes('TOKEN') &&
                  !s.key.toUpperCase().includes('PASSWORD')
                ).map(setting => (
                  <div key={setting.key} className="flex flex-col gap-2 p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800 group relative">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Globe className="w-3 h-3" />
                        {setting.key}
                        <span className="text-[9px] text-emerald-500 lowercase opacity-50 font-medium">
                          (Custom)
                        </span>
                      </label>
                      <button 
                        onClick={() => handleDeleteSetting(setting.key)}
                        className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 transition-all p-1"
                      >
                        <ShieldAlert className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        defaultValue={setting.value}
                        onBlur={(e) => {
                          if (e.target.value !== setting.value) {
                            handleSaveSetting(setting.key, e.target.value);
                          }
                        }}
                        className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-all"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-2xl">
                <p className="text-[10px] text-blue-700 dark:text-blue-400 leading-relaxed font-medium">
                  <strong>Note:</strong> Settings stored here will be used by the application in preference to system environment variables where applicable. Critical variables like <code>DATABASE_URL</code> must still be set via the platform dashboard.
                </p>
              </div>
            </div>
          </motion.div>
        ) : activeTab === 'system' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {isHealthLoading && !healthReport ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <Loader2 className="w-8 h-8 animate-spin text-slate-500 mb-2" />
                <p className="text-sm text-slate-500 font-medium">Compiling multi-point health check reports...</p>
              </div>
            ) : healthReport ? (
              <div className="space-y-8">
                {/* Visual Status Banner */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-block w-3 h-3 rounded-full animate-pulse ${healthReport.status === 'HEALTHY' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                        SYSTEM {healthReport.status}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Primary nodes and background process queues verified at {new Date(healthReport.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs font-mono">
                    <div className="bg-slate-50 dark:bg-slate-950 px-4 py-2 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="text-slate-400 text-[10px] font-semibold uppercase tracking-widest mb-0.5">Uptime</div>
                      <div className="text-slate-800 dark:text-slate-200 font-bold">{Math.floor(healthReport.uptime / 3600)}h {Math.floor((healthReport.uptime % 3600) / 60)}m {Math.floor(healthReport.uptime % 60)}s</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950 px-4 py-2 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="text-slate-400 text-[10px] font-semibold uppercase tracking-widest mb-0.5">Env Mode</div>
                      <div className="text-slate-800 dark:text-slate-200 font-bold uppercase">{healthReport.envMode}</div>
                    </div>
                  </div>
                </div>

                {/* Main Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {/* Database & Integrations */}
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                    <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <Database className="w-4 h-4 text-indigo-500" />
                      Infrastructure Services
                    </h4>
                    
                    <div className="space-y-4">
                      {/* Database Card */}
                      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                        <div>
                          <div className="text-sm font-bold text-slate-800 dark:text-slate-200">Postgres DB</div>
                          <div className="text-xs text-slate-400 dark:text-slate-500 uppercase font-mono mt-0.5">Provider: {healthReport.metrics.database.provider}</div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-2.5 py-0.5 text-[10px] font-black uppercase rounded-full ${healthReport.metrics.database.status === 'UP' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400'}`}>
                            {healthReport.metrics.database.status}
                          </span>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-1">{healthReport.metrics.database.latencyMs}ms latency</div>
                        </div>
                      </div>

                      {/* Redis Card */}
                      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                        <div>
                          <div className="text-sm font-bold text-slate-800 dark:text-slate-200">Redis Cache</div>
                          <div className="text-xs text-slate-400 dark:text-slate-500 uppercase font-mono mt-0.5">Rate Limit Store</div>
                        </div>
                        <div>
                          <span className={`inline-block px-2.5 py-0.5 text-[10px] font-black uppercase rounded-full ${healthReport.metrics.redis.status === 'UP' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' : healthReport.metrics.redis.status === 'NOT_CONFIGURED' ? 'bg-slate-100 text-slate-500' : 'bg-red-50 text-red-600'}`}>
                            {healthReport.metrics.redis.status}
                          </span>
                        </div>
                      </div>

                      {/* PDF Engine Card */}
                      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                        <div>
                          <div className="text-sm font-bold text-slate-800 dark:text-slate-200">PDF Generator</div>
                          <div className="text-xs text-slate-400 dark:text-slate-500 uppercase font-mono mt-0.5">Engine: {healthReport.metrics.pdf?.serviceType || 'Puppeteer (Local Pool)'}</div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-2.5 py-0.5 text-[10px] font-black uppercase rounded-full ${(healthReport.metrics.pdf?.serviceType || 'puppeteer') !== 'puppeteer' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'}`}>
                            {(healthReport.metrics.pdf?.serviceType || 'puppeteer').toUpperCase()}
                          </span>
                          {healthReport.metrics.pdf?.serviceUrl && (
                            <div className="text-[9px] text-slate-400 dark:text-slate-500 font-mono mt-1 max-w-[150px] truncate" title={healthReport.metrics.pdf.serviceUrl}>
                              {healthReport.metrics.pdf.serviceUrl}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Resource Utilization */}
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                    <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-emerald-500" />
                      Resource Utilization
                    </h4>
                    
                    <div className="space-y-5">
                      {/* RAM usage bar */}
                      <div>
                        <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          <span>Node JVM Allocation</span>
                          <span>{Math.round(healthReport.metrics.memory.rss / (1024 * 1024))} MB</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, healthReport.metrics.memory.usagePercentage || 45)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-mono">
                          <span>Heap: {Math.round(healthReport.metrics.memory.heapUsed / (1024 * 1024))} MB used</span>
                          <span>System: {Math.round(healthReport.metrics.memory.systemTotalBytes / (1024 * 1024 * 1024))} GB total</span>
                        </div>
                      </div>

                      {/* CPU Usage & load */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Process Load Average</div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                            <div className="text-[9px] text-slate-400 uppercase font-mono">1 Min</div>
                            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">{healthReport.metrics.cpu.systemLoad1m.toFixed(2)}</div>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                            <div className="text-[9px] text-slate-400 uppercase font-mono">5 Min</div>
                            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">{healthReport.metrics.cpu.systemLoad5m.toFixed(2)}</div>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                            <div className="text-[9px] text-slate-400 uppercase font-mono">15 Min</div>
                            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">{healthReport.metrics.cpu.systemLoad15m.toFixed(2)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dev Action Panel */}
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                    <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      Verification & Diagnostics
                    </h4>
                    
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">Use these sandbox controls to immediately mock major incidents, testing visual metrics and automated administrator email notifications.</p>
                    
                    <div className="space-y-3 pt-2">
                      <button
                        onClick={() => handleTriggerTestAlert('API_KEY_FAILURE', 'critical', 'AI API Authentication Limit')}
                        className="w-full text-left flex items-center justify-between p-3.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/10 dark:hover:bg-red-950/20 text-red-700 dark:text-red-400 rounded-2xl border border-red-100/50 dark:border-red-900/40 text-xs font-bold transition-all group"
                      >
                        <span className="flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Simulate API Key Failure
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </button>

                      <button
                        onClick={() => handleTriggerTestAlert('PAYMENT_FAILURE', 'critical', 'Instant payment webhook crash')}
                        className="w-full text-left flex items-center justify-between p-3.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/10 dark:hover:bg-amber-950/20 text-amber-700 dark:text-amber-400 rounded-2xl border border-amber-100/50 dark:border-amber-900/40 text-xs font-bold transition-all group"
                      >
                        <span className="flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5" />
                          Simulate Stripe Webhook Fail
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Keys Configured Checklist */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                  <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Environment Keys Configured</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {Object.entries(healthReport.keysConfigured).map(([key, isConfigured]) => (
                      <div key={key} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                        {isConfigured ? (
                          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-slate-300 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold font-mono truncate">{key}</div>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">{isConfigured ? 'Active' : 'Missing'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Incident History & Triggered Alerts Log */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                  <div>
                    <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-500" />
                      Recent Triggered Alerts Incident Logs
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Real-time alerts, error exceptions, sliding-window rate alarms, and email dispatch status</p>
                  </div>

                  {healthReport.alerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 bg-slate-50 dark:bg-slate-950/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                      <CheckCircle className="w-10 h-10 text-emerald-500 mb-2" />
                      <p className="text-sm text-slate-800 dark:text-slate-300 font-bold">Zero alarms active at present</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">All thresholds, limits, and connections are clean and healthy.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase text-slate-400 tracking-widest font-mono">
                            <th className="py-3 px-4">Timestamp</th>
                            <th className="py-3 px-4">Alert Type</th>
                            <th className="py-3 px-4">Severity</th>
                            <th className="py-3 px-4">Summary</th>
                            <th className="py-3 px-4">Diagnostics / Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                          {healthReport.alerts.map((alert: any) => (
                            <tr key={alert.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/40 transition-colors">
                              <td className="py-3.5 px-4 font-mono text-slate-400 whitespace-nowrap">{new Date(alert.timestamp).toLocaleTimeString()}</td>
                              <td className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300 font-mono text-[10px]">{alert.type}</td>
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <span className={`inline-block px-2 py-0.5 text-[9px] font-black uppercase rounded-full ${alert.severity === 'critical' ? 'bg-red-50 text-red-600 dark:bg-red-950/20' : 'bg-amber-50 text-amber-600'}`}>
                                  {alert.severity}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">{alert.summary}</td>
                              <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate" title={alert.details}>{alert.details}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Scalability and Load Testing Control Center */}
                <div id="scalability-testing" className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 animate-fade-in">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                        <Activity className="w-5 h-5 text-indigo-500 animate-pulse" />
                        Scalability & Load Testing Control Center
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Deploy real-time concurrent simulation loads to evaluate Express thread pool congestion, PDF generation worker buffers, and connection resilience.
                      </p>
                    </div>
                    {scalabilityHistory.length > 0 && (
                      <button
                        onClick={handleClearScalabilityHistory}
                        className="text-xs font-bold text-red-500 hover:text-red-600 dark:text-red-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <XCircle className="w-4 h-4 text-red-500" />
                        Purge History
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Simulator Configuration Panel */}
                    <div className="lg:col-span-1 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800/80 p-5 space-y-5">
                      <h5 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Configure Simulation
                      </h5>

                      <div className="space-y-4">
                        {/* Target Select */}
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 block">Test Profile Target</label>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { id: 'mixed', label: 'Mixed Workload', desc: 'Queries + PDFs + AI' },
                              { id: 'ai', label: 'AI Prompt Gen', desc: 'AI route stress-test' },
                              { id: 'pdf', label: 'PDF Export', desc: 'Puppeteer local queue' },
                              { id: 'database', label: 'Database Queries', desc: 'DB connection limits' },
                            ].map((tgt) => (
                              <button
                                key={tgt.id}
                                type="button"
                                onClick={() => setTestTarget(tgt.id as any)}
                                className={`text-left p-3 rounded-xl border transition-all text-xs flex flex-col justify-between h-20 w-full cursor-pointer ${
                                  testTarget === tgt.id
                                    ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-950/20 dark:border-indigo-800/80 text-indigo-900 dark:text-indigo-400 ring-2 ring-indigo-500/20'
                                    : 'bg-white border-slate-200 hover:border-slate-300 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300'
                                }`}
                              >
                                <span className="font-extrabold block leading-tight">{tgt.label}</span>
                                <span className="text-[9px] text-slate-400 dark:text-slate-500 leading-tight mt-1 truncate w-full block">{tgt.desc}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Concurrency input slider */}
                        <div>
                          <div className="flex justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                            <span>Concurrency</span>
                            <span className="text-indigo-600 dark:text-indigo-400 font-mono font-black">{testConcurrency} Client Fibers</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="50"
                            value={testConcurrency}
                            onChange={(e) => setTestConcurrency(Number(e.target.value))}
                            className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none"
                          />
                          <div className="flex justify-between text-[8px] text-slate-400 mt-0.5">
                            <span>1 worker</span>
                            <span>25 workers</span>
                            <span>50 workers (Peak)</span>
                          </div>
                        </div>

                        {/* Duration Select */}
                        <div>
                          <div className="flex justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                            <span>Test Duration</span>
                            <span className="text-indigo-600 dark:text-indigo-400 font-mono font-black">{testDuration} Seconds</span>
                          </div>
                          <input
                            type="range"
                            min="2"
                            max="30"
                            value={testDuration}
                            onChange={(e) => setTestDuration(Number(e.target.value))}
                            className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none"
                          />
                          <div className="flex justify-between text-[8px] text-slate-400 mt-0.5">
                            <span>2s</span>
                            <span>15s</span>
                            <span>30s (Maximum)</span>
                          </div>
                        </div>

                        {/* External APIs Mocking */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                          <label className="flex items-center justify-between cursor-pointer">
                            <div className="pr-2">
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Mock External Endpoints</span>
                              <span className="text-[9px] text-slate-400 dark:text-slate-500 block leading-tight mt-0.5">
                                Shields Gemini API quota and budget during runs.
                              </span>
                            </div>
                            <input
                              type="checkbox"
                              checked={testMockExternal}
                              onChange={(e) => setTestMockExternal(e.target.checked)}
                              className="rounded border-slate-300 dark:border-slate-800 text-indigo-600 focus:ring-indigo-500 w-4 h-4 accent-indigo-600 cursor-pointer"
                            />
                          </label>
                        </div>

                        {/* Launch Trigger Button */}
                        <button
                          onClick={handleRunScalabilityTest}
                          disabled={isTesting}
                          className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-extrabold text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 group cursor-pointer"
                        >
                          {isTesting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-white" />
                              Simulating Load ({testConcurrency} Clients)...
                            </>
                          ) : (
                            <>
                              <Activity className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                              Launch Concurrency Simulation
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Report Card & Real-Time Statistics */}
                    <div className="lg:col-span-2 space-y-6">
                      {isTesting ? (
                        <div className="flex flex-col items-center justify-center py-24 bg-slate-50/50 dark:bg-slate-950/10 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800/80 h-full">
                          <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
                          <div className="text-sm font-bold text-slate-800 dark:text-slate-200">Executing Scalability Scenario...</div>
                          <p className="text-xs text-slate-400 dark:text-slate-500 text-center max-w-sm mt-1.5 leading-relaxed px-4">
                            Simulating {testConcurrency} concurrent workers dispatching actions to the Express cluster. Monitoring event loop lag, system memory, and database context locks.
                          </p>
                        </div>
                      ) : activeTestResult ? (
                        <div className="space-y-6 animate-fade-in">
                          {/* Live Report card status banner */}
                          <div className={`p-5 rounded-2xl border flex items-start gap-4 ${
                            activeTestResult.metrics.failedRequests === 0
                              ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400'
                              : 'bg-amber-50 border-amber-100 dark:bg-amber-950/10 dark:border-amber-900/30 text-amber-800 dark:text-amber-400'
                          }`}>
                            <div className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-inherit shrink-0">
                              {activeTestResult.metrics.failedRequests === 0 ? (
                                <CheckCircle className="w-5 h-5 text-emerald-500" />
                              ) : (
                                <AlertCircle className="w-5 h-5 text-amber-500" />
                              )}
                            </div>
                            <div>
                              <div className="text-xs uppercase font-extrabold tracking-widest text-[9px] opacity-70">Simulation Outcomes</div>
                              <h5 className="text-base font-black mt-0.5">
                                {activeTestResult.metrics.failedRequests === 0 
                                  ? "SYSTEM DEMONSTRATES EXCELLENT SCALABILITY" 
                                  : "PUPPETEER BACKPRESSURE THROTTLED WORKLOAD"}
                              </h5>
                              <p className="text-xs opacity-80 leading-relaxed mt-1">{activeTestResult.metrics.diagnosticAdvice}</p>
                            </div>
                          </div>

                          {/* KPIs Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <div className="bg-slate-50 dark:bg-slate-950/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60">
                              <div className="text-slate-400 text-[9px] font-extrabold uppercase tracking-widest">Throughput</div>
                              <div className="text-lg font-black dark:text-white mt-1">{activeTestResult.metrics.throughput.toFixed(2)} <span className="text-xs font-normal text-slate-400">req/s</span></div>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-950/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60">
                              <div className="text-slate-400 text-[9px] font-extrabold uppercase tracking-widest">Success Rate</div>
                              <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">
                                {((activeTestResult.metrics.successfulRequests / activeTestResult.metrics.totalRequests) * 100).toFixed(1)}% 
                                <span className="text-xs font-normal text-slate-400 ml-1">({activeTestResult.metrics.successfulRequests}/{activeTestResult.metrics.totalRequests})</span>
                              </div>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-950/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60">
                              <div className="text-slate-400 text-[9px] font-extrabold uppercase tracking-widest">Avg Response Time</div>
                              <div className="text-lg font-black dark:text-white mt-1">{activeTestResult.metrics.avgLatencyMs.toFixed(0)} <span className="text-xs font-normal text-slate-400">ms</span></div>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-950/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60">
                              <div className="text-slate-400 text-[9px] font-extrabold uppercase tracking-widest">p95 Latency</div>
                              <div className="text-lg font-black dark:text-white mt-1">{activeTestResult.metrics.p95LatencyMs.toFixed(0)} <span className="text-xs font-normal text-slate-400">ms</span></div>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-950/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60">
                              <div className="text-slate-400 text-[9px] font-extrabold uppercase tracking-widest">p99 Latency</div>
                              <div className="text-lg font-black dark:text-white mt-1">{activeTestResult.metrics.p99LatencyMs.toFixed(0)} <span className="text-xs font-normal text-slate-400">ms</span></div>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-950/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60">
                              <div className="text-slate-400 text-[9px] font-extrabold uppercase tracking-widest">DB Op Latency</div>
                              <div className="text-lg font-black dark:text-white mt-1">{activeTestResult.metrics.databaseLatencyAvgMs.toFixed(1)} <span className="text-xs font-normal text-slate-400">ms</span></div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-20 bg-slate-50/30 dark:bg-slate-950/10 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 h-full">
                          <Activity className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-3" />
                          <div className="text-sm font-bold text-slate-700 dark:text-slate-300">Ready to Benchmark Stack</div>
                          <p className="text-xs text-slate-400 dark:text-slate-500 text-center max-w-sm mt-1 leading-relaxed px-4">
                            Configure simulation parameters on the left and trigger the concurrency simulation to measure precise load latency profiles.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Comparisons & History Panel */}
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-4">
                    <h5 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-indigo-500" />
                      Scalability Comparison & Run History
                    </h5>

                    {isHistoryLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                      </div>
                    ) : scalabilityHistory.length === 0 ? (
                      <div className="text-center py-6 bg-slate-50/50 dark:bg-slate-950/10 rounded-2xl border border-slate-100 dark:border-slate-800/50 text-xs text-slate-400 font-medium">
                        No previous load testing telemetry recorded. Run your first simulation above!
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase text-slate-400 tracking-widest font-mono">
                              <th className="py-3 px-4">Timestamp</th>
                              <th className="py-3 px-4">Profile Target</th>
                              <th className="py-3 px-4 text-center">Concurrency</th>
                              <th className="py-3 px-4 text-center">Duration</th>
                              <th className="py-3 px-4 text-right">Throughput</th>
                              <th className="py-3 px-4 text-center">Success Rate</th>
                              <th className="py-3 px-4 text-right">p95 Latency</th>
                              <th className="py-3 px-4">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                            {scalabilityHistory.map((run) => {
                              const successRate = run.metrics.totalRequests > 0 
                                ? (run.metrics.successfulRequests / run.metrics.totalRequests) * 100 
                                : 100;
                              return (
                                <tr key={run.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/40 transition-colors">
                                  <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">{new Date(run.timestamp).toLocaleTimeString()}</td>
                                  <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300 font-mono text-[10px] uppercase">{run.target}</td>
                                  <td className="py-3 px-4 text-center font-bold font-mono">{run.concurrency} clients</td>
                                  <td className="py-3 px-4 text-center font-mono">{run.durationSeconds}s</td>
                                  <td className="py-3 px-4 text-right font-mono font-bold">{run.metrics.throughput.toFixed(1)} r/s</td>
                                  <td className="py-3 px-4 text-center">
                                    <span className={`font-mono font-bold ${successRate < 95 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                      {successRate.toFixed(1)}%
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-right font-mono text-slate-500">{run.metrics.p95LatencyMs.toFixed(0)} ms</td>
                                  <td className="py-3 px-4">
                                    <span className={`inline-block px-1.5 py-0.5 text-[8px] font-black uppercase rounded-sm ${run.metrics.failedRequests === 0 ? 'bg-emerald-550 text-emerald-600 dark:bg-emerald-950/25' : 'bg-amber-550 text-amber-600 dark:bg-amber-950/25'}`}>
                                      {run.metrics.failedRequests === 0 ? 'PASS' : 'THROTTLED'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <XCircle className="w-10 h-10 text-red-500 mb-2" />
                <p className="text-sm text-slate-800 dark:text-slate-200 font-bold">Failed to retrieve metrics</p>
                <p className="text-xs text-slate-500">Please try refreshing the dashboard or contact your systems operator.</p>
              </div>
            )}
          </motion.div>
        ) : activeTab === 'audit' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-indigo-500" />
                    Administrative Audit Logs
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    A searchable list of recent security events, user modifications, role adjustments, and settings changes.
                  </p>
                </div>
                <div className="relative max-w-sm w-full font-sans">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={auditSearchQuery}
                    onChange={(e) => {
                      setAuditSearchQuery(e.target.value);
                      setAuditPage(1);
                    }}
                    placeholder="Search logs by admin, email, action..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-650 transition-all outline-none text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {isAuditLoading ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
                  <p className="text-xs font-bold uppercase tracking-wider">Retrieving audit logs...</p>
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="py-16 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center p-6">
                  <ClipboardList className="w-12 h-12 text-slate-350 dark:text-slate-600 mb-3" />
                  <p className="text-sm font-bold text-slate-705 dark:text-slate-300">No audit logs found</p>
                  <p className="text-xs text-slate-450 dark:text-slate-500 max-w-md mt-1">
                    Try adjusting your search query, or perform some administrative actions to see logs populated here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase font-black text-[10px] tracking-widest border-b border-slate-200 dark:border-slate-800 select-none">
                        <tr>
                          <th className="px-5 py-4">Timestamp</th>
                          <th className="px-5 py-4">Administrator</th>
                          <th className="px-5 py-4">Action</th>
                          <th className="px-5 py-4">Details</th>
                          <th className="px-5 py-4">Target ID</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150 dark:divide-slate-850 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300">
                        {auditLogs.map((log) => {
                          // Action type badges colors
                          let badgeClass = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
                          if (log.action_type === "grant_admin" || log.action_type === "payment_approve") {
                            badgeClass = "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-405 border border-emerald-200/20";
                          } else if (log.action_type === "revoke_admin" || log.action_type === "suspend_user" || log.action_type === "setting_delete") {
                            badgeClass = "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/20";
                          } else if (log.action_type === "unsuspend_user") {
                            badgeClass = "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/20";
                          } else if (log.action_type === "password_reset" || log.action_type === "adjust_credits" || log.action_type === "transaction_refund") {
                            badgeClass = "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200/20";
                          }

                          // Clean label for action types
                          const getActionLabel = (type: string) => {
                            return type
                              .split("_")
                              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                              .join(" ");
                          };

                          return (
                            <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors">
                              <td className="px-5 py-4 whitespace-nowrap font-mono text-[11px] text-slate-500 dark:text-slate-400">
                                {new Date(log.created_at).toLocaleString([], {
                                  year: "numeric",
                                  month: "short",
                                  day: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                })}
                              </td>
                              <td className="px-5 py-4 font-sans font-bold text-slate-900 dark:text-white">
                                {log.admin_email}
                                <span className="block font-mono text-[10px] text-slate-400 dark:text-slate-500 font-normal mt-0.5">
                                  ID: {log.admin_id}
                                </span>
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${badgeClass}`}>
                                  {getActionLabel(log.action_type)}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-xs font-medium text-slate-705 dark:text-slate-300 max-w-sm">
                                {log.details}
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap font-mono text-[11px] text-slate-400 dark:text-slate-500">
                                {log.target_id || "N/A"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Section */}
                  {auditPagination.pages > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-5 mt-4">
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Showing page <span className="font-bold text-slate-800 dark:text-slate-200">{auditPagination.page}</span> of{" "}
                        <span className="font-bold text-slate-800 dark:text-slate-200">{auditPagination.pages}</span> (
                        <span className="font-medium">{auditPagination.total} total logs</span>)
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setAuditPage((prev) => Math.max(1, prev - 1));
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          disabled={auditPage === 1}
                          className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => {
                            setAuditPage((prev) => Math.min(auditPagination.pages, prev + 1));
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          disabled={auditPage === auditPagination.pages}
                          className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ) : null}
      </div>

      {/* Elegant Password Reset Modal Dialog */}
      {resetPasswordForUser && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                  <Key className="w-4 h-4 text-indigo-500" />
                  Reset User Password
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Target: {resetPasswordForUser.name || 'Anonymous'} ({resetPasswordForUser.email})
                </p>
              </div>
              <button
                onClick={() => {
                  setResetPasswordForUser(null);
                  setNewPasswordValue('');
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                  New Temporary Password
                </label>
                <input
                  type="password"
                  value={newPasswordValue}
                  onChange={(e) => setNewPasswordValue(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-4 py-2.5 text-xs font-semibold border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-650 transition-all shadow-sm"
                  required
                  minLength={6}
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setResetPasswordForUser(null);
                    setNewPasswordValue('');
                  }}
                  className="flex-1 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-250 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl transition-all cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResettingPassword}
                  className="flex-1 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-650 dark:hover:bg-indigo-600 rounded-xl shadow-md cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isResettingPassword ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Apply Reset
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
