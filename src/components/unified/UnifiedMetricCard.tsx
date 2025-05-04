import React from 'react';
import MetricCard from '@/components/MetricCard';
import { useMetricData, MetricType } from '@/hooks/use-metric-data';

interface UnifiedMetricCardProps {
  title: string;
  metricType: MetricType;
  className?: string;
  valueClassName?: string;
  icon?: React.ReactNode;
  currentPeriod?: string;
  previousPeriod?: string;
  departmentFilter?: string;
  repFilter?: string;
  showComparison?: boolean;
  formatter?: (value: number) => string;
}

/**
 * Enhanced MetricCard that automatically fetches data from the unified data source
 */
const UnifiedMetricCard: React.FC<UnifiedMetricCardProps> = ({
  title,
  metricType,
  className,
  valueClassName,
  icon,
  currentPeriod,
  previousPeriod,
  departmentFilter,
  repFilter,
  showComparison = true,
  formatter
}) => {
  // Use our hook to fetch the data
  const [metricData] = useMetricData({
    metricType,
    formatter,
    currentPeriod,
    previousPeriod,
    departmentFilter,
    repFilter
  });
  
  // Set up the change indicator for the MetricCard
  const change = showComparison && metricData.changeDirection !== 'neutral' ? {
    value: metricData.formattedChange,
    type: metricData.changeDirection
  } : undefined;
  
  // Generate subtitle showing previous period
  const subtitle = showComparison && previousPeriod && currentPeriod !== previousPeriod
    ? `${previousPeriod}: ${metricData.formattedPreviousValue}`
    : undefined;
  
  return (
    <MetricCard
      title={title}
      value={metricData.formattedValue}
      change={change}
      subtitle={subtitle}
      className={className}
      valueClassName={valueClassName}
      icon={icon}
      isLoading={metricData.isLoading}
    />
  );
};

export default UnifiedMetricCard; 