'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '../lib/auth';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import AIAssistant from './AIAssistant';

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, initialize, isLoading } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  // Initialize auth session
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Determine if page is public
  const isPublicPage = pathname === '/' || pathname === '/login' || pathname === '/register';

  useEffect(() => {
    if (isLoading) return;

    const publicPages = ['/', '/login', '/register'];
    const isPublic = publicPages.includes(pathname);

    if (!isAuthenticated && !isPublic) {
      router.push('/login');
    } else if (isAuthenticated && (pathname === '/login' || pathname === '/register')) {
      router.push('/dashboard');
    }
  }, [pathname, isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="w-full h-screen bg-[#050811] flex flex-col items-center justify-center gap-4">
        <div className="relative w-16 h-16 border-t-2 border-primary rounded-full animate-spin">
          <div className="absolute inset-2 border-t-2 border-accent rounded-full animate-spin" />
        </div>
        <span className="font-mono text-xs text-primary uppercase tracking-widest animate-pulse">
          Establishing Secure Link...
        </span>
      </div>
    );
  }

  // For landing page, show raw page view
  if (isPublicPage) {
    return <>{children}</>;
  }

  // For authenticated pages, wrap in sidebar, navbar, and AI side panels
  return (
    <div className="min-h-screen bg-[#050811] text-slate-100">
      <Sidebar />
      <Navbar />
      
      {/* Main dashboard content */}
      <main className="pl-64 pt-16 min-h-screen grid-bg relative transition-all duration-300">
        <div className="p-8 max-w-6xl mx-auto pb-24">
          {children}
        </div>
      </main>

      <AIAssistant />
    </div>
  );
}
