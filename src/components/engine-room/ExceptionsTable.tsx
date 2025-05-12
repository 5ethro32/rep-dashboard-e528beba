
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Star, Filter } from 'lucide-react';
import CellDetailsPopover from './CellDetailsPopover';
import { formatCurrency, formatPercentage } from '@/utils/engine-excel-utils';

interface ExceptionsTableProps {
  data: any[];
  onShowPriceDetails: (item: any) => void;
  onPriceChange?: (itemId: string, newPrice: number) => void;
  onToggleStar?: (itemId: string) => void;
  starredItems?: Set<string>;
}

const ExceptionsTable: React.FC<ExceptionsTableProps> = ({
  data,
  onShowPriceDetails,
  onPriceChange,
  onToggleStar,
  starredItems = new Set()
}) => {
  const [filter, setFilter] = useState('');
  
  // Filter items based on the filter text
  const filteredData = React.useMemo(() => {
    if (!filter) return data;
    
    const lowercasedFilter = filter.toLowerCase();
    return data.filter(item => 
      (item.description && item.description.toLowerCase().includes(lowercasedFilter)) ||
      (item.id && item.id.toLowerCase().includes(lowercasedFilter)) ||
      (item.flag && typeof item.flag === 'string' && item.flag.toLowerCase().includes(lowercasedFilter))
    );
  }, [data, filter]);

  // Handle item click to show pricing details
  const handleItemClick = (item: any) => {
    onShowPriceDetails(item);
  };

  // Format percentage with specified color based on value
  const formatPercentWithColor = (value: number) => {
    if (value === undefined || value === null) return '—';
    
    const formattedValue = formatPercentage(value);
    if (value < 0.05) {
      return <span className="text-finance-red">{formattedValue}</span>;
    } else if (value > 0.15) {
      return <span className="text-emerald-500">{formattedValue}</span>;
    }
    return formattedValue;
  };
  
  // Helper function to determine flag type and return appropriate badge
  const getFlagBadge = (item: any) => {
    if (item.flag1) {
      return <Badge variant="destructive">High Price</Badge>;
    } else if (item.flag2) {
      return <Badge variant="warning">Low Margin</Badge>;
    } else if (item.flag) {
      return <Badge>{item.flag}</Badge>;
    }
    return null;
  };

  // Calculate the percentage to market low
  const getPercentToMarketLow = (item: any) => {
    if (!item.proposedPrice || !item.marketLow || item.marketLow === 0) return null;
    return (item.proposedPrice - item.marketLow) / item.marketLow;
  };
  
  return (
    <div className="space-y-4">
      {/* Filter controls */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter items..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          Showing {filteredData.length} of {data.length} items
        </div>
      </div>
      
      {/* Exceptions table with sticky header and first column */}
      <div className="rounded-md border bg-gray-900/40 backdrop-blur-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[calc(100vh-300px)]">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-gray-950/90 backdrop-blur-sm">
              <TableRow>
                <TableHead className="sticky left-0 z-20 bg-gray-950/90 backdrop-blur-sm w-12"></TableHead>
                <TableHead className="sticky left-12 z-20 bg-gray-950/90 backdrop-blur-sm min-w-[300px]">Description</TableHead>
                <TableHead className="text-right">Usage</TableHead>
                <TableHead className="text-right">Avg Cost</TableHead>
                <TableHead className="text-right">Next Price</TableHead>
                <TableHead className="text-right">Market Low</TableHead>
                <TableHead className="text-right">Current Price</TableHead>
                <TableHead className="text-right">Current Margin</TableHead>
                <TableHead className="text-right">Proposed Price</TableHead>
                <TableHead className="text-right">Proposed Margin</TableHead>
                <TableHead className="text-right">% to Market Low</TableHead>
                <TableHead>Flag</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item) => {
                const percentToMarketLow = getPercentToMarketLow(item);
                return (
                  <TableRow 
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className="cursor-pointer hover:bg-gray-800/40"
                  >
                    <TableCell className="sticky left-0 z-10 bg-inherit w-12">
                      {onToggleStar && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleStar(item.id);
                          }}
                          className="h-8 w-8"
                        >
                          <Star
                            className={`h-4 w-4 ${starredItems.has(item.id) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                          />
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="sticky left-12 z-10 bg-inherit font-medium">
                      {item.description}
                    </TableCell>
                    <TableCell className="text-right">{item.revaUsage || '—'}</TableCell>
                    <TableCell className="text-right">
                      <CellDetailsPopover 
                        title="Average Cost" 
                        value={formatCurrency(item.avgCost)}
                        details={[
                          { label: "Average Cost", value: formatCurrency(item.avgCost) },
                          { label: "Last Purchase", value: formatCurrency(item.lastPurchase) }
                        ]}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <CellDetailsPopover 
                        title="Next Price" 
                        value={formatCurrency(item.nextCost || item.nextBuyingPrice)}
                        details={[
                          { label: "Next Cost", value: formatCurrency(item.nextCost || item.nextBuyingPrice) },
                          { label: "Trend", value: item.trend === 'TrendDown' ? 'Decreasing' : 'Stable/Increasing' }
                        ]}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <CellDetailsPopover 
                        title="Market Low" 
                        value={formatCurrency(item.marketLow)}
                        details={[
                          { label: "Market Low", value: formatCurrency(item.marketLow) },
                          { label: "True Market Low", value: formatCurrency(item.trueMarketLow) },
                          { label: "ETH NET", value: formatCurrency(item["ETH NET"]) },
                          { label: "Nupharm", value: formatCurrency(item.Nupharm) },
                          { label: "LEXON", value: formatCurrency(item.LEXON) },
                          { label: "AAH", value: formatCurrency(item.AAH) }
                        ]}
                      />
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(item.currentREVAPrice)}</TableCell>
                    <TableCell className="text-right">{formatPercentWithColor(item.currentREVAMargin)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(item.proposedPrice)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatPercentWithColor(item.proposedMargin)}</TableCell>
                    <TableCell className="text-right">
                      {percentToMarketLow !== null ? formatPercentage(percentToMarketLow) : '—'}
                    </TableCell>
                    <TableCell>{getFlagBadge(item)}</TableCell>
                  </TableRow>
                );
              })}
              {filteredData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={12} className="h-24 text-center">
                    No items match the filter criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default ExceptionsTable;
