import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Building2, Phone, Check } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import DailyDatePicker from './DailyDatePicker';
import { 
  DateRange, 
  DailyFilterOptions 
} from '@/types/daily-rep-performance.types';

interface DailyPerformanceFiltersProps {
  dateRange: DateRange;
  onDateRangeChange: (dateRange: DateRange) => void;
  filters: DailyFilterOptions;
  onFiltersChange: (filters: Partial<DailyFilterOptions>) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  isRefreshing?: boolean;
  totalRecords?: number;
}

const DailyPerformanceFilters: React.FC<DailyPerformanceFiltersProps> = ({
  dateRange,
  onDateRangeChange,
  filters,
  onFiltersChange,
  onRefresh,
  isLoading = false,
  isRefreshing = false,
  totalRecords = 0
}) => {
  const isMobile = useIsMobile();
  const [isDepartmentOpen, setIsDepartmentOpen] = useState(false);
  const [isMethodOpen, setIsMethodOpen] = useState(false);
  const departmentRef = useRef<HTMLDivElement>(null);
  const methodRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (departmentRef.current && !departmentRef.current.contains(event.target as Node)) {
        setIsDepartmentOpen(false);
      }
      if (methodRef.current && !methodRef.current.contains(event.target as Node)) {
        setIsMethodOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Department options
  const departmentOptions = [
    { key: 'includeRetail', label: 'Retail', checked: filters.includeRetail },
    { key: 'includeReva', label: 'REVA', checked: filters.includeReva },
    { key: 'includeWholesale', label: 'Wholesale', checked: filters.includeWholesale }
  ];

  // Method options
  const methodOptions = [
    { key: 'includeEdi', label: 'EDI', checked: filters.includeEdi },
    { key: 'includeTelesales', label: 'Telesales', checked: filters.includeTelesales }
  ];

  // Get selected department labels
  const getSelectedDepartments = () => {
    return departmentOptions
      .filter(option => option.checked)
      .map(option => option.label);
  };

  // Get selected method labels
  const getSelectedMethods = () => {
    return methodOptions
      .filter(option => option.checked)
      .map(option => option.label);
  };

  // Get department button text
  const getDepartmentButtonText = () => {
    const selectedCount = getSelectedDepartments().length;
    const totalCount = departmentOptions.length;
    
    if (selectedCount === 0) {
      return 'Select departments';
    } else if (selectedCount === totalCount) {
      return 'All Departments';
    } else {
      return `${selectedCount} Department${selectedCount > 1 ? 's' : ''}`;
    }
  };

  // Get method button text
  const getMethodButtonText = () => {
    const selectedCount = getSelectedMethods().length;
    const totalCount = methodOptions.length;
    
    if (selectedCount === 0) {
      return 'Select methods';
    } else if (selectedCount === totalCount) {
      return 'All Methods';
    } else {
      return `${selectedCount} Method${selectedCount > 1 ? 's' : ''}`;
    }
  };

  // Handle department change
  const handleDepartmentChange = (key: string, checked: boolean) => {
    onFiltersChange({ [key]: checked });
  };

  // Handle method change
  const handleMethodChange = (key: string, checked: boolean) => {
    onFiltersChange({ [key]: checked });
  };

  return (
    <div className="space-y-4">
      {/* Main Filters Row */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 items-start">
        {/* Date Range */}
        <div className="flex-shrink-0">
          <DailyDatePicker
            value={dateRange}
            onChange={onDateRangeChange}
            disabled={isLoading}
            showShortcuts={true}
          />
        </div>

        {/* Department Filter */}
        <div className="flex-shrink-0 relative" ref={departmentRef}>
          <button
            type="button"
            onClick={() => {
              setIsDepartmentOpen(!isDepartmentOpen);
              setIsMethodOpen(false); // Close other dropdown
            }}
            disabled={isLoading}
            className={`
              flex items-center gap-2 text-gray-400 hover:text-white transition-colors 
              focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed
              text-sm font-medium
            `}
          >
            <span className="text-white">
              {getDepartmentButtonText()}
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform ${isDepartmentOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Department Dropdown */}
          {isDepartmentOpen && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl z-50">
              <div className="p-2 space-y-1">
                {departmentOptions.map((option) => (
                  <button
                    key={option.key}
                    onClick={() => handleDepartmentChange(option.key, !option.checked)}
                    className={`
                      w-full flex items-center justify-between px-3 py-2.5 rounded-md transition-all duration-200
                      text-sm font-medium text-left
                      ${option.checked 
                        ? 'bg-finance-red/20 text-finance-red border border-finance-red/30' 
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 hover:text-white border border-transparent'
                      }
                    `}
                  >
                    <span>{option.label}</span>
                    {option.checked && (
                      <Check className="h-4 w-4 text-finance-red" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Department Selection Display */}
          {getSelectedDepartments().length > 0 && (
            <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
              <div className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                <span>{getSelectedDepartments().join(', ')}</span>
              </div>
            </div>
          )}
        </div>

        {/* Method Filter */}
        <div className="flex-shrink-0 relative" ref={methodRef}>
          <button
            type="button"
            onClick={() => {
              setIsMethodOpen(!isMethodOpen);
              setIsDepartmentOpen(false); // Close other dropdown
            }}
            disabled={isLoading}
            className={`
              flex items-center gap-2 text-gray-400 hover:text-white transition-colors 
              focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed
              text-sm font-medium
            `}
          >
            <span className="text-white">
              {getMethodButtonText()}
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform ${isMethodOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Method Dropdown */}
          {isMethodOpen && (
            <div className="absolute top-full left-0 mt-2 w-40 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl z-50">
              <div className="p-2 space-y-1">
                {methodOptions.map((option) => (
                  <button
                    key={option.key}
                    onClick={() => handleMethodChange(option.key, !option.checked)}
                    className={`
                      w-full flex items-center justify-between px-3 py-2.5 rounded-md transition-all duration-200
                      text-sm font-medium text-left
                      ${option.checked 
                        ? 'bg-finance-red/20 text-finance-red border border-finance-red/30' 
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 hover:text-white border border-transparent'
                      }
                    `}
                  >
                    <span>{option.label}</span>
                    {option.checked && (
                      <Check className="h-4 w-4 text-finance-red" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Method Selection Display */}
          {getSelectedMethods().length > 0 && (
            <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
              <div className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                <span>{getSelectedMethods().join(', ')}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filter Summary */}
      <div className="flex items-center gap-4 text-xs text-gray-400">
        {totalRecords > 0 && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full"></span>
            <span>{totalRecords.toLocaleString()} records</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyPerformanceFilters; 