
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
  
  // Create a map to aggregate metrics by rep across all departments
  const repMetrics = new Map();
  
  if (currentMonthData.length > 0) {
    // First pass: process main rep data
    currentMonthData.forEach(item => {
      // Extract the rep name with fallbacks for different column naming
      const repName = item.Rep || item.rep_name || '';
      
      // Skip department entries
      if (repName === 'RETAIL' || repName === 'REVA' || repName === 'Wholesale') {
        return;
      }
      
      // Initialize rep data if not present
      if (!repMetrics.has(repName)) {
        repMetrics.set(repName, {
          profit: 0,
          packs: 0,
          spend: 0
        });
      }
      
      // Extract metrics with fallbacks for different column naming
      const profit = typeof item.Profit === 'number' ? item.Profit : 
                    (typeof item.profit === 'number' ? item.profit : 0);
      const packs = typeof item.Packs === 'number' ? item.Packs : 
                    (typeof item.packs === 'number' ? item.packs : 0);
      const spend = typeof item.Spend === 'number' ? item.Spend : 
                    (typeof item.spend === 'number' ? item.spend : 0);
      
      // Update metrics
      const repData = repMetrics.get(repName);
      repData.profit += profit;
      repData.packs += packs;
      repData.spend += spend;
    });
    
    // Second pass: process sub-rep data and add to the same totals
    currentMonthData.forEach(item => {
      // Extract the sub-rep name with fallbacks for different column naming
      const subRepName = item["Sub-Rep"] || item.sub_rep || '';
      
      if (!subRepName || subRepName === 'RETAIL' || subRepName === 'REVA' || subRepName === 'Wholesale') {
        return;
      }
      
      // Initialize rep data if not present
      if (!repMetrics.has(subRepName)) {
        repMetrics.set(subRepName, {
          profit: 0,
          packs: 0,
          spend: 0
        });
      }
      
      // Extract metrics with fallbacks for different column naming
      const profit = typeof item.Profit === 'number' ? item.Profit : 
                    (typeof item.profit === 'number' ? item.profit : 0);
      const packs = typeof item.Packs === 'number' ? item.Packs : 
                    (typeof item.packs === 'number' ? item.packs : 0);
      const spend = typeof item.Spend === 'number' ? item.Spend : 
                    (typeof item.spend === 'number' ? item.spend : 0);
      
      // Update metrics for sub-rep
      const repData = repMetrics.get(subRepName);
      repData.profit += profit;
      repData.packs += packs;
      repData.spend += spend;
    });
  }
  
  // Find top performers for each metric
  let topRep = { name: 'No data', profit: 0 };
  let topPacksRep = { name: 'No data', packs: 0 };
  let topSpendRep = { name: 'No data', spend: 0 };
  
  repMetrics.forEach((metrics, repName) => {
    // Check for top profit
    if (metrics.profit > topRep.profit) {
      topRep = { name: repName, profit: metrics.profit };
    }
    
    // Check for top packs
    if (metrics.packs > topPacksRep.packs) {
      topPacksRep = { name: repName, packs: metrics.packs };
    }
    
    // Check for top spend
    if (metrics.spend > topSpendRep.spend) {
      topSpendRep = { name: repName, spend: metrics.spend };
    }
  });

  // For debugging
  console.log(`Top rep metrics calculated:`, {
    topRep,
    topPacksRep,
    topSpendRep
  });

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
            Top Rep (by Packs)
          </div>
          <div className="text-2xl md:text-3xl font-bold mb-1">{topPacksRep.name}</div>
          <div className="text-sm text-white/50">
            Total packs: {formatNumber(topPacksRep.packs)}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-900/40 backdrop-blur-sm border-white/10 text-white overflow-hidden">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center mb-2 text-xs text-white/50 uppercase tracking-wider font-bold">
            <CreditCard size={16} className="text-[#ea384c] mr-2" />
            Top Rep (by Spend)
          </div>
          <div className="text-2xl md:text-3xl font-bold mb-1">{topSpendRep.name}</div>
          <div className="text-sm text-white/50">
            Total spend: {formatCurrency(topSpendRep.spend)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountSummaryCards;
