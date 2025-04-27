
import React from 'react';
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from '@/components/ui/table';
import { cn } from '@/lib/utils';

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
              <TableCell className="font-medium">{row.rep}</TableCell>
              <TableCell>{formatCurrency(row.spend)}</TableCell>
              <TableCell className="text-finance-red">
                {formatCurrency(row.profit)}
              </TableCell>
              <TableCell>{formatPercent(row.margin)}</TableCell>
              <TableCell>{formatNumber(row.packs)}</TableCell>
              <TableCell>{formatNumber(row.activeAccounts)}</TableCell>
              <TableCell>{formatCurrency(row.profitPerActiveShop)}</TableCell>
              <TableCell>{formatCurrency(row.profitPerPack)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default RawMonthlyTable;
