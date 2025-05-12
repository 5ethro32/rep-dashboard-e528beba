
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';

interface PricingRuleExplainerProps {
  item: any;
  open: boolean;
  onClose: () => void;
}

const PricingRuleExplainer: React.FC<PricingRuleExplainerProps> = ({ item, open, onClose }) => {
  // Calculate margin if not provided
  const calculateMargin = (price: number, cost: number) => {
    if (!price || !cost || price === 0) return 0;
    return ((price - cost) / price) * 100;
  };

  // Format currency
  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === null) return '£0.00';
    return `£${value.toFixed(2)}`;
  };

  // Format percentage
  const formatPercentage = (value: number | undefined) => {
    if (value === undefined || value === null) return '0%';
    return `${value.toFixed(2)}%`;
  };
  
  // Calculate percentage to market low
  const calculatePercentToMarketLow = () => {
    if (!item || !item.proposedPrice || !item.marketLow || item.marketLow === 0) return 0;
    return ((item.proposedPrice - item.marketLow) / item.marketLow) * 100;
  };

  // Get the display text for a rule
  const getRuleDescription = (ruleText: string) => {
    if (!ruleText) return 'No rule applied';
    
    if (ruleText.toLowerCase().includes('cost plus')) {
      return 'Cost Plus: Sets price based on cost with added margin';
    } else if (ruleText.toLowerCase().includes('market')) {
      return 'Market Based: Sets price relative to market low';
    } else if (ruleText.toLowerCase().includes('manual')) {
      return 'Manual: Price manually set';
    }
    
    return ruleText;
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Price Calculation Details</DialogTitle>
          <DialogDescription>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="px-2 py-0.5 bg-gray-700 rounded-full text-xs">
                {item.description}
              </span>
              {item.appliedRule && (
                <span className="px-2 py-0.5 bg-blue-900/30 rounded-full text-xs">
                  Rule: {item.appliedRule}
                </span>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        
        {/* Product and calculation overview */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Product Information</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-900/30 p-3 rounded-md">
                <div className="text-xs text-gray-400">Product</div>
                <div className="text-base truncate">{item.description}</div>
              </div>
              <div className="bg-gray-900/30 p-3 rounded-md">
                <div className="text-xs text-gray-400">In Stock</div>
                <div className="text-lg">{item.inStock || 0}</div>
              </div>
              <div className="bg-gray-900/30 p-3 rounded-md">
                <div className="text-xs text-gray-400">Usage</div>
                <div className="text-lg">{item.revaUsage || 0}</div>
              </div>
              <div className="bg-gray-900/30 p-3 rounded-md">
                <div className="text-xs text-gray-400">Rank</div>
                <div className="text-lg">{item.usageRank || 'N/A'}</div>
              </div>
              <div className="bg-gray-900/30 p-3 rounded-md">
                <div className="text-xs text-gray-400">On Order</div>
                <div className="text-lg">{item.onOrder || 0}</div>
              </div>
              <div className="bg-gray-900/30 p-3 rounded-md">
                <div className="text-xs text-gray-400">Trend</div>
                <div className="text-lg flex items-center">
                  {item.marketTrend === 'up' && (
                    <>
                      <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                      <span>Up</span>
                    </>
                  )}
                  {item.marketTrend === 'down' && (
                    <>
                      <TrendingDown className="h-4 w-4 mr-1 text-red-500" />
                      <span>Down</span>
                    </>
                  )}
                  {!item.marketTrend && "Stable"}
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Price Calculation</h3>
            
            <div className="grid gap-2">
              <div className="bg-gray-900/30 p-3 rounded-md">
                <div className="text-xs text-gray-400">Applied Rule</div>
                <div className="text-sm">{getRuleDescription(item.appliedRule || '')}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-900/30 p-3 rounded-md">
                  <div className="text-xs text-gray-400">Average Cost</div>
                  <div className="text-lg font-mono">{formatCurrency(item.avgCost)}</div>
                </div>
                <div className="bg-gray-900/30 p-3 rounded-md">
                  <div className="text-xs text-gray-400">Next Buying Price</div>
                  <div className="text-lg font-mono">{formatCurrency(item.nextBuyingPrice)}</div>
                </div>
                <div className="bg-gray-900/30 p-3 rounded-md">
                  <div className="text-xs text-gray-400">Current Price</div>
                  <div className="text-lg font-mono">{formatCurrency(item.currentREVAPrice)}</div>
                </div>
                <div className="bg-gray-900/30 p-3 rounded-md">
                  <div className="text-xs text-gray-400">Current Margin</div>
                  <div className="text-lg font-mono">
                    {formatPercentage(item.currentREVAMargin ? item.currentREVAMargin * 100 : calculateMargin(item.currentREVAPrice || 0, item.avgCost || 0))}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-center py-2">
                <ArrowRight className="h-6 w-6" />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-blue-900/30 p-3 rounded-md">
                  <div className="text-xs text-gray-400">Proposed Price</div>
                  <div className="text-lg font-mono">{formatCurrency(item.proposedPrice)}</div>
                </div>
                <div className="bg-blue-900/30 p-3 rounded-md">
                  <div className="text-xs text-gray-400">Proposed Margin</div>
                  <div className="text-lg font-mono">
                    {formatPercentage(item.proposedMargin ? item.proposedMargin * 100 : calculateMargin(item.proposedPrice || 0, item.avgCost || 0))}
                  </div>
                </div>
                <div className="bg-blue-900/30 p-3 rounded-md">
                  <div className="text-xs text-gray-400">Price Change</div>
                  <div className="text-lg font-mono">
                    {formatPercentage(((item.proposedPrice || 0) - (item.currentREVAPrice || 0)) / (item.currentREVAPrice || 1) * 100)}
                  </div>
                </div>
                <div className="bg-blue-900/30 p-3 rounded-md">
                  <div className="text-xs text-gray-400">% to Market Low</div>
                  <div className="text-lg font-mono">
                    {formatPercentage(calculatePercentToMarketLow())}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Competitor prices */}
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">Competitor Prices</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Competitor</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Diff vs Current</TableHead>
                <TableHead>Diff vs Proposed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {item.ETH !== undefined && (
                <TableRow>
                  <TableCell>ETH</TableCell>
                  <TableCell>{formatCurrency(item.ETH)}</TableCell>
                  <TableCell>
                    {formatPercentage(((item.ETH || 0) - (item.currentREVAPrice || 0)) / (item.currentREVAPrice || 1) * 100)}
                  </TableCell>
                  <TableCell>
                    {formatPercentage(((item.ETH || 0) - (item.proposedPrice || 0)) / (item.proposedPrice || 1) * 100)}
                  </TableCell>
                </TableRow>
              )}
              {item.ETH_NET !== undefined && (
                <TableRow>
                  <TableCell>ETH NET</TableCell>
                  <TableCell>{formatCurrency(item.ETH_NET)}</TableCell>
                  <TableCell>
                    {formatPercentage(((item.ETH_NET || 0) - (item.currentREVAPrice || 0)) / (item.currentREVAPrice || 1) * 100)}
                  </TableCell>
                  <TableCell>
                    {formatPercentage(((item.ETH_NET || 0) - (item.proposedPrice || 0)) / (item.proposedPrice || 1) * 100)}
                  </TableCell>
                </TableRow>
              )}
              {item.Nupharm !== undefined && (
                <TableRow>
                  <TableCell>Nupharm</TableCell>
                  <TableCell>{formatCurrency(item.Nupharm)}</TableCell>
                  <TableCell>
                    {formatPercentage(((item.Nupharm || 0) - (item.currentREVAPrice || 0)) / (item.currentREVAPrice || 1) * 100)}
                  </TableCell>
                  <TableCell>
                    {formatPercentage(((item.Nupharm || 0) - (item.proposedPrice || 0)) / (item.proposedPrice || 1) * 100)}
                  </TableCell>
                </TableRow>
              )}
              {item.LEXON !== undefined && (
                <TableRow>
                  <TableCell>LEXON</TableCell>
                  <TableCell>{formatCurrency(item.LEXON)}</TableCell>
                  <TableCell>
                    {formatPercentage(((item.LEXON || 0) - (item.currentREVAPrice || 0)) / (item.currentREVAPrice || 1) * 100)}
                  </TableCell>
                  <TableCell>
                    {formatPercentage(((item.LEXON || 0) - (item.proposedPrice || 0)) / (item.proposedPrice || 1) * 100)}
                  </TableCell>
                </TableRow>
              )}
              {item.AAH !== undefined && (
                <TableRow>
                  <TableCell>AAH</TableCell>
                  <TableCell>{formatCurrency(item.AAH)}</TableCell>
                  <TableCell>
                    {formatPercentage(((item.AAH || 0) - (item.currentREVAPrice || 0)) / (item.currentREVAPrice || 1) * 100)}
                  </TableCell>
                  <TableCell>
                    {formatPercentage(((item.AAH || 0) - (item.proposedPrice || 0)) / (item.proposedPrice || 1) * 100)}
                  </TableCell>
                </TableRow>
              )}
              <TableRow className="bg-gray-800/40">
                <TableCell className="font-medium">Market Low</TableCell>
                <TableCell>{formatCurrency(item.marketLow)}</TableCell>
                <TableCell>
                  {formatPercentage(((item.marketLow || 0) - (item.currentREVAPrice || 0)) / (item.currentREVAPrice || 1) * 100)}
                </TableCell>
                <TableCell>
                  {formatPercentage(((item.marketLow || 0) - (item.proposedPrice || 0)) / (item.proposedPrice || 1) * 100)}
                </TableCell>
              </TableRow>
              <TableRow className="bg-gray-800/40">
                <TableCell className="font-medium">True Market Low</TableCell>
                <TableCell>{formatCurrency(item.trueMarketLow || item.tml)}</TableCell>
                <TableCell>
                  {formatPercentage(((item.trueMarketLow || item.tml || 0) - (item.currentREVAPrice || 0)) / (item.currentREVAPrice || 1) * 100)}
                </TableCell>
                <TableCell>
                  {formatPercentage(((item.trueMarketLow || item.tml || 0) - (item.proposedPrice || 0)) / (item.proposedPrice || 1) * 100)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        
        <DialogFooter className="mt-4">
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PricingRuleExplainer;
