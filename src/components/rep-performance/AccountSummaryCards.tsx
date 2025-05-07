import React from 'react';
import { formatCurrency, formatNumber, formatPercent } from '@/utils/rep-performance-utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
    // Check both upper and lowercase spend fields to handle different data formats
    const spend = typeof item.Spend === 'number' ? item.Spend : 
                 typeof item.spend === 'number' ? item.spend : 0;
    return spend > 0;
  }).length;
  
  const previousActiveAccounts = previousMonthData.filter(item => {
    // Check both upper and lowercase spend fields to handle different data formats
    const spend = typeof item.Spend === 'number' ? item.Spend : 
                 typeof item.spend === 'number' ? item.spend : 0;
    return spend > 0;
  }).length;
  
  const accountsChange = activeAccounts - previousActiveAccounts;
  const accountsChangePercent = previousActiveAccounts > 0 
    ? ((accountsChange / previousActiveAccounts) * 100).toFixed(1)
    : 'N/A';
  
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Active Accounts Card */}
      <Card className="bg-gray-900/40 backdrop-blur-sm border-white/10 text-white overflow-hidden transition-all duration-300 ease-in-out hover:shadow-[0_15px_25px_rgba(0,0,0,0.2)] hover:scale-[1.02] will-change-transform">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center mb-2 text-xs text-white/50 uppercase tracking-wider font-bold">
            <Users size={16} className="text-[#ea384c] mr-2" />
            {titlePrefix ? `${titlePrefix} Active Accounts` : 'Active Accounts'}
          </div>
          <div className="flex items-center mb-1">
            <div className="text-2xl md:text-3xl font-bold">{formatNumber(activeAccounts)}</div>
            {accountsChange !== 0 && (
              <Badge variant={accountsChange > 0 ? "default" : "destructive"} 
                className={`ml-2 text-xs font-medium ${accountsChange > 0 ? 'bg-green-500/20 text-green-500 hover:bg-green-500/20' : 'bg-[#ea384c]/20 text-[#ea384c] hover:bg-[#ea384c]/20'}`}>
                {accountsChange > 0 ? '+' : ''}{accountsChange}
              </Badge>
            )}
          </div>
          <div className="text-xs text-white/50">vs {previousActiveAccounts} last month</div>
        </CardContent>
      </Card>
      
      {/* Top Customer Card */}
      <Card className="bg-gray-900/40 backdrop-blur-sm border-white/10 text-white overflow-hidden transition-all duration-300 ease-in-out hover:shadow-[0_15px_25px_rgba(0,0,0,0.2)] hover:scale-[1.02] will-change-transform">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center mb-2 text-xs text-white/50 uppercase tracking-wider font-bold">
            <Award size={16} className="text-[#ea384c] mr-2" />
            {titlePrefix ? `${titlePrefix} Top Customer` : 'Top Customer (Highest Profit)'}
          </div>
          <div className="text-xl md:text-2xl font-bold mb-1 line-clamp-1" title={topCustomer.name}>
            {topCustomer.name}
          </div>
          <div className="text-sm text-white/50">
            Profit: {formatCurrency(topCustomer.profit)}
          </div>
        </CardContent>
      </Card>

      {/* Top Margin Customer Card */}
      <Card className="bg-gray-900/40 backdrop-blur-sm border-white/10 text-white overflow-hidden transition-all duration-300 ease-in-out hover:shadow-[0_15px_25px_rgba(0,0,0,0.2)] hover:scale-[1.02] will-change-transform">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center mb-2 text-xs text-white/50 uppercase tracking-wider font-bold">
            <Star size={16} className="text-[#ea384c] mr-2" />
            Top Margin Customer
          </div>
          <div className="text-xl md:text-2xl font-bold mb-1 line-clamp-1" title={topMarginCustomer.name}>
            {topMarginCustomer.name}
          </div>
          <div className="text-sm text-white/50">
            {topMarginCustomer.margin > 0 
              ? `${topMarginCustomer.margin.toFixed(1)}% on ${formatCurrency(topMarginCustomer.spend)}` 
              : 'No margin data'}
          </div>
        </CardContent>
      </Card>

      {/* Most Improved Account Card */}
      <Card className="bg-gray-900/40 backdrop-blur-sm border-white/10 text-white overflow-hidden transition-all duration-300 ease-in-out hover:shadow-[0_15px_25px_rgba(0,0,0,0.2)] hover:scale-[1.02] will-change-transform">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center mb-2 text-xs text-white/50 uppercase tracking-wider font-bold">
            <TrendingUp size={16} className="text-[#ea384c] mr-2" />
            Most Improved Account
          </div>
          <div className="text-xl md:text-2xl font-bold mb-1 line-clamp-1" title={mostImprovedAccount.name}>
            {mostImprovedAccount.name}
          </div>
          <div className="text-sm text-white/50">
            {mostImprovedAccount.percentImprovement > 0 
              ? `+${mostImprovedAccount.percentImprovement.toFixed(1)}% (${formatCurrency(mostImprovedAccount.improvement)})` 
              : 'No improvement data'}
          </div>
        </CardContent>
      </Card>
      
      {/* Increasing Spend Accounts */}
      <Card className="bg-gray-900/40 backdrop-blur-sm border-white/10 text-white overflow-hidden transition-all duration-300 ease-in-out hover:shadow-[0_15px_25px_rgba(0,0,0,0.2)] hover:scale-[1.02] will-change-transform">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center mb-2 text-xs text-white/50 uppercase tracking-wider font-bold">
            <ArrowUpRight size={16} className="text-green-500 mr-2" />
            Increasing Spend Accounts
          </div>
          <div className="flex items-center mb-1">
            <div className="text-2xl md:text-3xl font-bold text-green-500">{formatNumber(accountsTrendData.increasing)}</div>
            <Badge className="ml-2 text-xs font-medium bg-green-500/20 text-green-500 hover:bg-green-500/20">
              {previousMonthData.length > 0 
                ? `${((accountsTrendData.increasing / previousMonthData.length) * 100).toFixed(1)}%` 
                : '0%'}
            </Badge>
          </div>
          <div className="text-sm text-white/50">
            Accounts with higher spend vs. last month
          </div>
        </CardContent>
      </Card>
      
      {/* Decreasing Spend Accounts */}
      <Card className="bg-gray-900/40 backdrop-blur-sm border-white/10 text-white overflow-hidden transition-all duration-300 ease-in-out hover:shadow-[0_15px_25px_rgba(0,0,0,0.2)] hover:scale-[1.02] will-change-transform">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center mb-2 text-xs text-white/50 uppercase tracking-wider font-bold">
            <ArrowDownRight size={16} className="text-[#ea384c] mr-2" />
            Decreasing Spend Accounts
          </div>
          <div className="flex items-center mb-1">
            <div className="text-2xl md:text-3xl font-bold text-[#ea384c]">{formatNumber(accountsTrendData.decreasing)}</div>
            <Badge variant="destructive" className="ml-2 text-xs font-medium bg-[#ea384c]/20 text-[#ea384c] hover:bg-[#ea384c]/20">
              {previousMonthData.length > 0 
                ? `${((accountsTrendData.decreasing / previousMonthData.length) * 100).toFixed(1)}%` 
                : '0%'}
            </Badge>
          </div>
          <div className="text-sm text-white/50">
            Accounts with lower spend vs. last month
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountSummaryCards;
