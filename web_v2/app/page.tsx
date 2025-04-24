'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import api from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { CheckCircle, XCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface SystemStatus {
  system_name: string;
  version: string;
  start_time: number;
  email_verification: boolean;
  github_oauth: boolean;
  oidc: boolean;
  wechat_login: boolean;
  turnstile_check: boolean;
  telegram_oauth: boolean;
  linuxdo_oauth: boolean;
}

export default function Home() {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [notice, setNotice] = useState<string>('');
  const [homeContent, setHomeContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch system status
        const statusResponse = await api.get<SystemStatus>('/api/status');
        if (statusResponse.success) {
          setStatus(statusResponse.data);
        }

        // Fetch system notice
        const noticeResponse = await api.get<string>('/api/notice');
        if (noticeResponse.success) {
          setNotice(noticeResponse.data);
        }

        // Fetch home page content
        const homeContentResponse = await api.get<string>('/api/home_page_content');
        if (homeContentResponse.success) {
          setHomeContent(homeContentResponse.data);
        }
      } catch (error) {
        console.error('Error fetching home page data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">{t('common.home')}</h1>

      {/* System Status Card */}
      {status && (
        <div className="bg-card rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">{t('system.status.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{t('system.status.systemName')}</p>
              <p className="font-medium">{status.system_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('system.status.version')}</p>
              <p className="font-medium">{status.version}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('system.status.startTime')}</p>
              <p className="font-medium">{new Date(status.start_time * 1000).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Authentication Methods Card */}
      {status && (
        <div className="bg-card rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">{t('auth.methods')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <span className="mr-2">
                {status.email_verification ? (
                  <CheckCircle className="text-green-500" size={20} />
                ) : (
                  <XCircle className="text-red-500" size={20} />
                )}
              </span>
              <span>{t('system.status.emailVerification')}</span>
            </div>
            <div className="flex items-center">
              <span className="mr-2">
                {status.github_oauth ? (
                  <CheckCircle className="text-green-500" size={20} />
                ) : (
                  <XCircle className="text-red-500" size={20} />
                )}
              </span>
              <span>{t('system.status.githubOauth')}</span>
            </div>
            <div className="flex items-center">
              <span className="mr-2">
                {status.oidc ? (
                  <CheckCircle className="text-green-500" size={20} />
                ) : (
                  <XCircle className="text-red-500" size={20} />
                )}
              </span>
              <span>{t('system.status.oidc')}</span>
            </div>
            <div className="flex items-center">
              <span className="mr-2">
                {status.wechat_login ? (
                  <CheckCircle className="text-green-500" size={20} />
                ) : (
                  <XCircle className="text-red-500" size={20} />
                )}
              </span>
              <span>{t('system.status.wechatLogin')}</span>
            </div>
            <div className="flex items-center">
              <span className="mr-2">
                {status.turnstile_check ? (
                  <CheckCircle className="text-green-500" size={20} />
                ) : (
                  <XCircle className="text-red-500" size={20} />
                )}
              </span>
              <span>{t('system.status.turnstileCheck')}</span>
            </div>
            <div className="flex items-center">
              <span className="mr-2">
                {status.telegram_oauth ? (
                  <CheckCircle className="text-green-500" size={20} />
                ) : (
                  <XCircle className="text-red-500" size={20} />
                )}
              </span>
              <span>{t('system.status.telegramOauth')}</span>
            </div>
            <div className="flex items-center">
              <span className="mr-2">
                {status.linuxdo_oauth ? (
                  <CheckCircle className="text-green-500" size={20} />
                ) : (
                  <XCircle className="text-red-500" size={20} />
                )}
              </span>
              <span>{t('system.status.linuxdoOauth')}</span>
            </div>
          </div>
        </div>
      )}

      {/* System Notice */}
      {notice && (
        <div className="bg-card rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">{t('system.notice')}</h2>
          <div className="prose dark:prose-invert max-w-none">
            <ReactMarkdown>{notice}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Custom Home Content */}
      {homeContent && (
        <div className="bg-card rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">{t('system.homePageContent')}</h2>
          <div className="prose dark:prose-invert max-w-none">
            {homeContent.startsWith('http') ? (
              <iframe
                src={homeContent}
                className="w-full h-[500px] border-0"
                title="Home Content"
              />
            ) : (
              <ReactMarkdown>{homeContent}</ReactMarkdown>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
