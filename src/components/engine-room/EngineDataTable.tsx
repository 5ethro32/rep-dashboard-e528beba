import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Star, BarChart2, ChevronDown, ChevronUp, X, Save, Pen } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import PriceEditor from './PriceEditor';
import { capitalizeFirstLetter } from '@/utils/formatting-utils';
import CellDetailsPopover from './CellDetailsPopover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

interface EngineDataTableProps {
  data: any[];
  onShowPriceDetails?: (item: any) => void;
  onPriceChange?: (item: any, newPrice: number) => void;
  onToggleStar?: (itemId: string) => void;
  starredItems?: Set<string>;
  flagFilter?: string;
  onFlagFilterChange?: (filter: string) => void;
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
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'usageRank', direction: 'asc' });
  const [filteredData, setFilteredData] = useState<any[]>(data);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [bulkEditChanges, setBulkEditChanges] = useState<Map<string, number>>(new Map());
  const [pageSize, setPageSize] = useState(50);
  
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);
  
  // Effect to update filtered data when props change
  useEffect(() => {
    if (data) {
      let result = [...data];
      
      // Apply search filter
      if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        result = result.filter(item => 
          item.description.toLowerCase().includes(lowerSearchTerm) ||
          item.id?.toLowerCase().includes(lowerSearchTerm)
        );
      }
      
      // Apply sorting
      result.sort((a, b) => {
        let valueA = a[sortConfig.key];
        let valueB = b[sortConfig.key];
        
        // Handle numeric and string sorting correctly
        if (typeof valueA === 'number' && typeof valueB === 'number') {
          return sortConfig.direction === 'asc' ? valueA - valueB : valueB - valueA;
        } else {
          valueA = valueA?.toString().toLowerCase() || '';
          valueB = valueB?.toString().toLowerCase() || '';
          return sortConfig.direction === 'asc' 
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
        }
      });
      
      setFilteredData(result);
      setCurrentPage(1); // Reset to first page when data changes
    }
  }, [data, searchTerm, sortConfig]);
  
  // Handle exiting bulk edit mode and save changes
  useEffect(() => {
    if (!bulkEditMode && bulkEditChanges.size > 0 && onPriceChange) {
      // Apply all pending changes
      console.log("Applying bulk changes:", bulkEditChanges);
      bulkEditChanges.forEach((newPrice, itemId) => {
        const item = data.find(item => item.id === itemId);
        if (item) {
          onPriceChange(item, newPrice);
        }
      });
      // Clear bulk changes
      setBulkEditChanges(new Map());
    }
  }, [bulkEditMode, bulkEditChanges, data, onPriceChange]);
  
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };
  
  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };
  
  const toggleBulkEditMode = () => {
    if (bulkEditMode && bulkEditChanges.size > 0 && onPriceChange) {
      // Apply all pending changes when exiting bulk edit mode
      console.log("Applying bulk changes:", bulkEditChanges);
      bulkEditChanges.forEach((newPrice, itemId) => {
        const item = data.find(item => item.id === itemId);
        if (item) {
          onPriceChange(item, newPrice);
        }
      });
      
      // Clear bulk changes
      setBulkEditChanges(new Map());
    }
    
    setBulkEditMode(prev => !prev);
  };
  
  // Fixed: This function will handle starting an edit on a specific item
  const handleStartEdit = (itemId: string) => {
    console.log("Starting edit for item:", itemId);
    if (editingItemId === itemId) {
      setEditingItemId(null);
    } else {
      setEditingItemId(itemId);
    }
  };
  
  // Handle saving a price edit for an individual item
  const handleSaveEdit = (item: any, newPrice: number) => {
    if (onPriceChange) {
      onPriceChange(item, newPrice);
    }
    setEditingItemId(null);
  };
  
  // Handle bulk edit price change
  const handleBulkPriceChange = (itemId: string, newPrice: number) => {
    setBulkEditChanges(prev => {
      const updatedChanges = new Map(prev);
      updatedChanges.set(itemId, newPrice);
      return updatedChanges;
    });
  };
  
  const handleCancelEdit = () => {
    setEditingItemId(null);
  };
  
  // Get CSS class for margin values
  const getMarginClass = (margin: number) => {
    if (margin < 3) return "text-red-500";
    if (margin < 5) return "text-orange-500";
    if (margin < 10) return "text-yellow-500";
    return "text-green-500";
  };
  
  // Format price values for display
  const formatPrice = (value: number | undefined) => {
    if (value === undefined || value === null) return "-";
    return `£${value.toFixed(2)}`;
  };
  
  // Format margin values for display
  const formatMargin = (value: number | undefined) => {
    if (value === undefined || value === null) return "-";
    return `${(value * 100).toFixed(1)}%`;
  };
  
  // Format usage values with comma separators
  const formatUsage = (value: number | undefined) => {
    if (value === undefined || value === null) return "-";
    return value.toLocaleString();
  };
  
  // Get summary of table counts
  const getTableSummary = () => {
    return `Showing ${startIndex + 1}-${Math.min(startIndex + pageSize, filteredData.length)} of ${filteredData.length} items`;
  };
  
  // Get flag information for display
  const getFlagInfo = (item: any) => {
    if (item.flags && item.flags.length > 0) {
      return item.flags.map((flag: string) => {
        // Map flag codes to user-friendly text and colors
        if (flag === 'HIGH_PRICE') {
          return { text: 'High Price', color: 'bg-red-500' };
        } else if (flag === 'LOW_MARGIN') {
          return { text: 'Low Margin', color: 'bg-amber-500' };
        } else if (flag.startsWith('PRICE_DECREASE_')) {
          return { text: flag.replace('PRICE_DECREASE_', 'Decrease '), color: 'bg-pink-500' };
        }
        return { text: flag.replace(/_/g, ' '), color: 'bg-gray-500' };
      });
    }
    
    // Legacy flag handling
    const flags = [];
    if (item.flag1) flags.push({ text: 'High Price', color: 'bg-red-500' });
    if (item.flag2) flags.push({ text: 'Low Margin', color: 'bg-amber-500' });
    return flags;
  };
  
  // Check if a price is modified
  const isPriceModified = (item: any) => {
    return item.priceModified || 
      // Also check bulk edit changes
      (bulkEditChanges.has(item.id) && bulkEditChanges.get(item.id) !== item.proposedPrice);
  };
  
  return (
    <div className="space-y-4">
      {/* Table header with search and controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
        <div className="flex-1 w-full sm:w-auto">
          <Input 
            type="text" 
            placeholder="Search products..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {onPriceChange && (
            <Button 
              variant={bulkEditMode ? "default" : "outline"}
              size="sm"
              onClick={toggleBulkEditMode}
            >
              {bulkEditMode ? (
                <>
                  <Save className="h-4 w-4 mr-1" />
                  Save &amp; Exit Bulk Edit
                </>
              ) : (
                <>
                  <Pen className="h-4 w-4 mr-1" />
                  Bulk Edit
                </>
              )}
            </Button>
          )}
          
          <Select 
            value={pageSize.toString()} 
            onValueChange={(value) => setPageSize(Number(value))}
          >
            <SelectTrigger className="w-[80px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
              <SelectItem value="200">200</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex items-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="px-2">
              {currentPage} / {totalPages || 1}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main data table */}
      <Card>
        <CardContent className="p-0 overflow-auto">
          <Table className="min-w-full">
            <TableCaption>{getTableSummary()}</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead onClick={() => handleSort('description')} className="cursor-pointer">
                  <div className="flex items-center">
                    Description
                    {sortConfig.key === 'description' && (
                      sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort('revaUsage')} className="cursor-pointer text-right">
                  <div className="flex items-center justify-end">
                    Usage
                    {sortConfig.key === 'revaUsage' && (
                      sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort('usageRank')} className="cursor-pointer text-right">
                  <div className="flex items-center justify-end">
                    Rank
                    {sortConfig.key === 'usageRank' && (
                      sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort('avgCost')} className="cursor-pointer text-right">
                  <div className="flex items-center justify-end">
                    Cost
                    {sortConfig.key === 'avgCost' && (
                      sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort('nextBuyingPrice')} className="cursor-pointer text-right">
                  <div className="flex items-center justify-end">
                    Next Cost
                    {sortConfig.key === 'nextBuyingPrice' && (
                      sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort('currentREVAPrice')} className="cursor-pointer text-right">
                  <div className="flex items-center justify-end">
                    Current
                    {sortConfig.key === 'currentREVAPrice' && (
                      sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort('currentREVAMargin')} className="cursor-pointer text-right">
                  <div className="flex items-center justify-end">
                    Margin
                    {sortConfig.key === 'currentREVAMargin' && (
                      sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort('proposedPrice')} className="cursor-pointer text-right">
                  <div className="flex items-center justify-end">
                    New Price
                    {sortConfig.key === 'proposedPrice' && (
                      sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort('proposedMargin')} className="cursor-pointer text-right">
                  <div className="flex items-center justify-end">
                    New Margin
                    {sortConfig.key === 'proposedMargin' && (
                      sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length > 0 ? (
                paginatedData.map((item) => (
                  <TableRow key={item.id} className={isPriceModified(item) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}>
                    <TableCell className="p-2">
                      <div className="flex space-x-1">
                        {onToggleStar && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => onToggleStar(item.id)}
                          >
                            <Star 
                              className={starredItems.has(item.id) ? "fill-yellow-400 text-yellow-400 h-4 w-4" : "h-4 w-4 text-gray-400"} 
                            />
                          </Button>
                        )}
                        {(item.flag1 || item.flag2 || (item.flags && item.flags.length > 0)) && (
                          <CellDetailsPopover 
                            label={
                              <div>
                                {getFlagInfo(item).map((flag, index) => (
                                  <Badge 
                                    key={index} 
                                    variant="outline"
                                    className={`mr-1 mt-1 ${flag.color} text-white`}
                                  >
                                    {flag.text}
                                  </Badge>
                                ))}
                              </div>
                            }
                          >
                            <>
                              <h4 className="font-medium mb-1">Exception Details</h4>
                              {getFlagInfo(item).map((flag, index) => (
                                <div key={index} className="text-sm mb-1">
                                  <Badge 
                                    variant="outline"
                                    className={`${flag.color} text-white mr-2`}
                                  >
                                    {flag.text}
                                  </Badge>
                                  {flag.text === 'High Price' && (
                                    <span>Price is higher than market average</span>
                                  )}
                                  {flag.text === 'Low Margin' && (
                                    <span>Margin is below target threshold</span>
                                  )}
                                  {flag.text.includes('Decrease') && (
                                    <span>Significant price decrease</span>
                                  )}
                                </div>
                              ))}
                            </>
                          </CellDetailsPopover>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={item.description}>
                      {item.description}
                    </TableCell>
                    <TableCell className="text-right">{formatUsage(item.revaUsage)}</TableCell>
                    <TableCell className="text-right">{item.usageRank || '-'}</TableCell>
                    <TableCell className="text-right">{formatPrice(item.avgCost)}</TableCell>
                    <TableCell className="text-right">{formatPrice(item.nextBuyingPrice)}</TableCell>
                    <TableCell className="text-right">{formatPrice(item.currentREVAPrice)}</TableCell>
                    <TableCell 
                      className={`text-right ${getMarginClass(item.currentREVAMargin / 100)}`}
                    >
                      {formatMargin(item.currentREVAMargin / 100)}
                    </TableCell>
                    <TableCell className="text-right">
                      {bulkEditMode && onPriceChange ? (
                        <PriceEditor
                          initialPrice={bulkEditChanges.get(item.id) || item.proposedPrice}
                          currentPrice={item.currentREVAPrice}
                          calculatedPrice={item.calculatedPrice || item.proposedPrice}
                          cost={item.avgCost}
                          onSave={(newPrice) => handleBulkPriceChange(item.id, newPrice)}
                          onCancel={() => {
                            // Remove from bulk edit changes
                            setBulkEditChanges(prev => {
                              const updated = new Map(prev);
                              updated.delete(item.id);
                              return updated;
                            });
                          }}
                          compact={true}
                          autoSaveOnExit={true}
                        />
                      ) : editingItemId === item.id && onPriceChange ? (
                        <PriceEditor
                          initialPrice={item.proposedPrice}
                          currentPrice={item.currentREVAPrice}
                          calculatedPrice={item.calculatedPrice || item.proposedPrice}
                          cost={item.avgCost}
                          onSave={(newPrice) => handleSaveEdit(item, newPrice)}
                          onCancel={handleCancelEdit}
                          compact={true}
                        />
                      ) : (
                        <div className={isPriceModified(item) ? 'font-bold text-blue-600' : ''}>
                          {formatPrice(item.proposedPrice)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell 
                      className={`text-right ${getMarginClass(item.proposedMargin)}`}
                    >
                      {formatMargin(item.proposedMargin)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center space-x-1">
                        {onShowPriceDetails && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-7 w-7 p-1"
                            onClick={() => onShowPriceDetails(item)}
                            title="View price details"
                          >
                            <BarChart2 className="h-4 w-4" />
                          </Button>
                        )}
                        {onPriceChange && !bulkEditMode && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-7 w-7 p-1"
                            onClick={() => handleStartEdit(item.id)}
                            title="Edit price"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-4">
                    No items found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default EngineDataTable;
