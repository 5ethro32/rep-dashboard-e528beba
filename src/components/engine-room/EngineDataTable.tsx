import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ArrowUp, ArrowDown, Edit2, CheckCircle, X, Flag } from 'lucide-react';
import PriceEditor from './PriceEditor';

interface EngineDataTableProps {
  data: any[];
  onShowPriceDetails: (item: any) => void;
  onPriceChange?: (item: any, newPrice: number) => void;
}

const EngineDataTable: React.FC<EngineDataTableProps> = ({ data, onShowPriceDetails, onPriceChange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string>('description');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<Record<string, number>>({});
  const [bulkEditMode, setBulkEditMode] = useState<boolean>(false);
  const [filterByRank, setFilterByRank] = useState<string | null>(null);
  const itemsPerPage = 20;

  // Filter the data based on search query and usage rank filter
  const filteredData = data.filter((item) => {
    const matchesSearch = item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRankFilter = filterByRank ? item.usageRank === parseInt(filterByRank, 10) : true;
    return matchesSearch && matchesRankFilter;
  });

  // Get unique usage ranks for filter dropdown
  const usageRanks = Array.from(new Set(data.map(item => item.usageRank))).sort((a, b) => a - b);
  
  // Get unique flags for filter dropdown
  const allFlags = new Set<string>();
  data.forEach(item => {
    if (item.flags && Array.isArray(item.flags)) {
      item.flags.forEach((flag: string) => allFlags.add(flag));
    }
    if (item.flag1) allFlags.add('HIGH_PRICE');
    if (item.flag2) allFlags.add('LOW_MARGIN');
  });
  const uniqueFlags = Array.from(allFlags);

  // Sort the data
  const sortedData = [...filteredData].sort((a, b) => {
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

  // Calculate price change percentage
  const calculatePriceChangePercentage = (item: any) => {
    const currentPrice = item.currentREVAPrice || 0;
    const proposedPrice = item.proposedPrice || 0;
    
    if (currentPrice === 0) return 0;
    
    return ((proposedPrice - currentPrice) / currentPrice) * 100;
  };

  // Paginate the data
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

  // Handle sort click
  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
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

  // Group data by usage rank
  const groupedByRank = sortedData.reduce((acc: Record<string, any[]>, item: any) => {
    const rank = item.usageRank || 'Unknown';
    if (!acc[rank]) {
      acc[rank] = [];
    }
    acc[rank].push(item);
    return acc;
  }, {});

  // Column configuration
  const columns = [
    { field: 'description', label: 'Description' },
    { field: 'inStock', label: 'In Stock' },
    { field: 'revaUsage', label: 'Usage' },
    { field: 'usageRank', label: 'Rank' },
    { field: 'avgCost', label: 'Avg Cost', format: formatCurrency },
    { field: 'marketLow', label: 'Market Low', format: formatCurrency },
    { field: 'currentREVAPrice', label: 'Current Price', format: formatCurrency },
    { field: 'currentREVAMargin', label: 'Current Margin', format: formatPercentage },
    { field: 'proposedPrice', label: 'Proposed Price', format: formatCurrency, editable: true },
    { field: 'priceChangePercentage', label: '% Change' },
    { field: 'proposedMargin', label: 'Proposed Margin', format: formatPercentage },
    { field: 'appliedRule', label: 'Rule' },
  ];

  // Render the data table with rows
  const renderDataTable = (items: any[]) => {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead 
                key={column.field}
                className="cursor-pointer bg-gray-900/70 hover:bg-gray-900"
                onClick={() => handleSort(column.field)}
              >
                <div className="flex items-center">
                  {column.label}
                  {renderSortIndicator(column.field)}
                </div>
              </TableHead>
            ))}
            <TableHead className="bg-gray-900/70">Flags</TableHead>
            <TableHead className="bg-gray-900/70">Actions</TableHead>
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
                <TableCell>{formatCurrency(item.avgCost)}</TableCell>
                <TableCell>{formatCurrency(item.marketLow)}</TableCell>
                <TableCell>{formatCurrency(item.currentREVAPrice)}</TableCell>
                <TableCell>{formatPercentage(item.currentREVAMargin)}</TableCell>
                
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
                          onClick={() => handleStartEdit(item)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  )}
                </TableCell>
                
                {/* Price change percentage */}
                <TableCell className={priceChangePercentage > 0 ? 'text-green-400' : priceChangePercentage < 0 ? 'text-red-400' : ''}>
                  {priceChangePercentage.toFixed(2)}%
                </TableCell>
                
                <TableCell>{formatPercentage(item.proposedMargin)}</TableCell>
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

  // Render flags for an item
  const renderFlags = (item: any) => {
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
        {item.flags && item.flags.map((flag: string, i: number) => {
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
          
          {/* New Flag Filter */}
          {uniqueFlags.length > 0 && (
            <select 
              className="bg-gray-800 border border-gray-700 rounded-md px-2 py-2 text-sm w-40"
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  setSearchQuery(e.target.value);
                }
              }}
            >
              <option value="">Filter by Flag</option>
              {uniqueFlags.map(flag => (
                <option key={flag} value={flag}>{flag}</option>
              ))}
            </select>
          )}
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
      
      {/* ... keep existing code (bulk edit mode notice) */}
      
      {filterByRank ? (
        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto">
            {renderDataTable(paginatedData)}
          </div>
        </div>
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
