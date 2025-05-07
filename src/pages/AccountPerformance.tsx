import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import AccountSummaryCards from '@/components/account-performance/AccountSummaryCards';
import AccountPerformanceComparison from '@/components/account-performance/AccountPerformanceComparison';

interface AccountSummaryData {
  totalRevenue: number;
  averageOrderValue: number;
  totalAccounts: number;
}

interface AccountComparisonData {
  [key: string]: { // Key is the account name (string)
    currentMonthRevenue: number;
    previousMonthRevenue: number;
    revenueChange: number;
  };
}

const AccountPerformance = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [summaryData, setSummaryData] = useState<AccountSummaryData>({
    totalRevenue: 0,
    averageOrderValue: 0,
    totalAccounts: 0,
  });
  const [comparisonData, setComparisonData] = useState<AccountComparisonData>({});

  useEffect(() => {
    // Simulate fetching data from an API
    setTimeout(() => {
      const mockSummaryData: AccountSummaryData = {
        totalRevenue: 567890,
        averageOrderValue: 123,
        totalAccounts: 456,
      };

      const mockComparisonData: AccountComparisonData = {
        "Account A": { currentMonthRevenue: 123456, previousMonthRevenue: 110000, revenueChange: 13456 },
        "Account B": { currentMonthRevenue: 98765, previousMonthRevenue: 105000, revenueChange: -6235 },
        "Account C": { currentMonthRevenue: 54321, previousMonthRevenue: 48000, revenueChange: 6321 },
      };

      setSummaryData(mockSummaryData);
      setComparisonData(mockComparisonData);
      setIsLoading(false);
    }, 1500);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <AppLayout>
      <div className="container px-4 md:px-6 max-w-full">
        <div className="mb-8 pt-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            <span className="bg-gradient-to-r from-finance-red to-finance-red/80 text-transparent bg-clip-text">Account Performance</span>
          </h1>
          <p className="text-white/60 text-sm md:text-base">
            Track account performance metrics over time, analyze trends, and identify growth opportunities.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="metric-box animate-pulse">
                <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
                <div className="h-10 bg-gray-700 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <AccountSummaryCards
              // Pass correct props according to the component's interface
              totalRevenue={summaryData.totalRevenue}
              averageOrderValue={summaryData.averageOrderValue}
              totalAccounts={summaryData.totalAccounts}
              formatCurrency={formatCurrency}
            />

            <AccountPerformanceComparison
              // Pass correct props according to the component's interface
              comparisonData={comparisonData}
              formatCurrency={formatCurrency}
            />
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default AccountPerformance;
