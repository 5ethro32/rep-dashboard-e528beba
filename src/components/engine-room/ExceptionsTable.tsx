import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Edit2, CheckCircle, X, Check, Search, ArrowUp, ArrowDown } from 'lucide-react';
import PriceEditor from './PriceEditor';

interface ExceptionsTableProps {
  data: any[];
  onShowPriceDetails: (item: any) => void;
  onPriceChange?: (item: any, newPrice: number) => void;
}

const ExceptionsTable: React.FC<ExceptionsTableProps> = ({ data, onShowPriceDetails, onPriceChange }) => {
  const rule1Flags = data.filter(item => item.flag1);
  const rule2Flags = data.filter(item => item.flag2);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<Record<string, number>>({});
  const [bulkEditMode, setBulkEditMode] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<string>('usageRank');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Group the exceptions by rule and usage rank
  const groupBy = (items: any[], key: string) => {
    return items.reduce((result, item) => {
      const group = item[key];
      result[group] = result[group] || [];
      result[group].push(item);
      return result;
    }, {});
  };

  // Handle sort click
  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter the data based on search query
  const filterData = (items: any[]) => {
    if (!searchQuery) return items;
    
    return items.filter(item => 
      item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Sort the data
  const sortData = (items: any[]) => {
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
    const currentPrice = item.currentREVAPrice || 0;
    const proposedPrice = item.proposedPrice || 0;
    
    if (currentPrice === 0) return 0;
    
    return ((proposedPrice - currentPrice) / currentPrice) * 100;
  };

  // Group Rule 1 exceptions by usage rank
  const rule1ByRank = groupBy(rule1Flags, 'usageRank');
  
  // Group Rule 2 exceptions by usage rank
  const rule2ByRank = groupBy(rule2Flags, 'usageRank');

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

  // Render sort indicator
  const renderSortIndicator = (field: string) => {
    if (field !== sortField) return null;
    
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-3 w-3 ml-1" /> 
      : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  const renderExceptionTable = (items: any[]) => {
    const filteredItems = filterData(items);
    const sortedItems = sortData(filteredItems);

    return (
      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('description')}
                >
                  <div className="flex items-center">
                    Description
                    {renderSortIndicator('description')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('usageRank')}
                >
                  <div className="flex items-center">
                    Usage Rank
                    {renderSortIndicator('usageRank')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('currentREVAPrice')}
                >
                  <div className="flex items-center">
                    Current Price
                    {renderSortIndicator('currentREVAPrice')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('proposedPrice')}
                >
                  <div className="flex items-center">
                    Proposed Price
                    {renderSortIndicator('proposedPrice')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('priceChangePercentage')}
                >
                  <div className="flex items-center">
                    % Change
                    {renderSortIndicator('priceChangePercentage')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('marketLow')}
                >
                  <div className="flex items-center">
                    Market Low
                    {renderSortIndicator('marketLow')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('trueMarketLow')}
                >
                  <div className="flex items-center">
                    True Market Low
                    {renderSortIndicator('trueMarketLow')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('appliedRule')}
                >
                  <div className="flex items-center">
                    Rule
                    {renderSortIndicator('appliedRule')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('inStock')}
                >
                  <div className="flex items-center">
                    In Stock
                    {renderSortIndicator('inStock')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('onOrder')}
                >
                  <div className="flex items-center">
                    On Order
                    {renderSortIndicator('onOrder')}
                  </div>
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-10">
                    No exceptions found
                  </TableCell>
                </TableRow>
              ) : (
                sortedItems.map((item, index) => {
                  const priceChangePercentage = calculatePriceChangePercentage(item);
                  // Add the percentage to the item for sorting
                  item.priceChangePercentage = priceChangePercentage;
                  const isEditing = editingItemId === item.id;
                  
                  return (
                    <TableRow key={index} className={item.priceModified ? 'bg-blue-900/20' : ''}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>{item.usageRank}</TableCell>
                      <TableCell>£{(item.currentREVAPrice || 0).toFixed(2)}</TableCell>
                      
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
                            £{(item.proposedPrice || 0).toFixed(2)}
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
                      
                      <TableCell>£{(item.marketLow || 0).toFixed(2)}</TableCell>
                      <TableCell>£{(item.trueMarketLow || 0).toFixed(2)}</TableCell>
                      <TableCell>{item.appliedRule}</TableCell>
                      <TableCell>{item.inStock}</TableCell>
                      <TableCell>{item.onOrder}</TableCell>
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
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  const renderRankGroups = (groupedData: Record<string, any[]>) => {
    return (
      <div className="space-y-6">
        {Object.keys(groupedData).sort().map((rank) => (
          <div key={rank} className="space-y-2">
            <h3 className="text-lg font-medium">Usage Rank {rank} ({groupedData[rank].length} items)</h3>
            {renderExceptionTable(groupedData[rank])}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Exceptions ({data.length})</h2>
          <Button 
            variant={bulkEditMode ? "default" : "outline"} 
            size="sm"
            onClick={toggleBulkEditMode}
            className="ml-4"
            disabled={!onPriceChange}
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
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export Exceptions
        </Button>
      </div>

      <div className="relative flex-1 mb-4">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by description..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {bulkEditMode && (
        <div className="bg-blue-900/20 p-3 rounded-md border border-blue-900/30">
          <p className="text-sm">
            <strong>Bulk Edit Mode:</strong> You can now edit multiple prices at once. Click "Save" on each item to apply changes.
          </p>
        </div>
      )}

      <Tabs defaultValue="rule1" className="w-full">
        <TabsList className="inline-flex">
          <TabsTrigger value="rule1" className="flex-1">Rule 1 Flags ({rule1Flags.length})</TabsTrigger>
          <TabsTrigger value="rule2" className="flex-1">Rule 2 Flags ({rule2Flags.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="rule1" className="pt-4">
          {rule1Flags.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                These items are flagged because the proposed price is ≥ 10% above the True Market Low
              </p>
              {renderRankGroups(rule1ByRank)}
            </>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              No Rule 1 exceptions found
            </div>
          )}
        </TabsContent>
        <TabsContent value="rule2" className="pt-4">
          {rule2Flags.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                These items are flagged because the proposed margin is below 3%
              </p>
              {renderRankGroups(rule2ByRank)}
            </>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              No Rule 2 exceptions found
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExceptionsTable;
