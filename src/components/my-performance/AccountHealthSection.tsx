
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  ChevronUp,
  ChevronDown,
  Search,
  Star,
  Shield
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { useStarredAccounts } from '@/hooks/useStarredAccounts';

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

  // Filter accounts based on search and star filters
  const filteredAccounts = accountHealthData.filter(account => {
    // Text search filter
    const matchesSearch = account.accountName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.accountRef?.toLowerCase().includes(searchTerm.toLowerCase());
    
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

  // Get sort indicator arrow
  const getSortIndicator = (column: string) => {
    if (sortBy === column) {
      return sortDirection === 'asc' ? 
        <ChevronUp className="h-4 w-4 inline ml-1" /> : 
        <ChevronDown className="h-4 w-4 inline ml-1" />;
    }
    return null;
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
                        <div className="flex items-center gap-2">
                          {getStatusBadge(account.status)}
                          <div className="flex gap-1">
                            {isAdminStarred(account.accountRef) && (
                              <div className="text-yellow-500" title="Key Account">
                                <Shield className="h-4 w-4" />
                              </div>
                            )}
                            {isUserStarred(account.accountRef) && (
                              <div className="text-yellow-500" title="Bookmarked">
                                <Star className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                        </div>
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
                        <div className="flex items-center gap-2">
                          {getStatusBadge(account.status)}
                          <div className="flex gap-1">
                            {isAdminStarred(account.accountRef) && (
                              <div className="text-yellow-500" title="Key Account">
                                <Shield className="h-4 w-4" />
                              </div>
                            )}
                            {isUserStarred(account.accountRef) && (
                              <div className="text-yellow-500" title="Bookmarked">
                                <Star className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                        </div>
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mt-6 mb-3">
          <h4 className="text-md font-medium text-white/80">All Accounts Performance</h4>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 bg-gray-900/50 border-white/10 text-white/80">
                {filterType === 'all' ? 'All Accounts' : 
                 filterType === 'admin-starred' ? 'Key Accounts' : 'My Bookmarks'}
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
          <ScrollArea className="h-[400px]" orientation="vertical">
            <Table>
              <TableHeader className="bg-gray-900/60 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="text-white/70 w-10"></TableHead>
                  <TableHead 
                    className="text-white/70 cursor-pointer" 
                    onClick={() => handleSort('accountName')}
                  >
                    Account {getSortIndicator('accountName')}
                  </TableHead>
                  <TableHead 
                    className="text-white/70 cursor-pointer" 
                    onClick={() => handleSort('profit')}
                  >
                    Profit {getSortIndicator('profit')}
                  </TableHead>
                  <TableHead 
                    className="text-white/70 cursor-pointer" 
                    onClick={() => handleSort('profitChangePercent')}
                  >
                    Change {getSortIndicator('profitChangePercent')}
                  </TableHead>
                  <TableHead 
                    className="text-white/70 cursor-pointer" 
                    onClick={() => handleSort('margin')}
                  >
                    Margin {getSortIndicator('margin')}
                  </TableHead>
                  <TableHead className="text-white/70">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.length > 0 ? (
                  filteredAccounts.map((account, index) => (
                    <TableRow key={index} className="border-t border-white/10">
                      <TableCell className="p-2 w-12">
                        <div className="flex gap-1">
                          {isAdmin && (
                            <button
                              onClick={() => toggleAdminStar(
                                account.accountRef,
                                account.accountName,
                                isAdminStarred(account.accountRef)
                              )}
                              className="text-white/40 hover:text-yellow-500 transition-colors"
                              title={isAdminStarred(account.accountRef) ? "Remove from key accounts" : "Mark as key account"}
                            >
                              {isAdminStarred(account.accountRef) ? (
                                <Shield className="h-4 w-4 text-yellow-500" />
                              ) : (
                                <Shield className="h-4 w-4" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => toggleUserStar(
                              account.accountRef,
                              account.accountName,
                              isUserStarred(account.accountRef)
                            )}
                            className="text-white/40 hover:text-yellow-500 transition-colors"
                            title={isUserStarred(account.accountRef) ? "Remove bookmark" : "Bookmark account"}
                          >
                            {isUserStarred(account.accountRef) ? (
                              <Star className="h-4 w-4 text-yellow-500" />
                            ) : (
                              <Star className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-white">{account.accountName}</TableCell>
                      <TableCell>{formatCurrency(account.profit)}</TableCell>
                      <TableCell>{getChangeIndicator(account.profitChangePercent)}</TableCell>
                      <TableCell>{formatPercent(account.margin)}</TableCell>
                      <TableCell>{getStatusBadge(account.status)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4 text-white/60">
                      No accounts found matching your search
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};

export default AccountHealthSection;
