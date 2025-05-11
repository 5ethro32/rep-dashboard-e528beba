
import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, ArrowUp, ArrowDown, Star, Edit2, CheckCircle, X, Filter, TrendingUp, TrendingDown } from 'lucide-react';
import { TooltipProvider } from "@/components/ui/tooltip";
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch'; // Add the Switch import here
import PriceEditor from './PriceEditor';
import CellDetailsPopover from './CellDetailsPopover';

interface EngineDataTableProps {
  data: any[];
  onShowPriceDetails: (item: any) => void;
  onPriceChange?: (item: any, newPrice: number) => void;
  onToggleStar?: (itemId: string) => void;
  starredItems?: Set<string>;
}

// Define column configuration outside component to avoid recreation on each render
const columns = [{
  field: 'description',
  label: 'Description',
  filterable: true
}, {
  field: 'inStock',
  label: 'In Stock',
  filterable: true
}, {
  field: 'revaUsage',
  label: 'Usage',
  filterable: false
}, {
  field: 'usageRank',
  label: 'Rank',
  filterable: true
}, {
  field: 'avgCost',
  label: 'Avg Cost',
  format: (value: number) => `£${value?.toFixed(2) || '0.00'}`,
  filterable: false
}, {
  field: 'marketLow',
  label: 'Market Low',
  format: (value: number) => `£${value?.toFixed(2) || '0.00'}`,
  filterable: false
}, {
  field: 'trueMarketLow',
  label: 'TML',
  format: (value: number) => `£${value?.toFixed(2) || '0.00'}`,
  filterable: false
}, {
  field: 'currentREVAPrice',
  label: 'Current Price',
  format: (value: number) => `£${value?.toFixed(2) || '0.00'}`,
  filterable: false,
  bold: true
}, {
  field: 'currentREVAMargin',
  label: 'Current Margin',
  format: (value: number) => `${(value * 100)?.toFixed(2) || '0.00'}%`,
  filterable: false
}, {
  field: 'proposedPrice',
  label: 'Proposed Price',
  format: (value: number) => `£${value?.toFixed(2) || '0.00'}`,
  editable: true,
  filterable: false,
  bold: true
}, {
  field: 'priceChangePercentage',
  label: '% Change',
  filterable: false
}, {
  field: 'proposedMargin',
  label: 'Proposed Margin',
  format: (value: number) => `${(value * 100)?.toFixed(2) || '0.00'}%`,
  filterable: false
}, {
  field: 'appliedRule',
  label: 'Rule',
  filterable: true
}];

const EngineDataTable: React.FC<EngineDataTableProps> = ({
  data,
  onShowPriceDetails,
  onPriceChange,
  onToggleStar,
  starredItems = new Set()
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string>('description');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<Record<string, number>>({});
  const [bulkEditMode, setBulkEditMode] = useState<boolean>(false);
  const [filterByRank, setFilterByRank] = useState<string | null>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, any>>({});
  const [hideInactiveProducts, setHideInactiveProducts] = useState(false);
  const itemsPerPage = 50; // Increased for larger tables

  // Extract unique usage ranks from the data for the dropdown
  const usageRanks = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const uniqueRanks = new Set<number>();
    data.forEach(item => {
      if (item.usageRank !== undefined && item.usageRank !== null) {
        uniqueRanks.add(item.usageRank);
      }
    });
    
    return Array.from(uniqueRanks).sort((a, b) => a - b);
  }, [data]);

  // We don't need to recalculate TML here anymore, just pass through the existing value
  const dataWithTml = useMemo(() => {
    if (!data) return [];
    return data;
  }, [data]);

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
    if (dataWithTml && dataWithTml.length > 0) {
      dataWithTml.forEach(item => {
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
  }, [dataWithTml]);

  // Get unique flags and show them in dropdown filter
  const uniqueFlags = useMemo(() => {
    const allFlags = new Set<string>();
    if (dataWithTml && dataWithTml.length > 0) {
      dataWithTml.forEach(item => {
        // Get flags from the flags array
        if (item.flags && Array.isArray(item.flags)) {
          item.flags.forEach((flag: string) => allFlags.add(flag));
        }
        
        // Get flag from the flag field
        if (item.flag && typeof item.flag === 'string' && item.flag.trim()) {
          allFlags.add(item.flag.trim());
        }
        
        // Add built-in flags
        if (item.flag1) allFlags.add('HIGH_PRICE');
        if (item.flag2) allFlags.add('LOW_MARGIN');
        if (item.shortage) allFlags.add('SHORT');
      });
    }
    return Array.from(allFlags);
  }, [dataWithTml]);

  // Calculate price change percentage
  const calculatePriceChangePercentage = (item: any) => {
    const currentPrice = item.currentREVAPrice || 0;
    const proposedPrice = item.proposedPrice || 0;
    if (currentPrice === 0) return 0;
    return (proposedPrice - currentPrice) / currentPrice * 100;
  };

  // Filter the data based on search query, usage rank filter, column filters, and toggle states
  const filteredData = useMemo(() => {
    if (!dataWithTml) return [];
    return dataWithTml.filter(item => {
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
            return columnFilters[field].some((flag: string) => item.flags.includes(flag) || flag === 'HIGH_PRICE' && item.flag1 || flag === 'LOW_MARGIN' && item.flag2 || flag === 'SHORT' && item.shortage);
          } else {
            // Handle legacy flag1/flag2/shortage properties
            return columnFilters[field].some((flag: string) => flag === 'HIGH_PRICE' && item.flag1 || flag === 'LOW_MARGIN' && item.flag2 || flag === 'SHORT' && item.shortage);
          }
        }
        return columnFilters[field].includes(item[field]);
      });

      // Only filter inactive products if the toggle is enabled
      const isActive = !hideInactiveProducts || item.inStock > 0 || item.onOrder > 0 || item.revaUsage > 0;

      return matchesSearch && matchesRankFilter && matchesColumnFilters && isActive;
    });
  }, [dataWithTml, searchQuery, filterByRank, columnFilters, hideInactiveProducts]);

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
        return sortDirection === 'asc' ? fieldA.localeCompare(fieldB) : fieldB.localeCompare(fieldA);
      } else {
        // Convert to strings if comparing mixed types
        if (typeof fieldA !== typeof fieldB) {
          if (typeof fieldA === 'string') {
            return sortDirection === 'asc' ? fieldA.localeCompare(String(fieldB)) : String(fieldB).localeCompare(fieldA);
          } else if (typeof fieldB === 'string') {
            return sortDirection === 'asc' ? String(fieldA).localeCompare(fieldB) : fieldB.localeCompare(String(fieldA));
          }
        }

        // Use numeric comparison for numbers or convert to string
        return sortDirection === 'asc' ? (Number(fieldA) || 0) - (Number(fieldB) || 0) : (Number(fieldB) || 0) - (Number(fieldA) || 0);
      }
    });
  }, [filteredData, sortField, sortDirection]);

  // Paginate the data
  const totalPages = Math.ceil((sortedData?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData && sortedData.length > 0 ? sortedData.slice(startIndex, startIndex + itemsPerPage) : [];

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
      const newFilter = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
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
    return sortDirection === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />;
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
      setEditingValues({
        ...editingValues,
        [item.id]: numValue
      });
    }
  };

  // Handle price edit save
  const handleSavePriceEdit = (item: any) => {
    if (onPriceChange && editingValues[item.id] !== undefined) {
      onPriceChange(item, editingValues[item.id]);
    }
    // Reset editing state for this item
    setEditingItemId(null);
    const newEditingValues = {
      ...editingValues
    };
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

  // Toggle the hide inactive products filter
  const toggleHideInactiveProducts = () => {
    setHideInactiveProducts(!hideInactiveProducts);
  };

  // Render the column header with sort and filter
  const renderColumnHeader = (column: any) => {
    return <CellDetailsPopover field={column.field} item={{}} isColumnHeader={true}>
        <div className="flex items-center justify-between">
          <div className="flex items-center cursor-pointer" onClick={() => handleSort(column.field)}>
            {column.label}
            {renderSortIndicator(column.field)}
          </div>
          
          {column.filterable && uniqueValues[column.field]?.length > 0 && <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className={`h-6 w-6 p-0 ml-2 ${columnFilters[column.field]?.length ? 'bg-primary/20' : ''}`} onClick={e => e.stopPropagation()}>
                  <Filter className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 max-h-80 overflow-y-auto">
                <div className="p-2">
                  <p className="text-sm font-medium">Filter by {column.label}</p>
                  <Input placeholder="Search..." className="h-8 mt-2" onChange={e => {
                // Filter dropdown options, not implemented fully
              }} />
                </div>
                <DropdownMenuSeparator />
                {uniqueValues[column.field]?.map((value, i) => <DropdownMenuCheckboxItem key={i} checked={columnFilters[column.field]?.includes(value)} onSelect={e => {
              e.preventDefault();
              handleFilterChange(column.field, value);
            }}>
                    {value !== null && value !== undefined ? typeof value === 'number' ? value.toString() : value : '(Empty)'}
                  </DropdownMenuCheckboxItem>)}
              </DropdownMenuContent>
            </DropdownMenu>}
        </div>
      </CellDetailsPopover>;
  };

  // Special case for flags column
  const renderFlagsColumnHeader = () => {
    return <div className="flex items-center justify-between">
        <span>Flags</span>
        {uniqueFlags.length > 0 && <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className={`h-6 w-6 p-0 ml-2 ${columnFilters['flags']?.length ? 'bg-primary/20' : ''}`}>
                <Filter className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {uniqueFlags.map((flag, i) => <DropdownMenuCheckboxItem key={i} checked={columnFilters['flags']?.includes(flag)} onSelect={e => {
            e.preventDefault();
            handleFilterChange('flags', flag);
          }}>
                  {flag}
                </DropdownMenuCheckboxItem>)}
            </DropdownMenuContent>
          </DropdownMenu>}
      </div>;
  };

  // Simplify rule display
  const formatRuleDisplay = (rule: string) => {
    if (!rule) return '';

    // Check if the rule follows the pattern "Grp X-Y" and convert to [X.Y]
    const rulePattern = /Grp\s*(\d+)-(\d+)/i;
    const match = rule.match(rulePattern);
    if (match) {
      return `[${match[1]}.${match[2]}]`;
    }
    return rule;
  };

  // Render flags for an item
  const renderFlags = (item: any) => {
    if (!item) return null;
    const flags = [];
    if (item.flag1) {
      flags.push(<span key="high-price" className="bg-red-900/30 text-xs px-1 py-0.5 rounded" title="Price ≥10% above TRUE MARKET LOW">
          HIGH_PRICE
        </span>);
    }
    if (item.flag2) {
      flags.push(<span key="low-margin" className="bg-orange-900/30 text-xs px-1 py-0.5 rounded" title="Margin < 3%">
          LOW_MARGIN
        </span>);
    }
    if (item.shortage) {
      flags.push(<span key="shortage" className="bg-purple-900/30 text-xs px-1 py-0.5 rounded" title="Product has supply shortage">
          SHORT
        </span>);
    }
    if (item.flags && Array.isArray(item.flags)) {
      item.flags.forEach((flag: string, i: number) => {
        if (flag === 'HIGH_PRICE' || flag === 'LOW_MARGIN' || flag === 'SHORT') return; // Skip duplicates
        flags.push(<span key={`flag-${i}`} className="bg-blue-900/30 text-xs px-1 py-0.5 rounded" title={flag}>
            {flag}
          </span>);
      });
    }
    return flags.length > 0 ? <div className="flex items-center gap-1">{flags}</div> : null;
  };

  // Active filters summary
  const renderActiveFilters = () => {
    const activeFilters = Object.entries(columnFilters).filter(([_, values]) => values && values.length > 0).map(([field, values]) => {
      const column = columns.find(col => col.field === field);
      const label = column ? column.label : field === 'flags' ? 'Flags' : field;
      return {
        field,
        label,
        values: Array.isArray(values) ? values : [values]
      };
    });
    if (activeFilters.length === 0) return null;
    return <div className="flex flex-wrap items-center gap-2 my-2 bg-gray-900/20 p-2 rounded-md">
        <span className="text-sm text-muted-foreground">Active filters:</span>
        {activeFilters.map((filter, i) => <div key={i} className="flex flex-wrap gap-1">
            <span className="text-sm">{filter.label}:</span>
            {filter.values.map((value, j) => <span key={j} className="bg-gray-800 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                {value}
                <Button variant="ghost" size="sm" className="h-4 w-4 p-0" onClick={() => handleFilterChange(filter.field, value)}>
                  <X className="h-3 w-3" />
                </Button>
              </span>)}
          </div>)}
        <Button variant="ghost" size="sm" className="h-6 p-1 text-xs" onClick={() => setColumnFilters({})}>
          Clear all
        </Button>
      </div>;
  };

  // Render a unified filter bar
  const renderUnifiedFilterBar = () => {
    return (
      <div className="flex flex-wrap gap-4 items-center mb-4">
        {/* Search box */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by description..." 
            className="pl-8" 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
          />
        </div>
        
        {/* Rank filter */}
        <Select value={filterByRank || ''} onValueChange={value => setFilterByRank(value === '' ? null : value)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Ranks" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Ranks</SelectItem>
            {usageRanks.map(rank => (
              <SelectItem key={rank} value={rank.toString()}>
                Rank {rank}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Flag filter */}
        <Select value={columnFilters['flags']?.[0] || ''} onValueChange={value => {
          if (value === '') {
            setColumnFilters(prev => {
              const newFilters = {...prev};
              delete newFilters['flags'];
              return newFilters;
            });
          } else {
            setColumnFilters(prev => ({...prev, flags: [value]}));
          }
        }}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter by flag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All flags</SelectItem>
            {uniqueFlags.map(flag => (
              <SelectItem key={flag} value={flag}>{flag}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Hide Inactive toggle */}
        <div className="flex items-center space-x-2">
          <Switch 
            id="hideInactive" 
            checked={hideInactiveProducts}
            onCheckedChange={setHideInactiveProducts}
          />
          <label htmlFor="hideInactive" className="text-sm cursor-pointer">
            Hide Inactive Products
          </label>
        </div>
        
        {/* Bulk Edit toggle */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={toggleBulkEditMode} 
          className={bulkEditMode ? "bg-primary/20" : ""}
        >
          {bulkEditMode ? "Exit Bulk Edit" : "Bulk Edit Prices"}
        </Button>
        
        {/* Starred items info */}
        <div className="flex items-center space-x-2">
          <Star className={`h-4 w-4 ${starredItems.size > 0 ? 'text-yellow-400' : 'text-muted-foreground'}`} />
          <span className="text-sm">
            {starredItems.size} items starred
          </span>
        </div>
      </div>
    );
  };

  // Render the data table with rows - Now used for one combined table
  const renderDataTable = () => {
    return (
      <div className="rounded-md border overflow-hidden">
        <ScrollArea className="h-[600px]">
          <Table>
            <TableHeader className="sticky top-0 z-10">
              <TableRow>
                {columns.map(column => (
                  <TableHead key={column.field} className="cursor-pointer bg-gray-900/70 hover:bg-gray-900">
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
              {paginatedData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length + 2} className="text-center py-10">
                    No items found matching your search criteria
                  </TableCell>
                </TableRow>
              )}
              {paginatedData.map((item, index) => {
                // Calculate price change percentage for each item
                const priceChangePercentage = calculatePriceChangePercentage(item);
                const isEditing = editingItemId === item.id;
                
                return (
                  <TableRow 
                    key={index} 
                    className={`${item.flag1 || item.flag2 || item.flags && item.flags.length > 0 ? 'bg-red-900/20' : ''} ${item.priceModified ? 'bg-blue-900/20' : ''}`}
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
                        <div className="flex items-center gap-1">
                          {formatCurrency(item.marketLow)}
                          {item.marketTrend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                          {item.marketTrend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                        </div>
                      </CellDetailsPopover>
                    </TableCell>
                    
                    {/* TML cell with popover - updated to use trueMarketLow */}
                    <TableCell>
                      <CellDetailsPopover item={item} field="trueMarketLow">
                        {formatCurrency(item.trueMarketLow)}
                      </CellDetailsPopover>
                    </TableCell>
                    
                    {/* Current Price cell with popover */}
                    <TableCell>
                      <CellDetailsPopover item={item} field="currentREVAPrice">
                        <span className="font-medium">{formatCurrency(item.currentREVAPrice)}</span>
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
                          onSave={newPrice => onPriceChange && onPriceChange(item, newPrice)} 
                          onCancel={() => {}} 
                          compact={true} 
                        />
                      ) : isEditing ? (
                        <div className="flex items-center gap-2">
                          <Input 
                            type="number" 
                            value={editingValues[item.id]} 
                            onChange={e => handlePriceInputChange(item, e.target.value)} 
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
                            <span className="font-medium">{formatCurrency(item.proposedPrice)}</span>
                            {item.priceModified && <CheckCircle className="h-3 w-3 ml-2 text-blue-400" />}
                            {onPriceChange && !bulkEditMode && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="ml-2 h-6 w-6 p-0" 
                                onClick={e => {
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
                    
                    <TableCell>{formatRuleDisplay(item.appliedRule)}</TableCell>
                    
                    {/* Flags cell */}
                    <TableCell>
                      {renderFlags(item)}
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => onShowPriceDetails(item)}
                        >
                          Details
                        </Button>
                        
                        {onToggleStar && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleStar(item.id);
                            }}
                          >
                            <Star
                              className={`h-4 w-4 ${starredItems.has(item.id) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`}
                            />
                          </Button>
                        )}
                      </div>
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

  // Pagination controls
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    return (
      <div className="flex items-center justify-between mt-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <div className="text-sm">
          Page {currentPage} of {totalPages} 
          ({sortedData.length} items)
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
          disabled={currentPage === totalPages || totalPages === 0}
        >
          Next
        </Button>
      </div>
    );
  };

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {renderUnifiedFilterBar()}
        {renderActiveFilters()}
        {renderDataTable()}
        {renderPagination()}
      </div>
    </TooltipProvider>
  );
};

export default EngineDataTable;
