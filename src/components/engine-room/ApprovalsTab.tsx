
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Check, X, ChevronDown, ChevronUp, CheckCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ApprovalsTabProps {
  data: any[];
  onApprove: (items: string[], comment?: string) => void;
  onReject: (items: string[], comment: string) => void;
}

const ApprovalsTab: React.FC<ApprovalsTabProps> = ({ data, onApprove, onReject }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string>('description');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [commentText, setCommentText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Only show items that have been submitted for approval
  const submittedItems = data.filter(item => 
    item.workflowStatus === 'submitted' && item.priceModified
  );

  // Filter by search
  const filteredData = submittedItems.filter((item) => 
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

  // Render sort indicator
  const renderSortIndicator = (field: string) => {
    if (field !== sortField) return null;
    
    return sortDirection === 'asc' 
      ? <ChevronUp className="h-3 w-3 ml-1" /> 
      : <ChevronDown className="h-3 w-3 ml-1" />;
  };

  // Handle select item
  const handleSelectItem = (id: string) => {
    const newSelectedItems = new Set(selectedItems);
    if (newSelectedItems.has(id)) {
      newSelectedItems.delete(id);
    } else {
      newSelectedItems.add(id);
    }
    setSelectedItems(newSelectedItems);
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedItems.size === paginatedData.length) {
      // Deselect all
      setSelectedItems(new Set());
    } else {
      // Select all
      const newSelectedItems = new Set<string>();
      paginatedData.forEach(item => newSelectedItems.add(item.id));
      setSelectedItems(newSelectedItems);
    }
  };

  // Handle approve selected
  const handleApprove = () => {
    if (selectedItems.size === 0) return;
    onApprove(Array.from(selectedItems), commentText);
    setSelectedItems(new Set());
    setCommentText('');
  };

  // Handle reject selected
  const handleReject = () => {
    if (selectedItems.size === 0 || !commentText.trim()) return;
    onReject(Array.from(selectedItems), commentText);
    setSelectedItems(new Set());
    setCommentText('');
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  // Format price change
  const formatPriceChange = (item: any) => {
    const diff = item.proposedPrice - item.currentREVAPrice;
    const percentage = (diff / item.currentREVAPrice) * 100;
    const sign = diff >= 0 ? '+' : '';
    return (
      <div>
        <div className={diff >= 0 ? 'text-green-400' : 'text-red-400'}>
          {sign}£{diff.toFixed(2)} ({sign}{percentage.toFixed(2)}%)
        </div>
      </div>
    );
  };

  if (submittedItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-gray-900/40 w-16 h-16 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-medium mb-2">No pending approvals</h3>
        <p className="text-muted-foreground max-w-md">
          There are currently no price changes waiting for your approval. When users submit price changes, they will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Pending Approvals ({submittedItems.length})</h2>
      </div>
      
      <div className="bg-amber-900/20 border border-amber-900/30 p-4 rounded-md mb-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5" />
          <div>
            <h3 className="font-medium mb-1">Pending Price Change Approvals</h3>
            <p className="text-sm text-muted-foreground">
              Review the proposed price changes below. You can approve or reject items individually or in batches.
              When rejecting items, please provide a comment explaining the reason.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by description..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="default" 
            size="sm"
            disabled={selectedItems.size === 0}
            onClick={handleApprove}
            className="whitespace-nowrap"
          >
            <Check className="h-4 w-4 mr-2" />
            Approve Selected ({selectedItems.size})
          </Button>
          
          <Button 
            variant="destructive" 
            size="sm"
            disabled={selectedItems.size === 0 || !commentText.trim()}
            onClick={handleReject}
            className="whitespace-nowrap"
          >
            <X className="h-4 w-4 mr-2" />
            Reject Selected
          </Button>
        </div>
      </div>

      {/* Rejection comment */}
      {selectedItems.size > 0 && (
        <div className="mb-4">
          <Input
            placeholder="Comment for rejection (required for reject action)"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />
        </div>
      )}
      
      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30px]">
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-500"
                    checked={selectedItems.size > 0 && selectedItems.size === paginatedData.length}
                    onChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead 
                  className="cursor-pointer bg-gray-900/70 hover:bg-gray-900"
                  onClick={() => handleSort('description')}
                >
                  <div className="flex items-center">
                    Description
                    {renderSortIndicator('description')}
                  </div>
                </TableHead>
                <TableHead>Current Price</TableHead>
                <TableHead>Proposed Price</TableHead>
                <TableHead>Change</TableHead>
                <TableHead>Margin</TableHead>
                <TableHead>Usage Rank</TableHead>
                <TableHead>Submitted By</TableHead>
                <TableHead>Submission Date</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((item, index) => (
                <TableRow key={index} className={selectedItems.has(item.id) ? 'bg-blue-950/30' : ''}>
                  <TableCell>
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-500"
                      checked={selectedItems.has(item.id)}
                      onChange={() => handleSelectItem(item.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      {item.description}
                      <div className="flex gap-1 mt-1">
                        {item.flag1 && (
                          <Badge variant="outline" className="text-xs bg-red-900/20 text-red-400 border-red-900">
                            Rule 1
                          </Badge>
                        )}
                        {item.flag2 && (
                          <Badge variant="outline" className="text-xs bg-amber-900/20 text-amber-400 border-amber-900">
                            Rule 2
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>£{item.currentREVAPrice.toFixed(2)}</TableCell>
                  <TableCell>£{item.proposedPrice.toFixed(2)}</TableCell>
                  <TableCell>{formatPriceChange(item)}</TableCell>
                  <TableCell>{formatPercentage(item.proposedMargin)}</TableCell>
                  <TableCell>{item.usageRank}</TableCell>
                  <TableCell>{item.submittedBy || 'System'}</TableCell>
                  <TableCell>{new Date(item.submissionDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0" 
                        onClick={() => onApprove([item.id])}
                      >
                        <Check className="h-4 w-4 text-green-400" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          setSelectedItems(new Set([item.id]));
                          setCommentText('');
                        }}
                      >
                        <X className="h-4 w-4 text-red-400" />
                      </Button>
                    </div>
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

export default ApprovalsTab;
