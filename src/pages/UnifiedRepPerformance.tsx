import React, { useState } from 'react';
import PerformanceHeader from '@/components/rep-performance/PerformanceHeader';
import PerformanceFilters from '@/components/rep-performance/PerformanceFilters';
import ActionsHeader from '@/components/rep-performance/ActionsHeader';
import UserProfileButton from '@/components/auth/UserProfileButton';
import { Button } from '@/components/ui/button';
import { BarChart3, ClipboardList, Database } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTimePeriod } from '@/contexts/TimePeriodContext';
import PeriodSelector from '@/components/ui/PeriodSelector';
import UnifiedSummaryMetrics from '@/components/unified/UnifiedSummaryMetrics';

/**
 * Rep Performance page using the new unified data structure
 */
const UnifiedRepPerformance = () => {
  const isMobile = useIsMobile();
  const { currentPeriod, previousPeriod, setPeriodsWithDefault } = useTimePeriod();
  
  // Filter states
  const [includeRetail, setIncludeRetail] = useState(true);
  const [includeReva, setIncludeReva] = useState(true);
  const [includeWholesale, setIncludeWholesale] = useState(true);
  const [departmentFilter, setDepartmentFilter] = useState<string | undefined>(undefined);
  const [autoRefreshed, setAutoRefreshed] = useState(false);
  
  // Handle refresh
  const handleRefresh = async () => {
    await setPeriodsWithDefault();
    setAutoRefreshed(true);
    
    // Clear autoRefreshed state after a delay
    setTimeout(() => {
      setAutoRefreshed(false);
    }, 3000);
  };
  
  // Derive department filter from toggle states
  React.useEffect(() => {
    if (includeRetail && !includeReva && !includeWholesale) {
      setDepartmentFilter('Retail');
    } else if (!includeRetail && includeReva && !includeWholesale) {
      setDepartmentFilter('REVA');
    } else if (!includeRetail && !includeReva && includeWholesale) {
      setDepartmentFilter('Wholesale');
    } else {
      setDepartmentFilter(undefined); // All or mixed selection
    }
  }, [includeRetail, includeReva, includeWholesale]);
  
  return (
    <div className="container max-w-7xl mx-auto px-4 md:px-6 bg-transparent overflow-x-hidden">
      <div className="flex justify-end pt-4">
        <UserProfileButton />
      </div>
      
      <PerformanceHeader 
        selectedMonth={currentPeriod}
        setSelectedMonth={() => {}}  // Handled by PeriodSelector now
      />
      
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-4">
        <ActionsHeader 
          onRefresh={handleRefresh}
          isLoading={false}
          autoRefreshed={autoRefreshed}
        />
        
        {/* Only show these buttons on non-mobile devices */}
        {!isMobile && (
          <div className="flex space-x-2">
            <Link to="/account-performance">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white/80 hover:text-white hover:bg-white/10 flex items-center"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Account Analysis
              </Button>
            </Link>
            
            <Link to="/rep-tracker">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white/80 hover:text-white hover:bg-white/10 flex items-center"
              >
                <ClipboardList className="h-4 w-4 mr-2" />
                Rep Tracker
              </Button>
            </Link>
            
            <Link to="/data-migration">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white/80 hover:text-white hover:bg-white/10 flex items-center"
              >
                <Database className="h-4 w-4 mr-2" />
                Data Migration
              </Button>
            </Link>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="md:col-span-3">
          <PerformanceFilters
            includeRetail={includeRetail}
            setIncludeRetail={setIncludeRetail}
            includeReva={includeReva}
            setIncludeReva={setIncludeReva}
            includeWholesale={includeWholesale}
            setIncludeWholesale={setIncludeWholesale}
            selectedMonth={currentPeriod}
            setSelectedMonth={() => {}}  // Handled by PeriodSelector now
          />
        </div>
        <div className="md:col-span-1">
          <PeriodSelector showComparison={true} />
        </div>
      </div>

      {/* Unified summary metrics */}
      <UnifiedSummaryMetrics 
        departmentFilter={departmentFilter}
      />
      
      {/* The rest of the page components will be added in subsequent changes */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-6 text-center">
        <h2 className="text-xl font-semibold mb-2">Data Loaded from Unified Database</h2>
        <p className="text-gray-300">
          The summary metrics above are loading data from your new unified table structure.
          The detailed rep performance data and charts will be implemented next.
        </p>
        <p className="mt-4 text-sm text-gray-400">
          Current Period: {currentPeriod || 'None'} | Comparison Period: {previousPeriod || 'None'}
        </p>
      </div>
    </div>
  );
};

export default UnifiedRepPerformance; 