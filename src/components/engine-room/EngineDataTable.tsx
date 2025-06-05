import React, { useState, useMemo, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, ArrowUp, ArrowDown, Star, Edit2, CheckCircle, X, Filter, TrendingUp, TrendingDown, Info, Ban, ChevronDown, ChevronUp, Pencil } from 'lucide-react';
import { TooltipProvider } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from "@/components/ui/use-toast";
import PriceEditor from './PriceEditor';
import CellDetailsPopover from './CellDetailsPopover';
import { formatPercentage as utilFormatPercentage } from '@/utils/formatting-utils';
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface EngineDataTableProps {
  data: any[];
  onShowPriceDetails: (item: any) => void;
  onPriceChange?: (item: any, newPrice: number) => void;
  onToggleStar?: (itemId: string) => void;
  starredItems?: Set<string>;
  flagFilter?: string;
  onFlagFilterChange?: (filter: string) => void;
}

// Define column configuration outside component to avoid recreation on each render
const columns = [{
  field: 'description',
  label: 'Description',
  filterable: true
}, {
  field: 'inStock',
  label: 'In Stock',
  filterable: true
}, {
  field: 'revaUsage',
  label: 'Usage',
  filterable: false
}, {
  field: 'usageRank',
  label: 'Rank',
  filterable: true
}, {
  field: 'avgCost',
  label: 'Avg Cost',
  format: (value: number) => `£${value?.toFixed(2) || '0.00'}`,
  filterable: false
}, {
  field: 'nextCost',
  label: 'Next BP', 
  filterable: false
}, {
  field: 'marketLow',
  label: 'Market Low',
  format: (value: number) => `£${value?.toFixed(2) || '0.00'}`,
  filterable: false
}, {
  field: 'trueMarketLow',
  label: 'TML',
  format: (value: number) => `£${value?.toFixed(2) || '0.00'}`,
  filterable: false
}, {
  field: 'currentREVAPrice',
  label: 'Current Price',
  format: (value: number) => `£${value?.toFixed(2) || '0.00'}`,
  filterable: false,
  bold: true
}, {
  field: 'currentREVAMargin',
  label: 'Current Margin',
  format: (value: number) => `${(value * 100)?.toFixed(2) || '0.00'}%`,
  filterable: false
}, {
  field: 'proposedPrice',
  label: 'Proposed Price',
  format: (value: number) => `£${value?.toFixed(2) || '0.00'}`,
  editable: true,
  filterable: false,
  bold: true
}, {
  field: 'priceChangePercentage',
  label: '% Change',
  filterable: false
}, {
  field: 'proposedMargin',
  label: 'Proposed Margin',
  format: (value: number) => `${(value * 100)?.toFixed(2) || '0.00'}%`,
  filterable: false
}, {
  field: 'tmlPercentage',
  label: '% vs TML',
  filterable: false
}, {
  field: 'appliedRule',
  label: 'Rule',
  filterable: true
}];

const EngineDataTable: React.FC<EngineDataTableProps> = ({
  data,
  onShowPriceDetails,
  onPriceChange,
  onToggleStar,
  starredItems = new Set(),
  flagFilter,
  onFlagFilterChange
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string>('description');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [bulkEditMode, setBulkEditMode] = useState<boolean>(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [filterByRank, setFilterByRank] = useState<string | null>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, any>>({});
  const [hideInactiveProducts, setHideInactiveProducts] = useState(false);
  const [ruleFilter, setRuleFilter] = useState<string>('all');
  const [filterDropdownSearch, setFilterDropdownSearch] = useState<Record<string, string>>({});
  const [bulkEditChanges, setBulkEditChanges] = useState<Record<string, number>>({});
  const itemsPerPage = 50;

  useEffect(() => {
    if (flagFilter && flagFilter !== 'all') {
      setColumnFilters(prev => ({...prev, flags: [flagFilter]}));
    }
  }, [flagFilter]);

  // Reset editing state when bulk edit mode is toggled off
  useEffect(() => {
    if (!bulkEditMode) {
      setEditingItemId(null);
      
      // Apply any pending bulk edits when leaving bulk edit mode
      if (Object.keys(bulkEditChanges).length > 0 && onPriceChange) {
        Object.entries(bulkEditChanges).forEach(([itemId, newPrice]) => {
          const item = data.find(i => i.id === itemId);
          if (item) {
            onPriceChange(item, newPrice);
          }
        });
        
        // Clear bulk edit changes after applying them
        setBulkEditChanges({});
        
        toast({
          title: "Bulk edit changes applied",
          description: `Applied price changes to ${Object.keys(bulkEditChanges).length} items`
        });
      }
    }
  }, [bulkEditMode, bulkEditChanges, data, onPriceChange]);

  const usageRanks = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const uniqueRanks = new Set<number>();
    data.forEach(item => {
      if (item.usageRank !== undefined && item.usageRank !== null) {
        uniqueRanks.add(item.usageRank);
      }
    });
    
    return Array.from(uniqueRanks).sort((a, b) => a - b);
  }, [data]);

  const dataWithTml = useMemo(() => {
    if (!data) return [];
    
    return data.map(item => {
      const proposedPrice = item.proposedPrice || 0;
      const tml = item.trueMarketLow || 0;
      const tmlPercentage = tml > 0 ? ((proposedPrice - tml) / tml) * 100 : 0;
      
      return {
        ...item,
        tmlPercentage
      };
    });
  }, [data]);

  const uniqueValues = useMemo(() => {
    const values: Record<string, Set<any>> = {};

    columns.forEach(column => {
      if (column.filterable) {
        values[column.field] = new Set();
      }
    });

    if (dataWithTml && dataWithTml.length > 0) {
      dataWithTml.forEach(item => {
        columns.forEach(column => {
          if (column.filterable && item[column.field] !== undefined && item[column.field] !== null) {
            values[column.field].add(item[column.field]);
          }
        });
      });
    }

    const result: Record<string, any[]> = {};
    Object.keys(values).forEach(key => {
      result[key] = Array.from(values[key]).sort((a, b) => {
        if (typeof a === 'string' && typeof b === 'string') {
          return a.localeCompare(b);
        }
        return a - b;
      });
    });
    return result;
  }, [dataWithTml]);

  const areAllValuesSelected = (field: string) => {
    const values = uniqueValues[field] || [];
    const selectedValues = columnFilters[field] || [];
    return values.length > 0 && selectedValues.length === values.length;
  };

  const uniqueFlags = useMemo(() => {
    const allFlags = new Set<string>();
    if (dataWithTml && dataWithTml.length > 0) {
      dataWithTml.forEach(item => {
        if (item.flags && Array.isArray(item.flags)) {
          item.flags.forEach((flag: string) => allFlags.add(flag));
        }
        if (item.flag && typeof item.flag === 'string' && item.flag.trim()) {
          allFlags.add(item.flag.trim());
        }
        if (item.flag1) allFlags.add('HIGH_PRICE');
        if (item.flag2) allFlags.add('LOW_MARGIN');
        if (item.shortage) allFlags.add('SHORT');
      });
    }
    return Array.from(allFlags);
  }, [dataWithTml]);

  const uniqueRules = useMemo(() => {
    const rules = new Set<string>();
    if (dataWithTml && dataWithTml.length > 0) {
      dataWithTml.forEach(item => {
        if (item.appliedRule && typeof item.appliedRule === 'string' && item.appliedRule.trim()) {
          rules.add(item.appliedRule.trim());
        }
      });
    }
    return Array.from(rules).sort();
  }, [dataWithTml]);

  const calculatePriceChangePercentage = (item: any) => {
    const currentPrice = item.currentREVAPrice || 0;
    const proposedPrice = item.proposedPrice || 0;
    if (currentPrice === 0) return 0;
    return (proposedPrice - currentPrice) / currentPrice * 100;
  };

  const filteredData = useMemo(() => {
    if (!dataWithTml) return [];
    return dataWithTml.filter(item => {
      const matchesSearch = item.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
      const matchesRankFilter = !filterByRank || filterByRank === 'all' ? true : item.usageRank === parseInt(filterByRank, 10);
      const matchesRuleFilter = ruleFilter === 'all' ? true : item.appliedRule === ruleFilter;
      const matchesColumnFilters = Object.keys(columnFilters).every(field => {
        if (!columnFilters[field] || columnFilters[field].length === 0) {
          return true;
        }
        if (areAllValuesSelected(field)) {
          return true;
        }
        if (field === 'flags') {
          if (Array.isArray(item.flags)) {
            return columnFilters[field].some((flag: string) => item.flags.includes(flag) || flag === 'HIGH_PRICE' && item.flag1 || flag === 'LOW_MARGIN' && item.flag2 || flag === 'SHORT' && item.shortage);
          } else {
            return columnFilters[field].some((flag: string) => flag === 'HIGH_PRICE' && item.flag1 || flag === 'LOW_MARGIN' && item.flag2 || flag === 'SHORT' && item.shortage);
          }
        }
        return columnFilters[field].includes(item[field]);
      });
      const isActive = !hideInactiveProducts || item.inStock > 0 || item.onOrder > 0 || item.revaUsage > 0;
      return matchesSearch && matchesRankFilter && matchesRuleFilter && matchesColumnFilters && isActive;
    });
  }, [dataWithTml, searchQuery, filterByRank, ruleFilter, columnFilters, hideInactiveProducts]);

  const sortedData = useMemo(() => {
    if (!filteredData) return [];
    return [...filteredData].sort((a, b) => {
      let fieldA = a[sortField];
      let fieldB = b[sortField];

      if (sortField === 'priceChangePercentage') {
        const aChange = calculatePriceChangePercentage(a);
        const bChange = calculatePriceChangePercentage(b);
        return sortDirection === 'asc' ? aChange - bChange : bChange - aChange;
      }

      if (fieldA === undefined || fieldA === null) fieldA = sortField.includes('Price') ? 0 : '';
      if (fieldB === undefined || fieldB === null) fieldB = sortField.includes('Price') ? 0 : '';

      if (typeof fieldA === 'string' && typeof fieldB === 'string') {
        return sortDirection === 'asc' ? fieldA.localeCompare(fieldB) : fieldB.localeCompare(fieldA);
      } else {
        if (typeof fieldA !== typeof fieldB) {
          if (typeof fieldA === 'string') {
            return sortDirection === 'asc' ? fieldA.localeCompare(String(fieldB)) : String(fieldB).localeCompare(fieldA);
          } else if (typeof fieldB === 'string') {
            return sortDirection === 'asc' ? String(fieldA).localeCompare(fieldB) : fieldB.localeCompare(String(fieldA));
          }
        }
        return sortDirection === 'asc' ? (Number(fieldA) || 0) - (Number(fieldB) || 0) : (Number(fieldB) || 0) - (Number(fieldA) || 0);
      }
    });
  }, [filteredData, sortField, sortDirection]);

  const totalPages = Math.ceil((sortedData?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData && sortedData.length > 0 ? sortedData.slice(startIndex, startIndex + itemsPerPage) : [];

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleFilterChange = (field: string, value: any, isSelectAll: boolean = false) => {
    setColumnFilters(prev => {
      if (isSelectAll) {
        const allValues = uniqueValues[field] || [];
        const currentValues = prev[field] || [];
        const newFilter = currentValues.length === allValues.length ? [] : [...allValues];
        return {
          ...prev,
          [field]: newFilter
        };
      } else {
        const current = prev[field] || [];
        const allValues = uniqueValues[field] || [];
        if (current.length === allValues.length && current.includes(value)) {
          return {
            ...prev,
            [field]: current.filter(v => v !== value)
          };
        }
        const newFilter = current.includes(value) 
          ? current.filter(v => v !== value) 
          : [...current, value];
        return {
          ...prev,
          [field]: newFilter
        };
      }
    });
    setCurrentPage(1);
  };

  const handleFilterSearchChange = (field: string, searchValue: string) => {
    setFilterDropdownSearch(prev => ({
      ...prev,
      [field]: searchValue.toLowerCase()
    }));
  };

  const getFilteredOptions = (field: string) => {
    const searchValue = filterDropdownSearch[field] || '';
    const values = uniqueValues[field] || [];
    
    if (!searchValue) {
      return values;
    }
    
    return values.filter(value => {
      const stringValue = String(value).toLowerCase();
      return stringValue.includes(searchValue);
    });
  };

  const formatCurrency = (value: number | null | undefined, noMarketPrice?: boolean) => {
    if (noMarketPrice || value === 0) {
      return <span className="text-gray-400 italic">£0.00</span>;
    }
    if (value === null || value === undefined) {
      return '£0.00';
    }
    return `£${value.toFixed(2)}`;
  };

  const formatTMLPercentage = (percentage: number | null | undefined) => {
    if (percentage === null || percentage === undefined) {
      return '0.00%';
    }
    
    const formattedValue = percentage.toFixed(2) + '%';
    
    if (percentage > 15) {
      return <span className="text-red-400">{formattedValue}</span>;
    } else if (percentage > 5) {
      return <span className="text-amber-400">{formattedValue}</span>;
    } else if (percentage < -5) {
      return <span className="text-green-400">{formattedValue}</span>;
    }
    
    return formattedValue;
  };

  const formatNextBuyingPrice = (item: any) => {
    if (item.nextCostMissing) {
      return <span className="text-blue-400 italic">£0.00</span>;
    }
    return `£${(item.nextCost || 0).toFixed(2)}`;
  };

  const formatPercentage = (value: number | null | undefined) => {
    if (value === null || value === undefined) {
      return '0.00%';
    }
    return `${(value * 100).toFixed(2)}%`;
  };

  const formatCurrentMargin = (value: number | null | undefined) => {
    if (value === null || value === undefined) {
      return '0.00%';
    }
    return `${value.toFixed(2)}%`;
  };

  const renderSortIndicator = (field: string) => {
    if (field !== sortField) return null;
    return sortDirection === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  const toggleHideInactiveProducts = () => {
    setHideInactiveProducts(!hideInactiveProducts);
  };

  // Handle starting price edit for an individual item
  const handleStartEdit = (itemId: string) => {
    if (editingItemId === itemId) {
      setEditingItemId(null);
    } else {
      setEditingItemId(itemId);
    }
  };

  // Handle price change in bulk edit mode
  const handleBulkPriceChange = (itemId: string, newPrice: number) => {
    setBulkEditChanges(prev => ({
      ...prev,
      [itemId]: newPrice
    }));
  };

  // Toggle bulk edit mode
  const toggleBulkEditMode = () => {
    if (bulkEditMode) {
      // When exiting bulk edit mode, apply all changes
      if (Object.keys(bulkEditChanges).length > 0 && onPriceChange) {
        Object.entries(bulkEditChanges).forEach(([itemId, newPrice]) => {
          const item = data.find(i => i.id === itemId);
          if (item) {
            onPriceChange(item, newPrice);
          }
        });
        
        toast({
          title: "Bulk edit changes applied",
          description: `Applied price changes to ${Object.keys(bulkEditChanges).length} items`
        });
        
        // Clear bulk edit changes
        setBulkEditChanges({});
      }
    }
    
    setBulkEditMode(!bulkEditMode);
    setEditingItemId(null); // Clear any individual editing when toggling bulk mode
  };

  const renderColumnHeader = (column: any) => {
    return (
      <div className="flex items-center justify-between">
        <div 
          className="flex items-center cursor-pointer" 
          onClick={() => handleSort(column.field)}
        >
          {column.label}
          {renderSortIndicator(column.field)}
        </div>
        
        {column.filterable && uniqueValues[column.field]?.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className={`h-6 w-6 p-0 ml-2 ${columnFilters[column.field]?.length && !areAllValuesSelected(column.field) ? 'bg-primary/20' : ''}`} 
                onClick={e => e.stopPropagation()}
              >
                <Filter className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 max-h-80 overflow-y-auto bg-gray-900 border border-gray-700">
              <div className="p-2">
                <p className="text-sm font-medium">Filter by {column.label}</p>
                <Input 
                  placeholder="Search..." 
                  className="h-8 mt-2" 
                  value={filterDropdownSearch[column.field] || ''}
                  onChange={e => handleFilterSearchChange(column.field, e.target.value)} 
                />
              </div>
              <DropdownMenuSeparator />
              <div className="p-1 border-b border-gray-700">
                <div 
                  className="px-2 py-1.5 flex items-center gap-2 cursor-pointer hover:bg-gray-800 rounded-sm"
                  onClick={(e) => {
                    e.preventDefault();
                    handleFilterChange(column.field, null, true);
                  }}
                >
                  <Checkbox 
                    checked={areAllValuesSelected(column.field)} 
                    className="data-[state=checked]:bg-blue-600" 
                  />
                  <span className="text-sm font-medium">Select All</span>
                </div>
              </div>
              {getFilteredOptions(column.field).map((value, i) => (
                <DropdownMenuCheckboxItem 
                  key={i} 
                  checked={columnFilters[column.field]?.includes(value)} 
                  onSelect={e => {
                    e.preventDefault();
                    handleFilterChange(column.field, value);
                  }}
                >
                  {value !== null && value !== undefined ? typeof value === 'number' ? value.toString() : value : '(Empty)'}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  };

  const renderFlagsColumnHeader = () => {
    return <div className="flex items-center justify-between">
        <span>Flags</span>
        {uniqueFlags.length > 0 && <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className={`h-6 w-6 p-0 ml-2 ${columnFilters['flags']?.length && !areAllValuesSelected('flags') ? 'bg-primary/20' : ''}`}
              >
                <Filter className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 bg-gray-900 border border-gray-700">
              <div className="p-2">
                <p className="text-sm font-medium">Filter by Flags</p>
                <Input 
                  placeholder="Search..." 
                  className="h-8 mt-2" 
                  value={filterDropdownSearch['flags'] || ''}
                  onChange={e => handleFilterSearchChange('flags', e.target.value)} 
                />
              </div>
              <DropdownMenuSeparator />
              <div className="p-1 border-b border-gray-700">
                <div 
                  className="px-2 py-1.5 flex items-center gap-2 cursor-pointer hover:bg-gray-800 rounded-sm"
                  onClick={(e) => {
                    e.preventDefault();
                    handleFilterChange('flags', null, true);
                  }}
                >
                  <Checkbox 
                    checked={areAllValuesSelected('flags')} 
                    className="data-[state=checked]:bg-blue-600"
                  />
                  <span className="text-sm font-medium">Select All</span>
                </div>
              </div>
              {(filterDropdownSearch['flags'] ? uniqueFlags.filter(flag => 
                flag.toLowerCase().includes(filterDropdownSearch['flags'] || '')) 
                : uniqueFlags).map((flag, i) => (
                <DropdownMenuCheckboxItem 
                  key={i} 
                  checked={columnFilters['flags']?.includes(flag)} 
                  onSelect={e => {
                    e.preventDefault();
                    handleFilterChange('flags', flag);
                  }}
                >
                  {flag}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>}
      </div>;
  };

  const formatRuleDisplay = (rule: string) => {
    if (!rule) return '';

    const rulePattern = /Grp\s*(\d+)-(\d+)/i;
    const match = rule.match(rulePattern);
    if (match) {
      return `[${match[1]}.${match[2]}]`;
    }
    return rule;
  };

  const renderFlags = (item: any) => {
    if (!item) return null;
    const flags = [];
    if (item.flag1) {
      flags.push(<span key="high-price" className="bg-red-900/30 text-xs px-2 py-0.5 rounded-md text-red-300" title="Price ≥10% above TRUE MARKET LOW">
        High Price
      </span>);
    }
    if (item.flag2) {
      flags.push(<span key="low-margin" className="bg-orange-900/30 text-xs px-2 py-0.5 rounded-md text-orange-300" title="Margin < 5%">
        Low Margin
      </span>);
    }
    if (item.shortage) {
      flags.push(<span key="short" className="bg-purple-900/30 text-xs px-2 py-0.5 rounded-md text-purple-300" title="Product has supply shortage">
        Short
      </span>);
    }
    if (item.missingNextBuying) {
      flags.push(<span key="missing-nbp" className="bg-blue-900/30 text-xs px-2 py-0.5 rounded-md text-blue-300" title="Missing Next Buying Price">
        No NBP
      </span>);
    }
    
    if (item.noMarketPrice || (item.flags && item.flags.includes('No Market Price Available'))) {
      flags.push(<span key="no-market-price" className="bg-blue-900/30 text-xs px-2 py-0.5 rounded-md text-blue-300 flex items-center gap-1" title="No Market Price Available">
        <Ban className="h-3 w-3" /> No MP
      </span>);
    }
    
    if (item.flags && Array.isArray(item.flags)) {
      item.flags.forEach((flag: string, i: number) => {
        if (flag === 'HIGH_PRICE' || flag === 'LOW_MARGIN' || flag === 'SHORT' || flag === 'No Market Price Available') return;
        
        if (flag.startsWith('PRICE_DECREASE_')) {
          const percentage = flag.replace('PRICE_DECREASE_', '');
          flags.push(
            <span 
              key={`price-decrease-${i}`} 
              className="bg-red-900/30 text-xs px-2 py-0.5 rounded-md text-red-300 flex items-center gap-1" 
              title={`Price decrease of ${percentage}`}
            >
              <TrendingDown className="h-3 w-3" /> ↓{percentage}
            </span>
          );
        } else {
          flags.push(<span key={`flag-${i}`} className="bg-blue-900/30 text-xs px-2 py-0.5 rounded-md text-blue-300" title={flag}>
              {flag}
            </span>);
        }
      });
    }
    return flags.length > 0 ? <div className="flex flex-wrap gap-1">{flags}</div> : null;
  };

  const summarizeNumericFilters = (values: any[]) => {
    if (!values || values.length === 0) return null;
    
    const allNumbers = values.every(value => !isNaN(Number(value)));
    if (!allNumbers) return null;
    
    const numberValues = values.map(v => Number(v)).sort((a, b) => a - b);
    
    if (numberValues.length > 3) {
      const min = Math.min(...numberValues);
      const max = Math.max(...numberValues);
      if (max - min + 1 === numberValues.length) {
        return `${min} - ${max}`;
      }
    }
    
    return null;
  };

  const renderActiveFilters = () => {
    const activeFilters = Object.entries(columnFilters)
      .filter(([field, values]) => {
        return values && Array.isArray(values) && values.length > 0 && !areAllValuesSelected(field);
      })
      .map(([field, values]) => {
        const column = columns.find(col => col.field === field);
        const label = column ? column.label : field === 'flags' ? 'Flags' : field;
        return {
          field,
          label,
          values: Array.isArray(values) ? values : [values]
        };
      });
      
    if (activeFilters.length === 0) return null;
    
    return (
      <div className="my-2 bg-gray-900/20 p-3 rounded-md">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">Active filters:</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 p-1 text-xs" 
            onClick={() => setColumnFilters({})}
          >
            Clear all
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter, i) => {
            const numericSummary = summarizeNumericFilters(filter.values);
            const hasMany = filter.values.length > 3 && !numericSummary;
            
            return (
              <div key={i} className="bg-gray-800/70 rounded-lg p-1.5">
                {!hasMany ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-gray-300">{filter.label}:</span>
                    <div className="flex flex-wrap gap-1">
                      {numericSummary ? (
                        <Badge variant="outline" className="bg-gray-700/50 text-gray-200 gap-1 px-1.5 py-0.5 h-5">
                          {numericSummary}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-3 w-3 p-0 ml-1" 
                            onClick={() => {
                              setColumnFilters(prev => {
                                const newFilters = {...prev};
                                delete newFilters[filter.field];
                                return newFilters;
                              });
                            }}
                          >
                            <X className="h-2 w-2" />
                          </Button>
                        </Badge>
                      ) : (
                        filter.values.map((value, j) => (
                          <Badge key={j} variant="outline" className="bg-gray-700/50 text-gray-200 gap-1 px-1.5 py-0.5 h-5">
                            {value !== null && value !== undefined ? typeof value === 'number' ? value.toString() : value : '(Empty)'}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-3 w-3 p-0 ml-1" 
                              onClick={() => handleFilterChange(filter.field, value)}
                            >
                              <X className="h-2 w-2" />
                            </Button>
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  <Collapsible>
                    <div className="flex items-center">
                      <span className="text-xs font-medium text-gray-300 mr-1">{filter.label}:</span>
                      <Badge variant="secondary" className="bg-blue-900/30 text-blue-300 mr-2">
                        {filter.values.length} selected
                      </Badge>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </CollapsibleTrigger>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-5 w-5 p-0 ml-1" 
                        onClick={() => {
                          setColumnFilters(prev => {
                            const newFilters = {...prev};
                            delete newFilters[filter.field];
                            return newFilters;
                          });
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <CollapsibleContent>
                      <div className="flex flex-wrap gap-1 mt-1 max-h-20 overflow-y-auto">
                        {filter.values.map((value, j) => (
                          <Badge key={j} variant="outline" className="bg-gray-700/50 text-gray-200 gap-1 px-1.5 py-0.5 h-5">
                            {value}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-3 w-3 p-0 ml-1" 
                              onClick={() => handleFilterChange(filter.field, value)}
                            >
                              <X className="h-2 w-2" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderUnifiedFilterBar = () => {
    return (
      <div className="flex flex-wrap gap-4 items-center mb-4">
        <div className="relative flex-1 min-w-[150px] max-w-[250px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search..." 
            className="pl-8" 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
          />
        </div>
        
        <Select value={filterByRank || 'all'} onValueChange={value => setFilterByRank(value === 'all' ? null : value)}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="All Ranks" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ranks</SelectItem>
            {usageRanks.map(rank => (
              <SelectItem key={rank} value={rank.toString()}>
                Rank {rank}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={columnFilters['flags']?.[0] || 'all'} onValueChange={value => {
          if (value === 'all') {
            setColumnFilters(prev => {
              const newFilters = {...prev};
              delete newFilters['flags'];
              return newFilters;
            });
            if (onFlagFilterChange) onFlagFilterChange('all');
          } else {
            setColumnFilters(prev => ({...prev, flags: [value]}));
            if (onFlagFilterChange) onFlagFilterChange(value);
          }
        }}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="All Flags" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Flags</SelectItem>
            {uniqueFlags.map(flag => (
              <SelectItem key={flag} value={flag}>
                {flag === 'HIGH_PRICE' ? 'High Price' : 
                 flag === 'LOW_MARGIN' ? 'Low Margin' : flag}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={ruleFilter} onValueChange={setRuleFilter}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="All Rules" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Rules</SelectItem>
            {uniqueRules.map(rule => (
              <SelectItem key={rule} value={rule}>
                {formatRuleDisplay(rule)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <div className="flex items-center space-x-2">
          <Switch 
            id="hideInactive" 
            checked={hideInactiveProducts}
            onCheckedChange={setHideInactiveProducts}
          />
          <label htmlFor="hideInactive" className="text-sm cursor-pointer">
            Hide Inactive
          </label>
        </div>
        
        {/* Add bulk edit mode toggle button */}
        <Button 
          variant={bulkEditMode ? "destructive" : "outline"}
          size="sm"
          onClick={toggleBulkEditMode}
          className="ml-auto"
        >
          {bulkEditMode ? "Exit Bulk Edit" : "Bulk Edit"}
        </Button>
        
        {starredItems && starredItems.size > 0 && (
          <div className="flex items-center space-x-2 ml-2">
            <Star className="h-4 w-4 text-yellow-400" />
            <span className="text-sm">
              {starredItems.size} starred
            </span>
          </div>
        )}
      </div>
    );
  };

  const renderDataTable = () => {
    return (
      <div className="rounded-md border">
        <div className="h-[800px] overflow-y-auto overflow-x-auto transform scale-75 origin-top-left" style={{ width: '133.33%' }}>
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map(column => (
                  <TableHead key={column.field} className="cursor-pointer hover:bg-gray-900/90">
                    {renderColumnHeader(column)}
                  </TableHead>
                ))}
                <TableHead>
                  {renderFlagsColumnHeader()}
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length + 2} className="text-center py-10">
                    No items found matching your search criteria
                  </TableCell>
                </TableRow>
              )}
              {paginatedData.map((item, index) => {
                const priceChangePercentage = calculatePriceChangePercentage(item);
                const isEditingThisItem = editingItemId === item.id;
                
                return (
                  <TableRow 
                    key={index} 
                    className={`${item.noMarketPrice ? 'bg-blue-900/10' : ''} ${item.flag1 || item.flag2 || item.flags && item.flags.length > 0 ? 'bg-red-900/20' : ''} ${item.priceModified ? 'bg-blue-900/20' : ''}`}
                  >
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{item.inStock}</TableCell>
                    <TableCell>{item.revaUsage}</TableCell>
                    <TableCell>{item.usageRank}</TableCell>
                    
                    <TableCell>
                      <CellDetailsPopover item={item} field="avgCost">
                        {formatCurrency(item.avgCost)}
                      </CellDetailsPopover>
                    </TableCell>
                    
                    <TableCell>
                      <CellDetailsPopover item={item} field="nextCost">
                        {formatNextBuyingPrice(item)}
                      </CellDetailsPopover>
                    </TableCell>
                    
                    <TableCell>
                      <CellDetailsPopover item={item} field="marketLow">
                        <div className="flex items-center gap-1">
                          {formatCurrency(item.marketLow, item.noMarketPrice)}
                          {item.marketTrend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                          {item.marketTrend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                        </div>
                      </CellDetailsPopover>
                    </TableCell>
                    
                    <TableCell>
                      <CellDetailsPopover item={item} field="trueMarketLow">
                        {formatCurrency(item.trueMarketLow, item.noMarketPrice)}
                      </CellDetailsPopover>
                    </TableCell>
                    
                    <TableCell>
                      <CellDetailsPopover item={item} field="currentREVAPrice">
                        <span className="font-medium">{formatCurrency(item.currentREVAPrice)}</span>
                      </CellDetailsPopover>
                    </TableCell>
                    
                    <TableCell>
                      <CellDetailsPopover item={item} field="currentREVAMargin">
                        {formatCurrentMargin(item.currentREVAMargin)}
                      </CellDetailsPopover>
                    </TableCell>
                    
                    <TableCell>
                      {/* Price editing */}
                      {bulkEditMode ? (
                        // Bulk edit mode - all cells show editor
                        <PriceEditor
                          initialPrice={bulkEditChanges[item.id] ?? item.proposedPrice}
                          currentPrice={item.currentREVAPrice}
                          calculatedPrice={item.calculatedPrice || item.currentREVAPrice}
                          cost={item.avgCost}
                          onSave={(newPrice) => handleBulkPriceChange(item.id, newPrice)}
                          onCancel={() => {
                            // Remove from bulk edits if cancelled
                            setBulkEditChanges(prev => {
                              const newChanges = {...prev};
                              delete newChanges[item.id];
                              return newChanges;
                            });
                          }}
                          compact={true}
                        />
                      ) : isEditingThisItem && onPriceChange ? (
                        // Individual edit mode - only show editor for the selected item
                        <PriceEditor
                          initialPrice={item.proposedPrice}
                          currentPrice={item.currentREVAPrice}
                          calculatedPrice={item.calculatedPrice || item.currentREVAPrice}
                          cost={item.avgCost}
                          onSave={(newPrice) => {
                            onPriceChange(item, newPrice);
                            setEditingItemId(null);
                          }}
                          onCancel={() => setEditingItemId(null)}
                          compact={true}
                        />
                      ) : (
                        // Display mode
                        <CellDetailsPopover item={item} field="proposedPrice">
                          <div className="flex items-center gap-2 group">
                            <span className="font-medium">{formatCurrency(item.proposedPrice)}</span>
                            {item.priceModified && <CheckCircle className="h-3 w-3 text-blue-400" />}
                            {onPriceChange && !bulkEditMode && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartEdit(item.id);
                                }}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </CellDetailsPopover>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      {priceChangePercentage !== 0 && (
                        <span className={priceChangePercentage > 0 ? "text-green-400" : "text-red-400"}>
                          {priceChangePercentage > 0 ? "+" : ""}{priceChangePercentage.toFixed(2)}%
                        </span>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <CellDetailsPopover item={item} field="proposedMargin">
                        {formatPercentage(item.proposedMargin)}
                      </CellDetailsPopover>
                    </TableCell>
                    
                    <TableCell>
                      <CellDetailsPopover item={item} field="tmlPercentage">
                        {formatTMLPercentage(item.tmlPercentage)}
                      </CellDetailsPopover>
                    </TableCell>
                    
                    <TableCell>{formatRuleDisplay(item.appliedRule)}</TableCell>
                    
                    <TableCell>{renderFlags(item)}</TableCell>
                    
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6" 
                          onClick={() => onShowPriceDetails(item)} 
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                        {onToggleStar && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleStar(item.id);
                            }}
                            className="h-6 w-6"
                          >
                            <Star 
                              className={`h-4 w-4 ${starredItems.has(item.id) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                            />
                          </Button>
                        )}
                        {!bulkEditMode && onPriceChange && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartEdit(item.id);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    return (
      <div className="flex items-center justify-between mt-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <div className="text-sm">
          Page {currentPage} of {totalPages} 
          ({sortedData.length} items)
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
          disabled={currentPage === totalPages || totalPages === 0}
        >
          Next
        </Button>
      </div>
    );
  };

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {renderUnifiedFilterBar()}
        
        {renderActiveFilters()}
        
        {renderDataTable()}
        
        {totalPages > 1 && (
          <div className="flex items-center justify-between py-2">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedData.length)} of {sortedData.length} items
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default EngineDataTable;
