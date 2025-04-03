
import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowDown, ArrowUp } from 'lucide-react';

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
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  change, 
  subtitle,
  className,
  valueClassName,
  icon
}) => {
  return (
    <Card className={cn("border-0 bg-finance-darkSecondary", className)}>
      <CardContent className="p-6">
        <div className="flex flex-col space-y-2">
          <div className="text-sm text-finance-gray uppercase tracking-wider">{title}</div>
          
          <div className="flex items-baseline gap-x-3">
            <div className={cn("text-3xl font-bold", valueClassName)}>{value}</div>
            
            {change && (
              <div className={cn(
                "flex items-center text-sm",
                change.type === 'increase' ? 'text-green-500' : 
                change.type === 'decrease' ? 'text-finance-red' : 'text-finance-gray'
              )}>
                {change.type === 'increase' && <ArrowUp className="mr-1 h-3 w-3" />}
                {change.type === 'decrease' && <ArrowDown className="mr-1 h-3 w-3" />}
                {change.value}
              </div>
            )}
            
            {icon && <div className="ml-auto">{icon}</div>}
          </div>
          
          {subtitle && (
            <div className="text-xs text-finance-gray">{subtitle}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricCard;
