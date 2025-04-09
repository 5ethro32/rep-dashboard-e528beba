
import React from 'react';
import MetricCard from '@/components/MetricCard';
import { formatCurrency, formatNumber } from '@/utils/rep-performance-utils';

interface AccountSummaryCardsProps {
  currentMonthData: any[];
  previousMonthData: any[];
  isLoading: boolean;
}

const AccountSummaryCards: React.FC<AccountSummaryCardsProps> = ({ 
  currentMonthData, 
  previousMonthData, 
  isLoading 
}) => {
  // Calculate active accounts (accounts with spend > 0)
  const activeAccounts = currentMonthData.filter(item => {
    const spend = typeof item.Spend === 'number' ? item.Spend : 
                 (typeof item.spend === 'number' ? item.spend : 0);
    return spend > 0;
  }).length;
  
  const previousActiveAccounts = previousMonthData.filter(item => {
    const spend = typeof item.Spend === 'number' ? item.Spend : 
                 (typeof item.spend === 'number' ? item.spend : 0);
    return spend > 0;
  }).length;
  
  const accountsChange = activeAccounts - previousActiveAccounts;
  const accountsChangePercent = previousActiveAccounts > 0 
    ? ((accountsChange / previousActiveAccounts) * 100).toFixed(1) + '%'
    : 'N/A';
  
  // Find top rep by profit
  let topRep = { name: 'No data', profit: 0 };
  
  if (currentMonthData.length > 0) {
    // Group by rep and sum profits
    const repProfits = new Map();
    
    currentMonthData.forEach(item => {
      const repName = item.Rep || item.rep_name || '';
      const profit = typeof item.Profit === 'number' ? item.Profit : 
                    (typeof item.profit === 'number' ? item.profit : 0);
      
      if (repName) {
        const currentProfit = repProfits.get(repName) || 0;
        repProfits.set(repName, currentProfit + profit);
      }
    });
    
    // Find rep with highest profit
    let maxProfit = 0;
    repProfits.forEach((profit, rep) => {
      if (profit > maxProfit) {
        maxProfit = profit;
        topRep = { name: rep, profit: maxProfit };
      }
    });
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <MetricCard
        title="Active Accounts"
        value={formatNumber(activeAccounts)}
        change={{
          value: accountsChangePercent,
          type: accountsChange > 0 ? 'increase' : accountsChange < 0 ? 'decrease' : 'neutral'
        }}
        subtitle={`vs ${previousActiveAccounts} last month`}
        isLoading={isLoading}
        className="h-full"
      />
      
      <MetricCard
        title="Top Rep (by Profit)"
        value={topRep.name}
        subtitle={`Total profit: ${formatCurrency(topRep.profit)}`}
        isLoading={isLoading}
        className="h-full"
        valueClassName="text-xl md:text-2xl"
      />
    </div>
  );
};

export default AccountSummaryCards;
