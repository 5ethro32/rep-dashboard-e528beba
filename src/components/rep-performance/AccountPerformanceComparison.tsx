
import React, { useState, useMemo } from 'react';
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
import { ArrowDownIcon, ArrowUpIcon, TrendingDownIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface AccountComparison {
  accountName: string;
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
    
    // Filter data for the selected rep
    const currentRepAccounts = currentMonthData.filter(
      (item: any) => (item.Rep || item["Rep"]) === selectedRep
    );
    
    const previousRepAccounts = previousMonthData.filter(
      (item: any) => (item.Rep || item["Rep"]) === selectedRep
    );
    
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
        currentProfit: profit,
        previousProfit: 0,
        difference: 0,
        percentChange: 0
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
          currentProfit: 0,
          previousProfit: profit,
          difference: -profit,
          percentChange: -100
        });
      }
    });
    
    // Convert to array and filter for accounts that performed better last month
    const comparisons = Array.from(accountMap.values())
      .filter(account => account.difference < 0)
      .sort((a, b) => a.difference - b.difference); // Sort by biggest drop first
    
    return comparisons;
  }, [selectedRep, currentMonthData, previousMonthData]);

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
          Accounts that performed better in {getPreviousMonthName(selectedMonth)} compared to {selectedMonth}. Identify opportunities for sales recovery.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Select value={selectedRep} onValueChange={setSelectedRep}>
            <SelectTrigger className="w-[250px] bg-gray-800 border-gray-700 text-white">
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

        {selectedRep && (
          <>
            {accountComparisons.length > 0 ? (
              <div className="rounded-md border border-white/10 overflow-hidden">
                <Table>
                  <TableHeader className="bg-gray-800/50">
                    <TableRow>
                      <TableHead className="text-white/70 w-1/3">Account</TableHead>
                      <TableHead className="text-white/70 text-right">{selectedMonth} Profit</TableHead>
                      <TableHead className="text-white/70 text-right">{getPreviousMonthName(selectedMonth)} Profit</TableHead>
                      <TableHead className="text-white/70 text-right">Change</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accountComparisons.slice(0, 10).map((account, index) => (
                      <TableRow 
                        key={index}
                        className="border-b border-white/5 bg-gray-900/30 hover:bg-gray-800/40"
                      >
                        <TableCell className="font-medium text-white/80">{account.accountName}</TableCell>
                        <TableCell className="text-right text-white/80">{formatCurrency(account.currentProfit, 0)}</TableCell>
                        <TableCell className="text-right text-white/80">{formatCurrency(account.previousProfit, 0)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end">
                            <span className="text-finance-red mr-1">{formatCurrency(account.difference, 0)}</span>
                            <TrendingDownIcon size={16} className="text-finance-red" />
                          </div>
                          <div className="text-xs text-finance-red">
                            ({account.percentChange.toFixed(1)}%)
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-white/60">
                {selectedRep && "No accounts found with declining performance."}
              </div>
            )}
          </>
        )}

        {!selectedRep && (
          <div className="text-center py-8 text-white/60">
            Select a rep to view account performance comparisons
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AccountPerformanceComparison;
