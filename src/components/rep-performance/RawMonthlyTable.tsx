
import React from 'react';
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface RawMonthlyTableProps {
  displayData: any[];
  formatCurrency: (value: number, decimals?: number) => string;
  formatPercent: (value: number) => string;
  formatNumber: (value: number) => string;
  sortBy: string;
  sortOrder: string;
  onSort: (column: string) => void;
  isLoading?: boolean;
  selectedMonth: string;
  repChanges?: Record<string, any>;
}

const RawMonthlyTable: React.FC<RawMonthlyTableProps> = ({
  displayData,
  formatCurrency,
  formatPercent,
  formatNumber,
  sortBy,
  sortOrder,
  onSort,
  isLoading,
  selectedMonth,
  repChanges = {}
}) => {
  const getSortIcon = (columnName: string) => {
    if (sortBy !== columnName) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const getHeaderClass = (columnName: string) => {
    return cn(
      'cursor-pointer hover:bg-white/5',
      sortBy === columnName && 'bg-white/5'
    );
  };

  const renderChangeIndicator = (repName: string, metric: string, currentValue: number) => {
    if (selectedMonth !== 'April' || !repChanges[repName]) return null;

    const change = repChanges[repName][metric];
    if (!change && change !== 0) return null;

    return (
      <span className={cn(
        "inline-flex items-center ml-1 text-xs",
        change > 0 ? 'text-emerald-500' : 
        change < 0 ? 'text-finance-red' : 'text-finance-gray'
      )}>
        {change > 0 ? (
          <TrendingUp className="h-3 w-3 mr-1" />
        ) : (
          <TrendingDown className="h-3 w-3 mr-1" />
        )}
        <span className="text-2xs">
          ({formatNumber(Math.abs(change))})
        </span>
      </span>
    );
  };

  return (
    <div className="rounded-md border border-white/10">
      <Table>
        <TableHeader>
          <TableRow className="border-white/10 hover:bg-transparent">
            <TableHead 
              className={getHeaderClass('rep')}
              onClick={() => onSort('rep')}
            >
              Rep {getSortIcon('rep')}
            </TableHead>
            <TableHead 
              className={getHeaderClass('spend')}
              onClick={() => onSort('spend')}
            >
              Revenue {getSortIcon('spend')}
            </TableHead>
            <TableHead 
              className={getHeaderClass('profit')}
              onClick={() => onSort('profit')}
            >
              Profit {getSortIcon('profit')}
            </TableHead>
            <TableHead 
              className={getHeaderClass('margin')}
              onClick={() => onSort('margin')}
            >
              Margin {getSortIcon('margin')}
            </TableHead>
            <TableHead 
              className={getHeaderClass('packs')}
              onClick={() => onSort('packs')}
            >
              Packs {getSortIcon('packs')}
            </TableHead>
            <TableHead 
              className={getHeaderClass('activeAccounts')}
              onClick={() => onSort('activeAccounts')}
            >
              Active {getSortIcon('activeAccounts')}
            </TableHead>
            <TableHead 
              className={getHeaderClass('profitPerActiveShop')}
              onClick={() => onSort('profitPerActiveShop')}
            >
              £/Shop {getSortIcon('profitPerActiveShop')}
            </TableHead>
            <TableHead 
              className={getHeaderClass('profitPerPack')}
              onClick={() => onSort('profitPerPack')}
            >
              £/Pack {getSortIcon('profitPerPack')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayData.map((row, index) => (
            <TableRow 
              key={row.rep + index} 
              className="border-white/10 hover:bg-white/5"
            >
              <TableCell className="font-medium">
                {row.rep}
              </TableCell>
              <TableCell>
                {formatCurrency(row.spend)}
                {renderChangeIndicator(row.rep, 'spend', row.spend)}
              </TableCell>
              <TableCell className="text-finance-red">
                {formatCurrency(row.profit)}
                {renderChangeIndicator(row.rep, 'profit', row.profit)}
              </TableCell>
              <TableCell>
                {formatPercent(row.margin)}
                {renderChangeIndicator(row.rep, 'margin', row.margin)}
              </TableCell>
              <TableCell>
                {formatNumber(row.packs)}
                {renderChangeIndicator(row.rep, 'packs', row.packs)}
              </TableCell>
              <TableCell>
                {formatNumber(row.activeAccounts)}
                {renderChangeIndicator(row.rep, 'activeAccounts', row.activeAccounts)}
              </TableCell>
              <TableCell>
                {formatCurrency(row.profitPerActiveShop)}
                {renderChangeIndicator(row.rep, 'profitPerActiveShop', row.profitPerActiveShop)}
              </TableCell>
              <TableCell>
                {formatCurrency(row.profitPerPack)}
                {renderChangeIndicator(row.rep, 'profitPerPack', row.profitPerPack)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default RawMonthlyTable;
