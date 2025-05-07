
import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import LoadingState from './metric-card/LoadingState';
import ChangeIndicator from './metric-card/ChangeIndicator';

interface MetricCardProps {
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
  iconPosition?: 'left' | 'right';
  iconClassName?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  change, 
  subtitle,
  className,
  valueClassName,
  icon,
  isLoading = false,
  iconPosition = 'right',
  iconClassName
}) => {
  return (
    <Card 
      className={cn(
        "border border-white/10 bg-gray-900/40 backdrop-blur-sm shadow-lg",
        "transition-all duration-300 ease-in-out",
        "hover:shadow-[0_15px_25px_rgba(0,0,0,0.2)] hover:scale-[1.02]",
        "will-change-transform",
        className
      )}
    >
      <CardContent className="p-4 md:p-5 relative overflow-hidden">
        {/* Top section with title and icon */}
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs md:text-sm font-medium text-finance-gray uppercase tracking-wider">
            {title}
          </div>
          
          {icon && iconPosition === 'right' && (
            <div className={cn(
              "flex-shrink-0 text-finance-red",
              iconClassName
            )}>
              {icon}
            </div>
          )}
        </div>
        
        {/* Middle section with value and change indicator */}
        <div className="flex items-baseline gap-x-3">
          {isLoading ? (
            <LoadingState />
          ) : (
            <>
              {icon && iconPosition === 'left' && (
                <div className={cn(
                  "flex-shrink-0 text-finance-red mr-2",
                  iconClassName
                )}>
                  {icon}
                </div>
              )}
              
              <div className={cn("text-2xl md:text-3xl font-bold", valueClassName)}>
                {value}
              </div>
              
              {change && <ChangeIndicator type={change.type} value={change.value} />}
            </>
          )}
        </div>
        
        {/* Bottom section with subtitle */}
        {subtitle && !isLoading && (
          <div className="text-xs text-finance-gray/80 mt-1">{subtitle}</div>
        )}
      </CardContent>
    </Card>
  );
};

export default MetricCard;
