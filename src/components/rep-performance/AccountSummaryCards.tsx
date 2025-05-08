import React from 'react';
import { formatCurrency, formatNumber, formatPercent } from '@/utils/rep-performance-utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import MetricCard from '@/components/MetricCard';
import { Users, Award, Star, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface AccountSummaryCardsProps {
  currentMonthData: any[];
  previousMonthData: any[];
  isLoading: boolean;
  selectedUser?: string;
  accountsTrendData?: {
    increasing: number;
    decreasing: number;
  };
}

const AccountSummaryCards: React.FC<AccountSummaryCardsProps> = ({ 
  currentMonthData, 
  previousMonthData, 
  isLoading,
  selectedUser,
  accountsTrendData = { increasing: 0, decreasing: 0 }
}) => {
  // Calculate active accounts (accounts with spend > 0)
  const activeAccounts = currentMonthData.filter(item => {
    const spend = typeof item.Spend === 'number' ? item.Spend : 
                 typeof item.spend === 'number' ? item.spend : 0;
    return spend > 0;
  }).length;
  
  const previousActiveAccounts = previousMonthData.filter(item => {
    const spend = typeof item.Spend === 'number' ? item.Spend : 
                 typeof item.spend === 'number' ? item.spend : 0;
    return spend > 0;
  }).length;
  
  const accountsChange = activeAccounts - previousActiveAccounts;
  const accountsChangePercent = previousActiveAccounts > 0 
    ? ((accountsChange / previousActiveAccounts) * 100)
    : 0;
  
  // Find top customer (highest profit account)
  let topCustomer = { name: 'No data', profit: 0 };
  
  // Find top margin customer (account with highest margin)
  let topMarginCustomer = { name: 'No data', margin: 0, spend: 0 };
  
  // Find most improved account
  let mostImprovedAccount = { name: 'No data', improvement: 0, percentImprovement: 0 };
  
  if (currentMonthData.length > 0 && previousMonthData.length > 0) {
    // Process for top customer (highest profit)
    currentMonthData.forEach(item => {
      const accountName = item["Account Name"] || item.account_name || '';
      const profit = typeof item.Profit === 'number' ? item.Profit : 
                   typeof item.profit === 'number' ? item.profit : 0;
      
      if (profit > topCustomer.profit) {
        topCustomer = { name: accountName, profit };
      }
    });
    
    // Process for top margin customer
    currentMonthData.forEach(item => {
      const accountName = item["Account Name"] || item.account_name || '';
      const spend = typeof item.Spend === 'number' ? item.Spend : 
                  typeof item.spend === 'number' ? item.spend : 0;
      const profit = typeof item.Profit === 'number' ? item.Profit : 
                   typeof item.profit === 'number' ? item.profit : 0;
      
      // Only consider accounts with significant spend to avoid division by zero issues
      if (spend > 100) {
        const margin = (profit / spend) * 100;
        if (margin > topMarginCustomer.margin) {
          topMarginCustomer = { name: accountName, margin, spend };
        }
      }
    });
    
    // Process for most improved account
    // Create maps to easily look up accounts by reference
    const currentAccountMap = new Map();
    const previousAccountMap = new Map();
    
    currentMonthData.forEach(item => {
      const accountRef = item["Account Ref"] || item.account_ref || '';
      const accountName = item["Account Name"] || item.account_name || '';
      const profit = typeof item.Profit === 'number' ? item.Profit : 
                   typeof item.profit === 'number' ? item.profit : 0;
      
      if (accountRef) {
        currentAccountMap.set(accountRef, { name: accountName, profit });
      }
    });
    
    previousMonthData.forEach(item => {
      const accountRef = item["Account Ref"] || item.account_ref || '';
      const accountName = item["Account Name"] || item.account_name || '';
      const profit = typeof item.Profit === 'number' ? item.Profit : 
                   typeof item.profit === 'number' ? item.profit : 0;
      
      if (accountRef) {
        previousAccountMap.set(accountRef, { name: accountName, profit });
      }
    });
    
    // Find accounts with the highest improvement
    let maxPercentImprovement = 0;
    
    // Check each current account to see if it exists in the previous data
    currentAccountMap.forEach((currentData, accountRef) => {
      const previousData = previousAccountMap.get(accountRef);
      
      // Only consider accounts that exist in both periods and had some profit in previous month
      if (previousData && previousData.profit > 0) {
        const improvement = currentData.profit - previousData.profit;
        const percentImprovement = (improvement / previousData.profit) * 100;
        
        // We'll prioritize percentage improvement as our metric
        if (percentImprovement > maxPercentImprovement) {
          maxPercentImprovement = percentImprovement;
          mostImprovedAccount = { 
            name: currentData.name, 
            improvement,
            percentImprovement
          };
        }
      }
    });
  }

  // Helper function to determine prefix for card titles
  const getTitlePrefix = () => {
    if (!selectedUser) return '';
    
    // If it's "My Data", use "My" instead of "My Data's"
    if (selectedUser === 'My Data') return 'My';
    
    // Otherwise extract the first name and add apostrophe
    const firstName = selectedUser.split(' ')[0];
    return `${firstName}'s`;
  };

  // Get the appropriate prefix for titles
  const titlePrefix = getTitlePrefix();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 md:p-6">
      {/* Active Accounts Card */}
      <MetricCard
        title={`${titlePrefix ? `${titlePrefix} ACTIVE ACCOUNTS` : 'ACTIVE ACCOUNTS'}`}
        value={formatNumber(activeAccounts)}
        change={
          accountsChange !== 0 
            ? { 
                value: `${Math.abs(accountsChangePercent).toFixed(1)}%`, 
                type: accountsChange > 0 ? 'increase' : 'decrease' 
              }
            : undefined
        }
        subtitle={`vs ${previousActiveAccounts} last month`}
        icon={<Users />}
        isLoading={isLoading}
        iconPosition="right"
      />
      
      {/* Top Customer Card */}
      <MetricCard
        title={`${titlePrefix ? `${titlePrefix} TOP CUSTOMER` : 'TOP CUSTOMER (HIGHEST PROFIT)'}`}
        value={topCustomer.name}
        subtitle={`Profit: ${formatCurrency(topCustomer.profit)}`}
        icon={<Award />}
        isLoading={isLoading}
        iconPosition="right"
      />

      {/* Top Margin Customer Card */}
      <MetricCard
        title="TOP MARGIN CUSTOMER"
        value={topMarginCustomer.name}
        subtitle={
          topMarginCustomer.margin > 0 
            ? `${topMarginCustomer.margin.toFixed(1)}% on ${formatCurrency(topMarginCustomer.spend)}` 
            : 'No margin data'
        }
        icon={<Star />}
        isLoading={isLoading}
        iconPosition="right"
      />

      {/* Most Improved Account Card */}
      <MetricCard
        title="MOST IMPROVED ACCOUNT"
        value={mostImprovedAccount.name}
        subtitle={
          mostImprovedAccount.percentImprovement > 0 
            ? `+${mostImprovedAccount.percentImprovement.toFixed(1)}% (${formatCurrency(mostImprovedAccount.improvement)})` 
            : 'No improvement data'
        }
        icon={<TrendingUp />}
        isLoading={isLoading}
        iconPosition="right"
      />
      
      {/* Increasing Spend Accounts */}
      <MetricCard
        title="INCREASING SPEND ACCOUNTS"
        value={formatNumber(accountsTrendData.increasing)}
        subtitle="Accounts with higher spend vs. last month"
        icon={<ArrowUpRight />}
        iconClassName="text-green-500"
        valueClassName="text-green-500"
        isLoading={isLoading}
        iconPosition="right"
      />
      
      {/* Decreasing Spend Accounts */}
      <MetricCard
        title="DECREASING SPEND ACCOUNTS"
        value={formatNumber(accountsTrendData.decreasing)}
        subtitle="Accounts with lower spend vs. last month"
        icon={<ArrowDownRight />}
        iconClassName="text-[#ea384c]"
        valueClassName="text-[#ea384c]"
        isLoading={isLoading}
        iconPosition="right"
      />
    </div>
  );
};

export default AccountSummaryCards;
