
import React from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { formatCurrency, formatPercentage } from '@/utils/formatting-utils';

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
  items = [], // Ensure items has a default empty array
  children,
  field,
  item,
  isColumnHeader
}) => {
  // Format the value based on type
  const formatValue = (value: any): React.ReactNode => {
    if (value === null || value === undefined) return 'N/A';
    
    // Format currency values
    if (typeof value === 'number') {
      if (field?.toLowerCase().includes('price') || 
          field?.toLowerCase().includes('cost')) {
        return formatCurrency(value);
      } 
      // Format percentage values
      else if (field?.toLowerCase().includes('margin')) {
        return formatPercentage(value);
      }
      // Format other numeric values to 2 decimal places
      return Number(value).toFixed(2);
    }
    
    return value;
  };

  // Find which competitor has the lowest price (for TML display)
  const findLowestPriceCompetitor = (item: any) => {
    if (!item) return null;

    const competitors = [
      { name: 'ETH NET', value: item["ETH NET"] || item.eth_net },
      { name: 'Nupharm', value: item.Nupharm || item.nupharm },
      { name: 'LEXON', value: item.LEXON || item.lexon },
      { name: 'AAH', value: item.AAH || item.aah }
    ];
    
    let lowest = { name: '', value: Number.MAX_VALUE };
    
    for (const comp of competitors) {
      if (comp.value && typeof comp.value === 'number' && comp.value < lowest.value) {
        lowest = comp;
      }
    }
    
    return lowest.name !== '' ? lowest.name : null;
  };
  
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
          { label: "Average Cost", value: formatValue(item.avgCost) },
          { label: "Last Purchase", value: item.lastPurchase ? formatValue(item.lastPurchase) : 'N/A' }
        ];
        break;
      case "marketLow":
        // Remove the redundant header by setting displayLabel to null
        displayLabel = null;
        displayItems = [
          { label: "Market Low", value: formatValue(item.marketLow) },
          { label: "True Market Low", value: item.trueMarketLow ? formatValue(item.trueMarketLow) : 'N/A' }
        ];
        
        // Add the competitor pricing data
        if (item["ETH NET"] || item.eth_net) {
          displayItems.push({ label: "ETH NET", value: formatValue(item["ETH NET"] || item.eth_net) });
        }
        if (item.Nupharm || item.nupharm) {
          displayItems.push({ label: "Nupharm", value: formatValue(item.Nupharm || item.nupharm) });
        }
        if (item.LEXON || item.lexon) {
          displayItems.push({ label: "LEXON", value: formatValue(item.LEXON || item.lexon) });
        }
        if (item.AAH || item.aah) {
          displayItems.push({ label: "AAH", value: formatValue(item.AAH || item.aah) });
        }
        
        // Find and mark the competitor with the lowest price
        const lowestCompetitor = findLowestPriceCompetitor(item);
        if (lowestCompetitor && item.trueMarketLow) {
          // Replace the TML entry with the competitor who has the lowest price
          const tmlIndex = displayItems.findIndex(i => i.label === "True Market Low");
          if (tmlIndex !== -1) {
            displayItems[tmlIndex] = {
              label: `${lowestCompetitor} (Lowest)`,
              value: formatValue(item.trueMarketLow)
            };
          }
        }
        break;
      case "nextCost":
        displayLabel = "Next Buying Price";
        displayItems = [
          { label: "Next Buying Price", value: formatValue(item.nextCost || item.nextBuyingPrice) },
          { label: "Current Cost", value: item.avgCost ? formatValue(item.avgCost) : 'N/A' }
        ];
        break;
      case "currentREVAPrice":
        displayLabel = "Current Price";
        displayItems = [
          { label: "Current Price", value: formatValue(item.currentREVAPrice) },
          { label: "Previous Price", value: item.previousPrice ? formatValue(item.previousPrice) : 'N/A' }
        ];
        break;
      case "currentREVAMargin":
        displayLabel = "Current Margin";
        // Ensure we're using the actual margin data from the item
        displayItems = [
          { label: "Current Margin", value: formatPercentage(item.currentREVAMargin) },
          { label: "Target Margin", value: item.targetMargin ? formatPercentage(item.targetMargin) : '15.0%' }
        ];
        break;
      case "proposedPrice":
        displayLabel = "Proposed Price";
        displayItems = [
          { label: "Proposed Price", value: formatValue(item.proposedPrice) },
          { label: "Calculated Price", value: item.calculatedPrice ? formatValue(item.calculatedPrice) : formatValue(item.proposedPrice) },
          { label: "Current Price", value: item.currentREVAPrice ? formatValue(item.currentREVAPrice) : 'N/A' },
          { label: "Next Buying Price", value: item.nextCost || item.nextBuyingPrice ? formatValue(item.nextCost || item.nextBuyingPrice) : 'N/A' },
          { label: "Applied Rule", value: item.appliedRule || 'N/A' }
        ];
        break;
      case "proposedMargin":
        displayLabel = "Proposed Margin";
        // Ensure we're using the actual margin data from the item
        displayItems = [
          { label: "Proposed Margin", value: formatPercentage(item.proposedMargin) },
          { label: "Current Margin", value: item.currentREVAMargin ? formatPercentage(item.currentREVAMargin) : 'N/A' },
          { label: "Target Margin", value: item.targetMargin ? formatPercentage(item.targetMargin) : '15.0%' }
        ];
        break;
      default:
        // For column headers or unspecified fields, use defaults
        if (isColumnHeader) {
          displayLabel = field.charAt(0).toUpperCase() + field.slice(1);
          displayItems = [];
        } else {
          // For other fields, just set to null if we have items (to avoid duplication)
          displayLabel = field;
          displayItems = [{ label: field, value: formatValue(item[field]) || 'N/A' }];
        }
    }
    
    return { displayLabel, displayItems };
  };
  
  const { displayLabel, displayItems } = getFieldDetails();
  const finalLabel = displayLabel || '';
  const finalItems = displayItems || []; // Ensure finalItems is never undefined
  
  // If children is provided, use that instead of value
  const content = children || value;
  
  if (!content && finalItems.length === 0) {
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
      <HoverCardContent className="w-80 p-4 bg-gray-950/95 backdrop-blur-sm border border-white/10 z-50">
        <div className="space-y-2">
          {/* Only show heading if finalLabel exists */}
          {finalLabel && <h4 className="font-medium">{finalLabel}</h4>}
          <div className="grid gap-2">
            {Array.isArray(finalItems) && finalItems.length > 0 && finalItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">{item.label}:</p>
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
