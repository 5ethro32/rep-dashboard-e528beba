
import React from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

export interface CellDetailItem {
  label: string;
  value: React.ReactNode;
}

export interface CellDetailsPopoverProps {
  label?: string;
  value?: React.ReactNode;
  items?: CellDetailItem[];
  children?: React.ReactNode;
  field?: string;
  item?: any;
  isColumnHeader?: boolean;
}

const CellDetailsPopover: React.FC<CellDetailsPopoverProps> = ({ 
  label, 
  value, 
  items = [],
  children,
  field,
  item,
  isColumnHeader
}) => {
  // Generate label and details based on field if provided
  const getFieldDetails = () => {
    if (!field || !item) return { displayLabel: label, displayItems: items };
    
    let displayLabel = label;
    let displayItems: CellDetailItem[] = [];
    
    // Handle specific fields with custom popover content
    switch (field) {
      case "avgCost":
        displayLabel = "Average Cost";
        displayItems = [
          { label: "Average Cost", value: item.avgCost },
          { label: "Last Purchase", value: item.lastPurchase || 'N/A' }
        ];
        break;
      case "marketLow":
        displayLabel = "Market Low";
        displayItems = [
          { label: "Market Low", value: item.marketLow },
          { label: "True Market Low", value: item.trueMarketLow || 'N/A' },
          { label: "ETH NET", value: item["ETH NET"] || 'N/A' },
          { label: "Nupharm", value: item.Nupharm || 'N/A' },
          { label: "LEXON", value: item.LEXON || 'N/A' },
          { label: "AAH", value: item.AAH || 'N/A' }
        ];
        break;
      case "trueMarketLow":
        displayLabel = "True Market Low";
        displayItems = [
          { label: "True Market Low", value: item.trueMarketLow },
          { label: "Market Low", value: item.marketLow || 'N/A' }
        ];
        break;
      case "currentREVAPrice":
        displayLabel = "Current Price";
        displayItems = [
          { label: "Current Price", value: item.currentREVAPrice },
          { label: "Previous Price", value: item.previousPrice || 'N/A' }
        ];
        break;
      case "currentREVAMargin":
        displayLabel = "Current Margin";
        displayItems = [
          { label: "Current Margin", value: item.currentREVAMargin },
          { label: "Target Margin", value: item.targetMargin || '15.0%' }
        ];
        break;
      case "proposedPrice":
        displayLabel = "Proposed Price";
        displayItems = [
          { label: "Proposed Price", value: item.proposedPrice },
          { label: "Calculated Price", value: item.calculatedPrice || item.proposedPrice },
          { label: "Current Price", value: item.currentREVAPrice || 'N/A' }
        ];
        break;
      case "proposedMargin":
        displayLabel = "Proposed Margin";
        displayItems = [
          { label: "Proposed Margin", value: item.proposedMargin },
          { label: "Current Margin", value: item.currentREVAMargin || 'N/A' },
          { label: "Target Margin", value: item.targetMargin || '15.0%' }
        ];
        break;
      default:
        // For column headers or unspecified fields, use defaults
        if (isColumnHeader) {
          displayLabel = field.charAt(0).toUpperCase() + field.slice(1);
          displayItems = [];
        } else {
          displayLabel = field;
          displayItems = [{ label: field, value: item[field] || 'N/A' }];
        }
    }
    
    return { displayLabel, displayItems };
  };
  
  const { displayLabel, displayItems } = getFieldDetails();
  const finalLabel = displayLabel || label || '';
  const finalItems = displayItems || items || [];
  
  // If children is provided, use that instead of value
  const content = children || value;
  
  if (!content && !finalItems.length) {
    // If we have neither content nor items to show, render without popover
    return <span>{value}</span>;
  }

  return (
    <HoverCard openDelay={100} closeDelay={100}>
      <HoverCardTrigger asChild>
        <span className="cursor-help underline decoration-dotted underline-offset-4">
          {content}
        </span>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 p-4">
        <div className="space-y-2">
          <h4 className="font-medium">{finalLabel}</h4>
          <div className="grid gap-2">
            {finalItems.map((item, index) => (
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
