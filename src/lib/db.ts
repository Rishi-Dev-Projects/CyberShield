import fs from 'fs';
import path from 'path';
import { supabase } from './supabase';

const LOCAL_DB_PATH = path.join(process.cwd(), 'cybershield-db.json');

// Helper to initialize or read local JSON database fallback
function getLocalDb() {
  if (!fs.existsSync(LOCAL_DB_PATH)) {
    const initialDb = {
      profiles: [],
      scan_jobs: [],
      file_hashes: [],
      url_analyses: [],
      reports: [],
      audit_logs: [],
      rate_limits: [
        { id: '1', tool: 'authentication', limit: 5, window: 900 },
        { id: '2', tool: 'port_scan', limit: 10, window: 3600 },
        { id: '3', tool: 'vulnerability_scan', limit: 5, window: 3600 },
        { id: '4', tool: 'file_check', limit: 20, window: 3600 },
        { id: '5', tool: 'url_analysis', limit: 50, window: 3600 }
      ]
    };
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(initialDb, null, 2));
    return initialDb;
  }
  try {
    return JSON.parse(fs.readFileSync(LOCAL_DB_PATH, 'utf-8'));
  } catch (err) {
    console.error('Error reading local DB:', err);
    return { profiles: [], scan_jobs: [], file_hashes: [], url_analyses: [], reports: [], audit_logs: [], rate_limits: [] };
  }
}

function writeLocalDb(data: any) {
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Failed to write local DB:', err);
  }
}

const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return url && !url.includes('placeholder-project');
};

export const db = {
  // Query Rate Limits
  async getRateLimits() {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('rate_limits').select('*');
      if (!error && data) return data;
    }
    return getLocalDb().rate_limits;
  },

  async updateRateLimit(tool: string, limit: number, window: number) {
    if (isSupabaseConfigured()) {
      await supabase.from('rate_limits').upsert({ tool, limit, window }, { onConflict: 'tool' });
    } else {
      const local = getLocalDb();
      const idx = local.rate_limits.findIndex((rl: any) => rl.tool === tool);
      if (idx !== -1) {
        local.rate_limits[idx].limit = limit;
        local.rate_limits[idx].window = window;
      } else {
        local.rate_limits.push({ id: Math.random().toString(), tool, limit, window });
      }
      writeLocalDb(local);
    }
  },

  // Scan Jobs
  async createScanJob(job: { type: string; target: string; scanConfig: any; userId: string }) {
    const newJob = {
      id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      type: job.type,
      target: job.target,
      scanConfig: job.scanConfig,
      status: 'PENDING',
      results: null,
      errorMsg: null,
      userId: job.userId,
      createdAt: new Date().toISOString(),
      completedAt: null
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('scan_jobs').insert([newJob]).select().single();
      if (!error && data) return data;
    }

    const local = getLocalDb();
    local.scan_jobs.push(newJob);
    writeLocalDb(local);
    return newJob;
  },

  async getScanJob(id: string) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('scan_jobs').select('*').eq('id', id).single();
      if (!error && data) return data;
    }
    return getLocalDb().scan_jobs.find((j: any) => j.id === id) || null;
  },

  async updateScanJob(id: string, updates: { status?: string; results?: any; errorMsg?: string; completedAt?: string | null }) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('scan_jobs').update(updates).eq('id', id).select().single();
      if (!error && data) return data;
    }

    const local = getLocalDb();
    const idx = local.scan_jobs.findIndex((j: any) => j.id === id);
    if (idx !== -1) {
      local.scan_jobs[idx] = { ...local.scan_jobs[idx], ...updates };
      writeLocalDb(local);
      return local.scan_jobs[idx];
    }
    return null;
  },

  async getRecentScans(limit: number = 5, userId?: string) {
    if (isSupabaseConfigured()) {
      let query = supabase.from('scan_jobs').select('*').order('createdAt', { ascending: false }).limit(limit);
      if (userId) query = query.eq('userId', userId);
      const { data } = await query;
      if (data) return data;
    }
    let jobs = getLocalDb().scan_jobs;
    if (userId) jobs = jobs.filter((j: any) => j.userId === userId);
    return jobs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, limit);
  },

  async getScansCount(startDate: Date, userId?: string) {
    if (isSupabaseConfigured()) {
      let query = supabase.from('scan_jobs').select('id', { count: 'exact' }).gte('createdAt', startDate.toISOString());
      if (userId) query = query.eq('userId', userId);
      const { count } = await query;
      if (count !== null) return count;
    }
    let jobs = getLocalDb().scan_jobs.filter((j: any) => new Date(j.createdAt).getTime() >= startDate.getTime());
    if (userId) jobs = jobs.filter((j: any) => j.userId === userId);
    return jobs.length;
  },

  async getActiveJobsCount(userId?: string) {
    if (isSupabaseConfigured()) {
      let query = supabase.from('scan_jobs').select('id', { count: 'exact' }).in('status', ['PENDING', 'RUNNING']);
      if (userId) query = query.eq('userId', userId);
      const { count } = await query;
      if (count !== null) return count;
    }
    let jobs = getLocalDb().scan_jobs.filter((j: any) => ['PENDING', 'RUNNING'].includes(j.status));
    if (userId) jobs = jobs.filter((j: any) => j.userId === userId);
    return jobs.length;
  },

  async getCriticalVulnerabilitiesCount(startDate: Date, userId?: string) {
    if (isSupabaseConfigured()) {
      let query = supabase.from('scan_jobs')
        .select('results')
        .eq('type', 'VULNERABILITY_ASSESSMENT')
        .eq('status', 'COMPLETED')
        .gte('createdAt', startDate.toISOString());
      if (userId) query = query.eq('userId', userId);
      const { data } = await query;
      if (data) {
        let count = 0;
        data.forEach((j: any) => {
          const vulns = j.results?.vulnerabilities || [];
          count += vulns.filter((v: any) => v.severity === 'CRITICAL').length;
        });
        return count;
      }
    }
    let jobs = getLocalDb().scan_jobs.filter((j: any) => 
      j.type === 'VULNERABILITY_ASSESSMENT' && 
      j.status === 'COMPLETED' && 
      new Date(j.createdAt).getTime() >= startDate.getTime()
    );
    if (userId) jobs = jobs.filter((j: any) => j.userId === userId);
    
    let count = 0;
    jobs.forEach((j: any) => {
      const vulns = j.results?.vulnerabilities || [];
      count += vulns.filter((v: any) => v.severity === 'CRITICAL').length;
    });
    return count;
  },

  // Audit Logs
  async createAuditLog(log: { userId?: string; action: string; actionType: string; ipAddress: string; outcome: string; metadata?: any }) {
    const newLog = {
      id: Math.random().toString(),
      userId: log.userId || null,
      action: log.action,
      actionType: log.actionType,
      ipAddress: log.ipAddress,
      outcome: log.outcome,
      metadata: log.metadata || null,
      createdAt: new Date().toISOString()
    };

    if (isSupabaseConfigured()) {
      await supabase.from('audit_logs').insert([newLog]);
    } else {
      const local = getLocalDb();
      local.audit_logs.push(newLog);
      writeLocalDb(local);
    }
    return newLog;
  },

  async getAuditLogs(params: { limit: number; offset: number; outcome?: string; actionType?: string }) {
    if (isSupabaseConfigured()) {
      let query = supabase.from('audit_logs').select('*', { count: 'exact' }).order('createdAt', { ascending: false });
      if (params.outcome) query = query.eq('outcome', params.outcome);
      if (params.actionType) query = query.ilike('actionType', `%${params.actionType}%`);
      
      const { data, count } = await query.range(params.offset, params.offset + params.limit - 1);
      return { logs: data || [], total: count || 0 };
    }

    let logs = getLocalDb().audit_logs;
    if (params.outcome) logs = logs.filter((l: any) => l.outcome === params.outcome);
    if (params.actionType) logs = logs.filter((l: any) => l.actionType.toLowerCase().includes(params.actionType!.toLowerCase()));
    
    const sortedLogs = logs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return {
      logs: sortedLogs.slice(params.offset, params.offset + params.limit),
      total: logs.length
    };
  },

  // File Hashes FIM
  async getFileHash(sha256: string) {
    if (isSupabaseConfigured()) {
      const { data } = await supabase.from('file_hashes').select('*').eq('sha256', sha256).single();
      if (data) return data;
    }
    return getLocalDb().file_hashes.find((h: any) => h.sha256 === sha256) || null;
  },

  async createFileHash(hash: { filename: string; fileSize: number; sha256: string; userId: string }) {
    const newHash = {
      id: Math.random().toString(),
      filename: hash.filename,
      fileSize: hash.fileSize,
      sha256: hash.sha256,
      userId: hash.userId,
      createdAt: new Date().toISOString()
    };

    if (isSupabaseConfigured()) {
      await supabase.from('file_hashes').insert([newHash]);
    } else {
      const local = getLocalDb();
      local.file_hashes.push(newHash);
      writeLocalDb(local);
    }
    return newHash;
  },

  // URL cache reputation
  async getUrlAnalysis(url: string) {
    if (isSupabaseConfigured()) {
      const { data } = await supabase.from('url_analyses')
        .select('*')
        .eq('url', url)
        .gte('expiresAt', new Date().toISOString())
        .single();
      if (data) return data;
    }
    return getLocalDb().url_analyses.find((u: any) => u.url === url && new Date(u.expiresAt).getTime() >= Date.now()) || null;
  },

  async createUrlAnalysis(analysis: { url: string; reputation: string; riskScore: number; analysis: any; userId: string; expiresAt: string; indicators?: any }) {
    const newAnalysis = {
      id: Math.random().toString(),
      url: analysis.url,
      reputation: analysis.reputation,
      riskScore: analysis.riskScore,
      analysis: analysis.analysis,
      userId: analysis.userId,
      createdAt: new Date().toISOString(),
      expiresAt: analysis.expiresAt,
      indicators: analysis.indicators || null
    };

    if (isSupabaseConfigured()) {
      await supabase.from('url_analyses').insert([newAnalysis]);
    } else {
      const local = getLocalDb();
      local.url_analyses.push(newAnalysis);
      writeLocalDb(local);
    }
    return newAnalysis;
  },

  // Reports
  async getReports(userId: string) {
    if (isSupabaseConfigured()) {
      const { data } = await supabase.from('reports').select('*').eq('userId', userId).order('createdAt', { ascending: false });
      if (data) return data;
    }
    return getLocalDb().reports.filter((r: any) => r.userId === userId).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getReport(id: string) {
    if (isSupabaseConfigured()) {
      const { data } = await supabase.from('reports').select('*').eq('id', id).single();
      if (data) return data;
    }
    return getLocalDb().reports.find((r: any) => r.id === id) || null;
  },

  async createReport(report: { format: string; filename: string; content: string; jobIds: string[]; userId: string }) {
    const newReport = {
      id: Math.random().toString(36).substring(2, 15),
      format: report.format,
      filename: report.filename,
      content: report.content, // base64 buffer representation
      jobIds: report.jobIds,
      userId: report.userId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days retention
    };

    if (isSupabaseConfigured()) {
      await supabase.from('reports').insert([newReport]);
    } else {
      const local = getLocalDb();
      local.reports.push(newReport);
      writeLocalDb(local);
    }
    return newReport;
  },

  // Admin User CRUD listing
  async listUsers() {
    if (isSupabaseConfigured()) {
      // Fetch users from profiles
      const { data } = await supabase.from('profiles').select('*');
      if (data) {
        return data.map((p: any) => ({
          id: p.id,
          username: p.username,
          email: p.email,
          role: p.role,
          isActive: p.is_active,
          createdAt: p.created_at
        }));
      }
    }
    return getLocalDb().profiles;
  },

  async adminCreateUser(user: { username: string; email: string; role: string }) {
    const newUser = {
      id: Math.random().toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    
    if (isSupabaseConfigured()) {
      await supabase.from('profiles').insert([{
        id: newUser.id,
        username: user.username,
        email: user.email,
        role: user.role,
        is_active: true
      }]);
    } else {
      const local = getLocalDb();
      local.profiles.push(newUser);
      writeLocalDb(local);
    }
    return newUser;
  },

  async adminUpdateUser(id: string, updates: { role?: string; isActive?: boolean }) {
    const mappedUpdates: any = {};
    if (updates.role) mappedUpdates.role = updates.role;
    if (updates.isActive !== undefined) mappedUpdates.is_active = updates.isActive;

    if (isSupabaseConfigured()) {
      await supabase.from('profiles').update(mappedUpdates).eq('id', id);
    } else {
      const local = getLocalDb();
      const idx = local.profiles.findIndex((u: any) => u.id === id);
      if (idx !== -1) {
        if (updates.role) local.profiles[idx].role = updates.role;
        if (updates.isActive !== undefined) local.profiles[idx].isActive = updates.isActive;
        writeLocalDb(local);
      }
    }
  }
};

interface RateLimitConfig {
  id: string;
  tool: string;
  limit: number;
  window: number;
}

interface UserRecord {
  id: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'SECURITY_ANALYST' | 'STUDENT';
  isActive: boolean;
  createdAt: string;
}

interface AuditRecord {
  id: string;
  userId: string | null;
  action: string;
  actionType: string;
  ipAddress: string;
  outcome: string;
  metadata?: any;
  createdAt: string;
}

export type { RateLimitConfig, UserRecord, AuditRecord };
