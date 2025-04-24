'use client';

import Link from 'next/link';
import { useI18n } from '@/i18n';
import { Home } from 'lucide-react';

export default function NotFound() {
  const { t } = useI18n();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <h1 className="text-9xl font-bold text-primary">404</h1>
      <h2 className="text-3xl font-semibold mt-4">{t('errors.notFound')}</h2>
      <p className="text-muted-foreground mt-2 max-w-md">
        {t('errors.notFoundDescription')}
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <Home className="mr-2 h-4 w-4" />
        {t('common.backToHome')}
      </Link>
    </div>
  );
}
