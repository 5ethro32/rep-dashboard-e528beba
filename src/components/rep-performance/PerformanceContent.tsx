
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { RepData, SummaryData } from '@/types/rep-performance.types';
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { calculateSummary } from '@/utils/rep-performance-utils';
import { toast } from '@/hooks/use-toast';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useIsMobile } from '@/hooks/use-mobile';

interface PerformanceContentProps {
  tabValues: string[];
  getActiveData: (tabValue: string) => RepData[];
  sortData: (data: RepData[]) => RepData[];
  sortBy: string;
  sortOrder: string;
  handleSort: (column: string) => void;
  repChanges: Record<string, any>;
  formatCurrency: (value: number) => string;
  formatPercent: (value: number) => string;
  formatNumber: (value: number) => string;
  renderChangeIndicator: (
    changeValue: number, 
    size: string, 
    metricType: string, 
    repName: string, 
    metricValue: number
  ) => JSX.Element;
  isLoading: boolean;
  getFebValue: (repName: string, metricType: string, currentValue: number, changePercent: number) => string;
  selectedMonth: string;
  summary: SummaryData;
  includeRetail: boolean;
  includeReva: boolean;
  includeWholesale: boolean;
  baseSummary: SummaryData;
  revaValues: SummaryData;
  wholesaleValues: SummaryData;
  selectedUserName?: string;
}

const PerformanceContent: React.FC<PerformanceContentProps> = ({ 
  tabValues, 
  getActiveData,
  sortData,
  sortBy,
  sortOrder,
  handleSort,
  repChanges,
  formatCurrency,
  formatPercent,
  formatNumber,
  renderChangeIndicator,
  isLoading,
  getFebValue,
  selectedMonth,
  summary,
  includeRetail,
  includeReva, 
  includeWholesale,
  baseSummary,
  revaValues,
  wholesaleValues,
  selectedUserName = 'All Data'
}) => {
  const [activeTab, setActiveTab] = useState('overall');
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const isMobile = useIsMobile();
  
  const tabLabels: Record<string, string> = {
    'overall': 'Overview',
    'rep': 'Retail',
    'reva': 'REVA',
    'wholesale': 'Wholesale'
  };

  // Handle tab change
  const handleTabChange = (tabValue: string) => {
    if (!tabValues.includes(tabValue)) return;
    setActiveTab(tabValue);
  };

  // Get data for the active tab
  const activeData = React.useMemo(() => {
    if (isLoading) return [];
    return sortData(getActiveData(activeTab));
  }, [activeTab, isLoading, getActiveData, sortData]);
  
  // Define the columns for each tab
  const getColumns = () => {
    const baseColumns = [
      { id: 'rep', name: 'Rep', sortable: true, className: 'text-left' },
      { id: 'profit', name: 'Profit', sortable: true, className: 'text-right', formatter: formatCurrency },
      { id: 'spend', name: 'Spend', sortable: true, className: 'text-right', formatter: formatCurrency },
      { id: 'margin', name: 'Margin', sortable: true, className: 'text-right', formatter: formatPercent },
      { id: 'packs', name: 'Packs', sortable: true, className: 'text-right', formatter: formatNumber },
      { id: 'activeAccounts', name: 'Active Accounts', sortable: true, className: 'text-right', formatter: formatNumber }
    ];
    
    // Vary columns based on tab for better display
    if (activeTab === 'rep' || activeTab === 'reva' || activeTab === 'wholesale') {
      return baseColumns.slice(0, 6);
    }
    
    return baseColumns;
  };
  
  const columns = getColumns();

  // Check if there's data to display
  const noDataMessage = () => {
    if (isLoading) return null;

    // If no data due to filter settings
    if (activeTab === 'rep' && !includeRetail) {
      return (
        <div className="py-8 text-center text-white/50">
          Retail data is currently filtered out. Enable it in the filters above to see the data.
        </div>
      );
    } else if (activeTab === 'reva' && !includeReva) {
      return (
        <div className="py-8 text-center text-white/50">
          REVA data is currently filtered out. Enable it in the filters above to see the data.
        </div>
      );
    } else if (activeTab === 'wholesale' && !includeWholesale) {
      return (
        <div className="py-8 text-center text-white/50">
          Wholesale data is currently filtered out. Enable it in the filters above to see the data.
        </div>
      );
    }
    
    // General no data message
    if (activeData.length === 0) {
      return (
        <div className="py-8 text-center text-white/50">
          No data available for the selected filters and month.
        </div>
      );
    }
    
    return null;
  };

  // Determine the sort indicator
  const getSortIndicator = (column: string) => {
    if (sortBy !== column) return null;
    
    return sortOrder === 'asc' ? 
      <ChevronUp className="h-4 w-4 ml-1" /> : 
      <ChevronDown className="h-4 w-4 ml-1" />;
  };
  
  // Create tooltips for column headers
  const getColumnTooltip = (columnId: string) => {
    switch (columnId) {
      case 'rep':
        return 'Sales representative';
      case 'profit':
        return 'Total profit for the period';
      case 'spend':
        return 'Total customer spend';
      case 'margin':
        return 'Profit as a percentage of spend';
      case 'packs':
        return 'Number of product packs sold';
      case 'activeAccounts':
        return 'Number of accounts with orders';
      default:
        return '';
    }
  };
  
  // Function to get tab-specific title
  const getTabTitle = () => {
    if (selectedUserName === 'All Data') {
      return `${tabLabels[activeTab]} Performance - All Users`;
    } else if (selectedUserName === 'My Data') {
      return `My ${tabLabels[activeTab]} Performance`;
    } else {
      return `${selectedUserName}'s ${tabLabels[activeTab]} Performance`;
    }
  };
  
  // Copy row data to clipboard
  const copyRowData = (row: RepData) => {
    const formattedData = `
Rep: ${row.rep}
Profit: ${formatCurrency(row.profit)}
Spend: ${formatCurrency(row.spend)}
Margin: ${formatPercent(row.margin)}
Packs: ${formatNumber(row.packs)}
Active Accounts: ${formatNumber(row.activeAccounts)}
    `.trim();
    
    navigator.clipboard.writeText(formattedData);
    toast({ title: "Copied!", description: "Row data copied to clipboard" });
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <h2 className="text-xl md:text-2xl font-semibold text-white">
          {getTabTitle()}
        </h2>
        
        {/* Mobile view uses a select dropdown instead of tabs */}
        {isMobile ? (
          <Select value={activeTab} onValueChange={handleTabChange}>
            <SelectTrigger className="w-full md:w-[200px] bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="View" />
            </SelectTrigger>
            <SelectContent>
              {tabValues.map((tab) => (
                <SelectItem key={tab} value={tab}>
                  {tabLabels[tab]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Tabs 
            value={activeTab} 
            onValueChange={handleTabChange}
            className="w-full md:w-auto"
          >
            <TabsList className="bg-white/5 border border-white/10">
              {tabValues.map((tab) => (
                <TabsTrigger 
                  key={tab} 
                  value={tab}
                  className="data-[state=active]:bg-white/10 text-white"
                >
                  {tabLabels[tab]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}
      </div>
      
      <div className="relative overflow-x-auto rounded-lg border border-white/10">
        <Table className="w-full">
          <TableHeader className="bg-white/5">
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.id}
                  className={cn(
                    "text-white", 
                    column.className,
                    column.sortable ? "cursor-pointer hover:text-white/70 transition-colors" : ""
                  )}
                  onClick={() => column.sortable ? handleSort(column.id) : null}
                >
                  <div className="flex items-center justify-end">
                    {column.id === 'rep' ? (
                      <span className="mr-auto flex items-center">
                        {column.name}
                        {getSortIndicator(column.id)}
                      </span>
                    ) : (
                      <div className="flex items-center">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="flex items-center">
                                {column.name}
                                <Info className="h-3.5 w-3.5 ml-1 opacity-50" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="bg-gray-800 text-white border-gray-700">
                              <p>{getColumnTooltip(column.id)}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        {getSortIndicator(column.id)}
                      </div>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading skeleton rows
              Array.from({ length: 10 }).map((_, index) => (
                <TableRow key={`loading-${index}`}>
                  {columns.map((column) => (
                    <TableCell key={`loading-cell-${column.id}-${index}`}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : activeData.length > 0 ? (
              // Actual data rows
              activeData.map((row, index) => {
                const isHovered = hoveredRow === `row-${index}`;
                
                return (
                  <TableRow 
                    key={`${row.rep}-${index}`}
                    className="cursor-pointer hover:bg-white/5"
                    onMouseEnter={() => setHoveredRow(`row-${index}`)}
                    onMouseLeave={() => setHoveredRow(null)}
                    onClick={() => copyRowData(row)}
                  >
                    {columns.map((column) => (
                      <TableCell 
                        key={`${row.rep}-${column.id}`}
                        className={cn(
                          "py-2.5",
                          column.className
                        )}
                      >
                        {column.id === 'rep' ? (
                          <div className="font-medium text-white">{row.rep}</div>
                        ) : (
                          <div className="flex justify-end items-center gap-1.5">
                            <span>
                              {column.formatter(row[column.id as keyof RepData] as number)}
                            </span>
                            
                            {repChanges && repChanges[row.rep] && (
                              renderChangeIndicator(
                                repChanges[row.rep][column.id], 
                                "small",
                                column.id,
                                row.rep,
                                row[column.id as keyof RepData] as number
                              )
                            )}
                          </div>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center">
                  {noDataMessage()}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="text-xs text-white/40 text-right italic">
        Click on any row to copy its data to clipboard
      </div>
    </div>
  );
};

export default PerformanceContent;
