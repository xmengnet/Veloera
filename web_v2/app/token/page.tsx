'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useI18n } from '@/i18n';
import { useAuth } from '@/contexts/auth-context';
import api from '@/lib/api';
import ProtectedRoute from '@/components/auth/protected-route';
import { Plus, Edit, Trash2, AlertTriangle } from 'lucide-react';

interface Token {
  id: number;
  name: string;
  key: string;
  status: number;
  created_time: number;
  accessed_time: number;
  expired_time: number;
  remain_quota: number;
  unlimited_quota: boolean;
  model_limits_enabled: boolean;
  model_limits: string;
  allow_ips: string;
  group: string;
}

export default function TokenListPage() {
  const { t } = useI18n();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchTokens = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        const response = await api.get<Token[]>('/api/token');
        
        if (response.success) {
          setTokens(response.data);
        } else {
          setError(response.message || t('errors.unknownError'));
        }
      } catch (err) {
        console.error('Error fetching tokens:', err);
        setError(t('errors.unknownError'));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTokens();
  }, [t]);
  
  const handleDeleteToken = async (id: number) => {
    if (!confirm(t('token.deleteConfirm'))) {
      return;
    }
    
    try {
      const response = await api.delete(`/api/token/${id}`);
      
      if (response.success) {
        // Remove the deleted token from the list
        setTokens(tokens.filter(token => token.id !== id));
        alert(t('token.deleteSuccess'));
      } else {
        alert(response.message || t('errors.unknownError'));
      }
    } catch (err) {
      console.error('Error deleting token:', err);
      alert(t('errors.unknownError'));
    }
  };
  
  const formatDate = (timestamp: number) => {
    if (!timestamp) return '-';
    return new Date(timestamp * 1000).toLocaleString();
  };
  
  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-lg">{t('common.loading')}</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }
  
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">{t('token.title')}</h1>
          <Link
            href="/token/create"
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('token.create')}
          </Link>
        </div>
        
        {/* Warning Banner */}
        <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-700 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm">{t('token.warning')}</p>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}
        
        {tokens.length === 0 ? (
          <div className="bg-card rounded-lg shadow p-6 text-center">
            <p className="text-muted-foreground">{t('token.noTokens')}</p>
            <Link
              href="/token/create"
              className="inline-flex items-center mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('token.create')}
            </Link>
          </div>
        ) : (
          <div className="bg-card rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t('token.name')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t('token.key')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t('token.status')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t('token.createdTime')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t('token.expiredTime')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t('token.remainQuota')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t('common.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {tokens.map((token) => (
                    <tr key={token.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {token.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                        {token.key.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          token.status === 1 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {token.status === 1 ? t('common.active') : t('common.inactive')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {formatDate(token.created_time)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {formatDate(token.expired_time)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {token.unlimited_quota 
                          ? t('token.unlimited') 
                          : token.remain_quota.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right space-x-2">
                        <Link
                          href={`/token/edit/${token.id}`}
                          className="text-primary hover:text-primary/80"
                        >
                          <Edit className="h-4 w-4 inline" />
                        </Link>
                        <button
                          onClick={() => handleDeleteToken(token.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
