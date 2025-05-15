
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency, formatPercentage } from '@/utils/formatting-utils';
import { Separator } from '@/components/ui/separator';
import { Info, AlertCircle, CheckCircle2, TrendingUp, TrendingDown, CircleAlert } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RevaMetricsChartUpdated from './RevaMetricsChartUpdated';

interface PricingRuleExplainerProps {
  open: boolean;
  onClose: () => void;
  item: any;
}

const PricingRuleExplainer = ({ open, onClose, item }: PricingRuleExplainerProps) => {
  if (!item) return null;
  
  const usageRank = item.usageRank || 1;
  const usageGroup = usageRank <= 2 ? '1-2' : usageRank <= 4 ? '3-4' : '5-6';
  const usageUplift = usageRank <= 2 ? 0 : usageRank <= 4 ? 1 : 2;
  
  // Extract the rule that was applied from the ruleApplied string
  const extractRuleName = (ruleStr: string) => {
    const rule = ruleStr.split('_')[0];
    return rule.includes('rule') ? rule : 'fallback';
  };
  
  // Extract the trend from the ruleApplied string (upward, downward)
  const extractTrend = (ruleStr: string) => {
    if (ruleStr.includes('upward')) return 'upward';
    if (ruleStr.includes('downward')) return 'downward';
    return 'unknown';
  };
  
  // Extract the base method (ml, cost)
  const extractMethod = (ruleStr: string) => {
    if (ruleStr.includes('_ml')) return 'ml';
    if (ruleStr.includes('_cost')) return 'cost';
    if (ruleStr.includes('true_market_low')) return 'true_market_low';
    return 'unknown';
  };
  
  // Check if caps were applied
  const isCapped = (ruleStr: string) => {
    return ruleStr.includes('capped') || item.marginCapApplied;
  };
  
  // Get more descriptive rule name
  const getRuleDisplayName = () => {
    const ruleString = item.ruleApplied || 'unknown';
    
    // Special cases for fallbacks and special rules
    if (ruleString.includes('zero_cost')) {
      return 'Zero Cost Rule';
    }
    if (ruleString.includes('fallback')) {
      if (ruleString.includes('true_market_low')) {
        return 'Fallback - True Market Low';
      }
      if (ruleString.includes('cost_based')) {
        return 'Fallback - Cost Based';
      }
      if (ruleString.includes('nextcost')) {
        return 'Fallback - Next Cost';
      }
      if (ruleString.includes('current_price')) {
        return 'Fallback - Current Price';
      }
      return 'Fallback Rule';
    }
    
    // Normal rule parsing
    const ruleBase = extractRuleName(ruleString);
    const trend = extractTrend(ruleString);
    const method = extractMethod(ruleString);
    
    const ruleNumber = ruleBase === 'rule1' ? '1' : ruleBase === 'rule2' ? '2' : '';
    const subRule = method === 'ml' ? 'a' : method === 'cost' ? 'b' : '';
    
    return `Rule ${ruleNumber}${subRule}`;
  };
  
  // Get label for trend and method
  const getMethodLabel = () => {
    const ruleString = item.ruleApplied || 'unknown';
    const trend = extractTrend(ruleString);
    const method = extractMethod(ruleString);
    
    // Special cases
    if (ruleString.includes('fallback_true_market_low')) {
      return 'True Market Low + 3% + Uplift';
    }
    
    if (ruleString.includes('fallback_cost')) {
      return 'Cost + 12% + Uplift';
    }
    
    if (ruleString.includes('zero_cost')) {
      // Fix: changed the 'market' string to 'ml' to match the possible values from extractMethod
      if (ruleString.includes('true_market_low')) {
        return 'True Market Low + 3% + Uplift';
      }
      return method === 'ml' ? 'ML + 3% + Uplift' : 'Cost + 12% + Uplift';
    }
    
    // Rule 1 downward
    if (ruleString.includes('rule1') && trend === 'downward') {
      return `ML + ${usageUplift}%`;
    }
    
    // Rule 1 upward
    if (ruleString.includes('rule1') && trend === 'upward') {
      return method === 'ml' ? `ML + 3% + ${usageUplift}%` : `Cost + 12%`;
    }
    
    // Rule 2 downward
    if (ruleString.includes('rule2') && trend === 'downward') {
      return method === 'ml' ? `ML + 3% + ${usageUplift}%` : `Cost + 12% + ${usageUplift}%`;
    }
    
    // Rule 2 upward
    if (ruleString.includes('rule2') && trend === 'upward') {
      return method === 'ml' ? `ML + 3% + ${usageUplift}%` : `Cost + 12% + ${usageUplift}%`;
    }
    
    return 'Unknown method';
  };
  
  // Get a user-friendly description of the rule that was applied
  const getRuleDescription = () => {
    const ruleString = item.ruleApplied || 'unknown';
    
    if (ruleString.includes('zero_cost')) {
      if (ruleString.includes('market')) {
        return `Zero/missing cost item - price based on Market Low + ${usageUplift}% usage uplift`;
      }
      if (ruleString.includes('true_market_low')) {
        return `Zero/missing cost item - price based on True Market Low (min competitor price) + 3% + ${usageUplift}% usage uplift`;
      }
      if (ruleString.includes('nextcost')) {
        return `Zero/missing cost item - price based on Next Cost + 12% + ${usageUplift}% usage uplift`;
      }
      if (ruleString.includes('currentprice')) {
        return 'Zero cost item - kept current price';
      }
      return 'Zero cost item - special pricing rule';
    }
    
    if (ruleString.includes('fallback_true_market_low')) {
      return `ETH_NET missing - used minimum competitor price + 3% + ${usageUplift}% usage uplift`;
    }
    
    if (ruleString.includes('fallback_cost_based')) {
      return `No market price - used Average Cost + 12% + ${usageUplift}% usage uplift`;
    }
    
    if (ruleString.includes('fallback_nextcost')) {
      return `No market price or cost - used Next Cost + 12% + ${usageUplift}% usage uplift`;
    }
    
    if (ruleString.includes('fallback_current_price')) {
      return 'No market price or cost - kept current price';
    }
    
    const rule = extractRuleName(ruleString);
    const trend = extractTrend(ruleString);
    const method = extractMethod(ruleString);
    
    // Rule 1 (AVC < ML)
    if (rule === 'rule1') {
      if (trend === 'downward') {
        return `AVC < ML and Next Cost ≤ AVC: ML + ${usageUplift}% usage uplift`;
      } else {
        if (method === 'ml') {
          return `AVC < ML and Next Cost > AVC: Higher of (ML + 3% + ${usageUplift}%) vs (AVC + 12%)`;
        } else {
          return `AVC < ML and Next Cost > AVC: Cost markup option higher`;
        }
      }
    }
    
    // Rule 2 (AVC >= ML)
    if (rule === 'rule2') {
      if (trend === 'downward') {
        if (method === 'ml') {
          return `AVC ≥ ML and Next Cost ≤ AVC: Lower of (ML + 3% + ${usageUplift}%) vs (AVC + 12% + ${usageUplift}%)`;
        } else {
          return `AVC ≥ ML and Next Cost ≤ AVC: Cost markup option lower`;
        }
      } else {
        if (method === 'ml') {
          return `AVC ≥ ML and Next Cost > AVC: Higher of (ML + 3% + ${usageUplift}%) vs (AVC + 12% + ${usageUplift}%)`;
        } else {
          return `AVC ≥ ML and Next Cost > AVC: Cost markup option higher`;
        }
      }
    }
    
    return 'Unknown rule';
  };
  
  // Get cap information 
  const getCapDescription = () => {
    // For margin cap: G1-2 = 50%, G3-4 = 40%, G5-6 = 30%
    const marginCapPercentage = usageRank <= 2 ? 50 : usageRank <= 4 ? 40 : 30;
    
    if (item.marginCapApplied) {
      return `${marginCapPercentage}% Cap Applied (Usage Group ${usageGroup})`;
    }
    
    if (item.marginFloorApplied) {
      return `Margin Floor Applied`;
    }
    
    return null;
  };

  // Determine if the price change is significant
  const getPriceChangeStatus = () => {
    const originalPrice = item.currentREVAPrice || 0;
    const newPrice = item.proposedPrice || item.newPrice || 0;
    
    if (originalPrice === 0) return 'new';
    
    const changePercent = ((newPrice - originalPrice) / originalPrice) * 100;
    
    if (Math.abs(changePercent) < 0.5) return 'unchanged';
    if (changePercent > 0) return 'increased';
    return 'decreased';
  };
  
  // Get a descriptive text for the price change
  const getPriceChangeDescription = () => {
    const originalPrice = item.currentREVAPrice || 0;
    const newPrice = item.proposedPrice || item.newPrice || 0;
    
    if (originalPrice === 0) return 'New price set';
    
    const changePercent = ((newPrice - originalPrice) / originalPrice) * 100;
    const changeAmount = newPrice - originalPrice;
    
    if (Math.abs(changePercent) < 0.5) {
      return 'No significant change';
    }
    
    const direction = changeAmount > 0 ? 'increased' : 'decreased';
    return `Price ${direction} by ${Math.abs(changePercent).toFixed(1)}% (${formatCurrency(Math.abs(changeAmount))})`;
  };
  
  // Generate classes for price change badge
  const getPriceChangeBadgeClass = () => {
    const status = getPriceChangeStatus();
    
    if (status === 'unchanged') return 'bg-gray-400';
    if (status === 'increased') return 'bg-amber-500';
    if (status === 'decreased') return 'bg-emerald-500';
    return 'bg-blue-500';
  };
  
  // Get margin change description
  const getMarginChangeDescription = () => {
    const originalMargin = (item.currentREVAMargin || 0) / 100; // Convert from percentage to decimal
    const newMargin = item.proposedMargin || 0;
    
    const changePoints = (newMargin - originalMargin) * 100; // Convert back to percentage points
    
    if (Math.abs(changePoints) < 0.5) {
      return 'No significant change';
    }
    
    const direction = changePoints > 0 ? 'increased' : 'decreased';
    return `Margin ${direction} by ${Math.abs(changePoints).toFixed(1)} percentage points`;
  };
  
  // Format the ruleApplied string for display
  const formatRuleForDisplay = () => {
    const ruleName = getRuleDisplayName();
    const methodLabel = getMethodLabel();
    const capDescription = getCapDescription();
    
    let formatted = `${ruleName} - ${methodLabel} (G${usageGroup})`;
    
    if (extractTrend(item.ruleApplied || '') !== 'unknown') {
      formatted += `, ${extractTrend(item.ruleApplied || '').charAt(0).toUpperCase() + extractTrend(item.ruleApplied || '').slice(1)}`;
    }
    
    if (capDescription) {
      formatted += ` [${capDescription}]`;
    }
    
    return formatted;
  };
  
  const showFlagExplanation = item.flag1 || item.flag2;
  const isDownwardTrend = (item.nextCost || 0) <= (item.avgCost || 0);
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>Price Calculation Details</span>
              <Badge variant="outline" className="font-mono">
                {item.id || '???'}
              </Badge>
            </div>
            <Badge variant="secondary" className={getPriceChangeBadgeClass() + " text-white"}>
              {getPriceChangeDescription()}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-lg font-medium mb-2">{item.description}</div>
        
        {/* Tabs for different views */}
        <Tabs defaultValue="pricing" className="overflow-hidden flex flex-col flex-grow">
          <TabsList>
            <TabsTrigger value="pricing">Price Calculation</TabsTrigger>
            <TabsTrigger value="rules">Rule Explanation</TabsTrigger>
            <TabsTrigger value="impact">Usage Impact</TabsTrigger>
          </TabsList>
          
          {/* Pricing tab */}
          <TabsContent value="pricing" className="flex-grow overflow-hidden flex flex-col">
            <ScrollArea className="flex-grow">
              <div className="space-y-4 p-1">
                {/* Rule description */}
                <Alert variant="default">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Pricing Rule Applied</AlertTitle>
                  <AlertDescription className="pt-2">
                    <div><strong>{formatRuleForDisplay()}</strong></div>
                    <div className="text-sm text-muted-foreground mt-1">{getRuleDescription()}</div>
                  </AlertDescription>
                </Alert>
                
                {/* Flags alerts */}
                {showFlagExplanation && (
                  <div className="space-y-2">
                    {item.flag1 && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>High Price Flag</AlertTitle>
                        <AlertDescription>
                          Price is ≥10% above the lowest competitor price (true market low)
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {item.flag2 && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Low Margin Flag</AlertTitle>
                        <AlertDescription>
                          Proposed margin is at or below 0%
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
                
                {/* Market low missing but other prices available */}
                {item.noMarketLow && item.hasTrueMarketLow && (
                  <Alert variant="default" className="bg-amber-500/20 text-amber-800 dark:text-amber-400 border-amber-500/20">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Market Low (ETH NET) Missing</AlertTitle>
                    <AlertDescription>
                      ETH NET price is missing, but other competitor prices are available. Using the minimum competitor price (True Market Low) + 3% + usage uplift.
                    </AlertDescription>
                  </Alert>
                )}
                
                {/* Input values table */}
                <div className="overflow-hidden rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted">
                        <TableHead>Input Values</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>Usage Rank</TableCell>
                        <TableCell>{usageRank}</TableCell>
                        <TableCell>Group {usageGroup} ({usageUplift}% uplift)</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Average Cost</TableCell>
                        <TableCell>{formatCurrency(item.avgCost || 0)}</TableCell>
                        <TableCell>{item.avgCost <= 0 ? 'Cost missing or zero' : ''}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Next Cost</TableCell>
                        <TableCell>{formatCurrency(item.nextCost || 0)}</TableCell>
                        <TableCell>
                          {isDownwardTrend
                            ? <span className="flex items-center text-amber-500"><TrendingDown className="h-4 w-4 mr-1"/> Downward trend</span>
                            : <span className="flex items-center text-emerald-500"><TrendingUp className="h-4 w-4 mr-1"/> Upward trend</span>
                          }
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>ETH NET (Market Low)</TableCell>
                        <TableCell>{formatCurrency(item.eth_net || 0)}</TableCell>
                        <TableCell>{!item.eth_net ? 'Missing' : ''}</TableCell>
                      </TableRow>
                      {!item.eth_net && item.trueMarketLow > 0 && (
                        <TableRow className="bg-amber-500/10">
                          <TableCell>True Market Low</TableCell>
                          <TableCell>{formatCurrency(item.trueMarketLow || 0)}</TableCell>
                          <TableCell>Minimum competitor price used as fallback</TableCell>
                        </TableRow>
                      )}
                      <TableRow>
                        <TableCell>Current Price</TableCell>
                        <TableCell>{formatCurrency(item.currentREVAPrice || 0)}</TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
                
                {/* Calculation result details */}
                <div className="overflow-hidden rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted">
                        <TableHead>Calculation Results</TableHead>
                        <TableHead>Original</TableHead>
                        <TableHead>New</TableHead>
                        <TableHead>Change</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>Price</TableCell>
                        <TableCell>{formatCurrency(item.currentREVAPrice || 0)}</TableCell>
                        <TableCell>{formatCurrency(item.proposedPrice || item.newPrice || 0)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={getPriceChangeBadgeClass() + " text-white"}>
                            {getPriceChangeDescription()}
                          </Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Margin</TableCell>
                        <TableCell>
                          {formatPercentage(item.currentREVAMargin || 0)}
                        </TableCell>
                        <TableCell>
                          {formatPercentage((item.proposedMargin || 0) * 100)}
                        </TableCell>
                        <TableCell>
                          {getMarginChangeDescription()}
                        </TableCell>
                      </TableRow>
                      {item.revaUsage > 0 && (
                        <>
                          <TableRow>
                            <TableCell>Annual Volume</TableCell>
                            <TableCell colSpan={3}>{item.revaUsage} units</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Annual Revenue</TableCell>
                            <TableCell>{formatCurrency((item.currentREVAPrice || 0) * item.revaUsage)}</TableCell>
                            <TableCell>{formatCurrency((item.proposedPrice || item.newPrice || 0) * item.revaUsage)}</TableCell>
                            <TableCell>
                              {formatCurrency(((item.proposedPrice || item.newPrice || 0) - (item.currentREVAPrice || 0)) * item.revaUsage)}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Annual Profit</TableCell>
                            <TableCell>
                              {formatCurrency(((item.currentREVAPrice || 0) - (item.avgCost || 0)) * item.revaUsage)}
                            </TableCell>
                            <TableCell>
                              {formatCurrency(((item.proposedPrice || item.newPrice || 0) - (item.avgCost || 0)) * item.revaUsage)}
                            </TableCell>
                            <TableCell>
                              {formatCurrency((((item.proposedPrice || item.newPrice || 0) - (item.avgCost || 0)) - 
                                ((item.currentREVAPrice || 0) - (item.avgCost || 0))) * item.revaUsage)}
                            </TableCell>
                          </TableRow>
                        </>
                      )}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Competitor prices table */}
                <div className="overflow-hidden rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted">
                        <TableHead>Competitor Prices</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Diff vs Our Price</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>ETH NET</TableCell>
                        <TableCell>{item.eth_net ? formatCurrency(item.eth_net) : 'N/A'}</TableCell>
                        <TableCell>
                          {item.eth_net ? 
                            `${(((item.proposedPrice || item.newPrice || 0) / item.eth_net) * 100 - 100).toFixed(1)}%` : 
                            'N/A'}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>ETH</TableCell>
                        <TableCell>{item.eth ? formatCurrency(item.eth) : 'N/A'}</TableCell>
                        <TableCell>
                          {item.eth ? 
                            `${(((item.proposedPrice || item.newPrice || 0) / item.eth) * 100 - 100).toFixed(1)}%` : 
                            'N/A'}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>NUPHARM</TableCell>
                        <TableCell>{item.nupharm ? formatCurrency(item.nupharm) : 'N/A'}</TableCell>
                        <TableCell>
                          {item.nupharm ? 
                            `${(((item.proposedPrice || item.newPrice || 0) / item.nupharm) * 100 - 100).toFixed(1)}%` : 
                            'N/A'}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>LEXON</TableCell>
                        <TableCell>{item.lexon ? formatCurrency(item.lexon) : 'N/A'}</TableCell>
                        <TableCell>
                          {item.lexon ? 
                            `${(((item.proposedPrice || item.newPrice || 0) / item.lexon) * 100 - 100).toFixed(1)}%` : 
                            'N/A'}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>AAH</TableCell>
                        <TableCell>{item.aah ? formatCurrency(item.aah) : 'N/A'}</TableCell>
                        <TableCell>
                          {item.aah ? 
                            `${(((item.proposedPrice || item.newPrice || 0) / item.aah) * 100 - 100).toFixed(1)}%` : 
                            'N/A'}
                        </TableCell>
                      </TableRow>
                      {item.trueMarketLow && (!item.eth_net || item.trueMarketLow < item.eth_net) && (
                        <TableRow className="bg-amber-500/10">
                          <TableCell>True Market Low</TableCell>
                          <TableCell>{formatCurrency(item.trueMarketLow)}</TableCell>
                          <TableCell>
                            {`${(((item.proposedPrice || item.newPrice || 0) / item.trueMarketLow) * 100 - 100).toFixed(1)}%`}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
          
          {/* Rules tab - content showing the pricing rule details */}
          <TabsContent value="rules" className="flex-grow overflow-hidden flex flex-col">
            <ScrollArea className="flex-grow">
              <div className="space-y-4 p-1">
                <Alert variant="default">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Rule Applied to This Item</AlertTitle>
                  <AlertDescription className="pt-2">
                    <div><strong>{formatRuleForDisplay()}</strong></div>
                    <div className="text-sm text-muted-foreground mt-1">{getRuleDescription()}</div>
                  </AlertDescription>
                </Alert>

                <div className="border rounded-md p-4">
                  <h3 className="font-semibold text-lg mb-2">Pricing Rules Overview</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-base">Rule 1: AVC &lt; ML</h4>
                      <div className="px-3 py-2 bg-muted rounded-md mt-1">
                        <h5 className="font-medium">Rule 1a - When Next Cost ≤ AVC (Downward)</h5>
                        <p className="text-sm pl-4 mt-1">• Price = ML + usage uplift</p>
                        <p className="text-xs text-muted-foreground pl-4">Usage uplift: 0% (G1-2), 1% (G3-4), 2% (G5-6)</p>
                        
                        <Separator className="my-2" />
                        
                        <h5 className="font-medium">Rule 1b - When Next Cost &gt; AVC (Upward)</h5>
                        <p className="text-sm pl-4 mt-1">• Price = Max(ML + 3% + usage uplift, AVC + 12%)</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-base">Rule 2: AVC ≥ ML</h4>
                      <div className="px-3 py-2 bg-muted rounded-md mt-1">
                        <h5 className="font-medium">Rule 2a - When Next Cost ≤ AVC (Downward)</h5>
                        <p className="text-sm pl-4 mt-1">• Price = Min(ML + 3% + usage uplift, AVC + 12% + usage uplift)</p>
                        
                        <Separator className="my-2" />
                        
                        <h5 className="font-medium">Rule 2b - When Next Cost &gt; AVC (Upward)</h5>
                        <p className="text-sm pl-4 mt-1">• Price = Max(ML + 3% + usage uplift, AVC + 12% + usage uplift)</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-base">Fallbacks When Market Low is Missing</h4>
                      <div className="px-3 py-2 bg-muted rounded-md mt-1 space-y-2">
                        <p className="text-sm">• If ML (ETH NET) is missing:</p>
                        <p className="text-sm pl-4">→ Use minimum of all competitor prices (ETH NET, NUPHARM, ETH, AAH, LEXON) + 3% + uplift</p>
                        
                        <p className="text-sm">• If no valid competitor prices:</p>
                        <p className="text-sm pl-4">→ Use AVC + 12% + uplift</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-base">Margin Caps for Low-Value Items</h4>
                      <div className="px-3 py-2 bg-muted rounded-md mt-1">
                        <p className="text-sm">For items with AVC ≤ £1.00:</p>
                        <ul className="list-disc list-inside text-sm pl-4 mt-1 space-y-1">
                          <li>Group 1-2: Maximum 50% margin</li>
                          <li>Group 3-4: Maximum 40% margin</li>
                          <li>Group 5-6: Maximum 30% margin</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-base">Usage Group Uplift</h4>
                      <div className="px-3 py-2 bg-muted rounded-md mt-1">
                        <p className="text-sm">Usage-based uplifts are applied to certain pricing rules:</p>
                        <ul className="list-disc list-inside text-sm pl-4 mt-1 space-y-1">
                          <li>Group 1-2 (high volume): 0% uplift</li>
                          <li>Group 3-4 (medium volume): 1% uplift</li>
                          <li>Group 5-6 (low volume): 2% uplift</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-base">Exception Flags</h4>
                      <div className="px-3 py-2 bg-muted rounded-md mt-1">
                        <ul className="list-disc list-inside text-sm pl-4 mt-1 space-y-1">
                          <li>High Price Flag: Price ≥ 10% above True Market Low</li>
                          <li>Low Margin Flag: Margin ≤ 0%</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
          
          {/* Usage impact tab - impact metrics and chart */}
          <TabsContent value="impact" className="flex-grow overflow-hidden flex flex-col">
            <ScrollArea className="flex-grow">
              <div className="space-y-4 p-1">
                {item.revaUsage > 0 ? (
                  <>
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle>Usage Impact</AlertTitle>
                      <AlertDescription>
                        This item has an annual usage of <strong>{item.revaUsage}</strong> units, which affects its importance in overall business metrics.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Annual metrics */}
                      <div className="border rounded-md p-4">
                        <h3 className="font-semibold text-base mb-2">Annual Impact</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Annual Revenue:</span>
                            <span>{formatCurrency((item.proposedPrice || item.newPrice || 0) * item.revaUsage)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Annual Cost:</span>
                            <span>{formatCurrency((item.avgCost || 0) * item.revaUsage)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Annual Profit:</span>
                            <span>{formatCurrency(((item.proposedPrice || item.newPrice || 0) - (item.avgCost || 0)) * item.revaUsage)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Profit Change:</span>
                            <span>{formatCurrency((((item.proposedPrice || item.newPrice || 0) - (item.avgCost || 0)) - 
                              ((item.currentREVAPrice || 0) - (item.avgCost || 0))) * item.revaUsage)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Margin comparison */}
                      <div className="border rounded-md p-4">
                        <h3 className="font-semibold text-base mb-2">Margin Comparison</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Current Margin:</span>
                            <span>{formatPercentage(item.currentREVAMargin || 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>New Margin:</span>
                            <span>{formatPercentage((item.proposedMargin || 0) * 100)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Margin Change:</span>
                            <span>
                              {((item.proposedMargin || 0) * 100 - (item.currentREVAMargin || 0)).toFixed(2)}
                              percentage points
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Metric visualization */}
                    <div className="border rounded-md p-4">
                      <h3 className="font-semibold text-base mb-2">Metrics Visualization</h3>
                      <div className="h-64">
                        <RevaMetricsChartUpdated 
                          data={[
                            {
                              name: "Current",
                              price: item.currentREVAPrice || 0,
                              cost: item.avgCost || 0,
                              revenue: (item.currentREVAPrice || 0) * item.revaUsage,
                              profit: ((item.currentREVAPrice || 0) - (item.avgCost || 0)) * item.revaUsage,
                              margin: item.currentREVAMargin || 0,
                            },
                            {
                              name: "New",
                              price: item.proposedPrice || item.newPrice || 0,
                              cost: item.avgCost || 0,
                              revenue: (item.proposedPrice || item.newPrice || 0) * item.revaUsage,
                              profit: ((item.proposedPrice || item.newPrice || 0) - (item.avgCost || 0)) * item.revaUsage,
                              margin: (item.proposedMargin || 0) * 100,
                            }
                          ]}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No Usage Data</AlertTitle>
                    <AlertDescription>
                      This item doesn't have usage data recorded, so impact metrics cannot be calculated.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PricingRuleExplainer;
