'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/i18n';
import api from '@/lib/api';
import ProtectedRoute from '@/components/auth/protected-route';
import { BarChart, Calendar, Search } from 'lucide-react';

interface QuotaData {
  model: string;
  quota: number;
  tokens: number;
  times: number;
}

interface DistributionData {
  date: string;
  quota: number;
  tokens: number;
  times: number;
}

interface DashboardData {
  quota_data: QuotaData[];
  distribution_data: DistributionData[];
}

export default function DashboardPage() {
  const { t } = useI18n();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Date range filter
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [defaultTime, setDefaultTime] = useState('7d'); // 7 days by default
  
  // Calculate total stats
  const totalQuota = data?.quota_data.reduce((sum, item) => sum + item.quota, 0) || 0;
  const totalTokens = data?.quota_data.reduce((sum, item) => sum + item.tokens, 0) || 0;
  const totalTimes = data?.quota_data.reduce((sum, item) => sum + item.times, 0) || 0;
  
  // Calculate average RPM and TPM
  const days = data?.distribution_data.length || 1;
  const avgRPM = totalTimes / (days * 24 * 60);
  const avgTPM = totalTokens / (days * 24 * 60);
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        // Prepare query parameters
        const params = new URLSearchParams();
        
        if (startDate) {
          const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
          params.append('start_timestamp', startTimestamp.toString());
        }
        
        if (endDate) {
          const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000);
          params.append('end_timestamp', endTimestamp.toString());
        }
        
        if (!startDate && !endDate && defaultTime) {
          params.append('default_time', defaultTime);
        }
        
        // Fetch dashboard data
        const response = await api.get<DashboardData>(`/api/data/self?${params.toString()}`);
        
        if (response.success) {
          setData(response.data);
        } else {
          setError(response.message || t('errors.unknownError'));
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(t('errors.unknownError'));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [t, startDate, endDate, defaultTime]);
  
  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // The useEffect will trigger a data fetch
  };
  
  const handleResetFilter = () => {
    setStartDate('');
    setEndDate('');
    setDefaultTime('7d');
  };
  
  const handleDefaultTimeChange = (value: string) => {
    setDefaultTime(value);
    setStartDate('');
    setEndDate('');
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
        <h1 className="text-3xl font-bold">{t('dashboard.title')}</h1>
        
        {/* Filter Form */}
        <div className="bg-card rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">{t('dashboard.filter.dateRange')}</h2>
          
          <form onSubmit={handleFilterSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium mb-1">
                  {t('dashboard.filter.startDate')}
                </label>
                <div className="relative">
                  <input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="block w-full rounded-md border border-input bg-background px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground" />
                </div>
              </div>
              
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium mb-1">
                  {t('dashboard.filter.endDate')}
                </label>
                <div className="relative">
                  <input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="block w-full rounded-md border border-input bg-background px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground" />
                </div>
              </div>
              
              <div>
                <label htmlFor="defaultTime" className="block text-sm font-medium mb-1">
                  {t('dashboard.filter.defaultTime')}
                </label>
                <select
                  id="defaultTime"
                  value={defaultTime}
                  onChange={(e) => handleDefaultTimeChange(e.target.value)}
                  disabled={!!(startDate || endDate)}
                  className="block w-full rounded-md border border-input bg-background px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                >
                  <option value="1d">1 {t('common.day')}</option>
                  <option value="7d">7 {t('common.days')}</option>
                  <option value="30d">30 {t('common.days')}</option>
                  <option value="90d">90 {t('common.days')}</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={handleResetFilter}
                className="px-4 py-2 border border-input rounded-md text-sm font-medium hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {t('dashboard.filter.reset')}
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <Search className="mr-2 h-4 w-4" />
                {t('dashboard.filter.apply')}
              </button>
            </div>
          </form>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-card rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-2">{t('dashboard.statisticalQuota')}</h3>
            <p className="text-3xl font-bold">{totalQuota.toLocaleString()}</p>
          </div>
          
          <div className="bg-card rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-2">{t('dashboard.statisticalTokens')}</h3>
            <p className="text-3xl font-bold">{totalTokens.toLocaleString()}</p>
          </div>
          
          <div className="bg-card rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-2">{t('dashboard.statisticalCount')}</h3>
            <p className="text-3xl font-bold">{totalTimes.toLocaleString()}</p>
          </div>
          
          <div className="bg-card rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-2">{t('dashboard.averageRPM')}</h3>
            <p className="text-3xl font-bold">{avgRPM.toFixed(2)}</p>
          </div>
        </div>
        
        {/* Model Usage Table */}
        {data && data.quota_data.length > 0 && (
          <div className="bg-card rounded-lg shadow overflow-hidden">
            <h2 className="text-xl font-semibold p-6 pb-3">{t('dashboard.consumptionDistribution')}</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t('log.model')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t('log.quota')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t('log.tokens')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t('common.count')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {data.quota_data.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {item.model}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {item.quota.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {item.tokens.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {item.times.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Daily Distribution Table */}
        {data && data.distribution_data.length > 0 && (
          <div className="bg-card rounded-lg shadow overflow-hidden">
            <h2 className="text-xl font-semibold p-6 pb-3">{t('dashboard.callCountDistribution')}</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t('common.date')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t('log.quota')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t('log.tokens')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t('common.count')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {data.distribution_data.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {item.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {item.quota.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {item.tokens.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {item.times.toLocaleString()}
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
