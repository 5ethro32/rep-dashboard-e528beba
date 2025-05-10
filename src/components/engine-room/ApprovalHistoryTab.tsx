
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Download, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';

interface ApprovalHistoryTabProps {
  data: any[];
  onExport?: () => void;
}

const ApprovalHistoryTab: React.FC<ApprovalHistoryTabProps> = ({ data, onExport }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Filter items with approval-related status (approved or rejected)
  const approvalItems = data.filter(item => 
    item.workflowStatus === 'approved' || item.workflowStatus === 'rejected'
  );

  // Filter by search
  const filteredData = approvalItems.filter((item) => 
    item.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort by review date (most recent first)
  const sortedData = [...filteredData].sort((a, b) => {
    const dateA = new Date(a.reviewDate || a.submissionDate || 0);
    const dateB = new Date(b.reviewDate || b.submissionDate || 0);
    return dateB.getTime() - dateA.getTime();
  });

  // Paginate the data
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

  // Format percentage - add null check
  const formatPercentage = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'N/A';
    return `${(value * 100).toFixed(2)}%`;
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
          <Badge variant="outline" className="bg-green-900/20 text-green-400 border-green-900">
            <CheckCircle className="h-3 w-3 mr-1" /> Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="bg-red-900/20 text-red-400 border-red-900">
            <XCircle className="h-3 w-3 mr-1" /> Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-blue-900/20 text-blue-400 border-blue-900">
            <Clock className="h-3 w-3 mr-1" /> Pending
          </Badge>
        );
    }
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
        
        {onExport && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={onExport}
            className="whitespace-nowrap"
          >
            <Download className="h-4 w-4 mr-2" />
            Export History
          </Button>
        )}
      </div>
      
      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Current Price</TableHead>
                <TableHead>Proposed Price</TableHead>
                <TableHead>Change</TableHead>
                <TableHead>Margin</TableHead>
                <TableHead>Usage Rank</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted By</TableHead>
                <TableHead>Review Date</TableHead>
                <TableHead>Comments</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((item, index) => (
                <TableRow key={index}>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {/* Updated Pagination with shadcn UI components */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedData.length)} of {sortedData.length}
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
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
