'use client';

import React, { useState, useEffect } from 'react';
import { useLayoutStore } from '../../../lib/layoutStore';
import { useAuthStore } from '../../../lib/auth';
import { api } from '../../../lib/api';
import { 
  Settings, 
  Users, 
  Sliders, 
  History, 
  UserPlus, 
  RefreshCw, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface UserRecord {
  id: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface AuditRecord {
  id: string;
  userId: string | null;
  user?: { username: string } | null;
  action: string;
  actionType: string;
  ipAddress: string;
  outcome: string;
  createdAt: string;
}

interface RateLimitConfig {
  id: string;
  tool: string;
  limit: number;
  window: number;
}

export default function AdminDashboardPage() {
  const { setContext } = useLayoutStore();
  const { user: currentUser } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'users' | 'rate-limits' | 'audit-logs'>('users');
  
  // Data lists
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditRecord[]>([]);
  const [rateLimits, setRateLimits] = useState<RateLimitConfig[]>([]);
  const [metrics, setMetrics] = useState<any>(null);

  // Loading & statuses
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // User CRUD states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('STUDENT');
  
  // Audit filtering
  const [auditSearch, setAuditSearch] = useState('');
  const [auditOutcome, setAuditOutcome] = useState('');
  const [auditPage, setAuditPage] = useState(1);
  const [totalAudits, setTotalAudits] = useState(0);
  const auditsPerPage = 10;

  useEffect(() => {
    // Set AI baseline context
    setContext({ tool: 'reports', data: null }); // Admin context falls into general reporting
    fetchData();
  }, [activeTab, auditPage, setContext]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (activeTab === 'users') {
        const res = await api.get('/api/admin/users');
        setUsers(res.data);
        const stats = await api.get('/api/admin/metrics');
        setMetrics(stats.data);
      } else if (activeTab === 'rate-limits') {
        const res = await api.get('/api/admin/rate-limits');
        setRateLimits(res.data);
      } else if (activeTab === 'audit-logs') {
        const res = await api.get('/api/admin/audit-logs', {
          params: {
            limit: auditsPerPage,
            offset: (auditPage - 1) * auditsPerPage,
            outcome: auditOutcome || undefined,
            actionType: auditSearch || undefined
          }
        });
        setAuditLogs(res.data.logs || []);
        setTotalAudits(res.data.total || 0);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Access denied: Requires administrator credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Create user
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      await api.post('/api/admin/users', {
        username: newUsername,
        email: newEmail,
        password: newPassword,
        role: newRole
      });
      setSuccess('User registered successfully.');
      setShowAddModal(false);
      
      // Reset inputs
      setNewUsername('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('STUDENT');
      
      // Refresh list
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Registration failed.');
    }
  };

  // Toggle user state / deactivation
  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    setError(null);
    setSuccess(null);
    try {
      if (currentStatus) {
        // Deactivate
        await api.delete(`/api/admin/users/${userId}`);
        setSuccess('User deactivated successfully.');
      } else {
        // Activate (Patch)
        await api.patch(`/api/admin/users/${userId}`, { isActive: true });
        setSuccess('User activated successfully.');
      }
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Update status failed.');
    }
  };

  // Update rate limits
  const handleUpdateRateLimit = async (tool: string, limit: number, window: number) => {
    setError(null);
    setSuccess(null);
    try {
      await api.patch('/api/admin/rate-limits', { tool, limit, window });
      setSuccess(`Updated rate limits config for ${tool}.`);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Update rate limit failed.');
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case 'SECURITY_ANALYST': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      default: return 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Admin Navigation Header */}
      <div className="flex border-b border-slate-800/40">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-6 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'users' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Profiles</span>
        </button>
        <button
          onClick={() => setActiveTab('rate-limits')}
          className={`px-6 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'rate-limits' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Rate Limits Configuration</span>
        </button>
        <button
          onClick={() => setActiveTab('audit-logs')}
          className={`px-6 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'audit-logs' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Immutable Audit Logs</span>
        </button>
      </div>

      {/* Action status responses */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm font-semibold rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 bg-accent/10 border border-accent/20 text-accent text-sm font-semibold rounded-xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* TAB 1: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          {metrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-panel p-4 rounded-xl border border-slate-800/40 text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Total Registered Users</span>
                <span className="text-3xl font-black text-white block mt-1">{metrics.totalUsers ?? 0}</span>
              </div>
              <div className="glass-panel p-4 rounded-xl border border-slate-800/40 text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Active Logins (Sessions)</span>
                <span className="text-3xl font-black text-accent block mt-1">{metrics.activeSessions ?? 0}</span>
              </div>
            </div>
          )}

          {/* User grid */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800/50">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Registered Identity Accounts</h4>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-primary text-slate-950 text-xs font-bold rounded-lg shadow-neon-cyan hover:shadow-cyan-500/30 transition-all uppercase tracking-wider flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create User</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/60 pb-3">
                    <th className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pb-3">Username</th>
                    <th className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pb-3">Email Address</th>
                    <th className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pb-3 text-center">Clearance Role</th>
                    <th className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pb-3 text-center">Status</th>
                    <th className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pb-3 text-right">Registered</th>
                    <th className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-slate-900 last:border-0 hover:bg-slate-900/10 transition-colors">
                      <td className="py-3 text-xs font-mono font-bold text-slate-200">{u.username}</td>
                      <td className="py-3 text-xs text-slate-400 font-semibold">{u.email}</td>
                      <td className="py-3 text-center">
                        <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full inline-block ${getRoleBadgeStyle(u.role)}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <span className={`text-[9px] font-bold uppercase tracking-wider ${u.isActive ? 'text-accent' : 'text-slate-500'}`}>
                          {u.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="py-3 text-right text-xs text-slate-500 font-semibold font-mono">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-right">
                        {u.id !== currentUser?.id && (
                          <button
                            onClick={() => handleToggleUserStatus(u.id, u.isActive)}
                            className={`p-1.5 border rounded-lg transition-all ${
                              u.isActive
                                ? 'border-red-500/20 text-red-400 hover:bg-red-500/10'
                                : 'border-accent/20 text-accent hover:bg-accent/10'
                            }`}
                            title={u.isActive ? 'Deactivate user session' : 'Re-activate account'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add User Modal */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6">Create New Account</h3>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Username</label>
                    <input
                      type="text"
                      required
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                    <input
                      type="email"
                      required
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Password</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role</label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200"
                    >
                      <option value="STUDENT">STUDENT</option>
                      <option value="SECURITY_ANALYST">SECURITY_ANALYST</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="flex-1 py-2 bg-slate-900 border border-slate-800 text-slate-400 rounded-lg text-xs font-bold uppercase hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 bg-primary text-slate-950 rounded-lg text-xs font-bold uppercase shadow-neon-cyan"
                    >
                      Create
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: RATE LIMITS CONFIGURATION */}
      {activeTab === 'rate-limits' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800/50">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-6">Rate Limits Config</h4>
          
          <div className="space-y-6">
            {rateLimits.map((rl) => (
              <div key={rl.id} className="p-4 bg-slate-900/25 border border-slate-850 rounded-xl grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                <div className="md:col-span-2">
                  <span className="text-xs font-bold text-slate-200 capitalize">{rl.tool.replace('_', ' ')}</span>
                  <p className="text-[9px] text-slate-500 font-mono mt-0.5">Scope Window: {rl.window}s</p>
                </div>
                <div>
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mb-1.5">
                    <span>Limit:</span>
                    <span className="font-mono text-primary">{rl.limit} Req</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={rl.limit}
                    onChange={(e) => handleUpdateRateLimit(rl.tool, parseInt(e.target.value), rl.window)}
                    className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
                <div className="text-right text-[10px] font-mono text-slate-500">
                  {rl.limit} calls / {rl.window / 3600}h
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: IMMUTABLE AUDIT LOGS */}
      {activeTab === 'audit-logs' && (
        <div className="space-y-6">
          {/* Filters panel */}
          <div className="glass-panel p-4 rounded-xl border border-slate-800/40 flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search Action Type (e.g. USER_LOGIN, PORT_SCAN)..."
                value={auditSearch}
                onChange={(e) => {
                  setAuditSearch(e.target.value);
                  setAuditPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-650"
              />
            </div>

            <div className="w-full md:w-48">
              <select
                value={auditOutcome}
                onChange={(e) => {
                  setAuditOutcome(e.target.value);
                  setAuditPage(1);
                }}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none"
              >
                <option value="">All Outcomes</option>
                <option value="success">Success</option>
                <option value="failure">Failure</option>
              </select>
            </div>

            <button
              onClick={fetchData}
              className="p-2 border border-slate-800 hover:border-primary/50 text-slate-400 hover:text-white rounded-lg transition-all flex-shrink-0"
              title="Refresh logs"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Table */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800/50">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/60 pb-3">
                    <th className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pb-3">Timestamp</th>
                    <th className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pb-3">Operator</th>
                    <th className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pb-3">Action Type</th>
                    <th className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pb-3">Target Endpoint</th>
                    <th className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pb-3 text-center">Outcome</th>
                    <th className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pb-3 text-right">IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.length > 0 ? (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="border-b border-slate-900 last:border-0 hover:bg-slate-900/10 transition-colors">
                        <td className="py-2.5 text-xs text-slate-450 font-semibold font-mono">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="py-2.5 text-xs font-mono font-bold text-slate-200">
                          {log.user?.username || 'SYSTEM'}
                        </td>
                        <td className="py-2.5 text-xs text-primary font-bold">{log.actionType}</td>
                        <td className="py-2.5 text-[10px] font-mono text-slate-400 truncate max-w-[200px]" title={log.action}>
                          {log.action}
                        </td>
                        <td className="py-2.5 text-center">
                          <span className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded border ${
                            log.outcome === 'success' 
                              ? 'bg-accent/10 text-accent border-accent/20' 
                              : 'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}>
                            {log.outcome}
                          </span>
                        </td>
                        <td className="py-2.5 text-right text-xs text-slate-500 font-mono font-semibold">
                          {log.ipAddress}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-slate-500">
                        Zero audit logs found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalAudits > auditsPerPage && (
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-800/40 text-xs font-semibold text-slate-500">
                <span>
                  Showing {(auditPage - 1) * auditsPerPage + 1} - {Math.min(totalAudits, auditPage * auditsPerPage)} of {totalAudits} logs
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={auditPage === 1}
                    onClick={() => setAuditPage(prev => Math.max(1, prev - 1))}
                    className="p-2 border border-slate-800 rounded-lg hover:border-primary/50 disabled:opacity-50 text-slate-450 hover:text-white transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={auditPage * auditsPerPage >= totalAudits}
                    onClick={() => setAuditPage(prev => prev + 1)}
                    className="p-2 border border-slate-800 rounded-lg hover:border-primary/50 disabled:opacity-50 text-slate-450 hover:text-white transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
