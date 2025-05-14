
import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { InfoIcon } from 'lucide-react';

interface CellDetailsPopoverProps {
  label: string;
  // Changed from 'details' to 'content' to fix TypeScript errors
  content: Record<string, string>;
}

const CellDetailsPopover: React.FC<CellDetailsPopoverProps> = ({ label, content }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          className="p-0 h-auto font-normal text-right w-full justify-end hover:bg-transparent"
        >
          <span>{label}</span>
          <InfoIcon className="ml-1 h-3 w-3 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2">
        <div className="space-y-1">
          {Object.entries(content).map(([key, value]) => (
            <div key={key} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{key}:</span>
              <span className="font-medium">{value}</span>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default CellDetailsPopover;
