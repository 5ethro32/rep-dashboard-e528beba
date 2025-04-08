
import React from 'react';
import { Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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
  isLoading
}) => {
  return (
    <div className="overflow-x-auto -mx-3 md:mx-0 scrollbar-hide">
      <Table>
        <TableHeader>
          <TableRow className="bg-black/20 hover:bg-black/30">
            <TableHead 
              onClick={() => onSort('rep')}
              className="px-3 md:px-6 py-2 md:py-3 text-left text-2xs md:text-xs font-medium text-finance-gray uppercase cursor-pointer hover:bg-white/5 transition-colors"
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
              <TableCell colSpan={5} className="px-3 md:px-6 py-8 text-center">
                <div className="flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading data...</span>
                </div>
              </TableCell>
            </TableRow>
          ) : displayData.length > 0 ? (
            displayData.map((item) => (
              <TableRow key={item.rep} className="hover:bg-white/5 transition-colors">
                <TableCell className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm font-medium">
                  {item.rep}
                </TableCell>
                <TableCell className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm">
                  <div className="flex items-center">
                    {formatCurrency(item.spend)}
                    {repChanges[item.rep] && renderChangeIndicator(repChanges[item.rep].spend, 'small')}
                  </div>
                </TableCell>
                <TableCell className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-finance-red">
                  <div className="flex items-center">
                    {formatCurrency(item.profit)}
                    {repChanges[item.rep] && renderChangeIndicator(repChanges[item.rep].profit, 'small')}
                  </div>
                </TableCell>
                <TableCell className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm">
                  <div className="flex items-center">
                    {formatPercent(item.margin)}
                    {repChanges[item.rep] && renderChangeIndicator(repChanges[item.rep].margin, 'small')}
                  </div>
                </TableCell>
                <TableCell className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm">
                  <div className="flex items-center">
                    {formatNumber(item.packs)}
                    {repChanges[item.rep] && renderChangeIndicator(repChanges[item.rep].packs, 'small')}
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="px-3 md:px-6 py-2 md:py-4 text-center text-xs md:text-sm text-finance-gray">
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
