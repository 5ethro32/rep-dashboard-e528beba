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
  PoundSterling, 
  TrendingUp, 
  AlertTriangle,
  BarChart3,
  Download,
  Info,
  Star,
  Clock,
  Flag,
  TrendingDown,
  Filter,
  RotateCcw
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
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, LineChart, Line, ComposedChart } from 'recharts';

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

// Helper function to determine winning status: Y (strict win), N (losing), - (tie)
const getWinningStatus = (item: ProcessedInventoryItem): 'Y' | 'N' | '-' => {
  if (!item.AVER || item.AVER <= 0) return 'N';
  
  // Get all competitor prices
  const competitorPrices = [
    item.Nupharm,
    item.AAH2, 
    item.ETH_LIST,
    item.ETH_NET,
    item.LEXON2
  ].filter(price => price && price > 0);
  
  if (competitorPrices.length === 0) return '-'; // No competitor data
  
  const lowestCompetitorPrice = Math.min(...competitorPrices);
  
  if (item.AVER < lowestCompetitorPrice) return 'Y'; // We win strictly
  if (item.AVER === lowestCompetitorPrice) return '-'; // Tie
  return 'N'; // We lose
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
    nbp: string[];
  }>({
    type: [],
    severity: [],
    velocityCategory: [],
    trendDirection: [],
    winning: [],
    nbp: []
  });
  
  // Filter dropdown search states
  const [filterDropdownSearch, setFilterDropdownSearch] = useState<{
    type: string;
    severity: string;
    velocityCategory: string;
    trendDirection: string;
    winning: string;
    nbp: string;
  }>({
    type: '',
    severity: '',
    velocityCategory: '',
    trendDirection: '',
    winning: '',
    nbp: ''
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
          columnFilters.winning.includes(getWinningStatus(issue.item));

        const matchesNbpFilter = columnFilters.nbp.length === 0 || 
          columnFilters.nbp.includes(issue.item.min_cost && issue.item.min_cost > 0 ? 'Available' : 'N/A');

        return matchesSearch && matchesTypeFilter && matchesSeverityFilter && matchesVelocityFilter && matchesTrendFilter && matchesWinningFilter && matchesNbpFilter;
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
    return ['Y', 'N', '-'];
  };

  const getUniqueNbpValues = () => {
    return ['Available', 'N/A'];
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
                  {renderColumnHeader('NBP', 'nbp', 'nbp', getUniqueNbpValues(), 'right')}
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
                      <span className={
                        getWinningStatus(issue.item) === 'Y' ? 'text-green-400' : 
                        getWinningStatus(issue.item) === 'N' ? 'text-red-400' :
                        'text-gray-400'
                      }>
                        {getWinningStatus(issue.item)}
                      </span>
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
    nbp: string[];
  }>({
    velocityCategory: [],
    trendDirection: [],
    winning: [],
    nbp: []
  });
  
  // Filter dropdown search states
  const [filterDropdownSearch, setFilterDropdownSearch] = useState<{
    velocityCategory: string;
    trendDirection: string;
    winning: string;
    nbp: string;
  }>({
    velocityCategory: '',
    trendDirection: '',
    winning: '',
    nbp: ''
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
          columnFilters.winning.includes(getWinningStatus(item));

        const matchesNbpFilter = columnFilters.nbp.length === 0 || 
          columnFilters.nbp.includes((item.nextBuyingPrice || item.nbp || item.next_cost || item.min_cost || item.last_po_cost) && (item.nextBuyingPrice || item.nbp || item.next_cost || item.min_cost || item.last_po_cost) > 0 ? 'Available' : 'N/A');

        return matchesSearch && matchesVelocityFilter && matchesTrendFilter && matchesWinningFilter && matchesNbpFilter;
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
    return ['Y', 'N', '-'];
  };

  const getUniqueNbpValues = () => {
    return ['Available', 'N/A'];
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
                  {renderColumnHeader('NBP', 'nbp', 'nbp', getUniqueNbpValues(), 'right')}
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
    nbp: string[];
  }>({
    velocityCategory: [],
    trendDirection: [],
    winning: [],
    nbp: []
  });
  
  // Filter dropdown search states
  const [filterDropdownSearch, setFilterDropdownSearch] = useState<{
    velocityCategory: string;
    trendDirection: string;
    winning: string;
    nbp: string;
  }>({
    velocityCategory: '',
    trendDirection: '',
    winning: '',
    nbp: ''
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
          columnFilters.winning.includes(getWinningStatus(item));

        const matchesNbpFilter = columnFilters.nbp.length === 0 || 
          columnFilters.nbp.includes((item.nextBuyingPrice || item.nbp || item.next_cost || item.min_cost || item.last_po_cost) && (item.nextBuyingPrice || item.nbp || item.next_cost || item.min_cost || item.last_po_cost) > 0 ? 'Available' : 'N/A');

        return matchesSearch && matchesVelocityFilter && matchesTrendFilter && matchesWinningFilter && matchesNbpFilter;
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
    return ['Y', 'N', '-'];
  };

  const getUniqueNbpValues = () => {
    return ['Available', 'N/A'];
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
                  {renderColumnHeader('NBP', 'nbp', 'nbp', getUniqueNbpValues(), 'right')}
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
    nbp: string[];
  }>({
    velocityCategory: [],
    trendDirection: [],
    winning: [],
    nbp: []
  });
  
  // Filter dropdown search states
  const [filterDropdownSearch, setFilterDropdownSearch] = useState<{
    velocityCategory: string;
    trendDirection: string;
    winning: string;
    nbp: string;
  }>({
    velocityCategory: '',
    trendDirection: '',
    winning: '',
    nbp: ''
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
    } else if (filterType === 'below-cost-lines') {
      items = items.filter(item => {
        return item.AVER && item.avg_cost && item.AVER < item.avg_cost;
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

    const matchesNbpFilter = (item: any) => {
      if (columnFilters.nbp.length === 0) return true;
      const nbpValue = item.nextBuyingPrice || item.nbp || item.next_cost || item.min_cost || item.last_po_cost;
      const nbpStatus = nbpValue && nbpValue > 0 ? 'Available' : 'N/A';
      return columnFilters.nbp.includes(nbpStatus);
    };

    items = items.filter(item => matchesVelocityFilter(item) && matchesTrendFilter(item) && matchesWinningFilter(item) && matchesNbpFilter(item));

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
    return ['Y', 'N', '-'];
  };

  const getUniqueNbpValues = () => {
    return ['Available', 'N/A'];
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
                <SelectItem value="below-cost-lines" className="text-red-300">📉 Below Cost Lines</SelectItem>
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
                <TooltipContent side="top" align="start" className="bg-gray-800 border-gray-700 text-white max-w-xs">
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
                <TooltipContent side="top" align="start" className="bg-gray-800 border-gray-700 text-white max-w-xs">
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
                    ⚡ Uncompetitive Cost
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" align="center" className="bg-gray-800 border-gray-700 text-white max-w-xs">
                  <div className="text-sm">
                    <div className="font-medium mb-1">Uncompetitive Cost Alert</div>
                    <div>Products where our cost is above market low with stable/rising trends. No price relief coming.</div>
                  </div>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>

            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setFilterType('below-cost-lines')}
                    className={`p-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                      filterType === 'below-cost-lines' 
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                        : 'bg-gray-800/50 text-gray-400 hover:bg-red-500/10 hover:text-red-300 border border-gray-700/50'
                    }`}
                  >
                    📉 Below Cost
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" align="center" className="bg-gray-800 border-gray-700 text-white max-w-xs">
                  <div className="text-sm">
                    <div className="font-medium mb-1">Below Cost Lines</div>
                    <div>Products where our selling price is below average cost. Items selling at a loss requiring immediate attention.</div>
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
                <TooltipContent side="top" align="center" className="bg-gray-800 border-gray-700 text-white max-w-xs">
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
                <TooltipContent side="top" align="end" className="bg-gray-800 border-gray-700 text-white max-w-xs">
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
                  {renderColumnHeader('NBP', 'nbp', 'nbp', getUniqueNbpValues(), 'right')}
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
    nbp: string[];
  }>({
    velocityCategory: [],
    trendDirection: [],
    winning: [],
    nbp: []
  });
  
  // Filter dropdown search states
  const [filterDropdownSearch, setFilterDropdownSearch] = useState<{
    velocityCategory: string;
    trendDirection: string;
    winning: string;
    nbp: string;
  }>({
    velocityCategory: '',
    trendDirection: '',
    winning: '',
    nbp: ''
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

        const matchesNbpFilter = columnFilters.nbp.length === 0 || 
          columnFilters.nbp.includes(
            (item.nextBuyingPrice || item.nbp || item.next_cost || item.min_cost || item.last_po_cost) ? 'Y' : 'N'
          );

        return matchesSearch && matchesVelocityFilter && matchesTrendFilter && matchesWinningFilter && matchesNbpFilter;
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
    return ['Y', 'N', '-'];
  };

  const getUniqueNbpValues = () => {
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
                  {renderColumnHeader('NBP', 'nbp', 'nbp', getUniqueNbpValues(), 'right')}
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
        />
        
        <MetricCard 
          title="Stock Value"
          value={formatCurrency(inventoryData.summaryStats.totalStockValue)}
          subtitle="Physical inventory"
          icon={<PoundSterling className="h-5 w-5" />}
          iconPosition="right"
        />
        
        <MetricCard 
          title="On Order Value"
          value={formatCurrency(inventoryData.summaryStats.totalOnOrderValue)}
          subtitle="Future commitments"
          icon={<TrendingUp className="h-5 w-5" />}
          iconPosition="right"
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
        />
      </div>

      {/* Summary Metrics - Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div onClick={() => handleMetricCardClick('out-of-stock')} className="cursor-pointer">
          <MetricCard 
            title="Out of Stock"
            value={(inventoryData.summaryStats.outOfStockItems || 0).toLocaleString()}
            subtitle={(() => {
              const replenishableCount = inventoryData.analyzedItems.filter(item => 
                (item.quantity_available || 0) === 0 && (item.quantity_ringfenced || 0) === 0 && (item.quantity_on_order || 0) === 0 &&
                item.min_cost && item.min_cost > 0
              ).length;
              
              // Calculate monthly lost revenue for replenishable items (using same logic as detailed view)
              const monthlyLostRevenue = inventoryData.analyzedItems
                .filter(item => (item.quantity_available || 0) === 0 && (item.quantity_ringfenced || 0) === 0 && (item.quantity_on_order || 0) === 0)
                .reduce((sum, item) => {
                  if (!item.min_cost || item.min_cost <= 0) return sum;
                  const lowestComp = item.bestCompetitorPrice || item.lowestMarketPrice || item.Nupharm || item.AAH2 || item.LEXON2;
                  if (!lowestComp || lowestComp <= 0) return sum;
                  const monthlyUsage = item.averageUsage || item.packs_sold_avg_last_six_months || 0;
                  if (monthlyUsage <= 0) return sum;
                  const monthlyLostProfit = (lowestComp - item.min_cost) * monthlyUsage;
                  return sum + Math.max(0, monthlyLostProfit);
                }, 0);
              
              return `${replenishableCount} can be replenished (${formatCurrency(monthlyLostRevenue)}/month lost)`;
            })()}
            icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
            iconPosition="right"
            change={{
              value: inventoryData.analyzedItems.filter(item => 
                (item.quantity_available || 0) === 0 && (item.quantity_ringfenced || 0) === 0 && (item.quantity_on_order || 0) === 0 &&
                item.min_cost && item.min_cost > 0
              ).length > 0 ? 'Action Needed' : 'OK',
              type: inventoryData.analyzedItems.filter(item => 
                (item.quantity_available || 0) === 0 && (item.quantity_ringfenced || 0) === 0 && (item.quantity_on_order || 0) === 0 &&
                item.min_cost && item.min_cost > 0
              ).length > 0 ? 'increase' : 'neutral'
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
  // State for flip functionality - MUST be called before any conditional returns
  const [marginMatrixView, setMarginMatrixView] = useState<'chart' | 'table'>('chart');

  // Professional color palette for supplier analysis
  const SUPPLIER_COLORS: Record<string, string> = {
    'Our Price': '#22C55E',      // Green - we want this to stand out positively
    'Nupharm': '#3B82F6',       // Blue
    'AAH': '#F59E0B',           // Orange
    'Ethics (List)': '#8B5CF6', // Purple
    'Ethics (Net)': '#EC4899',  // Pink
    'Lexon': '#06B6D4',         // Cyan
    'No Data': '#6B7280'        // Gray
  };

  // Prepare data for Price Comparison Analysis (Multi-Line Chart)
  const priceComparisonData = useMemo(() => {
    const comparison: Array<{
      category: string;
      velocityCategory: number;
      ourPrice: number;
      lowestMarketPrice: number;
      averageMarketPrice: number;
      itemCount: number;
    }> = [];

    // Group by velocity category and calculate average prices
    const groupedData = data.analyzedItems.reduce((acc, item) => {
      if (typeof item.velocityCategory === 'number' && item.AVER && item.AVER > 0) {
        const key = item.velocityCategory;
        if (!acc[key]) {
          acc[key] = { 
            ourPrices: [], 
            lowestPrices: [], 
            allCompetitorPrices: [],
            itemCount: 0 
          };
        }
        
        // Add our price
        acc[key].ourPrices.push(item.AVER);
        acc[key].itemCount += 1;

        // Add lowest market price if available
        const lowestPrice = item.bestCompetitorPrice || item.lowestMarketPrice;
        if (lowestPrice && lowestPrice > 0) {
          acc[key].lowestPrices.push(lowestPrice);
        }

        // Collect all competitor prices for market average
        const suppliers = ['Nupharm', 'AAH2', 'ETH_LIST', 'ETH_NET', 'LEXON2'];
        suppliers.forEach(supplier => {
          const price = item[supplier as keyof typeof item] as number;
          if (price && price > 0) {
            acc[key].allCompetitorPrices.push(price);
          }
        });
      }
      return acc;
    }, {} as Record<number, { 
      ourPrices: number[]; 
      lowestPrices: number[]; 
      allCompetitorPrices: number[];
      itemCount: number;
    }>);

    // Calculate averages for each velocity category
    Object.entries(groupedData).forEach(([category, groupData]) => {
      const catNum = parseInt(category);
      
      const ourAvgPrice = groupData.ourPrices.length > 0 
        ? groupData.ourPrices.reduce((sum, price) => sum + price, 0) / groupData.ourPrices.length 
        : 0;

      const lowestAvgPrice = groupData.lowestPrices.length > 0 
        ? groupData.lowestPrices.reduce((sum, price) => sum + price, 0) / groupData.lowestPrices.length 
        : 0;

      const marketAvgPrice = groupData.allCompetitorPrices.length > 0 
        ? groupData.allCompetitorPrices.reduce((sum, price) => sum + price, 0) / groupData.allCompetitorPrices.length 
        : 0;

      if (ourAvgPrice > 0) {
        // Calculate total stock value for this group using the main data reference
        const stockValue = data.analyzedItems
          .filter(item => typeof item.velocityCategory === 'number' && item.velocityCategory === catNum)
          .reduce((sum, item) => sum + (item.stockValue || 0), 0);

        const comparisonItem = {
          category: `Group ${catNum}`,
          velocityCategory: catNum,
          ourPrice: ourAvgPrice,
          lowestMarketPrice: lowestAvgPrice || ourAvgPrice, // Fallback to our price if no competitor data
          averageMarketPrice: marketAvgPrice || ourAvgPrice, // Fallback to our price if no competitor data
          itemCount: groupData.itemCount,
          stockValue: stockValue
        };
        
        comparison.push(comparisonItem as any);
      }
    });

    return comparison.sort((a, b) => a.velocityCategory - b.velocityCategory);
  }, [data.analyzedItems]);

  // Prepare data for Supplier Split Analysis (Strict Wins Only)
  const supplierSplitData = useMemo(() => {
    const supplierCounts: Record<string, number> = {
      'Our Price': 0,
      'Nupharm': 0,
      'AAH': 0,
      'Eth (List)': 0,
      'Eth (Net)': 0,
      'Lexon': 0,
      'No Data': 0
    };

    // Clean supplier name mapping
    const supplierMapping: Record<string, string> = {
      'AAH2': 'AAH',
      'ETH_LIST': 'Eth (List)',
      'ETH_NET': 'Eth (Net)',
      'LEXON2': 'Lexon',
      'Nupharm': 'Nupharm'
    };

    // For each item, only count STRICT wins (no ties)
    data.analyzedItems.forEach(item => {
      const competitors = ['Nupharm', 'AAH2', 'ETH_LIST', 'ETH_NET', 'LEXON2'];
      
      // Check if we have our price
      if (item.AVER && item.AVER > 0) {
        // Get all valid competitor prices
        const competitorPrices: Array<{ source: string; price: number }> = [];
        competitors.forEach(supplier => {
          const price = item[supplier as keyof typeof item] as number;
          if (price && price > 0) {
            const cleanName = supplierMapping[supplier] || supplier;
            competitorPrices.push({ source: cleanName, price });
          }
        });

        if (competitorPrices.length > 0) {
          // Find the lowest competitor price
          const lowestCompetitorPrice = Math.min(...competitorPrices.map(c => c.price));
          
          // Check if we strictly win (our price < lowest competitor)
          if (item.AVER < lowestCompetitorPrice) {
            supplierCounts['Our Price'] += 1;
          } else {
            // Find which competitor has the lowest price (strict wins only)
            const lowestCompetitor = competitorPrices.find(c => c.price === lowestCompetitorPrice);
            
            // Only count if this competitor is strictly better than our price
            if (lowestCompetitor && lowestCompetitor.price < item.AVER) {
              supplierCounts[lowestCompetitor.source] += 1;
            } else {
              // It's a tie or we only have our price - count as no clear winner
              supplierCounts['No Data'] += 1;
            }
          }
        } else {
          // No competitor data available
          supplierCounts['No Data'] += 1;
        }
      } else {
        // No pricing data available
        supplierCounts['No Data'] += 1;
      }
    });

    // Convert to pie chart data format with better colors
    const pieData = Object.entries(supplierCounts)
      .filter(([_, count]) => count > 0)
      .map(([supplier, count]) => ({
        name: supplier,
        value: count,
        percentage: ((count / data.analyzedItems.length) * 100).toFixed(1)
      }));

    return pieData;
  }, [data.analyzedItems]);

  // Prepare data for Margin Opportunity Matrix (Heat Map Style) - REAL opportunities only
  const marginOpportunityData = useMemo(() => {
    const opportunities: Array<{
      category: string;
      opportunityValue: number;
      itemCount: number;
      averageMargin: number;
      priority: 'Critical' | 'High' | 'Medium' | 'Low';
      color: string;
    }> = [];

    // Group by velocity and calculate REAL margin opportunities
    const grouped = data.analyzedItems.reduce((acc, item) => {
      // Must have a velocity category
      if (typeof item.velocityCategory !== 'number') return acc;
      
      // Must have min_cost available (suppliers have stock)
      if (!item.min_cost || item.min_cost <= 0) return acc;
      
      // Calculate lowest competitor price
      const competitors = ['AAH', 'AAH2', 'ETH_LIST', 'ETH_NET', 'LEXON2', 'Nupharm'];
      const competitorPrices = competitors
        .map(comp => item[comp as keyof typeof item] as number)
        .filter(price => price && price > 0);
      
      if (competitorPrices.length === 0) return acc;
      
      const lowestCompPrice = Math.min(...competitorPrices);
      
      // Only include if min_cost < lowest competitor price (real arbitrage opportunity)
      if (item.min_cost < lowestCompPrice) {
        const marginOpportunity = ((lowestCompPrice - item.min_cost) / item.min_cost) * 100;
        
        // Only include if > 5% margin opportunity
        if (marginOpportunity > 5) {
          const key = item.velocityCategory <= 2 ? 'Ultra Fast' :
                     item.velocityCategory <= 4 ? 'Fast' : 'Slow';
          
          if (!acc[key]) {
            acc[key] = { totalOpportunity: 0, items: 0, margins: [] };
          }

          // Calculate opportunity value based on buying at min_cost and selling at competitor price
          const potentialRevenue = lowestCompPrice * (item.quantity_available || 0);
          const currentCost = item.min_cost * (item.quantity_available || 0);
          const opportunityValue = potentialRevenue - currentCost;
          
          acc[key].totalOpportunity += opportunityValue;
          acc[key].items += 1;
          acc[key].margins.push(marginOpportunity);
        }
      }
      return acc;
    }, {} as Record<string, { totalOpportunity: number; items: number; margins: number[] }>);

    // Create opportunity data with priority classification
    Object.entries(grouped).forEach(([category, data]) => {
      const avgMargin = data.margins.reduce((sum, m) => sum + m, 0) / data.margins.length;
      
      let priority: 'Critical' | 'High' | 'Medium' | 'Low' = 'Low';
      let color = '#06B6D4';

      // Priority based on opportunity value and velocity
      if (data.totalOpportunity > 100000 && category === 'Ultra Fast') {
        priority = 'Critical';
        color = '#DC2626'; // Dark red
      } else if (data.totalOpportunity > 50000 || category === 'Ultra Fast') {
        priority = 'High';
        color = '#EF4444'; // Red
      } else if (data.totalOpportunity > 25000) {
        priority = 'Medium';
        color = '#F59E0B'; // Orange
      } else {
        priority = 'Low';
        color = '#10B981'; // Green
      }

      opportunities.push({
        category,
        opportunityValue: data.totalOpportunity,
        itemCount: data.items,
        averageMargin: avgMargin,
        priority,
        color
      });
    });

    return opportunities.sort((a, b) => b.opportunityValue - a.opportunityValue);
  }, [data.analyzedItems]);

  // Get margin opportunity items for table view - REAL opportunities only
  const marginOpportunityItems = useMemo(() => {
    return data.analyzedItems.filter(item => {
      // Must have a velocity category
      if (typeof item.velocityCategory !== 'number') return false;
      
      // Must have min_cost available (suppliers have stock)
      if (!item.min_cost || item.min_cost <= 0) return false;
      
      // Calculate lowest competitor price
      const competitors = ['AAH', 'AAH2', 'ETH_LIST', 'ETH_NET', 'LEXON2', 'Nupharm'];
      const competitorPrices = competitors
        .map(comp => item[comp as keyof typeof item] as number)
        .filter(price => price && price > 0);
      
      if (competitorPrices.length === 0) return false;
      
      const lowestCompPrice = Math.min(...competitorPrices);
      
      // Only include if min_cost < lowest competitor price (real arbitrage opportunity)
      const isRealOpportunity = item.min_cost < lowestCompPrice;
      
      // Calculate margin opportunity percentage
      if (isRealOpportunity) {
        const marginOpportunity = ((lowestCompPrice - item.min_cost) / item.min_cost) * 100;
        // Store this for sorting - add it to the item temporarily
        (item as any).realMarginOpportunity = marginOpportunity;
        return marginOpportunity > 5; // Only include if > 5% margin opportunity
      }
      
      return false;
    }).sort((a, b) => ((b as any).realMarginOpportunity || 0) - ((a as any).realMarginOpportunity || 0));
  }, [data.analyzedItems]);

  // Format currency function
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

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

  // Enhanced overview with modern analytics
  return (
    <div className="space-y-6">
      {/* Price Comparison Analysis - Strategic Pricing Framework */}
      <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Price Comparison Analysis
          </CardTitle>
          <p className="text-sm text-gray-400">
            Compare our pricing against market lowest and average by velocity category
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={priceComparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="category" 
                stroke="#9CA3AF"
                angle={-45}
                textAnchor="end"
                height={60}
              />
              {/* Left Y-Axis for Prices */}
              <YAxis 
                yAxisId="price"
                stroke="#9CA3AF"
                tickFormatter={(value) => `£${value.toFixed(2)}`}
                domain={['dataMin - 0.5', 'dataMax + 0.5']}
                allowDecimals={true}
              />
              {/* Right Y-Axis for Stock Values */}
              <YAxis 
                yAxisId="stock"
                orientation="right"
                stroke="#374151"
                tickFormatter={(value) => `£${(value / 1000).toFixed(0)}k`}
                tick={{ fill: '#6B7280', fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
                formatter={(value, name) => {
                  if (name === 'stockValue') return [`£${(value as number / 1000).toFixed(0)}k`, 'Stock Value'];
                  const price = `£${(value as number).toFixed(2)}`;
                  if (name === 'ourPrice') return [price, 'Our Average Price'];
                  if (name === 'lowestMarketPrice') return [price, 'Lowest Market Price'];
                  if (name === 'averageMarketPrice') return [price, 'Average Market Price'];
                  return [price, name];
                }}
                labelFormatter={(label) => {
                  const item = priceComparisonData.find(d => d.category === label);
                  return `${label} (${item?.itemCount || 0} items)`;
                }}
              />
              
              {/* Background Stock Value Bars - Almost Transparent */}
              <Bar 
                yAxisId="stock"
                dataKey="stockValue" 
                fill="#374151"
                fillOpacity={0.4}
                stroke="none"
                name="stockValue"
                maxBarSize={50}
              />
              
              {/* Our Price Line - Blue */}
              <Line 
                yAxisId="price"
                type="monotone"
                dataKey="ourPrice" 
                stroke="#3B82F6"
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, fill: '#3B82F6' }}
                name="ourPrice"
              />
              
              {/* Lowest Market Price Line - Green */}
              <Line 
                yAxisId="price"
                type="monotone"
                dataKey="lowestMarketPrice" 
                stroke="#10B981"
                strokeWidth={3}
                dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, fill: '#10B981' }}
                name="lowestMarketPrice"
              />
              
              {/* Average Market Price Line - Orange */}
              <Line 
                yAxisId="price"
                type="monotone"
                dataKey="averageMarketPrice" 
                stroke="#F59E0B"
                strokeWidth={3}
                dot={{ fill: '#F59E0B', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, fill: '#F59E0B' }}
                name="averageMarketPrice"
              />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="mt-4 flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-gray-300">Our Average Price</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-gray-300">Lowest Market Price</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span className="text-gray-300">Average Market Price</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Supplier Split Analysis */}
        <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Competitive Positioning Analysis</CardTitle>
            <p className="text-sm text-gray-400">
              Market share of lowest prices - who wins each product line?
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={supplierSplitData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={90}
                  innerRadius={30}
                  fill="#8884d8"
                  dataKey="value"
                  stroke="#1F2937"
                  strokeWidth={2}
                >
                  {supplierSplitData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={SUPPLIER_COLORS[entry.name] || '#6B7280'} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                  formatter={(value, name) => {
                    const percentage = supplierSplitData.find(d => d.name === name)?.percentage || '0';
                    return [`${value} items (${percentage}%)`, name];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {supplierSplitData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded" 
                    style={{ backgroundColor: SUPPLIER_COLORS[entry.name] || '#6B7280' }}
                  ></div>
                  <span className="text-gray-300">{entry.name}: {entry.percentage}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Margin Opportunity Matrix with Flip */}
        <Card className="border border-white/10 bg-gradient-to-br from-gray-950/60 to-gray-900/40 backdrop-blur-sm hover:border-white/20 transition-all duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl font-bold">
                  <TrendingUp className="h-6 w-6 text-orange-400" />
                  Real Margin Opportunities
                </CardTitle>
                <p className="text-sm text-gray-400 mt-1">
                  {marginMatrixView === 'chart' 
                    ? 'Products where suppliers have stock & our cost < competitor prices'
                    : `${marginOpportunityItems.length} actionable opportunities where we can source below market price`
                  }
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMarginMatrixView(marginMatrixView === 'chart' ? 'table' : 'chart')}
                className="text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {marginMatrixView === 'chart' ? (
              <>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={marginOpportunityData} margin={{ top: 20, right: 20, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis 
                      dataKey="category" 
                      stroke="#9CA3AF" 
                      fontSize={12}
                      tick={{ fill: '#9CA3AF' }}
                    />
                    <YAxis 
                      stroke="#9CA3AF" 
                      fontSize={12}
                      tick={{ fill: '#9CA3AF' }}
                      tickFormatter={(value) => {
                        if (value >= 1000000) return `£${(value / 1000000).toFixed(1)}M`;
                        if (value >= 1000) return `£${(value / 1000).toFixed(0)}k`;
                        return `£${value}`;
                      }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '12px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
                      }}
                      formatter={(value, name) => {
                        if (name === 'opportunityValue') {
                          const val = value as number;
                          const formatted = val >= 1000000 ? `£${(val / 1000000).toFixed(1)}M` :
                                          val >= 1000 ? `£${(val / 1000).toFixed(0)}k` :
                                          `£${val}`;
                          return [formatted, 'Opportunity Value'];
                        }
                        if (name === 'averageMargin') return [`${(value as number).toFixed(1)}%`, 'Avg Margin Opportunity'];
                        return [value, name];
                      }}
                      labelFormatter={(label) => {
                        const item = marginOpportunityData.find(d => d.category === label);
                        return `${label} (${item?.priority} Priority - ${item?.itemCount} items)`;
                      }}
                    />
                    <Bar 
                      dataKey="opportunityValue" 
                      fill="#8884d8"
                      name="opportunityValue"
                      radius={[4, 4, 0, 0]}
                    >
                      {marginOpportunityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 flex flex-wrap gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-600 rounded-full shadow-sm"></div>
                    <span className="text-gray-300 font-medium">Critical</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full shadow-sm"></div>
                    <span className="text-gray-300 font-medium">High</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full shadow-sm"></div>
                    <span className="text-gray-300 font-medium">Medium</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
                    <span className="text-gray-300 font-medium">Low</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="max-h-80 overflow-y-auto overflow-x-auto">
                <table className="w-full text-sm min-w-max">
                  <thead className="sticky top-0 bg-gray-900/90 backdrop-blur">
                    <tr className="border-b border-gray-700">
                      <th className="text-left p-2 text-gray-300 font-medium min-w-32">Product</th>
                      <th className="text-center p-2 text-gray-300 font-medium">Group</th>
                      <th className="text-right p-2 text-gray-300 font-medium">Min Cost</th>
                      <th className="text-right p-2 text-gray-300 font-medium">Our Price</th>
                      <th className="text-right p-2 text-gray-300 font-medium">Lowest Comp</th>
                      <th className="text-right p-2 text-gray-300 font-medium">Margin Opp</th>
                      <th className="text-center p-2 text-gray-300 font-medium">Market Rank</th>
                      <th className="text-right p-2 text-gray-300 font-medium">Stock Value</th>
                      <th className="text-center p-2 text-gray-300 font-medium">Priority</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marginOpportunityItems.slice(0, 50).map((item, index) => {
                      const velocityGroup = typeof item.velocityCategory === 'number' && item.velocityCategory <= 2 ? 'Ultra Fast' :
                                           typeof item.velocityCategory === 'number' && item.velocityCategory <= 4 ? 'Fast' : 'Slow';
                      const priority = (item.stockValue || 0) > 50000 && velocityGroup === 'Ultra Fast' ? 'Critical' :
                                      (item.stockValue || 0) > 25000 || velocityGroup === 'Ultra Fast' ? 'High' :
                                      (item.stockValue || 0) > 10000 ? 'Medium' : 'Low';
                      const priorityColor = priority === 'Critical' ? 'text-red-400' :
                                           priority === 'High' ? 'text-red-300' :
                                           priority === 'Medium' ? 'text-orange-400' : 'text-green-400';
                      
                      // Calculate competitive data
                      const minCost = item.min_cost || 0; // What suppliers charge us
                      const ourPrice = item.AVER || 0; // What we sell for
                      const competitors = ['AAH', 'AAH2', 'ETH_LIST', 'ETH_NET', 'LEXON2', 'Nupharm'];
                      const competitorPrices = competitors
                        .map(comp => item[comp as keyof typeof item] as number)
                        .filter(price => price && price > 0);
                      
                      const lowestCompPrice = competitorPrices.length > 0 ? Math.min(...competitorPrices) : 0;
                      const marginOpportunity = (item as any).realMarginOpportunity || 0;
                      
                      // Calculate current margin if we have both min cost and our price
                      const currentMargin = minCost > 0 && ourPrice > 0 ? 
                        ((ourPrice - minCost) / minCost * 100) : 0;
                      
                      // Calculate market rank
                      const allPrices = ourPrice > 0 ? [ourPrice, ...competitorPrices] : competitorPrices;
                      const sortedPrices = [...allPrices].sort((a, b) => a - b);
                      const ourRank = ourPrice > 0 ? sortedPrices.indexOf(ourPrice) + 1 : 0;
                      const totalCompetitors = allPrices.length;
                      
                      return (
                        <tr key={item.stockcode} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                          <td className="p-2">
                            <div className="font-medium text-white text-xs">{item.stockcode}</div>
                            <div className="text-gray-400 text-xs truncate max-w-32">{item.description}</div>
                          </td>
                          <td className="text-center p-2 text-gray-300 text-xs">{velocityGroup}</td>
                          <td className="text-right p-2 text-green-400 text-xs font-medium" title="Supplier/Manufacturer Price">
                            {minCost > 0 ? `£${minCost.toFixed(2)}` : 'N/A'}
                          </td>
                          <td className="text-right p-2 text-blue-400 text-xs font-medium" title={`Current Margin: ${currentMargin.toFixed(1)}%`}>
                            {ourPrice > 0 ? `£${ourPrice.toFixed(2)}` : 'N/A'}
                          </td>
                          <td className="text-right p-2 text-red-400 text-xs font-medium" title="Cheapest Competitor Price">
                            {lowestCompPrice > 0 ? `£${lowestCompPrice.toFixed(2)}` : 'N/A'}
                          </td>
                          <td className="text-right p-2 font-medium text-orange-400 text-xs" title="Potential margin if we price just below lowest competitor">
                            {marginOpportunity.toFixed(1)}%
                          </td>
                          <td className="text-center p-2 text-xs">
                            {ourRank > 0 && totalCompetitors > 0 ? (
                              <span className={`font-medium ${
                                ourRank === 1 ? 'text-green-400' :
                                ourRank === 2 ? 'text-yellow-400' :
                                ourRank === 3 ? 'text-orange-400' : 'text-red-400'
                              }`}>
                                {ourRank}/{totalCompetitors}
                              </span>
                            ) : (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </td>
                          <td className="text-right p-2 text-gray-300 text-xs">
                            {(item.stockValue || 0) >= 1000 ? `£${((item.stockValue || 0) / 1000).toFixed(0)}k` : `£${(item.stockValue || 0).toFixed(0)}`}
                          </td>
                          <td className={`text-center p-2 text-xs font-medium ${priorityColor}`}>
                            {priority}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {marginOpportunityItems.length > 50 && (
                  <div className="text-center text-gray-400 text-xs mt-2">
                    Showing top 50 of {marginOpportunityItems.length} opportunities
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Analytics Summary */}
      <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Strategic Insights Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-800/50 rounded-lg">
              <div className="text-2xl font-bold text-green-400">
                {priceComparisonData.filter(item => item.ourPrice <= item.lowestMarketPrice).length}
              </div>
              <div className="text-sm text-gray-300">Competitive Categories</div>
              <div className="text-xs text-gray-400">Categories where we match/beat market</div>
            </div>
            <div className="text-center p-4 bg-gray-800/50 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">
                {(supplierSplitData.find(item => item.name === 'Our Price')?.percentage || '0')}%
              </div>
              <div className="text-sm text-gray-300">Our Market Leadership</div>
              <div className="text-xs text-gray-400">Items where we have lowest price</div>
            </div>
            <div className="text-center p-4 bg-gray-800/50 rounded-lg">
              <div className="text-2xl font-bold text-orange-400">
                {formatCurrency(marginOpportunityData.reduce((sum, item) => sum + item.opportunityValue, 0))}
              </div>
              <div className="text-sm text-gray-300">Margin Opportunity</div>
              <div className="text-xs text-gray-400">Potential additional revenue</div>
            </div>
          </div>
        </CardContent>
      </Card>
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
    nbp: string[];
  }>({
    velocityCategory: [],
    trendDirection: [],
    winning: [],
    nbp: []
  });
  
  // Filter dropdown search states
  const [filterDropdownSearch, setFilterDropdownSearch] = useState<{
    velocityCategory: string;
    trendDirection: string;
    winning: string;
    nbp: string;
  }>({
    velocityCategory: '',
    trendDirection: '',
    winning: '',
    nbp: ''
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
          matchesFilter = item.lowestMarketPrice && item.avg_cost > item.lowestMarketPrice;
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

      const matchesNbpFilter = columnFilters.nbp.length === 0 || 
        columnFilters.nbp.includes(
          (item.nextBuyingPrice || item.nbp || item.next_cost || item.min_cost || item.last_po_cost) ? 'Available' : 'N/A'
        );

      return matchesSearch && matchesFilter && matchesVelocityFilter && matchesTrendFilter && matchesWinningFilter && matchesNbpFilter;
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
    return ['Y', 'N', '-'];
  };

  const getUniqueNbpValues = () => {
    return ['Available', 'N/A'];
  };

  // Render column header with optional filter
  const renderColumnHeader = (
    title: string,
    sortKey: string,
    filterColumn?: keyof typeof columnFilters,
    filterOptions?: string[],
    alignment: 'left' | 'center' | 'right' = 'center'
  ) => {
    const hasActiveFilter = filterColumn && columnFilters[filterColumn].length > 0;
    
    return (
      <th className="text-center p-3 text-gray-300 relative text-sm">
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
              case 'cost-disadvantage': return 'Items where our cost is above market low';
      case 'stock-risk': return 'Items with less than 2 weeks supply based on usage';
      default: return 'Filtered view of inventory items';
    }
  };

  // Calculate summary stats for filtered items
  const filteredStats = useMemo(() => {
    let totalValue;
    
    if (filterType === 'out-of-stock') {
      // Calculate lost revenue opportunity for out-of-stock items that can be replenished
      totalValue = filteredItems.reduce((sum, item) => {
        // Only calculate for items with min_cost (can be replenished)
        if (!item.min_cost || item.min_cost <= 0) return sum;
        
        // Get lowest competitor price
        const lowestComp = item.bestCompetitorPrice || item.lowestMarketPrice || item.Nupharm || item.AAH2 || item.LEXON2;
        if (!lowestComp || lowestComp <= 0) return sum;
        
        // Get average monthly usage
        const monthlyUsage = item.averageUsage || item.packs_sold_avg_last_six_months || 0;
        if (monthlyUsage <= 0) return sum;
        
        // Calculate monthly lost profit: (selling_price - cost) * monthly_usage
        const monthlyLostProfit = (lowestComp - item.min_cost) * monthlyUsage;
        return sum + Math.max(0, monthlyLostProfit); // Only add positive profits
      }, 0);
    } else {
      // Default calculation for other filter types
      totalValue = filteredItems.reduce((sum, item) => sum + (item.stockValue || 0), 0);
    }
    
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
            <div className="text-sm text-gray-400">
              {filterType === 'out-of-stock' ? 'Monthly Lost Revenue' : 'Total Value'}
            </div>
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
                    {renderColumnHeader('NBP', 'nbp', 'nbp', getUniqueNbpValues(), 'right')}
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
