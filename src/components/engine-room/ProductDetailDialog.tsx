
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/utils/rep-performance-utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface ProductDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: any;
  field?: string;
}

const ProductDetailDialog: React.FC<ProductDetailDialogProps> = ({
  open,
  onOpenChange,
  item,
  field
}) => {
  if (!item) return null;

  // Get field-specific details
  const getFieldDetails = () => {
    if (!field) return null;

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
          title: 'Market Low',
          formula: 'min(ETH, ETH NET, Nupharm, LEXON, AAH)',
          values: validPrices.map(p => `${p.name}: ${formatCurrency(p.price)}`),
          result: formatCurrency(item.marketLow)
        };

      case 'trueMarketLow':
      case 'tml':
        // True Market Low calculation
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
          title: 'True Market Low',
          formula: 'min(ETH NET, ETH, Nupharm, LEXON, AAH)',
          values: validCompetitorPrices.map(p => `${p.name}: ${formatCurrency(p.price)}`),
          result: `${formatCurrency(result)} (${lowestSource})`
        };
        
      case 'avgCost':
        return {
          title: 'Average Cost',
          formula: 'Average of historical purchasing costs',
          values: [
            `Latest Cost: ${formatCurrency(item.latestCost || 0)}`,
            `Historical Average: ${formatCurrency(item.avgCost || 0)}`
          ],
          result: formatCurrency(item.avgCost)
        };
        
      case 'nextBuyingPrice':
      case 'nextPrice':
        return {
          title: 'Next Buying Price',
          formula: 'Expected cost for next purchase',
          values: [
            `Current Cost: ${formatCurrency(item.avgCost || 0)}`,
            `Next Buy Price: ${formatCurrency(item.nextBuyingPrice || 0)}`
          ],
          result: formatCurrency(item.nextBuyingPrice)
        };
        
      case 'currentREVAMargin':
        const currentPrice = item.currentREVAPrice || 0;
        const cost = item.avgCost || 0;
        const margin = cost > 0 ? (currentPrice - cost) / currentPrice : 0;
        
        return {
          title: 'Current Margin',
          formula: '(Current Price - Avg Cost) / Current Price',
          values: [
            `Current Price: ${formatCurrency(currentPrice)}`,
            `Avg Cost: ${formatCurrency(cost)}`
          ],
          result: `${(margin * 100).toFixed(2)}%`
        };
        
      case 'proposedMargin':
        const proposedPrice = item.proposedPrice || 0;
        const propCost = item.avgCost || 0;
        const propMargin = propCost > 0 ? (proposedPrice - propCost) / proposedPrice : 0;
        
        return {
          title: 'Proposed Margin',
          formula: '(Proposed Price - Avg Cost) / Proposed Price',
          values: [
            `Proposed Price: ${formatCurrency(proposedPrice)}`,
            `Avg Cost: ${formatCurrency(propCost)}`
          ],
          result: `${(propMargin * 100).toFixed(2)}%`
        };
        
      case 'currentREVAPrice':
        return {
          title: 'Current Price',
          formula: 'Current set price in REVA system',
          values: [
            `Last Updated: ${item.lastPriceUpdate || 'Unknown'}`,
          ],
          result: formatCurrency(item.currentREVAPrice)
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
          title: 'Proposed Price',
          formula: `Price calculated using rule: ${rule}`,
          values: [
            ruleDetail,
            `Calculated Price: ${formatCurrency(item.calculatedPrice || item.proposedPrice || 0)}`
          ],
          result: formatCurrency(item.proposedPrice)
        };

      case 'marketTrend':
        return {
          title: 'Market Trend',
          formula: 'Market price trend analysis',
          values: [
            `Previous Market Low: ${formatCurrency(item.prevMarketLow || 0)}`,
            `Current Market Low: ${formatCurrency(item.marketLow || 0)}`,
          ],
          result: item.marketTrend || 'Stable'
        };
        
      case 'percentToMarketLow':
        const pPrice = item.proposedPrice || 0;
        const mLow = item.marketLow || 0;
        const percentDiff = mLow > 0 ? ((pPrice - mLow) / mLow) * 100 : 0;
        
        return {
          title: '% to Market Low',
          formula: '((Proposed Price - Market Low) / Market Low) * 100',
          values: [
            `Proposed Price: ${formatCurrency(pPrice)}`,
            `Market Low: ${formatCurrency(mLow)}`
          ],
          result: `${percentDiff.toFixed(2)}%`
        };
        
      default:
        return {
          title: field.charAt(0).toUpperCase() + field.slice(1),
          formula: `Field: ${field}`,
          values: [],
          result: item[field] || 'N/A'
        };
    }
  };

  // Get product overview data
  const getProductOverview = () => {
    return [
      { label: 'Description', value: item.description || 'N/A' },
      { label: 'Stock', value: item.inStock || 0 },
      { label: 'On Order', value: item.onOrder || 0 },
      { label: 'Usage', value: item.revaUsage || 0 },
      { label: 'Usage Rank', value: item.usageRank || 'N/A' }
    ];
  };

  // Get pricing data
  const getPricingData = () => {
    return [
      { label: 'Average Cost', value: formatCurrency(item.avgCost || 0) },
      { label: 'Next Buying Price', value: formatCurrency(item.nextBuyingPrice || 0) },
      { label: 'Current Price', value: formatCurrency(item.currentREVAPrice || 0) },
      { label: 'Current Margin', value: `${((item.currentREVAMargin || 0) * 100).toFixed(2)}%` },
      { label: 'Proposed Price', value: formatCurrency(item.proposedPrice || 0) },
      { label: 'Proposed Margin', value: `${((item.proposedMargin || 0) * 100).toFixed(2)}%` },
      { label: 'Price Change', 
        value: `${(((item.proposedPrice || 0) - (item.currentREVAPrice || 0)) / (item.currentREVAPrice || 1) * 100).toFixed(2)}%` 
      },
      { label: '% to Market Low', 
        value: `${(((item.proposedPrice || 0) - (item.marketLow || 0)) / (item.marketLow || 1) * 100).toFixed(2)}%` 
      }
    ];
  };

  // Get competitor data
  const getCompetitorData = () => {
    const competitors = [
      { name: 'ETH NET', value: item.ETH_NET },
      { name: 'ETH', value: item.ETH },
      { name: 'Nupharm', value: item.Nupharm },
      { name: 'LEXON', value: item.LEXON },
      { name: 'AAH', value: item.AAH }
    ].filter(comp => comp.value !== null && comp.value !== undefined);

    return competitors.length > 0 ? competitors : null;
  };

  // Get field details if a specific field was selected
  const fieldDetails = field ? getFieldDetails() : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-background">
        <DialogHeader>
          <DialogTitle>{item.description || 'Product Details'}</DialogTitle>
          <DialogDescription className="flex items-center space-x-2">
            <span>Item #{item.id}</span>
            {item.appliedRule && (
              <span className="bg-gray-700 text-xs px-2 py-0.5 rounded-full">
                Rule: {item.appliedRule}
              </span>
            )}
            {item.marketTrend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
            {item.marketTrend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
          </DialogDescription>
        </DialogHeader>

        {fieldDetails ? (
          <div className="space-y-4">
            <h3 className="font-medium text-lg">{fieldDetails.title}</h3>
            
            <div className="bg-gray-900/20 p-3 rounded-md">
              <p className="text-sm font-mono">{fieldDetails.formula}</p>
            </div>
            
            <div className="space-y-2">
              {fieldDetails.values.map((value, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{value.split(':')[0]}</span>
                  <span className="font-mono">{value.split(':')[1]}</span>
                </div>
              ))}
              
              <div className="border-t border-gray-700 mt-2 pt-2 flex justify-between">
                <span className="font-semibold">Result:</span>
                <span className="font-mono font-semibold">{fieldDetails.result}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-2">Product Overview</h3>
              <Table>
                <TableBody>
                  {getProductOverview().map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{row.label}</TableCell>
                      <TableCell>{row.value}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Pricing Information</h3>
              <Table>
                <TableBody>
                  {getPricingData().map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{row.label}</TableCell>
                      <TableCell>{row.value}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {getCompetitorData() && (
              <div>
                <h3 className="font-medium mb-2">Competitor Prices</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Competitor</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Difference</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getCompetitorData()?.map((comp, i) => (
                      <TableRow key={i}>
                        <TableCell>{comp.name}</TableCell>
                        <TableCell>{formatCurrency(comp.value)}</TableCell>
                        <TableCell className={comp.value > item.proposedPrice ? 'text-green-500' : 'text-red-500'}>
                          {((comp.value - item.proposedPrice) / item.proposedPrice * 100).toFixed(2)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                <div className="mt-2 p-2 bg-gray-800/60 rounded text-sm">
                  <p className="flex justify-between">
                    <span>Market Low:</span> 
                    <span>{formatCurrency(item.marketLow)}</span>
                  </p>
                  <p className="flex justify-between">
                    <span>True Market Low:</span> 
                    <span>{formatCurrency(item.trueMarketLow || item.tml)}</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailDialog;
