import React from 'react';
import { useTimePeriod } from '@/contexts/TimePeriodContext';
import UnifiedMetricCard from './UnifiedMetricCard';

interface UnifiedSummaryMetricsProps {
  departmentFilter?: string;
  repFilter?: string;
  className?: string;
}

/**
 * Summary metrics component that uses the unified data source
 */
const UnifiedSummaryMetrics: React.FC<UnifiedSummaryMetricsProps> = ({
  departmentFilter,
  repFilter,
  className
}) => {
  // Get the current period from context
  const { currentPeriod, previousPeriod } = useTimePeriod();
  
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8 animate-slide-in-up ${className || ''}`}>
      {/* Revenue Card */}
      <UnifiedMetricCard
        title="Revenue"
        metricType="spend"
        currentPeriod={currentPeriod}
        previousPeriod={previousPeriod}
        departmentFilter={departmentFilter}
        repFilter={repFilter}
      />
      
      {/* Profit Card */}
      <UnifiedMetricCard
        title="Profit"
        metricType="profit"
        currentPeriod={currentPeriod}
        previousPeriod={previousPeriod}
        departmentFilter={departmentFilter}
        repFilter={repFilter}
        valueClassName="text-finance-red"
      />
      
      {/* Margin Card */}
      <UnifiedMetricCard
        title="Margin"
        metricType="margin"
        currentPeriod={currentPeriod}
        previousPeriod={previousPeriod}
        departmentFilter={departmentFilter}
        repFilter={repFilter}
      />
      
      {/* Packs Card */}
      <UnifiedMetricCard
        title="Packs"
        metricType="packs"
        currentPeriod={currentPeriod}
        previousPeriod={previousPeriod}
        departmentFilter={departmentFilter}
        repFilter={repFilter}
      />
    </div>
  );
};

export default UnifiedSummaryMetrics; 