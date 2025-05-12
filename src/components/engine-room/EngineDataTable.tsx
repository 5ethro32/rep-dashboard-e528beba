import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Filter, 
  Star, 
  Info, 
  AlertTriangle, 
  Edit, 
  Check, 
  X, 
  ArrowUpDown,
  Download,
  FileText,
  Trash2,
  Save,
  RotateCcw
} from 'lucide-react';
import PriceEditor from './PriceEditor';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { toast } from '@/hooks/use-toast';

const EngineDataTable = ({ 
  data, 
  onShowPriceDetails,
  onPriceChange,
  onToggleStar,
  starredItems = new Set(),
  flagFilter,
  onFlagFilterChange
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('description');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [editingItemId, setEditingItemId] = useState(null);
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [filterOptions, setFilterOptions] = useState({
    usageRank: '',
    flag: flagFilter || 'all',
    margin: '',
    priceChange: ''
  });
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [editingItems, setEditingItems] = useState(new Map());
  const [justExitedBulkEdit, setJustExitedBulkEdit] = useState(false);
  
  // Reset page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterOptions]);
  
  // Update filter when flagFilter prop changes
  useEffect(() => {
    if (flagFilter && flagFilter !== filterOptions.flag) {
      setFilterOptions(prev => ({ ...prev, flag: flagFilter }));
    }
  }, [flagFilter]);
  
  // When we exit bulk edit mode, we want to ensure the data reflects the latest changes
  useEffect(() => {
    if (justExitedBulkEdit) {
      // Reset the flag after a short delay to avoid infinite loops
      const timer = setTimeout(() => {
        setJustExitedBulkEdit(false);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [justExitedBulkEdit]);
  
  // Get unique usage ranks for filter
  const usageRanks = useMemo(() => {
    const ranks = Array.from(new Set(data.map(item => item.usageRank))).filter(Boolean).sort((a, b) => a - b);
    return ranks;
  }, [data]);
  
  // Get unique flags for filter
  const flags = useMemo(() => {
    const allFlags = new Set();
    data.forEach(item => {
      if (item.flags && Array.isArray(item.flags)) {
        item.flags.forEach(flag => allFlags.add(flag));
      }
      if (item.flag1) allFlags.add('HIGH_PRICE');
      if (item.flag2) allFlags.add('LOW_MARGIN');
    });
    return Array.from(allFlags);
  }, [data]);
  
  // Filter data based on search and filters
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Search filter
      const matchesSearch = item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Usage rank filter
      const matchesRank = !filterOptions.usageRank || item.usageRank === parseInt(filterOptions.usageRank);
      
      // Flag filter
      let matchesFlag = true;
      if (filterOptions.flag && filterOptions.flag !== 'all') {
        if (filterOptions.flag === 'HIGH_PRICE') {
          matchesFlag = item.flag1 || (item.flags && item.flags.includes('HIGH_PRICE'));
        } else if (filterOptions.flag === 'LOW_MARGIN') {
          matchesFlag = item.flag2 || (item.flags && item.flags.includes('LOW_MARGIN'));
        } else {
          matchesFlag = item.flags && item.flags.includes(filterOptions.flag);
        }
      }
      
      // Margin filter
      let matchesMargin = true;
      if (filterOptions.margin) {
        const margin = item.proposedMargin || item.currentREVAMargin || 0;
        if (filterOptions.margin === 'low') {
          matchesMargin = margin < 0.05;
        } else if (filterOptions.margin === 'medium') {
          matchesMargin = margin >= 0.05 && margin < 0.15;
        } else if (filterOptions.margin === 'high') {
          matchesMargin = margin >= 0.15;
        }
      }
      
      // Price change filter
      let matchesPriceChange = true;
      if (filterOptions.priceChange) {
        const currentPrice = item.currentREVAPrice || 0;
        const proposedPrice = item.proposedPrice || currentPrice;
        const priceDiff = currentPrice > 0 ? (proposedPrice - currentPrice) / currentPrice : 0;
        
        if (filterOptions.priceChange === 'increase') {
          matchesPriceChange = priceDiff > 0;
        } else if (filterOptions.priceChange === 'decrease') {
          matchesPriceChange = priceDiff < 0;
        } else if (filterOptions.priceChange === 'nochange') {
          matchesPriceChange = Math.abs(priceDiff) < 0.001;
        }
      }
      
      return matchesSearch && matchesRank && matchesFlag && matchesMargin && matchesPriceChange;
    });
  }, [data, searchQuery, filterOptions]);
  
  // Sort data
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      let fieldA = a[sortField];
      let fieldB = b[sortField];
      
      // Handle null/undefined values
      if (fieldA === undefined || fieldA === null) fieldA = '';
      if (fieldB === undefined || fieldB === null) fieldB = '';
      
      // Special case for price change percentage
      if (sortField === 'priceChangePercentage') {
        const aCurrentPrice = a.currentREVAPrice || 0;
        const aProposedPrice = a.proposedPrice || aCurrentPrice;
        const aPriceChange = aCurrentPrice > 0 ? (aProposedPrice - aCurrentPrice) / aCurrentPrice : 0;
        
        const bCurrentPrice = b.currentREVAPrice || 0;
        const bProposedPrice = b.proposedPrice || bCurrentPrice;
        const bPriceChange = bCurrentPrice > 0 ? (bProposedPrice - bCurrentPrice) / bCurrentPrice : 0;
        
        return sortDirection === 'asc' ? aPriceChange - bPriceChange : bPriceChange - aPriceChange;
      }
      
      // Special case for margin
      if (sortField === 'margin') {
        const aMargin = a.proposedMargin || a.currentREVAMargin || 0;
        const bMargin = b.proposedMargin || b.currentREVAMargin || 0;
        return sortDirection === 'asc' ? aMargin - bMargin : bMargin - aMargin;
      }
      
      // String comparison
      if (typeof fieldA === 'string') {
        return sortDirection === 'asc' 
          ? fieldA.localeCompare(fieldB) 
          : fieldB.localeCompare(fieldA);
      }
      
      // Number comparison
      return sortDirection === 'asc' ? fieldA - fieldB : fieldB - fieldA;
    });
  }, [filteredData, sortField, sortDirection]);
  
  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage]);
  
  // Calculate total pages
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  
  // Handle sort
  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
  
  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilterOptions(prev => ({ ...prev, [key]: value }));
    if (key === 'flag' && onFlagFilterChange) {
      onFlagFilterChange(value);
    }
  };
  
  // Handle item selection
  const handleSelectItem = (itemId) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };
  
  // Handle select all
  const handleSelectAll = () => {
    if (selectedItems.size === paginatedData.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(paginatedData.map(item => item.id)));
    }
  };
  
  // Handle item expansion
  const handleToggleExpand = (itemId) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };
  
  // Handle edit item
  const handleEditItem = (itemId) => {
    setEditingItemId(itemId);
  };
  
  // Handle save price
  const handleSavePrice = (item, newPrice) => {
    if (onPriceChange) {
      onPriceChange(item, newPrice);
    }
    setEditingItemId(null);
  };
  
  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingItemId(null);
  };
  
  // Format price
  const formatPrice = (price) => {
    if (price === null || price === undefined) return 'N/A';
    return `£${price.toFixed(2)}`;
  };
  
  // Format percentage
  const formatPercentage = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return `${(value * 100).toFixed(2)}%`;
  };
  
  // Calculate price change percentage
  const calculatePriceChangePercentage = (item) => {
    const currentPrice = item.currentREVAPrice || 0;
    const proposedPrice = item.proposedPrice || currentPrice;
    
    if (currentPrice === 0) return 0;
    
    return ((proposedPrice - currentPrice) / currentPrice) * 100;
  };
  
  // Format price change
  const formatPriceChange = (item) => {
    const currentPrice = item.currentREVAPrice || 0;
    const proposedPrice = item.proposedPrice || currentPrice;
    
    if (currentPrice === 0) return 'N/A';
    
    const diff = proposedPrice - currentPrice;
    const percentage = (diff / currentPrice) * 100;
    const sign = diff >= 0 ? '+' : '';
    
    return (
      <div>
        <div className={diff >= 0 ? 'text-green-400' : 'text-red-400'}>
          {sign}£{Math.abs(diff).toFixed(2)} ({sign}{percentage.toFixed(2)}%)
        </div>
      </div>
    );
  };
  
  // Render flags
  const renderFlags = (item) => {
    const flags = [];
    
    if (item.flag1 || (item.flags && item.flags.includes('HIGH_PRICE'))) {
      flags.push(
        <Badge key="high-price" variant="outline" className="bg-red-900/20 text-red-400 border-red-900">
          High Price
        </Badge>
      );
    }
    
    if (item.flag2 || (item.flags && item.flags.includes('LOW_MARGIN'))) {
      flags.push(
        <Badge key="low-margin" variant="outline" className="bg-amber-900/20 text-amber-400 border-amber-900">
          Low Margin
        </Badge>
      );
    }
    
    // Add other flags from the flags array
    if (item.flags && Array.isArray(item.flags)) {
      item.flags.forEach(flag => {
        if (flag !== 'HIGH_PRICE' && flag !== 'LOW_MARGIN') {
          if (flag.startsWith('PRICE_DECREASE_')) {
            flags.push(
              <Badge key={flag} variant="outline" className="bg-blue-900/20 text-blue-400 border-blue-900">
                {flag.replace('PRICE_DECREASE_', 'Decrease ')}
              </Badge>
            );
          } else {
            flags.push(
              <Badge key={flag} variant="outline" className="bg-gray-900/20 text-gray-400 border-gray-700">
                {flag}
              </Badge>
            );
          }
        }
      });
    }
    
    return flags.length > 0 ? (
      <div className="flex flex-wrap gap-1">{flags}</div>
    ) : null;
  };
  
  // Handle bulk edit mode
  const enterBulkEditMode = () => {
    setBulkEditMode(true);
    // Initialize with current prices
    const initialPrices = new Map();
    selectedItems.forEach(itemId => {
      const item = data.find(i => i.id === itemId);
      if (item) {
        initialPrices.set(itemId, item.proposedPrice || item.currentREVAPrice);
      }
    });
    setEditingItems(initialPrices);
  };
  
  // Function to exit bulk edit mode
  const exitBulkEditMode = useCallback(() => {
    // Save any pending edits first if needed
    if (editingItems.size > 0) {
      // Process any unsaved edits
      editingItems.forEach((newPrice, itemId) => {
        const item = data.find(i => i.id === itemId);
        if (item) {
          onPriceChange(item, newPrice);
        }
      });
    }
    
    setBulkEditMode(false);
    setEditingItems(new Map());
    setJustExitedBulkEdit(true); // Mark that we just exited bulk edit mode
    
    // Show toast notification about exiting bulk edit mode
    toast({
      title: "Bulk edit mode exited",
      description: `Applied changes to ${editingItems.size} items.`,
      duration: 3000,
    });
  }, [editingItems, data, onPriceChange]);
  
  // Handle bulk price change
  const handleBulkPriceChange = (itemId, newPrice) => {
    setEditingItems(prev => {
      const newMap = new Map(prev);
      newMap.set(itemId, newPrice);
      return newMap;
    });
  };
  
  // Apply percentage change to selected items
  const applyPercentageChange = (percentage) => {
    const newEditingItems = new Map(editingItems);
    
    selectedItems.forEach(itemId => {
      const item = data.find(i => i.id === itemId);
      if (item) {
        const currentPrice = item.currentREVAPrice || 0;
        if (currentPrice > 0) {
          const newPrice = currentPrice * (1 + percentage / 100);
          newEditingItems.set(itemId, newPrice);
        }
      }
    });
    
    setEditingItems(newEditingItems);
  };
  
  // Apply fixed margin to selected items
  const applyFixedMargin = (marginPercentage) => {
    const newEditingItems = new Map(editingItems);
    
    selectedItems.forEach(itemId => {
      const item = data.find(i => i.id === itemId);
      if (item && item.avgCost) {
        const cost = item.avgCost;
        // Calculate price from cost and desired margin
        // price = cost / (1 - margin)
        const margin = marginPercentage / 100;
        const newPrice = cost / (1 - margin);
        newEditingItems.set(itemId, newPrice);
      }
    });
    
    setEditingItems(newEditingItems);
  };
  
  // Render bulk edit controls
  const renderBulkEditControls = () => {
    return (
      <div className="flex flex-col sm:flex-row gap-2 mb-4 p-3 bg-gray-800/50 rounded-md border border-gray-700">
        <div className="flex-1">
          <h3 className="text-sm font-medium mb-1">Bulk Edit Mode</h3>
          <p className="text-xs text-muted-foreground">
            Editing {selectedItems.size} items. Changes will be applied when you exit bulk edit mode.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Apply % Change
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => applyPercentageChange(5)}>
                Increase by 5%
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyPercentageChange(10)}>
                Increase by 10%
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyPercentageChange(-5)}>
                Decrease by 5%
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyPercentageChange(-10)}>
                Decrease by 10%
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Set Margin
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => applyFixedMargin(15)}>
                Set 15% Margin
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyFixedMargin(20)}>
                Set 20% Margin
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyFixedMargin(25)}>
                Set 25% Margin
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => applyFixedMargin(30)}>
                Set 30% Margin
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button 
            variant="default" 
            size="sm"
            onClick={exitBulkEditMode}
          >
            <Save className="h-4 w-4 mr-1" />
            Save & Exit
          </Button>
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-4">
      {/* Search and filter controls */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by description..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Select
          value={filterOptions.usageRank}
          onValueChange={(value) => handleFilterChange('usageRank', value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Usage Rank" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Ranks</SelectItem>
            {usageRanks.map(rank => (
              <SelectItem key={rank} value={rank.toString()}>Rank {rank}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select
          value={filterOptions.flag}
          onValueChange={(value) => handleFilterChange('flag', value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Flag Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Items</SelectItem>
            <SelectItem value="HIGH_PRICE">High Price</SelectItem>
            <SelectItem value="LOW_MARGIN">Low Margin</SelectItem>
            {flags.filter(f => f !== 'HIGH_PRICE' && f !== 'LOW_MARGIN').map(flag => (
              <SelectItem key={flag} value={flag}>{flag}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Bulk actions */}
      {selectedItems.size > 0 && !bulkEditMode && (
        <div className="flex items-center gap-2 p-2 bg-gray-800/50 rounded-md">
          <span className="text-sm">{selectedItems.size} items selected</span>
          <Button 
            variant="outline" 
            size="sm"
            onClick={enterBulkEditMode}
            disabled={!onPriceChange}
          >
            <Edit className="h-4 w-4 mr-1" />
            Bulk Edit
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setSelectedItems(new Set())}
          >
            <X className="h-4 w-4 mr-1" />
            Clear Selection
          </Button>
        </div>
      )}
      
      {/* Bulk edit controls */}
      {bulkEditMode && renderBulkEditControls()}
      
      {/* Data table */}
      <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="sticky top-0 z-30 bg-gray-950/95 backdrop-blur-sm">
              <TableRow>
                <TableHead className="w-[30px]">
                  <Checkbox 
                    checked={selectedItems.size === paginatedData.length && paginatedData.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-[30px]"></TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('description')}>
                  <div className="flex items-center">
                    Description
                    {sortField === 'description' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('currentREVAPrice')}>
                  <div className="flex items-center">
                    Current Price
                    {sortField === 'currentREVAPrice' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('proposedPrice')}>
                  <div className="flex items-center">
                    Proposed Price
                    {sortField === 'proposedPrice' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('priceChangePercentage')}>
                  <div className="flex items-center">
                    Change
                    {sortField === 'priceChangePercentage' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('margin')}>
                  <div className="flex items-center">
                    Margin
                    {sortField === 'margin' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('usageRank')}>
                  <div className="flex items-center">
                    Rank
                    {sortField === 'usageRank' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </TableHead>
                <TableHead>Flags</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10">
                    No items found matching your filters
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((item) => {
                  const isExpanded = expandedItems.has(item.id);
                  const isEditing = editingItemId === item.id;
                  const isSelected = selectedItems.has(item.id);
                  const isStarred = starredItems.has(item.id);
                  const priceChangePercentage = calculatePriceChangePercentage(item);
                  const margin = item.proposedMargin || item.currentREVAMargin || 0;
                  
                  return (
                    <React.Fragment key={item.id}>
                      <TableRow 
                        className={`${isExpanded ? 'bg-gray-800/30' : ''} ${isSelected ? 'bg-blue-900/20' : ''}`}
                        isExpanded={isExpanded}
                      >
                        <TableCell>
                          <Checkbox 
                            checked={isSelected}
                            onCheckedChange={() => handleSelectItem(item.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <Star 
                            className={`h-4 w-4 cursor-pointer ${isStarred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400 hover:text-gray-300'}`}
                            onClick={() => onToggleStar && onToggleStar(item.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <span 
                              className="cursor-pointer hover:underline"
                              onClick={() => handleToggleExpand(item.id)}
                            >
                              {item.description || 'Unknown'}
                            </span>
                            {item.priceModified && (
                              <Badge variant="outline" className="ml-2 bg-blue-900/20 text-blue-400 border-blue-900">
                                Modified
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{formatPrice(item.currentREVAPrice)}</TableCell>
                        <TableCell>
                          {bulkEditMode && isSelected ? (
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={editingItems.get(item.id) || ''}
                              onChange={(e) => handleBulkPriceChange(item.id, parseFloat(e.target.value))}
                              className="h-7 w-24"
                            />
                          ) : isEditing ? (
                            <PriceEditor
                              initialPrice={item.proposedPrice || item.currentREVAPrice}
                              currentPrice={item.currentREVAPrice}
                              calculatedPrice={item.calculatedPrice || item.currentREVAPrice}
                              cost={item.avgCost}
                              onSave={(newPrice) => handleSavePrice(item, newPrice)}
                              onCancel={handleCancelEdit}
                              compact={true}
                            />
                          ) : (
                            formatPrice(item.proposedPrice || item.currentREVAPrice)
                          )}
                        </TableCell>
                        <TableCell>{formatPriceChange(item)}</TableCell>
                        <TableCell>
                          <span className={
                            margin < 0.03 ? 'text-red-400' : 
                            margin < 0.05 ? 'text-amber-400' : 
                            margin > 0.3 ? 'text-green-400' : ''
                          }>
                            {formatPercentage(margin)}
                          </span>
                        </TableCell>
                        <TableCell>{item.usageRank || 'N/A'}</TableCell>
                        <TableCell>{renderFlags(item)}</TableCell>
                        <TableCell className="text-right">
                          {!bulkEditMode && !isEditing && onPriceChange && (
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleEditItem(item.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => onShowPriceDetails && onShowPriceDetails(item)}
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      
                      {/* Expanded row with additional details */}
                      {isExpanded && (
                        <TableRow className="bg-gray-800/20">
                          <TableCell colSpan={9} className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <h4 className="text-sm font-medium mb-2">Item Details</h4>
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">SKU:</span>
                                    <span>{item.sku || 'N/A'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">In Stock:</span>
                                    <span>{item.inStock || 0}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">On Order:</span>
                                    <span>{item.onOrder || 0}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Usage:</span>
                                    <span>{item.revaUsage || 0}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="text-sm font-medium mb-2">Cost & Pricing</h4>
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Avg Cost:</span>
                                    <span>{formatPrice(item.avgCost)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Next Cost:</span>
                                    <span>{formatPrice(item.nextBuyingPrice)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Current Margin:</span>
                                    <span>{formatPercentage(item.currentREVAMargin)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Proposed Margin:</span>
                                    <span>{formatPercentage(item.proposedMargin)}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="text-sm font-medium mb-2">Market Prices</h4>
                                <div className="space-y-1 text-sm">
                                  {item.competitorPrices ? (
                                    Object.entries(item.competitorPrices).map(([competitor, price]) => (
                                      <div key={competitor} className="flex justify-between">
                                        <span className="text-muted-foreground">{competitor}:</span>
                                        <span>{formatPrice(price)}</span>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="text-muted-foreground">No competitor prices available</div>
                                  )}
                                  <div className="flex justify-between mt-2">
                                    <span className="text-muted-foreground">True Market Low:</span>
                                    <span>{item.trueMarketLow ? formatPrice(item.trueMarketLow) : 'N/A'}</span>
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
      </Card>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, sortedData.length)} of {sortedData.length}
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              <PaginationItem>
                <span className="px-2">
                  Page {currentPage} of {totalPages}
                </span>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext 
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default EngineDataTable;
