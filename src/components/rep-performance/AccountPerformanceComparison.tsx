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
import { ArrowDownIcon, ArrowUpIcon, SearchIcon, PoundSterlingIcon, PercentIcon, PackageIcon, ShoppingCartIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface AccountComparison {
  accountName: string;
  accountRef: string;
  currentProfit: number;
  previousProfit: number;
  difference: number;
  percentChange: number;
  currentMargin?: number;
  previousMargin?: number;
  marginDifference?: number;
  currentPacks?: number;
  previousPacks?: number;
  packsDifference?: number;
  packsPercentChange?: number;
  currentSpend?: number;
  previousSpend?: number;
  spendDifference?: number;
  spendPercentChange?: number;
}

interface AccountPerformanceComparisonProps {
  currentMonthData: any[];
  previousMonthData: any[];
  isLoading: boolean;
  selectedMonth: string;
  formatCurrency: (value: number, decimals?: number) => string;
  selectedUser?: string; // Add selected user prop
}

const AccountPerformanceComparison: React.FC<AccountPerformanceComparisonProps> = ({
  currentMonthData,
  previousMonthData,
  isLoading,
  selectedMonth,
  formatCurrency,
  selectedUser
}) => {
  const [selectedRep, setSelectedRep] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all'); // 'all', 'declining', 'improving'
  const [improvingCount, setImprovingCount] = useState(0);
  const [decliningCount, setDecliningCount] = useState(0);
  const [activeTab, setActiveTab] = useState<string>('profit');
  const [sortColumn, setSortColumn] = useState<string>('difference');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Set selected rep to the user if provided
  useEffect(() => {
    if (selectedUser) {
      setSelectedRep(selectedUser);
    }
  }, [selectedUser]);
  
  const repOptions = useMemo(() => {
    if (!currentMonthData || currentMonthData.length === 0) return [];
    
    // Updated to collect reps from both Rep and Sub-Rep fields
    const repSet = new Set<string>();
    
    currentMonthData.forEach(item => {
      // Add main rep if it has data
      const mainRep = item.Rep || item.rep_name || '';
      const spend = typeof item.Spend === 'string' ? parseFloat(item.Spend) : Number(item.Spend || 0);
      const profit = typeof item.Profit === 'string' ? parseFloat(item.Profit) : Number(item.Profit || 0);
      const packs = typeof item.Packs === 'string' ? parseInt(item.Packs as string) : Number(item.Packs || 0);
      
      if (mainRep && mainRep !== 'REVA' && mainRep !== 'Wholesale' && mainRep !== 'WHOLESALE' && 
          (spend > 0 || profit > 0 || packs > 0)) {
        repSet.add(mainRep);
      }
      
      // Also add sub-rep if it exists
      const subRep = item['Sub-Rep'] || item.sub_rep || '';
      if (subRep && subRep.trim() !== '') {
        repSet.add(subRep);
      }
    });
    
    console.log(`Found ${repSet.size} unique reps (including sub-reps) from ${currentMonthData.length} records`);
    return Array.from(repSet).sort();
  }, [currentMonthData]);
  
  const accountComparisons = useMemo(() => {
    if (!selectedRep || !currentMonthData) return [];
    
    console.log(`Processing data comparison for ${selectedRep}. ${selectedMonth} data: ${currentMonthData.length}, Previous month data: ${previousMonthData?.length || 0}`);
    
    // Modified to include accounts where the rep is EITHER the main rep OR the sub-rep
    const currentRepAccounts = currentMonthData.filter(
      (item: any) => {
        const repName = item.Rep || item.rep_name || '';
        const subRep = item['Sub-Rep'] || item.sub_rep || '';
        const spend = typeof item.Spend === 'string' ? parseFloat(item.Spend) : Number(item.Spend || 0);
        const profit = typeof item.Profit === 'string' ? parseFloat(item.Profit) : Number(item.Profit || 0);
        const packs = typeof item.Packs === 'string' ? parseInt(item.Packs as string) : Number(item.Packs || 0);
        
        const isMainRep = repName === selectedRep;
        const isSubRep = subRep === selectedRep;
        const hasData = (spend > 0 || profit > 0 || packs > 0);
        
        return (isMainRep || isSubRep) && hasData;
      }
    );
    
    const previousRepAccounts = previousMonthData?.filter(
      (item: any) => {
        const repName = item.Rep || item.rep_name || '';
        const subRep = item['Sub-Rep'] || item.sub_rep || '';
        return repName === selectedRep || subRep === selectedRep;
      }
    ) || [];
    
    console.log(`Filtered data for ${selectedRep}: ${selectedMonth} accounts: ${currentRepAccounts.length}, Previous month accounts: ${previousRepAccounts.length}`);
    console.log(`Breakdown - As main rep: ${currentRepAccounts.filter((item: any) => (item.Rep || item.rep_name) === selectedRep).length}, As sub-rep: ${currentRepAccounts.filter((item: any) => (item['Sub-Rep'] || item.sub_rep) === selectedRep).length}`);
    
    // Add specific debugging for June data to understand duplicate issue
    if (selectedMonth === 'June') {
      console.log('🔍 JUNE DATA ANALYSIS:');
      
      // Check for accounts with missing Account Ref in current data
      const currentWithoutRef = currentRepAccounts.filter(item => !item["Account Ref"] || (typeof item["Account Ref"] === 'string' && item["Account Ref"].trim() === ''));
      const currentWithRef = currentRepAccounts.filter(item => item["Account Ref"] && (typeof item["Account Ref"] === 'string' && item["Account Ref"].trim() !== ''));
      console.log(`Current data: ${currentWithRef.length} with Account Ref, ${currentWithoutRef.length} without Account Ref`);
      
      // Check for accounts with missing Account Ref in previous data  
      const previousWithoutRef = previousRepAccounts.filter(item => !item["Account Ref"] || (typeof item["Account Ref"] === 'string' && item["Account Ref"].trim() === ''));
      const previousWithRef = previousRepAccounts.filter(item => item["Account Ref"] && (typeof item["Account Ref"] === 'string' && item["Account Ref"].trim() !== ''));
      console.log(`Previous data: ${previousWithRef.length} with Account Ref, ${previousWithoutRef.length} without Account Ref`);
      
      // Sample accounts to understand structure
      if (currentRepAccounts.length > 0) {
        console.log('Sample current account:', {
          name: currentRepAccounts[0]["Account Name"],
          ref: currentRepAccounts[0]["Account Ref"],
          profit: currentRepAccounts[0].Profit
        });
      }
      if (previousRepAccounts.length > 0) {
        console.log('Sample previous account:', {
          name: previousRepAccounts[0]["Account Name"], 
          ref: previousRepAccounts[0]["Account Ref"],
          profit: previousRepAccounts[0].Profit
        });
      }
    }
    
    const accountMap = new Map<string, AccountComparison>();
    
    // Helper function to create a more robust account matching key
    // This handles cases where Account Ref might be missing or inconsistent between tables
    const createAccountKey = (accountName: string, accountRef: string) => {
      const cleanName = accountName.trim().toLowerCase();
      const cleanRef = accountRef?.trim();
      
      // Always use just the name as the primary key to ensure matching
      // This prevents duplicates when one table has refs and another doesn't
      return cleanName;
    };
    
    // Helper function to find matching account in previous data using flexible matching
    const findMatchingAccount = (currentAccount: any, previousAccounts: any[]) => {
      const currentName = (currentAccount["Account Name"] || currentAccount.account_name || '').trim().toLowerCase();
      const currentRef = (currentAccount["Account Ref"] || currentAccount.account_ref || '').trim();
      
      // First try exact match with both name and ref
      if (currentRef) {
        const exactMatch = previousAccounts.find(prev => {
          const prevName = (prev["Account Name"] || prev.account_name || '').trim().toLowerCase();
          const prevRef = (prev["Account Ref"] || prev.account_ref || '').trim();
          return prevName === currentName && prevRef === currentRef;
        });
        if (exactMatch) return exactMatch;
      }
      
      // Fall back to name-only matching for cases where refs are inconsistent
      const nameMatch = previousAccounts.find(prev => {
        const prevName = (prev["Account Name"] || prev.account_name || '').trim().toLowerCase();
        return prevName === currentName;
      });
      
      return nameMatch;
    };
    
    currentRepAccounts.forEach((account: any) => {
      const accountName = account["Account Name"] || account.account_name || '';
      const accountRef = account["Account Ref"] || account.account_ref || '';
      const key = createAccountKey(accountName, accountRef);
      
      const profit = typeof account.Profit === 'string' 
        ? parseFloat(account.Profit) 
        : typeof account.profit === 'string'
          ? parseFloat(account.profit)
          : Number(account.Profit || account.profit || 0);

      const margin = typeof account.Margin === 'string'
        ? parseFloat(account.Margin)
        : typeof account.margin === 'string'
          ? parseFloat(account.margin)
          : Number(account.Margin || account.margin || 0);

      const packs = typeof account.Packs === 'string'
        ? parseInt(account.Packs)
        : typeof account.packs === 'string'
          ? parseInt(account.packs)
          : Number(account.Packs || account.packs || 0);

      const spend = typeof account.Spend === 'string'
        ? parseFloat(account.Spend)
        : typeof account.spend === 'string'
          ? parseFloat(account.spend)
          : Number(account.Spend || account.spend || 0);
      
      // Check if we already have this account (from previous data processing)
      if (accountMap.has(key)) {
        // Update existing entry with current data, combining values
        const existingAccount = accountMap.get(key)!;
        
        // Combine current values (in case there are multiple entries for same account)
        existingAccount.currentProfit += profit;
        existingAccount.currentSpend += spend;
        existingAccount.currentPacks += packs;
        // Recalculate margin based on combined values
        existingAccount.currentMargin = existingAccount.currentSpend > 0 ? 
          (existingAccount.currentProfit / existingAccount.currentSpend) * 100 : 0;
        
        // Use the most complete account reference (prefer non-empty refs)
        if (accountRef && accountRef.trim() && (!existingAccount.accountRef || existingAccount.accountRef.trim() === '')) {
          existingAccount.accountRef = accountRef;
        }
        
        // Recalculate differences
        existingAccount.difference = existingAccount.currentProfit - existingAccount.previousProfit;
        existingAccount.percentChange = existingAccount.previousProfit !== 0 
          ? ((existingAccount.currentProfit - existingAccount.previousProfit) / Math.abs(existingAccount.previousProfit)) * 100 
          : existingAccount.currentProfit > 0 ? 100 : 0;
        existingAccount.marginDifference = existingAccount.currentMargin! - existingAccount.previousMargin!;
        existingAccount.packsDifference = existingAccount.currentPacks! - existingAccount.previousPacks!;
        existingAccount.packsPercentChange = existingAccount.previousPacks !== 0
          ? ((existingAccount.currentPacks! - existingAccount.previousPacks!) / Math.abs(existingAccount.previousPacks!)) * 100
          : existingAccount.currentPacks! > 0 ? 100 : 0;
        existingAccount.spendDifference = existingAccount.currentSpend! - existingAccount.previousSpend!;
        existingAccount.spendPercentChange = existingAccount.previousSpend !== 0
          ? ((existingAccount.currentSpend! - existingAccount.previousSpend!) / Math.abs(existingAccount.previousSpend!)) * 100
          : existingAccount.currentSpend! > 0 ? 100 : 0;
        
        accountMap.set(key, existingAccount);
      } else {
        // Create new entry with current data
        accountMap.set(key, {
          accountName,
          accountRef,
          currentProfit: profit,
          previousProfit: 0,
          difference: profit,
          percentChange: profit === 0 ? 0 : 100,
          currentMargin: margin,
          previousMargin: 0,
          marginDifference: margin,
          currentPacks: packs,
          previousPacks: 0,
          packsDifference: packs,
          packsPercentChange: packs === 0 ? 0 : 100,
          currentSpend: spend,
          previousSpend: 0,
          spendDifference: spend,
          spendPercentChange: spend === 0 ? 0 : 100
        });
      }
    });
    
    // Process previous accounts with improved matching
    previousRepAccounts.forEach((account: any) => {
      const accountName = account["Account Name"] || account.account_name || '';
      const accountRef = account["Account Ref"] || account.account_ref || '';
      const key = createAccountKey(accountName, accountRef);
      
      const profit = typeof account.Profit === 'string' 
        ? parseFloat(account.Profit) 
        : typeof account.profit === 'string'
          ? parseFloat(account.profit)
          : Number(account.Profit || account.profit || 0);

      const margin = typeof account.Margin === 'string'
        ? parseFloat(account.Margin)
        : typeof account.margin === 'string'
          ? parseFloat(account.margin)
          : Number(account.Margin || account.margin || 0);

      const packs = typeof account.Packs === 'string'
        ? parseInt(account.Packs)
        : typeof account.packs === 'string'
          ? parseInt(account.packs)
          : Number(account.Packs || account.packs || 0);

      const spend = typeof account.Spend === 'string'
        ? parseFloat(account.Spend)
        : typeof account.spend === 'string'
          ? parseFloat(account.spend)
          : Number(account.Spend || account.spend || 0);
      
      if (accountMap.has(key)) {
        // Update existing account with previous data, combining values
        const existingAccount = accountMap.get(key)!;
        
        // Combine previous values (in case there are multiple entries for same account)
        existingAccount.previousProfit += profit;
        existingAccount.previousSpend += spend;
        existingAccount.previousPacks += packs;
        // Recalculate margin based on combined values
        existingAccount.previousMargin = existingAccount.previousSpend > 0 ? 
          (existingAccount.previousProfit / existingAccount.previousSpend) * 100 : 0;
        
        // Use the most complete account reference (prefer non-empty refs)
        if (accountRef && accountRef.trim() && (!existingAccount.accountRef || existingAccount.accountRef.trim() === '')) {
          existingAccount.accountRef = accountRef;
        }
        
        // Recalculate differences
        existingAccount.difference = existingAccount.currentProfit - existingAccount.previousProfit;
        existingAccount.percentChange = existingAccount.previousProfit !== 0 
          ? ((existingAccount.currentProfit - existingAccount.previousProfit) / Math.abs(existingAccount.previousProfit)) * 100 
          : existingAccount.currentProfit > 0 ? 100 : 0;
        
        existingAccount.marginDifference = existingAccount.currentMargin! - existingAccount.previousMargin!;
        
        existingAccount.packsDifference = existingAccount.currentPacks! - existingAccount.previousPacks!;
        existingAccount.packsPercentChange = existingAccount.previousPacks !== 0
          ? ((existingAccount.currentPacks! - existingAccount.previousPacks!) / Math.abs(existingAccount.previousPacks!)) * 100
          : existingAccount.currentPacks! > 0 ? 100 : 0;
        
        existingAccount.spendDifference = existingAccount.currentSpend! - existingAccount.previousSpend!;
        existingAccount.spendPercentChange = existingAccount.previousSpend !== 0
          ? ((existingAccount.currentSpend! - existingAccount.previousSpend!) / Math.abs(existingAccount.previousSpend!)) * 100
          : existingAccount.currentSpend! > 0 ? 100 : 0;
        
        accountMap.set(key, existingAccount);
      } else {
        // Create new entry for account that only exists in previous data
        accountMap.set(key, {
          accountName,
          accountRef,
          currentProfit: 0,
          previousProfit: profit,
          difference: -profit,
          percentChange: -100,
          currentMargin: 0,
          previousMargin: margin,
          marginDifference: -margin,
          currentPacks: 0,
          previousPacks: packs,
          packsDifference: -packs,
          packsPercentChange: -100,
          currentSpend: 0,
          previousSpend: spend,
          spendDifference: -spend,
          spendPercentChange: -100
        });
      }
    });
    
    const result = Array.from(accountMap.values());
    console.log(`Final account comparison result: ${result.length} unique accounts after deduplication`);
    
    // Add specific debugging for Strathclyde to understand what's happening
    if (selectedMonth === 'June') {
      const strathclydeAccounts = result.filter(acc => 
        acc.accountName.toLowerCase().includes('strathclyde')
      );
      console.log('🔍 STRATHCLYDE ACCOUNTS AFTER PROCESSING:', strathclydeAccounts);
      
      // Show the keys that were generated
      const currentStrathclyde = currentRepAccounts.filter(acc => 
        (acc["Account Name"] || '').toLowerCase().includes('strathclyde')
      );
      const previousStrathclyde = previousRepAccounts.filter(acc => 
        (acc["Account Name"] || '').toLowerCase().includes('strathclyde')
      );
      
      console.log('Current Strathclyde entries with keys:');
      currentStrathclyde.forEach(acc => {
        const name = acc["Account Name"] || '';
        const ref = acc["Account Ref"] || '';
        const key = createAccountKey(name, ref);
        console.log(`  Key: "${key}", Name: "${name}", Ref: "${ref}", Profit: ${acc.Profit}`);
      });
      
      console.log('Previous Strathclyde entries with keys:');
      previousStrathclyde.forEach(acc => {
        const name = acc["Account Name"] || '';
        const ref = acc["Account Ref"] || '';
        const key = createAccountKey(name, ref);
        console.log(`  Key: "${key}", Name: "${name}", Ref: "${ref}", Profit: ${acc.Profit}`);
      });
    }
    
    return result;
  }, [selectedRep, currentMonthData, previousMonthData, selectedMonth]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const filteredAccounts = useMemo(() => {
    let filtered = accountComparisons;
    
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(account => 
        account.accountName.toLowerCase().includes(search) || 
        account.accountRef.toLowerCase().includes(search)
      );
    }
    
    switch (filterType) {
      case 'declining':
        switch (activeTab) {
          case 'profit':
            filtered = filtered.filter(account => account.difference < 0);
            break;
          case 'margin':
            filtered = filtered.filter(account => account.marginDifference! < 0);
            break;
          case 'packs':
            filtered = filtered.filter(account => account.packsDifference! < 0);
            break;
          case 'spend':
            filtered = filtered.filter(account => account.spendDifference! < 0);
            break;
        }
        break;
      case 'improving':
        switch (activeTab) {
          case 'profit':
            filtered = filtered.filter(account => account.difference > 0);
            break;
          case 'margin':
            filtered = filtered.filter(account => account.marginDifference! > 0);
            break;
          case 'packs':
            filtered = filtered.filter(account => account.packsDifference! > 0);
            break;
          case 'spend':
            filtered = filtered.filter(account => account.spendDifference! > 0);
            break;
        }
        break;
      case 'all':
      default:
        break;
    }
    
    return filtered.sort((a, b) => {
      let compareValueA, compareValueB;
      
      switch (sortColumn) {
        case 'accountName':
          compareValueA = a.accountName.toLowerCase();
          compareValueB = b.accountName.toLowerCase();
          return sortDirection === 'asc' 
            ? compareValueA.localeCompare(compareValueB)
            : compareValueB.localeCompare(compareValueA);
        
        case 'currentValue':
          switch (activeTab) {
            case 'profit':
              compareValueA = a.currentProfit;
              compareValueB = b.currentProfit;
              break;
            case 'margin':
              compareValueA = a.currentMargin || 0;
              compareValueB = b.currentMargin || 0;
              break;
            case 'packs':
              compareValueA = a.currentPacks || 0;
              compareValueB = b.currentPacks || 0;
              break;
            case 'spend':
              compareValueA = a.currentSpend || 0;
              compareValueB = b.currentSpend || 0;
              break;
            default:
              compareValueA = a.currentProfit;
              compareValueB = b.currentProfit;
          }
          break;
        
        case 'previousValue':
          switch (activeTab) {
            case 'profit':
              compareValueA = a.previousProfit;
              compareValueB = b.previousProfit;
              break;
            case 'margin':
              compareValueA = a.previousMargin || 0;
              compareValueB = b.previousMargin || 0;
              break;
            case 'packs':
              compareValueA = a.previousPacks || 0;
              compareValueB = b.previousPacks || 0;
              break;
            case 'spend':
              compareValueA = a.previousSpend || 0;
              compareValueB = b.previousSpend || 0;
              break;
            default:
              compareValueA = a.previousProfit;
              compareValueB = b.previousProfit;
          }
          break;
        
        case 'difference':
        default:
          switch (activeTab) {
            case 'profit':
              compareValueA = a.difference;
              compareValueB = b.difference;
              break;
            case 'margin':
              compareValueA = a.marginDifference || 0;
              compareValueB = b.marginDifference || 0;
              break;
            case 'packs':
              compareValueA = a.packsDifference || 0;
              compareValueB = b.packsDifference || 0;
              break;
            case 'spend':
              compareValueA = a.spendDifference || 0;
              compareValueB = b.spendDifference || 0;
              break;
            default:
              compareValueA = a.difference;
              compareValueB = b.difference;
          }
      }
      
      if (sortColumn !== 'accountName') {
        return sortDirection === 'asc' 
          ? compareValueA - compareValueB
          : compareValueB - compareValueA;
      }
      return 0;
    });
  }, [accountComparisons, searchTerm, filterType, activeTab, sortColumn, sortDirection]);

  useEffect(() => {
    if (accountComparisons.length > 0) {
      let improving = 0;
      let declining = 0;
      
      switch (activeTab) {
        case 'profit':
          improving = accountComparisons.filter(account => account.difference > 0).length;
          declining = accountComparisons.filter(account => account.difference < 0).length;
          break;
        case 'margin':
          improving = accountComparisons.filter(account => account.marginDifference! > 0).length;
          declining = accountComparisons.filter(account => account.marginDifference! < 0).length;
          break;
        case 'packs':
          improving = accountComparisons.filter(account => account.packsDifference! > 0).length;
          declining = accountComparisons.filter(account => account.packsDifference! < 0).length;
          break;
        case 'spend':
          improving = accountComparisons.filter(account => account.spendDifference! > 0).length;
          declining = accountComparisons.filter(account => account.spendDifference! < 0).length;
          break;
      }
      
      setImprovingCount(improving);
      setDecliningCount(declining);
      
      console.log(`Stats for ${selectedRep} in ${selectedMonth} (${activeTab}): Total accounts: ${accountComparisons.length}, Improving: ${improving}, Declining: ${declining}`);
    }
  }, [accountComparisons, selectedRep, selectedMonth, activeTab]);

  const getPreviousMonthName = (currentMonth: string): string => {
    switch (currentMonth) {
      case 'April': return 'March';
      case 'March': return 'February';
      case 'February': return 'January';
      case 'May': return 'April';
      default: return 'Previous Month';
    }
  };

  const formatPercentageChange = (value: number) => {
    if (isNaN(value) || value === Infinity || value === -Infinity) {
      return 'New/Lost';
    }
    return value >= 0 ? `+${value.toFixed(1)}%` : `${value.toFixed(1)}%`;
  };

  const formatMargin = (value: number) => {
    if (isNaN(value)) return '0.0%';
    return `${value.toFixed(1)}%`;
  };

  const getColumnLabel = () => {
    switch (activeTab) {
      case 'profit': return 'Profit';
      case 'margin': return 'Margin';
      case 'packs': return 'Packs';
      case 'spend': return 'Spend';
      default: return 'Profit';
    }
  };

  const renderSortIndicator = (column: string) => {
    if (sortColumn === column) {
      return sortDirection === 'asc' ? ' ↑' : ' ↓';
    }
    return '';
  };

  if (isLoading) {
    return (
      <Card className="bg-gray-900/40 border-white/10 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl text-white/90">
            <Skeleton className="h-8 w-1/3 bg-gray-800" />
          </CardTitle>
          <CardDescription className="text-white/60">
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

  const previousMonth = getPreviousMonthName(selectedMonth);

  return (
    <Card className="bg-gray-900/40 border-white/10 backdrop-blur-sm shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg md:text-xl text-white/90">
          {selectedUser ? `${selectedUser}'s Account Performance` : 'Account Performance Comparison'}
        </CardTitle>
        <CardDescription className="text-white/60">
          Compare {selectedUser ? `${selectedUser}'s` : 'all'} account performance between {selectedMonth} and {previousMonth}. 
          Use filters to identify declining or improving accounts.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Always show rep selector dropdown for account filtering */}
            <div className="md:w-1/3">
              <Select value={selectedRep} onValueChange={setSelectedRep}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder={selectedUser ? `Viewing ${selectedUser}'s accounts` : "Select a rep"} />
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

          {(selectedRep || selectedUser) && (
            <>
              <Tabs defaultValue="profit" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-4 mb-6 bg-gray-900/50 backdrop-blur-sm rounded-lg border border-white/5 shadow-lg">
                  <TabsTrigger value="profit" className="flex items-center gap-1">
                    <PoundSterlingIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Profit</span>
                  </TabsTrigger>
                  <TabsTrigger value="margin" className="flex items-center gap-1">
                    <PercentIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Margin</span>
                  </TabsTrigger>
                  <TabsTrigger value="packs" className="flex items-center gap-1">
                    <PackageIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Packs</span>
                  </TabsTrigger>
                  <TabsTrigger value="spend" className="flex items-center gap-1">
                    <ShoppingCartIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Spend</span>
                  </TabsTrigger>
                </TabsList>

                <div className="text-sm text-white/60 py-2">
                  {accountComparisons.length > 0 && (
                    <p>
                      Showing {getColumnLabel()} data for {accountComparisons.length} accounts: {improvingCount} improving, {decliningCount} declining, {accountComparisons.length - improvingCount - decliningCount} unchanged
                    </p>
                  )}
                </div>
                
                {filteredAccounts.length > 0 ? (
                  <div className="rounded-md border border-white/10 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-gray-800/50">
                        <TableRow>
                          <TableHead 
                            className="text-white/70 w-1/3 cursor-pointer hover:bg-white/5"
                            onClick={() => handleSort('accountName')}
                          >
                            Account{renderSortIndicator('accountName')}
                          </TableHead>
                          <TableHead 
                            className="text-white/70 text-right cursor-pointer hover:bg-white/5"
                            onClick={() => handleSort('currentValue')}
                          >
                            {selectedMonth} {getColumnLabel()}{renderSortIndicator('currentValue')}
                          </TableHead>
                          <TableHead 
                            className="text-white/70 text-right cursor-pointer hover:bg-white/5"
                            onClick={() => handleSort('previousValue')}
                          >
                            {previousMonth} {getColumnLabel()}{renderSortIndicator('previousValue')}
                          </TableHead>
                          <TableHead 
                            className="text-white/70 text-right cursor-pointer hover:bg-white/5"
                            onClick={() => handleSort('difference')}
                          >
                            Change{renderSortIndicator('difference')}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAccounts.map((account, index) => {
                          let currentValue, previousValue, difference, percentChange;
                          let valueFormatter;
                          
                          switch (activeTab) {
                            case 'profit':
                              currentValue = account.currentProfit;
                              previousValue = account.previousProfit;
                              difference = account.difference;
                              percentChange = account.percentChange;
                              valueFormatter = (val: number) => formatCurrency(val, 0);
                              break;
                            case 'margin':
                              currentValue = account.currentMargin || 0;
                              previousValue = account.previousMargin || 0;
                              difference = account.marginDifference || 0;
                              percentChange = 0;
                              valueFormatter = formatMargin;
                              break;
                            case 'packs':
                              currentValue = account.currentPacks || 0;
                              previousValue = account.previousPacks || 0;
                              difference = account.packsDifference || 0;
                              percentChange = account.packsPercentChange || 0;
                              valueFormatter = (val: number) => val.toLocaleString();
                              break;
                            case 'spend':
                              currentValue = account.currentSpend || 0;
                              previousValue = account.previousSpend || 0;
                              difference = account.spendDifference || 0;
                              percentChange = account.spendPercentChange || 0;
                              valueFormatter = (val: number) => formatCurrency(val, 0);
                              break;
                            default:
                              currentValue = account.currentProfit;
                              previousValue = account.previousProfit;
                              difference = account.difference;
                              percentChange = account.percentChange;
                              valueFormatter = (val: number) => formatCurrency(val, 0);
                          }
                          
                          return (
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
                              <TableCell className="text-right text-white/80">{valueFormatter(currentValue)}</TableCell>
                              <TableCell className="text-right text-white/80">{valueFormatter(previousValue)}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end">
                                  <span className={difference >= 0 ? "text-emerald-500 mr-1" : "text-finance-red mr-1"}>
                                    {activeTab === 'margin' ? formatMargin(difference) : valueFormatter(difference)}
                                  </span>
                                  {difference > 0 ? (
                                    <ArrowUpIcon size={16} className="text-emerald-500" />
                                  ) : difference < 0 ? (
                                    <ArrowDownIcon size={16} className="text-finance-red" />
                                  ) : null}
                                </div>
                                {activeTab !== 'margin' && (
                                  <div className="text-xs text-white/60">
                                    <span className={percentChange >= 0 ? "text-emerald-500" : "text-finance-red"}>
                                      {formatPercentageChange(percentChange)}
                                    </span>
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-white/60">
                    {searchTerm ? 
                      "No accounts found matching your search criteria." : 
                      filterType !== 'all' ? 
                        `No ${filterType === 'declining' ? 'declining' : 'improving'} ${getColumnLabel()} accounts found for ${selectedRep || selectedUser}.` :
                        `No accounts found for ${selectedRep || selectedUser}.`
                    }
                  </div>
                )}
              </Tabs>
            </>
          )}

          {!selectedRep && !selectedUser && (
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
