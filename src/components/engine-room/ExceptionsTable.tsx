
import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Download, 
  Edit2, 
  CheckCircle, 
  X, 
  Search, 
  ArrowUp, 
  ArrowDown, 
  Flag, 
  Star, 
  TrendingUp, 
  TrendingDown, 
  Filter, 
  ChevronDown, 
  ChevronRight, 
  ChevronUp,
  SlidersHorizontal,
  UnfoldVertical 
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import PriceEditor from './PriceEditor';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency, formatPercentage, isTrendDown } from '@/utils/trend-utils'; 
import CellDetailsHoverCard from './CellDetailsHoverCard';

interface ExceptionsTableProps {
  data: any[];
  onShowPriceDetails: (item: any) => void;
  onPriceChange?: (item: any, newPrice: number) => void;
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
  // Extract flagged items by type
  const highPriceItems = useMemo(() => 
    data ? data.filter(item => item.flag1) : [], 
  [data]);
  
  const lowMarginItems = useMemo(() => 
    data ? data.filter(item => item.flag2) : [], 
  [data]);
  
  // Extract other flags from the flags array
  const flaggedItemsByType = useMemo(() => {
    if (!data) return {};
    
    const flagged: Record<string, any[]> = {};
    const flagSet = new Set<string>();
    
    data.forEach(item => {
      if (item.flags && Array.isArray(item.flags)) {
        item.flags.forEach((flag: string) => {
          if (flag !== 'HIGH_PRICE' && flag !== 'LOW_MARGIN') {
            flagSet.add(flag);
            if (!flagged[flag]) {
              flagged[flag] = [];
            }
            flagged[flag].push(item);
          }
        });
      }
    });
    
    return flagged;
  }, [data]);
  
  const uniqueOtherFlags = useMemo(() => 
    Object.keys(flaggedItemsByType),
  [flaggedItemsByType]);
  
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<Record<string, number>>({});
  const [bulkEditMode, setBulkEditMode] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<string>('usageRank');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [columnFilters, setColumnFilters] = useState<Record<string, any>>({});
  const [hideInactiveProducts, setHideInactiveProducts] = useState(false);
  const [showShortageOnly, setShowShortageOnly] = useState(false);
  const [selectedRules, setSelectedRules] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'highPrice' | 'lowMargin' | 'other'>('highPrice');
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set([
    'description', 'usageRank', 'avgCost', 'currentREVAPrice', 'proposedPrice', 
    'priceChangePercentage', 'marketLow', 'nextBuyingPrice', 'trueMarketLow', 'proposedMargin', 
    'flags', 'appliedRule', 'inStock', 'onOrder'
  ]));

  // Define columns configuration
  const columns = useMemo(() => [
    {
      field: 'description',
      label: 'Description',
      filterable: true,
      sticky: true
    }, {
      field: 'inStock',
      label: 'In Stock',
      filterable: false,
    }, {
      field: 'revaUsage',
      label: 'Usage',
      filterable: false,
    }, {
      field: 'usageRank',
      label: 'Rank',
      filterable: true,
    }, {
      field: 'avgCost',
      label: 'Avg Cost',
      format: (value: number) => formatCurrency(value),
      filterable: false,
    }, {
      field: 'nextBuyingPrice',
      label: 'Next Price',
      format: (value: number) => formatCurrency(value),
      filterable: false,
    }, {
      field: 'marketLow',
      label: 'Market Low',
      format: (value: number) => formatCurrency(value),
      filterable: false,
    }, {
      field: 'trueMarketLow',
      label: 'TML',
      format: (value: number) => formatCurrency(value),
      filterable: false,
    }, {
      field: 'currentREVAPrice',
      label: 'Current Price',
      format: (value: number) => formatCurrency(value),
      filterable: false,
      bold: true
    }, {
      field: 'currentREVAMargin',
      label: 'Current Margin',
      format: (value: number) => formatPercentage(value),
      filterable: false,
    }, {
      field: 'proposedPrice',
      label: 'Proposed Price',
      format: (value: number) => formatCurrency(value),
      editable: true,
      filterable: false,
      bold: true
    }, {
      field: 'priceChangePercentage',
      label: '% Change',
      format: (value: number) => `${value.toFixed(2)}%`,
      filterable: false,
      calculated: true
    }, {
      field: 'pctToMarketLow',
      label: '% to ML',
      format: (value: number) => `${value.toFixed(2)}%`,
      filterable: false,
      calculated: true
    }, {
      field: 'proposedMargin',
      label: 'Proposed Margin',
      format: (value: number) => formatPercentage(value),
      filterable: false,
    }, {
      field: 'appliedRule',
      label: 'Rule',
      filterable: true,
    }], []);

  // Filter and process the data
  const currentViewData = useMemo(() => {
    if (viewMode === 'highPrice') {
      return highPriceItems;
    } else if (viewMode === 'lowMargin') {
      return lowMarginItems;
    } else {
      // Return all other flags combined
      return Object.values(flaggedItemsByType).flat();
    }
  }, [viewMode, highPriceItems, lowMarginItems, flaggedItemsByType]);

  // Filter by search
  const filteredData = useMemo(() => {
    if (!currentViewData) return [];
    
    return currentViewData.filter((item) => {
      // Search query filter
      const matchesSearch = item.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
      
      // Column filters
      const matchesColumnFilters = Object.entries(columnFilters).every(([field, values]) => {
        if (!values || values.length === 0) return true;
        return values.includes(item[field]);
      });
      
      // Rules filter
      const matchesRules = selectedRules.length === 0 || 
        selectedRules.some(rule => item.appliedRule?.startsWith(rule));
      
      // Active products filter
      const isActive = !hideInactiveProducts || 
        item.inStock > 0 || item.onOrder > 0 || item.revaUsage > 0;
      
      // Shortage filter  
      const matchesShortage = !showShortageOnly || item.shortage;
      
      return matchesSearch && matchesColumnFilters && matchesRules && isActive && matchesShortage;
    });
  }, [currentViewData, searchQuery, columnFilters, selectedRules, hideInactiveProducts, showShortageOnly]);
  
  // Calculate derived fields
  const processedData = useMemo(() => {
    return filteredData.map(item => {
      // Calculate price change percentage
      const priceChangePercentage = item.currentREVAPrice > 0 
        ? ((item.proposedPrice - item.currentREVAPrice) / item.currentREVAPrice) * 100 
        : 0;
      
      // Calculate percentage to market low
      const pctToMarketLow = item.marketLow > 0 
        ? ((item.proposedPrice - item.marketLow) / item.marketLow) * 100 
        : 0;
        
      return {
        ...item,
        priceChangePercentage,
        pctToMarketLow
      };
    });
  }, [filteredData]);
  
  // Sort the filtered data
  const sortedData = useMemo(() => {
    if (!processedData) return [];
    
    return [...processedData].sort((a, b) => {
      const fieldA = a[sortField] !== undefined ? a[sortField] : '';
      const fieldB = b[sortField] !== undefined ? b[sortField] : '';
      
      if (typeof fieldA === 'string' && typeof fieldB === 'string') {
        return sortDirection === 'asc' 
          ? fieldA.localeCompare(fieldB) 
          : fieldB.localeCompare(fieldA);
      } else {
        return sortDirection === 'asc' 
          ? (fieldA ?? 0) - (fieldB ?? 0) 
          : (fieldB ?? 0) - (fieldA ?? 0);
      }
    });
  }, [processedData, sortField, sortDirection]);

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
    
    return sortDirection === 'asc' ? 
      <ArrowUp className="h-3 w-3 ml-1" /> : 
      <ArrowDown className="h-3 w-3 ml-1" />;
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
    setEditingItemId(null);
  };

  // Handle cancel price edit
  const handleCancelEdit = () => {
    setEditingItemId(null);
  };

  // Toggle column visibility
  const toggleColumnVisibility = (field: string) => {
    setVisibleColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(field)) {
        newSet.delete(field);
      } else {
        newSet.add(field);
      }
      return newSet;
    });
  };

  // Toggle bulk edit mode
  const toggleBulkEditMode = () => {
    setBulkEditMode(!bulkEditMode);
    // Clear all edits when toggling bulk mode
    setEditingValues({});
    setEditingItemId(null);
  };

  // Toggle hide inactive products
  const toggleHideInactiveProducts = () => {
    setHideInactiveProducts(!hideInactiveProducts);
  };

  // Toggle show shortage only
  const toggleShowShortageOnly = () => {
    setShowShortageOnly(!showShortageOnly);
  };

  // Format rule display
  const formatRuleDisplay = (rule: string) => {
    if (!rule) return '';
    
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
      flags.push(
        <span key="high-price" className="bg-red-900/30 text-xs px-1 py-0.5 rounded" title="Price ≥10% above TRUE MARKET LOW">
          HIGH PRICE
        </span>
      );
    }
    
    if (item.flag2) {
      flags.push(
        <span key="low-margin" className="bg-amber-900/30 text-xs px-1 py-0.5 rounded" title="Margin < 3%">
          LOW MARGIN
        </span>
      );
    }
    
    if (item.shortage) {
      flags.push(
        <span key="shortage" className="bg-purple-900/30 text-xs px-1 py-0.5 rounded" title="Product has supply shortage">
          SHORT
        </span>
      );
    }
    
    if (item.flags && Array.isArray(item.flags)) {
      item.flags.forEach((flag: string, i: number) => {
        if (flag === 'HIGH_PRICE' || flag === 'LOW_MARGIN' || flag === 'SHORT') return;
        
        flags.push(
          <span key={`flag-${i}`} className="bg-blue-900/30 text-xs px-1 py-0.5 rounded" title={flag}>
            {flag}
          </span>
        );
      });
    }
    
    return flags.length > 0 ? <div className="flex items-center gap-1">{flags}</div> : null;
  };

  // Handle column filter change
  const handleFilterChange = (field: string, value: any) => {
    setColumnFilters(prev => {
      const current = prev[field] || [];
      const newFilter = current.includes(value) 
        ? current.filter(v => v !== value) 
        : [...current, value];
        
      return {
        ...prev,
        [field]: newFilter
      };
    });
  };

  // Get unique values for each filterable column
  const uniqueValues = useMemo(() => {
    const values: Record<string, Set<any>> = {};
    
    columns.forEach(column => {
      if (column.filterable) {
        values[column.field] = new Set();
      }
    });
    
    if (data && data.length > 0) {
      data.forEach(item => {
        columns.forEach(column => {
          if (column.filterable && item[column.field] !== undefined && item[column.field] !== null) {
            values[column.field].add(item[column.field]);
          }
        });
      });
    }
    
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
  }, [data, columns]);

  // Render column header with sort and filter
  const renderColumnHeader = (column: any) => {
    return (
      <div className={`flex items-center justify-between ${column.sticky ? 'sticky left-0 z-20 bg-gray-900/70' : ''}`}>
        <CellDetailsHoverCard field={column.field} item={{}} isColumnHeader={true}>
          <div className="flex items-center cursor-pointer" onClick={() => handleSort(column.field)}>
            {column.label}
            {renderSortIndicator(column.field)}
          </div>
        </CellDetailsHoverCard>
        
        {column.filterable && uniqueValues[column.field]?.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className={`h-6 w-6 p-0 ml-2 ${columnFilters[column.field]?.length ? 'bg-primary/20' : ''}`} 
                onClick={e => e.stopPropagation()}
              >
                <Filter className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 max-h-80 overflow-y-auto bg-gray-900 border-gray-700">
              <div className="p-2">
                <p className="text-sm font-medium">Filter by {column.label}</p>
                <Input placeholder="Search..." className="h-8 mt-2" />
              </div>
              <DropdownMenuSeparator />
              {uniqueValues[column.field]?.map((value, i) => (
                <DropdownMenuCheckboxItem
                  key={i}
                  checked={columnFilters[column.field]?.includes(value)}
                  onSelect={e => {
                    e.preventDefault();
                    handleFilterChange(column.field, value);
                  }}
                >
                  {value !== null && value !== undefined ? typeof value === 'number' ? value.toString() : value : '(Empty)'}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  };

  // Render flags column header
  const renderFlagsColumnHeader = () => {
    const uniqueFlags = new Set<string>();
    
    if (data && data.length > 0) {
      data.forEach(item => {
        if (item.flag1) uniqueFlags.add('HIGH_PRICE');
        if (item.flag2) uniqueFlags.add('LOW_MARGIN');
        if (item.shortage) uniqueFlags.add('SHORT');
        
        if (item.flags && Array.isArray(item.flags)) {
          item.flags.forEach(flag => uniqueFlags.add(flag));
        }
      });
    }
    
    return (
      <div className="flex items-center justify-between">
        <span>Flags</span>
        {uniqueFlags.size > 0 && (
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
            <DropdownMenuContent align="start" className="w-56 bg-gray-900 border-gray-700">
              {Array.from(uniqueFlags).map((flag, i) => (
                <DropdownMenuCheckboxItem
                  key={i}
                  checked={columnFilters['flags']?.includes(flag)}
                  onSelect={e => {
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

  // Get the summary counts for flag types
  const getExceptionCounts = () => {
    return {
      highPrice: highPriceItems.length,
      lowMargin: lowMarginItems.length,
      other: Object.values(flaggedItemsByType).flat().length,
      total: data.length
    };
  };
  
  const exceptionCounts = getExceptionCounts();

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">
            Exceptions ({exceptionCounts.total})
          </h2>
          <div className="flex items-center gap-2 text-muted-foreground mt-1">
            <Badge variant="outline" className="bg-red-900/20 text-red-400 border-red-900">
              HIGH PRICE: {exceptionCounts.highPrice}
            </Badge>
            <Badge variant="outline" className="bg-amber-900/20 text-amber-400 border-amber-900">
              LOW MARGIN: {exceptionCounts.lowMargin}
            </Badge>
            {exceptionCounts.other > 0 && (
              <Badge variant="outline" className="bg-blue-900/20 text-blue-400 border-blue-900">
                OTHER FLAGS: {exceptionCounts.other}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                <span>Columns</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-gray-900 border-gray-700 w-56">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {columns.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.field}
                  checked={visibleColumns.has(column.field)}
                  onSelect={() => toggleColumnVisibility(column.field)}
                >
                  {column.label}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem 
                checked={visibleColumns.has('flags')}
                onSelect={() => toggleColumnVisibility('flags')}
              >
                Flags
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleBulkEditMode} 
            className={bulkEditMode ? "bg-primary/20" : ""}
          >
            {bulkEditMode ? "Exit Bulk Edit" : "Bulk Edit Prices"}
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="highPrice" onValueChange={(value) => setViewMode(value as any)} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="highPrice">
            High Price ({exceptionCounts.highPrice})
          </TabsTrigger>
          <TabsTrigger value="lowMargin">
            Low Margin ({exceptionCounts.lowMargin})
          </TabsTrigger>
          {exceptionCounts.other > 0 && (
            <TabsTrigger value="other">
              Other Flags ({exceptionCounts.other})
            </TabsTrigger>
          )}
        </TabsList>
      </Tabs>
      
      <div className="flex flex-wrap gap-4 items-center mb-4">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by description..." 
            className="pl-8" 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch 
            id="hideInactive" 
            checked={hideInactiveProducts}
            onCheckedChange={toggleHideInactiveProducts}
          />
          <label htmlFor="hideInactive" className="text-sm cursor-pointer">
            Hide Inactive Products
          </label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch 
            id="showShortage" 
            checked={showShortageOnly}
            onCheckedChange={toggleShowShortageOnly}
          />
          <label htmlFor="showShortage" className="text-sm cursor-pointer">
            Shortage Only
          </label>
        </div>
      </div>
      
      <div className="relative rounded-md border overflow-hidden bg-gray-900/40 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10">
              <TableRow className="bg-gray-900/70 hover:bg-gray-900/90">
                {columns.map((column) => (
                  visibleColumns.has(column.field) && (
                    <TableHead 
                      key={column.field} 
                      className={`cursor-pointer bg-gray-900/70 hover:bg-gray-900 ${column.sticky ? 'sticky left-0 z-20' : ''}`}
                    >
                      {renderColumnHeader(column)}
                    </TableHead>
                  )
                ))}
                {visibleColumns.has('flags') && (
                  <TableHead className="bg-gray-900/70 hover:bg-gray-900">
                    {renderFlagsColumnHeader()}
                  </TableHead>
                )}
                <TableHead className="bg-gray-900/70 hover:bg-gray-900">Actions</TableHead>
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {sortedData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length + 2} className="text-center py-10">
                    No items found matching your search criteria
                  </TableCell>
                </TableRow>
              )}
              
              {sortedData.map((item) => {
                const isEditing = editingItemId === item.id;
                
                return (
                  <TableRow 
                    key={item.id} 
                    className={`${item.flag1 || item.flag2 ? 'bg-red-950/20' : ''} ${item.priceModified ? 'bg-blue-950/20' : ''}`}
                  >
                    {columns.map((column) => {
                      if (!visibleColumns.has(column.field)) return null;
                      
                      // Special treatment for specific columns
                      if (column.field === 'proposedPrice' && (isEditing || bulkEditMode)) {
                        return (
                          <TableCell key={column.field} className={column.sticky ? 'sticky left-0 z-20 bg-opacity-90 bg-black' : ''}>
                            {isEditing ? (
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
                            ) : bulkEditMode ? (
                              <PriceEditor 
                                initialPrice={item.proposedPrice || 0} 
                                currentPrice={item.currentREVAPrice || 0} 
                                calculatedPrice={item.calculatedPrice || item.proposedPrice || 0} 
                                cost={item.avgCost || 0} 
                                onSave={newPrice => onPriceChange && onPriceChange(item, newPrice)} 
                                onCancel={() => {}} 
                                compact={true} 
                              />
                            ) : (
                              <CellDetailsHoverCard item={item} field={column.field}>
                                <div className="flex items-center gap-2">
                                  <span className={column.bold ? "font-medium" : ""}>
                                    {column.format ? column.format(item[column.field]) : item[column.field]}
                                  </span>
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
                              </CellDetailsHoverCard>
                            )}
                          </TableCell>
                        );
                      }
                      
                      // For the description column which is sticky
                      if (column.field === 'description') {
                        return (
                          <TableCell key={column.field} className="sticky left-0 z-10 bg-opacity-90 bg-black">
                            <CellDetailsHoverCard item={item} field={column.field}>
                              {item[column.field]}
                            </CellDetailsHoverCard>
                          </TableCell>
                        );
                      }
                      
                      // For the priceChangePercentage column with colored text
                      if (column.field === 'priceChangePercentage') {
                        return (
                          <TableCell key={column.field}>
                            <CellDetailsHoverCard item={item} field={column.field}>
                              <span className={
                                item.priceChangePercentage > 0 
                                  ? 'text-green-400' 
                                  : item.priceChangePercentage < 0 
                                    ? 'text-red-400' 
                                    : ''
                              }>
                                {item.priceChangePercentage.toFixed(2)}%
                              </span>
                            </CellDetailsHoverCard>
                          </TableCell>
                        );
                      }
                      
                      // For the pctToMarketLow column with colored text
                      if (column.field === 'pctToMarketLow') {
                        return (
                          <TableCell key={column.field}>
                            <CellDetailsHoverCard item={item} field={column.field}>
                              <span className={
                                item.pctToMarketLow > 10 
                                  ? 'text-red-400' 
                                  : item.pctToMarketLow > 5 
                                    ? 'text-amber-400' 
                                    : 'text-green-400'
                              }>
                                {item.pctToMarketLow.toFixed(2)}%
                              </span>
                            </CellDetailsHoverCard>
                          </TableCell>
                        );
                      }
                      
                      // For the avgCost column with hover card
                      if (column.field === 'avgCost') {
                        return (
                          <TableCell key={column.field}>
                            <CellDetailsHoverCard item={item} field={column.field}>
                              {column.format ? column.format(item[column.field]) : item[column.field]}
                            </CellDetailsHoverCard>
                          </TableCell>
                        );
                      }
                      
                      // For the nextBuyingPrice column with trend indicator
                      if (column.field === 'nextBuyingPrice') {
                        return (
                          <TableCell key={column.field}>
                            <CellDetailsHoverCard item={item} field={column.field}>
                              <div className="flex items-center gap-1">
                                {column.format ? column.format(item[column.field]) : item[column.field]}
                                {isTrendDown(item.nextBuyingPrice, item.avgCost) ? (
                                  <TrendingDown className="h-3 w-3 text-green-500" />
                                ) : (
                                  <TrendingUp className="h-3 w-3 text-red-500" />
                                )}
                              </div>
                            </CellDetailsHoverCard>
                          </TableCell>
                        );
                      }
                      
                      // For the marketLow column with hover card
                      if (column.field === 'marketLow' || column.field === 'trueMarketLow') {
                        return (
                          <TableCell key={column.field}>
                            <CellDetailsHoverCard item={item} field={column.field}>
                              {column.format ? column.format(item[column.field]) : item[column.field]}
                            </CellDetailsHoverCard>
                          </TableCell>
                        );
                      }
                      
                      // For the currentREVAPrice column with hover card
                      if (column.field === 'currentREVAPrice') {
                        return (
                          <TableCell key={column.field}>
                            <CellDetailsHoverCard item={item} field={column.field}>
                              <span className={column.bold ? "font-medium" : ""}>
                                {column.format ? column.format(item[column.field]) : item[column.field]}
                              </span>
                            </CellDetailsHoverCard>
                          </TableCell>
                        );
                      }
                      
                      // For the currentREVAMargin column with hover card
                      if (column.field === 'currentREVAMargin' || column.field === 'proposedMargin') {
                        return (
                          <TableCell key={column.field}>
                            <CellDetailsHoverCard item={item} field={column.field}>
                              {column.format ? column.format(item[column.field]) : item[column.field]}
                            </CellDetailsHoverCard>
                          </TableCell>
                        );
                      }
                      
                      // For the appliedRule column
                      if (column.field === 'appliedRule') {
                        return (
                          <TableCell key={column.field}>
                            {formatRuleDisplay(item[column.field])}
                          </TableCell>
                        );
                      }
                      
                      // Default rendering for other columns
                      return (
                        <TableCell key={column.field}>
                          {column.format ? column.format(item[column.field]) : item[column.field]}
                        </TableCell>
                      );
                    })}
                    
                    {visibleColumns.has('flags') && (
                      <TableCell>
                        {renderFlags(item)}
                      </TableCell>
                    )}
                    
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
        </div>
      </div>
    </div>
  );
};

export default ExceptionsTable;
