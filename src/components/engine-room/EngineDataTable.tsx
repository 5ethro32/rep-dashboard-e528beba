import React, { useState, useMemo, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ArrowUp, ArrowDown, Edit2, CheckCircle, X, Flag, Filter } from 'lucide-react';
import PriceEditor from './PriceEditor';
import CellDetailsPopover from './CellDetailsPopover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

interface EngineDataTableProps {
  data: any[];
  onShowPriceDetails: (item: any) => void;
  onPriceChange?: (item: any, newPrice: number) => void;
}

// Define column configuration outside component to avoid recreation on each render
const columns = [
  { field: 'description', label: 'Description', filterable: true },
  { field: 'inStock', label: 'In Stock', filterable: true },
  { field: 'revaUsage', label: 'Usage', filterable: false },
  { field: 'usageRank', label: 'Rank', filterable: true },
  { field: 'avgCost', label: 'Avg Cost', format: (value: number) => `£${value?.toFixed(2) || '0.00'}`, filterable: false },
  { field: 'marketLow', label: 'Market Low', format: (value: number) => `£${value?.toFixed(2) || '0.00'}`, filterable: false },
  { field: 'currentREVAPrice', label: 'Current Price', format: (value: number) => `£${value?.toFixed(2) || '0.00'}`, filterable: false },
  { field: 'currentREVAMargin', label: 'Current Margin', format: (value: number) => `${(value * 100)?.toFixed(2) || '0.00'}%`, filterable: false },
  { field: 'proposedPrice', label: 'Proposed Price', format: (value: number) => `£${value?.toFixed(2) || '0.00'}`, editable: true, filterable: false },
  { field: 'priceChangePercentage', label: '% Change', filterable: false },
  { field: 'proposedMargin', label: 'Proposed Margin', format: (value: number) => `${(value * 100)?.toFixed(2) || '0.00'}%`, filterable: false },
  { field: 'appliedRule', label: 'Rule', filterable: true },
];

const EngineDataTable: React.FC<EngineDataTableProps> = ({ data, onShowPriceDetails, onPriceChange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string>('description');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<Record<string, number>>({});
  const [bulkEditMode, setBulkEditMode] = useState<boolean>(false);
  const [filterByRank, setFilterByRank] = useState<string | null>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, any>>({});
  const itemsPerPage = 20;

  // Get unique values for each column to use in filters
  const uniqueValues = useMemo(() => {
    const values: Record<string, Set<any>> = {};
    
    // Initialize sets for each filterable column
    columns.forEach(column => {
      if (column.filterable) {
        values[column.field] = new Set();
      }
    });
    
    // Collect unique values
    if (data && data.length > 0) {
      data.forEach(item => {
        columns.forEach(column => {
          if (column.filterable && item[column.field] !== undefined && item[column.field] !== null) {
            values[column.field].add(item[column.field]);
          }
        });
      });
    }
    
    // Convert sets to sorted arrays
    const result: Record<string, any[]> = {};
    Object.keys(values).forEach(key => {
      result[key] = Array.from(values[key]).sort((a, b) => {
        if (typeof a === 'string' && typeof b === 'string') {
          return a.localeCompare(b);
        }
        return a - b;
      });
    });
    
    return result;
  }, [data]);

  // Collect unique flags separately to avoid circular reference
  const uniqueFlags = useMemo(() => {
    const allFlags = new Set<string>();
    
    if (data && data.length > 0) {
      data.forEach(item => {
        if (item.flags && Array.isArray(item.flags)) {
          item.flags.forEach((flag: string) => allFlags.add(flag));
        }
        if (item.flag1) allFlags.add('HIGH_PRICE');
        if (item.flag2) allFlags.add('LOW_MARGIN');
      });
    }
    
    return Array.from(allFlags);
  }, [data]);

  // Get unique usage ranks for filter dropdown
  const usageRanks = useMemo(() => {
    if (!data || data.length === 0) return [];
    return Array.from(new Set(data.map(item => item.usageRank))).sort((a, b) => a - b);
  }, [data]);

  // Calculate price change percentage
  const calculatePriceChangePercentage = (item: any) => {
    const currentPrice = item.currentREVAPrice || 0;
    const proposedPrice = item.proposedPrice || 0;
    
    if (currentPrice === 0) return 0;
    
    return ((proposedPrice - currentPrice) / currentPrice) * 100;
  };

  // Filter the data based on search query, usage rank filter, and column filters
  const filteredData = useMemo(() => {
    if (!data) return [];
    
    return data.filter((item) => {
      // Match search query
      const matchesSearch = item.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
      
      // Match usage rank filter
      const matchesRankFilter = filterByRank ? item.usageRank === parseInt(filterByRank, 10) : true;
      
      // Match all column filters
      const matchesColumnFilters = Object.keys(columnFilters).every(field => {
        if (!columnFilters[field] || columnFilters[field].length === 0) {
          return true;
        }
        
        if (field === 'flags') {
          // Special handling for flags which is an array or multiple flags
          if (Array.isArray(item.flags)) {
            return columnFilters[field].some((flag: string) => 
              item.flags.includes(flag) || 
              (flag === 'HIGH_PRICE' && item.flag1) || 
              (flag === 'LOW_MARGIN' && item.flag2)
            );
          } else {
            // Handle legacy flag1/flag2 properties
            return columnFilters[field].some((flag: string) => 
              (flag === 'HIGH_PRICE' && item.flag1) || 
              (flag === 'LOW_MARGIN' && item.flag2)
            );
          }
        }
        
        return columnFilters[field].includes(item[field]);
      });
      
      return matchesSearch && matchesRankFilter && matchesColumnFilters;
    });
  }, [data, searchQuery, filterByRank, columnFilters]);

  // Sort the filtered data
  const sortedData = useMemo(() => {
    if (!filteredData) return [];
    
    return [...filteredData].sort((a, b) => {
      let fieldA = a[sortField];
      let fieldB = b[sortField];
      
      // Handle special case for price change percentage
      if (sortField === 'priceChangePercentage') {
        const aChange = calculatePriceChangePercentage(a);
        const bChange = calculatePriceChangePercentage(b);
        return sortDirection === 'asc' ? aChange - bChange : bChange - aChange;
      }
      
      // Handle null/undefined values
      if (fieldA === undefined || fieldA === null) fieldA = sortField.includes('Price') ? 0 : '';
      if (fieldB === undefined || fieldB === null) fieldB = sortField.includes('Price') ? 0 : '';
      
      // Fix: Type-check before using string methods
      if (typeof fieldA === 'string' && typeof fieldB === 'string') {
        return sortDirection === 'asc' 
          ? fieldA.localeCompare(fieldB)
          : fieldB.localeCompare(fieldA);
      } else {
        // Convert to strings if comparing mixed types
        if (typeof fieldA !== typeof fieldB) {
          if (typeof fieldA === 'string') {
            return sortDirection === 'asc'
              ? fieldA.localeCompare(String(fieldB))
              : String(fieldB).localeCompare(fieldA);
          } else if (typeof fieldB === 'string') {
            return sortDirection === 'asc'
              ? String(fieldA).localeCompare(fieldB)
              : fieldB.localeCompare(String(fieldA));
          }
        }
        
        // Use numeric comparison for numbers or convert to string
        return sortDirection === 'asc'
          ? (Number(fieldA) || 0) - (Number(fieldB) || 0)
          : (Number(fieldB) || 0) - (Number(fieldA) || 0);
      }
    });
  }, [filteredData, sortField, sortDirection, calculatePriceChangePercentage]);

  // Paginate the data
  const totalPages = Math.ceil((sortedData?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = (sortedData && sortedData.length > 0) 
    ? sortedData.slice(startIndex, startIndex + itemsPerPage) 
    : [];

  // Group data by usage rank
  const groupedByRank = useMemo(() => {
    if (!sortedData || sortedData.length === 0) return {};
    
    return sortedData.reduce((acc: Record<string, any[]>, item: any) => {
      const rank = item.usageRank || 'Unknown';
      if (!acc[rank]) {
        acc[rank] = [];
      }
      acc[rank].push(item);
      return acc;
    }, {});
  }, [sortedData]);

  // Handle sort click
  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handle column filter change
  const handleFilterChange = (field: string, value: any) => {
    setColumnFilters(prev => {
      const current = prev[field] || [];
      
      // Toggle the value in the filter
      const newFilter = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
        
      return {
        ...prev,
        [field]: newFilter
      };
    });
    // Reset to first page when filter changes
    setCurrentPage(1);
  };

  // Format currency - with null/undefined check
  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) {
      return '£0.00';
    }
    return `£${value.toFixed(2)}`;
  };

  // Format percentage - with null/undefined check
  const formatPercentage = (value: number | null | undefined) => {
    if (value === null || value === undefined) {
      return '0.00%';
    }
    return `${(value * 100).toFixed(2)}%`;
  };

  // Render sort indicator
  const renderSortIndicator = (field: string) => {
    if (field !== sortField) return null;
    
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-3 w-3 ml-1" /> 
      : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  // Handle starting price edit for a specific item
  const handleStartEdit = (item: any) => {
    setEditingItemId(item.id);
    setEditingValues({
      ...editingValues,
      [item.id]: item.proposedPrice || 0
    });
  };

  // Handle price change input
  const handlePriceInputChange = (item: any, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setEditingValues({ ...editingValues, [item.id]: numValue });
    }
  };

  // Handle price edit save
  const handleSavePriceEdit = (item: any) => {
    if (onPriceChange && editingValues[item.id] !== undefined) {
      onPriceChange(item, editingValues[item.id]);
    }
    // Reset editing state for this item
    setEditingItemId(null);
    const newEditingValues = { ...editingValues };
    delete newEditingValues[item.id];
    setEditingValues(newEditingValues);
  };

  // Handle cancel price edit
  const handleCancelEdit = () => {
    setEditingItemId(null);
    // Keep the editingValues intact, just stop editing
  };

  // Toggle bulk edit mode
  const toggleBulkEditMode = () => {
    setBulkEditMode(!bulkEditMode);
    // Clear all edits when toggling bulk mode
    setEditingValues({});
    setEditingItemId(null);
  };

  // Render the column header with sort and filter
  const renderColumnHeader = (column: any) => {
    return (
      <CellDetailsPopover field={column.field} item={{}}>
        <div className="flex items-center justify-between">
          <div 
            className="flex items-center cursor-pointer"
            onClick={() => handleSort(column.field)}
          >
            {column.label}
            {renderSortIndicator(column.field)}
          </div>
          
          {column.filterable && uniqueValues[column.field]?.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`h-6 w-6 p-0 ml-2 ${columnFilters[column.field]?.length ? 'bg-primary/20' : ''}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Filter className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 max-h-80 overflow-y-auto">
                <div className="p-2">
                  <p className="text-sm font-medium">Filter by {column.label}</p>
                  <Input
                    placeholder="Search..."
                    className="h-8 mt-2"
                    onChange={(e) => {
                      // Filter dropdown options, not implemented fully
                    }}
                  />
                </div>
                <DropdownMenuSeparator />
                {uniqueValues[column.field]?.map((value, i) => (
                  <DropdownMenuCheckboxItem
                    key={i}
                    checked={columnFilters[column.field]?.includes(value)}
                    onSelect={(e) => {
                      e.preventDefault();
                      handleFilterChange(column.field, value);
                    }}
                  >
                    {value !== null && value !== undefined ? 
                      (typeof value === 'number' ? value.toString() : value) : 
                      '(Empty)'}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CellDetailsPopover>
    );
  };

  // Special case for flags column
  const renderFlagsColumnHeader = () => {
    return (
      <div className="flex items-center justify-between">
        <span>Flags</span>
        {uniqueFlags.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className={`h-6 w-6 p-0 ml-2 ${columnFilters['flags']?.length ? 'bg-primary/20' : ''}`}
              >
                <Filter className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {uniqueFlags.map((flag, i) => (
                <DropdownMenuCheckboxItem
                  key={i}
                  checked={columnFilters['flags']?.includes(flag)}
                  onSelect={(e) => {
                    e.preventDefault();
                    handleFilterChange('flags', flag);
                  }}
                >
                  {flag}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  };

  // Render flags for an item
  const renderFlags = (item: any) => {
    if (!item) return null;
    
    if (!item.flags || item.flags.length === 0) {
      if (!item.flag1 && !item.flag2) return null;
    }
    
    return (
      <div className="flex items-center gap-1">
        {item.flag1 && (
          <span className="bg-red-900/30 text-xs px-1 py-0.5 rounded" title="Price ≥10% above TRUE MARKET LOW">
            HIGH_PRICE
          </span>
        )}
        {item.flag2 && (
          <span className="bg-orange-900/30 text-xs px-1 py-0.5 rounded" title="Margin < 3%">
            LOW_MARGIN
          </span>
        )}
        {item.flags && Array.isArray(item.flags) && item.flags.map((flag: string, i: number) => {
          if (flag === 'HIGH_PRICE' || flag === 'LOW_MARGIN') return null; // Skip duplicates
          return (
            <span key={i} className="bg-blue-900/30 text-xs px-1 py-0.5 rounded" title={flag}>
              {flag}
            </span>
          );
        })}
      </div>
    );
  };

  // Active filters summary
  const renderActiveFilters = () => {
    const activeFilters = Object.entries(columnFilters)
      .filter(([_, values]) => values && values.length > 0)
      .map(([field, values]) => {
        const column = columns.find(col => col.field === field);
        const label = column ? column.label : field === 'flags' ? 'Flags' : field;
        return {
          field,
          label,
          values: Array.isArray(values) ? values : [values]
        };
      });

    if (activeFilters.length === 0) return null;

    return (
      <div className="flex flex-wrap items-center gap-2 my-2 bg-gray-900/20 p-2 rounded-md">
        <span className="text-sm text-muted-foreground">Active filters:</span>
        {activeFilters.map((filter, i) => (
          <div key={i} className="flex flex-wrap gap-1">
            <span className="text-sm">{filter.label}:</span>
            {filter.values.map((value, j) => (
              <span 
                key={j} 
                className="bg-gray-800 text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
              >
                {value}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0"
                  onClick={() => handleFilterChange(filter.field, value)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </span>
            ))}
          </div>
        ))}
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 p-1 text-xs"
          onClick={() => setColumnFilters({})}
        >
          Clear all
        </Button>
      </div>
    );
  };

  // Render the data table with rows
  const renderDataTable = (items: any[]) => {
    return (
      <div className="rounded-md border overflow-hidden">
        <ScrollArea className="h-[600px]">
          <Table>
            <TableHeader className="sticky top-0 z-10">
              <TableRow>
                {columns.map((column) => (
                  <TableHead 
                    key={column.field}
                    className="cursor-pointer bg-gray-900/70 hover:bg-gray-900"
                  >
                    {renderColumnHeader(column)}
                  </TableHead>
                ))}
                <TableHead className="bg-gray-900/70 sticky top-0">
                  {renderFlagsColumnHeader()}
                </TableHead>
                <TableHead className="bg-gray-900/70 sticky top-0">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length + 2} className="text-center py-10">
                    No items found matching your search criteria
                  </TableCell>
                </TableRow>
              )}
              {items.map((item, index) => {
                // Calculate price change percentage for each item
                const priceChangePercentage = calculatePriceChangePercentage(item);
                const isEditing = editingItemId === item.id;
                
                return (
                  <TableRow 
                    key={index} 
                    className={`${(item.flag1 || item.flag2 || (item.flags && item.flags.length > 0)) ? 'bg-red-900/20' : ''} ${item.priceModified ? 'bg-blue-900/20' : ''}`}
                  >
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{item.inStock}</TableCell>
                    <TableCell>{item.revaUsage}</TableCell>
                    <TableCell>{item.usageRank}</TableCell>
                    
                    {/* Avg Cost cell with popover */}
                    <TableCell>
                      <CellDetailsPopover item={item} field="avgCost">
                        {formatCurrency(item.avgCost)}
                      </CellDetailsPopover>
                    </TableCell>
                    
                    {/* Market Low cell with popover */}
                    <TableCell>
                      <CellDetailsPopover item={item} field="marketLow">
                        {formatCurrency(item.marketLow)}
                      </CellDetailsPopover>
                    </TableCell>
                    
                    {/* Current Price cell with popover */}
                    <TableCell>
                      <CellDetailsPopover item={item} field="currentREVAPrice">
                        {formatCurrency(item.currentREVAPrice)}
                      </CellDetailsPopover>
                    </TableCell>
                    
                    {/* Current Margin cell with popover */}
                    <TableCell>
                      <CellDetailsPopover item={item} field="currentREVAMargin">
                        {formatPercentage(item.currentREVAMargin)}
                      </CellDetailsPopover>
                    </TableCell>
                    
                    {/* Proposed price cell with inline editing */}
                    <TableCell>
                      {bulkEditMode && !item.priceModified ? (
                        <PriceEditor
                          initialPrice={item.proposedPrice || 0}
                          currentPrice={item.currentREVAPrice || 0}
                          calculatedPrice={item.calculatedPrice || item.proposedPrice || 0}
                          cost={item.avgCost || 0}
                          onSave={(newPrice) => onPriceChange && onPriceChange(item, newPrice)}
                          onCancel={() => {}}
                          compact={true}
                        />
                      ) : isEditing ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={editingValues[item.id]}
                            onChange={(e) => handlePriceInputChange(item, e.target.value)}
                            className="w-24 h-8 py-1 px-2"
                            autoFocus
                          />
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0" 
                            onClick={() => handleSavePriceEdit(item)}
                          >
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0"
                            onClick={handleCancelEdit}
                          >
                            <X className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      ) : (
                        <CellDetailsPopover item={item} field="proposedPrice">
                          <div className="flex items-center gap-2">
                            {formatCurrency(item.proposedPrice)}
                            {item.priceModified && (
                              <CheckCircle className="h-3 w-3 ml-2 text-blue-400" />
                            )}
                            {onPriceChange && !bulkEditMode && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="ml-2 h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartEdit(item);
                                }}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </CellDetailsPopover>
                      )}
                    </TableCell>
                    
                    {/* Price change percentage */}
                    <TableCell className={priceChangePercentage > 0 ? 'text-green-400' : priceChangePercentage < 0 ? 'text-red-400' : ''}>
                      {priceChangePercentage.toFixed(2)}%
                    </TableCell>
                    
                    {/* Proposed Margin with popover */}
                    <TableCell>
                      <CellDetailsPopover item={item} field="proposedMargin">
                        {formatPercentage(item.proposedMargin)}
                      </CellDetailsPopover>
                    </TableCell>
                    
                    <TableCell>{item.appliedRule}</TableCell>
                    
                    {/* Flags cell */}
                    <TableCell>
                      {renderFlags(item)}
                    </TableCell>
                    
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onShowPriceDetails(item)}
                      >
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    );
  };

  // Render the grouped items by usage rank
  const renderGroupedItems = () => {
    if (filterByRank) {
      // If filtering by rank, don't group
      return (
        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto">
            {renderDataTable(paginatedData)}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {Object.keys(groupedByRank).sort((a, b) => Number(a) - Number(b)).map((rank) => (
          <div key={rank} className="space-y-2">
            <h3 className="text-lg font-medium">Usage Rank {rank} ({groupedByRank[rank].length} items)</h3>
            <div className="rounded-md border overflow-hidden">
              <div className="overflow-x-auto">
                {renderDataTable(groupedByRank[rank].slice(0, itemsPerPage))}
              </div>
            </div>
            {groupedByRank[rank].length > itemsPerPage && (
              <div className="text-center text-sm text-muted-foreground mt-2">
                <Button 
                  variant="link" 
                  size="sm"
                  onClick={() => setFilterByRank(rank)}
                >
                  View all {groupedByRank[rank].length} items in Rank {rank}
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by description..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select 
            className="bg-gray-800 border border-gray-700 rounded-md px-2 py-2 text-sm w-32"
            value={filterByRank || ''}
            onChange={(e) => setFilterByRank(e.target.value || null)}
          >
            <option value="">All Ranks</option>
            {usageRanks.map(rank => (
              <option key={rank} value={rank}>Rank {rank}</option>
            ))}
          </select>
        </div>
        
        {onPriceChange && (
          <Button 
            variant={bulkEditMode ? "default" : "outline"} 
            size="sm" 
            onClick={toggleBulkEditMode}
          >
            {bulkEditMode ? (
              <>
                <X className="h-4 w-4 mr-2" />
                Exit Bulk Edit
              </>
            ) : (
              <>
                <Edit2 className="h-4 w-4 mr-2" />
                Bulk Edit Mode
              </>
            )}
          </Button>
        )}
      </div>
      
      {/* Active filters display */}
      {renderActiveFilters()}
      
      {/* Bulk edit mode notice */}
      {bulkEditMode && (
        <div className="bg-blue-900/20 p-3 rounded-md border border-blue-900/30">
          <p className="text-sm">
            <strong>Bulk Edit Mode:</strong> You can now edit multiple prices at once. Click "Save" on each item to apply changes.
          </p>
        </div>
      )}
      
      {filterByRank ? (
        renderDataTable(paginatedData)
      ) : (
        renderGroupedItems()
      )}
      
      {/* Pagination - only show when filtering by rank */}
      {filterByRank && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedData.length)} of {sortedData.length}
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
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
