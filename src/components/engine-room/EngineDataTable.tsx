
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Star, ArrowUp, ArrowDown, Filter, AlertTriangle, Info, Check, Edit } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import PriceEditor from './PriceEditor';
import CellDetailsPopover from './CellDetailsPopover';

interface EngineDataTableProps {
  data: any[];
  onShowPriceDetails: (item: any) => void;
  onPriceChange: (itemId: string, newPrice: number) => void;
  onToggleStar?: (itemId: string) => void;
  starredItems?: Set<string>;
  flagFilter?: string;
  onFlagFilterChange?: (filter: string) => void;
}

const EngineDataTable = ({ 
  data, 
  onShowPriceDetails, 
  onPriceChange, 
  onToggleStar, 
  starredItems = new Set(),
  flagFilter,
  onFlagFilterChange
}: EngineDataTableProps) => {
  const [sortField, setSortField] = useState<string>('usageRank');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<number | null>(null);
  const itemsPerPage = 50;

  // Format currency with £ symbol
  const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '£0.00';
    return `£${value.toFixed(2)}`;
  };

  // Format percentage
  const formatPercentage = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '0%';
    return `${(value * 100).toFixed(1)}%`;
  };

  // Handle sort click
  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Render sort indicator
  const renderSortIndicator = (field: string) => {
    if (field !== sortField) return null;
    
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-3 w-3 ml-1" /> 
      : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  // Filter and sort data
  const filteredData = data.filter(item => 
    item.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedData = [...filteredData].sort((a, b) => {
    let fieldA = a[sortField];
    let fieldB = b[sortField];
    
    // Handle null/undefined values
    if (fieldA === undefined || fieldA === null) fieldA = '';
    if (fieldB === undefined || fieldB === null) fieldB = '';
    
    if (typeof fieldA === 'string') {
      return sortDirection === 'asc' 
        ? fieldA.localeCompare(fieldB) 
        : fieldB.localeCompare(fieldA);
    } else {
      return sortDirection === 'asc' 
        ? fieldA - fieldB 
        : fieldB - fieldA;
    }
  });

  // Paginate the data
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

  // Handle price edit
  const handlePriceEdit = (itemId: string, currentPrice: number) => {
    setEditingItemId(itemId);
    setEditingPrice(currentPrice);
  };

  // Handle price save
  const handlePriceSave = () => {
    if (editingItemId && editingPrice !== null) {
      onPriceChange(editingItemId, editingPrice);
      setEditingItemId(null);
      setEditingPrice(null);
    }
  };

  // Handle price cancel
  const handlePriceCancel = () => {
    setEditingItemId(null);
    setEditingPrice(null);
  };

  // Handle star toggle
  const handleToggleStar = (event: React.MouseEvent, itemId: string) => {
    event.stopPropagation();
    if (onToggleStar) {
      onToggleStar(itemId);
    }
  };

  // Render flag badge
  const renderFlagBadge = (item: any) => {
    if (item.flag1 || (item.flags && item.flags.includes('HIGH_PRICE'))) {
      return (
        <Badge variant="outline" className="bg-red-900/20 text-red-400 border-red-900 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" /> High Price
        </Badge>
      );
    } else if (item.flag2 || (item.flags && item.flags.includes('LOW_MARGIN'))) {
      return (
        <Badge variant="outline" className="bg-amber-900/20 text-amber-400 border-amber-900 flex items-center gap-1">
          <Info className="h-3 w-3" /> Low Margin
        </Badge>
      );
    } else if (item.priceModified) {
      return (
        <Badge variant="outline" className="bg-blue-900/20 text-blue-400 border-blue-900 flex items-center gap-1">
          <Check className="h-3 w-3" /> Modified
        </Badge>
      );
    }
    return null;
  };

  return (
    <div className="border border-gray-800 rounded-md overflow-hidden">
      {/* Search and filter controls */}
      <div className="p-4 border-b border-gray-800 bg-gray-900/50 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Input
            placeholder="Search by description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
          <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        </div>
        
        {onFlagFilterChange && (
          <select 
            className="bg-gray-900/40 border border-gray-700 rounded-md px-2 py-2 text-sm"
            value={flagFilter || 'all'}
            onChange={(e) => onFlagFilterChange(e.target.value)}
          >
            <option value="all">All Flags</option>
            <option value="HIGH_PRICE">High Price</option>
            <option value="LOW_MARGIN">Low Margin</option>
          </select>
        )}
      </div>

      {/* Fixed Table Header outside of ScrollArea */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10 px-2">
              {/* Starred */}
            </TableHead>
            <TableHead 
              onClick={() => handleSort('description')}
              className="cursor-pointer min-w-[220px]"
            >
              <div className="flex items-center">
                Description
                {renderSortIndicator('description')}
              </div>
            </TableHead>
            <TableHead 
              onClick={() => handleSort('avgCost')}
              className="cursor-pointer w-24"
            >
              <div className="flex items-center">
                Cost
                {renderSortIndicator('avgCost')}
              </div>
            </TableHead>
            <TableHead 
              onClick={() => handleSort('nextBuyingPrice')}
              className="cursor-pointer w-24"
            >
              <div className="flex items-center">
                Next Cost
                {renderSortIndicator('nextBuyingPrice')}
              </div>
            </TableHead>
            <TableHead 
              onClick={() => handleSort('currentREVAPrice')}
              className="cursor-pointer w-28"
            >
              <div className="flex items-center">
                Current
                {renderSortIndicator('currentREVAPrice')}
              </div>
            </TableHead>
            <TableHead 
              onClick={() => handleSort('proposedPrice')}
              className="cursor-pointer w-28"
            >
              <div className="flex items-center">
                Proposed
                {renderSortIndicator('proposedPrice')}
              </div>
            </TableHead>
            <TableHead 
              onClick={() => handleSort('proposedMargin')}
              className="cursor-pointer w-20"
            >
              <div className="flex items-center">
                Margin
                {renderSortIndicator('proposedMargin')}
              </div>
            </TableHead>
            <TableHead 
              onClick={() => handleSort('usageRank')}
              className="cursor-pointer w-24"
            >
              <div className="flex items-center">
                Usage
                {renderSortIndicator('usageRank')}
              </div>
            </TableHead>
            <TableHead 
              onClick={() => handleSort('inStock')}
              className="cursor-pointer w-20"
            >
              <div className="flex items-center">
                Stock
                {renderSortIndicator('inStock')}
              </div>
            </TableHead>
            <TableHead 
              onClick={() => handleSort('reason')}
              className="cursor-pointer w-36"
            >
              <div className="flex items-center">
                Reason
                {renderSortIndicator('reason')}
              </div>
            </TableHead>
            <TableHead className="w-28">Actions</TableHead>
          </TableRow>
        </TableHeader>
      </Table>

      {/* Scrollable Table Body */}
      <div className="max-h-[calc(100vh-20rem)] overflow-auto">
        <Table>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-10">
                  No items found
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((item) => (
                <TableRow key={item.id} className="hover:bg-gray-800/40">
                  <TableCell className="w-10 px-2">
                    <Star 
                      className={`h-4 w-4 cursor-pointer ${starredItems.has(item.id) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400 hover:text-gray-300'}`}
                      onClick={(e) => handleToggleStar(e, item.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{item.description}</span>
                      {renderFlagBadge(item)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <CellDetailsPopover 
                      value={formatCurrency(item.avgCost)} 
                      items={[
                        { label: "Average Cost", value: formatCurrency(item.avgCost) },
                        { label: "Last Purchase", value: item.lastPurchase ? formatCurrency(item.lastPurchase) : 'N/A' }
                      ]}
                    />
                  </TableCell>
                  <TableCell>
                    <CellDetailsPopover 
                      value={formatCurrency(item.nextBuyingPrice)} 
                      items={[
                        { label: "Next Buying Price", value: formatCurrency(item.nextBuyingPrice) },
                        { label: "Current Cost", value: item.avgCost ? formatCurrency(item.avgCost) : 'N/A' }
                      ]}
                    />
                  </TableCell>
                  <TableCell>
                    <CellDetailsPopover 
                      value={formatCurrency(item.currentREVAPrice)} 
                      items={[
                        { label: "Current Price", value: formatCurrency(item.currentREVAPrice) },
                        { label: "Previous Price", value: item.previousPrice ? formatCurrency(item.previousPrice) : 'N/A' }
                      ]}
                    />
                  </TableCell>
                  <TableCell>
                    {editingItemId === item.id ? (
                      <PriceEditor
                        initialPrice={editingPrice || item.proposedPrice || item.currentREVAPrice}
                        currentPrice={item.currentREVAPrice}
                        calculatedPrice={item.proposedPrice || item.currentREVAPrice}
                        cost={item.nextBuyingPrice || item.avgCost}
                        onSave={handlePriceSave}
                        onCancel={handlePriceCancel}
                      />
                    ) : (
                      <CellDetailsPopover 
                        value={formatCurrency(item.proposedPrice || item.currentREVAPrice)} 
                        items={[
                          { label: "Proposed Price", value: formatCurrency(item.proposedPrice || item.currentREVAPrice) },
                          { label: "Current Price", value: formatCurrency(item.currentREVAPrice) }
                        ]}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <CellDetailsPopover 
                      value={formatPercentage(item.proposedMargin)} 
                      items={[
                        { label: "Proposed Margin", value: formatPercentage(item.proposedMargin) },
                        { label: "Current Margin", value: formatPercentage(item.currentREVAMargin) }
                      ]}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <span className="mr-1">{item.usageRank || 'N/A'}</span>
                      {item.revaUsage && (
                        <span className="text-xs text-gray-400">({item.revaUsage})</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <span className="mr-1">{item.inStock || 0}</span>
                      {item.onOrder > 0 && (
                        <span className="text-xs text-blue-400">(+{item.onOrder})</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[150px] truncate">
                      {item.reason || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => onShowPriceDetails(item)}
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => handlePriceEdit(item.id, item.proposedPrice || item.currentREVAPrice)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-800">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedData.length)} of {sortedData.length}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EngineDataTable;
