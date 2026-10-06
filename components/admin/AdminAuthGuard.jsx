'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Lock, Eye, EyeOff, ShieldCheck, ArrowLeft, KeyRound } from 'lucide-react';

const ADMIN_PASSWORD = 'Okara@3005';
const AUTH_STORAGE_KEY = 'okara_admin_authenticated';

export default function AdminAuthGuard({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check session or local storage for authentication
    try {
      const isAuth =
        sessionStorage.getItem(AUTH_STORAGE_KEY) === 'true' ||
        localStorage.getItem(AUTH_STORAGE_KEY) === 'true';
      if (isAuth) {
        setIsAuthenticated(true);
      }
    } catch (e) {
      console.warn('Storage access warning:', e);
    } finally {
      setIsCheckingAuth(false);
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    if (passwordInput === ADMIN_PASSWORD) {
      try {
        sessionStorage.setItem(AUTH_STORAGE_KEY, 'true');
        localStorage.setItem(AUTH_STORAGE_KEY, 'true');
      } catch (e) {
        console.warn('Failed to save auth state:', e);
      }
      setIsAuthenticated(true);
      setPasswordInput('');
    } else {
      setErrorMessage('Invalid administrative access key. Please verify and try again.');
    }
    setIsSubmitting(false);
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear auth state:', e);
    }
    setIsAuthenticated(false);
    setPasswordInput('');
  };

  // While initializing auth state
  if (isCheckingAuth) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[var(--color-background)]">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          <span className="text-[11px] uppercase tracking-[0.25em] text-[var(--color-muted)]">
            Verifying Credentials...
          </span>
        </div>
      </div>
    );
  }

  // If not authenticated, render the secure password gate
  if (!isAuthenticated) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-16 bg-[var(--color-background)]">
        <div className="max-w-md w-full bg-[var(--color-surface)] border border-[var(--color-border)] p-8 sm:p-10 shadow-2xl relative overflow-hidden">
          {/* Subtle Top Accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--color-primary)]" />

          {/* Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-14 h-14 bg-[var(--color-surface-subtle)] border border-[var(--color-border)] rounded-full flex items-center justify-center mb-4 text-[var(--color-primary)]">
              <Lock size={22} />
            </div>

            <span className="text-[10px] tracking-[0.3em] uppercase text-[var(--color-muted)] font-medium mb-1">
              Restricted Portal
            </span>
            <h1 className="font-editorial text-2xl sm:text-3xl text-[var(--color-text)]">
              OKARA Studio Access
            </h1>
            <p className="text-xs text-[var(--color-muted)] font-light mt-2 leading-relaxed">
              Enter the administrative security key to access catalog management, inventory, and image synchronization.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            {errorMessage && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="admin-password"
                className="block text-[11px] uppercase tracking-[0.2em] font-medium text-[var(--color-text)] mb-2"
              >
                Security Key
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="Enter administrative key"
                  autoFocus
                  required
                  className="w-full px-4 py-3 bg-[var(--color-background)] border border-[var(--color-border)] text-sm text-[var(--color-text)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] subtle-transition pr-11 tracking-wider"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-text)] subtle-transition p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !passwordInput}
              className="w-full py-3.5 bg-[var(--color-primary)] text-[var(--color-secondary)] text-xs uppercase tracking-[0.25em] font-medium hover:bg-[var(--color-primary-hover)] subtle-transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              <KeyRound size={14} /> Unlock Studio
            </button>
          </form>

          {/* Footer Back Link */}
          <div className="mt-8 pt-6 border-t border-[var(--color-border)] flex items-center justify-between text-[11px] text-[var(--color-muted)]">
            <Link
              href="/"
              className="inline-flex items-center gap-1 hover:text-[var(--color-text)] subtle-transition"
            >
              <ArrowLeft size={13} /> Back to Store
            </Link>
            <span className="flex items-center gap-1 text-[10px] tracking-wider uppercase font-light">
              <ShieldCheck size={12} /> Protected Area
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Render children and attach logout trigger
  return (
    <div>
      {/* Admin Session Banner with Logout Action */}
      <div className="bg-neutral-900 text-neutral-300 py-1.5 px-4 sm:px-8 text-[11px] tracking-wider uppercase flex items-center justify-between border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Authenticated Administrator Session</span>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs uppercase tracking-widest text-neutral-400 hover:text-white underline underline-offset-4 subtle-transition font-medium"
        >
          Lock / Log Out
        </button>
      </div>

      {children}
    </div>
  );
}
