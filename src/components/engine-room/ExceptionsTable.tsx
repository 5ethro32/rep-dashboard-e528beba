
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, Filter, SlidersHorizontal, EyeOff } from 'lucide-react';
import CellDetailsPopover from './CellDetailsPopover';
import { formatCurrency, formatPercentage } from '@/utils/formatting-utils';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

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
  const [activeTab, setActiveTab] = useState('all');
  const [hideInactiveProducts, setHideInactiveProducts] = useState(false);
  const [rank, setRank] = useState('all');
  const [flagFilter, setFlagFilter] = useState('all');
  
  // Filter items based on the filter text and active tab
  const filteredData = React.useMemo(() => {
    let result = data;
    
    // First filter by tab selection
    if (activeTab === 'high-price') {
      result = result.filter(item => item.flag1 || item.flag === 'HIGH_PRICE');
    } else if (activeTab === 'low-margin') {
      result = result.filter(item => item.flag2 || item.flag === 'LOW_MARGIN');
    }
    
    // Apply text filter
    if (filter) {
      const lowercasedFilter = filter.toLowerCase();
      result = result.filter(item => 
        (item.description && item.description.toLowerCase().includes(lowercasedFilter)) ||
        (item.id && item.id.toLowerCase().includes(lowercasedFilter)) ||
        (item.flag && typeof item.flag === 'string' && item.flag.toLowerCase().includes(lowercasedFilter))
      );
    }
    
    // Apply rank filter
    if (rank !== 'all') {
      const rankNum = parseInt(rank);
      result = result.filter(item => {
        const itemRank = item.usageRank || item.rank;
        return itemRank === rankNum;
      });
    }
    
    // Apply flag filter
    if (flagFilter !== 'all') {
      result = result.filter(item => item.flag === flagFilter);
    }
    
    // Filter inactive products if enabled
    if (hideInactiveProducts) {
      result = result.filter(item => item.active !== false);
    }
    
    return result;
  }, [data, filter, activeTab, rank, flagFilter, hideInactiveProducts]);

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
  
  // Get all unique ranks from the data for filtering
  const getUniqueRanks = () => {
    if (!data) return [];
    
    const ranks = new Set<number>();
    data.forEach(item => {
      const rank = item.usageRank || item.rank;
      if (rank) ranks.add(rank);
    });
    
    return Array.from(ranks).sort((a, b) => a - b);
  };
  
  // Get all unique flags from the data for filtering
  const getUniqueFlags = () => {
    if (!data) return [];
    
    const flags = new Set<string>();
    data.forEach(item => {
      if (item.flag && typeof item.flag === 'string') {
        flags.add(item.flag);
      }
    });
    
    return Array.from(flags).sort();
  };
  
  const uniqueRanks = getUniqueRanks();
  const uniqueFlags = getUniqueFlags();
  
  return (
    <div className="space-y-4">
      {/* Tab navigation for exception types */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Exceptions</TabsTrigger>
          <TabsTrigger value="high-price">High Price</TabsTrigger>
          <TabsTrigger value="low-margin">Low Margin</TabsTrigger>
        </TabsList>
      </Tabs>
      
      {/* Filter controls */}
      <div className="flex flex-col gap-4">
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
        
        {/* Advanced filters */}
        <div className="flex flex-wrap items-center gap-3">
          {uniqueRanks.length > 0 && (
            <select 
              className="bg-gray-900/40 border border-white/10 text-sm rounded-md p-2" 
              value={rank}
              onChange={(e) => setRank(e.target.value)}
            >
              <option value="all">All Ranks</option>
              {uniqueRanks.map(r => (
                <option key={r} value={r}>Rank {r}</option>
              ))}
            </select>
          )}
          
          {uniqueFlags.length > 0 && (
            <select 
              className="bg-gray-900/40 border border-white/10 text-sm rounded-md p-2"
              value={flagFilter}
              onChange={(e) => setFlagFilter(e.target.value)}
            >
              <option value="all">All Flags</option>
              {uniqueFlags.map(flag => (
                <option key={flag} value={flag}>{flag}</option>
              ))}
            </select>
          )}
          
          <Button
            variant="outline"
            size="sm"
            className={`flex items-center gap-1 ${hideInactiveProducts ? 'bg-muted/50' : ''}`}
            onClick={() => setHideInactiveProducts(!hideInactiveProducts)}
          >
            <EyeOff className="h-3.5 w-3.5" />
            <span>Hide Inactive</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            onClick={() => {
              console.log("Bulk edit prices");
              // Add bulk edit functionality 
            }}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Bulk Edit Prices</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            onClick={() => {
              console.log("View starred items");
              // Add view starred functionality
            }}
          >
            <Star className="h-3.5 w-3.5" />
            <span>Starred Only</span>
          </Button>
        </div>
      </div>
      
      {/* Exceptions table with sticky header and first column */}
      <div className="rounded-md border bg-gray-900/40 backdrop-blur-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[calc(100vh-300px)]">
          <Table>
            <TableHeader className="sticky top-0 z-20 bg-gray-950/95 backdrop-blur-sm">
              <TableRow>
                <TableHead className="sticky left-0 z-30 bg-gray-950/95 backdrop-blur-sm w-12"></TableHead>
                <TableHead className="sticky left-12 z-30 bg-gray-950/95 backdrop-blur-sm min-w-[300px]">Description</TableHead>
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
              {filteredData.length > 0 ? filteredData.map((item) => {
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
                        field="avgCost"
                        item={item}
                      >
                        {formatCurrency(item.avgCost)}
                      </CellDetailsPopover>
                    </TableCell>
                    <TableCell className="text-right">
                      <CellDetailsPopover 
                        field="nextCost"
                        item={item}
                      >
                        {formatCurrency(item.nextCost || item.nextBuyingPrice)}
                      </CellDetailsPopover>
                    </TableCell>
                    <TableCell className="text-right">
                      <CellDetailsPopover 
                        field="marketLow"
                        item={item}
                      >
                        {formatCurrency(item.marketLow)}
                      </CellDetailsPopover>
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
              }) : (
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
