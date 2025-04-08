
import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowDown, ArrowUp, Loader2 } from 'lucide-react';

interface MetricCardProps {
  title: string;
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
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  change, 
  subtitle,
  className,
  valueClassName,
  icon,
  isLoading
}) => {
  return (
    <Card className={cn("border border-white/10 bg-gray-900/40 backdrop-blur-sm shadow-lg", className)}>
      <CardContent className="p-4 md:p-5">
        <div className="flex flex-col space-y-2">
          <div className="text-xs md:text-sm font-medium text-finance-gray uppercase tracking-wider">{title}</div>
          
          <div className="flex items-baseline gap-x-3">
            {isLoading ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                <span className="text-sm text-finance-gray">Loading...</span>
              </div>
            ) : (
              <>
                <div className={cn("text-2xl md:text-3xl font-bold", valueClassName)}>{value}</div>
                
                {change && (
                  <div className={cn(
                    "flex items-center text-xs",
                    change.type === 'increase' ? 'text-emerald-500' : 
                    change.type === 'decrease' ? 'text-finance-red' : 'text-finance-gray'
                  )}>
                    {change.type === 'increase' && <ArrowUp className="mr-1 h-3 w-3" />}
                    {change.type === 'decrease' && <ArrowDown className="mr-1 h-3 w-3" />}
                    {change.value}
                  </div>
                )}
                
                {icon && <div className="ml-auto">{icon}</div>}
              </>
            )}
          </div>
          
          {subtitle && !isLoading && (
            <div className="text-xs text-finance-gray/80">{subtitle}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricCard;
