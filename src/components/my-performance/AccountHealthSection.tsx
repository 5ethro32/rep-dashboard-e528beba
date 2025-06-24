import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, ChevronUp, ChevronDown, Search, Star, Shield, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { useStarredAccounts } from '@/hooks/useStarredAccounts';
interface AccountHealthSectionProps {
  accountHealthData: any[];
  isLoading: boolean;
  formatCurrency: (value: number, decimals?: number) => string;
  formatPercent: (value: number) => string;
  onMonthChange?: (month: string) => void;
  onCompareMonthChange?: (month: string) => void;
  selectedMonth?: string;
  compareMonth?: string;
}
const AccountHealthSection: React.FC<AccountHealthSectionProps> = ({
  accountHealthData,
  isLoading,
  formatCurrency,
  formatPercent,
  onMonthChange,
  onCompareMonthChange,
  selectedMonth = 'June',
  compareMonth = 'April'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'admin-starred' | 'user-starred'>('all');
  const [sortBy, setSortBy] = useState<string>('healthScore');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const {
    isAdminStarred,
    isUserStarred,
    toggleAdminStar,
    toggleUserStar,
    isAdmin
  } = useStarredAccounts();

  // Handle sorting
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('desc');
    }
  };

  // Handle month selection change
  const handleMonthChange = (month: string) => {
    if (onMonthChange) {
      onMonthChange(month);
    }
  };

  // Handle compare month change
  const handleCompareMonthChange = (month: string) => {
    if (onCompareMonthChange) {
      onCompareMonthChange(month);
    }
  };

  // Filter accounts based on search and star filters
  const filteredAccounts = accountHealthData.filter(account => {
    // Text search filter
    const matchesSearch = account.accountName?.toLowerCase().includes(searchTerm.toLowerCase()) || account.accountRef?.toLowerCase().includes(searchTerm.toLowerCase()) || account.repName && account.repName.toLowerCase().includes(searchTerm.toLowerCase());

    // Star filters
    const accountRef = account.accountRef || '';
    if (filterType === 'admin-starred') {
      return matchesSearch && isAdminStarred(accountRef);
    } else if (filterType === 'user-starred') {
      return matchesSearch && isUserStarred(accountRef);
    }
    return matchesSearch;
  }).sort((a, b) => {
    // Handle sorting
    const column = sortBy;
    let valueA = a[column];
    let valueB = b[column];

    // Ensure we have numbers for numeric comparisons
    if (column === 'profit' || column === 'profitChangePercent' || column === 'margin' || column === 'healthScore') {
      valueA = Number(valueA || 0);
      valueB = Number(valueB || 0);
    } else {
      // String comparison for text fields
      valueA = String(valueA || '').toLowerCase();
      valueB = String(valueB || '').toLowerCase();
    }
    if (sortDirection === 'asc') {
      return valueA > valueB ? 1 : -1;
    } else {
      return valueA < valueB ? 1 : -1;
    }
  });

  // Calculate totals for the table footer
  const tableTotals = useMemo(() => {
    if (!filteredAccounts.length) return {
      count: 0,
      totalProfit: 0,
      totalPreviousProfit: 0,
      totalSpend: 0,
      totalPreviousSpend: 0,
      avgMargin: 0,
      avgPreviousMargin: 0,
      statusCounts: {
        improving: 0,
        stable: 0,
        declining: 0
      }
    };
    const totalProfit = filteredAccounts.reduce((sum, account) => sum + (account.profit || 0), 0);
    const totalPreviousProfit = filteredAccounts.reduce((sum, account) => sum + (account.previousProfit || 0), 0);
    const totalSpend = filteredAccounts.reduce((sum, account) => sum + (account.spend || 0), 0);
    const totalPreviousSpend = filteredAccounts.reduce((sum, account) => sum + (account.previousSpend || 0), 0);
    const totalMargin = filteredAccounts.reduce((sum, account) => sum + (account.margin || 0), 0);
    const avgMargin = totalMargin / filteredAccounts.length;
    const totalPreviousMargin = filteredAccounts.reduce((sum, account) => sum + (account.previousMargin || 0), 0);
    const avgPreviousMargin = totalPreviousMargin / filteredAccounts.length;
    const statusCounts = filteredAccounts.reduce((counts, account) => {
      counts[account.status] = (counts[account.status] || 0) + 1;
      return counts;
    }, {
      improving: 0,
      stable: 0,
      declining: 0
    });
    return {
      count: filteredAccounts.length,
      totalProfit,
      totalPreviousProfit,
      totalSpend,
      totalPreviousSpend,
      avgMargin,
      avgPreviousMargin,
      statusCounts
    };
  }, [filteredAccounts]);

  // Get top improving and declining accounts
  const improvingAccounts = [...accountHealthData].filter(a => a.status === 'improving').sort((a, b) => b.healthScore - a.healthScore).slice(0, 3);
  const decliningAccounts = [...accountHealthData].filter(a => a.status === 'declining').sort((a, b) => a.healthScore - b.healthScore).slice(0, 3);

  // Get account health status badge - now with icons only
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'improving':
        return <Badge className="bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30 border-none">
            <TrendingUp className="h-4 w-4" />
          </Badge>;
      case 'declining':
        return <Badge className="bg-finance-red/20 text-finance-red hover:bg-finance-red/30 border-none">
            <TrendingDown className="h-4 w-4" />
          </Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 hover:bg-gray-500/30 border-none">
            <Minus className="h-4 w-4" />
          </Badge>;
    }
  };

  // Get change indicator for profit/spend/margin changes
  const getChangeIndicator = (current: number, previous: number) => {
    if (!previous) return null;
    const changePercent = previous !== 0 ? (current - previous) / Math.abs(previous) * 100 : 0;
    if (changePercent > 0) {
      return <span className="inline-flex items-center text-emerald-500 text-xs ml-2">
          <ChevronUp className="h-3 w-3" /> 
          <span className="text-white/60">{formatCurrency(previous)}</span>
        </span>;
    } else if (changePercent < 0) {
      return <span className="inline-flex items-center text-finance-red text-xs ml-2">
          <ChevronDown className="h-3 w-3" /> 
          <span className="text-white/60">{formatCurrency(previous)}</span>
        </span>;
    }
    return <span className="text-gray-400 text-xs ml-2">{formatCurrency(previous)}</span>;
  };

  // Get margin change indicator
  const getMarginChangeIndicator = (current: number, previous: number) => {
    if (!previous) return null;
    const change = current - previous;
    if (change > 0) {
      return <span className="inline-flex items-center text-emerald-500 text-xs ml-2">
          <ChevronUp className="h-3 w-3" /> 
          <span className="text-white/60">{formatPercent(previous)}</span>
        </span>;
    } else if (change < 0) {
      return <span className="inline-flex items-center text-finance-red text-xs ml-2">
          <ChevronDown className="h-3 w-3" /> 
          <span className="text-white/60">{formatPercent(previous)}</span>
        </span>;
    }
    return <span className="text-gray-400 text-xs ml-2">{formatPercent(previous)}</span>;
  };

  // Get sort indicator arrow
  const getSortIndicator = (column: string) => {
    if (sortBy === column) {
      return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4 inline ml-1" /> : <ChevronDown className="h-4 w-4 inline ml-1" />;
    }
    return null;
  };

  // Get predominant status for totals row
  const getPredominantStatus = () => {
    const {
      statusCounts
    } = tableTotals;
    const max = Math.max(statusCounts.improving, statusCounts.stable, statusCounts.declining);
    if (statusCounts.improving === max) return 'improving';
    if (statusCounts.declining === max) return 'declining';
    return 'stable';
  };

  // Extract first name from rep name
  const getFirstName = (fullName: string) => {
    if (!fullName) return '';
    return fullName.split(' ')[0];
  };
  if (isLoading) {
    return <Card className="bg-gray-900/40 backdrop-blur-sm border-white/10">
        <CardContent className="p-4 md:p-6">
          <Skeleton className="h-8 w-1/3 mb-4 bg-white/10" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-64 bg-white/5" />
            <Skeleton className="h-64 bg-white/5" />
          </div>
          <Skeleton className="h-8 w-1/3 my-4 bg-white/10" />
          <Skeleton className="h-64 bg-white/5" />
        </CardContent>
      </Card>;
  }
  return <Card className="bg-gray-900/40 backdrop-blur-sm border-white/10">
      <CardContent className="p-4 md:p-6">
        
        
        {/* Full Account Health Table - Now displayed at the top */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
          <h4 className="text-md font-medium text-white/80">All Accounts Performance</h4>
          
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 bg-gray-900/50 border-white/10 text-white/80">
                  <Calendar className="h-4 w-4 mr-2" /> Month: {selectedMonth}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gray-900 border-white/10 text-white">
                <DropdownMenuItem onClick={() => handleMonthChange('June')} className="cursor-pointer">
                  June
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleMonthChange('May')} className="cursor-pointer">
                  May
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleMonthChange('April')} className="cursor-pointer">
                  April
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleMonthChange('March')} className="cursor-pointer">
                  March
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleMonthChange('February')} className="cursor-pointer">
                  February
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 bg-gray-900/50 border-white/10 text-white/80">
                  Compare: {compareMonth}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gray-900 border-white/10 text-white">
                <DropdownMenuItem onClick={() => handleCompareMonthChange('June')} className="cursor-pointer">
                  June
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleCompareMonthChange('May')} className="cursor-pointer">
                  May
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleCompareMonthChange('April')} className="cursor-pointer">
                  April
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleCompareMonthChange('March')} className="cursor-pointer">
                  March
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleCompareMonthChange('February')} className="cursor-pointer">
                  February
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 bg-gray-900/50 border-white/10 text-white/80">
                  {filterType === 'all' ? 'All Accounts' : filterType === 'admin-starred' ? 'Key Accounts' : 'My Bookmarks'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gray-900 border-white/10 text-white">
                <DropdownMenuItem onClick={() => setFilterType('all')} className="cursor-pointer">
                  All Accounts
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType('admin-starred')} className="cursor-pointer">
                  Key Accounts
                  <Shield className="h-4 w-4 ml-2 text-yellow-500" />
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType('user-starred')} className="cursor-pointer">
                  My Bookmarks
                  <Star className="h-4 w-4 ml-2 text-yellow-500" />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <div className="relative mb-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-white/50" />
          <Input type="search" placeholder="Search accounts..." className="pl-9 bg-gray-900/50 border-white/10 text-white" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        
        {/* Modified table container to enable horizontal scrolling on mobile */}
        <div className="overflow-x-auto rounded-md border border-white/10 mb-6">
          {/* Set a fixed height for the scrollable area but make sure it supports both horizontal and vertical scrolling */}
          <div className="w-full overflow-auto" style={{
          maxHeight: '400px'
        }}>
            <Table>
              <TableHeader className="bg-gray-900/60 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="text-white/70 w-10"></TableHead>
                  <TableHead className="text-white/70 w-10"></TableHead>
                  <TableHead className="text-white/70 cursor-pointer min-w-[180px]" onClick={() => handleSort('accountName')}>
                    Account {getSortIndicator('accountName')}
                  </TableHead>
                  <TableHead className="text-white/70 cursor-pointer min-w-[100px]" onClick={() => handleSort('repName')}>
                    Rep {getSortIndicator('repName')}
                  </TableHead>
                  <TableHead className="text-white/70 cursor-pointer min-w-[120px]" onClick={() => handleSort('spend')}>
                    Spend {getSortIndicator('spend')}
                  </TableHead>
                  <TableHead className="text-white/70 cursor-pointer min-w-[120px]" onClick={() => handleSort('profit')}>
                    Profit {getSortIndicator('profit')}
                  </TableHead>
                  <TableHead className="text-white/70 cursor-pointer min-w-[120px]" onClick={() => handleSort('margin')}>
                    Margin {getSortIndicator('margin')}
                  </TableHead>
                  <TableHead className="text-white/70 min-w-[80px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.length > 0 ? filteredAccounts.map((account, index) => <TableRow key={index} className="border-t border-white/10">
                      <TableCell className="p-2 w-10">
                        {isAdmin && <button onClick={() => toggleAdminStar(account.accountRef, account.accountName, isAdminStarred(account.accountRef))} className="text-white/40 hover:text-yellow-500 transition-colors" title={isAdminStarred(account.accountRef) ? "Remove from key accounts" : "Mark as key account"}>
                            {isAdminStarred(account.accountRef) ? <Shield className="h-4 w-4 text-yellow-500" /> : <Shield className="h-4 w-4" />}
                          </button>}
                      </TableCell>
                      <TableCell className="p-2 w-10">
                        <button onClick={() => toggleUserStar(account.accountRef, account.accountName, isUserStarred(account.accountRef))} className="text-white/40 hover:text-yellow-500 transition-colors" title={isUserStarred(account.accountRef) ? "Remove bookmark" : "Bookmark account"}>
                          {isUserStarred(account.accountRef) ? <Star className="h-4 w-4 text-yellow-500" /> : <Star className="h-4 w-4" />}
                        </button>
                      </TableCell>
                      <TableCell className="font-medium text-white">
                        {account.accountName}
                      </TableCell>
                      <TableCell className="text-white/70">
                        {account.repName ? getFirstName(account.repName) : ''}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(account.spend)}
                        {getChangeIndicator(account.spend, account.previousSpend)}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(account.profit)}
                        {getChangeIndicator(account.profit, account.previousProfit)}
                      </TableCell>
                      <TableCell>
                        {formatPercent(account.margin)}
                        {getMarginChangeIndicator(account.margin, account.previousMargin)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(account.status)}
                      </TableCell>
                    </TableRow>) : <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-white/60">
                      No accounts found matching your search criteria
                    </TableCell>
                  </TableRow>}
              </TableBody>
              {filteredAccounts.length > 0 && <TableFooter className="bg-gray-900/80 border-t border-white/10 sticky bottom-0">
                  <TableRow>
                    <TableCell className="p-2"></TableCell>
                    <TableCell className="p-2"></TableCell>
                    <TableCell className="font-medium text-white">
                      Total ({tableTotals.count} accounts)
                    </TableCell>
                    <TableCell></TableCell>
                    <TableCell className="font-medium text-white">
                      <div className="flex items-center">
                        <div className="flex gap-1 mr-1">
                          {/* Status indicator for totals */}
                        </div>
                        {formatCurrency(tableTotals.totalSpend)}
                        {getChangeIndicator(tableTotals.totalSpend, tableTotals.totalPreviousSpend)}
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-white">
                      <div className="flex items-center">
                        <div className="flex gap-1 mr-1">
                          {/* Status indicator for totals */}
                        </div>
                        {formatCurrency(tableTotals.totalProfit)}
                        {getChangeIndicator(tableTotals.totalProfit, tableTotals.totalPreviousProfit)}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-white">
                      <div className="flex items-center">
                        <div className="flex gap-1 mr-1">
                          {/* Status indicator for totals */}
                        </div>
                        {formatPercent(tableTotals.avgMargin)}
                        {getMarginChangeIndicator(tableTotals.avgMargin, tableTotals.avgPreviousMargin)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(getPredominantStatus())}
                    </TableCell>
                  </TableRow>
                </TableFooter>}
            </Table>
          </div>
        </div>
        
        {/* Account Health Insights Cards - Now moved below the table */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Improving Accounts */}
          <Card className="bg-gray-900/60 border-white/10">
            <CardContent className="p-4">
              <h4 className="text-sm font-medium text-white/80 flex items-center mb-3">
                <TrendingUp className="h-4 w-4 mr-2 text-emerald-500" />
                Top Improving Accounts
              </h4>
              
              {improvingAccounts.length > 0 ? <div className="space-y-2">
                  {improvingAccounts.map((account, index) => <div key={index} className="bg-gray-900/40 p-2 rounded-md">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium text-white">{account.accountName}</span>
                          {account.repName && <span className="text-xs text-gray-400 ml-2">
                              ({getFirstName(account.repName)})
                            </span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            {isAdminStarred(account.accountRef) && <div className="text-yellow-500" title="Key Account">
                                <Shield className="h-4 w-4" />
                              </div>}
                            {isUserStarred(account.accountRef) && <div className="text-yellow-500" title="Bookmarked">
                                <Star className="h-4 w-4" />
                              </div>}
                          </div>
                          {getStatusBadge(account.status)}
                        </div>
                      </div>
                      <div className="mt-1 text-sm flex justify-between">
                        <span className="text-white/70">
                          Profit: {formatCurrency(account.profit)}
                          {getChangeIndicator(account.profit, account.previousProfit)}
                        </span>
                      </div>
                    </div>)}
                </div> : <div className="text-center py-6 text-white/60">
                  No improving accounts found
                </div>}
            </CardContent>
          </Card>
          
          {/* Declining Accounts */}
          <Card className="bg-gray-900/60 border-white/10">
            <CardContent className="p-4">
              <h4 className="text-sm font-medium text-white/80 flex items-center mb-3">
                <TrendingDown className="h-4 w-4 mr-2 text-finance-red" />
                Accounts Needing Attention
              </h4>
              
              {decliningAccounts.length > 0 ? <div className="space-y-2">
                  {decliningAccounts.map((account, index) => <div key={index} className="bg-gray-900/40 p-2 rounded-md">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium text-white">{account.accountName}</span>
                          {account.repName && <span className="text-xs text-gray-400 ml-2">
                              ({getFirstName(account.repName)})
                            </span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            {isAdminStarred(account.accountRef) && <div className="text-yellow-500" title="Key Account">
                                <Shield className="h-4 w-4" />
                              </div>}
                            {isUserStarred(account.accountRef) && <div className="text-yellow-500" title="Bookmarked">
                                <Star className="h-4 w-4" />
                              </div>}
                          </div>
                          {getStatusBadge(account.status)}
                        </div>
                      </div>
                      <div className="mt-1 text-sm flex justify-between">
                        <span className="text-white/70">
                          Profit: {formatCurrency(account.profit)}
                          {getChangeIndicator(account.profit, account.previousProfit)}
                        </span>
                      </div>
                    </div>)}
                </div> : <div className="text-center py-6 text-white/60">
                  No declining accounts found
                </div>}
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>;
};
export default AccountHealthSection;