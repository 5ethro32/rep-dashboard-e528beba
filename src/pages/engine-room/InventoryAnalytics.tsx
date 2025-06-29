import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  UploadCloud, 
  Package, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  BarChart3,
  Download,
  Info,
  Star,
  Clock,
  Flag,
  TrendingDown,
  Filter
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import MetricCard from '@/components/MetricCard';
import { 
  processInventoryExcelFile, 
  exportInventoryAnalysisToExcel,
  ProcessedInventoryData,
  ProcessedInventoryItem
} from '@/utils/inventory-analysis-utils';
import { formatCurrency } from '@/utils/formatting-utils';

// Import chart components from existing charts
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';

// Add imports for dropdown components at the top
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

// Helper functions for average cost display logic
// Use calculated next average cost (Column J) when meaningful, otherwise use avg_cost
// Column J contains blended average cost when new stock is on order at different prices
const getDisplayedAverageCost = (item: ProcessedInventoryItem): number | null => {
  // Use calculated_next_avg_cost (Column J) if it has a meaningful value (>0), otherwise use avg_cost (Column G)
  if ((item as any).calculated_next_avg_cost && (item as any).calculated_next_avg_cost > 0) {
    return (item as any).calculated_next_avg_cost;
  }
  return item.avg_cost || null;
};

const shouldShowAverageCostTooltip = (item: ProcessedInventoryItem): boolean => {
  // Show tooltip when using calculated_next_avg_cost (Column J) instead of avg_cost (Column G)
  return !!((item as any).calculated_next_avg_cost && (item as any).calculated_next_avg_cost > 0 && item.avg_cost && item.avg_cost > 0);
};

const getAverageCostTooltip = (item: ProcessedInventoryItem): string => {
  // Show original avg_cost (Column G) when displaying calculated_next_avg_cost (Column J)
  if (item.avg_cost && item.avg_cost > 0) {
    return `Original Avg Cost: ${new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(item.avg_cost)}`;
  }
  return '';
};

// Sticky Horizontal Scroll Table Component
const StickyHorizontalScrollTable: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => {
  const tableRef = useRef<HTMLDivElement>(null);
  const stickyScrollRef = useRef<HTMLDivElement>(null);
  const [tableWidth, setTableWidth] = useState(0);

  useEffect(() => {
    const updateTableWidth = () => {
      if (tableRef.current) {
        const table = tableRef.current.querySelector('table');
        if (table) {
          setTableWidth(table.scrollWidth);
        }
      }
    };

    updateTableWidth();
    window.addEventListener('resize', updateTableWidth);
    
    return () => window.removeEventListener('resize', updateTableWidth);
  }, [children]);

  useEffect(() => {
    const tableEl = tableRef.current;
    const stickyEl = stickyScrollRef.current;
    
    if (!tableEl || !stickyEl) return;

    const syncScroll = (source: HTMLElement, target: HTMLElement) => {
      return () => {
        target.scrollLeft = source.scrollLeft;
      };
    };

    const tableScrollHandler = syncScroll(tableEl, stickyEl);
    const stickyScrollHandler = syncScroll(stickyEl, tableEl);

    tableEl.addEventListener('scroll', tableScrollHandler);
    stickyEl.addEventListener('scroll', stickyScrollHandler);

    return () => {
      tableEl.removeEventListener('scroll', tableScrollHandler);
      stickyEl.removeEventListener('scroll', stickyScrollHandler);
    };
  }, []);

  return (
    <div className={`table-container ${className}`}>
      <div className="table-scroll-wrapper">
        <div ref={tableRef} className="overflow-x-auto table-scroll">
          {children}
        </div>
        <div ref={stickyScrollRef} className="sticky-horizontal-scroll">
          <div 
            className="sticky-scroll-content" 
            style={{ width: `${tableWidth}px` }}
          />
        </div>
      </div>
    </div>
  );
};

// Enhanced Table Component with Scroll Indicators
const TableWithScrollIndicator: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => {
  const tableRef = useRef<HTMLDivElement>(null);
  const [isScrollable, setIsScrollable] = useState(false);

  useEffect(() => {
    const checkScrollable = () => {
      if (tableRef.current) {
        const { scrollWidth, clientWidth } = tableRef.current;
        setIsScrollable(scrollWidth > clientWidth);
      }
    };

    checkScrollable();
    window.addEventListener('resize', checkScrollable);
    
    return () => window.removeEventListener('resize', checkScrollable);
  }, [children]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!tableRef.current) return;
    
    const scrollAmount = 100;
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        tableRef.current.scrollLeft -= scrollAmount;
        break;
      case 'ArrowRight':
        e.preventDefault();
        tableRef.current.scrollLeft += scrollAmount;
        break;
      case 'Home':
        e.preventDefault();
        tableRef.current.scrollLeft = 0;
        break;
      case 'End':
        e.preventDefault();
        tableRef.current.scrollLeft = tableRef.current.scrollWidth;
        break;
    }
  };

  return (
    <div className={`table-container ${className}`} data-scrollable={isScrollable}>
      <div 
        ref={tableRef}
        className="overflow-x-auto table-scroll"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        role="region"
        aria-label="Data table - Use arrow keys to scroll horizontally"
      >
        {children}
      </div>
    </div>
  );
};

// Floating Scrollbar Component
const FloatingScrollbar: React.FC<{
  tableRef: React.RefObject<HTMLDivElement>;
  isVisible: boolean;
}> = ({ tableRef, isVisible }) => {
  const floatingRef = useRef<HTMLDivElement>(null);
  const [tableWidth, setTableWidth] = useState(0);

  useEffect(() => {
    const updateTableWidth = () => {
      if (tableRef.current) {
        const table = tableRef.current.querySelector('table');
        if (table) {
          setTableWidth(table.scrollWidth);
        }
      }
    };

    updateTableWidth();
    window.addEventListener('resize', updateTableWidth);
    
    return () => window.removeEventListener('resize', updateTableWidth);
  }, [tableRef]);

  useEffect(() => {
    const tableEl = tableRef.current;
    const floatingEl = floatingRef.current;
    
    if (!tableEl || !floatingEl) return;

    const syncFromTable = () => {
      floatingEl.scrollLeft = tableEl.scrollLeft;
    };

    const syncFromFloating = () => {
      tableEl.scrollLeft = floatingEl.scrollLeft;
    };

    tableEl.addEventListener('scroll', syncFromTable);
    floatingEl.addEventListener('scroll', syncFromFloating);

    return () => {
      tableEl.removeEventListener('scroll', syncFromTable);
      floatingEl.removeEventListener('scroll', syncFromFloating);
    };
  }, [tableRef]);

  if (!isVisible) return null;

  return (
    <div ref={floatingRef} className="floating-scrollbar">
      <div 
        className="floating-scrollbar-content" 
        style={{ width: `${tableWidth}px` }}
      />
    </div>
  );
};

// Enhanced Table Component with Floating Scrollbar
const TableWithFloatingScrollbar: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => {
  const tableRef = useRef<HTMLDivElement>(null);
  const [isScrollable, setIsScrollable] = useState(false);

  useEffect(() => {
    const checkScrollable = () => {
      if (tableRef.current) {
        const { scrollWidth, clientWidth } = tableRef.current;
        setIsScrollable(scrollWidth > clientWidth);
      }
    };

    checkScrollable();
    window.addEventListener('resize', checkScrollable);
    
    return () => window.removeEventListener('resize', checkScrollable);
  }, [children]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!tableRef.current) return;
    
    const scrollAmount = 100;
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        tableRef.current.scrollLeft -= scrollAmount;
        break;
      case 'ArrowRight':
        e.preventDefault();
        tableRef.current.scrollLeft += scrollAmount;
        break;
      case 'Home':
        e.preventDefault();
        tableRef.current.scrollLeft = 0;
        break;
      case 'End':
        e.preventDefault();
        tableRef.current.scrollLeft = tableRef.current.scrollWidth;
        break;
    }
  };

  return (
    <>
      <div className={`table-container ${className}`} data-scrollable={isScrollable}>
        <div 
          ref={tableRef}
          className="overflow-x-auto table-scroll"
          tabIndex={0}
          onKeyDown={handleKeyDown}
          role="region"
          aria-label="Data table - Use arrow keys to scroll horizontally"
        >
          {children}
        </div>
      </div>
      <FloatingScrollbar tableRef={tableRef} isVisible={isScrollable} />
    </>
  );
};

// Move all analysis components before InventoryAnalyticsContent

// Implement the missing components with sticky headers and column filters
const PriorityIssuesAnalysis: React.FC<{ 
  data: ProcessedInventoryData; 
  onToggleStar: (id: string) => void; 
  starredItems: Set<string>; 
}> = ({ data, onToggleStar, starredItems }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('impactValue');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Column filter states
  const [columnFilters, setColumnFilters] = useState<{
    type: string[];
    severity: string[];
    velocityCategory: string[];
    trendDirection: string[];
    winning: string[];
  }>({
    type: [],
    severity: [],
    velocityCategory: [],
    trendDirection: [],
    winning: []
  });
  
  // Filter dropdown search states
  const [filterDropdownSearch, setFilterDropdownSearch] = useState<{
    type: string;
    severity: string;
    velocityCategory: string;
    trendDirection: string;
    winning: string;
  }>({
    type: '',
    severity: '',
    velocityCategory: '',
    trendDirection: '',
    winning: ''
  });

  // Filter and sort priority issues
  const filteredIssues = useMemo(() => {
    return data.priorityIssues
      .filter(issue => {
        const matchesSearch = 
          issue.item.stockcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          issue.item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          issue.description.toLowerCase().includes(searchTerm.toLowerCase());

        // Apply column filters
        const matchesTypeFilter = columnFilters.type.length === 0 || 
          columnFilters.type.includes(issue.type);
        
        const matchesSeverityFilter = columnFilters.severity.length === 0 || 
          columnFilters.severity.includes(issue.severity);
        
        const matchesVelocityFilter = columnFilters.velocityCategory.length === 0 || 
          columnFilters.velocityCategory.includes(typeof issue.item.velocityCategory === 'number' ? issue.item.velocityCategory.toString() : 'N/A');

        const matchesTrendFilter = columnFilters.trendDirection.length === 0 || 
          columnFilters.trendDirection.includes(issue.item.trendDirection || 'N/A');

        const matchesWinningFilter = columnFilters.winning.length === 0 || 
          columnFilters.winning.includes(issue.item.AVER ? 'Y' : 'N');

        return matchesSearch && matchesTypeFilter && matchesSeverityFilter && matchesVelocityFilter && matchesTrendFilter && matchesWinningFilter;
      })
      .sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (sortField) {
          case 'impactValue':
            aValue = a.impactValue; bValue = b.impactValue; break;
          case 'severity':
            aValue = a.severity; bValue = b.severity; break;
          case 'type':
            aValue = a.type; bValue = b.type; break;
          case 'stockcode':
            aValue = a.item.stockcode; bValue = b.item.stockcode; break;
          case 'stockValue':
            aValue = a.item.stockValue; bValue = b.item.stockValue; break;
          case 'averageCost':
            aValue = a.item.avg_cost || 0; bValue = b.item.avg_cost || 0; break;
          case 'currentStock':
            aValue = a.item.currentStock; bValue = b.item.currentStock; break;
          case 'onOrder':
            aValue = a.item.quantity_on_order || 0; bValue = b.item.quantity_on_order || 0; break;
          case 'monthsOfStock':
            aValue = a.item.monthsOfStock; bValue = b.item.monthsOfStock; break;
          case 'velocityCategory':
            aValue = typeof a.item.velocityCategory === 'number' ? a.item.velocityCategory : 999;
            bValue = typeof b.item.velocityCategory === 'number' ? b.item.velocityCategory : 999;
            break;
          case 'trendDirection':
            // Custom sorting for trend: DOWN > STABLE > UP > N/A
            const trendOrder = { 'DOWN': 1, 'STABLE': 2, 'UP': 3, 'N/A': 4 };
            aValue = trendOrder[a.item.trendDirection as keyof typeof trendOrder] || 4;
            bValue = trendOrder[b.item.trendDirection as keyof typeof trendOrder] || 4;
            break;
          case 'nbp':
            aValue = a.item.nextBuyingPrice || a.item.nbp || a.item.next_cost || a.item.min_cost || a.item.last_po_cost || 0;
            bValue = b.item.nextBuyingPrice || b.item.nbp || b.item.next_cost || b.item.min_cost || b.item.last_po_cost || 0;
            break;
          case 'winning':
            const aLowestComp = a.item.bestCompetitorPrice || a.item.lowestMarketPrice || a.item.Nupharm || a.item.AAH2 || a.item.LEXON2;
            const bLowestComp = b.item.bestCompetitorPrice || b.item.lowestMarketPrice || b.item.Nupharm || b.item.AAH2 || b.item.LEXON2;
            aValue = (a.item.AVER && aLowestComp && a.item.AVER < aLowestComp) ? 1 : 0;
            bValue = (b.item.AVER && bLowestComp && b.item.AVER < bLowestComp) ? 1 : 0;
            break;
          case 'lowestComp':
            aValue = a.item.bestCompetitorPrice || a.item.lowestMarketPrice || a.item.Nupharm || a.item.AAH2 || a.item.LEXON2 || 0;
            bValue = b.item.bestCompetitorPrice || b.item.lowestMarketPrice || b.item.Nupharm || b.item.AAH2 || b.item.LEXON2 || 0;
            break;
          case 'price':
            aValue = a.item.AVER || 0; bValue = b.item.AVER || 0; break;
          case 'sdt':
            aValue = a.item.SDT || 0; bValue = b.item.SDT || 0; break;
          case 'edt':
            aValue = a.item.EDT || 0; bValue = b.item.EDT || 0; break;
          default:
            aValue = a.item.stockcode; bValue = b.item.stockcode;
        }
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      });
  }, [data.priorityIssues, searchTerm, sortField, sortDirection, columnFilters]);

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(value);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400';
      case 'high': return 'text-orange-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getCategoryColor = (category: number | 'N/A') => {
    if (category === 'N/A') return 'text-gray-400';
    switch (category) {
      case 1: return 'text-green-400';
      case 2: return 'text-blue-400';
      case 3: return 'text-yellow-400';
      case 4: return 'text-orange-400';
      case 5: return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'UP': return 'text-green-400';
      case 'DOWN': return 'text-red-400';
      case 'STABLE': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  // Helper function to capitalize first letter
  const capitalizeFirst = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  // Column filter functions
  const handleColumnFilterChange = (column: keyof typeof columnFilters, values: string[]) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: values
    }));
  };

  const handleFilterDropdownSearchChange = (column: keyof typeof filterDropdownSearch, value: string) => {
    setFilterDropdownSearch(prev => ({
      ...prev,
      [column]: value
    }));
  };

  // Get unique values for column filters
  const getUniqueTypes = () => {
    const types = [...new Set(data.priorityIssues.map(issue => issue.type))];
    return types.sort();
  };

  const getUniqueSeverities = () => {
    const severities = [...new Set(data.priorityIssues.map(issue => issue.severity))];
    return severities.sort((a, b) => {
      const order = { 'critical': 1, 'high': 2, 'medium': 3, 'low': 4 };
      return (order[a as keyof typeof order] || 5) - (order[b as keyof typeof order] || 5);
    });
  };

  const getUniqueVelocityCategories = () => {
    const categories = [...new Set(data.priorityIssues.map(issue => 
      typeof issue.item.velocityCategory === 'number' ? issue.item.velocityCategory.toString() : 'N/A'
    ))];
    return categories.sort((a, b) => {
      if (a === 'N/A') return 1;
      if (b === 'N/A') return -1;
      return parseInt(a) - parseInt(b);
    });
  };

  const getUniqueTrendDirections = () => {
    const trends = [...new Set(data.priorityIssues.map(issue => issue.item.trendDirection || 'N/A'))];
    return trends.sort((a, b) => {
      const order = { 'DOWN': 1, 'STABLE': 2, 'UP': 3, 'N/A': 4 };
      return (order[a as keyof typeof order] || 4) - (order[b as keyof typeof order] || 4);
    });
  };

  const getUniqueWinningValues = () => {
    return ['Y', 'N'];
  };

  // Render column header with optional filter
  const renderColumnHeader = (
    title: string,
    sortKey: string,
    filterColumn?: keyof typeof columnFilters,
    filterOptions?: string[],
    alignment: 'left' | 'center' | 'right' = 'left'
  ) => {
    const hasActiveFilter = filterColumn && columnFilters[filterColumn].length > 0;
    const alignmentClass = alignment === 'center' ? 'text-center' : alignment === 'right' ? 'text-right' : 'text-left';
    const justifyClass = alignment === 'center' ? 'justify-center' : alignment === 'right' ? 'justify-end' : 'justify-start';
    
    return (
      <th className={`${alignmentClass} p-3 text-gray-300 relative text-sm`}>
        <div className={`flex items-center gap-2 ${justifyClass}`}>
          <button
            onClick={() => handleSort(sortKey)}
            className="hover:text-white cursor-pointer flex items-center gap-1"
          >
            {title}
            {sortField === sortKey && (
              <span className="text-xs">
                {sortDirection === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </button>
          
          {filterColumn && filterOptions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={`p-1 rounded hover:bg-gray-700 ${hasActiveFilter ? 'text-blue-400' : 'text-gray-400'}`}>
                  <Filter className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-gray-800 border-gray-700">
                <div className="p-2">
                  <Input
                    placeholder="Search..."
                    value={filterDropdownSearch[filterColumn]}
                    onChange={(e) => handleFilterDropdownSearchChange(filterColumn, e.target.value)}
                    className="h-8 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <DropdownMenuSeparator className="bg-gray-700" />
                <div className="p-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={columnFilters[filterColumn].length === 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleColumnFilterChange(filterColumn, []);
                        }
                      }}
                      className="rounded border-gray-600 bg-gray-700"
                    />
                    <span className="text-sm text-white">Select All</span>
                  </label>
                </div>
                <DropdownMenuSeparator className="bg-gray-700" />
                <div className="max-h-48 overflow-y-auto">
                  {filterOptions
                    .filter(option => 
                      filterDropdownSearch[filterColumn] === '' ||
                      option.toLowerCase().includes(filterDropdownSearch[filterColumn].toLowerCase())
                    )
                    .map((option) => (
                      <div key={option} className="p-2">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={columnFilters[filterColumn].includes(option)}
                            onChange={(e) => {
                              const currentFilters = columnFilters[filterColumn];
                              if (e.target.checked) {
                                handleColumnFilterChange(filterColumn, [...currentFilters, option]);
                              } else {
                                handleColumnFilterChange(filterColumn, currentFilters.filter(f => f !== option));
                              }
                            }}
                            className="rounded border-gray-600 bg-gray-700"
                          />
                          <span className="text-sm text-white">{option === 'N/A' ? option : capitalizeFirst(option)}</span>
                        </label>
                      </div>
                    ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </th>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-400">
          {filteredIssues.length} issues found
        </div>
      </div>

      {/* Issue Type Key */}
      <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
        <CardContent className="p-4">
          <h4 className="text-sm font-medium text-white mb-2">Issue Type Key:</h4>
          <div className="text-xs text-gray-400 space-y-1">
            <div><span className="font-medium">Out of Stock:</span> No available inventory</div>
            <div><span className="font-medium">Overstock:</span> Excessive inventory levels</div>
            <div><span className="font-medium">Cost Disadvantage:</span> Higher costs than competitors</div>
            <div><span className="font-medium">Margin Opportunity:</span> Potential for increased margins</div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
        <CardContent className="p-4">
          <Input
            placeholder="Search by stock code, description, or issue..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-800 border-gray-700 text-white"
          />
        </CardContent>
      </Card>

      {/* Data Table with Sticky Headers */}
      <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
        <CardContent className="p-0">
          <div className="max-h-[600px] overflow-y-auto">
            <table className="w-full min-w-[1400px]">
              <thead className="bg-gray-900/90 sticky top-0 z-10">
                <tr className="border-b border-gray-700">
                  <th className="text-left p-3 text-gray-300 cursor-pointer hover:text-white sticky left-0 bg-gray-900/95 backdrop-blur-sm border-r border-gray-700 z-20 min-w-[200px] text-sm" onClick={() => handleSort('stockcode')}>
                    Item {sortField === 'stockcode' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  {renderColumnHeader('Issue Type', 'type', 'type', getUniqueTypes())}
                  <th className="text-center p-3 text-gray-300 text-sm">
                    <TooltipProvider>
                      <UITooltip>
                        <TooltipTrigger asChild>
                          <div>
                            {renderColumnHeader('Severity', 'severity', 'severity', getUniqueSeverities(), 'center')}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="bg-gray-800 border-gray-700 text-white">
                          <div className="text-sm">Issue priority level: Critical &gt; High &gt; Medium &gt; Low</div>
                        </TooltipContent>
                      </UITooltip>
                    </TooltipProvider>
                  </th>
                  <th className="text-right p-3 text-gray-300 text-sm">
                    <TooltipProvider>
                      <UITooltip>
                        <TooltipTrigger asChild>
                          <button className="cursor-pointer hover:text-white" onClick={() => handleSort('impactValue')}>
                            Impact Value {sortField === 'impactValue' && (sortDirection === 'asc' ? '↑' : '↓')}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-gray-800 border-gray-700 text-white">
                          <div className="text-sm">Financial impact of the issue (stock value at risk or opportunity value)</div>
                        </TooltipContent>
                      </UITooltip>
                    </TooltipProvider>
                  </th>
                  <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('averageCost')}>
                    <span className="font-bold">Avg Cost</span> {sortField === 'averageCost' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('currentStock')}>
                    Stock Qty {sortField === 'currentStock' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('onOrder')}>
                    On Order {sortField === 'onOrder' && (sortDirection === 'asc' ? '↓' : '↑')}
                  </th>
                  <th className="text-center p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('monthsOfStock')}>
                    Months {sortField === 'monthsOfStock' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  {renderColumnHeader('Velocity', 'velocityCategory', 'velocityCategory', getUniqueVelocityCategories(), 'center')}
                  {renderColumnHeader('Trend', 'trendDirection', 'trendDirection', getUniqueTrendDirections(), 'center')}
                  <th className="text-center p-3 text-gray-300 text-sm">
                    Watch
                  </th>
                  <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('price')}>
                    Price {sortField === 'price' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('nbp')}>
                    NBP {sortField === 'nbp' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  {renderColumnHeader('Winning', 'winning', 'winning', getUniqueWinningValues(), 'center')}
                  <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('lowestComp')}>
                    Lowest Comp {sortField === 'lowestComp' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('sdt')}>
                    SDT {sortField === 'sdt' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('edt')}>
                    EDT {sortField === 'edt' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-center p-3 text-gray-300 text-sm">
                    Star
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredIssues.map((issue) => (
                  <tr key={issue.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                    <td className="p-3 sticky left-0 bg-gray-950/95 backdrop-blur-sm border-r border-gray-700 min-w-[200px] text-sm">
                      <div>
                        <div className="font-medium text-white">{issue.item.stockcode}</div>
                        <div className="text-sm text-gray-400 truncate max-w-xs">{issue.item.description}</div>
                      </div>
                    </td>
                    <td className="p-3 text-gray-300 text-sm">
                      {issue.type.replace(/_/g, ' ')}
                    </td>
                    <td className="p-3 text-center text-sm">
                      <span className={`font-semibold ${getSeverityColor(issue.severity)} capitalize`}>
                        {issue.severity}
                      </span>
                    </td>
                    <td className="p-3 text-right text-red-400 font-semibold text-sm">
                      {formatCurrency(issue.impactValue)}
                    </td>
                    <td className="p-3 text-right text-gray-300 font-bold text-sm">
                      {shouldShowAverageCostTooltip(issue.item) ? (
                        <TooltipProvider>
                          <UITooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help underline decoration-dotted">
                                {getDisplayedAverageCost(issue.item) ? formatCurrency(getDisplayedAverageCost(issue.item)!) : 'N/A'}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="bg-gray-800 border-gray-700 text-white">
                              <div className="text-sm">{getAverageCostTooltip(issue.item)}</div>
                            </TooltipContent>
                          </UITooltip>
                        </TooltipProvider>
                      ) : (
                        getDisplayedAverageCost(issue.item) ? formatCurrency(getDisplayedAverageCost(issue.item)!) : 'N/A'
                      )}
                    </td>
                    <td className="p-3 text-right text-gray-300 text-sm">
                      {(issue.item.currentStock || 0).toLocaleString()}
                    </td>
                    <td className="p-3 text-right text-gray-300 text-sm">
                      {(issue.item.quantity_on_order || 0).toLocaleString()}
                    </td>
                    <td className="p-3 text-center text-sm">
                      <TooltipProvider>
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <span className={`cursor-help ${issue.item.monthsOfStock && issue.item.monthsOfStock > 6 ? 'text-red-400 font-semibold' : 'text-gray-300'}`}>
                              {issue.item.monthsOfStock === 999.9 ? '∞' : issue.item.monthsOfStock ? issue.item.monthsOfStock.toFixed(1) : 'N/A'}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="bg-gray-800 border-gray-700 text-white">
                            <div className="text-sm">{issue.item.averageUsage || issue.item.packs_sold_avg_last_six_months ? (issue.item.averageUsage || issue.item.packs_sold_avg_last_six_months).toFixed(0) : 'No'} packs/month</div>
                          </TooltipContent>
                        </UITooltip>
                      </TooltipProvider>
                    </td>
                    <td className={`p-3 text-center font-semibold ${getCategoryColor(issue.item.velocityCategory)}`}>
                      {typeof issue.item.velocityCategory === 'number' ? issue.item.velocityCategory : 'N/A'}
                    </td>
                    <td className={`p-3 text-center font-semibold ${getTrendColor(issue.item.trendDirection)}`}>
                      {issue.item.trendDirection === 'UP' ? '↑' : 
                       issue.item.trendDirection === 'DOWN' ? '↓' : 
                       issue.item.trendDirection === 'STABLE' ? '−' : '?'}
                    </td>
                    <td className="p-3 text-center text-sm">
                      <span className={issue.item.watchlist === '⚠️' ? 'text-orange-400' : 'text-gray-600'}>
                        {issue.item.watchlist || '−'}
                      </span>
                    </td>
                    <td className="p-3 text-right text-purple-400 font-semibold text-sm">
                      {issue.item.AVER ? formatCurrency(issue.item.AVER) : 'N/A'}
                    </td>
                    <td className="p-3 text-right text-green-400 font-semibold text-sm">
                      <TooltipProvider>
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help underline decoration-dotted">
                              {issue.item.min_cost && issue.item.min_cost > 0 ? formatCurrency(issue.item.min_cost) : 'OOS'}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="bg-gray-800 border-gray-700 text-white">
                            <div className="space-y-1">
                              <div className="text-sm">Next Cost: {issue.item.next_cost && issue.item.next_cost > 0 ? formatCurrency(issue.item.next_cost) : 'N/A'}</div>
                              <div className="text-sm">Min Cost: {issue.item.min_cost && issue.item.min_cost > 0 ? formatCurrency(issue.item.min_cost) : 'N/A'}</div>
                              <div className="text-sm">Last PO Cost: {issue.item.last_po_cost && issue.item.last_po_cost > 0 ? formatCurrency(issue.item.last_po_cost) : 'N/A'}</div>
                            </div>
                          </TooltipContent>
                        </UITooltip>
                      </TooltipProvider>
                    </td>
                    <td className="p-3 text-center font-semibold text-sm">
                      {(() => {
                        const lowestComp = issue.item.bestCompetitorPrice || issue.item.lowestMarketPrice || issue.item.Nupharm || issue.item.AAH2 || issue.item.LEXON2;
                        const isWinning = issue.item.AVER && lowestComp && issue.item.AVER < lowestComp;
                        return (
                          <span className={isWinning ? 'text-green-400' : 'text-red-400'}>
                            {isWinning ? 'Y' : 'N'}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="p-3 text-right text-blue-400 font-semibold text-sm">
                      <TooltipProvider>
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help underline decoration-dotted">
                              {issue.item.bestCompetitorPrice ? formatCurrency(issue.item.bestCompetitorPrice) : 
                               (issue.item.lowestMarketPrice ? formatCurrency(issue.item.lowestMarketPrice) : 
                                (issue.item.Nupharm ? formatCurrency(issue.item.Nupharm) : 
                                 (issue.item.AAH2 ? formatCurrency(issue.item.AAH2) : 
                                  (issue.item.LEXON2 ? formatCurrency(issue.item.LEXON2) : 'N/A'))))}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="bg-gray-800 border-gray-700 text-white max-w-xs">
                            <div className="space-y-1">
                              {[
                                { name: 'Nupharm', price: issue.item.Nupharm },
                                { name: 'AAH2', price: issue.item.AAH2 },
                                { name: 'ETH_LIST', price: issue.item.ETH_LIST },
                                { name: 'ETH_NET', price: issue.item.ETH_NET },
                                { name: 'LEXON2', price: issue.item.LEXON2 }
                              ].filter(comp => comp.price && comp.price > 0)
                               .sort((a, b) => a.price - b.price)
                               .map((comp, idx) => (
                                <div key={idx} className="text-sm">{comp.name}: {formatCurrency(comp.price)}</div>
                              ))}
                              {![issue.item.Nupharm, issue.item.AAH2, issue.item.ETH_LIST, issue.item.ETH_NET, issue.item.LEXON2].some(price => price && price > 0) && (
                                <div className="text-sm">No competitor pricing available</div>
                              )}
                            </div>
                          </TooltipContent>
                        </UITooltip>
                      </TooltipProvider>
                    </td>
                    <td className="p-3 text-right text-gray-300 text-sm">
                      {issue.item.SDT ? formatCurrency(issue.item.SDT) : '-'}
                    </td>
                    <td className="p-3 text-right text-gray-300 text-sm">
                      {issue.item.EDT ? formatCurrency(issue.item.EDT) : '-'}
                    </td>
                    <td className="p-3 text-center text-sm">
                      <button
                        onClick={() => onToggleStar(issue.item.id)}
                        className={`p-1 rounded hover:bg-gray-700 ${
                          starredItems.has(issue.item.id) ? 'text-yellow-400' : 'text-gray-600'
                        }`}
                      >
                        <Star className="h-4 w-4" fill={starredItems.has(issue.item.id) ? 'currentColor' : 'none'} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredIssues.length === 0 && (
            <div className="p-8 text-center text-gray-400">
              <div className="text-lg font-medium">No priority issues found</div>
              <div className="text-sm mt-1">Try adjusting your search criteria</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const WatchlistAnalysis: React.FC<{ 
  data: ProcessedInventoryData; 
  onToggleStar: (id: string) => void; 
  starredItems: Set<string>; 
}> = ({ data, onToggleStar, starredItems }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('stockValue');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Column filter states
  const [columnFilters, setColumnFilters] = useState<{
    velocityCategory: string[];
    trendDirection: string[];
    winning: string[];
  }>({
    velocityCategory: [],
    trendDirection: [],
    winning: []
  });
  
  // Filter dropdown search states
  const [filterDropdownSearch, setFilterDropdownSearch] = useState<{
    velocityCategory: string;
    trendDirection: string;
    winning: string;
  }>({
    velocityCategory: '',
    trendDirection: '',
    winning: ''
  });

  // Filter watchlist items
  const watchlistItems = useMemo(() => {
    return data.analyzedItems
      .filter(item => item.watchlist === '⚠️')
      .filter(item => {
        const matchesSearch = 
          item.stockcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase());

        // Apply column filters
        const matchesVelocityFilter = columnFilters.velocityCategory.length === 0 || 
          columnFilters.velocityCategory.includes(typeof item.velocityCategory === 'number' ? item.velocityCategory.toString() : 'N/A');

        const matchesTrendFilter = columnFilters.trendDirection.length === 0 || 
          columnFilters.trendDirection.includes(item.trendDirection || 'N/A');

        const matchesWinningFilter = columnFilters.winning.length === 0 || 
          columnFilters.winning.includes(item.AVER ? 'Y' : 'N');

        return matchesSearch && matchesVelocityFilter && matchesTrendFilter && matchesWinningFilter;
      })
      .sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (sortField) {
          case 'stockValue':
            aValue = a.stockValue; bValue = b.stockValue; break;
          case 'averageCost':
            aValue = a.avg_cost || 0; bValue = b.avg_cost || 0; break;
          case 'monthsOfStock':
            aValue = a.monthsOfStock; bValue = b.monthsOfStock; break;
          case 'velocityCategory':
            aValue = typeof a.velocityCategory === 'number' ? a.velocityCategory : 999;
            bValue = typeof b.velocityCategory === 'number' ? b.velocityCategory : 999;
            break;
          case 'currentStock':
            aValue = a.currentStock; bValue = b.currentStock; break;
          case 'onOrder':
            aValue = a.quantity_on_order || 0; bValue = b.quantity_on_order || 0; break;
          case 'nbp':
            aValue = a.nextBuyingPrice || a.nbp || a.next_cost || a.min_cost || a.last_po_cost || 0;
            bValue = b.nextBuyingPrice || b.nbp || b.next_cost || b.min_cost || b.last_po_cost || 0;
            break;
          case 'winning':
            const aLowestComp = a.bestCompetitorPrice || a.lowestMarketPrice || a.Nupharm || a.AAH2 || a.LEXON2;
            const bLowestComp = b.bestCompetitorPrice || b.lowestMarketPrice || b.Nupharm || b.AAH2 || b.LEXON2;
            aValue = (a.AVER && aLowestComp && a.AVER < aLowestComp) ? 1 : 0;
            bValue = (b.AVER && bLowestComp && b.AVER < bLowestComp) ? 1 : 0;
            break;
          case 'lowestComp':
            aValue = a.bestCompetitorPrice || a.lowestMarketPrice || a.Nupharm || a.AAH2 || a.LEXON2 || 0;
            bValue = b.bestCompetitorPrice || b.lowestMarketPrice || b.Nupharm || b.AAH2 || b.LEXON2 || 0;
            break;
          case 'price':
            aValue = a.AVER || 0; bValue = b.AVER || 0; break;
          case 'sdt':
            aValue = a.SDT || 0; bValue = b.SDT || 0; break;
          case 'edt':
            aValue = a.EDT || 0; bValue = b.EDT || 0; break;
          default:
            aValue = a.stockcode; bValue = b.stockcode;
        }
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      });
  }, [data.analyzedItems, searchTerm, sortField, sortDirection, columnFilters]);

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(value);
  };

  const getCategoryColor = (category: number | 'N/A') => {
    if (typeof category !== 'number') return 'text-gray-400';
    if (category <= 2) return 'text-green-400';
    if (category <= 4) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'UP': return 'text-green-400';
      case 'DOWN': return 'text-red-400';
      case 'STABLE': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  // Helper function to capitalize first letter
  const capitalizeFirst = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  // Column filter functions
  const handleColumnFilterChange = (column: keyof typeof columnFilters, values: string[]) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: values
    }));
  };

  const handleFilterDropdownSearchChange = (column: keyof typeof filterDropdownSearch, value: string) => {
    setFilterDropdownSearch(prev => ({
      ...prev,
      [column]: value
    }));
  };

  // Get unique values for column filters
  const getUniqueVelocityCategories = () => {
    const categories = [...new Set(data.analyzedItems
      .filter(item => item.watchlist === '⚠️')
      .map(item => typeof item.velocityCategory === 'number' ? item.velocityCategory.toString() : 'N/A')
    )];
    return categories.sort((a, b) => {
      if (a === 'N/A') return 1;
      if (b === 'N/A') return -1;
      return parseInt(a) - parseInt(b);
    });
  };

  const getUniqueTrendDirections = () => {
    const trends = [...new Set(data.analyzedItems
      .filter(item => item.watchlist === '⚠️')
      .map(item => item.trendDirection || 'N/A'))];
    return trends.sort((a, b) => {
      const order = { 'DOWN': 1, 'STABLE': 2, 'UP': 3, 'N/A': 4 };
      return (order[a as keyof typeof order] || 4) - (order[b as keyof typeof order] || 4);
    });
  };

  const getUniqueWinningValues = () => {
    return ['Y', 'N'];
  };

  // Render column header with optional filter
  const renderColumnHeader = (
    title: string,
    sortKey: string,
    filterColumn?: keyof typeof columnFilters,
    filterOptions?: string[],
    alignment: 'left' | 'center' | 'right' = 'left'
  ) => {
    const hasActiveFilter = filterColumn && columnFilters[filterColumn].length > 0;
    const alignmentClass = alignment === 'center' ? 'text-center' : alignment === 'right' ? 'text-right' : 'text-left';
    const justifyClass = alignment === 'center' ? 'justify-center' : alignment === 'right' ? 'justify-end' : 'justify-start';
    
    return (
      <th className={`${alignmentClass} p-3 text-gray-300 relative`}>
        <div className={`flex items-center gap-2 ${justifyClass}`}>
          <button
            onClick={() => handleSort(sortKey)}
            className="hover:text-white cursor-pointer flex items-center gap-1"
          >
            {title}
            {sortField === sortKey && (
              <span className="text-xs">
                {sortDirection === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </button>
          
          {filterColumn && filterOptions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={`p-1 rounded hover:bg-gray-700 ${hasActiveFilter ? 'text-blue-400' : 'text-gray-400'}`}>
                  <Filter className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-gray-800 border-gray-700">
                <div className="p-2">
                  <Input
                    placeholder="Search..."
                    value={filterDropdownSearch[filterColumn]}
                    onChange={(e) => handleFilterDropdownSearchChange(filterColumn, e.target.value)}
                    className="h-8 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <DropdownMenuSeparator className="bg-gray-700" />
                <div className="p-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={columnFilters[filterColumn].length === 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleColumnFilterChange(filterColumn, []);
                        }
                      }}
                      className="rounded border-gray-600 bg-gray-700"
                    />
                    <span className="text-sm text-white">Select All</span>
                  </label>
                </div>
                <DropdownMenuSeparator className="bg-gray-700" />
                <div className="max-h-48 overflow-y-auto">
                  {filterOptions
                    .filter(option => 
                      filterDropdownSearch[filterColumn] === '' ||
                      option.toLowerCase().includes(filterDropdownSearch[filterColumn].toLowerCase())
                    )
                    .map((option) => (
                      <div key={option} className="p-2">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={columnFilters[filterColumn].includes(option)}
                            onChange={(e) => {
                              const currentFilters = columnFilters[filterColumn];
                              if (e.target.checked) {
                                handleColumnFilterChange(filterColumn, [...currentFilters, option]);
                              } else {
                                handleColumnFilterChange(filterColumn, currentFilters.filter(f => f !== option));
                              }
                            }}
                            className="rounded border-gray-600 bg-gray-700"
                          />
                          <span className="text-sm text-white">{option === 'N/A' ? option : capitalizeFirst(option)}</span>
                        </label>
                      </div>
                    ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </th>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Watchlist Analysis</h3>
        <div className="text-sm text-gray-400">
          {watchlistItems.length} watchlist items
        </div>
      </div>

      {/* Search */}
      <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
        <CardContent className="p-4">
          <Input
            placeholder="Search by stock code or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-800 border-gray-700 text-white"
          />
        </CardContent>
      </Card>

      {/* Data Table with Sticky Headers */}
      <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
        <CardContent className="p-0">
          <div className="max-h-[600px] overflow-y-auto">
            <table className="w-full min-w-[1400px]">
              <thead className="bg-gray-900/90 sticky top-0 z-10">
                <tr className="border-b border-gray-700">
                  <th className="text-left p-3 text-gray-300 cursor-pointer hover:text-white sticky left-0 bg-gray-900/95 backdrop-blur-sm border-r border-gray-700 z-20 min-w-[200px] text-sm" onClick={() => handleSort('stockcode')}>
                    Item {sortField === 'stockcode' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('stockValue')}>
                    Stock Value {sortField === 'stockValue' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('averageCost')}>
                    <span className="font-bold">Avg Cost</span> {sortField === 'averageCost' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('currentStock')}>
                    Stock Qty {sortField === 'currentStock' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('onOrder')}>
                    On Order {sortField === 'onOrder' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-center p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('monthsOfStock')}>
                    Months {sortField === 'monthsOfStock' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  {renderColumnHeader('Velocity', 'velocityCategory', 'velocityCategory', getUniqueVelocityCategories(), 'center')}
                  {renderColumnHeader('Trend', 'trendDirection', 'trendDirection', getUniqueTrendDirections(), 'center')}
                  <th className="text-center p-3 text-gray-300 text-sm">
                    Watch
                  </th>
                  <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('price')}>
                    Price {sortField === 'price' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('nbp')}>
                    NBP {sortField === 'nbp' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  {renderColumnHeader('Winning', 'winning', 'winning', getUniqueWinningValues(), 'center')}
                  <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('lowestComp')}>
                    Lowest Comp {sortField === 'lowestComp' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('sdt')}>
                    SDT {sortField === 'sdt' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('edt')}>
                    EDT {sortField === 'edt' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-center p-3 text-gray-300 text-sm">
                    Star
                  </th>
                </tr>
              </thead>
              <tbody>
                {watchlistItems.map((item) => (
                  <tr key={item.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                    <td className="p-3 sticky left-0 bg-gray-950/95 backdrop-blur-sm border-r border-gray-700 min-w-[200px] text-sm">
                      <div>
                        <div className="font-medium text-white">{item.stockcode}</div>
                        <div className="text-sm text-gray-400 truncate max-w-xs">{item.description}</div>
                      </div>
                    </td>
                    <td className="p-3 text-right text-white font-semibold text-sm">
                      {formatCurrency(item.stockValue)}
                    </td>
                    <td className="p-3 text-right text-gray-300 text-sm">
                      {shouldShowAverageCostTooltip(item) ? (
                        <TooltipProvider>
                          <UITooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help underline decoration-dotted">
                                {getDisplayedAverageCost(item) ? formatCurrency(getDisplayedAverageCost(item)!) : 'N/A'}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="bg-gray-800 border-gray-700 text-white">
                              <div className="text-sm">{getAverageCostTooltip(item)}</div>
                            </TooltipContent>
                          </UITooltip>
                        </TooltipProvider>
                      ) : (
                        getDisplayedAverageCost(item) ? formatCurrency(getDisplayedAverageCost(item)!) : 'N/A'
                      )}
                    </td>
                    <td className="p-3 text-right text-gray-300 text-sm">
                      {(item.currentStock || 0).toLocaleString()}
                    </td>
                    <td className="p-3 text-right text-gray-300 text-sm">
                      {(item.quantity_on_order || 0).toLocaleString()}
                    </td>
                    <td className="p-3 text-center text-sm">
                      <TooltipProvider>
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <span className={`cursor-help ${item.monthsOfStock && item.monthsOfStock > 6 ? 'text-red-400 font-semibold' : 'text-gray-300'}`}>
                              {item.monthsOfStock === 999.9 ? '∞' : item.monthsOfStock ? item.monthsOfStock.toFixed(1) : 'N/A'}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="bg-gray-800 border-gray-700 text-white">
                            <div className="text-sm">{item.averageUsage || item.packs_sold_avg_last_six_months ? (item.averageUsage || item.packs_sold_avg_last_six_months).toFixed(0) : 'No'} packs/month</div>
                          </TooltipContent>
                        </UITooltip>
                      </TooltipProvider>
                    </td>
                    <td className={`p-3 text-center font-semibold ${getCategoryColor(item.velocityCategory)}`}>
                      {typeof item.velocityCategory === 'number' ? item.velocityCategory : 'N/A'}
                    </td>
                    <td className={`p-3 text-center font-semibold ${getTrendColor(item.trendDirection)}`}>
                      {item.trendDirection === 'UP' ? '↑' : 
                       item.trendDirection === 'DOWN' ? '↓' : 
                       item.trendDirection === 'STABLE' ? '−' : '?'}
                    </td>
                    <td className="p-3 text-center text-sm">
                      <span className={item.watchlist === '⚠️' ? 'text-orange-400' : 'text-gray-600'}>
                        {item.watchlist || '−'}
                      </span>
                    </td>
                    <td className="p-3 text-right text-purple-400 font-semibold text-sm">
                      {item.AVER ? formatCurrency(item.AVER) : 'N/A'}
                    </td>
                    <td className="p-3 text-right text-green-400 font-semibold text-sm">
                      <TooltipProvider>
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help underline decoration-dotted">
                              {item.min_cost && item.min_cost > 0 ? formatCurrency(item.min_cost) : 'OOS'}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="bg-gray-800 border-gray-700 text-white">
                            <div className="space-y-1">
                              <div className="text-sm">Next Cost: {item.next_cost && item.next_cost > 0 ? formatCurrency(item.next_cost) : 'N/A'}</div>
                              <div className="text-sm">Min Cost: {item.min_cost && item.min_cost > 0 ? formatCurrency(item.min_cost) : 'N/A'}</div>
                              <div className="text-sm">Last PO Cost: {item.last_po_cost && item.last_po_cost > 0 ? formatCurrency(item.last_po_cost) : 'N/A'}</div>
                            </div>
                          </TooltipContent>
                        </UITooltip>
                      </TooltipProvider>
                    </td>
                    <td className="p-3 text-center font-semibold text-sm">
                      {(() => {
                        const lowestComp = item.bestCompetitorPrice || item.lowestMarketPrice || item.Nupharm || item.AAH2 || item.LEXON2;
                        const isWinning = item.AVER && lowestComp && item.AVER < lowestComp;
                        return (
                          <span className={isWinning ? 'text-green-400' : 'text-red-400'}>
                            {isWinning ? 'Y' : 'N'}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="p-3 text-right text-blue-400 font-semibold text-sm">
                      <TooltipProvider>
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help underline decoration-dotted">
                              {item.bestCompetitorPrice ? formatCurrency(item.bestCompetitorPrice) : 
                               (item.lowestMarketPrice ? formatCurrency(item.lowestMarketPrice) : 
                                (item.Nupharm ? formatCurrency(item.Nupharm) : 
                                 (item.AAH2 ? formatCurrency(item.AAH2) : 
                                  (item.LEXON2 ? formatCurrency(item.LEXON2) : 'N/A'))))}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="bg-gray-800 border-gray-700 text-white max-w-xs">
                            <div className="space-y-1">
                              {[
                                { name: 'Nupharm', price: item.Nupharm },
                                { name: 'AAH2', price: item.AAH2 },
                                { name: 'ETH_LIST', price: item.ETH_LIST },
                                { name: 'ETH_NET', price: item.ETH_NET },
                                { name: 'LEXON2', price: item.LEXON2 }
                              ].filter(comp => comp.price && comp.price > 0)
                               .sort((a, b) => a.price - b.price)
                               .map((comp, idx) => (
                                <div key={idx} className="text-sm">{comp.name}: {formatCurrency(comp.price)}</div>
                              ))}
                              {![item.Nupharm, item.AAH2, item.ETH_LIST, item.ETH_NET, item.LEXON2].some(price => price && price > 0) && (
                                <div className="text-sm">No competitor pricing available</div>
                              )}
                            </div>
                          </TooltipContent>
                        </UITooltip>
                      </TooltipProvider>
                    </td>
                    <td className="p-3 text-right text-gray-300 text-sm">
                      {item.SDT ? formatCurrency(item.SDT) : '-'}
                    </td>
                    <td className="p-3 text-right text-gray-300 text-sm">
                      {item.EDT ? formatCurrency(item.EDT) : '-'}
                    </td>
                    <td className="p-3 text-center text-sm">
                      <button
                        onClick={() => onToggleStar(item.id)}
                        className={`p-1 rounded hover:bg-gray-700 ${
                          starredItems.has(item.id) ? 'text-yellow-400' : 'text-gray-600'
                        }`}
                      >
                        <Star className="h-4 w-4" fill={starredItems.has(item.id) ? 'currentColor' : 'none'} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {watchlistItems.length === 0 && (
            <div className="p-8 text-center text-gray-400">
              <div className="text-lg font-medium">No watchlist items found</div>
              <div className="text-sm mt-1">Try adjusting your search criteria</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const StarredItemsAnalysis: React.FC<{ 
  data: ProcessedInventoryData; 
  onToggleStar: (id: string) => void; 
  starredItems: Set<string>; 
}> = ({ data, onToggleStar, starredItems }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('stockValue');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Column filter states
  const [columnFilters, setColumnFilters] = useState<{
    velocityCategory: string[];
    trendDirection: string[];
    winning: string[];
  }>({
    velocityCategory: [],
    trendDirection: [],
    winning: []
  });
  
  // Filter dropdown search states
  const [filterDropdownSearch, setFilterDropdownSearch] = useState<{
    velocityCategory: string;
    trendDirection: string;
    winning: string;
  }>({
    velocityCategory: '',
    trendDirection: '',
    winning: ''
  });

  // Filter starred items
  const starredItemsList = useMemo(() => {
    return data.analyzedItems
      .filter(item => starredItems.has(item.id))
      .filter(item => {
        const matchesSearch = 
          item.stockcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase());

        // Apply column filters
        const matchesVelocityFilter = columnFilters.velocityCategory.length === 0 || 
          columnFilters.velocityCategory.includes(typeof item.velocityCategory === 'number' ? item.velocityCategory.toString() : 'N/A');

        const matchesTrendFilter = columnFilters.trendDirection.length === 0 || 
          columnFilters.trendDirection.includes(item.trendDirection || 'N/A');

        const matchesWinningFilter = columnFilters.winning.length === 0 || 
          columnFilters.winning.includes(item.AVER ? 'Y' : 'N');

        return matchesSearch && matchesVelocityFilter && matchesTrendFilter && matchesWinningFilter;
      })
      .sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (sortField) {
          case 'stockValue':
            aValue = a.stockValue; bValue = b.stockValue; break;
          case 'averageCost':
            aValue = a.avg_cost || 0; bValue = b.avg_cost || 0; break;
          case 'monthsOfStock':
            aValue = a.monthsOfStock; bValue = b.monthsOfStock; break;
          case 'velocityCategory':
            aValue = typeof a.velocityCategory === 'number' ? a.velocityCategory : 999;
            bValue = typeof b.velocityCategory === 'number' ? b.velocityCategory : 999;
            break;
          case 'currentStock':
            aValue = a.currentStock; bValue = b.currentStock; break;
          case 'onOrder':
            aValue = a.quantity_on_order || 0; bValue = b.quantity_on_order || 0; break;
          case 'nbp':
            aValue = a.nextBuyingPrice || a.nbp || a.next_cost || a.min_cost || a.last_po_cost || 0;
            bValue = b.nextBuyingPrice || b.nbp || b.next_cost || b.min_cost || b.last_po_cost || 0;
            break;
          case 'winning':
            const aLowestComp = a.bestCompetitorPrice || a.lowestMarketPrice || a.Nupharm || a.AAH2 || a.LEXON2;
            const bLowestComp = b.bestCompetitorPrice || b.lowestMarketPrice || b.Nupharm || b.AAH2 || b.LEXON2;
            aValue = (a.AVER && aLowestComp && a.AVER < aLowestComp) ? 1 : 0;
            bValue = (b.AVER && bLowestComp && b.AVER < bLowestComp) ? 1 : 0;
            break;
          case 'lowestComp':
            aValue = a.bestCompetitorPrice || a.lowestMarketPrice || a.Nupharm || a.AAH2 || a.LEXON2 || 0;
            bValue = b.bestCompetitorPrice || b.lowestMarketPrice || b.Nupharm || b.AAH2 || b.LEXON2 || 0;
            break;
          case 'price':
            aValue = a.AVER || 0; bValue = b.AVER || 0; break;
          case 'sdt':
            aValue = a.SDT || 0; bValue = b.SDT || 0; break;
          case 'edt':
            aValue = a.EDT || 0; bValue = b.EDT || 0; break;
          default:
            aValue = a.stockcode; bValue = b.stockcode;
        }
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      });
  }, [data.analyzedItems, starredItems, searchTerm, sortField, sortDirection, columnFilters]);

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(value);
  };

  const getCategoryColor = (category: number | 'N/A') => {
    if (typeof category !== 'number') return 'text-gray-400';
    if (category <= 2) return 'text-green-400';
    if (category <= 4) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'UP': return 'text-green-400';
      case 'DOWN': return 'text-red-400';
      case 'STABLE': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  // Helper function to capitalize first letter
  const capitalizeFirst = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  // Column filter functions
  const handleColumnFilterChange = (column: keyof typeof columnFilters, values: string[]) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: values
    }));
  };

  const handleFilterDropdownSearchChange = (column: keyof typeof filterDropdownSearch, value: string) => {
    setFilterDropdownSearch(prev => ({
      ...prev,
      [column]: value
    }));
  };

  // Get unique values for column filters
  const getUniqueVelocityCategories = () => {
    const categories = [...new Set(data.analyzedItems
      .filter(item => starredItems.has(item.id))
      .map(item => typeof item.velocityCategory === 'number' ? item.velocityCategory.toString() : 'N/A')
    )];
    return categories.sort((a, b) => {
      if (a === 'N/A') return 1;
      if (b === 'N/A') return -1;
      return parseInt(a) - parseInt(b);
    });
  };

  const getUniqueTrendDirections = () => {
    const trends = [...new Set(data.analyzedItems
      .filter(item => starredItems.has(item.id))
      .map(item => item.trendDirection || 'N/A'))];
    return trends.sort((a, b) => {
      const order = { 'DOWN': 1, 'STABLE': 2, 'UP': 3, 'N/A': 4 };
      return (order[a as keyof typeof order] || 4) - (order[b as keyof typeof order] || 4);
    });
  };

  const getUniqueWinningValues = () => {
    return ['Y', 'N'];
  };

  // Render column header with optional filter
  const renderColumnHeader = (
    title: string,
    sortKey: string,
    filterColumn?: keyof typeof columnFilters,
    filterOptions?: string[],
    alignment: 'left' | 'center' | 'right' = 'left'
  ) => {
    const hasActiveFilter = filterColumn && columnFilters[filterColumn].length > 0;
    const alignmentClass = alignment === 'center' ? 'text-center' : alignment === 'right' ? 'text-right' : 'text-left';
    const justifyClass = alignment === 'center' ? 'justify-center' : alignment === 'right' ? 'justify-end' : 'justify-start';
    
    return (
      <th className={`${alignmentClass} p-3 text-gray-300 relative`}>
        <div className={`flex items-center gap-2 ${justifyClass}`}>
          <button
            onClick={() => handleSort(sortKey)}
            className="hover:text-white cursor-pointer flex items-center gap-1"
          >
            {title}
            {sortField === sortKey && (
              <span className="text-xs">
                {sortDirection === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </button>
          
          {filterColumn && filterOptions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={`p-1 rounded hover:bg-gray-700 ${hasActiveFilter ? 'text-blue-400' : 'text-gray-400'}`}>
                  <Filter className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-gray-800 border-gray-700">
                <div className="p-2">
                  <Input
                    placeholder="Search..."
                    value={filterDropdownSearch[filterColumn]}
                    onChange={(e) => handleFilterDropdownSearchChange(filterColumn, e.target.value)}
                    className="h-8 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <DropdownMenuSeparator className="bg-gray-700" />
                <div className="p-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={columnFilters[filterColumn].length === 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleColumnFilterChange(filterColumn, []);
                        }
                      }}
                      className="rounded border-gray-600 bg-gray-700"
                    />
                    <span className="text-sm text-white">Select All</span>
                  </label>
                </div>
                <DropdownMenuSeparator className="bg-gray-700" />
                <div className="max-h-48 overflow-y-auto">
                  {filterOptions
                    .filter(option => 
                      filterDropdownSearch[filterColumn] === '' ||
                      option.toLowerCase().includes(filterDropdownSearch[filterColumn].toLowerCase())
                    )
                    .map((option) => (
                      <div key={option} className="p-2">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={columnFilters[filterColumn].includes(option)}
                            onChange={(e) => {
                              const currentFilters = columnFilters[filterColumn];
                              if (e.target.checked) {
                                handleColumnFilterChange(filterColumn, [...currentFilters, option]);
                              } else {
                                handleColumnFilterChange(filterColumn, currentFilters.filter(f => f !== option));
                              }
                            }}
                            className="rounded border-gray-600 bg-gray-700"
                          />
                          <span className="text-sm text-white">{option === 'N/A' ? option : capitalizeFirst(option)}</span>
                        </label>
                      </div>
                    ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </th>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Starred Items Analysis</h3>
        <div className="text-sm text-gray-400">
          {starredItemsList.length} starred items
        </div>
      </div>

      {/* Search */}
      <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
        <CardContent className="p-4">
          <Input
            placeholder="Search by stock code or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-800 border-gray-700 text-white"
          />
        </CardContent>
      </Card>

      {/* Data Table with Sticky Headers */}
      <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
        <CardContent className="p-0">
          <div className="max-h-[600px] overflow-y-auto">
            <table className="w-full min-w-[1400px]">
              <thead className="bg-gray-900/90 sticky top-0 z-10">
                <tr className="border-b border-gray-700">
                  <th className="text-left p-3 text-gray-300 cursor-pointer hover:text-white sticky left-0 bg-gray-900/95 backdrop-blur-sm border-r border-gray-700 z-20 min-w-[200px] text-sm" onClick={() => handleSort('stockcode')}>
                    Item {sortField === 'stockcode' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('stockValue')}>
                    Stock Value {sortField === 'stockValue' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('averageCost')}>
                    Avg Cost {sortField === 'averageCost' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('currentStock')}>
                    Stock Qty {sortField === 'currentStock' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('onOrder')}>
                    On Order {sortField === 'onOrder' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-center p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('monthsOfStock')}>
                    Months {sortField === 'monthsOfStock' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  {renderColumnHeader('Velocity', 'velocityCategory', 'velocityCategory', getUniqueVelocityCategories(), 'center')}
                  {renderColumnHeader('Trend', 'trendDirection', 'trendDirection', getUniqueTrendDirections(), 'center')}
                  <th className="text-center p-3 text-gray-300 text-sm">
                    Watch
                  </th>
                  <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('price')}>
                    Price {sortField === 'price' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('nbp')}>
                    NBP {sortField === 'nbp' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  {renderColumnHeader('Winning', 'winning', 'winning', getUniqueWinningValues(), 'center')}
                  <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('lowestComp')}>
                    Lowest Comp {sortField === 'lowestComp' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('sdt')}>
                    SDT {sortField === 'sdt' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('edt')}>
                    EDT {sortField === 'edt' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-center p-3 text-gray-300 text-sm">
                    Star
                  </th>
                </tr>
              </thead>
              <tbody>
                {starredItemsList.map((item) => (
                  <tr key={item.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                    <td className="p-3 sticky left-0 bg-gray-950/95 backdrop-blur-sm border-r border-gray-700 min-w-[200px] text-sm">
                      <div>
                        <div className="font-medium text-white">{item.stockcode}</div>
                        <div className="text-sm text-gray-400 truncate max-w-xs">{item.description}</div>
                      </div>
                    </td>
                    <td className="p-3 text-right text-white font-semibold text-sm">
                      {formatCurrency(item.stockValue)}
                    </td>
                    <td className="p-3 text-right text-gray-300 text-sm">
                      {shouldShowAverageCostTooltip(item) ? (
                        <TooltipProvider>
                          <UITooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help underline decoration-dotted">
                                {getDisplayedAverageCost(item) ? formatCurrency(getDisplayedAverageCost(item)!) : 'N/A'}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="bg-gray-800 border-gray-700 text-white">
                              <div className="text-sm">{getAverageCostTooltip(item)}</div>
                            </TooltipContent>
                          </UITooltip>
                        </TooltipProvider>
                      ) : (
                        getDisplayedAverageCost(item) ? formatCurrency(getDisplayedAverageCost(item)!) : 'N/A'
                      )}
                    </td>
                    <td className="p-3 text-right text-gray-300 text-sm">
                      {(item.currentStock || 0).toLocaleString()}
                    </td>
                    <td className="p-3 text-right text-gray-300 text-sm">
                      {(item.quantity_on_order || 0).toLocaleString()}
                    </td>
                    <td className="p-3 text-center text-sm">
                      <TooltipProvider>
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <span className={`cursor-help ${item.monthsOfStock && item.monthsOfStock > 6 ? 'text-red-400 font-semibold' : 'text-gray-300'}`}>
                              {item.monthsOfStock === 999.9 ? '∞' : item.monthsOfStock ? item.monthsOfStock.toFixed(1) : 'N/A'}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="bg-gray-800 border-gray-700 text-white">
                            <div className="text-sm">{item.averageUsage || item.packs_sold_avg_last_six_months ? (item.averageUsage || item.packs_sold_avg_last_six_months).toFixed(0) : 'No'} packs/month</div>
                          </TooltipContent>
                        </UITooltip>
                      </TooltipProvider>
                    </td>
                    <td className={`p-3 text-center font-semibold ${getCategoryColor(item.velocityCategory)}`}>
                      {typeof item.velocityCategory === 'number' ? item.velocityCategory : 'N/A'}
                    </td>
                    <td className={`p-3 text-center font-semibold ${getTrendColor(item.trendDirection)}`}>
                      {item.trendDirection === 'UP' ? '↑' : 
                       item.trendDirection === 'DOWN' ? '↓' : 
                       item.trendDirection === 'STABLE' ? '−' : '?'}
                    </td>
                    <td className="p-3 text-center text-sm">
                      <span className={item.watchlist === '⚠️' ? 'text-orange-400' : 'text-gray-600'}>
                        {item.watchlist || '−'}
                      </span>
                    </td>
                    <td className="p-3 text-right text-purple-400 font-semibold text-sm">
                      {item.AVER ? formatCurrency(item.AVER) : 'N/A'}
                    </td>
                    <td className="p-3 text-right text-green-400 font-semibold text-sm">
                      <TooltipProvider>
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help underline decoration-dotted">
                              {item.min_cost && item.min_cost > 0 ? formatCurrency(item.min_cost) : 'OOS'}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="bg-gray-800 border-gray-700 text-white">
                            <div className="space-y-1">
                              <div className="text-sm">Next Cost: {item.next_cost && item.next_cost > 0 ? formatCurrency(item.next_cost) : 'N/A'}</div>
                              <div className="text-sm">Min Cost: {item.min_cost && item.min_cost > 0 ? formatCurrency(item.min_cost) : 'N/A'}</div>
                              <div className="text-sm">Last PO Cost: {item.last_po_cost && item.last_po_cost > 0 ? formatCurrency(item.last_po_cost) : 'N/A'}</div>
                            </div>
                          </TooltipContent>
                        </UITooltip>
                      </TooltipProvider>
                    </td>
                    <td className="p-3 text-center font-semibold text-sm">
                      {(() => {
                        const lowestComp = item.bestCompetitorPrice || item.lowestMarketPrice || item.Nupharm || item.AAH2 || item.LEXON2;
                        const isWinning = item.AVER && lowestComp && item.AVER < lowestComp;
                        return (
                          <span className={isWinning ? 'text-green-400' : 'text-red-400'}>
                            {isWinning ? 'Y' : 'N'}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="p-3 text-right text-blue-400 font-semibold text-sm">
                      <TooltipProvider>
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help underline decoration-dotted">
                              {item.bestCompetitorPrice ? formatCurrency(item.bestCompetitorPrice) : 
                               (item.lowestMarketPrice ? formatCurrency(item.lowestMarketPrice) : 
                                (item.Nupharm ? formatCurrency(item.Nupharm) : 
                                 (item.AAH2 ? formatCurrency(item.AAH2) : 
                                  (item.LEXON2 ? formatCurrency(item.LEXON2) : 'N/A'))))}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="bg-gray-800 border-gray-700 text-white max-w-xs">
                            <div className="space-y-1">
                              {[
                                { name: 'Nupharm', price: item.Nupharm },
                                { name: 'AAH2', price: item.AAH2 },
                                { name: 'ETH_LIST', price: item.ETH_LIST },
                                { name: 'ETH_NET', price: item.ETH_NET },
                                { name: 'LEXON2', price: item.LEXON2 }
                              ].filter(comp => comp.price && comp.price > 0)
                               .sort((a, b) => a.price - b.price)
                               .map((comp, idx) => (
                                <div key={idx} className="text-sm">{comp.name}: {formatCurrency(comp.price)}</div>
                              ))}
                              {![item.Nupharm, item.AAH2, item.ETH_LIST, item.ETH_NET, item.LEXON2].some(price => price && price > 0) && (
                                <div className="text-sm">No competitor pricing available</div>
                              )}
                            </div>
                          </TooltipContent>
                        </UITooltip>
                      </TooltipProvider>
                    </td>
                    <td className="p-3 text-right text-gray-300 text-sm">
                      {item.SDT ? formatCurrency(item.SDT) : '-'}
                    </td>
                    <td className="p-3 text-right text-gray-300 text-sm">
                      {item.EDT ? formatCurrency(item.EDT) : '-'}
                    </td>
                    <td className="p-3 text-center text-sm">
                      <button
                        onClick={() => onToggleStar(item.id)}
                        className={`p-1 rounded hover:bg-gray-700 ${
                          starredItems.has(item.id) ? 'text-yellow-400' : 'text-gray-600'
                        }`}
                      >
                        <Star className="h-4 w-4" fill={starredItems.has(item.id) ? 'currentColor' : 'none'} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {starredItemsList.length === 0 && (
            <div className="p-8 text-center text-gray-400">
              <div className="text-lg font-medium">No starred items found</div>
              <div className="text-sm mt-1">Star items to track them here</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const AllItemsAnalysis: React.FC<{ 
  data: ProcessedInventoryData; 
  onToggleStar: (id: string) => void; 
  starredItems: Set<string>; 
}> = ({ data, onToggleStar, starredItems }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('stockValue');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Column filter states
  const [columnFilters, setColumnFilters] = useState<{
    velocityCategory: string[];
    trendDirection: string[];
    winning: string[];
  }>({
    velocityCategory: [],
    trendDirection: [],
    winning: []
  });
  
  // Filter dropdown search states
  const [filterDropdownSearch, setFilterDropdownSearch] = useState<{
    velocityCategory: string;
    trendDirection: string;
    winning: string;
  }>({
    velocityCategory: '',
    trendDirection: '',
    winning: ''
  });
  const [filterType, setFilterType] = useState<string>('all');

  // Filter and sort all items
  const filteredItems = useMemo(() => {
    let items = data.analyzedItems;

    // Apply category filter
    if (filterType === 'watchlist') {
      items = items.filter(item => item.watchlist === '⚠️');
    } else if (filterType === 'fast-movers') {
      items = items.filter(item => typeof item.velocityCategory === 'number' && item.velocityCategory <= 3);
    } else if (filterType === 'high-value') {
      items = items.filter(item => item.stockValue > 1000);
    } else if (filterType === 'cost-disadvantage-down') {
      items = items.filter(item => {
        const competitorPrices = [item.Nupharm, item.AAH2, item.ETH_LIST, item.ETH_NET, item.LEXON2].filter(p => p && p > 0);
        const maxCompPrice = competitorPrices.length > 0 ? Math.max(...competitorPrices) : 0;
        return item.avg_cost > maxCompPrice && item.trendDirection === 'DOWN' && maxCompPrice > 0;
      });
    } else if (filterType === 'margin-opportunity') {
      items = items.filter(item => {
        const competitorPrices = [item.Nupharm, item.AAH2, item.ETH_LIST, item.ETH_NET, item.LEXON2].filter(p => p && p > 0);
        const marketLow = competitorPrices.length > 0 ? Math.min(...competitorPrices) : 0;
        return item.avg_cost < marketLow && item.AVER && item.AVER < marketLow && marketLow > 0;
      });
    } else if (filterType === 'urgent-sourcing') {
      items = items.filter(item => {
        const competitorPrices = [item.Nupharm, item.AAH2, item.ETH_LIST, item.ETH_NET, item.LEXON2].filter(p => p && p > 0);
        if (competitorPrices.length === 0) return false;
        const avgCompPrice = competitorPrices.reduce((sum, p) => sum + p, 0) / competitorPrices.length;
        const maxCompPrice = Math.max(...competitorPrices);
        // Show items where our cost is >5% above average competitor price OR >any competitor with stable/rising trend
        return (item.avg_cost > avgCompPrice * 1.05 || item.avg_cost > maxCompPrice) && ['STABLE', 'UP'].includes(item.trendDirection);
      });
    } else if (filterType === 'high-impact-margin') {
      items = items.filter(item => {
        const competitorPrices = [item.Nupharm, item.AAH2, item.ETH_LIST, item.ETH_NET, item.LEXON2].filter(p => p && p > 0);
        const marketLow = competitorPrices.length > 0 ? Math.min(...competitorPrices) : 0;
        const hasMarginOpportunity = item.avg_cost < marketLow && item.AVER && item.AVER < marketLow && marketLow > 0;
        return hasMarginOpportunity && typeof item.velocityCategory === 'number' && item.velocityCategory <= 3 && item.stockValue > 500;
      });
    } else if (filterType === 'price-war-opportunity') {
      items = items.filter(item => {
        const competitorPrices = [item.Nupharm, item.AAH2, item.ETH_LIST, item.ETH_NET, item.LEXON2].filter(p => p && p > 0);
        const marketLow = competitorPrices.length > 0 ? Math.min(...competitorPrices) : 0;
        const isWinning = item.AVER && marketLow > 0 && item.AVER < marketLow;
        return isWinning && item.trendDirection === 'UP';
      });
    } else if (filterType === 'dead-stock-alert') {
      items = items.filter(item => {
        const competitorPrices = [item.Nupharm, item.AAH2, item.ETH_LIST, item.ETH_NET, item.LEXON2].filter(p => p && p > 0);
        const maxCompPrice = competitorPrices.length > 0 ? Math.max(...competitorPrices) : 0;
        const hasCostDisadvantage = item.avg_cost > maxCompPrice && maxCompPrice > 0;
        return hasCostDisadvantage && item.trendDirection === 'DOWN' && item.monthsOfStock && item.monthsOfStock > 6;
      });
    }

    // Apply search filter
    items = items.filter(item => 
      item.stockcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Apply column filters
    const matchesVelocityFilter = (item: any) => {
      return columnFilters.velocityCategory.length === 0 || 
        columnFilters.velocityCategory.includes(typeof item.velocityCategory === 'number' ? item.velocityCategory.toString() : 'N/A');
    };

    const matchesTrendFilter = (item: any) => {
      return columnFilters.trendDirection.length === 0 || 
        columnFilters.trendDirection.includes(item.trendDirection || 'N/A');
    };

    const matchesWinningFilter = (item: any) => {
      if (columnFilters.winning.length === 0) return true;
      const lowestComp = item.bestCompetitorPrice || item.lowestMarketPrice || item.Nupharm || item.AAH2 || item.LEXON2;
      const isWinning = item.AVER && lowestComp && item.AVER < lowestComp;
      return columnFilters.winning.includes(isWinning ? 'Y' : 'N');
    };

    items = items.filter(item => matchesVelocityFilter(item) && matchesTrendFilter(item) && matchesWinningFilter(item));

    // Sort items
    return items.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'stockValue':
          aValue = a.stockValue; bValue = b.stockValue; break;
        case 'averageCost':
          aValue = a.avg_cost || 0; bValue = b.avg_cost || 0; break;
        case 'monthsOfStock':
          aValue = a.monthsOfStock; bValue = b.monthsOfStock; break;
        case 'velocityCategory':
          aValue = typeof a.velocityCategory === 'number' ? a.velocityCategory : 999;
          bValue = typeof b.velocityCategory === 'number' ? b.velocityCategory : 999;
          break;
        case 'currentStock':
          aValue = a.currentStock; bValue = b.currentStock; break;
        case 'onOrder':
          aValue = a.quantity_on_order || 0; bValue = b.quantity_on_order || 0; break;
        case 'nbp':
          aValue = a.nextBuyingPrice || a.nbp || a.next_cost || a.min_cost || a.last_po_cost || 0;
          bValue = b.nextBuyingPrice || b.nbp || b.next_cost || b.min_cost || b.last_po_cost || 0;
          break;
        case 'winning':
          const aLowestComp = a.bestCompetitorPrice || a.lowestMarketPrice || a.Nupharm || a.AAH2 || a.LEXON2;
          const bLowestComp = b.bestCompetitorPrice || b.lowestMarketPrice || b.Nupharm || b.AAH2 || b.LEXON2;
          aValue = (a.AVER && aLowestComp && a.AVER < aLowestComp) ? 1 : 0;
          bValue = (b.AVER && bLowestComp && b.AVER < bLowestComp) ? 1 : 0;
          break;
        case 'lowestComp':
          aValue = a.bestCompetitorPrice || a.lowestMarketPrice || a.Nupharm || a.AAH2 || a.LEXON2 || 0;
          bValue = b.bestCompetitorPrice || b.lowestMarketPrice || b.Nupharm || b.AAH2 || b.LEXON2 || 0;
          break;
        case 'price':
          aValue = a.AVER || 0; bValue = b.AVER || 0; break;
        case 'sdt':
          aValue = a.SDT || 0; bValue = b.SDT || 0; break;
        case 'edt':
          aValue = a.EDT || 0; bValue = b.EDT || 0; break;
        default:
          aValue = a.stockcode; bValue = b.stockcode;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });
  }, [data.analyzedItems, searchTerm, sortField, sortDirection, filterType, columnFilters]);

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(value);
  };

  const getCategoryColor = (category: number | 'N/A') => {
    if (typeof category !== 'number') return 'text-gray-400';
    if (category <= 2) return 'text-green-400';
    if (category <= 4) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'UP': return 'text-green-400';
      case 'DOWN': return 'text-red-400';
      case 'STABLE': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  // Helper function to capitalize first letter
  const capitalizeFirst = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  // Column filter functions
  const handleColumnFilterChange = (column: keyof typeof columnFilters, values: string[]) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: values
    }));
  };

  const handleFilterDropdownSearchChange = (column: keyof typeof filterDropdownSearch, value: string) => {
    setFilterDropdownSearch(prev => ({
      ...prev,
      [column]: value
    }));
  };

  // Get unique values for column filters
  const getUniqueVelocityCategories = () => {
    const categories = [...new Set(data.analyzedItems
      .map(item => typeof item.velocityCategory === 'number' ? item.velocityCategory.toString() : 'N/A')
    )];
    return categories.sort((a, b) => {
      if (a === 'N/A') return 1;
      if (b === 'N/A') return -1;
      return parseInt(a) - parseInt(b);
    });
  };

  const getUniqueTrendDirections = () => {
    const trends = [...new Set(data.analyzedItems.map(item => item.trendDirection || 'N/A'))];
    return trends.sort();
  };

  const getUniqueWinningValues = () => {
    return ['Y', 'N'];
  };

  // Render column header with optional filter
  const renderColumnHeader = (
    title: string,
    sortKey: string,
    filterColumn?: keyof typeof columnFilters,
    filterOptions?: string[],
    alignment: 'left' | 'center' | 'right' = 'left'
  ) => {
    const hasActiveFilter = filterColumn && columnFilters[filterColumn].length > 0;
    const alignmentClass = alignment === 'center' ? 'text-center' : alignment === 'right' ? 'text-right' : 'text-left';
    const justifyClass = alignment === 'center' ? 'justify-center' : alignment === 'right' ? 'justify-end' : 'justify-start';
    
    return (
      <th className={`${alignmentClass} p-3 text-gray-300 relative`}>
        <div className={`flex items-center gap-2 ${justifyClass}`}>
          <button
            onClick={() => handleSort(sortKey)}
            className="hover:text-white cursor-pointer flex items-center gap-1"
          >
            {title}
            {sortField === sortKey && (
              <span className="text-xs">
                {sortDirection === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </button>
          
          {filterColumn && filterOptions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={`p-1 rounded hover:bg-gray-700 ${hasActiveFilter ? 'text-blue-400' : 'text-gray-400'}`}>
                  <Filter className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-gray-800 border-gray-700">
                <div className="p-2">
                  <Input
                    placeholder="Search..."
                    value={filterDropdownSearch[filterColumn]}
                    onChange={(e) => handleFilterDropdownSearchChange(filterColumn, e.target.value)}
                    className="h-8 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <DropdownMenuSeparator className="bg-gray-700" />
                <div className="p-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={columnFilters[filterColumn].length === 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleColumnFilterChange(filterColumn, []);
                        }
                      }}
                      className="rounded border-gray-600 bg-gray-700"
                    />
                    <span className="text-sm text-white">Select All</span>
                  </label>
                </div>
                <DropdownMenuSeparator className="bg-gray-700" />
                <div className="max-h-48 overflow-y-auto">
                  {filterOptions
                    .filter(option => 
                      filterDropdownSearch[filterColumn] === '' ||
                      option.toLowerCase().includes(filterDropdownSearch[filterColumn].toLowerCase())
                    )
                    .map((option) => (
                      <div key={option} className="p-2">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={columnFilters[filterColumn].includes(option)}
                            onChange={(e) => {
                              const currentFilters = columnFilters[filterColumn];
                              if (e.target.checked) {
                                handleColumnFilterChange(filterColumn, [...currentFilters, option]);
                              } else {
                                handleColumnFilterChange(filterColumn, currentFilters.filter(f => f !== option));
                              }
                            }}
                            className="rounded border-gray-600 bg-gray-700"
                          />
                          <span className="text-sm text-white">{option === 'N/A' ? option : capitalizeFirst(option)}</span>
                        </label>
                      </div>
                    ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </th>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">All Items Analysis</h3>
        <div className="text-sm text-gray-400">
          {filteredItems.length.toLocaleString()} items
        </div>
      </div>

      {/* Filters and Search */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
          <CardContent className="p-4">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all" className="text-gray-300">All Items</SelectItem>
                <SelectItem value="watchlist" className="text-gray-300">Watchlist Only</SelectItem>
                <SelectItem value="fast-movers" className="text-gray-300">Fast Movers (Cat 1-3)</SelectItem>
                <SelectItem value="high-value" className="text-gray-300">High Value (&gt;£1,000)</SelectItem>
                <SelectItem value="cost-disadvantage-down" className="text-red-300">🔻 Cost Disadvantage + Down Trend</SelectItem>
                <SelectItem value="margin-opportunity" className="text-green-300">💰 Margin Opportunity</SelectItem>
                <SelectItem value="urgent-sourcing" className="text-orange-300">⚡ Urgent Sourcing Required</SelectItem>
                <SelectItem value="high-impact-margin" className="text-blue-300">🎯 High Impact Margin Wins</SelectItem>
                <SelectItem value="price-war-opportunity" className="text-purple-300">📈 Price War Opportunities</SelectItem>
                <SelectItem value="dead-stock-alert" className="text-red-400">☠️ Dead Stock Alert</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        
        <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
          <CardContent className="p-4">
            <Input
              placeholder="Search by stock code or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white"
            />
          </CardContent>
        </Card>
      </div>

      {/* Strategic Filters */}
      <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
        <CardContent className="p-4">
          <h4 className="text-sm font-medium text-gray-300 mb-3">Strategic Filters</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setFilterType('cost-disadvantage-down')}
                    className={`p-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                      filterType === 'cost-disadvantage-down' 
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                        : 'bg-gray-800/50 text-gray-400 hover:bg-red-500/10 hover:text-red-300 border border-gray-700/50'
                    }`}
                  >
                    🔻 Cost Risk
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-gray-800 border-gray-700 text-white max-w-xs">
                  <div className="text-sm">
                    <div className="font-medium mb-1">Cost Disadvantage + Falling Prices</div>
                    <div>Products where our cost exceeds all competitors AND market prices are falling. Urgent clearance needed.</div>
                  </div>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>

            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setFilterType('margin-opportunity')}
                    className={`p-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                      filterType === 'margin-opportunity' 
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                        : 'bg-gray-800/50 text-gray-400 hover:bg-green-500/10 hover:text-green-300 border border-gray-700/50'
                    }`}
                  >
                    💰 Margin Win
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-gray-800 border-gray-700 text-white max-w-xs">
                  <div className="text-sm">
                    <div className="font-medium mb-1">Immediate Margin Opportunities</div>
                    <div>Products where our cost is below market minimum. Can increase price while staying cheapest.</div>
                  </div>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>

            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setFilterType('urgent-sourcing')}
                    className={`p-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                      filterType === 'urgent-sourcing' 
                        ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' 
                        : 'bg-gray-800/50 text-gray-400 hover:bg-orange-500/10 hover:text-orange-300 border border-gray-700/50'
                    }`}
                  >
                    ⚡ Urgent Buy
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-gray-800 border-gray-700 text-white max-w-xs">
                  <div className="text-sm">
                    <div className="font-medium mb-1">Urgent Sourcing Required</div>
                    <div>Products where our cost is 5%+ above market average with stable/rising trends. No price relief coming.</div>
                  </div>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>

            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setFilterType('high-impact-margin')}
                    className={`p-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                      filterType === 'high-impact-margin' 
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                        : 'bg-gray-800/50 text-gray-400 hover:bg-blue-500/10 hover:text-blue-300 border border-gray-700/50'
                    }`}
                  >
                    🎯 High Impact
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-gray-800 border-gray-700 text-white max-w-xs">
                  <div className="text-sm">
                    <div className="font-medium mb-1">High Impact Margin Wins</div>
                    <div>Fast-moving, high-value products (Cat 1-3, &gt;£500) with margin opportunities. Biggest revenue impact.</div>
                  </div>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>

            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setFilterType('price-war-opportunity')}
                    className={`p-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                      filterType === 'price-war-opportunity' 
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                        : 'bg-gray-800/50 text-gray-400 hover:bg-purple-500/10 hover:text-purple-300 border border-gray-700/50'
                    }`}
                  >
                    📈 Price Up
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-gray-800 border-gray-700 text-white max-w-xs">
                  <div className="text-sm">
                    <div className="font-medium mb-1">Price War Opportunities</div>
                    <div>Products where we're winning (cheapest) but market trend is UP. Can we increase price and maintain lead?</div>
                  </div>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>

            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setFilterType('dead-stock-alert')}
                    className={`p-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                      filterType === 'dead-stock-alert' 
                        ? 'bg-red-600/20 text-red-400 border border-red-600/30' 
                        : 'bg-gray-800/50 text-gray-400 hover:bg-red-600/10 hover:text-red-400 border border-gray-700/50'
                    }`}
                  >
                    ☠️ Dead Stock
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-gray-800 border-gray-700 text-white max-w-xs">
                  <div className="text-sm">
                    <div className="font-medium mb-1">Dead Stock Alert</div>
                    <div>High cost + falling prices + overstocked (&gt;6 months). Critical clearance priority to minimize losses.</div>
                  </div>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>
          </div>
          {filterType !== 'all' && (
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => setFilterType('all')}
                className="text-xs text-gray-400 hover:text-white transition-colors duration-200 flex items-center gap-1"
              >
                ← Clear Filter
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Table with Sticky Headers */}
      <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
        <CardContent className="p-0">
          <div className="max-h-[600px] overflow-y-auto">
            <table className="w-full min-w-[1400px]">
              <thead className="bg-gray-900/90 sticky top-0 z-10">
                <tr className="border-b border-gray-700">
                  <th className="text-left p-3 text-gray-300 cursor-pointer hover:text-white sticky left-0 bg-gray-900/95 backdrop-blur-sm border-r border-gray-700 z-20 min-w-[200px] text-sm" onClick={() => handleSort('stockcode')}>
                    Item {sortField === 'stockcode' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('stockValue')}>
                    Stock Value {sortField === 'stockValue' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('averageCost')}>
                    Avg Cost {sortField === 'averageCost' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('currentStock')}>
                    Stock Qty {sortField === 'currentStock' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('onOrder')}>
                    On Order {sortField === 'onOrder' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-center p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('monthsOfStock')}>
                    Months {sortField === 'monthsOfStock' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  {renderColumnHeader('Velocity', 'velocityCategory', 'velocityCategory', getUniqueVelocityCategories(), 'center')}
                  {renderColumnHeader('Trend', 'trendDirection', 'trendDirection', getUniqueTrendDirections(), 'center')}
                  <th className="text-center p-3 text-gray-300 text-sm">
                    Watch
                  </th>
                  <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('price')}>
                    Price {sortField === 'price' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('nbp')}>
                    NBP {sortField === 'nbp' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  {renderColumnHeader('Winning', 'winning', 'winning', getUniqueWinningValues(), 'center')}
                  <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('lowestComp')}>
                    Lowest Comp {sortField === 'lowestComp' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('sdt')}>
                    SDT {sortField === 'sdt' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('edt')}>
                    EDT {sortField === 'edt' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-center p-3 text-gray-300 text-sm">
                    Star
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                    <td className="p-3 sticky left-0 bg-gray-950/95 backdrop-blur-sm border-r border-gray-700 min-w-[200px] text-sm">
                      <div>
                        <div className="font-medium text-white">{item.stockcode}</div>
                        <div className="text-sm text-gray-400 truncate max-w-xs">{item.description}</div>
                      </div>
                    </td>
                    <td className="p-3 text-right text-white font-semibold text-sm">
                      {formatCurrency(item.stockValue)}
                    </td>
                    <td className="p-3 text-right text-gray-300 text-sm">
                      {shouldShowAverageCostTooltip(item) ? (
                        <TooltipProvider>
                          <UITooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help underline decoration-dotted">
                                {getDisplayedAverageCost(item) ? formatCurrency(getDisplayedAverageCost(item)!) : 'N/A'}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="bg-gray-800 border-gray-700 text-white">
                              <div className="text-sm">{getAverageCostTooltip(item)}</div>
                            </TooltipContent>
                          </UITooltip>
                        </TooltipProvider>
                      ) : (
                        getDisplayedAverageCost(item) ? formatCurrency(getDisplayedAverageCost(item)!) : 'N/A'
                      )}
                    </td>
                    <td className="p-3 text-right text-gray-300 text-sm">
                      {(item.currentStock || 0).toLocaleString()}
                    </td>
                    <td className="p-3 text-right text-gray-300 text-sm">
                      {(item.quantity_on_order || 0).toLocaleString()}
                    </td>
                    <td className="p-3 text-center text-sm">
                      <TooltipProvider>
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <span className={`cursor-help ${item.monthsOfStock && item.monthsOfStock > 6 ? 'text-red-400 font-semibold' : 'text-gray-300'}`}>
                              {item.monthsOfStock === 999.9 ? '∞' : item.monthsOfStock ? item.monthsOfStock.toFixed(1) : 'N/A'}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="bg-gray-800 border-gray-700 text-white">
                            <div className="text-sm">{item.averageUsage || item.packs_sold_avg_last_six_months ? (item.averageUsage || item.packs_sold_avg_last_six_months).toFixed(0) : 'No'} packs/month</div>
                          </TooltipContent>
                        </UITooltip>
                      </TooltipProvider>
                    </td>
                    <td className={`p-3 text-center font-semibold ${getCategoryColor(item.velocityCategory)}`}>
                      {typeof item.velocityCategory === 'number' ? item.velocityCategory : 'N/A'}
                    </td>
                    <td className={`p-3 text-center font-semibold ${getTrendColor(item.trendDirection)}`}>
                      {item.trendDirection === 'UP' ? '↑' : 
                       item.trendDirection === 'DOWN' ? '↓' : 
                       item.trendDirection === 'STABLE' ? '−' : '?'}
                    </td>
                    <td className="p-3 text-center text-sm">
                      <span className={item.watchlist === '⚠️' ? 'text-orange-400' : 'text-gray-600'}>
                        {item.watchlist || '−'}
                      </span>
                    </td>
                    <td className="p-3 text-right text-purple-400 font-semibold text-sm">
                      {item.AVER ? formatCurrency(item.AVER) : 'N/A'}
                    </td>
                    <td className="p-3 text-right text-green-400 font-semibold text-sm">
                      <TooltipProvider>
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help underline decoration-dotted">
                              {item.min_cost && item.min_cost > 0 ? formatCurrency(item.min_cost) : 'OOS'}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="bg-gray-800 border-gray-700 text-white">
                            <div className="space-y-1">
                              <div className="text-sm">Next Cost: {item.next_cost && item.next_cost > 0 ? formatCurrency(item.next_cost) : 'N/A'}</div>
                              <div className="text-sm">Min Cost: {item.min_cost && item.min_cost > 0 ? formatCurrency(item.min_cost) : 'N/A'}</div>
                              <div className="text-sm">Last PO Cost: {item.last_po_cost && item.last_po_cost > 0 ? formatCurrency(item.last_po_cost) : 'N/A'}</div>
                            </div>
                          </TooltipContent>
                        </UITooltip>
                      </TooltipProvider>
                    </td>
                    <td className="p-3 text-center font-semibold text-sm">
                      {(() => {
                        const lowestComp = item.bestCompetitorPrice || item.lowestMarketPrice || item.Nupharm || item.AAH2 || item.LEXON2;
                        const isWinning = item.AVER && lowestComp && item.AVER < lowestComp;
                        return (
                          <span className={isWinning ? 'text-green-400' : 'text-red-400'}>
                            {isWinning ? 'Y' : 'N'}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="p-3 text-right text-blue-400 font-semibold text-sm">
                      <TooltipProvider>
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help underline decoration-dotted">
                              {item.bestCompetitorPrice ? formatCurrency(item.bestCompetitorPrice) : 
                               (item.lowestMarketPrice ? formatCurrency(item.lowestMarketPrice) : 
                                (item.Nupharm ? formatCurrency(item.Nupharm) : 
                                 (item.AAH2 ? formatCurrency(item.AAH2) : 
                                  (item.LEXON2 ? formatCurrency(item.LEXON2) : 'N/A'))))}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="bg-gray-800 border-gray-700 text-white max-w-xs">
                            <div className="space-y-1">
                              {[
                                { name: 'Nupharm', price: item.Nupharm },
                                { name: 'AAH2', price: item.AAH2 },
                                { name: 'ETH_LIST', price: item.ETH_LIST },
                                { name: 'ETH_NET', price: item.ETH_NET },
                                { name: 'LEXON2', price: item.LEXON2 }
                              ].filter(comp => comp.price && comp.price > 0)
                               .sort((a, b) => a.price - b.price)
                               .map((comp, idx) => (
                                <div key={idx} className="text-sm">{comp.name}: {formatCurrency(comp.price)}</div>
                              ))}
                              {![item.Nupharm, item.AAH2, item.ETH_LIST, item.ETH_NET, item.LEXON2].some(price => price && price > 0) && (
                                <div className="text-sm">No competitor pricing available</div>
                              )}
                            </div>
                          </TooltipContent>
                        </UITooltip>
                      </TooltipProvider>
                    </td>
                    <td className="p-3 text-right text-gray-300 text-sm">
                      {item.SDT ? formatCurrency(item.SDT) : '-'}
                    </td>
                    <td className="p-3 text-right text-gray-300 text-sm">
                      {item.EDT ? formatCurrency(item.EDT) : '-'}
                    </td>
                    <td className="p-3 text-center text-sm">
                      <button
                        onClick={() => onToggleStar(item.id)}
                        className={`p-1 rounded hover:bg-gray-700 ${
                          starredItems.has(item.id) ? 'text-yellow-400' : 'text-gray-600'
                        }`}
                      >
                        <Star className="h-4 w-4" fill={starredItems.has(item.id) ? 'currentColor' : 'none'} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredItems.length === 0 && (
            <div className="p-8 text-center text-gray-400">
              <div className="text-lg font-medium">No items found</div>
              <div className="text-sm mt-1">Try adjusting your search criteria</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Overstock Analysis Component
const OverstockAnalysis: React.FC<{ 
  data: ProcessedInventoryData; 
  onToggleStar: (id: string) => void; 
  starredItems: Set<string>; 
}> = ({ data, onToggleStar, starredItems }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('stockValue');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Column filter states
  const [columnFilters, setColumnFilters] = useState<{
    velocityCategory: string[];
    trendDirection: string[];
    winning: string[];
  }>({
    velocityCategory: [],
    trendDirection: [],
    winning: []
  });
  
  // Filter dropdown search states
  const [filterDropdownSearch, setFilterDropdownSearch] = useState<{
    velocityCategory: string;
    trendDirection: string;
    winning: string;
  }>({
    velocityCategory: '',
    trendDirection: '',
    winning: ''
  });

  // Filter overstock items
  const overstockItems = useMemo(() => {
    return data.overstockItems
      .filter(item => {
        const matchesSearch = 
          item.stockcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase());

        // Apply column filters
        const matchesVelocityFilter = columnFilters.velocityCategory.length === 0 || 
          columnFilters.velocityCategory.includes(typeof item.velocityCategory === 'number' ? item.velocityCategory.toString() : 'N/A');

        const matchesTrendFilter = columnFilters.trendDirection.length === 0 || 
          columnFilters.trendDirection.includes(item.trendDirection || 'N/A');

        const matchesWinningFilter = columnFilters.winning.length === 0 || 
          columnFilters.winning.includes(item.AVER ? 'Y' : 'N');

        return matchesSearch && matchesVelocityFilter && matchesTrendFilter && matchesWinningFilter;
      })
      .sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (sortField) {
          case 'stockValue':
            aValue = a.stockValue; bValue = b.stockValue; break;
          case 'averageCost':
            aValue = a.avg_cost || 0; bValue = b.avg_cost || 0; break;
          case 'monthsOfStock':
            aValue = a.monthsOfStock; bValue = b.monthsOfStock; break;
          case 'velocityCategory':
            aValue = typeof a.velocityCategory === 'number' ? a.velocityCategory : 999;
            bValue = typeof b.velocityCategory === 'number' ? b.velocityCategory : 999;
            break;
          case 'currentStock':
            aValue = a.currentStock; bValue = b.currentStock; break;
          case 'onOrder':
            aValue = a.quantity_on_order || 0; bValue = b.quantity_on_order || 0; break;
          case 'nbp':
            aValue = a.nextBuyingPrice || a.nbp || a.next_cost || a.min_cost || a.last_po_cost || 0;
            bValue = b.nextBuyingPrice || b.nbp || b.next_cost || b.min_cost || b.last_po_cost || 0;
            break;
          case 'winning':
            const aLowestComp = a.bestCompetitorPrice || a.lowestMarketPrice || a.Nupharm || a.AAH2 || a.LEXON2;
            const bLowestComp = b.bestCompetitorPrice || b.lowestMarketPrice || b.Nupharm || b.AAH2 || b.LEXON2;
            aValue = (a.AVER && aLowestComp && a.AVER < aLowestComp) ? 1 : 0;
            bValue = (b.AVER && bLowestComp && b.AVER < bLowestComp) ? 1 : 0;
            break;
          case 'lowestComp':
            aValue = a.bestCompetitorPrice || a.lowestMarketPrice || a.Nupharm || a.AAH2 || a.LEXON2 || 0;
            bValue = b.bestCompetitorPrice || b.lowestMarketPrice || b.Nupharm || b.AAH2 || b.LEXON2 || 0;
            break;
          case 'price':
            aValue = a.AVER || 0; bValue = b.AVER || 0; break;
          case 'sdt':
            aValue = a.SDT || 0; bValue = b.SDT || 0; break;
          case 'edt':
            aValue = a.EDT || 0; bValue = b.EDT || 0; break;
          default:
            aValue = a.stockcode; bValue = b.stockcode;
        }
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      });
  }, [data.overstockItems, searchTerm, sortField, sortDirection, columnFilters]);

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(value);
  };

  const getCategoryColor = (category: number | 'N/A') => {
    if (typeof category !== 'number') return 'text-gray-400';
    if (category <= 2) return 'text-green-400';
    if (category <= 4) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'UP': return 'text-green-400';
      case 'DOWN': return 'text-red-400';
      case 'STABLE': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  // Helper function to capitalize first letter
  const capitalizeFirst = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  // Column filter functions
  const handleColumnFilterChange = (column: keyof typeof columnFilters, values: string[]) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: values
    }));
  };

  const handleFilterDropdownSearchChange = (column: keyof typeof filterDropdownSearch, value: string) => {
    setFilterDropdownSearch(prev => ({
      ...prev,
      [column]: value
    }));
  };

  // Get unique values for column filters
  const getUniqueVelocityCategories = () => {
    const categories = [...new Set(data.overstockItems
      .map(item => typeof item.velocityCategory === 'number' ? item.velocityCategory.toString() : 'N/A')
    )];
    return categories.sort((a, b) => {
      if (a === 'N/A') return 1;
      if (b === 'N/A') return -1;
      return parseInt(a) - parseInt(b);
    });
  };

  const getUniqueTrendDirections = () => {
    const trends = [...new Set(data.overstockItems.map(item => item.trendDirection || 'N/A'))];
    return trends.sort();
  };

  const getUniqueWinningValues = () => {
    return ['Y', 'N'];
  };

  // Render column header with optional filter
  const renderColumnHeader = (
    title: string,
    sortKey: string,
    filterColumn?: keyof typeof columnFilters,
    filterOptions?: string[],
    alignment: 'left' | 'center' | 'right' = 'left'
  ) => {
    const hasActiveFilter = filterColumn && columnFilters[filterColumn].length > 0;
    const alignmentClass = alignment === 'center' ? 'text-center' : alignment === 'right' ? 'text-right' : 'text-left';
    const justifyClass = alignment === 'center' ? 'justify-center' : alignment === 'right' ? 'justify-end' : 'justify-start';
    
    return (
      <th className={`${alignmentClass} p-3 text-gray-300 relative`}>
        <div className={`flex items-center gap-2 ${justifyClass}`}>
          <button
            onClick={() => handleSort(sortKey)}
            className="hover:text-white cursor-pointer flex items-center gap-1"
          >
            {title}
            {sortField === sortKey && (
              <span className="text-xs">
                {sortDirection === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </button>
          
          {filterColumn && filterOptions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={`p-1 rounded hover:bg-gray-700 ${hasActiveFilter ? 'text-blue-400' : 'text-gray-400'}`}>
                  <Filter className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-gray-800 border-gray-700">
                <div className="p-2">
                  <Input
                    placeholder="Search..."
                    value={filterDropdownSearch[filterColumn]}
                    onChange={(e) => handleFilterDropdownSearchChange(filterColumn, e.target.value)}
                    className="h-8 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <DropdownMenuSeparator className="bg-gray-700" />
                <div className="p-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={columnFilters[filterColumn].length === 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleColumnFilterChange(filterColumn, []);
                        }
                      }}
                      className="rounded border-gray-600 bg-gray-700"
                    />
                    <span className="text-sm text-white">Select All</span>
                  </label>
                </div>
                <DropdownMenuSeparator className="bg-gray-700" />
                <div className="max-h-48 overflow-y-auto">
                  {filterOptions
                    .filter(option => 
                      filterDropdownSearch[filterColumn] === '' ||
                      option.toLowerCase().includes(filterDropdownSearch[filterColumn].toLowerCase())
                    )
                    .map((option) => (
                      <div key={option} className="p-2">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={columnFilters[filterColumn].includes(option)}
                            onChange={(e) => {
                              const currentFilters = columnFilters[filterColumn];
                              if (e.target.checked) {
                                handleColumnFilterChange(filterColumn, [...currentFilters, option]);
                              } else {
                                handleColumnFilterChange(filterColumn, currentFilters.filter(f => f !== option));
                              }
                            }}
                            className="rounded border-gray-600 bg-gray-700"
                          />
                          <span className="text-sm text-white">{option === 'N/A' ? option : capitalizeFirst(option)}</span>
                        </label>
                      </div>
                    ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </th>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Overstock Analysis</h3>
        <div className="text-sm text-gray-400">
          {overstockItems.length} overstock items
        </div>
      </div>

      {/* Search */}
      <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
        <CardContent className="p-4">
          <Input
            placeholder="Search by stock code or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-800 border-gray-700 text-white"
          />
        </CardContent>
      </Card>

      {/* Data Table with Sticky Headers */}
      <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
        <CardContent className="p-0">
          <div className="max-h-[600px] overflow-y-auto">
            <table className="w-full min-w-[1400px]">
              <thead className="bg-gray-900/90 sticky top-0 z-10">
                <tr className="border-b border-gray-700">
                  <th className="text-left p-3 text-gray-300 cursor-pointer hover:text-white sticky left-0 bg-gray-900/95 backdrop-blur-sm border-r border-gray-700 z-20 min-w-[200px] text-sm" onClick={() => handleSort('stockcode')}>
                    Item {sortField === 'stockcode' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('stockValue')}>
                    Stock Value {sortField === 'stockValue' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('averageCost')}>
                    Avg Cost {sortField === 'averageCost' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('currentStock')}>
                    Stock Qty {sortField === 'currentStock' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('onOrder')}>
                    On Order {sortField === 'onOrder' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-center p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('monthsOfStock')}>
                    Months {sortField === 'monthsOfStock' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  {renderColumnHeader('Velocity', 'velocityCategory', 'velocityCategory', getUniqueVelocityCategories(), 'center')}
                  {renderColumnHeader('Trend', 'trendDirection', 'trendDirection', getUniqueTrendDirections(), 'center')}
                  <th className="text-center p-3 text-gray-300 text-sm">
                    Watch
                  </th>
                  <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('price')}>
                    Price {sortField === 'price' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('nbp')}>
                    NBP {sortField === 'nbp' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  {renderColumnHeader('Winning', 'winning', 'winning', getUniqueWinningValues(), 'center')}
                  <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('lowestComp')}>
                    Lowest Comp {sortField === 'lowestComp' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('sdt')}>
                    SDT {sortField === 'sdt' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('edt')}>
                    EDT {sortField === 'edt' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-center p-3 text-gray-300 text-sm">
                    Star
                  </th>
                </tr>
              </thead>
              <tbody>
                {overstockItems.map((item) => (
                  <tr key={item.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                    <td className="p-3 sticky left-0 bg-gray-950/95 backdrop-blur-sm border-r border-gray-700 min-w-[200px] text-sm">
                      <div>
                        <div className="font-medium text-white">{item.stockcode}</div>
                        <div className="text-sm text-gray-400 truncate max-w-xs">{item.description}</div>
                      </div>
                    </td>
                    <td className="p-3 text-right text-white font-semibold text-sm">
                      {formatCurrency(item.stockValue)}
                    </td>
                    <td className="p-3 text-right text-gray-300 text-sm">
                      {shouldShowAverageCostTooltip(item) ? (
                        <TooltipProvider>
                          <UITooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help underline decoration-dotted">
                                {getDisplayedAverageCost(item) ? formatCurrency(getDisplayedAverageCost(item)!) : 'N/A'}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="bg-gray-800 border-gray-700 text-white">
                              <div className="text-sm">{getAverageCostTooltip(item)}</div>
                            </TooltipContent>
                          </UITooltip>
                        </TooltipProvider>
                      ) : (
                        getDisplayedAverageCost(item) ? formatCurrency(getDisplayedAverageCost(item)!) : 'N/A'
                      )}
                    </td>
                    <td className="p-3 text-right text-gray-300 text-sm">
                      {(item.currentStock || 0).toLocaleString()}
                    </td>
                    <td className="p-3 text-right text-gray-300 text-sm">
                      {(item.quantity_on_order || 0).toLocaleString()}
                    </td>
                    <td className="p-3 text-center text-sm">
                      <TooltipProvider>
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help text-red-400 font-semibold">
                              {item.monthsOfStock === 999.9 ? '∞' : item.monthsOfStock ? item.monthsOfStock.toFixed(1) : 'N/A'}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="bg-gray-800 border-gray-700 text-white">
                            <div className="text-sm">{item.averageUsage || item.packs_sold_avg_last_six_months ? (item.averageUsage || item.packs_sold_avg_last_six_months).toFixed(0) : 'No'} packs/month</div>
                          </TooltipContent>
                        </UITooltip>
                      </TooltipProvider>
                    </td>
                    <td className={`p-3 text-center font-semibold ${getCategoryColor(item.velocityCategory)}`}>
                      {typeof item.velocityCategory === 'number' ? item.velocityCategory : 'N/A'}
                    </td>
                    <td className={`p-3 text-center font-semibold ${getTrendColor(item.trendDirection)}`}>
                      {item.trendDirection === 'UP' ? '↑' : 
                       item.trendDirection === 'DOWN' ? '↓' : 
                       item.trendDirection === 'STABLE' ? '−' : '?'}
                    </td>
                    <td className="p-3 text-center text-sm">
                      <span className={item.watchlist === '⚠️' ? 'text-orange-400' : 'text-gray-600'}>
                        {item.watchlist || '−'}
                      </span>
                    </td>
                    <td className="p-3 text-right text-purple-400 font-semibold text-sm">
                      {item.AVER ? formatCurrency(item.AVER) : 'N/A'}
                    </td>
                    <td className="p-3 text-right text-green-400 font-semibold text-sm">
                      <TooltipProvider>
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help underline decoration-dotted">
                              {item.min_cost && item.min_cost > 0 ? formatCurrency(item.min_cost) : 'OOS'}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="bg-gray-800 border-gray-700 text-white">
                            <div className="space-y-1">
                              <div className="text-sm">Next Cost: {item.next_cost && item.next_cost > 0 ? formatCurrency(item.next_cost) : 'N/A'}</div>
                              <div className="text-sm">Min Cost: {item.min_cost && item.min_cost > 0 ? formatCurrency(item.min_cost) : 'N/A'}</div>
                              <div className="text-sm">Last PO Cost: {item.last_po_cost && item.last_po_cost > 0 ? formatCurrency(item.last_po_cost) : 'N/A'}</div>
                            </div>
                          </TooltipContent>
                        </UITooltip>
                      </TooltipProvider>
                    </td>
                    <td className="p-3 text-center font-semibold text-sm">
                      {(() => {
                        const lowestComp = item.bestCompetitorPrice || item.lowestMarketPrice || item.Nupharm || item.AAH2 || item.LEXON2;
                        const isWinning = item.AVER && lowestComp && item.AVER < lowestComp;
                        return (
                          <span className={isWinning ? 'text-green-400' : 'text-red-400'}>
                            {isWinning ? 'Y' : 'N'}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="p-3 text-right text-blue-400 font-semibold text-sm">
                      <TooltipProvider>
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help underline decoration-dotted">
                              {item.bestCompetitorPrice ? formatCurrency(item.bestCompetitorPrice) : 
                               (item.lowestMarketPrice ? formatCurrency(item.lowestMarketPrice) : 
                                (item.Nupharm ? formatCurrency(item.Nupharm) : 
                                 (item.AAH2 ? formatCurrency(item.AAH2) : 
                                  (item.LEXON2 ? formatCurrency(item.LEXON2) : 'N/A'))))}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="bg-gray-800 border-gray-700 text-white max-w-xs">
                            <div className="space-y-1">
                              {[
                                { name: 'Nupharm', price: item.Nupharm },
                                { name: 'AAH2', price: item.AAH2 },
                                { name: 'ETH_LIST', price: item.ETH_LIST },
                                { name: 'ETH_NET', price: item.ETH_NET },
                                { name: 'LEXON2', price: item.LEXON2 }
                              ].filter(comp => comp.price && comp.price > 0)
                               .sort((a, b) => a.price - b.price)
                               .map((comp, idx) => (
                                <div key={idx} className="text-sm">{comp.name}: {formatCurrency(comp.price)}</div>
                              ))}
                              {![item.Nupharm, item.AAH2, item.ETH_LIST, item.ETH_NET, item.LEXON2].some(price => price && price > 0) && (
                                <div className="text-sm">No competitor pricing available</div>
                              )}
                            </div>
                          </TooltipContent>
                        </UITooltip>
                      </TooltipProvider>
                    </td>
                    <td className="p-3 text-right text-gray-300 text-sm">
                      {item.SDT ? formatCurrency(item.SDT) : '-'}
                    </td>
                    <td className="p-3 text-right text-gray-300 text-sm">
                      {item.EDT ? formatCurrency(item.EDT) : '-'}
                    </td>
                    <td className="p-3 text-center text-sm">
                      <button
                        onClick={() => onToggleStar(item.id)}
                        className={`p-1 rounded hover:bg-gray-700 ${
                          starredItems.has(item.id) ? 'text-yellow-400' : 'text-gray-600'
                        }`}
                      >
                        <Star className="h-4 w-4" fill={starredItems.has(item.id) ? 'currentColor' : 'none'} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {overstockItems.length === 0 && (
            <div className="p-8 text-center text-gray-400">
              <div className="text-lg font-medium">No overstock items found</div>
              <div className="text-sm mt-1">Try adjusting your search criteria</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Now define InventoryAnalyticsContent after all the analysis components
const InventoryAnalyticsContent: React.FC = () => {
  const [inventoryData, setInventoryData] = useState<ProcessedInventoryData | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [starredItems, setStarredItems] = useState<Set<string>>(new Set());
  // Add state for active metric filter
  const [activeMetricFilter, setActiveMetricFilter] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.csv')) {
      toast({
        title: "Invalid file format",
        description: "Please upload an Excel (.xlsx) or CSV file.",
        variant: "destructive"
      });
      return;
    }

    setErrorMessage(null);
    try {
      setIsUploading(true);
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + Math.random() * 15;
          return newProgress >= 95 ? 95 : newProgress;
        });
      }, 200);

      // Process the file
      const processedData = await processInventoryExcelFile(file);
      
      // Store in localStorage for persistence (with error handling for quota exceeded)
      try {
        localStorage.setItem('inventoryAnalysisData', JSON.stringify(processedData));
      } catch (error) {
        console.warn('Failed to store data in localStorage (quota exceeded):', error);
        // Clear any existing data and try storing just essential summary
        localStorage.removeItem('inventoryAnalysisData');
        try {
          const essentialData = {
            fileName: processedData.fileName,
            totalProducts: processedData.totalProducts,
            summaryStats: processedData.summaryStats,
            // Full data for complete analysis
            analyzedItems: processedData.analyzedItems,
            overstockItems: processedData.overstockItems,
            priorityIssues: processedData.priorityIssues,
            velocityBreakdown: processedData.velocityBreakdown,
            trendBreakdown: processedData.trendBreakdown,
            strategyBreakdown: processedData.strategyBreakdown
          };
          localStorage.setItem('inventoryAnalysisData', JSON.stringify(essentialData));
        } catch (secondError) {
          console.warn('Failed to store even essential data, proceeding without persistence');
        }
      }
      setInventoryData(processedData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      toast({
        title: "File processed successfully",
        description: `Analyzed ${processedData.totalProducts} products with ${processedData.priorityIssues.length} priority issues identified.`
      });

      // Show additional message if localStorage storage was limited
      const savedData = localStorage.getItem('inventoryAnalysisData');
      if (savedData) {
        const parsedSavedData = JSON.parse(savedData);
        if (parsedSavedData.analyzedItems?.length < processedData.analyzedItems.length) {
          toast({
            title: "Large dataset detected",
            description: "Data persistence limited due to browser storage constraints. All analysis features remain fully functional.",
            variant: "default"
          });
        }
      }

      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
      
    } catch (error) {
      console.error('Error processing file:', error);
      
      const errorMsg = error instanceof Error ? error.message : "Unknown error occurred";
      setErrorMessage(errorMsg);
      
      toast({
        title: "Error processing file",
        description: errorMsg,
        variant: "destructive"
      });
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [toast]);

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Handle click upload
  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  };

  // Handle export
  const handleExport = () => {
    if (inventoryData) {
      exportInventoryAnalysisToExcel(inventoryData);
      toast({
        title: "Export successful",
        description: "Inventory analysis exported to Excel file."
      });
    }
  };

  // Handle new upload (clear existing data)
  const handleNewUpload = () => {
    localStorage.removeItem('inventoryAnalysisData');
    setInventoryData(null);
    setSelectedTab('overview');
    setStarredItems(new Set());
  };

  // Toggle star for item
  const handleToggleStar = (itemId: string) => {
    setStarredItems(prev => {
      const newStarred = new Set(prev);
      if (newStarred.has(itemId)) {
        newStarred.delete(itemId);
      } else {
        newStarred.add(itemId);
      }
      return newStarred;
    });
  };

  // Handle metric card clicks for strategic insights
  const handleMetricCardClick = (metricType: string) => {
    setActiveMetricFilter(metricType);
    setSelectedTab('overview'); // Switch to overview tab to show filtered results
  };

  // Load data from localStorage on component mount
  React.useEffect(() => {
    const savedData = localStorage.getItem('inventoryAnalysisData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        // Add missing arrays if they don't exist (for backward compatibility)
        if (!parsedData.overstockItems) {
          parsedData.overstockItems = parsedData.analyzedItems?.filter((item: any) => item.isOverstocked) || [];
        }
        if (!parsedData.rawData) {
          parsedData.rawData = [];
        }
        
        // Add missing strategic metrics if they don't exist (for backward compatibility)
        if (parsedData.summaryStats && !parsedData.summaryStats.hasOwnProperty('outOfStockItems')) {
          parsedData.summaryStats.outOfStockItems = 0;
          parsedData.summaryStats.outOfStockFastMovers = 0;
          parsedData.summaryStats.marginOpportunityItems = 0;
          parsedData.summaryStats.marginOpportunityValue = 0;
          parsedData.summaryStats.costDisadvantageItems = 0;
          parsedData.summaryStats.costDisadvantageValue = 0;
          parsedData.summaryStats.stockRiskItems = 0;
          parsedData.summaryStats.stockRiskValue = 0;
        }
        
        setInventoryData(parsedData);
      } catch (error) {
        console.error('Error loading saved data:', error);
        localStorage.removeItem('inventoryAnalysisData');
      }
    }
  }, []);

  // If no data, show upload interface
  if (!inventoryData) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">Pharmaceutical Inventory Analysis</h1>
          <p className="text-gray-400">Upload your inventory file to begin comprehensive analysis</p>
        </div>

        <div 
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleClickUpload}
          className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-all mt-4
            ${isUploading ? "pointer-events-none" : "border-gray-700 hover:border-primary/50"}`}
        >
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden"
            accept=".xlsx,.csv"
            onChange={handleFileInputChange}
          />

          <div className="flex flex-col items-center justify-center space-y-4">
            <UploadCloud className="h-12 w-12 text-gray-400" />
            <div className="space-y-1">
              <h3 className="text-lg font-medium">Upload Pharmaceutical Inventory Sheet</h3>
              <p className="text-sm text-muted-foreground">
                Drag and drop your Excel or CSV file, or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Required columns: stockcode, description, quantity_available, packs_sold_avg_last_six_months, avg_cost
              </p>
              <p className="text-xs text-muted-foreground">
                Optional: next_cost, min_cost, last_po_cost, competitor prices (Nupharm, AAH2, ETH_LIST, ETH_NET, LEXON2, AVER), tariffs (SDT, EDT)
              </p>
            </div>
          </div>

          {isUploading && (
            <div className="mt-6 w-full max-w-md mx-auto">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-sm mt-2 text-muted-foreground">
                Processing file... {Math.round(uploadProgress)}%
              </p>
            </div>
          )}
        </div>
        
        {errorMessage && (
          <Alert variant="destructive" className="mt-4">
            <div className="flex items-start">
              <Info className="h-4 w-4 mr-2 mt-0.5" />
              <div>
                <AlertTitle>Error processing file</AlertTitle>
                <AlertDescription className="mt-1">{errorMessage}</AlertDescription>
                <AlertDescription className="mt-2">
                  <p className="font-medium">Expected file structure:</p>
                  <ul className="list-disc pl-5 mt-1 text-sm space-y-1">
                    <li>Excel file with 'maintenance' sheet (or first sheet used)</li>
                    <li>Required: stockcode, description, quantity_available, packs_sold_avg_last_six_months, avg_cost</li>
                    <li>Optional: quantity_ringfenced, quantity_on_order, next_cost, competitor prices, tariffs (SDT, EDT)</li>
                  </ul>
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}
      </div>
    );
  }

  // Main analytics dashboard with data
  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header with actions */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Inventory Analysis Results</h1>
          <p className="text-gray-400">{inventoryData.fileName} • {inventoryData.totalProducts.toLocaleString()} products analyzed</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Excel
          </Button>
          <Button onClick={handleNewUpload} className="flex items-center gap-2">
            <UploadCloud className="h-4 w-4" />
            New Upload
          </Button>
        </div>
      </div>

      {/* Summary Metrics - Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <MetricCard 
          title="Total Products"
          value={inventoryData.summaryStats.totalProducts.toLocaleString()}
          subtitle={`${inventoryData.summaryStats.totalOverstockItems} overstocked`}
          icon={<Package className="h-5 w-5" />}
          iconPosition="right"
          flippable={true}
        />
        
        <MetricCard 
          title="Stock Value"
          value={formatCurrency(inventoryData.summaryStats.totalStockValue)}
          subtitle="Physical inventory"
          icon={<DollarSign className="h-5 w-5" />}
          iconPosition="right"
          flippable={true}
        />
        
        <MetricCard 
          title="On Order Value"
          value={formatCurrency(inventoryData.summaryStats.totalOnOrderValue)}
          subtitle="Future commitments"
          icon={<TrendingUp className="h-5 w-5" />}
          iconPosition="right"
          flippable={true}
        />
        
        <MetricCard 
          title="Overstock Value"
          value={formatCurrency(inventoryData.summaryStats.totalOverstockStockValue)}
          subtitle={`${inventoryData.summaryStats.overstockPercentage.toFixed(1)}% of total`}
          icon={<AlertTriangle className="h-5 w-5" />}
          iconPosition="right"
          change={{
            value: `${inventoryData.summaryStats.overstockPercentage.toFixed(1)}%`,
            type: inventoryData.summaryStats.overstockPercentage > 20 ? 'decrease' : 'neutral'
          }}
          flippable={true}
        />
      </div>

      {/* Summary Metrics - Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div onClick={() => handleMetricCardClick('out-of-stock')} className="cursor-pointer">
          <MetricCard 
            title="Out of Stock"
            value={(inventoryData.summaryStats.outOfStockItems || 0).toLocaleString()}
            subtitle={`${inventoryData.summaryStats.outOfStockFastMovers || 0} fast movers`}
            icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
            iconPosition="right"
            flippable={false}
            change={{
              value: (inventoryData.summaryStats.outOfStockFastMovers || 0) > 0 ? 'Critical' : 'OK',
              type: (inventoryData.summaryStats.outOfStockFastMovers || 0) > 0 ? 'decrease' : 'increase'
            }}
          />
        </div>
        
        <div onClick={() => handleMetricCardClick('margin-opportunity')} className="cursor-pointer">
          <MetricCard 
            title="Margin Opportunities"
            value={(inventoryData.summaryStats.marginOpportunityItems || 0).toLocaleString()}
            subtitle={`${formatCurrency(inventoryData.summaryStats.marginOpportunityValue || 0)} potential`}
            icon={<TrendingUp className="h-5 w-5 text-green-500" />}
            iconPosition="right"
            flippable={false}
            change={{
              value: (inventoryData.summaryStats.marginOpportunityValue || 0) > 0 ? 'Revenue+' : 'None',
              type: (inventoryData.summaryStats.marginOpportunityValue || 0) > 0 ? 'increase' : 'neutral'
            }}
          />
        </div>
        
        <div onClick={() => handleMetricCardClick('cost-disadvantage')} className="cursor-pointer">
          <MetricCard 
            title="Cost Disadvantage"
            value={(inventoryData.summaryStats.costDisadvantageItems || 0).toLocaleString()}
            subtitle={`${formatCurrency(inventoryData.summaryStats.costDisadvantageValue || 0)} at risk`}
            icon={<AlertTriangle className="h-5 w-5 text-orange-500" />}
            iconPosition="right"
            flippable={false}
            change={{
              value: (inventoryData.summaryStats.costDisadvantageValue || 0) > 0 ? 'Risk' : 'OK',
              type: (inventoryData.summaryStats.costDisadvantageValue || 0) > 0 ? 'decrease' : 'increase'
            }}
          />
        </div>
        
        <div onClick={() => handleMetricCardClick('stock-risk')} className="cursor-pointer">
          <MetricCard 
            title="Stock Risk"
            value={(inventoryData.summaryStats.stockRiskItems || 0).toLocaleString()}
            subtitle={`${formatCurrency(inventoryData.summaryStats.stockRiskValue || 0)} <2wks supply`}
            icon={<Clock className="h-5 w-5 text-yellow-500" />}
            iconPosition="right"
            flippable={false}
            change={{
              value: (inventoryData.summaryStats.stockRiskItems || 0) > 0 ? 'Action Needed' : 'OK',
              type: (inventoryData.summaryStats.stockRiskItems || 0) > 0 ? 'decrease' : 'increase'
            }}
          />
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mt-8">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="overview" className="flex gap-2">
            Overview
          </TabsTrigger>
          <TabsTrigger value="all" className="flex gap-2">
            All Items
            <Badge variant="secondary" className="bg-blue-500 text-white rounded-full">
              {inventoryData.totalProducts.toLocaleString()}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="overstock" className="flex gap-2">
            Overstock
            <Badge variant="secondary" className="bg-amber-500 text-white rounded-full">
              {inventoryData.summaryStats.totalOverstockItems}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="priority" className="flex gap-2">
            Priority Issues
            <Badge variant="secondary" className="bg-red-500 text-white rounded-full">
              {inventoryData.priorityIssues.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="watchlist" className="flex gap-2">
            Watchlist
            <Badge variant="secondary" className="bg-orange-500 text-white rounded-full">
              {inventoryData.summaryStats.watchlistCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="starred" className="flex gap-2">
            <Star className="h-4 w-4" />
            Starred
            <Badge variant="secondary" className="bg-yellow-500 text-white rounded-full">
              {starredItems.size}
            </Badge>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <InventoryOverview 
            data={inventoryData} 
            activeMetricFilter={activeMetricFilter}
            onToggleStar={handleToggleStar}
            starredItems={starredItems}
            onClearFilter={() => setActiveMetricFilter(null)}
          />
        </TabsContent>
        
        <TabsContent value="all" className="space-y-6">
          <AllItemsAnalysis 
            data={inventoryData} 
            onToggleStar={handleToggleStar} 
            starredItems={starredItems} 
          />
        </TabsContent>
        
        <TabsContent value="overstock" className="space-y-6">
          <OverstockAnalysis 
            data={inventoryData} 
            onToggleStar={handleToggleStar} 
            starredItems={starredItems} 
          />
        </TabsContent>
        
        <TabsContent value="priority" className="space-y-6">
          <PriorityIssuesAnalysis 
            data={inventoryData} 
            onToggleStar={handleToggleStar} 
            starredItems={starredItems} 
          />
        </TabsContent>
        
        <TabsContent value="watchlist" className="space-y-6">
          <WatchlistAnalysis 
            data={inventoryData} 
            onToggleStar={handleToggleStar} 
            starredItems={starredItems} 
          />
        </TabsContent>
        
        <TabsContent value="starred" className="space-y-6">
          <StarredItemsAnalysis 
            data={inventoryData} 
            onToggleStar={handleToggleStar} 
            starredItems={starredItems} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Overview component with charts and breakdowns
const InventoryOverview: React.FC<{ 
  data: ProcessedInventoryData; 
  activeMetricFilter: string | null;
  onToggleStar: (id: string) => void; 
  starredItems: Set<string>; 
  onClearFilter: () => void; 
}> = ({ data, activeMetricFilter, onToggleStar, starredItems, onClearFilter }) => {
  const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16'];

  // If a metric filter is active, show filtered data table
  if (activeMetricFilter) {
    return <MetricFilteredView 
      data={data} 
      filterType={activeMetricFilter}
      onToggleStar={onToggleStar}
      starredItems={starredItems}
      onClearFilter={onClearFilter}
    />;
  }

  // Default static overview with charts
  return (
    <div className="space-y-6">
      {/* Velocity Distribution Chart */}
      <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Velocity Category Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.velocityBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="category" 
                stroke="#9CA3AF"
                tickFormatter={(value) => `Cat ${value}`}
              />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
                formatter={(value, name) => [
                  name === 'itemCount' ? `${value} items` : formatCurrency(value as number),
                  name === 'itemCount' ? 'Items' : 'Stock Value'
                ]}
              />
              <Bar dataKey="itemCount" fill="#10B981" name="itemCount" />
              <Bar dataKey="stockValue" fill="#F59E0B" name="stockValue" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Distribution */}
        <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Price Trend Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.trendBreakdown}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="itemCount"
                  nameKey="direction"
                >
                  {data.trendBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} items`, 'Count']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Strategy Distribution */}
        <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Pricing Strategy Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.strategyBreakdown}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="stockValue"
                  nameKey="strategy"
                >
                  {data.strategyBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [formatCurrency(value as number), 'Stock Value']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// New component to show filtered data when a metric card is clicked
const MetricFilteredView: React.FC<{
  data: ProcessedInventoryData;
  filterType: string;
  onToggleStar: (id: string) => void;
  starredItems: Set<string>;
  onClearFilter: () => void;
}> = ({ data, filterType, onToggleStar, starredItems, onClearFilter }) => {
  const [sortField, setSortField] = useState<string>('stockValue');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Column filter states
  const [columnFilters, setColumnFilters] = useState<{
    velocityCategory: string[];
    trendDirection: string[];
    winning: string[];
  }>({
    velocityCategory: [],
    trendDirection: [],
    winning: []
  });
  
  // Filter dropdown search states
  const [filterDropdownSearch, setFilterDropdownSearch] = useState<{
    velocityCategory: string;
    trendDirection: string;
    winning: string;
  }>({
    velocityCategory: '',
    trendDirection: '',
    winning: ''
  });

  // Get filtered items based on metric type
  const filteredItems = useMemo(() => {
    let filtered = data.analyzedItems.filter(item => {
      const matchesSearch = searchTerm === '' || 
        item.stockcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesFilter = false;
      switch (filterType) {
        case 'out-of-stock':
          matchesFilter = (item.quantity_available || 0) === 0 && (item.quantity_ringfenced || 0) === 0 && (item.quantity_on_order || 0) === 0;
          break;
        case 'margin-opportunity':
          matchesFilter = item.lowestMarketPrice && item.avg_cost < (item.lowestMarketPrice * 0.9);
          break;
        case 'cost-disadvantage':
          if (!item.lowestMarketPrice) {
            matchesFilter = false;
            break;
          }
          const competitors = ['Nupharm', 'AAH2', 'ETH_LIST', 'ETH_NET', 'LEXON2'];
          const prices: number[] = [];
          competitors.forEach(competitor => {
            const price = item[competitor as keyof typeof item] as number;
            if (price && price > 0) {
              prices.push(price);
            }
          });
          if (prices.length === 0) {
            matchesFilter = false;
            break;
          }
          const highestPrice = Math.max(...prices);
          matchesFilter = item.avg_cost > (highestPrice * 1.05);
          break;
        case 'stock-risk':
          matchesFilter = item.packs_sold_avg_last_six_months > 0 && 
                         (item.currentStock / item.packs_sold_avg_last_six_months) < 0.5;
          break;
        default:
          matchesFilter = true;
      }

      // Apply column filters
      const matchesVelocityFilter = columnFilters.velocityCategory.length === 0 || 
        columnFilters.velocityCategory.includes(typeof item.velocityCategory === 'number' ? item.velocityCategory.toString() : 'N/A');
      
      const matchesTrendFilter = columnFilters.trendDirection.length === 0 || 
        columnFilters.trendDirection.includes(item.trendDirection || 'N/A');

      const matchesWinningFilter = columnFilters.winning.length === 0 || 
        columnFilters.winning.includes(item.AVER ? 'Y' : 'N');

      return matchesSearch && matchesFilter && matchesVelocityFilter && matchesTrendFilter && matchesWinningFilter;
    });

    // Sort items
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'item':
        case 'stockcode':
          aValue = a.stockcode;
          bValue = b.stockcode;
          break;
        case 'stockValue':
          aValue = a.stockValue;
          bValue = b.stockValue;
          break;
        case 'averageCost':
          aValue = a.avg_cost || 0;
          bValue = b.avg_cost || 0;
          break;
        case 'currentStock':
          aValue = a.currentStock || 0;
          bValue = b.currentStock || 0;
          break;
        case 'onOrder':
          aValue = a.quantity_on_order || 0;
          bValue = b.quantity_on_order || 0;
          break;
        case 'monthsOfStock':
          aValue = a.monthsOfStock || 0;
          bValue = b.monthsOfStock || 0;
          break;
        case 'velocityCategory':
          aValue = typeof a.velocityCategory === 'number' ? a.velocityCategory : 99;
          bValue = typeof b.velocityCategory === 'number' ? b.velocityCategory : 99;
          break;
        case 'trendDirection':
          // Custom sorting for trend: DOWN > STABLE > UP > N/A
          const trendOrder = { 'DOWN': 1, 'STABLE': 2, 'UP': 3, 'N/A': 4 };
          aValue = trendOrder[a.trendDirection as keyof typeof trendOrder] || 4;
          bValue = trendOrder[b.trendDirection as keyof typeof trendOrder] || 4;
          break;
        case 'nbp':
          aValue = a.nextBuyingPrice || a.nbp || a.next_cost || a.min_cost || a.last_po_cost || 0;
          bValue = b.nextBuyingPrice || b.nbp || b.next_cost || b.min_cost || b.last_po_cost || 0;
          break;
        case 'winning':
          const aLowestComp = a.bestCompetitorPrice || a.lowestMarketPrice || a.Nupharm || a.AAH2 || a.LEXON2;
          const bLowestComp = b.bestCompetitorPrice || b.lowestMarketPrice || b.Nupharm || b.AAH2 || b.LEXON2;
          aValue = (a.AVER && aLowestComp && a.AVER < aLowestComp) ? 1 : 0;
          bValue = (b.AVER && bLowestComp && b.AVER < bLowestComp) ? 1 : 0;
          break;
        case 'lowestComp':
          aValue = a.bestCompetitorPrice || a.lowestMarketPrice || a.Nupharm || a.AAH2 || a.LEXON2 || 0;
          bValue = b.bestCompetitorPrice || b.lowestMarketPrice || b.Nupharm || b.AAH2 || b.LEXON2 || 0;
          break;
        case 'price':
          aValue = a.AVER || 0;
          bValue = b.AVER || 0;
          break;
        case 'sdt':
          aValue = a.SDT || 0;
          bValue = b.SDT || 0;
          break;
        case 'edt':
          aValue = a.EDT || 0;
          bValue = b.EDT || 0;
          break;
        default:
          aValue = a.stockValue;
          bValue = b.stockValue;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return filtered;
  }, [data.analyzedItems, filterType, searchTerm, sortField, sortDirection, starredItems, columnFilters]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Column filter functions
  const handleColumnFilterChange = (column: keyof typeof columnFilters, values: string[]) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: values
    }));
  };

  const handleFilterDropdownSearchChange = (column: keyof typeof filterDropdownSearch, value: string) => {
    setFilterDropdownSearch(prev => ({
      ...prev,
      [column]: value
    }));
  };

  // Get unique values for column filters
  const getUniqueVelocityCategories = () => {
    const categories = [...new Set(data.analyzedItems.map(item => 
      typeof item.velocityCategory === 'number' ? item.velocityCategory.toString() : 'N/A'
    ))];
    return categories.sort((a, b) => {
      if (a === 'N/A') return 1;
      if (b === 'N/A') return -1;
      return parseInt(a) - parseInt(b);
    });
  };

  const getUniqueTrendDirections = () => {
    const trends = [...new Set(data.analyzedItems.map(item => item.trendDirection || 'N/A'))];
    return trends.sort((a, b) => {
      const order = { 'DOWN': 1, 'STABLE': 2, 'UP': 3, 'N/A': 4 };
      return (order[a as keyof typeof order] || 4) - (order[b as keyof typeof order] || 4);
    });
  };

  const getUniqueWinningValues = () => {
    return ['Y', 'N'];
  };

  // Render column header with optional filter
  const renderColumnHeader = (
    title: string,
    sortKey: string,
    filterColumn?: keyof typeof columnFilters,
    filterOptions?: string[]
  ) => {
    const hasActiveFilter = filterColumn && columnFilters[filterColumn].length > 0;
    
    return (
      <th className="text-center p-3 text-gray-300 relative">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => handleSort(sortKey)}
            className="hover:text-white cursor-pointer flex items-center gap-1"
          >
            {title}
            {sortField === sortKey && (
              <span className="text-xs">
                {sortDirection === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </button>
          
          {filterColumn && filterOptions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={`p-1 rounded hover:bg-gray-700 ${hasActiveFilter ? 'text-blue-400' : 'text-gray-400'}`}>
                  <Filter className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-gray-800 border-gray-700">
                <div className="p-2">
                  <Input
                    placeholder="Search..."
                    value={filterDropdownSearch[filterColumn]}
                    onChange={(e) => handleFilterDropdownSearchChange(filterColumn, e.target.value)}
                    className="h-8 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <DropdownMenuSeparator className="bg-gray-700" />
                <div className="p-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={columnFilters[filterColumn].length === 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleColumnFilterChange(filterColumn, []);
                        }
                      }}
                      className="rounded border-gray-600 bg-gray-700"
                    />
                    <span className="text-sm text-white">Select All</span>
                  </label>
                </div>
                <DropdownMenuSeparator className="bg-gray-700" />
                <div className="max-h-48 overflow-y-auto">
                  {filterOptions
                    .filter(option => 
                      filterDropdownSearch[filterColumn] === '' ||
                      option.toLowerCase().includes(filterDropdownSearch[filterColumn].toLowerCase())
                    )
                    .map((option) => (
                      <div key={option} className="p-2">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={columnFilters[filterColumn].includes(option)}
                            onChange={(e) => {
                              const currentFilters = columnFilters[filterColumn];
                              if (e.target.checked) {
                                handleColumnFilterChange(filterColumn, [...currentFilters, option]);
                              } else {
                                handleColumnFilterChange(filterColumn, currentFilters.filter(f => f !== option));
                              }
                            }}
                            className="rounded border-gray-600 bg-gray-700"
                          />
                          <span className="text-sm text-white">{option}</span>
                        </label>
                      </div>
                    ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </th>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'UP': return 'text-green-400';
      case 'DOWN': return 'text-red-400';
      case 'STABLE': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getCategoryColor = (category: number | 'N/A') => {
    if (category === 'N/A') return 'text-gray-400';
    if (category <= 2) return 'text-green-400';
    if (category <= 4) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getFilterTitle = () => {
    switch (filterType) {
      case 'out-of-stock': return 'Out of Stock Items';
      case 'margin-opportunity': return 'Margin Opportunity Items';
      case 'cost-disadvantage': return 'Cost Disadvantage Items';
      case 'stock-risk': return 'Stock Risk Items';
      default: return 'Filtered Items';
    }
  };

  const getFilterDescription = () => {
    switch (filterType) {
      case 'out-of-stock': return 'Items with 0 available, 0 ringfenced, and 0 on order';
      case 'margin-opportunity': return 'Items where our cost is >10% below lowest market price';
      case 'cost-disadvantage': return 'Items where our cost is >5% above highest market price';
      case 'stock-risk': return 'Items with less than 2 weeks supply based on usage';
      default: return 'Filtered view of inventory items';
    }
  };

  // Calculate summary stats for filtered items
  const filteredStats = useMemo(() => {
    const totalValue = filteredItems.reduce((sum, item) => sum + (item.stockValue || 0), 0);
    const fastMovers = filteredItems.filter(item => typeof item.velocityCategory === 'number' && item.velocityCategory <= 3);
    const potentialRevenue = filteredItems.reduce((sum, item) => {
      if (filterType === 'margin-opportunity' && item.lowestMarketPrice) {
        return sum + ((item.lowestMarketPrice - item.avg_cost) * (item.currentStock || 0));
      }
      return sum;
    }, 0);
    
    return {
      totalItems: filteredItems.length,
      totalValue,
      fastMovers: fastMovers.length,
      potentialRevenue
    };
  }, [filteredItems, filterType]);

  return (
    <div className="space-y-6">
      {/* Header with clear filter button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">{getFilterTitle()}</h2>
          <p className="text-gray-400">{getFilterDescription()}</p>
        </div>
        <Button variant="outline" onClick={onClearFilter} className="flex items-center gap-2">
          <Flag className="h-4 w-4" />
          Show All Overview
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">{filteredStats.totalItems.toLocaleString()}</div>
            <div className="text-sm text-gray-400">Total Items</div>
          </CardContent>
        </Card>
        <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">{formatCurrency(filteredStats.totalValue)}</div>
            <div className="text-sm text-gray-400">Total Value</div>
          </CardContent>
        </Card>
        <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-400">{filteredStats.fastMovers}</div>
            <div className="text-sm text-gray-400">Fast Movers (Cat 1-3)</div>
          </CardContent>
        </Card>
        <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-400">
              {filterType === 'margin-opportunity' ? formatCurrency(filteredStats.potentialRevenue) : 
               starredItems.size.toLocaleString()}
            </div>
            <div className="text-sm text-gray-400">
              {filterType === 'margin-opportunity' ? 'Potential Revenue' : 'Starred Items'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
        <CardContent className="p-4">
          <Input
            placeholder="Search by stock code or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-800 border-gray-700 text-white"
          />
          <div className="mt-2 text-sm text-gray-400">
            Showing {filteredStats.totalItems.toLocaleString()} items
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
        <CardContent className="p-0">
          <div className="max-h-[600px] overflow-y-auto">
            <table className="w-full min-w-[1400px]">
                <thead className="bg-gray-900/90 sticky top-0 z-10">
                  <tr className="border-b border-gray-700">
                    <th className="text-left p-3 text-gray-300 cursor-pointer hover:text-white sticky left-0 bg-gray-900/95 backdrop-blur-sm border-r border-gray-700 z-20 min-w-[200px] text-sm" onClick={() => handleSort('item')}>
                      Item {sortField === 'item' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('stockValue')}>
                      Stock Value {sortField === 'stockValue' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('averageCost')}>
                      Avg Cost {sortField === 'averageCost' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('currentStock')}>
                      Stock Qty {sortField === 'currentStock' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('onOrder')}>
                      On Order {sortField === 'onOrder' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="text-center p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('monthsOfStock')}>
                      Months {sortField === 'monthsOfStock' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    {renderColumnHeader('Velocity', 'velocityCategory', 'velocityCategory', getUniqueVelocityCategories())}
                    {renderColumnHeader('Trend', 'trendDirection', 'trendDirection', getUniqueTrendDirections())}
                    <th className="text-center p-3 text-gray-300 text-sm">
                      Watch
                    </th>
                    <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('price')}>
                      Price {sortField === 'price' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('nbp')}>
                      NBP {sortField === 'nbp' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    {renderColumnHeader('Winning', 'winning', 'winning', getUniqueWinningValues())}
                    <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('lowestComp')}>
                      Lowest Comp {sortField === 'lowestComp' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('sdt')}>
                      SDT {sortField === 'sdt' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="text-right p-3 text-gray-300 cursor-pointer hover:text-white text-sm" onClick={() => handleSort('edt')}>
                      EDT {sortField === 'edt' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="text-center p-3 text-gray-300 text-sm">
                      Star
                    </th>
                  </tr>
                </thead>
              <tbody>
                {filteredItems.map((item, index) => (
                  <tr key={item.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                    <td className="p-3 sticky left-0 bg-gray-950/95 backdrop-blur-sm border-r border-gray-700 min-w-[200px] text-sm">
                      <div>
                        <div className="font-medium text-white">{item.stockcode}</div>
                        <div className="text-sm text-gray-400 truncate max-w-xs">{item.description}</div>
                      </div>
                    </td>
                    <td className="p-3 text-right text-white font-semibold text-sm">
                      {formatCurrency(item.stockValue)}
                    </td>
                    <td className="p-3 text-right text-gray-300 text-sm">
                      {shouldShowAverageCostTooltip(item) ? (
                        <TooltipProvider>
                          <UITooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help underline decoration-dotted">
                                {getDisplayedAverageCost(item) ? formatCurrency(getDisplayedAverageCost(item)!) : 'N/A'}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="bg-gray-800 border-gray-700 text-white">
                              <div className="text-sm">{getAverageCostTooltip(item)}</div>
                            </TooltipContent>
                          </UITooltip>
                        </TooltipProvider>
                      ) : (
                        getDisplayedAverageCost(item) ? formatCurrency(getDisplayedAverageCost(item)!) : 'N/A'
                      )}
                    </td>
                    <td className="p-3 text-right text-gray-300 text-sm">
                      {(item.currentStock || item.stock || 0).toLocaleString()}
                    </td>
                    <td className="p-3 text-right text-gray-300 text-sm">
                      {(item.quantity_on_order || 0).toLocaleString()}
                    </td>
                    <td className="p-3 text-center text-sm">
                      <TooltipProvider>
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <span className={`cursor-help ${item.monthsOfStock && item.monthsOfStock > 6 ? 'text-red-400 font-semibold' : 'text-gray-300'}`}>
                              {item.monthsOfStock === 999.9 ? '∞' : item.monthsOfStock ? item.monthsOfStock.toFixed(1) : 'N/A'}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="bg-gray-800 border-gray-700 text-white">
                            <div className="text-sm">{item.averageUsage || item.packs_sold_avg_last_six_months ? (item.averageUsage || item.packs_sold_avg_last_six_months).toFixed(0) : 'No'} packs/month</div>
                          </TooltipContent>
                        </UITooltip>
                      </TooltipProvider>
                    </td>
                    <td className={`p-3 text-center font-semibold ${getCategoryColor(item.velocityCategory)}`}>
                      {typeof item.velocityCategory === 'number' ? item.velocityCategory : 'N/A'}
                    </td>
                    <td className="p-3 text-center text-sm">
                      <span className={`text-lg font-bold ${getTrendColor(item.trendDirection)}`}>
                        {item.trendDirection === 'UP' ? '↑' :
                         item.trendDirection === 'DOWN' ? '↓' :
                         item.trendDirection === 'STABLE' ? '−' : '?'}
                      </span>
                    </td>
                    <td className="p-3 text-center text-sm">
                      <span className={item.watchlist === '⚠️' ? 'text-orange-400' : 'text-gray-600'}>
                        {item.watchlist || '−'}
                      </span>
                    </td>
                    <td className="p-3 text-right text-purple-400 font-semibold text-sm">
                      {item.AVER ? formatCurrency(item.AVER) : 'N/A'}
                    </td>
                    <td className="p-3 text-right text-green-400 font-semibold text-sm">
                      <TooltipProvider>
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help underline decoration-dotted">
                              {item.min_cost && item.min_cost > 0 ? formatCurrency(item.min_cost) : 'OOS'}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="bg-gray-800 border-gray-700 text-white">
                            <div className="space-y-1">
                              <div className="text-sm">Next Cost: {item.next_cost && item.next_cost > 0 ? formatCurrency(item.next_cost) : 'N/A'}</div>
                              <div className="text-sm">Min Cost: {item.min_cost && item.min_cost > 0 ? formatCurrency(item.min_cost) : 'N/A'}</div>
                              <div className="text-sm">Last PO Cost: {item.last_po_cost && item.last_po_cost > 0 ? formatCurrency(item.last_po_cost) : 'N/A'}</div>
                            </div>
                          </TooltipContent>
                        </UITooltip>
                      </TooltipProvider>
                    </td>
                    <td className="p-3 text-center font-semibold text-sm">
                      {(() => {
                        const lowestComp = item.bestCompetitorPrice || item.lowestMarketPrice || item.Nupharm || item.AAH2 || item.LEXON2;
                        const isWinning = item.AVER && lowestComp && item.AVER < lowestComp;
                        return (
                          <span className={isWinning ? 'text-green-400' : 'text-red-400'}>
                            {isWinning ? 'Y' : 'N'}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="p-3 text-right text-blue-400 font-semibold text-sm">
                      <TooltipProvider>
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help underline decoration-dotted">
                              {item.bestCompetitorPrice ? formatCurrency(item.bestCompetitorPrice) : 
                               (item.lowestMarketPrice ? formatCurrency(item.lowestMarketPrice) : 
                                (item.Nupharm ? formatCurrency(item.Nupharm) : 
                                 (item.AAH2 ? formatCurrency(item.AAH2) : 
                                  (item.LEXON2 ? formatCurrency(item.LEXON2) : 'N/A'))))}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="bg-gray-800 border-gray-700 text-white max-w-xs">
                            <div className="space-y-1">
                              {[
                                { name: 'Nupharm', price: item.Nupharm },
                                { name: 'AAH2', price: item.AAH2 },
                                { name: 'ETH_LIST', price: item.ETH_LIST },
                                { name: 'ETH_NET', price: item.ETH_NET },
                                { name: 'LEXON2', price: item.LEXON2 }
                              ].filter(comp => comp.price && comp.price > 0)
                               .sort((a, b) => a.price - b.price)
                               .map((comp, idx) => (
                                <div key={idx} className="text-sm">{comp.name}: {formatCurrency(comp.price)}</div>
                              ))}
                              {![item.Nupharm, item.AAH2, item.ETH_LIST, item.ETH_NET, item.LEXON2].some(price => price && price > 0) && (
                                <div className="text-sm">No competitor pricing available</div>
                              )}
                            </div>
                          </TooltipContent>
                        </UITooltip>
                      </TooltipProvider>
                    </td>
                    <td className="p-3 text-right text-gray-300 text-sm">
                      {item.SDT ? formatCurrency(item.SDT) : '-'}
                    </td>
                    <td className="p-3 text-right text-gray-300 text-sm">
                      {item.EDT ? formatCurrency(item.EDT) : '-'}
                    </td>
                    <td className="p-3 text-center text-sm">
                      <button
                        onClick={() => onToggleStar(item.id)}
                        className={`text-lg hover:scale-110 transition-transform ${
                          starredItems.has(item.id) ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-400'
                        }`}
                      >
                        {starredItems.has(item.id) ? '★' : '☆'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
          </div>
          
          {filteredItems.length === 0 && (
            <div className="p-8 text-center text-gray-400">
              <div className="text-lg font-medium">No items found</div>
              <div className="text-sm mt-1">Try adjusting your search criteria</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Wrapper component
const InventoryAnalytics: React.FC = () => <InventoryAnalyticsContent />;

export default InventoryAnalytics; 
