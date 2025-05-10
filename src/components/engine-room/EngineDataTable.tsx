
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ArrowUp, ArrowDown, Edit2, CheckCircle, X } from 'lucide-react';
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

  // Handle price edit
  const handleEditPrice = (item: any) => {
    // If we're in bulk mode, don't set an individual editing item
    if (!bulkEditMode) {
      setEditingItemId(item.id);
    }
  };

  // Handle save price
  const handleSavePrice = (item: any, newPrice: number) => {
    if (onPriceChange) {
      onPriceChange(item, newPrice);
    }
    setEditingItemId(null);
  };

  // Toggle bulk edit mode
  const toggleBulkEditMode = () => {
    setBulkEditMode(!bulkEditMode);
    // Clear any single edit when toggling bulk mode
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
    { field: 'proposedPrice', label: 'Proposed Price', format: formatCurrency },
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
            <TableHead className="bg-gray-900/70">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={columns.length + 1} className="text-center py-10">
                No items found matching your search criteria
              </TableCell>
            </TableRow>
          )}
          {items.map((item, index) => {
            // Calculate price change percentage for each item
            const priceChangePercentage = calculatePriceChangePercentage(item);
            
            return (
              <TableRow 
                key={index} 
                className={`${(item.flag1 || item.flag2) ? 'bg-red-900/20' : ''} ${item.priceModified ? 'bg-blue-900/20' : ''}`}
              >
                <TableCell>{item.description}</TableCell>
                <TableCell>{item.inStock}</TableCell>
                <TableCell>{item.revaUsage}</TableCell>
                <TableCell>{item.usageRank}</TableCell>
                <TableCell>{formatCurrency(item.avgCost)}</TableCell>
                <TableCell>{formatCurrency(item.marketLow)}</TableCell>
                <TableCell>{formatCurrency(item.currentREVAPrice)}</TableCell>
                <TableCell>{formatPercentage(item.currentREVAMargin)}</TableCell>
                
                {/* Proposed price cell with edit capability */}
                <TableCell className={editingItemId === item.id || (bulkEditMode && !item.priceModified) ? "p-1" : ""}>
                  {editingItemId === item.id || (bulkEditMode && !item.priceModified) ? (
                    <PriceEditor
                      initialPrice={item.proposedPrice || 0}
                      currentPrice={item.currentREVAPrice || 0}
                      calculatedPrice={item.calculatedPrice || item.proposedPrice || 0}
                      cost={item.avgCost || 0}
                      onSave={(newPrice) => handleSavePrice(item, newPrice)}
                      onCancel={() => setEditingItemId(null)}
                      compact={bulkEditMode}
                    />
                  ) : (
                    <div className="flex items-center">
                      {formatCurrency(item.proposedPrice)}
                      {item.priceModified && (
                        <CheckCircle className="h-3 w-3 ml-2 text-blue-400" />
                      )}
                      {onPriceChange && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="ml-2 h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditPrice(item);
                          }}
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
      
      {bulkEditMode && (
        <div className="bg-blue-900/20 p-3 rounded-md border border-blue-900/30">
          <p className="text-sm">
            <strong>Bulk Edit Mode:</strong> You can now edit multiple prices at once. Click "Save" on each item to apply changes.
          </p>
        </div>
      )}
      
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
