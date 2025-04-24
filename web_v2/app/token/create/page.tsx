'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useI18n } from '@/i18n';
import api from '@/lib/api';
import ProtectedRoute from '@/components/auth/protected-route';
import { ArrowLeft, Calendar, Check } from 'lucide-react';

interface Model {
  id: string;
  name: string;
}

interface Group {
  id: string;
  name: string;
}

export default function CreateTokenPage() {
  const { t } = useI18n();
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [remainQuota, setRemainQuota] = useState(10000);
  const [unlimitedQuota, setUnlimitedQuota] = useState(false);
  const [expiredTime, setExpiredTime] = useState('');
  const [modelLimitsEnabled, setModelLimitsEnabled] = useState(false);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [allowIps, setAllowIps] = useState('');
  const [group, setGroup] = useState('');
  const [tokenCount, setTokenCount] = useState(1);
  
  const [availableModels, setAvailableModels] = useState<Model[]>([]);
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Calculate default expiration date (30 days from now)
  useEffect(() => {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    setExpiredTime(thirtyDaysFromNow.toISOString().split('T')[0]);
  }, []);
  
  // Fetch available models and groups
  useEffect(() => {
    const fetchData = async () => {
      try {
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
      }
    };
    
    fetchData();
  }, [t]);
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!name) {
      setError(t('errors.missingParameters'));
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const expiredTimestamp = Math.floor(new Date(expiredTime).getTime() / 1000);
      
      const tokenData = {
        name,
        remain_quota: unlimitedQuota ? 0 : remainQuota,
        unlimited_quota: unlimitedQuota,
        expired_time: expiredTimestamp,
        model_limits_enabled: modelLimitsEnabled,
        model_limits: modelLimitsEnabled ? selectedModels.join(',') : '',
        allow_ips: allowIps,
        group,
        count: tokenCount
      };
      
      const response = await api.post('/api/token', tokenData);
      
      if (response.success) {
        setSuccess(t('token.createSuccess'));
        
        // Redirect to token list after a short delay
        setTimeout(() => {
          router.push('/token');
        }, 1500);
      } else {
        setError(response.message || t('errors.unknownError'));
      }
    } catch (err) {
      console.error('Error creating token:', err);
      setError(t('errors.unknownError'));
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleModelToggle = (modelId: string) => {
    setSelectedModels(prev => 
      prev.includes(modelId)
        ? prev.filter(id => id !== modelId)
        : [...prev, modelId]
    );
  };
  
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
          <h1 className="text-3xl font-bold">{t('token.create')}</h1>
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
            
            <div>
              <label htmlFor="tokenCount" className="block text-sm font-medium mb-1">
                {t('token.tokenCount')}
              </label>
              <input
                id="tokenCount"
                type="number"
                min="1"
                max="10"
                value={tokenCount}
                onChange={(e) => setTokenCount(parseInt(e.target.value))}
                className="block w-full rounded-md border border-input bg-background px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="mt-1 text-sm text-muted-foreground">
                {t('token.tokenCountHint')}
              </p>
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
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              >
                {isLoading ? (
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
