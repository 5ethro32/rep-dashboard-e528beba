
import React from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

interface PricingRuleToggleProps {
  activeRule: string;
  onRuleChange: (rule: string) => void;
}

const PricingRuleToggle: React.FC<PricingRuleToggleProps> = ({ activeRule, onRuleChange }) => {
  return (
    <div className="flex items-center space-x-2 mb-4">
      <span className="text-sm font-medium">Pricing Rule:</span>
      <ToggleGroup type="single" value={activeRule} onValueChange={(value) => value && onRuleChange(value)}>
        <ToggleGroupItem value="current" aria-label="Current REVA Pricing">
          Current
        </ToggleGroupItem>
        <ToggleGroupItem value="rule1" aria-label="Rule 1 - Market-based Pricing">
          Rule 1
        </ToggleGroupItem>
        <ToggleGroupItem value="rule2" aria-label="Rule 2 - Margin-based Pricing">
          Rule 2
        </ToggleGroupItem>
        <ToggleGroupItem value="combined" aria-label="Combined Rules">
          Combined
        </ToggleGroupItem>
      </ToggleGroup>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="inline-flex items-center justify-center rounded-full w-5 h-5 bg-gray-800 text-gray-200 hover:bg-gray-700">
              <Info className="h-3 w-3" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs max-w-xs">
              <strong>Current</strong>: Shows metrics based on current REVA prices<br />
              <strong>Rule 1</strong>: Market-based pricing with margin caps<br />
              <strong>Rule 2</strong>: Margin-based pricing (min 5%)<br />
              <strong>Combined</strong>: Both rules applied
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default PricingRuleToggle;
