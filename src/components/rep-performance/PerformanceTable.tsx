import React, { useMemo, useEffect } from 'react';
import { Loader2, Minus, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

interface PerformanceTableProps {
  displayData: any[];
  repChanges: Record<string, any>;
  sortBy: string;
  sortOrder: string;
  onSort: (column: string) => void;
  formatCurrency: (value: number, decimals?: number) => string;
  formatPercent: (value: number) => string;
  formatNumber: (value: number) => string;
  renderChangeIndicator: (changeValue: number, size?: string) => React.ReactNode;
  isLoading?: boolean;
  getFebValue: (repName: string, metricType: string, currentValue: number, changePercent: number) => string;
  showChangeIndicators?: boolean;
  selectedMonth?: string;
}

  const PerformanceTable: React.FC<PerformanceTableProps> = ({
  displayData,
  repChanges,
  sortBy,
  sortOrder,
  onSort,
  formatCurrency,
  formatPercent,
  formatNumber,
  renderChangeIndicator,
  isLoading,
  getFebValue,
  showChangeIndicators = true,
  selectedMonth
}) => {
  
  // Disable comparison indicators for July as a quick fix for inflated comparison data
  const shouldShowChangeIndicators = showChangeIndicators && selectedMonth !== 'July';
  
  // Add debugging for July rep changes
  useEffect(() => {
    // Check if we're likely on July (look for inflated values)
    const problematicReps = ['Michael McKay', 'Pete Dhillon', 'Stuart Geddes'];
    const hasInflatedValues = problematicReps.some(repName => {
      const change = repChanges[repName];
      return change && (Math.abs(change.profit) > 1000 || Math.abs(change.spend) > 1000);
    });
    
    if (hasInflatedValues || Object.keys(repChanges).length > 0) {
      console.log('🔍 PERFORMANCE TABLE DEBUG:');
      console.log('Total rep changes received:', Object.keys(repChanges).length);
      console.log('Full repChanges object:', repChanges);
      
      problematicReps.forEach(repName => {
        if (repChanges[repName]) {
          console.log(`🔍 ${repName} rep changes in table:`, repChanges[repName]);
        }
      });
      
      // Check if we have inflated values
      if (hasInflatedValues) {
        console.log('⚠️ DETECTED INFLATED VALUES IN TABLE - investigating...');
        
        // Log sample calculations
        problematicReps.forEach(repName => {
          const repData = displayData.find(r => r.rep === repName);
          const change = repChanges[repName];
          if (repData && change) {
            console.log(`🧮 ${repName} calculation check:`, {
              currentProfit: repData.profit,
              changePercent: change.profit,
              calculatedPreviousProfit: repData.profit / (1 + (change.profit || 0) / 100),
              changeSpend: change.spend,
              currentSpend: repData.spend,
              calculatedPreviousSpend: repData.spend / (1 + (change.spend || 0) / 100)
            });
          }
        });
      } else {
        // Log normal values for July debugging
        console.log('✅ Normal values detected in table');
        problematicReps.forEach(repName => {
          const repData = displayData.find(r => r.rep === repName);
          const change = repChanges[repName];
          if (repData && change) {
            console.log(`✅ ${repName} normal calculation:`, {
              currentProfit: repData.profit,
              changePercent: change.profit,
              calculatedPreviousProfit: repData.profit / (1 + (change.profit || 0) / 100),
              changeSpend: change.spend,
              currentSpend: repData.spend,
              calculatedPreviousSpend: repData.spend / (1 + (change.spend || 0) / 100)
            });
          }
        });
      }
    }
  }, [repChanges, displayData]);

  // Calculate the previous month's ranking based on the same sort criteria
  const prevRankings = useMemo(() => {
    if (!displayData.length || !shouldShowChangeIndicators) return {};
    
    // Deep clone the data to avoid mutation
    const clonedData = JSON.parse(JSON.stringify(displayData));
    
    // Calculate previous values for each rep
    const prevData = clonedData.map((item: any) => {
      const change = repChanges[item.rep] || {};
      
      // Calculate previous values based on % changes
      return {
        rep: item.rep,
        profit: item.profit / (1 + (change.profit || 0) / 100),
        spend: item.spend / (1 + (change.spend || 0) / 100),
        margin: item.margin - (change.margin || 0),
        activeAccounts: Math.round(item.activeAccounts / (1 + (change.activeAccounts || 0) / 100)),
        packs: Math.round(item.packs / (1 + (change.packs || 0) / 100))
      };
    });
    
    // Sort previous data using the same criteria
    const sortField = sortBy;
    const sortMultiplier = sortOrder === 'desc' ? -1 : 1;
    
    prevData.sort((a: any, b: any) => (a[sortField] - b[sortField]) * sortMultiplier);
    
    // Create a map of rep name to previous rank
    return prevData.reduce((acc: any, item: any, index: number) => {
      acc[item.rep] = index + 1;
      return acc;
    }, {});
  }, [displayData, repChanges, sortBy, sortOrder, shouldShowChangeIndicators]);
  
  return (
    <div className="overflow-x-auto w-full -mx-3 md:mx-0">
      <div className="min-w-full">
        <Table>
          <TableHeader>
            <TableRow className="bg-black/20 hover:bg-black/30">
              <TableHead 
                onClick={() => onSort('rep')}
                className="px-3 md:px-6 py-2 md:py-3 text-left text-2xs md:text-xs font-medium text-finance-gray uppercase cursor-pointer hover:bg-white/5 transition-colors sticky left-0 z-20 bg-gray-900/90 backdrop-blur-sm border-r border-white/5"
              >
                Rep {sortBy === 'rep' && (sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead 
                onClick={() => onSort('spend')}
                className="px-3 md:px-6 py-2 md:py-3 text-left text-2xs md:text-xs font-medium text-finance-gray uppercase cursor-pointer hover:bg-white/5 transition-colors min-w-[120px]"
              >
                Spend {sortBy === 'spend' && (sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead 
                onClick={() => onSort('profit')}
                className="px-3 md:px-6 py-2 md:py-3 text-left text-2xs md:text-xs font-medium text-finance-gray uppercase cursor-pointer hover:bg-white/5 transition-colors min-w-[120px]"
              >
                Profit {sortBy === 'profit' && (sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead 
                onClick={() => onSort('margin')}
                className="px-3 md:px-6 py-2 md:py-3 text-left text-2xs md:text-xs font-medium text-finance-gray uppercase cursor-pointer hover:bg-white/5 transition-colors min-w-[100px]"
              >
                Margin {sortBy === 'margin' && (sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead 
                onClick={() => onSort('activeAccounts')}
                className="px-3 md:px-6 py-2 md:py-3 text-left text-2xs md:text-xs font-medium text-finance-gray uppercase cursor-pointer hover:bg-white/5 transition-colors min-w-[140px]"
              >
                Accounts {sortBy === 'activeAccounts' && (sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead 
                onClick={() => onSort('packs')}
                className="px-3 md:px-6 py-2 md:py-3 text-left text-2xs md:text-xs font-medium text-finance-gray uppercase cursor-pointer hover:bg-white/5 transition-colors min-w-[100px]"
              >
                Packs {sortBy === 'packs' && (sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="px-3 md:px-6 py-8 text-center">
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Loading data...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : displayData.length > 0 ? (
              displayData.map((item, index) => {
                // Calculate rank change
                const currentRank = index + 1;
                const previousRank = prevRankings[item.rep] || currentRank;
                const rankChange = previousRank - currentRank;
                
                // Check if active accounts match total accounts for displaying dash instead of down arrow
                const accountsMatch = item.activeAccounts === item.totalAccounts;
                
                return (
                  <TableRow key={item.rep} className="hover:bg-white/5 transition-colors">
                    <TableCell className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm font-medium sticky left-0 z-10 bg-gray-900/90 backdrop-blur-sm border-r border-white/5">
                      <div className="flex items-center">
                        <span>{item.rep}</span>
                        {shouldShowChangeIndicators && rankChange !== 0 ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="ml-1.5">
                                  {rankChange > 0 ? (
                                    <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                                  ) : rankChange < 0 ? (
                                    <ArrowDownRight className="h-4 w-4 text-finance-red" />
                                  ) : null}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className="bg-gray-800 border-white/10 text-white">
                                <p>
                                  {rankChange > 0
                                    ? `Up ${rankChange} ${rankChange === 1 ? 'position' : 'positions'} (was ${previousRank})`
                                    : `Down ${Math.abs(rankChange)} ${Math.abs(rankChange) === 1 ? 'position' : 'positions'} (was ${previousRank})`}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : shouldShowChangeIndicators ? (
                          <span className="ml-1.5 font-bold text-finance-gray">
                            <Minus className="h-4 w-4" />
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center">
                              {formatCurrency(item.spend)}
                              {shouldShowChangeIndicators && repChanges[item.rep] && Math.abs(repChanges[item.rep].spend) >= 0.1 ? (
                                <div className="flex items-center ml-1">
                                  {renderChangeIndicator(repChanges[item.rep].spend, 'small')}
                                  <span className="text-2xs ml-1 text-finance-gray">
                                    {formatCurrency(item.spend / (1 + (repChanges[item.rep]?.spend || 0) / 100), 0)}
                                  </span>
                                </div>
                              ) : shouldShowChangeIndicators ? (
                                <span className="inline-flex items-center ml-1 text-finance-gray font-bold">
                                  <Minus className="h-4 w-4" />
                                </span>
                              ) : null}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="bg-gray-800 border-white/10 text-white">
                            <p>
                              {shouldShowChangeIndicators ? (
                                <>
                                  Previous: {formatCurrency(item.spend / (1 + (repChanges[item.rep]?.spend || 0) / 100))}
                                  {repChanges[item.rep]?.spend ? ` (${repChanges[item.rep].spend > 0 ? '+' : ''}${repChanges[item.rep].spend.toFixed(1)}%)` : ''}
                                </>
                              ) : `${item.rep}'s spend`}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm font-bold text-white">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center">
                              {formatCurrency(item.profit)}
                              {shouldShowChangeIndicators && repChanges[item.rep] && Math.abs(repChanges[item.rep].profit) >= 0.1 ? (
                                <div className="flex items-center ml-1">
                                  {renderChangeIndicator(repChanges[item.rep].profit, 'small')}
                                  <span className="text-2xs ml-1 text-finance-gray">
                                    {formatCurrency(item.profit / (1 + (repChanges[item.rep]?.profit || 0) / 100), 0)}
                                  </span>
                                </div>
                              ) : shouldShowChangeIndicators ? (
                                <span className="inline-flex items-center ml-1 text-finance-gray font-bold">
                                  <Minus className="h-4 w-4" />
                                </span>
                              ) : null}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="bg-gray-800 border-white/10 text-white">
                            <p>
                              {shouldShowChangeIndicators ? (
                                <>
                                  Previous: {formatCurrency(item.profit / (1 + (repChanges[item.rep]?.profit || 0) / 100))}
                                  {repChanges[item.rep]?.profit ? ` (${repChanges[item.rep].profit > 0 ? '+' : ''}${repChanges[item.rep].profit.toFixed(1)}%)` : ''}
                                </>
                              ) : `${item.rep}'s profit`}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center">
                              {formatPercent(item.margin)}
                              {shouldShowChangeIndicators && repChanges[item.rep] && Math.abs(repChanges[item.rep].margin) >= 0.1 ? (
                                <div className="flex items-center ml-1">
                                  {renderChangeIndicator(repChanges[item.rep].margin, 'small')}
                                  <span className="text-2xs ml-1 text-finance-gray">
                                    {formatPercent(item.margin - (repChanges[item.rep]?.margin || 0))}
                                  </span>
                                </div>
                              ) : shouldShowChangeIndicators ? (
                                <span className="inline-flex items-center ml-1 text-finance-gray font-bold">
                                  <Minus className="h-4 w-4" />
                                </span>
                              ) : null}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="bg-gray-800 border-white/10 text-white">
                            <p>
                              {shouldShowChangeIndicators ? (
                                <>
                                  Previous: {formatPercent(item.margin - (repChanges[item.rep]?.margin || 0))}
                                  {repChanges[item.rep]?.margin ? ` (${repChanges[item.rep].margin > 0 ? '+' : ''}${repChanges[item.rep].margin.toFixed(1)}%)` : ''}
                                </>
                              ) : `${item.rep}'s margin`}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center">
                              <span className="text-emerald-500">{formatNumber(item.activeAccounts)}</span>
                              <span className="text-finance-gray mx-1"> / </span>
                              <span>{formatNumber(item.totalAccounts)}</span>
                              {shouldShowChangeIndicators && (
                                accountsMatch ? (
                                  <span className="inline-flex items-center ml-1 text-finance-gray font-bold">
                                    <Minus className="h-4 w-4" />
                                  </span>
                                ) : (
                                  repChanges[item.rep] && Math.abs(repChanges[item.rep].activeAccounts) >= 0.1 ? (
                                    <div className="flex items-center ml-1">
                                      {renderChangeIndicator(repChanges[item.rep].activeAccounts, 'small')}
                                      <span className="text-2xs ml-1 text-finance-gray">
                                        {formatNumber(Math.round(item.activeAccounts / (1 + (repChanges[item.rep]?.activeAccounts || 0) / 100)))}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="inline-flex items-center ml-1 text-finance-gray font-bold">
                                      <Minus className="h-4 w-4" />
                                    </span>
                                  )
                                )
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="bg-gray-800 border-white/10 text-white">
                            <p>
                              {shouldShowChangeIndicators ? (
                                <>
                                  Previous: {formatNumber(Math.round(item.activeAccounts / (1 + (repChanges[item.rep]?.activeAccounts || 0) / 100)))}
                                  {repChanges[item.rep]?.activeAccounts ? ` (${repChanges[item.rep].activeAccounts > 0 ? '+' : ''}${repChanges[item.rep].activeAccounts.toFixed(1)}%)` : ''}
                                </>
                              ) : `${item.rep}'s active/total accounts`}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center">
                              {formatNumber(item.packs)}
                              {shouldShowChangeIndicators && repChanges[item.rep] && Math.abs(repChanges[item.rep].packs) >= 0.1 ? (
                                <div className="flex items-center ml-1">
                                  {renderChangeIndicator(repChanges[item.rep].packs, 'small')}
                                  <span className="text-2xs ml-1 text-finance-gray">
                                    {formatNumber(Math.round(item.packs / (1 + (repChanges[item.rep]?.packs || 0) / 100)))}
                                  </span>
                                </div>
                              ) : shouldShowChangeIndicators ? (
                                <span className="inline-flex items-center ml-1 text-finance-gray font-bold">
                                  <Minus className="h-4 w-4" />
                                </span>
                              ) : null}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="bg-gray-800 border-white/10 text-white">
                            <p>
                              {shouldShowChangeIndicators ? (
                                <>
                                  Previous: {formatNumber(Math.round(item.packs / (1 + (repChanges[item.rep]?.packs || 0) / 100)))}
                                  {repChanges[item.rep]?.packs ? ` (${repChanges[item.rep].packs > 0 ? '+' : ''}${repChanges[item.rep].packs.toFixed(1)}%)` : ''}
                                </>
                              ) : `${item.rep}'s packs`}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="px-3 md:px-6 py-2 md:py-4 text-center text-xs md:text-sm text-finance-gray">
                  No data available for the selected filters
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PerformanceTable;
