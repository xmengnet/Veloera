'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useI18n } from '@/i18n';
import api from '@/lib/api';
import { Check, CreditCard } from 'lucide-react';

interface PricingPlan {
  id: number;
  name: string;
  description: string;
  price: number;
  quota: number;
  features: string[];
}

export default function PricingPage() {
  const { t } = useI18n();
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchPlans = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        const response = await api.get<PricingPlan[]>('/api/pricing/plans');
        
        if (response.success) {
          setPlans(response.data);
        } else {
          setError(response.message || t('errors.unknownError'));
        }
      } catch (err) {
        console.error('Error fetching pricing plans:', err);
        setError(t('errors.unknownError'));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPlans();
  }, [t]);
  
  // If API fails or no plans are available, show some default plans
  const defaultPlans: PricingPlan[] = [
    {
      id: 1,
      name: 'Basic',
      description: 'For personal use',
      price: 9.99,
      quota: 100000,
      features: [
        '100K tokens',
        'Access to basic models',
        'Email support'
      ]
    },
    {
      id: 2,
      name: 'Pro',
      description: 'For professional use',
      price: 29.99,
      quota: 500000,
      features: [
        '500K tokens',
        'Access to all models',
        'Priority support',
        'Advanced analytics'
      ]
    },
    {
      id: 3,
      name: 'Enterprise',
      description: 'For teams and businesses',
      price: 99.99,
      quota: 2000000,
      features: [
        '2M tokens',
        'Access to all models',
        'Dedicated support',
        'Advanced analytics',
        'Custom model fine-tuning',
        'Team management'
      ]
    }
  ];
  
  const displayPlans = plans.length > 0 ? plans : defaultPlans;
  
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
      <h1 className="text-3xl font-bold">{t('pricing.title')}</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayPlans.map((plan) => (
          <div key={plan.id} className="bg-card rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-border">
              <h2 className="text-2xl font-bold">{plan.name}</h2>
              <p className="text-muted-foreground mt-1">{plan.description}</p>
              <p className="text-3xl font-bold mt-4">
                ${plan.price.toFixed(2)}
                <span className="text-sm text-muted-foreground font-normal">
                  /month
                </span>
              </p>
            </div>
            
            <div className="p-6">
              <p className="font-medium mb-4">
                {t('pricing.quota')}: {plan.quota.toLocaleString()} tokens
              </p>
              
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <div className="mt-6">
                <Link
                  href="/pricing/topup"
                  className="inline-flex items-center justify-center w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  {t('pricing.purchase')}
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-card rounded-lg shadow p-6 mt-8">
        <h2 className="text-xl font-semibold mb-4">{t('pricing.redemption.title')}</h2>
        <p className="mb-4">{t('pricing.redemption.description')}</p>
        <Link
          href="/pricing/redemption"
          className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {t('pricing.redemption.redeem')}
        </Link>
      </div>
    </div>
  );
}
