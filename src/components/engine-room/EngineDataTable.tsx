import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Info, Star, FileText, ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';
import PriceEditor from './PriceEditor';
import CellDetailsPopover from './CellDetailsPopover';

// Column type for extra columns
export type ExtraColumn = {
  id: string;
  header: string;
  cell: (row: any) => React.ReactNode;
};

interface EngineDataTableProps {
  data: any[];
  onShowPriceDetails: (item: any) => void;
  onPriceChange: (item: any, newPrice: number) => void;
  onToggleStar: (itemId: string) => void;
  starredItems: Set<string>;
  flagFilter?: string;
  onFlagFilterChange?: (filter: string) => void;
  extraColumns?: ExtraColumn[]; // Added for the Changed tab
}

const EngineDataTable: React.FC<EngineDataTableProps> = ({
  data,
  onShowPriceDetails,
  onPriceChange,
  onToggleStar,
  starredItems,
  flagFilter,
  onFlagFilterChange,
  extraColumns = []
}) => {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  // Add sorting functionality
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Apply sorting to data
  const sortedData = useMemo(() => {
    const dataCopy = [...data];
    if (sortConfig !== null) {
      dataCopy.sort((a, b) => {
        if (a[sortConfig.key] === null || a[sortConfig.key] === undefined) return 1;
        if (b[sortConfig.key] === null || b[sortConfig.key] === undefined) return -1;
        
        // For numeric columns, use numeric comparison
        if (typeof a[sortConfig.key] === 'number' && typeof b[sortConfig.key] === 'number') {
          return sortConfig.direction === 'asc' 
            ? a[sortConfig.key] - b[sortConfig.key]
            : b[sortConfig.key] - a[sortConfig.key];
        }
        
        // Otherwise use string comparison
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return dataCopy;
  }, [data, sortConfig]);

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <span className="sr-only">Star</span>
            </TableHead>
            <TableHead className="w-10">
              <span className="sr-only">Flags</span>
            </TableHead>
            <TableHead>
              <div 
                className="flex items-center cursor-pointer"
                onClick={() => handleSort('description')}
              >
                Description
                {sortConfig?.key === 'description' && (
                  sortConfig.direction === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                )}
              </div>
            </TableHead>
            <TableHead className="text-right">
              <div 
                className="flex items-center justify-end cursor-pointer"
                onClick={() => handleSort('revaUsage')}
              >
                Usage
                {sortConfig?.key === 'revaUsage' && (
                  sortConfig.direction === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                )}
              </div>
            </TableHead>
            <TableHead className="text-right">
              <div 
                className="flex items-center justify-end cursor-pointer"
                onClick={() => handleSort('avgCost')}
              >
                Cost
                {sortConfig?.key === 'avgCost' && (
                  sortConfig.direction === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                )}
              </div>
            </TableHead>
            <TableHead className="text-right">
              <div 
                className="flex items-center justify-end cursor-pointer"
                onClick={() => handleSort('currentREVAPrice')}
              >
                Current Price
                {sortConfig?.key === 'currentREVAPrice' && (
                  sortConfig.direction === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                )}
              </div>
            </TableHead>
            <TableHead className="text-right">
              <div 
                className="flex items-center justify-end cursor-pointer"
                onClick={() => handleSort('currentREVAMargin')}
              >
                Current Margin %
                {sortConfig?.key === 'currentREVAMargin' && (
                  sortConfig.direction === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                )}
              </div>
            </TableHead>
            <TableHead className="text-right">
              <div 
                className="flex items-center justify-end cursor-pointer"
                onClick={() => handleSort('proposedPrice')}
              >
                Proposed Price
                {sortConfig?.key === 'proposedPrice' && (
                  sortConfig.direction === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                )}
              </div>
            </TableHead>
            <TableHead className="text-right">
              <div 
                className="flex items-center justify-end cursor-pointer"
                onClick={() => handleSort('proposedMargin')}
              >
                Proposed Margin %
                {sortConfig?.key === 'proposedMargin' && (
                  sortConfig.direction === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                )}
              </div>
            </TableHead>

            {/* Render extra columns if provided (for Changed tab) */}
            {extraColumns.map(column => (
              <TableHead key={column.id}>
                {column.header}
              </TableHead>
            ))}

            <TableHead className="text-right w-14">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9 + extraColumns.length} className="h-24 text-center">
                No items found.
              </TableCell>
            </TableRow>
          ) : (
            sortedData.map((item) => (
              <TableRow key={item.id} className={item.priceModified ? 'bg-gray-50/30 dark:bg-gray-800/30' : undefined}>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={starredItems.has(item.id) ? "text-yellow-500" : "text-gray-400"}
                    onClick={() => onToggleStar(item.id)}
                  >
                    <Star className="h-4 w-4" />
                  </Button>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-1">
                    {item.flag1 && (
                      <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                        HP
                      </Badge>
                    )}
                    {item.flag2 && (
                      <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                        LM
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium max-w-[200px] truncate" title={item.description}>
                    {item.description}
                  </div>
                  {item.priceModified && (
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 mt-1">
                      Modified
                    </Badge>
                  )}
                  {item.workflowStatus === 'submitted' && (
                    <Badge variant="outline" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 mt-1 ml-1">
                      Submitted
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">{item.revaUsage?.toLocaleString() || 0}</TableCell>
                <TableCell className="text-right">
                  <CellDetailsPopover
                    label={`£${Number(item.avgCost).toFixed(2)}`}
                    content={{
                      "Average Cost": `£${Number(item.avgCost).toFixed(2)}`,
                      "Next Buy Price": item.nextBuyingPrice ? `£${Number(item.nextBuyingPrice).toFixed(2)}` : "N/A"
                    }}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <CellDetailsPopover
                    label={`£${Number(item.currentREVAPrice).toFixed(2)}`}
                    content={{
                      "REVA Price": `£${Number(item.currentREVAPrice).toFixed(2)}`,
                      "ETH": item.ETH ? `£${Number(item.ETH).toFixed(2)}` : "N/A",
                      "AAH": item.AAH ? `£${Number(item.AAH).toFixed(2)}` : "N/A",
                      "Nupharm": item.Nupharm ? `£${Number(item.Nupharm).toFixed(2)}` : "N/A"
                    }}
                  />
                </TableCell>
                <TableCell className="text-right">
                  {item.currentREVAMargin 
                    ? `${(Number(item.currentREVAMargin) * 100).toFixed(2)}%` 
                    : "N/A"}
                </TableCell>
                <TableCell className="text-right">
                  <PriceEditor
                    item={item}
                    onSave={onPriceChange}
                    onCancel={() => {}}
                    compact={true}
                  />
                </TableCell>
                <TableCell className={`text-right ${Number(item.proposedMargin) < 0 ? 'text-red-500' : ''}`}>
                  {item.proposedMargin !== undefined 
                    ? `${(Number(item.proposedMargin) * 100).toFixed(2)}%` 
                    : "N/A"}
                </TableCell>

                {/* Render extra column cells if provided (for Changed tab) */}
                {extraColumns.map(column => (
                  <TableCell key={column.id}>
                    {column.cell(item)}
                  </TableCell>
                ))}

                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onShowPriceDetails(item)}
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {data.length > 0 && (
        <div className="py-2 px-4 border-t text-sm text-muted-foreground">
          Showing {sortedData.length} of {data.length} items
        </div>
      )}
    </div>
  );
};

export default EngineDataTable;
