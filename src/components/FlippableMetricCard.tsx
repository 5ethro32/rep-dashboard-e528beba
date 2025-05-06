
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import MetricCard from './MetricCard';
import LineChart from './LineChart';

interface MetricHistoryData {
  name: string;
  value: number;
}

interface FlippableMetricCardProps {
  title: React.ReactNode;
  value: string;
  change?: {
    value: string;
    type: 'increase' | 'decrease' | 'neutral';
  };
  subtitle?: string;
  className?: string;
  valueClassName?: string;
  icon?: React.ReactNode;
  isLoading?: boolean;
  historyData?: MetricHistoryData[];
  metricType: 'revenue' | 'profit' | 'margin' | 'packs';
}

const FlippableMetricCard: React.FC<FlippableMetricCardProps> = ({
  title,
  value,
  change,
  subtitle,
  className,
  valueClassName,
  icon,
  isLoading,
  historyData = [],
  metricType,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleClick = () => {
    setIsFlipped(!isFlipped);
  };

  // Define chart colors based on metric type
  const getChartColor = () => {
    switch (metricType) {
      case 'profit':
        return '#ea384c';
      case 'revenue':
        return '#3b82f6';
      case 'margin':
        return '#10b981';
      case 'packs':
        return '#8b5cf6';
      default:
        return '#ea384c';
    }
  };

  // Define formatter for Y-axis based on metric type
  const getYAxisFormatter = (value: number): string => {
    switch (metricType) {
      case 'profit':
      case 'revenue':
        if (value >= 1000000) {
          return `£${(value / 1000000).toFixed(1)}m`;
        } else if (value >= 1000) {
          return `£${(value / 1000).toFixed(0)}k`;
        } else {
          return `£${value}`;
        }
      case 'margin':
        return `${value.toFixed(1)}%`;
      case 'packs':
        return value.toString();
      default:
        return value.toString();
    }
  };

  return (
    <div 
      className={cn(
        "perspective-1000 cursor-pointer w-full h-full",
        className
      )}
      onClick={handleClick}
    >
      <div 
        className={cn(
          "relative transition-transform duration-700 transform-style-preserve-3d",
          isFlipped ? "rotate-y-180" : ""
        )}
        style={{
          transformStyle: 'preserve-3d',
          transition: 'transform 0.7s',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front side */}
        <div 
          className="absolute w-full h-full backface-hidden"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <MetricCard
            title={title}
            value={value}
            change={change}
            subtitle={subtitle}
            valueClassName={valueClassName}
            icon={icon}
            isLoading={isLoading}
            className="h-full"
          />
        </div>

        {/* Back side */}
        <div 
          className="absolute w-full h-full backface-hidden rotate-y-180"
          style={{ 
            backfaceVisibility: 'hidden', 
            transform: 'rotateY(180deg)'
          }}
        >
          <Card 
            className={cn(
              "border border-white/10 bg-gray-900/40 backdrop-blur-sm shadow-lg h-full",
              "transition-all duration-300 ease-in-out",
              "hover:shadow-[0_15px_25px_rgba(0,0,0,0.2)] hover:scale-[1.02]",
              "will-change-transform"
            )}
          >
            <CardContent className="p-4 h-full flex flex-col">
              <div className="text-xs md:text-sm font-medium text-finance-gray uppercase tracking-wider mb-2">
                {title} History
              </div>
              <div className="flex-grow w-full h-32 md:h-full">
                {historyData.length > 0 ? (
                  <LineChart 
                    data={historyData}
                    color={getChartColor()}
                    showAverage={false}
                    yAxisFormatter={getYAxisFormatter}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-white/50 text-sm">
                    No historical data available
                  </div>
                )}
              </div>
              <div className="text-xs text-finance-gray/80 mt-2">
                Click to flip back
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FlippableMetricCard;
