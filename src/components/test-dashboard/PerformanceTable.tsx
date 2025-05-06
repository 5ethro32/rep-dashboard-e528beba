import React from 'react';
import { Loader2, ArrowUpDown, ChevronUp, ChevronDown, Minus } from 'lucide-react';
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
import { RepPerformanceData } from '@/hooks/useRealDataForTest';
import { formatCurrency, formatPercent, formatNumber } from '@/utils/rep-performance-utils';

interface PerformanceTableProps {
  data: RepPerformanceData[];
  sortBy: string;
  sortOrder: string;
  onSort: (column: string) => void;
  isLoading?: boolean;
  showChangeIndicators?: boolean;
  getPreviousValue: (repName: string, metricType: string, currentValue: number) => number;
}

const PerformanceTable: React.FC<PerformanceTableProps> = ({
  data,
  sortBy,
  sortOrder,
  onSort,
  isLoading = false,
  showChangeIndicators = true,
  getPreviousValue
}) => {
  const renderSortIndicator = (column: string) => {
    if (sortBy === column) {
      return (
        <span className="ml-1">
          {sortOrder === 'asc' ? '↑' : '↓'}
        </span>
      );
    }
    return null;
  };

  // Helper to render change indicators with arrows
  const renderChangeIndicator = (currentValue: number, previousValue: number, size: 'small' | 'large' = 'small') => {
    // Calculate percentage change
    const percentChange = previousValue !== 0 
      ? ((currentValue - previousValue) / Math.abs(previousValue)) * 100 
      : currentValue > 0 ? 100 : 0;
    
    // If change is negligible, show a dash
    if (Math.abs(percentChange) < 0.1) {
      return (
        <span className="inline-flex items-center ml-1 text-finance-gray font-bold">
          <Minus className="h-4 w-4" />
        </span>
      );
    }
    
    // Determine if positive or negative change
    const isPositive = percentChange > 0;
    
    // Render with appropriate color and icon
    return (
      <span className={`inline-flex items-center ml-1 ${isPositive ? 'text-emerald-500' : 'text-finance-red'}`}>
        {isPositive ? 
          <ChevronUp className="h-4 w-4" /> : 
          <ChevronDown className="h-4 w-4" />
        }
        {size === 'large' && (
          <span className="text-xs font-medium ml-0.5">{Math.abs(percentChange).toFixed(1)}%</span>
        )}
      </span>
    );
  };

  return (
    <div className="overflow-x-auto -mx-2 md:mx-0 relative">
      <Table>
        <TableHeader>
          <TableRow className="bg-black/20 hover:bg-black/30">
            <TableHead 
              onClick={() => onSort('rep')}
              className="px-3 md:px-4 py-2 text-left text-xs font-medium text-finance-gray uppercase cursor-pointer hover:bg-white/5 transition-colors sticky left-0 z-20 bg-gray-900/90 backdrop-blur-sm border-r border-white/5"
            >
              Rep {renderSortIndicator('rep')}
            </TableHead>
            <TableHead 
              onClick={() => onSort('spend')}
              className="px-3 md:px-4 py-2 text-left text-xs font-medium text-finance-gray uppercase cursor-pointer hover:bg-white/5 transition-colors"
            >
              Spend {renderSortIndicator('spend')}
            </TableHead>
            <TableHead 
              onClick={() => onSort('profit')}
              className="px-3 md:px-4 py-2 text-left text-xs font-medium text-finance-gray uppercase cursor-pointer hover:bg-white/5 transition-colors"
            >
              Profit {renderSortIndicator('profit')}
            </TableHead>
            <TableHead 
              onClick={() => onSort('margin')}
              className="px-3 md:px-4 py-2 text-left text-xs font-medium text-finance-gray uppercase cursor-pointer hover:bg-white/5 transition-colors"
            >
              Margin {renderSortIndicator('margin')}
            </TableHead>
            <TableHead 
              onClick={() => onSort('activeAccounts')}
              className="px-3 md:px-4 py-2 text-left text-xs font-medium text-finance-gray uppercase cursor-pointer hover:bg-white/5 transition-colors"
            >
              Accounts {renderSortIndicator('activeAccounts')}
            </TableHead>
            <TableHead 
              onClick={() => onSort('packs')}
              className="px-3 md:px-4 py-2 text-left text-xs font-medium text-finance-gray uppercase cursor-pointer hover:bg-white/5 transition-colors"
            >
              Packs {renderSortIndicator('packs')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={6} className="px-3 md:px-4 py-8 text-center">
                <div className="flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading data...</span>
                </div>
              </TableCell>
            </TableRow>
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="px-3 md:px-4 py-8 text-center">
                <div className="text-finance-gray">
                  No data available for the selected filters
                </div>
              </TableCell>
            </TableRow>
          ) : (
            data.map((item, index) => {
              // Get previous values for comparison
              const prevSpend = getPreviousValue(item.rep, 'spend', item.spend);
              const prevProfit = getPreviousValue(item.rep, 'profit', item.profit);
              const prevMargin = getPreviousValue(item.rep, 'margin', item.margin);
              const prevPacks = getPreviousValue(item.rep, 'packs', item.packs);
              
              return (
              <TableRow key={item.rep} className="hover:bg-white/5 transition-colors">
                <TableCell className="px-3 md:px-4 py-2 whitespace-nowrap text-xs font-medium sticky left-0 z-10 bg-gray-900/90 backdrop-blur-sm border-r border-white/5">
                  {item.rep}
                </TableCell>
                
                <TableCell className="px-3 md:px-4 py-2 whitespace-nowrap text-xs">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center">
                          {formatCurrency(item.spend, 0)}
                          {showChangeIndicators && (
                            <div className="flex items-center">
                              {renderChangeIndicator(item.spend, prevSpend)}
                              <span className="text-2xs ml-1 text-finance-gray">
                                {formatCurrency(prevSpend, 0)}
                              </span>
                            </div>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="bg-gray-800 border-white/10 text-white">
                        <p>
                          {showChangeIndicators ? (
                            <>
                              Previous: {formatCurrency(prevSpend)}
                              {(Math.abs(((item.spend - prevSpend) / Math.abs(prevSpend)) * 100) >= 0.1) ? 
                                ` (${((item.spend - prevSpend) / Math.abs(prevSpend)) * 100 > 0 ? '+' : ''}${(((item.spend - prevSpend) / Math.abs(prevSpend)) * 100).toFixed(1)}%)` : ''}
                            </>
                          ) : `${item.rep}'s spend`}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                
                <TableCell className="px-3 md:px-4 py-2 whitespace-nowrap text-xs text-finance-red">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center">
                          {formatCurrency(item.profit, 0)}
                          {showChangeIndicators && (
                            <div className="flex items-center">
                              {renderChangeIndicator(item.profit, prevProfit)}
                              <span className="text-2xs ml-1 text-finance-gray">
                                {formatCurrency(prevProfit, 0)}
                              </span>
                            </div>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="bg-gray-800 border-white/10 text-white">
                        <p>
                          {showChangeIndicators ? (
                            <>
                              Previous: {formatCurrency(prevProfit)}
                              {(Math.abs(((item.profit - prevProfit) / Math.abs(prevProfit)) * 100) >= 0.1) ? 
                                ` (${((item.profit - prevProfit) / Math.abs(prevProfit)) * 100 > 0 ? '+' : ''}${(((item.profit - prevProfit) / Math.abs(prevProfit)) * 100).toFixed(1)}%)` : ''}
                            </>
                          ) : `${item.rep}'s profit`}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                
                <TableCell className="px-3 md:px-4 py-2 whitespace-nowrap text-xs">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center">
                          {formatPercent(item.margin)}
                          {showChangeIndicators && (
                            <div className="flex items-center">
                              {renderChangeIndicator(item.margin, prevMargin)}
                              <span className="text-2xs ml-1 text-finance-gray">
                                {formatPercent(prevMargin)}
                              </span>
                            </div>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="bg-gray-800 border-white/10 text-white">
                        <p>
                          {showChangeIndicators ? (
                            <>
                              Previous: {formatPercent(prevMargin)}
                              {(Math.abs(item.margin - prevMargin) >= 0.1) ? 
                                ` (${(item.margin - prevMargin) > 0 ? '+' : ''}${(item.margin - prevMargin).toFixed(1)}%)` : ''}
                            </>
                          ) : `${item.rep}'s margin`}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                
                <TableCell className="px-3 md:px-4 py-2 whitespace-nowrap text-xs">
                  <div className="flex items-center">
                    {formatNumber(item.activeAccounts)}
                    <span className="text-2xs ml-1 text-finance-gray">
                      /{formatNumber(item.totalAccounts)}
                    </span>
                  </div>
                </TableCell>
                
                <TableCell className="px-3 md:px-4 py-2 whitespace-nowrap text-xs">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center">
                          {formatNumber(item.packs)}
                          {showChangeIndicators && (
                            <div className="flex items-center">
                              {renderChangeIndicator(item.packs, prevPacks)}
                              <span className="text-2xs ml-1 text-finance-gray">
                                {formatNumber(prevPacks)}
                              </span>
                            </div>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="bg-gray-800 border-white/10 text-white">
                        <p>
                          {showChangeIndicators ? (
                            <>
                              Previous: {formatNumber(prevPacks)}
                              {(Math.abs(((item.packs - prevPacks) / Math.abs(prevPacks)) * 100) >= 0.1) ? 
                                ` (${((item.packs - prevPacks) / Math.abs(prevPacks)) * 100 > 0 ? '+' : ''}${(((item.packs - prevPacks) / Math.abs(prevPacks)) * 100).toFixed(1)}%)` : ''}
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
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default PerformanceTable; 