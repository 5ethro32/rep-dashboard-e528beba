
import React from 'react';
import { formatCurrency, formatNumber } from '@/utils/rep-performance-utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Award, Package, CreditCard } from 'lucide-react';

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
    ? ((accountsChange / previousActiveAccounts) * 100).toFixed(1)
    : 'N/A';
  
  // Find top rep by combined profit across all departments
  let topRep = { name: 'No data', profit: 0 };
  
  // Find top customer by packs and spend
  let topCustomerByPacks = { name: 'No data', packs: 0 };
  let topCustomerBySpend = { name: 'No data', spend: 0 };
  
  if (currentMonthData.length > 0) {
    // Group by rep and sum profits across all departments
    const repProfits = new Map();
    
    // Group by account (customer) for packs and spend
    const accountPacks = new Map();
    const accountSpends = new Map();
    
    currentMonthData.forEach(item => {
      // Extract the rep name with fallbacks for different column naming
      const repName = item.Rep || item.rep_name || '';
      // Extract the account name with fallbacks for different column naming
      const accountName = item["Account Name"] || item.account_name || '';
      
      // Handle metric calculation for the main rep
      if (repName && repName !== 'RETAIL' && repName !== 'REVA' && repName !== 'Wholesale') {
        const profit = typeof item.Profit === 'number' ? item.Profit : 
                      (typeof item.profit === 'number' ? item.profit : 0);
        
        // Sum up profits
        const currentProfit = repProfits.get(repName) || 0;
        repProfits.set(repName, currentProfit + profit);
      }
      
      // Handle metrics for customer analysis
      if (accountName) {
        const packs = typeof item.Packs === 'number' ? item.Packs : 
                     (typeof item.packs === 'number' ? item.packs : 0);
        const spend = typeof item.Spend === 'number' ? item.Spend : 
                     (typeof item.spend === 'number' ? item.spend : 0);
        
        // Sum up packs by account
        const currentPacks = accountPacks.get(accountName) || 0;
        accountPacks.set(accountName, currentPacks + packs);
        
        // Sum up spend by account
        const currentSpend = accountSpends.get(accountName) || 0;
        accountSpends.set(accountName, currentSpend + spend);
      }
    });
    
    // Find rep with highest combined profit
    let maxProfit = 0;
    repProfits.forEach((profit, rep) => {
      if (profit > maxProfit) {
        maxProfit = profit;
        topRep = { name: rep, profit: maxProfit };
      }
    });
    
    // Find customer with highest packs
    let maxPacks = 0;
    accountPacks.forEach((packs, account) => {
      if (packs > maxPacks) {
        maxPacks = packs;
        topCustomerByPacks = { name: account, packs: maxPacks };
      }
    });
    
    // Find customer with highest spend
    let maxSpend = 0;
    accountSpends.forEach((spend, account) => {
      if (spend > maxSpend) {
        maxSpend = spend;
        topCustomerBySpend = { name: account, spend: maxSpend };
      }
    });
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
      <Card className="bg-gray-900/40 backdrop-blur-sm border-white/10 text-white overflow-hidden">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center mb-2 text-xs text-white/50 uppercase tracking-wider font-bold">
            <Users size={16} className="text-[#ea384c] mr-2" />
            Active Accounts
          </div>
          <div className="text-2xl md:text-3xl font-bold mb-1">{formatNumber(activeAccounts)}</div>
          <div className="flex items-center">
            {accountsChange !== 0 && (
              <Badge variant={accountsChange > 0 ? "default" : "destructive"} 
                className={`text-xs font-medium ${accountsChange > 0 ? 'bg-green-500/20 text-green-500 hover:bg-green-500/20' : 'bg-[#ea384c]/20 text-[#ea384c] hover:bg-[#ea384c]/20'}`}>
                {accountsChange > 0 ? '+' : ''}{accountsChange}
              </Badge>
            )}
            <span className="text-xs text-white/50 ml-2">vs {previousActiveAccounts} last month</span>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gray-900/40 backdrop-blur-sm border-white/10 text-white overflow-hidden">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center mb-2 text-xs text-white/50 uppercase tracking-wider font-bold">
            <Award size={16} className="text-[#ea384c] mr-2" />
            Top Rep (by Combined Profit)
          </div>
          <div className="text-2xl md:text-3xl font-bold mb-1">{topRep.name}</div>
          <div className="text-sm text-white/50">
            Total profit: {formatCurrency(topRep.profit)}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-900/40 backdrop-blur-sm border-white/10 text-white overflow-hidden">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center mb-2 text-xs text-white/50 uppercase tracking-wider font-bold">
            <Package size={16} className="text-[#ea384c] mr-2" />
            Top Customer (by Packs)
          </div>
          <div className="text-2xl md:text-3xl font-bold mb-1 truncate" title={topCustomerByPacks.name}>{topCustomerByPacks.name}</div>
          <div className="text-sm text-white/50">
            Total packs: {formatNumber(topCustomerByPacks.packs)}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-900/40 backdrop-blur-sm border-white/10 text-white overflow-hidden">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center mb-2 text-xs text-white/50 uppercase tracking-wider font-bold">
            <CreditCard size={16} className="text-[#ea384c] mr-2" />
            Top Customer (by Spend)
          </div>
          <div className="text-2xl md:text-3xl font-bold mb-1 truncate" title={topCustomerBySpend.name}>{topCustomerBySpend.name}</div>
          <div className="text-sm text-white/50">
            Total spend: {formatCurrency(topCustomerBySpend.spend)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountSummaryCards;
