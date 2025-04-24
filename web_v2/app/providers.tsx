'use client';

import { ReactNode } from 'react';
import { I18nProvider } from '@/i18n';
import { AuthProvider } from '@/contexts/auth-context';
import MainLayout from '@/components/layout/main-layout';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <I18nProvider>
      <AuthProvider>
        <MainLayout>
          {children}
        </MainLayout>
      </AuthProvider>
    </I18nProvider>
  );
}
