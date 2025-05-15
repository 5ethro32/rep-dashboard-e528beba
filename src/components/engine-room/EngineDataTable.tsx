import React, { useState, useEffect, useMemo } from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, Download, Filter, Info, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/components/ui/use-toast";
import { useEngineRoom } from '@/contexts/EngineRoomContext';
import { formatCurrency, formatPercentage } from '@/utils/formatting-utils';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface EngineDataTableProps {
  data: any[];
  onShowPriceDetails?: (item: any) => void;
  onPriceChange?: (id: string, newPrice: number) => void;
  onToggleStar?: (id: string) => void;
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
  const { userRole } = useEngineRoom();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [editingCell, setEditingCell] = useState<{ id: string, value: string } | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Reset row selection when data changes
  useEffect(() => {
    setRowSelection({});
  }, [data]);

  // Format rule display for better readability
  const formatRuleDisplay = (rule: string, item: any) => {
    if (!rule) return '';
    
    // Add null check to prevent accessing properties on undefined item
    if (!item) return rule;

    // Check if this is a zero-cost item
    const isZeroCostItem = 
      (item.zeroCostItem === true) || 
      (typeof item.avgCost === 'number' && item.avgCost === 0);

    // For zero-cost items, show special text instead of margin cap info
    if (isZeroCostItem && rule.includes("Margin Cap")) {
      return rule.replace(/Margin Cap.+?(?=\]|$)/, "Zero Cost Pricing");
    }

    const rulePattern = /Grp\s*(\d+)-(\d+)/i;
    const match = rule.match(rulePattern);
    
    if (match) {
      const groupStart = parseInt(match[1]);
      const groupEnd = parseInt(match[2]);
      
      // Determine usage group description
      let groupDesc = "";
      if (groupStart <= 2) {
        groupDesc = "High Volume";
      } else if (groupStart <= 4) {
        groupDesc = "Medium Volume";
      } else {
        groupDesc = "Low Volume";
      }
      
      // Replace the group numbers with the description
      return rule.replace(rulePattern, groupDesc);
    }
    
    return rule;
  };

  // Format flag display
  const formatFlagDisplay = (flags: string[] | boolean[] | undefined) => {
    if (!flags) return [];
    
    // Convert boolean flags to string format
    if (typeof flags[0] === 'boolean') {
      const result = [];
      if (flags[0]) result.push('HIGH_PRICE');
      if (flags[1]) result.push('LOW_MARGIN');
      return result;
    }
    
    return flags;
  };

  // Handle price change
  const handlePriceChange = (id: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && onPriceChange) {
      onPriceChange(id, numValue);
    }
    setEditingCell(null);
  };

  // Export selected rows to CSV
  const exportSelectedRows = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    if (selectedRows.length === 0) {
      toast({
        title: "No rows selected",
        description: "Please select at least one row to export.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);

    try {
      // Format row data for export
      const formattedRows = selectedRows.map(row => formatRowDataForExport(row.original));
      
      // Create CSV content
      const headers = Object.keys(formattedRows[0]);
      const csvContent = [
        headers.join(','),
        ...formattedRows.map(row => 
          headers.map(header => {
            const value = row[header];
            // Handle values that need quotes (contain commas, quotes, or newlines)
            if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        )
      ].join('\n');
      
      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `pricing-data-export-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export successful",
        description: `Exported ${selectedRows.length} rows to CSV.`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: "An error occurred while exporting data.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Format row data for export
  const formatRowDataForExport = (rowData: any) => {
    return {
      'Description': rowData.description || '',
      'REVA Usage': rowData.revaUsage || 0,
      'Usage Rank': rowData.usageRank || 0,
      'Average Cost': rowData.avgCost || 0,
      'Next Cost': rowData.nextCost || 0,
      'Current Price': rowData.currentREVAPrice || 0,
      'Current Margin': rowData.currentREVAMargin ? `${rowData.currentREVAMargin}%` : '0%',
      'Proposed Price': rowData.proposedPrice || rowData.currentREVAPrice || 0,
      'Proposed Margin': rowData.proposedMargin ? `${rowData.proposedMargin}%` : '0%',
      'Market Low': rowData.marketLow || 0,
      'Market Average': rowData.marketAverage || 0,
      'Applied Rule': formatRuleDisplay(rowData.appliedRule, rowData),
      'Flags': formatFlagDisplay(rowData.flags || [rowData.flag1, rowData.flag2]).join(', '),
      'Status': rowData.workflowStatus || 'draft',
      'Submitted By': rowData.submittedBy || '',
      'Submission Date': rowData.submissionDate || '',
    };
  };

  // Define table columns
  const columns: ColumnDef<any>[] = useMemo(() => [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "star",
      header: "",
      cell: ({ row }) => {
        const item = row.original;
        const isStarred = starredItems.has(item.id);
        return (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onToggleStar && onToggleStar(item.id)}
            className={cn(
              "h-8 w-8 p-0",
              isStarred && "text-yellow-500 hover:text-yellow-600"
            )}
          >
            <Star className="h-4 w-4" fill={isStarred ? "currentColor" : "none"} />
          </Button>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "description",
      header: ({ column }) => (
        <div className="flex items-center">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 hover:bg-transparent"
          >
            Description
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ),
      cell: ({ row }) => (
        <div className="font-medium max-w-[200px] truncate">
          {row.original.description}
        </div>
      ),
    },
    {
      accessorKey: "revaUsage",
      header: ({ column }) => (
        <div className="flex items-center justify-end">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 hover:bg-transparent"
          >
            Usage
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-right font-medium">
          {row.original.revaUsage?.toLocaleString() || 0}
        </div>
      ),
    },
    {
      accessorKey: "usageRank",
      header: ({ column }) => (
        <div className="flex items-center justify-end">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 hover:bg-transparent"
          >
            Rank
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-right font-medium">
          {row.original.usageRank || '-'}
        </div>
      ),
    },
    {
      accessorKey: "avgCost",
      header: ({ column }) => (
        <div className="flex items-center justify-end">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 hover:bg-transparent"
          >
            Cost
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-right font-medium">
          {formatCurrency(row.original.avgCost)}
        </div>
      ),
    },
    {
      accessorKey: "currentREVAPrice",
      header: ({ column }) => (
        <div className="flex items-center justify-end">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 hover:bg-transparent"
          >
            Current Price
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-right font-medium">
          {formatCurrency(row.original.currentREVAPrice)}
        </div>
      ),
    },
    {
      accessorKey: "currentREVAMargin",
      header: ({ column }) => (
        <div className="flex items-center justify-end">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 hover:bg-transparent"
          >
            Current Margin
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ),
      cell: ({ row }) => {
        const margin = row.original.currentREVAMargin;
        return (
          <div className={cn(
            "text-right font-medium",
            margin < 0 && "text-red-500",
            margin >= 0 && margin < 10 && "text-amber-500",
            margin >= 10 && "text-green-500"
          )}>
            {formatPercentage(margin)}
          </div>
        );
      },
    },
    {
      accessorKey: "proposedPrice",
      header: ({ column }) => (
        <div className="flex items-center justify-end">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 hover:bg-transparent"
          >
            Proposed Price
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ),
      cell: ({ row }) => {
        const item = row.original;
        const isEditing = editingCell && editingCell.id === item.id;
        
        if (isEditing) {
          return (
            <div className="text-right">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={editingCell.value}
                onChange={(e) => setEditingCell({ id: item.id, value: e.target.value })}
                onBlur={() => handlePriceChange(item.id, editingCell.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handlePriceChange(item.id, editingCell.value);
                  } else if (e.key === 'Escape') {
                    setEditingCell(null);
                  }
                }}
                autoFocus
                className="w-20 h-8 text-right"
              />
            </div>
          );
        }
        
        const currentPrice = item.currentREVAPrice || 0;
        const proposedPrice = item.proposedPrice !== undefined ? item.proposedPrice : currentPrice;
        const priceDiff = proposedPrice - currentPrice;
        const pricePctChange = currentPrice > 0 ? (priceDiff / currentPrice) * 100 : 0;
        
        return (
          <div className="text-right flex items-center justify-end gap-1">
            <div 
              className={cn(
                "font-medium cursor-pointer",
                priceDiff > 0 && "text-green-500",
                priceDiff < 0 && "text-red-500"
              )}
              onClick={() => setEditingCell({ id: item.id, value: proposedPrice.toString() })}
            >
              {formatCurrency(proposedPrice)}
            </div>
            {priceDiff !== 0 && (
              <span className={cn(
                "text-xs",
                priceDiff > 0 && "text-green-500",
                priceDiff < 0 && "text-red-500"
              )}>
                ({priceDiff > 0 ? '+' : ''}{pricePctChange.toFixed(1)}%)
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "proposedMargin",
      header: ({ column }) => (
        <div className="flex items-center justify-end">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 hover:bg-transparent"
          >
            Proposed Margin
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ),
      cell: ({ row }) => {
        const item = row.original;
        const currentMargin = item.currentREVAMargin || 0;
        const proposedMargin = item.proposedMargin !== undefined ? item.proposedMargin : currentMargin;
        const marginDiff = proposedMargin - currentMargin;
        
        return (
          <div className="text-right flex items-center justify-end gap-1">
            <div className={cn(
              "font-medium",
              proposedMargin < 0 && "text-red-500",
              proposedMargin >= 0 && proposedMargin < 10 && "text-amber-500",
              proposedMargin >= 10 && "text-green-500"
            )}>
              {formatPercentage(proposedMargin)}
            </div>
            {marginDiff !== 0 && (
              <span className={cn(
                "text-xs",
                marginDiff > 0 && "text-green-500",
                marginDiff < 0 && "text-red-500"
              )}>
                ({marginDiff > 0 ? '+' : ''}{marginDiff.toFixed(1)}pts)
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "marketLow",
      header: ({ column }) => (
        <div className="flex items-center justify-end">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 hover:bg-transparent"
          >
            Market Low
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-right font-medium">
          {formatCurrency(row.original.marketLow)}
        </div>
      ),
    },
    {
      accessorKey: "appliedRule",
      header: "Applied Rule",
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate">
          {formatRuleDisplay(row.original.appliedRule, row.original)}
        </div>
      ),
    },
    {
      accessorKey: "flags",
      header: "Flags",
      cell: ({ row }) => {
        const item = row.original;
        const flags = formatFlagDisplay(item.flags || [item.flag1, item.flag2]);
        
        if (!flags || flags.length === 0) {
          return <div>-</div>;
        }
        
        return (
          <div className="flex flex-wrap gap-1">
            {flags.map((flag, index) => {
              let variant: "default" | "destructive" | "outline" = "default";
              let label = flag;
              
              if (flag === 'HIGH_PRICE' || flag === true) {
                variant = "destructive";
                label = "High Price";
              } else if (flag === 'LOW_MARGIN' || (Array.isArray(flags) && flags[1] === true)) {
                variant = "outline";
                label = "Low Margin";
              }
              
              return (
                <Badge key={index} variant={variant} className="text-xs">
                  {label}
                </Badge>
              );
            })}
          </div>
        );
      },
    },
    {
      accessorKey: "workflowStatus",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.workflowStatus || 'draft';
        let badgeVariant: "default" | "secondary" | "outline" | "destructive" = "outline";
        
        if (status === 'approved') {
          badgeVariant = "default";
        } else if (status === 'submitted') {
          badgeVariant = "secondary";
        } else if (status === 'rejected') {
          badgeVariant = "destructive";
        }
        
        return (
          <Badge variant={badgeVariant} className="capitalize">
            {status}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const item = row.original;
        
        return (
          <div className="flex justify-end">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onShowPriceDetails && onShowPriceDetails(item)}
                  >
                    <Info className="h-4 w-4" />
                    <span className="sr-only">View details</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View pricing details</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      },
    },
  ], [editingCell, onShowPriceDetails, onToggleStar, starredItems]);

  // Create table instance
  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  // If data is empty, show loading state
  if (!data || data.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-[250px]" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-[100px]" />
            <Skeleton className="h-8 w-[100px]" />
          </div>
        </div>
        
        <div className="rounded-md border">
          <div className="h-[400px] relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-muted-foreground">No data available</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Filter descriptions..."
            value={(table.getColumn("description")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("description")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
          
          {flagFilter !== undefined && onFlagFilterChange && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="ml-2 gap-1">
                  <Filter className="h-4 w-4" />
                  Flag Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => onFlagFilterChange('all')}>
                  All Flags
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onFlagFilterChange('HIGH_PRICE')}>
                  High Price Only
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onFlagFilterChange('LOW_MARGIN')}>
                  Low Margin Only
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportSelectedRows}
            disabled={isExporting || table.getFilteredSelectedRowModel().rows.length === 0}
            className="ml-auto gap-1"
          >
            <Download className="h-4 w-4" />
            Export {table.getFilteredSelectedRowModel().rows.length > 0 ? 
              `(${table.getFilteredSelectedRowModel().rows.length})` : ''}
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="ml-auto">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id === 'currentREVAPrice' ? 'Current Price' :
                       column.id === 'currentREVAMargin' ? 'Current Margin' :
                       column.id === 'avgCost' ? 'Cost' :
                       column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="whitespace-nowrap">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EngineDataTable;
