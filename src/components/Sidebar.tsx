'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '../lib/auth';
import { useLayoutStore } from '../lib/layoutStore';
import { 
  Shield, 
  LayoutDashboard, 
  Terminal, 
  Search, 
  Lock, 
  Hash, 
  FileCheck, 
  Globe, 
  User,
  LogOut,
  X
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const { isSidebarOpen, setSidebarOpen } = useLayoutStore();
  const pathname = usePathname();
  const router = useRouter();

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case 'SECURITY_ANALYST': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      default: return 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';
    }
  };

  const menuItems = [
    {
      group: 'Core',
      items: [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      ]
    },
    {
      group: 'Scanning Tools',
      items: [
        { label: 'Port Scanner', href: '/tools/port-scanner', icon: Terminal },
        { label: 'Vulnerability Scanner', href: '/tools/vulnerability', icon: Search },
      ]
    },
    {
      group: 'Utilities',
      items: [
        { label: 'Password Analyzer', href: '/tools/password', icon: Lock },
        { label: 'Hash Generator', href: '/tools/hash', icon: Hash },
        { label: 'File Integrity', href: '/tools/file-integrity', icon: FileCheck },
        { label: 'URL Analyzer', href: '/tools/url-analyzer', icon: Globe },
      ]
    }
  ];


  return (
    <aside className={`w-64 h-screen fixed left-0 top-0 glass-panel border-r border-slate-800/50 flex flex-col justify-between z-30 transition-transform duration-300 ${
      isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
    }`}>
      {/* Header */}
      <div>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/40 gap-3">
          <div className="flex items-center gap-3">
            <Shield className="w-7 h-7 text-primary shadow-neon-cyan animate-pulse" />
            <span className="font-extrabold text-xl tracking-wider bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">
              CYBER<span className="text-white">SHIELD</span>
            </span>
          </div>
          {/* Close button on mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        {user && (
          <div className="p-4 mx-4 my-4 bg-slate-900/30 rounded-lg border border-slate-800/30 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700/50">
              <User className="w-5 h-5 text-slate-300" />
            </div>
            <div className="overflow-hidden">
              <h4 className="text-sm font-semibold text-white truncate">{user.username}</h4>
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full inline-block mt-1 ${getRoleColor(user.role)}`}>
                {user.role}
              </span>
            </div>
          </div>
        )}

        {/* Menu Links */}
        <nav className="px-4 py-2 space-y-6 overflow-y-auto max-h-[calc(100vh-220px)]">
          {menuItems.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1.5">
              <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3">
                {group.group}
              </h5>
              {group.items.map((item, itemIdx) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={itemIdx}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 group ${
                      isActive 
                        ? 'bg-primary/10 text-primary border border-primary/20 shadow-neon-cyan' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/40 border border-transparent'
                    }`}
                  >
                    <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-primary' : 'text-slate-400 group-hover:text-primary'}`} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Sidebar Footer / Logout */}
      <div className="p-4 border-t border-slate-800/40">
        <button
          onClick={async () => {
            await logout();
            router.push('/login');
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-rose-450 hover:text-rose-350 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer font-semibold uppercase tracking-wider text-xs"
        >
          <LogOut className="w-4 h-4" />
          <span>Exit Console</span>
        </button>
      </div>
    </aside>
  );
}
