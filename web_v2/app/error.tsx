'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useI18n } from '@/i18n';
import { Home, RefreshCw } from 'lucide-react';

interface ErrorProps {
  error: Error;
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  const { t } = useI18n();
  
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <h1 className="text-6xl font-bold text-destructive">
        {t('errors.serverError')}
      </h1>
      <p className="text-xl mt-4 max-w-md">
        {t('errors.serverErrorDescription') || error.message}
      </p>
      <div className="flex flex-col sm:flex-row gap-4 mt-8">
        <button
          onClick={reset}
          className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          {t('common.tryAgain')}
        </button>
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 border border-input rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <Home className="mr-2 h-4 w-4" />
          {t('common.backToHome')}
        </Link>
      </div>
    </div>
  );
}
