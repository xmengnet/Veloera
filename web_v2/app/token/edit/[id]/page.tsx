'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useI18n } from '@/i18n';
import api from '@/lib/api';
import ProtectedRoute from '@/components/auth/protected-route';
import { ArrowLeft, Calendar, Check } from 'lucide-react';

interface TokenData {
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

interface Model {
  id: string;
  name: string;
}

interface Group {
  id: string;
  name: string;
}

interface PageProps {
  params: {
    id: string;
  };
}

export default function EditTokenPage({ params }: PageProps) {
  const { t } = useI18n();
  const router = useRouter();
  const tokenId = parseInt(params.id);
  
  const [name, setName] = useState('');
  const [remainQuota, setRemainQuota] = useState(0);
  const [unlimitedQuota, setUnlimitedQuota] = useState(false);
  const [expiredTime, setExpiredTime] = useState('');
  const [modelLimitsEnabled, setModelLimitsEnabled] = useState(false);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [allowIps, setAllowIps] = useState('');
  const [group, setGroup] = useState('');
  
  const [availableModels, setAvailableModels] = useState<Model[]>([]);
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Fetch token data and available models/groups
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        // Fetch token data
        const tokenResponse = await api.get<TokenData>(`/api/token/${tokenId}`);
        
        if (tokenResponse.success && tokenResponse.data) {
          const token = tokenResponse.data;
          
          setName(token.name);
          setRemainQuota(token.remain_quota);
          setUnlimitedQuota(token.unlimited_quota);
          
          // Convert timestamp to date string
          if (token.expired_time) {
            const date = new Date(token.expired_time * 1000);
            setExpiredTime(date.toISOString().split('T')[0]);
          }
          
          setModelLimitsEnabled(token.model_limits_enabled);
          setSelectedModels(token.model_limits ? token.model_limits.split(',') : []);
          setAllowIps(token.allow_ips || '');
          setGroup(token.group || '');
        } else {
          setError(tokenResponse.message || t('errors.unknownError'));
        }
        
        // Fetch available models
        const modelsResponse = await api.get<string[]>('/api/models');
        if (modelsResponse.success && modelsResponse.data) {
          setAvailableModels(
            modelsResponse.data.map(model => ({ id: model, name: model }))
          );
        }
        
        // Fetch available groups
        const groupsResponse = await api.get<string[]>('/api/user/self/groups');
        if (groupsResponse.success && groupsResponse.data) {
          setAvailableGroups(
            groupsResponse.data.map(group => ({ id: group, name: group }))
          );
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(t('errors.unknownError'));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [tokenId, t]);
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!name) {
      setError(t('errors.missingParameters'));
      return;
    }
    
    setIsSaving(true);
    setError('');
    setSuccess('');
    
    try {
      const expiredTimestamp = Math.floor(new Date(expiredTime).getTime() / 1000);
      
      const tokenData = {
        id: tokenId,
        name,
        remain_quota: unlimitedQuota ? 0 : remainQuota,
        unlimited_quota: unlimitedQuota,
        expired_time: expiredTimestamp,
        model_limits_enabled: modelLimitsEnabled,
        model_limits: modelLimitsEnabled ? selectedModels.join(',') : '',
        allow_ips: allowIps,
        group
      };
      
      const response = await api.put('/api/token', tokenData);
      
      if (response.success) {
        setSuccess(t('token.updateSuccess'));
        
        // Redirect to token list after a short delay
        setTimeout(() => {
          router.push('/token');
        }, 1500);
      } else {
        setError(response.message || t('errors.unknownError'));
      }
    } catch (err) {
      console.error('Error updating token:', err);
      setError(t('errors.unknownError'));
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleModelToggle = (modelId: string) => {
    setSelectedModels(prev => 
      prev.includes(modelId)
        ? prev.filter(id => id !== modelId)
        : [...prev, modelId]
    );
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
        <div className="flex items-center">
          <Link
            href="/token"
            className="mr-4 p-2 rounded-full hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-3xl font-bold">{t('token.edit')}</h1>
        </div>
        
        <div className="bg-card rounded-lg shadow p-6">
          {error && (
            <div className="mb-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-6 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md">
              {success}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                {t('token.name')} *
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full rounded-md border border-input bg-background px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            
            <div className="flex items-center mb-4">
              <input
                id="unlimitedQuota"
                type="checkbox"
                checked={unlimitedQuota}
                onChange={(e) => setUnlimitedQuota(e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-primary border-input rounded"
              />
              <label htmlFor="unlimitedQuota" className="ml-2 block text-sm">
                {t('token.unlimitedQuota')}
              </label>
            </div>
            
            {!unlimitedQuota && (
              <div>
                <label htmlFor="remainQuota" className="block text-sm font-medium mb-1">
                  {t('token.remainQuota')}
                </label>
                <input
                  id="remainQuota"
                  type="number"
                  min="0"
                  value={remainQuota}
                  onChange={(e) => setRemainQuota(parseInt(e.target.value))}
                  className="block w-full rounded-md border border-input bg-background px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}
            
            <div>
              <label htmlFor="expiredTime" className="block text-sm font-medium mb-1">
                {t('token.expiredTime')}
              </label>
              <div className="relative">
                <input
                  id="expiredTime"
                  type="date"
                  value={expiredTime}
                  onChange={(e) => setExpiredTime(e.target.value)}
                  className="block w-full rounded-md border border-input bg-background px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground" />
              </div>
            </div>
            
            <div className="flex items-center mb-4">
              <input
                id="modelLimitsEnabled"
                type="checkbox"
                checked={modelLimitsEnabled}
                onChange={(e) => setModelLimitsEnabled(e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-primary border-input rounded"
              />
              <label htmlFor="modelLimitsEnabled" className="ml-2 block text-sm">
                {t('token.modelLimitsEnabled')}
              </label>
            </div>
            
            {modelLimitsEnabled && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('token.modelLimits')}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {availableModels.map((model) => (
                    <div key={model.id} className="flex items-center">
                      <input
                        id={`model-${model.id}`}
                        type="checkbox"
                        checked={selectedModels.includes(model.id)}
                        onChange={() => handleModelToggle(model.id)}
                        className="h-4 w-4 text-primary focus:ring-primary border-input rounded"
                      />
                      <label htmlFor={`model-${model.id}`} className="ml-2 block text-sm">
                        {model.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div>
              <label htmlFor="allowIps" className="block text-sm font-medium mb-1">
                {t('token.allowIps')}
              </label>
              <input
                id="allowIps"
                type="text"
                value={allowIps}
                onChange={(e) => setAllowIps(e.target.value)}
                placeholder="192.168.1.1,10.0.0.1"
                className="block w-full rounded-md border border-input bg-background px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="mt-1 text-sm text-muted-foreground">
                {t('token.allowIpsHint')}
              </p>
            </div>
            
            <div>
              <label htmlFor="group" className="block text-sm font-medium mb-1">
                {t('token.group')}
              </label>
              <select
                id="group"
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                className="block w-full rounded-md border border-input bg-background px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">{t('common.none')}</option>
                {availableGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex justify-end space-x-4">
              <Link
                href="/token"
                className="px-4 py-2 border border-input rounded-md text-sm font-medium hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {t('common.cancel')}
              </Link>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              >
                {isSaving ? (
                  <span className="flex items-center">
                    <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-primary-foreground rounded-full"></span>
                    {t('common.loading')}
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Check className="mr-2 h-4 w-4" />
                    {t('common.save')}
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
