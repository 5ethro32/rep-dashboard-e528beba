import React from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Info, TrendingUp, TrendingDown } from 'lucide-react';

interface CellDetailsPopoverProps {
  item: any;
  field: string;
  children: React.ReactNode;
  isColumnHeader?: boolean;
}

const CellDetailsPopover: React.FC<CellDetailsPopoverProps> = ({ item, field, children, isColumnHeader = false }) => {
  // Get field-specific calculation details and formula
  const getDetails = () => {
    switch (field) {
      case 'marketLow':
        // Gather all competitor prices
        const competitors = {
          'ETH': item.ETH || null,
          'ETH NET': item.ETH_NET || null,
          'Nupharm': item.Nupharm || null,
          'LEXON': item.LEXON || null,
          'AAH': item.AAH || null
        };
        
        const validPrices = Object.entries(competitors)
          .filter(([_, price]) => price !== null && price !== undefined && !isNaN(price))
          .map(([name, price]) => ({ name, price }));
        
        return {
          formula: 'min(ETH, ETH NET, Nupharm, LEXON, AAH)',
          values: validPrices.map(p => `${p.name}: £${Number(p.price).toFixed(2)}`),
          result: item.marketLow || 'N/A'
        };

      case 'trueMarketLow':
      case 'tml':
        // True Market Low (lowest of all competitors - ETH NET, ETH, Nupharm, LEXON, AAH)
        const allCompetitors = {
          'ETH NET': item.ETH_NET || null,
          'ETH': item.ETH || null,
          'Nupharm': item.Nupharm || null,
          'LEXON': item.LEXON || null,
          'AAH': item.AAH || null
        };
        
        const validCompetitorPrices = Object.entries(allCompetitors)
          .filter(([_, price]) => price !== null && price !== undefined && !isNaN(price))
          .map(([name, price]) => ({ name, price: Number(price) }));
        
        const lowestPrice = validCompetitorPrices.length > 0 
          ? Math.min(...validCompetitorPrices.map(p => p.price))
          : null;
          
        const lowestSource = validCompetitorPrices.find(p => p.price === lowestPrice)?.name || 'N/A';
        
        const result = item.trueMarketLow !== undefined 
          ? item.trueMarketLow 
          : (item.tml !== undefined ? item.tml : lowestPrice);
        
        return {
          formula: 'min(ETH NET, ETH, Nupharm, LEXON, AAH)',
          values: validCompetitorPrices.map(p => `${p.name}: £${p.price.toFixed(2)}`),
          result: result !== null ? `£${Number(result).toFixed(2)} (${lowestSource})` : 'N/A'
        };
        
      case 'avgCost':
        return {
          formula: 'Average of historical purchasing costs',
          values: [
            `Latest Cost: £${Number(item.latestCost || 0).toFixed(2)}`,
            `Historical Average: £${Number(item.avgCost || 0).toFixed(2)}`
          ],
          result: item.avgCost || 'N/A'
        };
        
      case 'currentREVAMargin':
        const currentPrice = item.currentREVAPrice || 0;
        const cost = item.avgCost || 0;
        const margin = cost > 0 ? (currentPrice - cost) / currentPrice : 0;
        
        return {
          formula: '(Current Price - Avg Cost) / Current Price',
          values: [
            `Current Price: £${Number(currentPrice).toFixed(2)}`,
            `Avg Cost: £${Number(cost).toFixed(2)}`
          ],
          result: `${(margin * 100).toFixed(2)}%`
        };
        
      case 'proposedMargin':
        const proposedPrice = item.proposedPrice || 0;
        const propCost = item.avgCost || 0;
        const propMargin = propCost > 0 ? (proposedPrice - propCost) / proposedPrice : 0;
        
        return {
          formula: '(Proposed Price - Avg Cost) / Proposed Price',
          values: [
            `Proposed Price: £${Number(proposedPrice).toFixed(2)}`,
            `Avg Cost: £${Number(propCost).toFixed(2)}`
          ],
          result: `${(propMargin * 100).toFixed(2)}%`
        };
        
      case 'currentREVAPrice':
        return {
          formula: 'Current set price in REVA system',
          values: [
            `Last Updated: ${item.lastPriceUpdate || 'Unknown'}`,
          ],
          result: item.currentREVAPrice ? `£${Number(item.currentREVAPrice).toFixed(2)}` : 'N/A'
        };
        
      case 'proposedPrice':
        const rule = item.appliedRule || 'Manual';
        let ruleDetail = 'Manually set price';
        
        if (rule.includes('Market')) {
          ruleDetail = `Based on market low price with adjustment`;
        } else if (rule.includes('Cost')) {
          ruleDetail = `Based on cost plus margin`;
        }
        
        return {
          formula: `Price calculated using rule: ${rule}`,
          values: [
            ruleDetail,
            `Calculated Price: £${Number(item.calculatedPrice || item.proposedPrice || 0).toFixed(2)}`
          ],
          result: item.proposedPrice ? `£${Number(item.proposedPrice).toFixed(2)}` : 'N/A'
        };

      case 'marketTrend':
        return {
          formula: 'Market price trend analysis',
          values: [
            `Previous Market Low: £${Number(item.prevMarketLow || 0).toFixed(2)}`,
            `Current Market Low: £${Number(item.marketLow || 0).toFixed(2)}`,
          ],
          result: item.marketTrend || 'Stable'
        };
        
      default:
        return {
          formula: `Field: ${field}`,
          values: [],
          result: item[field] || 'N/A'
        };
    }
  };
  
  // Column header descriptions
  const getColumnDescription = () => {
    const descriptions: Record<string, string> = {
      description: "Product description as listed in the inventory system",
      inStock: "Current quantity available in stock",
      revaUsage: "Historical usage quantity in REVA system",
      usageRank: "Usage ranking from 1-5 (1 being highest usage)",
      avgCost: "Average purchase cost based on historical data",
      marketLow: "Lowest competitor price in the market",
      trueMarketLow: "True Market Low - absolute lowest price across all competitors",
      tml: "True Market Low - absolute lowest price across all competitors",
      currentREVAPrice: "Current selling price in the REVA system",
      currentREVAMargin: "Current margin percentage ((price-cost)/price)",
      proposedPrice: "System calculated or manually set new price",
      priceChangePercentage: "Percentage change between current and proposed price",
      proposedMargin: "Margin percentage with proposed price",
      appliedRule: "Pricing rule used to calculate the proposed price",
      marketTrend: "Indicates if market prices are trending up or down",
      shortage: "Indicates if the product is experiencing a shortage"
    };
    
    return descriptions[field] || `Details for ${field}`;
  };
  
  const details = getDetails();
  const isEmptyItem = !item || Object.keys(item).length === 0;
  
  // For column headers with sorting capability
  if (isColumnHeader || isEmptyItem) {
    return (
      <HoverCard openDelay={200} closeDelay={100}>
        <HoverCardTrigger asChild>
          <div>{children}</div>
        </HoverCardTrigger>
        <HoverCardContent side="top" align="start" className="w-80 p-4 z-50">
          <div>
            <h4 className="font-semibold text-sm mb-2">{field}</h4>
            <p className="text-sm text-muted-foreground">{getColumnDescription()}</p>
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  }
  
  // For regular cell values
  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <div className="cursor-help relative inline-block">
          {children}
        </div>
      </HoverCardTrigger>
      <HoverCardContent side="top" align="start" className="w-80 p-4 z-50">
        <div>
          <h4 className="font-semibold text-sm mb-2">
            {field.charAt(0).toUpperCase() + field.slice(1)} Calculation
          </h4>
          <div className="bg-gray-900/20 p-2 rounded-md mb-2">
            <p className="text-sm font-mono">{details.formula}</p>
          </div>
          <div className="space-y-1">
            {details.values.map((value, index) => (
              <div key={index} className="text-sm flex justify-between">
                <span>{value.split(':')[0]}:</span>
                <span className="font-mono">{value.split(':')[1]}</span>
              </div>
            ))}
            <div className="border-t border-gray-700 mt-2 pt-2 flex justify-between">
              <span className="font-semibold">Result:</span>
              <span className="font-mono font-semibold">
                {typeof details.result === 'number' 
                  ? field.includes('margin') 
                    ? `${(details.result * 100).toFixed(2)}%` 
                    : `£${details.result.toFixed(2)}`
                  : details.result}
              </span>
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export default CellDetailsPopover;
