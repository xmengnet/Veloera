'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useI18n } from '@/i18n';
import api from '@/lib/api';
import ProtectedRoute from '@/components/auth/protected-route';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { t } = useI18n();
  
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  
  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || '');
      setEmail(user.email || '');
    }
  }, [user]);
  
  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    setIsProfileLoading(true);
    setProfileMessage({ type: '', text: '' });
    
    try {
      const response = await api.put('/api/user/self', {
        display_name: displayName,
        email: email
      });
      
      if (response.success) {
        setProfileMessage({ type: 'success', text: t('user.profileUpdated') });
        // Refresh user data
        await refreshUser();
      } else {
        setProfileMessage({ type: 'error', text: response.message || t('errors.unknownError') });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setProfileMessage({ type: 'error', text: t('errors.unknownError') });
    } finally {
      setIsProfileLoading(false);
    }
  };
  
  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmNewPassword) {
      setPasswordMessage({ type: 'error', text: t('auth.passwordMismatch') });
      return;
    }
    
    setIsPasswordLoading(true);
    setPasswordMessage({ type: '', text: '' });
    
    try {
      const response = await api.put('/api/user/self', {
        password: newPassword,
        current_password: currentPassword
      });
      
      if (response.success) {
        setPasswordMessage({ type: 'success', text: t('user.passwordChanged') });
        // Clear password fields
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        setPasswordMessage({ type: 'error', text: response.message || t('errors.unknownError') });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordMessage({ type: 'error', text: t('errors.unknownError') });
    } finally {
      setIsPasswordLoading(false);
    }
  };
  
  return (
    <ProtectedRoute>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">{t('user.profile')}</h1>
        
        {/* User Information Card */}
        <div className="bg-card rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">{t('user.profile')}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-muted-foreground">{t('user.username')}</p>
              <p className="font-medium">{user?.username}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('user.displayName')}</p>
              <p className="font-medium">{user?.display_name || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('user.email')}</p>
              <p className="font-medium">{user?.email || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('user.role')}</p>
              <p className="font-medium">{user?.role}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('user.quota')}</p>
              <p className="font-medium">{user?.quota}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('user.usedQuota')}</p>
              <p className="font-medium">{user?.used_quota}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('user.requestCount')}</p>
              <p className="font-medium">{user?.request_count}</p>
            </div>
          </div>
          
          {/* Progress Bar for Quota Usage */}
          {user && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>{t('user.usedQuota')}</span>
                <span>{Math.round((user.used_quota / user.quota) * 100)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5">
                <div 
                  className="bg-primary h-2.5 rounded-full" 
                  style={{ width: `${Math.min((user.used_quota / user.quota) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
        
        {/* Update Profile Form */}
        <div className="bg-card rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">{t('user.updateProfile')}</h2>
          
          {profileMessage.text && (
            <div className={`mb-4 p-3 rounded-md ${
              profileMessage.type === 'success' 
                ? 'bg-green-100 border border-green-400 text-green-700' 
                : 'bg-red-100 border border-red-400 text-red-700'
            }`}>
              {profileMessage.text}
            </div>
          )}
          
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium mb-1">
                {t('user.displayName')}
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="block w-full rounded-md border border-input bg-background px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                {t('user.email')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-md border border-input bg-background px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            
            <div>
              <button
                type="submit"
                disabled={isProfileLoading}
                className="inline-flex justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              >
                {isProfileLoading ? t('common.loading') : t('common.save')}
              </button>
            </div>
          </form>
        </div>
        
        {/* Change Password Form */}
        <div className="bg-card rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">{t('user.changePassword')}</h2>
          
          {passwordMessage.text && (
            <div className={`mb-4 p-3 rounded-md ${
              passwordMessage.type === 'success' 
                ? 'bg-green-100 border border-green-400 text-green-700' 
                : 'bg-red-100 border border-red-400 text-red-700'
            }`}>
              {passwordMessage.text}
            </div>
          )}
          
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium mb-1">
                {t('user.currentPassword')}
              </label>
              <input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="block w-full rounded-md border border-input bg-background px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium mb-1">
                {t('user.newPassword')}
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="block w-full rounded-md border border-input bg-background px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            
            <div>
              <label htmlFor="confirmNewPassword" className="block text-sm font-medium mb-1">
                {t('user.confirmNewPassword')}
              </label>
              <input
                id="confirmNewPassword"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="block w-full rounded-md border border-input bg-background px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            
            <div>
              <button
                type="submit"
                disabled={isPasswordLoading}
                className="inline-flex justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              >
                {isPasswordLoading ? t('common.loading') : t('common.save')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
