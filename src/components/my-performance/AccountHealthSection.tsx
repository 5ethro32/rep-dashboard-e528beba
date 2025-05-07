
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  ChevronUp,
  ChevronDown,
  Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

interface AccountHealthSectionProps {
  accountHealthData: any[];
  isLoading: boolean;
  formatCurrency: (value: number, decimals?: number) => string;
  formatPercent: (value: number) => string;
}

const AccountHealthSection: React.FC<AccountHealthSectionProps> = ({
  accountHealthData,
  isLoading,
  formatCurrency,
  formatPercent
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter accounts based on search
  const filteredAccounts = accountHealthData.filter(account => 
    account.accountName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.accountRef?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get top improving and declining accounts
  const improvingAccounts = [...accountHealthData]
    .filter(a => a.status === 'improving')
    .sort((a, b) => b.healthScore - a.healthScore)
    .slice(0, 3);
  
  const decliningAccounts = [...accountHealthData]
    .filter(a => a.status === 'declining')
    .sort((a, b) => a.healthScore - b.healthScore)
    .slice(0, 3);

  // Get account health status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'improving':
        return (
          <Badge className="bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30 border-none">
            <TrendingUp className="h-3 w-3 mr-1" />
            Improving
          </Badge>
        );
      case 'declining':
        return (
          <Badge className="bg-finance-red/20 text-finance-red hover:bg-finance-red/30 border-none">
            <TrendingDown className="h-3 w-3 mr-1" />
            Declining
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-500/20 text-gray-400 hover:bg-gray-500/30 border-none">
            <Minus className="h-3 w-3 mr-1" />
            Stable
          </Badge>
        );
    }
  };

  // Get change indicator for profit/spend changes
  const getChangeIndicator = (changePercent: number) => {
    if (changePercent > 0) {
      return (
        <span className="inline-flex items-center text-emerald-500">
          <ChevronUp className="h-4 w-4" /> 
          {changePercent.toFixed(1)}%
        </span>
      );
    } else if (changePercent < 0) {
      return (
        <span className="inline-flex items-center text-finance-red">
          <ChevronDown className="h-4 w-4" /> 
          {Math.abs(changePercent).toFixed(1)}%
        </span>
      );
    }
    return <span className="text-gray-400">0%</span>;
  };

  if (isLoading) {
    return (
      <Card className="bg-gray-900/40 backdrop-blur-sm border-white/10">
        <CardContent className="p-4 md:p-6">
          <Skeleton className="h-8 w-1/3 mb-4 bg-white/10" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-64 bg-white/5" />
            <Skeleton className="h-64 bg-white/5" />
          </div>
          <Skeleton className="h-8 w-1/3 my-4 bg-white/10" />
          <Skeleton className="h-64 bg-white/5" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900/40 backdrop-blur-sm border-white/10">
      <CardContent className="p-4 md:p-6">
        <h3 className="text-lg md:text-xl font-semibold text-white mb-4">Account Health Analysis</h3>
        
        {/* Account Health Insights Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Improving Accounts */}
          <Card className="bg-gray-900/60 border-white/10">
            <CardContent className="p-4">
              <h4 className="text-sm font-medium text-white/80 flex items-center mb-3">
                <TrendingUp className="h-4 w-4 mr-2 text-emerald-500" />
                Top Improving Accounts
              </h4>
              
              {improvingAccounts.length > 0 ? (
                <div className="space-y-2">
                  {improvingAccounts.map((account, index) => (
                    <div key={index} className="bg-gray-900/40 p-2 rounded-md">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-white">{account.accountName}</span>
                        {getStatusBadge(account.status)}
                      </div>
                      <div className="mt-1 text-sm flex justify-between">
                        <span className="text-white/70">
                          Profit: {formatCurrency(account.profit)}
                        </span>
                        <span className="text-emerald-500">
                          {getChangeIndicator(account.profitChangePercent)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-white/60">
                  No improving accounts found
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Declining Accounts */}
          <Card className="bg-gray-900/60 border-white/10">
            <CardContent className="p-4">
              <h4 className="text-sm font-medium text-white/80 flex items-center mb-3">
                <TrendingDown className="h-4 w-4 mr-2 text-finance-red" />
                Accounts Needing Attention
              </h4>
              
              {decliningAccounts.length > 0 ? (
                <div className="space-y-2">
                  {decliningAccounts.map((account, index) => (
                    <div key={index} className="bg-gray-900/40 p-2 rounded-md">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-white">{account.accountName}</span>
                        {getStatusBadge(account.status)}
                      </div>
                      <div className="mt-1 text-sm flex justify-between">
                        <span className="text-white/70">
                          Profit: {formatCurrency(account.profit)}
                        </span>
                        <span className="text-finance-red">
                          {getChangeIndicator(account.profitChangePercent)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-white/60">
                  No declining accounts found
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Full Account Health Table */}
        <h4 className="text-md font-medium text-white/80 mt-6 mb-3">All Accounts Performance</h4>
        
        <div className="relative mb-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-white/50" />
          <Input
            type="search"
            placeholder="Search accounts..."
            className="pl-9 bg-gray-900/50 border-white/10 text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="rounded-md border border-white/10 overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-900/60">
              <TableRow>
                <TableHead className="text-white/70">Account</TableHead>
                <TableHead className="text-white/70">Profit</TableHead>
                <TableHead className="text-white/70">Change</TableHead>
                <TableHead className="text-white/70">Margin</TableHead>
                <TableHead className="text-white/70">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAccounts.length > 0 ? (
                filteredAccounts.map((account, index) => (
                  <TableRow key={index} className="border-t border-white/10">
                    <TableCell className="font-medium text-white">{account.accountName}</TableCell>
                    <TableCell>{formatCurrency(account.profit)}</TableCell>
                    <TableCell>{getChangeIndicator(account.profitChangePercent)}</TableCell>
                    <TableCell>{formatPercent(account.margin)}</TableCell>
                    <TableCell>{getStatusBadge(account.status)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-white/60">
                    No accounts found matching your search
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default AccountHealthSection;
