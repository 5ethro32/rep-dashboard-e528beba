
import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface ChangeIndicatorProps {
  type: 'increase' | 'decrease' | 'neutral';
  value: string;
}

const ChangeIndicator = ({ type, value }: ChangeIndicatorProps) => {
  return (
    <div className={cn(
      "flex items-center text-xs",
      type === 'increase' ? 'text-emerald-500' : 
      type === 'decrease' ? 'text-finance-red' : 'text-finance-gray'
    )}>
      {type === 'increase' && <TrendingUp className="mr-1 h-3 w-3" />}
      {type === 'decrease' && <TrendingDown className="mr-1 h-3 w-3" />}
      {value}
    </div>
  );
};

export default ChangeIndicator;
