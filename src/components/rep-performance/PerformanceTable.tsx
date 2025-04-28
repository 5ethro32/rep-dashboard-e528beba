import React, { useMemo, useEffect } from 'react';
import { Loader2, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
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
  showChangeIndicators?: boolean;
  previousMonthData: any[] | undefined;
}

const PerformanceTable: React.FC<PerformanceTableProps> = ({
  displayData,
  previousMonthData = [], // Provide default empty array
  repChanges,
  sortBy,
  sortOrder,
  onSort,
  formatCurrency,
  formatPercent,
  formatNumber,
  renderChangeIndicator,
  isLoading,
  showChangeIndicators = true
}) => {
  // Calculate previous values directly from previousMonthData with safety checks
  const getPreviousValue = (repName: string, metric: string) => {
    if (!previousMonthData || !Array.isArray(previousMonthData)) {
      return 0;
    }
    
    // Find the matching rep in the previous data
    const previousRecord = previousMonthData.find(record => record.rep === repName);
    return previousRecord ? previousRecord[metric] : 0;
  };
  
  // Debug the previous month data
  useEffect(() => {
    if (previousMonthData && previousMonthData.length > 0) {
      console.log('PerformanceTable: Previous month data sample:', 
        previousMonthData.slice(0, 3).map(d => ({ 
          rep: d.rep, 
          profit: d.profit, 
          spend: d.spend,
          packs: d.packs 
        }))
      );
      
      // Count by department
      const retailCount = previousMonthData.filter(d => !['REVA', 'Wholesale'].includes(d.rep)).length;
      const revaCount = previousMonthData.filter(d => d.rep === 'REVA').length;
      const wholesaleCount = previousMonthData.filter(d => d.rep === 'Wholesale').length;
      
      console.log('Previous month data department counts:', {
        total: previousMonthData.length,
        retail: retailCount,
        reva: revaCount,
        wholesale: wholesaleCount
      });
    }
  }, [previousMonthData]);

  // Calculate the previous month's ranking based on the same sort criteria
  const prevRankings = useMemo(() => {
    if (!previousMonthData || !showChangeIndicators) return {};
    
    // Sort previous month data using the same criteria
    const sortField = sortBy;
    const sortMultiplier = sortOrder === 'desc' ? -1 : 1;
    
    const sortedPrevData = [...previousMonthData].sort((a, b) => 
      (a[sortField] - b[sortField]) * sortMultiplier
    );
    
    // Create a map of rep name to previous rank
    return sortedPrevData.reduce((acc, item, index) => {
      acc[item.rep] = index + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [previousMonthData, sortBy, sortOrder, showChangeIndicators]);

  return (
    <div className="overflow-x-auto -mx-3 md:mx-0 scrollbar-hide relative">
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
              className="px-3 md:px-6 py-2 md:py-3 text-left text-2xs md:text-xs font-medium text-finance-gray uppercase cursor-pointer hover:bg-white/5 transition-colors"
            >
              Spend {sortBy === 'spend' && (sortOrder === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead 
              onClick={() => onSort('profit')}
              className="px-3 md:px-6 py-2 md:py-3 text-left text-2xs md:text-xs font-medium text-finance-gray uppercase cursor-pointer hover:bg-white/5 transition-colors"
            >
              Profit {sortBy === 'profit' && (sortOrder === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead 
              onClick={() => onSort('margin')}
              className="px-3 md:px-6 py-2 md:py-3 text-left text-2xs md:text-xs font-medium text-finance-gray uppercase cursor-pointer hover:bg-white/5 transition-colors"
            >
              Margin {sortBy === 'margin' && (sortOrder === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead 
              onClick={() => onSort('activeAccounts')}
              className="px-3 md:px-6 py-2 md:py-3 text-left text-2xs md:text-xs font-medium text-finance-gray uppercase cursor-pointer hover:bg-white/5 transition-colors"
            >
              Accounts {sortBy === 'activeAccounts' && (sortOrder === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead 
              onClick={() => onSort('packs')}
              className="px-3 md:px-6 py-2 md:py-3 text-left text-2xs md:text-xs font-medium text-finance-gray uppercase cursor-pointer hover:bg-white/5 transition-colors"
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
              
              const previousSpend = getPreviousValue(item.rep, 'spend');
              const previousProfit = getPreviousValue(item.rep, 'profit');
              const previousMargin = getPreviousValue(item.rep, 'margin');
              const previousPacks = getPreviousValue(item.rep, 'packs');
              const previousActiveAccounts = getPreviousValue(item.rep, 'activeAccounts');
              
              return (
                <TableRow key={item.rep} className="hover:bg-white/5 transition-colors">
                  <TableCell className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm font-medium sticky left-0 z-10 bg-gray-900/90 backdrop-blur-sm border-r border-white/5">
                    <div className="flex items-center">
                      <span>{item.rep}</span>
                      {showChangeIndicators && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="ml-1.5">
                                {rankChange > 0 ? (
                                  <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                                ) : rankChange < 0 ? (
                                  <ArrowDownRight className="h-4 w-4 text-finance-red" />
                                ) : (
                                  <Minus className="h-4 w-4 text-finance-gray font-bold" />
                                )}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="bg-gray-800 border-white/10 text-white">
                              <p>
                                {rankChange > 0
                                  ? `Up ${rankChange} ${rankChange === 1 ? 'position' : 'positions'} (was ${previousRank})`
                                  : rankChange < 0
                                  ? `Down ${Math.abs(rankChange)} ${Math.abs(rankChange) === 1 ? 'position' : 'positions'} (was ${previousRank})`
                                  : 'Position unchanged'}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center">
                            {formatCurrency(item.spend)}
                            {showChangeIndicators && (
                              <div className="flex items-center ml-1">
                                {renderChangeIndicator(((item.spend - previousSpend) / previousSpend) * 100, 'small')}
                                <span className="text-2xs ml-1 text-finance-gray">
                                  {formatCurrency(previousSpend, 0)}
                                </span>
                              </div>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          Previous Spend
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  
                  <TableCell className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-finance-red">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center">
                            {formatCurrency(item.profit)}
                            {showChangeIndicators && (
                              <div className="flex items-center ml-1">
                                {renderChangeIndicator(((item.profit - previousProfit) / previousProfit) * 100, 'small')}
                                <span className="text-2xs ml-1 text-finance-gray">
                                  {formatCurrency(previousProfit, 0)}
                                </span>
                              </div>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          Previous Profit
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
                            {showChangeIndicators && (
                              <div className="flex items-center ml-1">
                                {renderChangeIndicator(((item.margin - previousMargin) / previousMargin) * 100, 'small')}
                                <span className="text-2xs ml-1 text-finance-gray">
                                  {formatPercent(previousMargin)}
                                </span>
                              </div>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          Previous Margin
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
                            {showChangeIndicators && (
                              <div className="flex items-center ml-1">
                                {renderChangeIndicator(((item.activeAccounts - previousActiveAccounts) / previousActiveAccounts) * 100, 'small')}
                                <span className="text-2xs ml-1 text-finance-gray">
                                  {formatNumber(previousActiveAccounts)}
                                </span>
                              </div>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          Previous Active Accounts
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
                            {showChangeIndicators && (
                              <div className="flex items-center ml-1">
                                {renderChangeIndicator(((item.packs - previousPacks) / previousPacks) * 100, 'small')}
                                <span className="text-2xs ml-1 text-finance-gray">
                                  {formatNumber(previousPacks)}
                                </span>
                              </div>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          Previous Packs
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
  );
};

export default PerformanceTable;
