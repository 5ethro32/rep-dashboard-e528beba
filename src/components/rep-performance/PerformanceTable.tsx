
import React from 'react';

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
  renderChangeIndicator
}) => {
  return (
    <div className="overflow-x-auto -mx-3 md:mx-0 scrollbar-hide">
      <table className="min-w-full divide-y divide-white/10 text-xs md:text-sm">
        <thead>
          <tr className="bg-black/20">
            <th 
              onClick={() => onSort('rep')}
              className="px-3 md:px-6 py-2 md:py-3 text-left text-2xs md:text-xs font-medium text-finance-gray uppercase cursor-pointer hover:bg-white/5 transition-colors"
            >
              Rep {sortBy === 'rep' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th 
              onClick={() => onSort('spend')}
              className="px-3 md:px-6 py-2 md:py-3 text-left text-2xs md:text-xs font-medium text-finance-gray uppercase cursor-pointer hover:bg-white/5 transition-colors"
            >
              Spend {sortBy === 'spend' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th 
              onClick={() => onSort('profit')}
              className="px-3 md:px-6 py-2 md:py-3 text-left text-2xs md:text-xs font-medium text-finance-gray uppercase cursor-pointer hover:bg-white/5 transition-colors"
            >
              Profit {sortBy === 'profit' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th 
              onClick={() => onSort('margin')}
              className="px-3 md:px-6 py-2 md:py-3 text-left text-2xs md:text-xs font-medium text-finance-gray uppercase cursor-pointer hover:bg-white/5 transition-colors"
            >
              Margin {sortBy === 'margin' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th 
              onClick={() => onSort('packs')}
              className="px-3 md:px-6 py-2 md:py-3 text-left text-2xs md:text-xs font-medium text-finance-gray uppercase cursor-pointer hover:bg-white/5 transition-colors"
            >
              Packs {sortBy === 'packs' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {displayData.length > 0 ? (
            displayData.map((item) => (
              <tr key={item.rep} className="hover:bg-white/5 transition-colors">
                <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm font-medium">
                  {item.rep}
                </td>
                <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm">
                  <div className="flex items-center">
                    {formatCurrency(item.spend)}
                    {repChanges[item.rep] && renderChangeIndicator(repChanges[item.rep].spend)}
                  </div>
                </td>
                <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-finance-red">
                  <div className="flex items-center">
                    {formatCurrency(item.profit)}
                    {repChanges[item.rep] && renderChangeIndicator(repChanges[item.rep].profit)}
                  </div>
                </td>
                <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm">
                  <div className="flex items-center">
                    {formatPercent(item.margin)}
                    {repChanges[item.rep] && renderChangeIndicator(repChanges[item.rep].margin)}
                  </div>
                </td>
                <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm">
                  <div className="flex items-center">
                    {formatNumber(item.packs)}
                    {repChanges[item.rep] && renderChangeIndicator(repChanges[item.rep].packs)}
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="px-3 md:px-6 py-2 md:py-4 text-center text-xs md:text-sm text-finance-gray">
                No data available for the selected filters
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PerformanceTable;
