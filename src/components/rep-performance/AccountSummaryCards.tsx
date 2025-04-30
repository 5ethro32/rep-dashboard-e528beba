
import React from 'react';
import { formatCurrency, formatNumber } from '@/utils/rep-performance-utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Award, Package, TrendingUp } from 'lucide-react';

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
  
  // Find top rep by combined profit across all departments
  let topRep = { name: 'No data', profit: 0 };
  let topPacksRep = { name: 'No data', packs: 0 };
  let mostImprovedRep = { name: 'No data', improvement: 0, percentImprovement: 0 };
  
  if (currentMonthData.length > 0) {
    // Group by rep and sum profits, packs, and spend across all departments
    const repProfits = new Map();
    const repPacks = new Map();
    const previousRepProfits = new Map();
    
    // Process current month data
    currentMonthData.forEach(item => {
      // Extract the rep name with fallbacks for different column naming conventions
      const repName = item.Rep || item.rep_name || '';
      // Extract the sub-rep name with fallbacks for different column naming
      const subRepName = item["Sub-Rep"] || item.sub_rep || '';
      
      // Skip RETAIL, REVA, Wholesale, and None as they are department names or invalid reps, not actual reps
      if (repName && repName !== 'RETAIL' && repName !== 'REVA' && repName !== 'Wholesale' && repName !== 'None') {
        const profit = typeof item.Profit === 'number' ? item.Profit : 
                      typeof item.profit === 'number' ? item.profit : 0;
        const packs = typeof item.Packs === 'number' ? item.Packs : 
                     typeof item.packs === 'number' ? item.packs : 0;
        
        // Sum up profits
        const currentProfit = repProfits.get(repName) || 0;
        repProfits.set(repName, currentProfit + profit);
        
        // Sum up packs
        const currentPacks = repPacks.get(repName) || 0;
        repPacks.set(repName, currentPacks + packs);
      }
      
      // Also add metrics for the sub-rep if present and not "None"
      if (subRepName && subRepName !== 'RETAIL' && subRepName !== 'REVA' && subRepName !== 'Wholesale' && subRepName !== 'None') {
        const profit = typeof item.Profit === 'number' ? item.Profit : 
                      typeof item.profit === 'number' ? item.profit : 0;
        const packs = typeof item.Packs === 'number' ? item.Packs : 
                     typeof item.packs === 'number' ? item.packs : 0;
        
        // Sum up profits for sub-rep
        const currentProfit = repProfits.get(subRepName) || 0;
        repProfits.set(subRepName, currentProfit + profit);
        
        // Sum up packs for sub-rep
        const currentPacks = repPacks.get(subRepName) || 0;
        repPacks.set(subRepName, currentPacks + packs);
      }
    });
    
    // Process previous month data
    previousMonthData.forEach(item => {
      // Extract the rep name with fallbacks for different column naming conventions
      const repName = item.Rep || item.rep_name || '';
      // Extract the sub-rep name with fallbacks for different column naming
      const subRepName = item["Sub-Rep"] || item.sub_rep || '';
      
      // Skip RETAIL, REVA, Wholesale, and None as they are department names or invalid reps, not actual reps
      if (repName && repName !== 'RETAIL' && repName !== 'REVA' && repName !== 'Wholesale' && repName !== 'None') {
        const profit = typeof item.Profit === 'number' ? item.Profit : 
                      typeof item.profit === 'number' ? item.profit : 0;
        
        // Sum up profits
        const prevProfit = previousRepProfits.get(repName) || 0;
        previousRepProfits.set(repName, prevProfit + profit);
      }
      
      // Also add metrics for the sub-rep if present and not "None"
      if (subRepName && subRepName !== 'RETAIL' && subRepName !== 'REVA' && subRepName !== 'Wholesale' && subRepName !== 'None') {
        const profit = typeof item.Profit === 'number' ? item.Profit : 
                      typeof item.profit === 'number' ? item.profit : 0;
        
        // Sum up profits for sub-rep
        const prevProfit = previousRepProfits.get(subRepName) || 0;
        previousRepProfits.set(subRepName, prevProfit + profit);
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
    
    // Find rep with highest combined packs
    let maxPacks = 0;
    repPacks.forEach((packs, rep) => {
      if (packs > maxPacks) {
        maxPacks = packs;
        topPacksRep = { name: rep, packs: maxPacks };
      }
    });
    
    // Calculate most improved rep - ONLY considering reps who existed in the previous month data
    let maxImprovement = 0;
    let maxPercentImprovement = 0;
    
    repProfits.forEach((currentProfit, rep) => {
      const previousProfit = previousRepProfits.get(rep) || 0;
      
      // Only consider reps who exist in both months and had some profit in previous month
      if (previousRepProfits.has(rep) && previousProfit > 0) {
        const improvement = currentProfit - previousProfit;
        const percentImprovement = (improvement / previousProfit) * 100;
        
        // We'll prioritize percentage improvement as our metric
        if (percentImprovement > maxPercentImprovement) {
          maxPercentImprovement = percentImprovement;
          maxImprovement = improvement;
          mostImprovedRep = { 
            name: rep, 
            improvement: maxImprovement,
            percentImprovement: maxPercentImprovement
          };
        }
      }
      // Remove the edge case for new reps since we only want to include colleagues who had data in the previous month
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
            <TrendingUp size={16} className="text-[#ea384c] mr-2" />
            Most Improved Rep (By Profit)
          </div>
          <div className="text-2xl md:text-3xl font-bold mb-1">{mostImprovedRep.name}</div>
          <div className="text-sm text-white/50">
            {mostImprovedRep.percentImprovement > 0 
              ? `+${mostImprovedRep.percentImprovement.toFixed(1)}% improvement` 
              : 'No improvement data'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountSummaryCards;
