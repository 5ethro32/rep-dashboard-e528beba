
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ChevronDown, ChevronUp, Edit2, CheckCircle, X } from 'lucide-react';
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
  const itemsPerPage = 20;

  // Filter the data based on search query
  const filteredData = data.filter((item) => 
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort the data
  const sortedData = [...filteredData].sort((a, b) => {
    const fieldA = a[sortField];
    const fieldB = b[sortField];
    
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
      ? <ChevronUp className="h-3 w-3 ml-1" /> 
      : <ChevronDown className="h-3 w-3 ml-1" />;
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
    { field: 'proposedMargin', label: 'Proposed Margin', format: formatPercentage },
    { field: 'appliedRule', label: 'Rule' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by description..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {onPriceChange && (
          <Button 
            variant={bulkEditMode ? "default" : "outline"} 
            size="sm" 
            className="ml-4"
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
      
      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
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
              {paginatedData.map((item, index) => (
                <TableRow 
                  key={index} 
                  className={`${(item.flag1 || item.flag2) ? 'bg-red-900/20' : ''} ${item.priceModified ? 'bg-blue-900/20' : ''}`}
                >
                  {columns.map((column) => {
                    // Check if this is the proposed price cell and is being edited
                    if (column.field === 'proposedPrice') {
                      const isEditing = editingItemId === item.id || (bulkEditMode && !item.priceModified);
                      
                      return (
                        <TableCell key={column.field} className={isEditing ? "p-1" : ""}>
                          {isEditing ? (
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
                              {column.format ? column.format(item[column.field]) : item[column.field]}
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
                      );
                    } else {
                      return (
                        <TableCell key={column.field}>
                          {column.format 
                            ? column.format(item[column.field]) 
                            : item[column.field]}
                        </TableCell>
                      );
                    }
                  })}
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
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
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
