
import React from 'react';
import { formatCurrency, formatNumber } from '@/utils/rep-performance-utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Award } from 'lucide-react';

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
  
  if (currentMonthData.length > 0) {
    // Group by rep and sum profits across all departments
    const repProfits = new Map();
    
    currentMonthData.forEach(item => {
      // Extract the rep name with fallbacks for different column naming
      const repName = item.Rep || item.rep_name || '';
      // Extract the sub-rep name with fallbacks for different column naming
      const subRepName = item["Sub-Rep"] || item.sub_rep || '';
      
      // Handle profit calculation for the main rep
      if (repName && repName !== 'RETAIL' && repName !== 'REVA' && repName !== 'Wholesale') {
        const profit = typeof item.Profit === 'number' ? item.Profit : 
                      (typeof item.profit === 'number' ? item.profit : 0);
        
        const currentProfit = repProfits.get(repName) || 0;
        repProfits.set(repName, currentProfit + profit);
      }
      
      // Also add profits for the sub-rep if present
      if (subRepName && subRepName !== 'RETAIL' && subRepName !== 'REVA' && subRepName !== 'Wholesale') {
        // For sub-reps, we typically attribute a portion of the profit
        // This may vary based on business rules, but for now we'll attribute the same profit
        const profit = typeof item.Profit === 'number' ? item.Profit : 
                      (typeof item.profit === 'number' ? item.profit : 0);
        
        const currentProfit = repProfits.get(subRepName) || 0;
        repProfits.set(subRepName, currentProfit + profit);
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
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
    </div>
  );
};

export default AccountSummaryCards;
