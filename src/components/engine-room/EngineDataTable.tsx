import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Search, Star, Filter, Info, AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface EngineDataTableProps {
  data: any[];
  onShowPriceDetails?: (item: any) => void;
  onPriceChange?: (itemId: string, newPrice: number) => void;
  onToggleStar?: (itemId: string) => void;
  starredItems?: Set<string>;
  flagFilter?: string;
  onFlagFilterChange?: (flagType: string) => void;
}

const EngineDataTable: React.FC<EngineDataTableProps> = ({
  data,
  onShowPriceDetails,
  onPriceChange,
  onToggleStar,
  starredItems = new Set(),
  flagFilter,
  onFlagFilterChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPrices, setEditingPrices] = useState<Record<string, number>>({});
  const [sortField, setSortField] = useState<string>('description');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
  
  // FIX: Format the margin correctly - divide by 1 to ensure it's displayed as an actual percentage
  const formatMargin = (marginValue: number | string) => {
    if (marginValue === undefined || marginValue === null) {
      return '0.00%';
    }

    // Convert to number if it's a string
    const numericMargin = typeof marginValue === 'string' ? parseFloat(marginValue) : marginValue;

    // Make sure we're using the raw margin value (not multiplied by 100 already)
    return `${numericMargin.toFixed(2)}%`;
  };
  
  // Format currency
  const formatCurrency = (value: number) => {
    return `£${value.toFixed(2)}`;
  };

  // Determine trend icon
  const renderTrendIcon = (item: any) => {
    if (!item) return null;
    
    const isTrendDown = item.nextCost <= item.avgCost;
    
    return isTrendDown ? (
      <Badge variant="outline" className="bg-blue-900/20 text-blue-400 border-blue-900 gap-1">
        <TrendingDown className="h-3 w-3" /> DOWN
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-pink-900/20 text-pink-400 border-pink-900 gap-1">
        <TrendingUp className="h-3 w-3" /> UP
      </Badge>
    );
  };

  // Filter data based on search term
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const searchLower = searchTerm.toLowerCase();
      const descriptionMatch = item.description?.toLowerCase().includes(searchLower);
      const manufacturerMatch = item.manufacturer?.toLowerCase().includes(searchLower);
      
      return descriptionMatch || manufacturerMatch;
    });
  }, [data, searchTerm]);
  
  // Sort data based on the selected field
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      const fieldA = a[sortField];
      const fieldB = b[sortField];
      
      // Handle different data types for sorting
      if (typeof fieldA === 'string' && typeof fieldB === 'string') {
        return sortOrder === 'asc' 
          ? fieldA.localeCompare(fieldB) 
          : fieldB.localeCompare(fieldA);
      } else {
        // For numbers and other types
        if (fieldA === fieldB) return 0;
        if (fieldA === undefined || fieldA === null) return sortOrder === 'asc' ? -1 : 1;
        if (fieldB === undefined || fieldB === null) return sortOrder === 'asc' ? 1 : -1;
        
        return sortOrder === 'asc' 
          ? (fieldA > fieldB ? 1 : -1)
          : (fieldB > fieldA ? 1 : -1);
      }
    });
  }, [filteredData, sortField, sortOrder]);
  
  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage]);
  
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  
  // Handle sort toggle
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };
  
  // Handle price editing
  const handlePriceEdit = (itemId: string, currentPrice: number) => {
    setEditingPrices({
      ...editingPrices,
      [itemId]: currentPrice
    });
  };
  
  // Handle price change confirmation
  const handlePriceConfirm = (itemId: string) => {
    if (onPriceChange && editingPrices[itemId]) {
      onPriceChange(itemId, editingPrices[itemId]);
      
      // Clear the editing state for this item
      const newEditingPrices = { ...editingPrices };
      delete newEditingPrices[itemId];
      setEditingPrices(newEditingPrices);
    }
  };
  
  // Handle price input change
  const handlePriceInputChange = (itemId: string, value: string) => {
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue) && numericValue >= 0) {
      setEditingPrices({
        ...editingPrices,
        [itemId]: numericValue
      });
    }
  };
  
  // Handle price edit cancel
  const handlePriceCancel = (itemId: string) => {
    const newEditingPrices = { ...editingPrices };
    delete newEditingPrices[itemId];
    setEditingPrices(newEditingPrices);
  };
  
  // Render sort indicator
  const renderSortIndicator = (field: string) => {
    if (field !== sortField) return null;
    
    return sortOrder === 'asc' 
      ? <ChevronUp className="h-4 w-4 ml-1" /> 
      : <ChevronDown className="h-4 w-4 ml-1" />;
  };
  
  // Render price cell - editable or static
  const renderPriceCell = (item: any) => {
    if (onPriceChange && editingPrices[item.id] !== undefined) {
      return (
        <div className="flex items-center space-x-2">
          <Input
            type="number"
            value={editingPrices[item.id]}
            onChange={(e) => handlePriceInputChange(item.id, e.target.value)}
            className="w-20 h-8 text-xs"
            step="0.01"
            min="0"
          />
          <div className="flex space-x-1">
            <Button 
              size="sm" 
              variant="outline" 
              className="h-7 w-7 p-0" 
              onClick={() => handlePriceConfirm(item.id)}
            >
              <span className="text-green-500">✓</span>
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="h-7 w-7 p-0" 
              onClick={() => handlePriceCancel(item.id)}
            >
              <span className="text-red-500">×</span>
            </Button>
          </div>
        </div>
      );
    }
    
    const formatPrice = (price: number) => {
      return `£${price.toFixed(2)}`;
    };
    
    return (
      <div className="flex items-center justify-between">
        <span>
          {formatPrice(item.currentREVAPrice || 0)}
        </span>
        {onPriceChange && (
          <Button
            variant="ghost"
            className="h-7 w-7 p-0 opacity-50 hover:opacity-100"
            onClick={() => handlePriceEdit(item.id, item.currentREVAPrice || 0)}
          >
            <span className="text-xs">✎</span>
          </Button>
        )}
      </div>
    );
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 sm:space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by description or manufacturer..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {flagFilter !== undefined && onFlagFilterChange && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                Flag Filter: {flagFilter === 'all' ? 'All Flags' : flagFilter === 'HIGH_PRICE' ? 'High Price' : 'Low Margin'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onFlagFilterChange('all')}>
                All Flags
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onFlagFilterChange('HIGH_PRICE')}>
                High Price
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onFlagFilterChange('LOW_MARGIN')}>
                Low Margin
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      
      <div className="rounded-md border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {onToggleStar && (
                  <TableHead className="w-[40px]"></TableHead>
                )}
                <TableHead 
                  className="cursor-pointer whitespace-nowrap"
                  onClick={() => handleSort('description')}
                >
                  <div className="flex items-center">
                    Description {renderSortIndicator('description')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer whitespace-nowrap"
                  onClick={() => handleSort('revaUsage')}
                >
                  <div className="flex items-center">
                    REVA Usage {renderSortIndicator('revaUsage')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer whitespace-nowrap"
                  onClick={() => handleSort('usageRank')}
                >
                  <div className="flex items-center">
                    Usage Rank {renderSortIndicator('usageRank')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer whitespace-nowrap"
                  onClick={() => handleSort('avgCost')}
                >
                  <div className="flex items-center">
                    Avg Cost {renderSortIndicator('avgCost')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer whitespace-nowrap"
                  onClick={() => handleSort('currentREVAPrice')}
                >
                  <div className="flex items-center">
                    Current Price {renderSortIndicator('currentREVAPrice')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer whitespace-nowrap"
                  onClick={() => handleSort('currentREVAMargin')}
                >
                  <div className="flex items-center">
                    Current Margin {renderSortIndicator('currentREVAMargin')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer whitespace-nowrap"
                  onClick={() => handleSort('proposedPrice')}
                >
                  <div className="flex items-center">
                    Proposed Price {renderSortIndicator('proposedPrice')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer whitespace-nowrap"
                  onClick={() => handleSort('proposedMargin')}
                >
                  <div className="flex items-center">
                    Proposed Margin {renderSortIndicator('proposedMargin')}
                  </div>
                </TableHead>
                <TableHead className="whitespace-nowrap text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((item) => (
                <TableRow 
                  key={item.id || `${item.description}-${item.avgCost}`}
                  className={item.priceModified ? "bg-blue-950/20" : undefined}
                >
                  {onToggleStar && (
                    <TableCell className="p-0 pl-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => onToggleStar && onToggleStar(item.id)}
                      >
                        <Star 
                          className={`h-4 w-4 ${starredItems?.has(item.id) ? 'text-yellow-300 fill-yellow-300' : 'text-muted-foreground'}`}
                        />
                      </Button>
                    </TableCell>
                  )}
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <div className="flex items-center">
                        {item.description}
                        {item.flag1 && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex ml-2">
                                  <AlertTriangle className="h-4 w-4 text-red-400" />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="right">
                                <p>High price flag: Significantly above market average</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        {item.flag2 && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex ml-2">
                                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="right">
                                <p>Low margin flag: Margin below target threshold</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">{item.manufacturer || 'Unknown'}</div>
                    </div>
                  </TableCell>
                  <TableCell>{item.revaUsage || 0}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={
                      item.usageRank <= 2 ? "bg-green-900/30 text-green-400 border-green-900" : 
                      item.usageRank <= 4 ? "bg-amber-900/30 text-amber-400 border-amber-900" :
                      "bg-blue-900/30 text-blue-400 border-blue-900"
                    }>
                      {item.usageRank || '-'}
                    </Badge>
                  </TableCell>
                  <TableCell>£{(item.avgCost || 0).toFixed(2)}</TableCell>
                  <TableCell>{renderPriceCell(item)}</TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="cursor-default">
                          {formatMargin(item.currentREVAMargin)}
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <div className="p-1">
                            <div>Current Margin: {(item.currentREVAMargin).toFixed(1)}%</div>
                            <div>Target Margin: {item.targetMargin || 15.0}%</div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    {item.proposedPrice ? (
                      <div className="flex items-center space-x-1">
                        <span>£{item.proposedPrice.toFixed(2)}</span>
                        {item.proposedPrice > item.currentREVAPrice ? (
                          <TrendingUp className="h-4 w-4 text-green-400" />
                        ) : item.proposedPrice < item.currentREVAPrice ? (
                          <TrendingDown className="h-4 w-4 text-red-400" />
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {item.proposedMargin ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            {formatMargin(item.proposedMargin)}
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            <div className="p-1">
                              <div>Proposed Margin: {(item.proposedMargin).toFixed(1)}%</div>
                              <div>Current Margin: {(item.currentREVAMargin).toFixed(1)}%</div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onShowPriceDetails && onShowPriceDetails(item)}
                    >
                      <Info className="h-3 w-3 mr-1" /> Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * itemsPerPage + 1}-
            {Math.min(currentPage * itemsPerPage, sortedData.length)} of {sortedData.length}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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
