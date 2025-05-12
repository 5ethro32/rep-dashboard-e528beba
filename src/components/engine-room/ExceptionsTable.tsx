
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
import CellDetailsPopover from './CellDetailsPopover';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency } from '@/utils/rep-performance-utils'; // Import the formatCurrency function

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
  const [showRuleFilters, setShowRuleFilters] = useState(false);
  const [selectedRules, setSelectedRules] = useState<string[]>([]);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'flagged' | 'modified'>('all');
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set([
    'description', 'usageRank', 'avgCost', 'currentREVAPrice', 'proposedPrice', 
    'priceChangePercentage', 'marketLow', 'trueMarketLow', 'marketTrend', 
    'flags', 'appliedRule', 'inStock', 'onOrder'
  ]));
  
  // Get all unique rules from the data
  const uniqueRules = useMemo(() => {
    if (!data) return [];
    const rulesSet = new Set<string>();
    
    data.forEach(item => {
      if (item.appliedRule) {
        const rulePrefix = item.appliedRule.split(' - ')[0];
        rulesSet.add(rulePrefix);
      }
    });
    
    return Array.from(rulesSet).sort();
  }, [data]);
  
  // Handle sort click
  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter the data based on search query and rule filters
  const filterData = (items: any[]) => {
    if (!items || items.length === 0) return [];
    
    let filteredItems = items;
    
    // Apply search filter
    if (searchQuery) {
      filteredItems = filteredItems.filter(item => 
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply rule filters
    if (selectedRules.length > 0) {
      filteredItems = filteredItems.filter(item => {
        if (!item.appliedRule) return false;
        const rulePrefix = item.appliedRule.split(' - ')[0];
        return selectedRules.includes(rulePrefix);
      });
    }

    // Apply hide inactive filter
    if (hideInactiveProducts) {
      filteredItems = filteredItems.filter(item => item.isActive !== false);
    }

    // Apply shortage only filter
    if (showShortageOnly) {
      filteredItems = filteredItems.filter(item => item.inStock <= 0 || (item.inStock <= 5 && item.onOrder <= 0));
    }
    
    return filteredItems;
  };

  // Sort the data
  const sortData = (items: any[]) => {
    if (!items || items.length === 0) return [];
    
    return [...items].sort((a, b) => {
      let fieldA = a[sortField];
      let fieldB = b[sortField];
      
      // Handle null/undefined values
      if (fieldA === undefined || fieldA === null) fieldA = sortField.includes('Price') ? 0 : '';
      if (fieldB === undefined || fieldB === null) fieldB = sortField.includes('Price') ? 0 : '';
      
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
  };

  // Calculate price change percentage
  const calculatePriceChangePercentage = (item: any) => {
    if (!item) return 0;
    
    const currentPrice = item.currentREVAPrice || 0;
    const proposedPrice = item.proposedPrice || 0;
    
    if (currentPrice === 0) return 0;
    
    return ((proposedPrice - currentPrice) / currentPrice) * 100;
  };

  // Handle starting price edit for a specific item
  const handleStartEdit = (item: any) => {
    setEditingItemId(item.id);
    setEditingValues({
      ...editingValues,
      [item.id]: item.proposedPrice || 0
    });
  };

  // Handle price input change
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
    // Keep editingValues intact, just stop editing
  };

  // Toggle bulk edit mode
  const toggleBulkEditMode = () => {
    setBulkEditMode(!bulkEditMode);
    // Clear all edits when toggling bulk mode
    setEditingValues({});
    setEditingItemId(null);
  };
  
  // Toggle rule selection
  const toggleRuleSelection = (rule: string) => {
    setSelectedRules(prev => {
      if (prev.includes(rule)) {
        return prev.filter(r => r !== rule);
      } else {
        return [...prev, rule];
      }
    });
  };

  // Toggle row expansion
  const toggleRowExpansion = (itemId: string) => {
    if (expandedRowId === itemId) {
      setExpandedRowId(null);
    } else {
      setExpandedRowId(itemId);
    }
  };

  // Handle column toggle
  const toggleColumn = (columnName: string) => {
    setVisibleColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(columnName)) {
        newSet.delete(columnName);
      } else {
        newSet.add(columnName);
      }
      return newSet;
    });
  };

  // Render sort indicator
  const renderSortIndicator = (field: string) => {
    if (field !== sortField) return null;
    
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-3 w-3 ml-1" /> 
      : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  // Simplify rule display
  const simplifyRuleDisplay = (ruleText: string) => {
    if (!ruleText) return '';
    
    // Extract the rule number and put it in square brackets
    const ruleMatch = ruleText.match(/Rule (\d+[a-b]?)/i);
    
    // Format the ML + x% part properly
    let formattedRule = ruleText;
    formattedRule = formattedRule.replace(/ML \+ (\d+)%/, "ML + $1.00%");
    
    return ruleMatch 
      ? `${ruleMatch[1]} ${formattedRule.includes('ML + ') ? formattedRule.split(' - ')[1].split('(')[0].trim() : ''}` 
      : formattedRule;
  };

  // Get item flags as formatted string
  const getItemFlags = (item: any) => {
    if (!item.flags || !Array.isArray(item.flags) || item.flags.length === 0) {
      return '-';
    }
    
    return (
      <div className="flex flex-wrap gap-1">
        {item.flags.map((flag: string, i: number) => (
          <Badge key={i} variant="outline" className="text-xs py-0">
            {flag}
          </Badge>
        ))}
      </div>
    );
  };

  // Get counts of different data categories
  const getCounts = () => {
    if (!data) return { total: 0, modified: 0, flagged: 0 };
    
    const total = data.length;
    const modified = data.filter(item => item.priceModified).length;
    const flagged = data.filter(item => (item.flags && item.flags.length > 0) || item.flag1 || item.flag2).length;
    
    return { total, modified, flagged };
  };

  const counts = getCounts();

  // Render the unified filter bar
  const renderUnifiedFilterBar = () => {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Exceptions ({data?.length || 0})</h2>
            <Badge variant={bulkEditMode ? "default" : "outline"} className="ml-2">
              {counts.modified} Modified
            </Badge>
            <Badge variant="outline" className="bg-amber-900/20 border-amber-900/40">
              {counts.flagged} Flagged
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={toggleBulkEditMode}>
              <Edit2 className="h-4 w-4 mr-2" />
              {bulkEditMode ? "Exit Bulk Edit" : "Bulk Edit"}
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by description..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* View Mode Filter */}
          <Select
            value={viewMode}
            onValueChange={(value: 'all' | 'flagged' | 'modified') => setViewMode(value)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="View" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Items ({data?.length || 0})</SelectItem>
              <SelectItem value="flagged">Flagged ({counts.flagged})</SelectItem>
              <SelectItem value="modified">Modified ({counts.modified})</SelectItem>
            </SelectContent>
          </Select>

          {/* Rules Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Rules
                {selectedRules.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {selectedRules.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Filter by Rules</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-[300px] overflow-y-auto p-2">
                {uniqueRules.map(rule => (
                  <div key={rule} className="flex items-center space-x-2 mb-2">
                    <input 
                      type="checkbox" 
                      id={`rule-${rule}`} 
                      checked={selectedRules.includes(rule)} 
                      onChange={() => toggleRuleSelection(rule)}
                      className="h-4 w-4" 
                    />
                    <label htmlFor={`rule-${rule}`} className="text-sm">
                      {rule}
                    </label>
                  </div>
                ))}
              </div>
              {selectedRules.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setSelectedRules([])}
                    className="justify-center text-center"
                  >
                    Clear Filters
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Column Settings */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-[300px] overflow-y-auto p-2">
                {[
                  { id: 'description', label: 'Description' },
                  { id: 'usageRank', label: 'Usage Rank' },
                  { id: 'avgCost', label: 'Avg Cost' },
                  { id: 'currentREVAPrice', label: 'Current Price' },
                  { id: 'proposedPrice', label: 'Proposed Price' },
                  { id: 'priceChangePercentage', label: '% Change' },
                  { id: 'marketLow', label: 'Market Low' },
                  { id: 'trueMarketLow', label: 'TML' },
                  { id: 'marketTrend', label: 'Trend' },
                  { id: 'flags', label: 'Flags' },
                  { id: 'appliedRule', label: 'Rule' },
                  { id: 'inStock', label: 'In Stock' },
                  { id: 'onOrder', label: 'On Order' }
                ].map(col => (
                  <div key={col.id} className="flex items-center space-x-2 mb-2">
                    <input 
                      type="checkbox" 
                      id={`col-${col.id}`} 
                      checked={visibleColumns.has(col.id)} 
                      onChange={() => toggleColumn(col.id)}
                      className="h-4 w-4" 
                    />
                    <label htmlFor={`col-${col.id}`} className="text-sm">
                      {col.label}
                    </label>
                  </div>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Toggle Switches */}
          <div className="flex items-center gap-4 ml-2">
            <div className="flex items-center space-x-2">
              <Switch 
                id="inactive-switch" 
                checked={hideInactiveProducts}
                onCheckedChange={setHideInactiveProducts}
              />
              <label htmlFor="inactive-switch" className="text-sm">
                Hide Inactive
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="shortage-switch" 
                checked={showShortageOnly} 
                onCheckedChange={setShowShortageOnly}
              />
              <label htmlFor="shortage-switch" className="text-sm">
                Shortage Only
              </label>
            </div>
          </div>
        </div>

        {/* Active Filter Pills */}
        {(searchQuery || selectedRules.length > 0 || hideInactiveProducts || showShortageOnly) && (
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            
            {searchQuery && (
              <Badge variant="outline" className="flex items-center gap-1 bg-gray-800">
                Search: {searchQuery}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => setSearchQuery('')} 
                />
              </Badge>
            )}
            
            {selectedRules.map(rule => (
              <Badge key={rule} variant="outline" className="flex items-center gap-1 bg-gray-800">
                Rule: {rule}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => toggleRuleSelection(rule)} 
                />
              </Badge>
            ))}
            
            {hideInactiveProducts && (
              <Badge variant="outline" className="flex items-center gap-1 bg-gray-800">
                Hide Inactive
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => setHideInactiveProducts(false)} 
                />
              </Badge>
            )}
            
            {showShortageOnly && (
              <Badge variant="outline" className="flex items-center gap-1 bg-gray-800">
                Shortage Only
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => setShowShortageOnly(false)} 
                />
              </Badge>
            )}
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setSearchQuery('');
                setSelectedRules([]);
                setHideInactiveProducts(false);
                setShowShortageOnly(false);
              }}
              className="text-xs h-7"
            >
              Clear All
            </Button>
          </div>
        )}

        {bulkEditMode && (
          <div className="bg-blue-900/20 p-3 rounded-md border border-blue-900/30">
            <p className="text-sm">
              <strong>Bulk Edit Mode:</strong> You can now edit multiple prices at once. Click "Save" on each item to apply changes.
            </p>
          </div>
        )}
      </div>
    );
  };

  // Render the exception table
  const renderExceptionTable = (items: any[], flagDescription: string = '') => {
    if (!items) return null;
    
    const filteredItems = filterData(items);
    const sortedItems = sortData(filteredItems);

    return (
      <div className="rounded-md border overflow-hidden">
        {flagDescription && (
          <p className="text-sm text-muted-foreground mb-4 px-4 pt-3">
            {flagDescription}
          </p>
        )}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10 px-2"></TableHead>
                {visibleColumns.has('description') && (
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('description')}
                  >
                    <div className="flex items-center">
                      Description
                      {renderSortIndicator('description')}
                    </div>
                  </TableHead>
                )}
                {visibleColumns.has('usageRank') && (
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('usageRank')}
                  >
                    <div className="flex items-center">
                      Usage Rank
                      {renderSortIndicator('usageRank')}
                    </div>
                  </TableHead>
                )}
                {visibleColumns.has('avgCost') && (
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('avgCost')}
                  >
                    <div className="flex items-center">
                      <span className="font-bold">Avg Cost</span>
                      {renderSortIndicator('avgCost')}
                    </div>
                  </TableHead>
                )}
                {visibleColumns.has('currentREVAPrice') && (
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('currentREVAPrice')}
                  >
                    <div className="flex items-center">
                      <span className="font-bold">Current Price</span>
                      {renderSortIndicator('currentREVAPrice')}
                    </div>
                  </TableHead>
                )}
                {visibleColumns.has('proposedPrice') && (
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('proposedPrice')}
                  >
                    <div className="flex items-center">
                      <span className="font-bold">Proposed Price</span>
                      {renderSortIndicator('proposedPrice')}
                    </div>
                  </TableHead>
                )}
                {visibleColumns.has('priceChangePercentage') && (
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('priceChangePercentage')}
                  >
                    <div className="flex items-center">
                      % Change
                      {renderSortIndicator('priceChangePercentage')}
                    </div>
                  </TableHead>
                )}
                {visibleColumns.has('marketLow') && (
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('marketLow')}
                  >
                    <div className="flex items-center">
                      Market Low
                      {renderSortIndicator('marketLow')}
                    </div>
                  </TableHead>
                )}
                {visibleColumns.has('trueMarketLow') && (
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('trueMarketLow')}
                  >
                    <div className="flex items-center">
                      TML
                      {renderSortIndicator('trueMarketLow')}
                    </div>
                  </TableHead>
                )}
                {visibleColumns.has('marketTrend') && (
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('marketTrend')}
                  >
                    <div className="flex items-center">
                      Trend
                      {renderSortIndicator('marketTrend')}
                    </div>
                  </TableHead>
                )}
                {visibleColumns.has('flags') && (
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('flags')}
                  >
                    <div className="flex items-center">
                      Flags
                      {renderSortIndicator('flags')}
                    </div>
                  </TableHead>
                )}
                {visibleColumns.has('appliedRule') && (
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('appliedRule')}
                  >
                    <div className="flex items-center">
                      Rule
                      {renderSortIndicator('appliedRule')}
                    </div>
                  </TableHead>
                )}
                {visibleColumns.has('inStock') && (
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('inStock')}
                  >
                    <div className="flex items-center">
                      In Stock
                      {renderSortIndicator('inStock')}
                    </div>
                  </TableHead>
                )}
                {visibleColumns.has('onOrder') && (
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('onOrder')}
                  >
                    <div className="flex items-center">
                      On Order
                      {renderSortIndicator('onOrder')}
                    </div>
                  </TableHead>
                )}
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={14} className="text-center py-10">
                    No exceptions found
                  </TableCell>
                </TableRow>
              ) : (
                sortedItems.map((item, index) => {
                  const priceChangePercentage = calculatePriceChangePercentage(item);
                  // Add the percentage to the item for sorting
                  item.priceChangePercentage = priceChangePercentage;
                  const isEditing = editingItemId === item.id;
                  const isExpanded = expandedRowId === item.id;
                  
                  return (
                    <React.Fragment key={index}>
                      <TableRow 
                        className={`${item.priceModified ? 'bg-blue-900/20' : ''} ${isExpanded ? 'bg-gray-800/40' : ''} cursor-pointer`}
                        onClick={() => toggleRowExpansion(item.id)}
                      >
                        <TableCell className="p-2">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </TableCell>

                        {/* Only render columns that are visible */}
                        {visibleColumns.has('description') && (
                          <TableCell>
                            <CellDetailsPopover item={item} field="description">
                              {item.description}
                            </CellDetailsPopover>
                          </TableCell>
                        )}
                        
                        {visibleColumns.has('usageRank') && (
                          <TableCell>
                            <CellDetailsPopover item={item} field="usageRank">
                              {item.usageRank}
                            </CellDetailsPopover>
                          </TableCell>
                        )}
                        
                        {visibleColumns.has('avgCost') && (
                          <TableCell className="font-medium">
                            <CellDetailsPopover item={item} field="avgCost">
                              £{(item.avgCost || 0).toFixed(2)}
                            </CellDetailsPopover>
                          </TableCell>
                        )}
                        
                        {visibleColumns.has('currentREVAPrice') && (
                          <TableCell className="font-bold">
                            <CellDetailsPopover item={item} field="currentREVAPrice">
                              £{(item.currentREVAPrice || 0).toFixed(2)}
                            </CellDetailsPopover>
                          </TableCell>
                        )}
                        
                        {/* Proposed price cell with inline editing */}
                        {visibleColumns.has('proposedPrice') && (
                          <TableCell className="font-bold">
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
                              <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
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
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSavePriceEdit(item);
                                  }}
                                >
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 w-6 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCancelEdit();
                                  }}
                                >
                                  <X className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            ) : (
                              <CellDetailsPopover item={item} field="proposedPrice">
                                <div className="flex items-center gap-2">
                                  £{(item.proposedPrice || 0).toFixed(2)}
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
                        )}
                        
                        {/* Price change percentage */}
                        {visibleColumns.has('priceChangePercentage') && (
                          <TableCell className={priceChangePercentage > 0 ? 'text-green-400' : priceChangePercentage < 0 ? 'text-red-400' : ''}>
                            <CellDetailsPopover item={item} field="priceChangePercentage">
                              {priceChangePercentage.toFixed(2)}%
                            </CellDetailsPopover>
                          </TableCell>
                        )}
                        
                        {visibleColumns.has('marketLow') && (
                          <TableCell>
                            <CellDetailsPopover item={item} field="marketLow">
                              {item.marketLow ? `£${(item.marketLow || 0).toFixed(2)}` : '-'}
                            </CellDetailsPopover>
                          </TableCell>
                        )}
                        
                        {/* TML cell with popover - updated to use trueMarketLow with 2 decimal places */}
                        {visibleColumns.has('trueMarketLow') && (
                          <TableCell>
                            <CellDetailsPopover item={item} field="trueMarketLow">
                              {item.trueMarketLow ? `£${(item.trueMarketLow || 0).toFixed(2)}` : '-'}
                            </CellDetailsPopover>
                          </TableCell>
                        )}
                        
                        {/* Market Trend column */}
                        {visibleColumns.has('marketTrend') && (
                          <TableCell>
                            <div className="flex items-center justify-center">
                              {item.marketTrend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                              {item.marketTrend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                              {!item.marketTrend && <span>-</span>}
                            </div>
                          </TableCell>
                        )}
                        
                        {/* Flags column */}
                        {visibleColumns.has('flags') && (
                          <TableCell>
                            {getItemFlags(item)}
                          </TableCell>
                        )}
                        
                        {visibleColumns.has('appliedRule') && (
                          <TableCell>
                            <CellDetailsPopover item={item} field="appliedRule">
                              {simplifyRuleDisplay(item.appliedRule || "")}
                            </CellDetailsPopover>
                          </TableCell>
                        )}
                        
                        {visibleColumns.has('inStock') && (
                          <TableCell>
                            <CellDetailsPopover item={item} field="inStock">
                              {item.inStock}
                            </CellDetailsPopover>
                          </TableCell>
                        )}
                        
                        {visibleColumns.has('onOrder') && (
                          <TableCell>
                            <CellDetailsPopover item={item} field="onOrder">
                              {item.onOrder}
                            </CellDetailsPopover>
                          </TableCell>
                        )}
                        
                        {/* Star button */}
                        <TableCell className="p-2" onClick={(e) => e.stopPropagation()}>
                          {starredItems && starredItems.has(item.id) ? (
                            <Star 
                              className="h-4 w-4 text-yellow-500 cursor-pointer" 
                              onClick={() => onToggleStar && onToggleStar(item.id)} 
                            />
                          ) : (
                            <Star 
                              className="h-4 w-4 text-gray-400 cursor-pointer" 
                              onClick={() => onToggleStar && onToggleStar(item.id)} 
                            />
                          )}
                        </TableCell>
                      </TableRow>
                      
                      {/* Expanded row with details */}
                      {isExpanded && (
                        <TableRow className="bg-gray-800/20">
                          <TableCell colSpan={14} className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <h4 className="font-semibold mb-2">Product Details</h4>
                                <div className="space-y-2">
                                  <p><span className="text-muted-foreground">Description:</span> {item.description}</p>
                                  <p><span className="text-muted-foreground">Usage Rank:</span> {item.usageRank}</p>
                                  <p><span className="text-muted-foreground">Monthly Usage:</span> {item.revaUsage || 0}</p>
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="font-semibold mb-2">Pricing Details</h4>
                                <div className="space-y-2">
                                  <p><span className="text-muted-foreground">Avg Cost:</span> £{(item.avgCost || 0).toFixed(2)}</p>
                                  <p><span className="text-muted-foreground">Current Price:</span> £{(item.currentREVAPrice || 0).toFixed(2)}</p>
                                  <p><span className="text-muted-foreground">Proposed Price:</span> £{(item.proposedPrice || 0).toFixed(2)}</p>
                                  <p><span className="text-muted-foreground">Current Margin:</span> {((item.currentREVAMargin || 0) * 100).toFixed(2)}%</p>
                                  <p><span className="text-muted-foreground">Proposed Margin:</span> {((item.proposedMargin || 0) * 100).toFixed(2)}%</p>
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="font-semibold mb-2">Market Information</h4>
                                <div className="space-y-2">
                                  <p><span className="text-muted-foreground">Market Low:</span> {item.marketLow ? `£${(item.marketLow).toFixed(2)}` : 'N/A'}</p>
                                  <p><span className="text-muted-foreground">True Market Low:</span> {item.trueMarketLow ? `£${(item.trueMarketLow).toFixed(2)}` : 'N/A'}</p>
                                  <p><span className="text-muted-foreground">Competitor Prices:</span></p>
                                  <div className="pl-4 space-y-1 text-sm">
                                    {item.eth_net !== undefined && <p>ETH NET: £{item.eth_net.toFixed(2)}</p>}
                                    {item.eth !== undefined && <p>ETH: £{item.eth.toFixed(2)}</p>}
                                    {item.nupharm !== undefined && <p>Nupharm: £{item.nupharm.toFixed(2)}</p>}
                                    {item.lexon !== undefined && <p>LEXON: £{item.lexon.toFixed(2)}</p>}
                                    {item.aah !== undefined && <p>AAH: £{item.aah.toFixed(2)}</p>}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Unified Filter Bar */}
      {renderUnifiedFilterBar()}

      <Tabs defaultValue="high-price" className="w-full">
        <TabsList className="inline-flex">
          <TabsTrigger value="high-price" className="flex-1">High Price ({highPriceItems.length})</TabsTrigger>
          <TabsTrigger value="low-margin" className="flex-1">Low Margin ({lowMarginItems.length})</TabsTrigger>
          
          {/* Add tabs for other flag types */}
          {uniqueOtherFlags.map(flag => (
            <TabsTrigger key={flag} value={flag} className="flex-1">
              {flag} ({flaggedItemsByType[flag]?.length || 0})
            </TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value="high-price" className="pt-4">
          {highPriceItems.length > 0 ? (
            renderExceptionTable(
              highPriceItems, 
              "These items are flagged because the proposed price is ≥ 10% above the True Market Low"
            )
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              No high price exceptions found
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="low-margin" className="pt-4">
          {lowMarginItems.length > 0 ? (
            renderExceptionTable(
              lowMarginItems, 
              "These items are flagged because the proposed margin is below 5%" // Updated from 3% to 5%
            )
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              No low margin exceptions found
            </div>
          )}
        </TabsContent>
        
        {/* Add tab content for other flag types */}
        {uniqueOtherFlags.map(flag => (
          <TabsContent key={flag} value={flag} className="pt-4">
            {flaggedItemsByType[flag]?.length > 0 ? (
              renderExceptionTable(
                flaggedItemsByType[flag], 
                `Items flagged with: ${flag}`
              )
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                No items with flag: {flag}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default ExceptionsTable;
