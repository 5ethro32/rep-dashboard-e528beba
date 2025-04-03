
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowDown, ArrowRight, ArrowUp } from 'lucide-react';

interface ActionItemProps {
  icon: 'up' | 'down' | 'right';
  children: React.ReactNode;
}

const ActionItem: React.FC<ActionItemProps> = ({ icon, children }) => {
  return (
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 mt-1">
        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-finance-red">
          {icon === 'up' && <ArrowUp className="text-finance-red h-5 w-5" />}
          {icon === 'down' && <ArrowDown className="text-finance-red h-5 w-5" />}
          {icon === 'right' && <ArrowRight className="text-finance-red h-5 w-5" />}
        </div>
      </div>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
};

export default ActionItem;
