'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useI18n } from '@/i18n';

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
}

export default function ProtectedRoute({ 
  children, 
  adminOnly = false 
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  
  useEffect(() => {
    // Wait until auth state is loaded
    if (!isLoading) {
      // If not authenticated, redirect to login
      if (!isAuthenticated) {
        const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
        router.push(`/login?next=${encodeURIComponent(currentPath)}`);
      }
      // If admin-only route and user is not admin
      else if (adminOnly && user?.role !== 100) {
        router.push('/');
      }
    }
  }, [isLoading, isAuthenticated, user, adminOnly, router]);
  
  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">{t('common.loading')}</p>
        </div>
      </div>
    );
  }
  
  // If not authenticated or not admin (for admin-only routes), don't render children
  if (!isAuthenticated || (adminOnly && user?.role !== 100)) {
    return null;
  }
  
  // Render children if authenticated and has proper permissions
  return <>{children}</>;
}
