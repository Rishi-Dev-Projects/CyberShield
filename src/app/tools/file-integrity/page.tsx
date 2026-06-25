'use client';

import React, { useState, useEffect } from 'react';
import { useLayoutStore } from '../../../lib/layoutStore';
import { useAuthStore } from '../../../lib/auth';
import { api } from '../../../lib/api';
import { FileCheck, UploadCloud, FileText, CheckCircle2, AlertTriangle, ShieldCheck, Loader2 } from 'lucide-react';

export default function FileIntegrityPage() {
  const { setContext } = useLayoutStore();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'store' | 'verify'>('store');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [storeResult, setStoreResult] = useState<any>(null);
  const [verifyResult, setVerifyResult] = useState<any>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    // Set AI Assistant baseline context
    setContext({ tool: 'file-integrity', data: null });
  }, [setContext]);

  const maxLimitMB = user?.role === 'STUDENT' ? 10 : 100;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    setError(null);
    setStoreResult(null);
    setVerifyResult(null);

    // Size limit check
    const sizeInMB = file.size / (1024 * 1024);
    if (sizeInMB > maxLimitMB) {
      setError(`Size limit exceeded: Your role limit is ${maxLimitMB} MB. This file is ${sizeInMB.toFixed(2)} MB.`);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      if (activeTab === 'store') {
        const res = await api.post('/api/tools/file/check', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        setStoreResult(res.data);
        
        // Update AI Assistant context
        setContext({
          tool: 'file-integrity',
          data: { verified: true, ...res.data }
        });
      } else {
        const res = await api.post('/api/tools/file/verify', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        setVerifyResult(res.data);

        setContext({
          tool: 'file-integrity',
          data: res.data
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'File check execution failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Tabs */}
      <div className="flex border-b border-slate-800/40">
        <button
          onClick={() => {
            setActiveTab('store');
            setSelectedFile(null);
            setError(null);
            setStoreResult(null);
            setVerifyResult(null);
          }}
          className={`px-6 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
            activeTab === 'store' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          Check & Register Hash
        </button>
        <button
          onClick={() => {
            setActiveTab('verify');
            setSelectedFile(null);
            setError(null);
            setStoreResult(null);
            setVerifyResult(null);
          }}
          className={`px-6 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
            activeTab === 'verify' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          Verify File Integrity
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Upload workspace (Col span 2) */}
        <div className="md:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800/50">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-primary shadow-neon-cyan" />
              Upload Sandbox
            </h3>

            {/* Student Limit Warning */}
            {user?.role === 'STUDENT' && (
              <div className="mb-4 p-3 bg-primary/10 border border-primary/20 text-primary text-xs rounded-xl flex items-center gap-2 font-medium">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span>Upload threshold limited to 10 MB for student role.</span>
              </div>
            )}

            {/* Drag & Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer relative ${
                dragActive 
                  ? 'border-primary bg-primary/5 shadow-neon-cyan' 
                  : 'border-slate-800 bg-slate-900/10 hover:border-slate-700'
              }`}
            >
              <input
                key={`${activeTab}-${selectedFile ? 'file' : 'empty'}`}
                type="file"
                id="file-upload-input"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="file-upload-input" className="cursor-pointer space-y-3 block">
                <UploadCloud className="w-10 h-10 text-slate-500 mx-auto animate-pulse" />
                <div>
                  <p className="text-xs font-bold text-slate-300">Drag and drop file here, or click to browse</p>
                  <p className="text-[10px] text-slate-500 mt-1 font-mono uppercase">Max upload size: {maxLimitMB}MB</p>
                </div>
              </label>
            </div>

            {/* Selected File Card */}
            {selectedFile && (
              <div className="mt-6 p-4 bg-slate-900/35 border border-slate-800/40 rounded-xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 overflow-hidden">
                  <FileText className="w-8 h-8 text-primary flex-shrink-0" />
                  <div className="overflow-hidden">
                    <h5 className="text-xs font-bold text-slate-200 truncate">{selectedFile.name}</h5>
                    <span className="text-[10px] text-slate-500 font-mono">{(selectedFile.size / 1024).toFixed(1)} KB</span>
                  </div>
                </div>
                <button
                  onClick={handleAction}
                  disabled={isLoading}
                  className="px-4 py-2 bg-primary text-slate-950 text-xs font-bold rounded-lg shadow-neon-cyan hover:shadow-cyan-500/30 transition-all uppercase tracking-wider flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>{activeTab === 'store' ? 'Calculate & Register' : 'Verify Integrity'}</span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Results Panel */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800/50 flex flex-col justify-between min-h-[300px]">
          <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-6">Integrity Verification Report</h4>

          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Render store result */}
          {storeResult && (
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-2 text-accent text-xs font-bold bg-accent/5 p-3 rounded-xl border border-accent/15">
                <CheckCircle2 className="w-4 h-4 text-accent" />
                <span>Hash Computed & Registered Successfully!</span>
              </div>
              <div className="space-y-2 text-[11px] text-slate-400 font-medium">
                <div>
                  <span className="text-slate-500 block uppercase text-[9px] tracking-wider mb-0.5">Filename:</span>
                  <span className="text-slate-200">{storeResult.filename}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase text-[9px] tracking-wider mb-0.5">SHA-256 Digest:</span>
                  <span className="text-primary font-mono select-all break-all leading-normal">{storeResult.sha256}</span>
                </div>
              </div>
            </div>
          )}

          {/* Render verify result */}
          {verifyResult && (
            <div className="space-y-4 flex-1">
              {verifyResult.verified ? (
                <div className="flex items-center gap-2 text-accent text-xs font-bold bg-accent/5 p-3 rounded-xl border border-accent/15 shadow-neon-green">
                  <CheckCircle2 className="w-4 h-4 text-accent animate-bounce" />
                  <span>Verified: File integrity matches!</span>
                </div>
              ) : verifyResult.storedHash === null ? (
                <div className="flex items-center gap-2 text-yellow-500 text-xs font-bold bg-yellow-500/5 p-3 rounded-xl border border-yellow-500/15 shadow-neon-yellow">
                  <AlertTriangle className="w-4 h-4 text-yellow-500 animate-pulse" />
                  <span>Unregistered: File not found in database!</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-destructive text-xs font-bold bg-destructive/5 p-3 rounded-xl border border-destructive/15 shadow-neon-red">
                  <AlertTriangle className="w-4 h-4 text-destructive animate-pulse" />
                  <span>Alert: Mismatch / File Tampered!</span>
                </div>
              )}

              <div className="space-y-2 text-[11px] text-slate-400 font-medium">
                <div>
                  <span className="text-slate-500 block uppercase text-[9px] tracking-wider mb-0.5">Current Hash:</span>
                  <span className="font-mono text-slate-200 break-all leading-normal">{verifyResult.currentHash}</span>
                </div>
                {verifyResult.storedHash && (
                  <div>
                    <span className="text-slate-500 block uppercase text-[9px] tracking-wider mb-0.5">Base Stored Hash:</span>
                    <span className="font-mono text-primary break-all leading-normal">{verifyResult.storedHash}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-500 block uppercase text-[9px] tracking-wider mb-0.5">Verification message:</span>
                  <p className="text-slate-300 italic">{verifyResult.message}</p>
                </div>
              </div>
            </div>
          )}

          {!storeResult && !verifyResult && (
            <div className="flex-1 flex items-center justify-center text-center text-xs text-slate-500">
              Diagnostic report offline. Drag a file into the upload sandbox.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
