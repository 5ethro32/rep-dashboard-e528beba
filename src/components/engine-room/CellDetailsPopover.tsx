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

  // Special formatter for currentREVAMargin that doesn't multiply by 100
  const formatCurrentMargin = (value: number): React.ReactNode => {
    if (value === null || value === undefined) return 'N/A';
    return `${value.toFixed(2)}%`;
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
      if (comp.value && typeof comp.value === 'number' && comp.value > 0 && comp.value < lowest.value) {
        lowest = comp;
      }
    }
    
    return lowest.name !== '' ? lowest.name : null;
  };
  
  // Generate label and details based on field if provided
  const getFieldDetails = () => {
    if (!field || !item) return { displayLabel: label, displayItems: items }; 
    
    let displayLabel = null; // Default to null to avoid duplicate headers
    let displayItems: CellDetailItem[] = [];
    
    // Handle specific fields with custom popover content
    switch (field) {
      case "avgCost":
        displayLabel = null; // Remove duplicate header
        displayItems = [
          { label: "Average Cost", value: formatValue(item.avgCost) },
          { label: "Last Purchase", value: item.lastPurchase ? formatValue(item.lastPurchase) : 'N/A' }
        ];
        break;
      case "marketLow":
        // Remove the redundant header by setting displayLabel to null
        displayLabel = null;
        
        // Find the competitor with the lowest price
        const lowestCompetitor = findLowestPriceCompetitor(item);
        
        displayItems = [
          { label: "Market Low", value: formatValue(item.marketLow) }
        ];
        
        // Add True Market Low with competitor name if available
        if (item.trueMarketLow) {
          if (lowestCompetitor) {
            displayItems.push({ 
              label: `${lowestCompetitor} (Lowest)`, 
              value: formatValue(item.trueMarketLow) 
            });
          } else {
            displayItems.push({ 
              label: "True Market Low", 
              value: formatValue(item.trueMarketLow) 
            });
          }
        }
        
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
        break;
      case "nextCost":
        displayLabel = null; // Remove duplicate header
        
        // Check if Next Buying Price is missing
        if (item.nextCostMissing) {
          displayItems = [
            { label: "Next Buying Price", value: "£0.00 (Missing)" },
            { label: "Using for Calculation", value: formatValue(item.avgCost) },
            { label: "Current Cost", value: item.avgCost ? formatValue(item.avgCost) : 'N/A' }
          ];
        } else {
          displayItems = [
            { label: "Next Buying Price", value: formatValue(item.nextCost) },
            { label: "Current Cost", value: item.avgCost ? formatValue(item.avgCost) : 'N/A' }
          ];
        }
        break;
      case "currentREVAPrice":
        displayLabel = null; // Remove duplicate header
        displayItems = [
          { label: "Current Price", value: formatValue(item.currentREVAPrice) },
          { label: "Previous Price", value: item.previousPrice ? formatValue(item.previousPrice) : 'N/A' }
        ];
        break;
      case "currentREVAMargin":
        displayLabel = null; // Remove duplicate header
        displayItems = [
          // Use special formatter for current margin to avoid double multiplication
          { label: "Current Margin", value: formatCurrentMargin(item.currentREVAMargin) },
          { label: "Target Margin", value: item.targetMargin ? formatPercentage(item.targetMargin) : '15.0%' }
        ];
        break;
      case "proposedPrice":
        displayLabel = null; // Remove duplicate header
        displayItems = [
          { label: "Proposed Price", value: formatValue(item.proposedPrice) },
          { label: "Calculated Price", value: item.calculatedPrice ? formatValue(item.calculatedPrice) : formatValue(item.proposedPrice) },
          { label: "Current Price", value: item.currentREVAPrice ? formatValue(item.currentREVAPrice) : 'N/A' },
          { label: "Next Buying Price", value: item.nextCostMissing ? "£0.00 (Missing)" : formatValue(item.nextCost) },
          { label: "Applied Rule", value: item.appliedRule || 'N/A' }
        ];
        break;
      case "proposedMargin":
        displayLabel = null; // Remove duplicate header
        // Fix margin values by explicitly using the values from the item
        displayItems = [
          { label: "Proposed Margin", value: formatPercentage(item.proposedMargin) },
          // Use special formatter for current margin to avoid double multiplication
          { label: "Current Margin", value: formatCurrentMargin(item.currentREVAMargin) },
          { label: "Target Margin", value: item.targetMargin ? formatPercentage(item.targetMargin) : '15.0%' }
        ];
        
        // For debugging - add this to help identify why margin values might be wrong
        console.log("Margin values for item:", {
          id: item.id,
          description: item.description,
          proposedMargin: item.proposedMargin,
          currentREVAMargin: item.currentREVAMargin,
          proposedPrice: item.proposedPrice,
          nextCost: item.nextCost || item.nextBuyingPrice,
          calculatedMargin: item.proposedPrice && (item.nextCost || item.nextBuyingPrice) ? 
            ((item.proposedPrice - (item.nextCost || item.nextBuyingPrice)) / item.proposedPrice) * 100 : 
            null
        });
        break;
      case "trueMarketLow":
        displayLabel = null; // Remove duplicate header
        const lowestCompetitorForTml = findLowestPriceCompetitor(item);
        
        // Check if we truly have no market price
        const hasNoMarketPrice = item.noMarketPrice === true || 
                               (!item.trueMarketLow && !lowestCompetitorForTml);
        
        if (hasNoMarketPrice) {
          displayItems = [
            { label: "True Market Low", value: "No Market Price Available" }
          ];
        } else {
          displayItems = [
            { 
              label: lowestCompetitorForTml ? `${lowestCompetitorForTml} (Lowest)` : "True Market Low", 
              value: formatValue(item.trueMarketLow) 
            }
          ];
        }
        break;
      default:
        // For column headers or unspecified fields, use defaults
        if (isColumnHeader) {
          displayLabel = field.charAt(0).toUpperCase() + field.slice(1);
          displayItems = [];
        } else {
          // For other fields, set a label and a single item
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
