
import React, { useState, useMemo, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowDownIcon, ArrowUpIcon, SearchIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface AccountComparison {
  accountName: string;
  accountRef: string;
  currentProfit: number;
  previousProfit: number;
  difference: number;
  percentChange: number;
}

interface AccountPerformanceComparisonProps {
  currentMonthData: any[];
  previousMonthData: any[];
  isLoading: boolean;
  selectedMonth: string;
  formatCurrency: (value: number, decimals?: number) => string;
}

const AccountPerformanceComparison: React.FC<AccountPerformanceComparisonProps> = ({
  currentMonthData,
  previousMonthData,
  isLoading,
  selectedMonth,
  formatCurrency
}) => {
  const [selectedRep, setSelectedRep] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all'); // 'all', 'declining', 'improving'
  const [improvingCount, setImprovingCount] = useState(0);
  const [decliningCount, setDecliningCount] = useState(0);
  
  const repOptions = useMemo(() => {
    if (!currentMonthData || currentMonthData.length === 0) return [];
    
    // Extract unique rep names from the data
    const repNames = Array.from(new Set(
      currentMonthData.map((item: any) => item.Rep || item["Rep"] || '')
    )).filter(Boolean);
    
    return repNames.sort();
  }, [currentMonthData]);
  
  const accountComparisons = useMemo(() => {
    if (!selectedRep || !currentMonthData || !previousMonthData) return [];
    
    console.log(`Processing data comparison for ${selectedRep}. Current month data: ${currentMonthData.length}, Previous month data: ${previousMonthData.length}`);
    
    // Filter data for the selected rep
    const currentRepAccounts = currentMonthData.filter(
      (item: any) => (item.Rep || item["Rep"]) === selectedRep
    );
    
    const previousRepAccounts = previousMonthData.filter(
      (item: any) => (item.Rep || item["Rep"]) === selectedRep
    );
    
    console.log(`Filtered data for ${selectedRep}: Current month accounts: ${currentRepAccounts.length}, Previous month accounts: ${previousRepAccounts.length}`);
    
    // Group data by account
    const accountMap = new Map<string, AccountComparison>();
    
    // Process current month data
    currentRepAccounts.forEach((account: any) => {
      const accountName = account["Account Name"] || '';
      const accountRef = account["Account Ref"] || '';
      const key = `${accountName}-${accountRef}`;
      const profit = typeof account.Profit === 'string' 
        ? parseFloat(account.Profit) 
        : Number(account.Profit || 0);
      
      accountMap.set(key, {
        accountName,
        accountRef,
        currentProfit: profit,
        previousProfit: 0,
        difference: profit,
        percentChange: profit === 0 ? 0 : 100
      });
    });
    
    // Process previous month data and update comparisons
    previousRepAccounts.forEach((account: any) => {
      const accountName = account["Account Name"] || '';
      const accountRef = account["Account Ref"] || '';
      const key = `${accountName}-${accountRef}`;
      const profit = typeof account.Profit === 'string' 
        ? parseFloat(account.Profit) 
        : Number(account.Profit || 0);
      
      if (accountMap.has(key)) {
        const existingAccount = accountMap.get(key)!;
        existingAccount.previousProfit = profit;
        existingAccount.difference = existingAccount.currentProfit - profit;
        existingAccount.percentChange = profit !== 0 
          ? ((existingAccount.currentProfit - profit) / Math.abs(profit)) * 100 
          : existingAccount.currentProfit > 0 ? 100 : 0;
        
        accountMap.set(key, existingAccount);
      } else {
        // Account exists in previous month but not in current
        accountMap.set(key, {
          accountName,
          accountRef,
          currentProfit: 0,
          previousProfit: profit,
          difference: -profit,
          percentChange: -100
        });
      }
    });
    
    // Convert to array
    return Array.from(accountMap.values());
  }, [selectedRep, currentMonthData, previousMonthData]);

  // Filter accounts based on search term and filter type
  const filteredAccounts = useMemo(() => {
    let filtered = accountComparisons;
    
    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(account => 
        account.accountName.toLowerCase().includes(search) || 
        account.accountRef.toLowerCase().includes(search)
      );
    }
    
    // Apply performance filter
    switch (filterType) {
      case 'declining':
        filtered = filtered.filter(account => account.difference < 0);
        break;
      case 'improving':
        filtered = filtered.filter(account => account.difference > 0);
        break;
      case 'all':
      default:
        // No additional filtering needed
        break;
    }
    
    // Sort by the largest absolute difference first
    return filtered.sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));
  }, [accountComparisons, searchTerm, filterType]);

  useEffect(() => {
    // Count improving and declining accounts
    if (accountComparisons.length > 0) {
      const improving = accountComparisons.filter(account => account.difference > 0).length;
      const declining = accountComparisons.filter(account => account.difference < 0).length;
      
      setImprovingCount(improving);
      setDecliningCount(declining);
      
      console.log(`Stats for ${selectedRep}: Total accounts: ${accountComparisons.length}, Improving: ${improving}, Declining: ${declining}`);
    }
  }, [accountComparisons]);

  const getPreviousMonthName = (currentMonth: string): string => {
    switch (currentMonth) {
      case 'April': return 'March';
      case 'March': return 'February';
      case 'February': return 'January';
      default: return 'Previous Month';
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-gray-900/40 border-white/10 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl text-white/90">
            <Skeleton className="h-8 w-1/3 bg-gray-800" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-2/3 bg-gray-800" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-1/4 mb-4 bg-gray-800" />
          <div className="space-y-2">
            {Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full bg-gray-800" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900/40 border-white/10 backdrop-blur-sm shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg md:text-xl text-white/90">
          Account Performance Comparison
        </CardTitle>
        <CardDescription className="text-white/60">
          Compare all account performance between {selectedMonth} and {getPreviousMonthName(selectedMonth)}. 
          Use filters to identify declining or improving accounts.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="md:w-1/3">
              <Select value={selectedRep} onValueChange={setSelectedRep}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Select a rep" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  {repOptions.map(rep => (
                    <SelectItem key={rep} value={rep}>
                      {rep}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:w-1/3 relative">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                <Input 
                  placeholder="Search accounts..." 
                  className="pl-10 bg-gray-800 border-gray-700 text-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="md:w-1/3 flex gap-2">
              <Button 
                variant={filterType === 'all' ? 'default' : 'outline'} 
                onClick={() => setFilterType('all')}
                className={filterType === 'all' ? 'bg-white/10' : 'bg-transparent border-white/10 text-white/70'}
              >
                All
              </Button>
              <Button 
                variant={filterType === 'declining' ? 'default' : 'outline'} 
                onClick={() => setFilterType('declining')}
                className={filterType === 'declining' ? 'bg-finance-red/20 text-finance-red' : 'bg-transparent border-white/10 text-white/70'}
              >
                <ArrowDownIcon className="mr-1 h-4 w-4" />
                Declining ({decliningCount})
              </Button>
              <Button 
                variant={filterType === 'improving' ? 'default' : 'outline'} 
                onClick={() => setFilterType('improving')}
                className={filterType === 'improving' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-transparent border-white/10 text-white/70'}
              >
                <ArrowUpIcon className="mr-1 h-4 w-4" />
                Improving ({improvingCount})
              </Button>
            </div>
          </div>

          {selectedRep && (
            <>
              <div className="text-sm text-white/60 py-2">
                {accountComparisons.length > 0 && (
                  <p>
                    Showing data for {accountComparisons.length} accounts: {improvingCount} improving, {decliningCount} declining, {accountComparisons.length - improvingCount - decliningCount} unchanged
                  </p>
                )}
              </div>
              
              {filteredAccounts.length > 0 ? (
                <div className="rounded-md border border-white/10 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-gray-800/50">
                      <TableRow>
                        <TableHead className="text-white/70 w-1/3">Account</TableHead>
                        <TableHead className="text-white/70 text-right">
                          Current: {selectedMonth} Profit
                        </TableHead>
                        <TableHead className="text-white/70 text-right">
                          Previous: {getPreviousMonthName(selectedMonth)} Profit
                        </TableHead>
                        <TableHead className="text-white/70 text-right">Change</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAccounts.map((account, index) => (
                        <TableRow 
                          key={index}
                          className="border-b border-white/5 bg-gray-900/30 hover:bg-gray-800/40"
                        >
                          <TableCell className="font-medium text-white/80">
                            <div>
                              {account.accountName}
                            </div>
                            <div className="text-xs text-white/50">
                              Ref: {account.accountRef}
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-white/80">{formatCurrency(account.currentProfit, 0)}</TableCell>
                          <TableCell className="text-right text-white/80">{formatCurrency(account.previousProfit, 0)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end">
                              <span className={account.difference >= 0 ? "text-emerald-500 mr-1" : "text-finance-red mr-1"}>
                                {formatCurrency(account.difference, 0)}
                              </span>
                              {account.difference > 0 ? (
                                <ArrowUpIcon size={16} className="text-emerald-500" />
                              ) : account.difference < 0 ? (
                                <ArrowDownIcon size={16} className="text-finance-red" />
                              ) : null}
                            </div>
                            <div className="text-xs text-white/60">
                              {!isNaN(account.percentChange) && account.percentChange !== Infinity && account.percentChange !== -Infinity ? (
                                <span className={account.percentChange >= 0 ? "text-emerald-500" : "text-finance-red"}>
                                  ({account.percentChange.toFixed(1)}%)
                                </span>
                              ) : (
                                <span>New/Lost</span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-white/60">
                  {searchTerm ? 
                    "No accounts found matching your search criteria." : 
                    filterType !== 'all' ? 
                      `No ${filterType === 'declining' ? 'declining' : 'improving'} accounts found for ${selectedRep}.` :
                      `No accounts found for ${selectedRep}.`
                  }
                </div>
              )}
            </>
          )}

          {!selectedRep && (
            <div className="text-center py-8 text-white/60">
              Select a rep to view all account performance comparisons
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AccountPerformanceComparison;
