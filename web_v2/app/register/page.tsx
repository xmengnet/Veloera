'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { useI18n } from '@/i18n';
import api from '@/lib/api';

export default function RegisterPage() {
  const { register, isAuthenticated } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEmailVerificationEnabled, setIsEmailVerificationEnabled] = useState(false);
  
  // Check if email verification is enabled
  useEffect(() => {
    const checkEmailVerification = async () => {
      try {
        const response = await api.get('/api/status');
        if (response.success && response.data) {
          setIsEmailVerificationEnabled(response.data.email_verification);
        }
      } catch (err) {
        console.error('Failed to check email verification status:', err);
      }
    };
    
    checkEmailVerification();
  }, []);
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);
  
  const sendVerificationCode = async () => {
    if (!email) {
      setError(t('errors.missingParameters'));
      return;
    }
    
    try {
      const response = await api.post('/api/verification', { email });
      
      if (response.success) {
        // Show success message
        alert(t('auth.verificationCodeSent'));
      } else {
        setError(response.message || t('errors.unknownError'));
      }
    } catch (err) {
      setError(t('errors.unknownError'));
      console.error('Send verification code error:', err);
    }
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!username || !password) {
      setError(t('errors.missingParameters'));
      return;
    }
    
    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }
    
    if (isEmailVerificationEnabled && (!email || !verificationCode)) {
      setError(t('errors.missingParameters'));
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const success = await register(
        username, 
        password, 
        isEmailVerificationEnabled ? email : undefined,
        isEmailVerificationEnabled ? verificationCode : undefined
      );
      
      if (success) {
        // Redirect to login page
        router.push('/login');
      } else {
        setError(t('errors.unknownError'));
      }
    } catch (err) {
      setError(t('errors.unknownError'));
      console.error('Registration error:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight">
          {t('auth.register')}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card px-4 py-8 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive text-destructive rounded-md">
              {error}
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium">
                {t('auth.username')}
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full rounded-md border border-input bg-background px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium">
                {t('auth.password')}
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-md border border-input bg-background px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium">
                {t('auth.confirmPassword')}
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full rounded-md border border-input bg-background px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {isEmailVerificationEnabled && (
              <>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium">
                    {t('auth.email')}
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full rounded-md border border-input bg-background px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="verificationCode" className="block text-sm font-medium">
                      {t('auth.verificationCode')}
                    </label>
                    <button
                      type="button"
                      onClick={sendVerificationCode}
                      className="text-sm text-primary hover:text-primary/90"
                    >
                      {t('auth.sendVerificationCode')}
                    </button>
                  </div>
                  <div className="mt-1">
                    <input
                      id="verificationCode"
                      name="verificationCode"
                      type="text"
                      required
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="block w-full rounded-md border border-input bg-background px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              >
                {isLoading ? t('common.loading') : t('auth.register')}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-card px-2 text-muted-foreground">
                  {t('common.or')}
                </span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="text-sm text-primary hover:text-primary/90"
              >
                {t('auth.login')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
