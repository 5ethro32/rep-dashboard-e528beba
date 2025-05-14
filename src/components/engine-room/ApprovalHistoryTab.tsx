import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Download, CheckCircle, XCircle, Clock, ArrowUp, ArrowDown, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/utils/formatting-utils';

interface ApprovalHistoryTabProps {
  data: any[];
  onExport?: () => void;
  onToggleStar?: (itemId: string) => void;
  starredItems?: Set<string>;
}

const ApprovalHistoryTab: React.FC<ApprovalHistoryTabProps> = ({ 
  data, 
  onExport,
  onToggleStar,
  starredItems = new Set()
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string>('reviewDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterByRank, setFilterByRank] = useState<string | null>(null);
  const itemsPerPage = 20;

  // Filter items with approval-related status (approved or rejected)
  const approvalItems = data.filter(item => 
    item.workflowStatus === 'approved' || item.workflowStatus === 'rejected'
  );

  // Get unique usage ranks for filter
  const usageRanks = Array.from(new Set(approvalItems.map(item => item.usageRank))).sort((a, b) => a - b);

  // Filter by search and usage rank
  const filteredData = approvalItems.filter((item) => {
    const matchesSearch = item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRank = filterByRank ? item.usageRank === parseInt(filterByRank, 10) : true;
    return matchesSearch && matchesRank;
  });

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
      ? <ArrowUp className="h-3 w-3 ml-1" /> 
      : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  // Sort by selected field
  const sortedData = [...filteredData].sort((a, b) => {
    let fieldA = a[sortField];
    let fieldB = b[sortField];
    
    // Handle date fields specially
    if (sortField === 'reviewDate' || sortField === 'submissionDate') {
      const dateA = new Date(fieldA || 0);
      const dateB = new Date(fieldB || 0);
      return sortDirection === 'asc' 
        ? dateA.getTime() - dateB.getTime() 
        : dateB.getTime() - dateA.getTime();
    }
    
    // Handle price change percentage
    if (sortField === 'priceChangePercentage') {
      const aChange = calculatePriceChangePercentage(a);
      const bChange = calculatePriceChangePercentage(b);
      return sortDirection === 'asc' ? aChange - bChange : bChange - aChange;
    }
    
    // Handle null/undefined values
    if (fieldA === undefined || fieldA === null) fieldA = '';
    if (fieldB === undefined || fieldB === null) fieldB = '';
    
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

  // Group data by usage rank
  const groupedByRank = sortedData.reduce((acc: Record<string, any[]>, item: any) => {
    const rank = item.usageRank || 'Unknown';
    if (!acc[rank]) {
      acc[rank] = [];
    }
    acc[rank].push(item);
    return acc;
  }, {});

  // Paginate the data
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

  // Format percentage - add null check
  const formatPercentage = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'N/A';
    return `${(value * 100).toFixed(2)}%`;
  };

  // Calculate price change percentage
  const calculatePriceChangePercentage = (item: any) => {
    const currentPrice = item.currentREVAPrice || 0;
    const proposedPrice = item.proposedPrice || 0;
    
    if (currentPrice === 0) return 0;
    
    return ((proposedPrice - currentPrice) / currentPrice) * 100;
  };

  // Format price change - add null checks
  const formatPriceChange = (item: any) => {
    const currentPrice = item.currentREVAPrice || 0;
    const proposedPrice = item.proposedPrice || 0;
    
    if (currentPrice === 0) return 'N/A';
    
    const diff = proposedPrice - currentPrice;
    const percentage = (diff / currentPrice) * 100;
    const sign = diff >= 0 ? '+' : '';
    
    return (
      <div>
        <div className={diff >= 0 ? 'text-green-400' : 'text-red-400'}>
          {sign}£{diff.toFixed(2)} ({sign}{percentage.toFixed(2)}%)
        </div>
      </div>
    );
  };

  // Render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge variant="outline" className="bg-green-900/20 text-green-400 border-green-900 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="bg-red-900/20 text-red-400 border-red-900 flex items-center gap-1">
            <XCircle className="h-3 w-3" /> Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-blue-900/20 text-blue-400 border-blue-900 flex items-center gap-1">
            <Clock className="h-3 w-3" /> Pending
          </Badge>
        );
    }
  };

  // Add star functionality
  const handleToggleStar = (event: React.MouseEvent, itemId: string) => {
    event.stopPropagation();
    if (onToggleStar) {
      onToggleStar(itemId);
    }
  };

  const renderApprovalTable = (items: any[]) => {
    return (
      <div className="overflow-hidden">
        <div className="overflow-y-auto max-h-[600px]">
          <Table>
            <TableHeader className="sticky top-0 z-30 bg-gray-950/95 backdrop-blur-sm">
              <TableRow>
                <TableHead className="cursor-pointer" onClick={() => handleSort('description')}>
                  <div className="flex items-center">
                    Description
                    {renderSortIndicator('description')}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('currentREVAPrice')}>
                  <div className="flex items-center">
                    Current Price
                    {renderSortIndicator('currentREVAPrice')}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('proposedPrice')}>
                  <div className="flex items-center">
                    Proposed Price
                    {renderSortIndicator('proposedPrice')}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('priceChangePercentage')}>
                  <div className="flex items-center">
                    Change
                    {renderSortIndicator('priceChangePercentage')}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('proposedMargin')}>
                  <div className="flex items-center">
                    Margin
                    {renderSortIndicator('proposedMargin')}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('usageRank')}>
                  <div className="flex items-center">
                    Usage Rank
                    {renderSortIndicator('usageRank')}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('workflowStatus')}>
                  <div className="flex items-center">
                    Status
                    {renderSortIndicator('workflowStatus')}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('submittedBy')}>
                  <div className="flex items-center">
                    Submitted By
                    {renderSortIndicator('submittedBy')}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('reviewDate')}>
                  <div className="flex items-center">
                    Review Date
                    {renderSortIndicator('reviewDate')}
                  </div>
                </TableHead>
                <TableHead>Comments</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-10">
                    No approval history items found
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item, index) => {
                  // Calculate price change percentage for each item
                  const priceChangePercentage = calculatePriceChangePercentage(item);
                  
                  return (
                    <TableRow key={index} className="hover:bg-gray-800/40">
                      <TableCell className="font-medium">{item.description || 'Unknown'}</TableCell>
                      <TableCell>{item.currentREVAPrice ? `£${item.currentREVAPrice.toFixed(2)}` : 'N/A'}</TableCell>
                      <TableCell>{item.proposedPrice ? `£${item.proposedPrice.toFixed(2)}` : 'N/A'}</TableCell>
                      <TableCell>{formatPriceChange(item)}</TableCell>
                      <TableCell>{formatPercentage(item.proposedMargin)}</TableCell>
                      <TableCell>{item.usageRank || 'N/A'}</TableCell>
                      <TableCell>{renderStatusBadge(item.workflowStatus)}</TableCell>
                      <TableCell>{item.submittedBy || 'System'}</TableCell>
                      <TableCell>
                        {item.reviewDate 
                          ? new Date(item.reviewDate).toLocaleDateString() 
                          : 'Not reviewed'}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate">
                          {item.reviewComments || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Star 
                          className={`h-4 w-4 cursor-pointer ${starredItems.has(item.id) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400 hover:text-gray-300'}`}
                          onClick={(e) => handleToggleStar(e, item.id)}
                        />
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

  // Render the grouped items by usage rank
  const renderGroupedItems = () => {
    if (filterByRank) {
      // If filtering by rank, don't group
      return (
        <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            {renderApprovalTable(paginatedData)}
          </div>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        {Object.keys(groupedByRank).sort((a, b) => Number(a) - Number(b)).map((rank) => (
          <div key={rank} className="space-y-2">
            <h3 className="text-lg font-medium">Usage Rank {rank} ({groupedByRank[rank].length} items)</h3>
            <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                {renderApprovalTable(groupedByRank[rank].slice(0, itemsPerPage))}
              </div>
            </Card>
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

  if (approvalItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-gray-900/40 w-16 h-16 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-medium mb-2">No approval history</h3>
        <p className="text-muted-foreground max-w-md">
          There is no history of approved or rejected price changes. Once items are approved or rejected, they will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Approval History ({approvalItems.length})</h2>
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

        <select 
          className="bg-gray-900/40 border border-gray-700 rounded-md px-2 py-2 text-sm w-32"
          value={filterByRank || ''}
          onChange={(e) => setFilterByRank(e.target.value || null)}
        >
          <option value="">All Ranks</option>
          {usageRanks.map(rank => (
            <option key={rank} value={rank}>Rank {rank}</option>
          ))}
        </select>
        
        {onExport && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={onExport}
            className="whitespace-nowrap bg-gray-900/40"
          >
            <Download className="h-4 w-4 mr-2" />
            Export History
          </Button>
        )}
      </div>
      
      {filterByRank ? (
        <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            {renderApprovalTable(paginatedData)}
          </div>
        </Card>
      ) : (
        renderGroupedItems()
      )}
      
      {/* Pagination - only show when filtering by rank */}
      {filterByRank && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedData.length)} of {sortedData.length}
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(currentPage + 1)}
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

export default ApprovalHistoryTab;
