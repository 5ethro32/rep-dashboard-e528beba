
import React from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

export interface CellDetailItem {
  label: string;
  value: React.ReactNode;
}

export interface CellDetailsPopoverProps {
  label: string;
  value: React.ReactNode;
  items: CellDetailItem[];
}

const CellDetailsPopover: React.FC<CellDetailsPopoverProps> = ({ 
  label, 
  value, 
  items 
}) => {
  return (
    <HoverCard openDelay={100} closeDelay={100}>
      <HoverCardTrigger asChild>
        <span className="cursor-help underline decoration-dotted underline-offset-4">
          {value}
        </span>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 p-4">
        <div className="space-y-2">
          <h4 className="font-medium">{label}</h4>
          <div className="grid gap-2">
            {items.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{item.label}:</p>
                <p className="text-sm font-medium">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export default CellDetailsPopover;
