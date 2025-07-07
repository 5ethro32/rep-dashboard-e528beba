import React, { useMemo } from 'react';
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
import { 
  DailyRepTableData, 
  DailyRepTableComparisonData, 
  DailyRepTableSortConfig 
} from '@/types/daily-rep-performance.types';

interface DailyRepTableProps {
  data: DailyRepTableData[];
  comparisonData: DailyRepTableComparisonData[];
  sorting: DailyRepTableSortConfig;
  onSort: (column: DailyRepTableSortConfig['sortBy']) => void;
  isLoading?: boolean;
  showChangeIndicators?: boolean;
}

const DailyRepTable: React.FC<DailyRepTableProps> = ({
  data,
  comparisonData,
  sorting,
  onSort,
  isLoading = false,
  showChangeIndicators = true
}) => {
  
  // Debug: Log what data the table receives
  React.useEffect(() => {
    if (data.length > 0) {
      console.log('📋 DailyRepTable received data:', {
        count: data.length,
        firstRep: data[0].rep,
        firstRepActive: data[0].activeAccounts,
        allRepActive: data.map(r => ({ rep: r.rep, active: r.activeAccounts }))
      });
    }
  }, [data]);
  
  // Format currency values
  const formatCurrency = (value: number, decimals: number = 0): string => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  };

  // Format percentage values
  const formatPercent = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  // Format number values
  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('en-GB').format(Math.round(value));
  };

  // Render change indicator arrows
  const renderChangeIndicator = (changeValue: number, size: string = 'normal') => {
    if (Math.abs(changeValue) < 0.1) return null;
    
    const iconSize = size === 'small' ? 'h-3 w-3' : 'h-4 w-4';
    
    if (changeValue > 0) {
      return <ArrowUpRight className={`${iconSize} text-emerald-500`} />;
    } else {
      return <ArrowDownRight className={`${iconSize} text-finance-red`} />;
    }
  };

  // Create comparison map for easy lookup
  const comparisonMap = useMemo(() => {
    const map: Record<string, DailyRepTableComparisonData> = {};
    comparisonData.forEach(item => {
      map[item.rep] = item;
    });

    return map;
  }, [comparisonData]);

  // Debug comparison data
  React.useEffect(() => {
    console.log('🔍 COMPARISON DEBUG:', {
      comparisonDataLength: comparisonData.length,
      showChangeIndicators,
      comparisonMapSize: Object.keys(comparisonMap).length,
      firstComparison: comparisonData.length > 0 ? comparisonData[0] : null
    });
    
    if (comparisonData.length > 0 && data.length > 0) {
      const firstDataRep = data[0].rep;
      const comparisonForFirst = comparisonMap[firstDataRep];
      console.log('🔍 FIRST REP COMPARISON:', {
        rep: firstDataRep,
        hasComparison: !!comparisonForFirst,
        comparisonData: comparisonForFirst
      });
    }
  }, [data, comparisonData, showChangeIndicators, comparisonMap]);

  // Calculate the previous period's ranking based on the same sort criteria
  const prevRankings = useMemo(() => {
    if (!data.length || !showChangeIndicators || !comparisonData.length) return {};
    
    // Create previous data from comparison data
    const prevData = comparisonData.map(item => ({
      rep: item.rep,
      profit: item.comparison.profit,
      spend: item.comparison.spend,
      margin: item.comparison.margin,
      activeAccounts: item.comparison.activeAccounts,
      totalAccounts: item.comparison.totalAccounts,
      telesalesPercentage: item.comparison.telesalesPercentage
    }));
    
    // Sort previous data using the same criteria
    const sortField = sorting.sortBy;
    const sortMultiplier = sorting.sortOrder === 'desc' ? -1 : 1;
    
    prevData.sort((a, b) => (a[sortField] - b[sortField]) * sortMultiplier);
    
    // Create a map of rep name to previous rank
    return prevData.reduce((acc, item, index) => {
      acc[item.rep] = index + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [data, comparisonData, sorting, showChangeIndicators]);
  


  return (
    <div className="overflow-x-auto w-full -mx-3 md:mx-0">
      <div className="min-w-full">
        <Table>
          <TableHeader>
            <TableRow className="bg-black/20 hover:bg-black/30">
              <TableHead 
                className="px-3 md:px-6 py-2 md:py-3 text-left text-2xs md:text-xs font-medium text-finance-gray uppercase sticky left-0 z-20 bg-gray-900/90 backdrop-blur-sm border-r border-white/5"
              >
                Rep
              </TableHead>
              <TableHead 
                onClick={() => onSort('spend')}
                className="px-3 md:px-6 py-2 md:py-3 text-left text-2xs md:text-xs font-medium text-finance-gray uppercase cursor-pointer hover:bg-white/5 transition-colors min-w-[120px]"
              >
                Spend {sorting.sortBy === 'spend' && (sorting.sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead 
                onClick={() => onSort('profit')}
                className="px-3 md:px-6 py-2 md:py-3 text-left text-2xs md:text-xs font-medium text-finance-gray uppercase cursor-pointer hover:bg-white/5 transition-colors min-w-[120px]"
              >
                Profit {sorting.sortBy === 'profit' && (sorting.sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead 
                onClick={() => onSort('margin')}
                className="px-3 md:px-6 py-2 md:py-3 text-left text-2xs md:text-xs font-medium text-finance-gray uppercase cursor-pointer hover:bg-white/5 transition-colors min-w-[100px]"
              >
                Margin {sorting.sortBy === 'margin' && (sorting.sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead 
                onClick={() => onSort('activeAccounts')}
                className="px-3 md:px-6 py-2 md:py-3 text-left text-2xs md:text-xs font-medium text-finance-gray uppercase cursor-pointer hover:bg-white/5 transition-colors min-w-[140px]"
              >
                Active Customers {sorting.sortBy === 'activeAccounts' && (sorting.sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead 
                onClick={() => onSort('telesalesPercentage')}
                className="px-3 md:px-6 py-2 md:py-3 text-left text-2xs md:text-xs font-medium text-finance-gray uppercase cursor-pointer hover:bg-white/5 transition-colors min-w-[120px]"
              >
                Telesales % {sorting.sortBy === 'telesalesPercentage' && (sorting.sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="px-3 md:px-6 py-8 text-center">
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Loading rep data...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length > 0 ? (
              data.map((item, index) => {
                // Get comparison data for this rep
                const comparison = comparisonMap[item.rep];
                
                // Calculate rank change
                const currentRank = index + 1;
                const previousRank = prevRankings[item.rep] || currentRank;
                const rankChange = previousRank - currentRank;
                
                return (
                  <TableRow key={item.rep} className="hover:bg-white/5 transition-colors">
                    <TableCell className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm font-medium sticky left-0 z-10 bg-gray-900/90 backdrop-blur-sm border-r border-white/5">
                      <div className="flex items-center">
                        <span>{item.rep}</span>
                        {showChangeIndicators && comparison && rankChange !== 0 ? (
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
                        ) : showChangeIndicators && comparison ? (
                          <span className="ml-1.5 font-bold text-finance-gray">
                            <Minus className="h-4 w-4" />
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    
                    {/* Spend Column */}
                    <TableCell className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center">
                              {formatCurrency(item.spend)}
                              {showChangeIndicators && comparison && Math.abs(comparison.changes.spend) >= 0.1 ? (
                                <div className="flex items-center ml-1">
                                  {renderChangeIndicator(comparison.changes.spend, 'small')}
                                  <span className="text-2xs ml-1 text-finance-gray">
                                    {formatCurrency(comparison.comparison.spend, 0)}
                                  </span>
                                </div>
                              ) : showChangeIndicators && comparison ? (
                                <span className="inline-flex items-center ml-1 text-finance-gray font-bold">
                                  <Minus className="h-4 w-4" />
                                </span>
                              ) : null}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="bg-gray-800 border-white/10 text-white">
                            <p>
                              {showChangeIndicators && comparison ? (
                                <>
                                  Previous: {formatCurrency(comparison.comparison.spend)}
                                  {Math.abs(comparison.changes.spend) >= 0.1 ? ` (${comparison.changes.spend > 0 ? '+' : ''}${comparison.changes.spend.toFixed(1)}%)` : ''}
                                </>
                              ) : `${item.rep}'s spend`}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    
                    {/* Profit Column */}
                    <TableCell className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm font-bold text-white">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center">
                              {formatCurrency(item.profit)}
                              {showChangeIndicators && comparison && Math.abs(comparison.changes.profit) >= 0.1 ? (
                                <div className="flex items-center ml-1">
                                  {renderChangeIndicator(comparison.changes.profit, 'small')}
                                  <span className="text-2xs ml-1 text-finance-gray">
                                    {formatCurrency(comparison.comparison.profit, 0)}
                                  </span>
                                </div>
                              ) : showChangeIndicators && comparison ? (
                                <span className="inline-flex items-center ml-1 text-finance-gray font-bold">
                                  <Minus className="h-4 w-4" />
                                </span>
                              ) : null}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="bg-gray-800 border-white/10 text-white">
                            <p>
                              {showChangeIndicators && comparison ? (
                                <>
                                  Previous: {formatCurrency(comparison.comparison.profit)}
                                  {Math.abs(comparison.changes.profit) >= 0.1 ? ` (${comparison.changes.profit > 0 ? '+' : ''}${comparison.changes.profit.toFixed(1)}%)` : ''}
                                </>
                              ) : `${item.rep}'s profit`}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    
                    {/* Margin Column */}
                    <TableCell className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center">
                              {formatPercent(item.margin)}
                              {showChangeIndicators && comparison && Math.abs(comparison.changes.margin) >= 0.1 ? (
                                <div className="flex items-center ml-1">
                                  {renderChangeIndicator(comparison.changes.margin, 'small')}
                                  <span className="text-2xs ml-1 text-finance-gray">
                                    {formatPercent(comparison.comparison.margin)}
                                  </span>
                                </div>
                              ) : showChangeIndicators && comparison ? (
                                <span className="inline-flex items-center ml-1 text-finance-gray font-bold">
                                  <Minus className="h-4 w-4" />
                                </span>
                              ) : null}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="bg-gray-800 border-white/10 text-white">
                            <p>
                              {showChangeIndicators && comparison ? (
                                <>
                                  Previous: {formatPercent(comparison.comparison.margin)}
                                  {Math.abs(comparison.changes.margin) >= 0.1 ? ` (${comparison.changes.margin > 0 ? '+' : ''}${comparison.changes.margin.toFixed(1)}pp)` : ''}
                                </>
                              ) : `${item.rep}'s margin`}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    
                    {/* Accounts Column - FIXED: Show only unique customer count */}
                    <TableCell className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center">
                              {/* Debug: Log what we're trying to render */}
                              {item.rep === 'Craig McDowall' && (() => {
                                console.log('🔍 TABLE RENDER: Craig McDowall activeAccounts:', {
                                  raw: item.activeAccounts,
                                  type: typeof item.activeAccounts,
                                  formatted: formatNumber(item.activeAccounts || 0),
                                  mathRound: Math.round(item.activeAccounts || 0)
                                });
                                return null;
                              })()}
                              <span key={`${item.rep}-${item.activeAccounts}`} className="text-emerald-500 font-medium">{formatNumber(item.activeAccounts || 0)}</span>
                              {showChangeIndicators && comparison && Math.abs(comparison.changes.activeAccounts) >= 0.1 ? (
                                <div className="flex items-center ml-1">
                                  {renderChangeIndicator(comparison.changes.activeAccounts, 'small')}
                                  <span className="text-2xs ml-1 text-finance-gray">
                                    {formatNumber(comparison.comparison.activeAccounts)}
                                  </span>
                                </div>
                              ) : showChangeIndicators && comparison ? (
                                <span className="inline-flex items-center ml-1 text-finance-gray font-bold">
                                  <Minus className="h-4 w-4" />
                                </span>
                              ) : null}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="bg-gray-800 border-white/10 text-white">
                            <p>
                              {showChangeIndicators && comparison ? (
                                <>
                                  Previous: {formatNumber(comparison.comparison.activeAccounts)} unique customers
                                  {Math.abs(comparison.changes.activeAccounts) >= 0.1 ? ` (${comparison.changes.activeAccounts > 0 ? '+' : ''}${comparison.changes.activeAccounts.toFixed(1)}%)` : ''}
                                </>
                              ) : `${item.rep}'s unique customers`}
                            </p>
                            <p className="text-xs mt-1 text-gray-400">
                              Count of unique customers who had transactions with this rep in the selected period
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>

                                        {/* Telesales Percentage Column */}
                    <TableCell className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center">
                              <span className="text-blue-400">{formatPercent(item.telesalesPercentage)}</span>
                              {showChangeIndicators && comparison && Math.abs(comparison.changes.telesalesPercentage) >= 0.1 ? (
                                <div className="flex items-center ml-1">
                                  {renderChangeIndicator(comparison.changes.telesalesPercentage, 'small')}
                                  <span className="text-2xs ml-1 text-finance-gray">
                                    {formatPercent(comparison.comparison.telesalesPercentage)}
                                  </span>
                                </div>
                              ) : showChangeIndicators && comparison ? (
                                <span className="inline-flex items-center ml-1 text-finance-gray font-bold">
                                  <Minus className="h-4 w-4" />
                                </span>
                              ) : null}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="bg-gray-800 border-white/10 text-white">
                            <p>
                              {showChangeIndicators && comparison ? (
                                <>
                                  Previous: {formatPercent(comparison.comparison.telesalesPercentage)}
                                  {Math.abs(comparison.changes.telesalesPercentage) >= 0.1 ? ` (${comparison.changes.telesalesPercentage > 0 ? '+' : ''}${comparison.changes.telesalesPercentage.toFixed(1)}pp)` : ''}
                                </>
                              ) : `${item.rep}'s telesales profit percentage`}
                            </p>
                            <p className="text-xs mt-1 text-gray-400">
                              Telesales profit: {formatCurrency(item.telesalesProfit)}
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
                  No rep data available for the selected filters
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default DailyRepTable; 