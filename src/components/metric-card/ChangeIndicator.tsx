
import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, MinusIcon } from 'lucide-react';

interface ChangeIndicatorProps {
  type: 'increase' | 'decrease' | 'neutral';
  value: string;
}

const ChangeIndicator = ({ type, value }: ChangeIndicatorProps) => {
  return (
    <div className={cn(
      "flex items-center text-xs font-medium py-0.5 px-1.5 rounded-md",
      type === 'increase' ? 'text-emerald-500 bg-emerald-500/10' : 
      type === 'decrease' ? 'text-finance-red bg-finance-red/10' : 'text-finance-gray bg-gray-500/10'
    )}>
      {type === 'increase' && <TrendingUp className="mr-1 h-3 w-3" />}
      {type === 'decrease' && <TrendingDown className="mr-1 h-3 w-3" />}
      {type === 'neutral' && <MinusIcon className="mr-1 h-3 w-3" />}
      {value}
    </div>
  );
};

export default ChangeIndicator;
