
import React from 'react';
import { useEngineRoom } from '@/contexts/EngineRoomContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatPercentage } from '@/utils/formatting-utils';
import { TrendingUp, TrendingDown, Info } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type RecommendationType = 'increase' | 'decrease' | 'maintain';

interface Recommendation {
  id: string;
  productName: string;
  currentPrice: number;
  recommendedPrice: number;
  percentChange: number;
  reasoning: string;
  impact: number;
  priority: 'high' | 'medium' | 'low';
  type: RecommendationType;
}

const PriceRecommendations: React.FC = () => {
  const { engineData } = useEngineRoom();
  
  // Generate recommendations based on engineData
  const recommendations = React.useMemo(() => {
    if (!engineData?.items) return [];
    
    const results: Recommendation[] = [];
    
    // Identify products with pricing opportunities
    engineData.items.forEach(item => {
      if (!item.id || !item.description) return;
      
      const currentPrice = item.proposedPrice || item.currentREVAPrice || 0;
      let recommendedPrice = currentPrice;
      let reasoning = '';
      let type: RecommendationType = 'maintain';
      let priority: 'high' | 'medium' | 'low' = 'low';
      
      // Check if we have market price data
      if (!item.noMarketPrice && item.trueMarketLow > 0) {
        const marketPrice = item.trueMarketLow;
        const marketGap = ((currentPrice - marketPrice) / marketPrice) * 100;
        
        // Case 1: Price significantly below market with good usage
        if (marketGap < -8 && item.revaUsage > 50) {
          recommendedPrice = currentPrice * 1.05; // 5% increase
          reasoning = `Price is ${Math.abs(marketGap).toFixed(1)}% below market average with strong usage`;
          type = 'increase';
          priority = 'high';
        }
        // Case 2: Price significantly above market
        else if (marketGap > 12) {
          recommendedPrice = Math.max(currentPrice * 0.96, item.avgCost * 1.1); // 4% decrease but ensure margin
          reasoning = `Price is ${marketGap.toFixed(1)}% above market average, risking competitiveness`;
          type = 'decrease';
          priority = marketGap > 20 ? 'high' : 'medium';
        }
        // Case 3: Low margin product
        else if (item.avgCost && item.avgCost > 0) {
          const margin = (currentPrice - item.avgCost) / currentPrice;
          if (margin < 0.08 && marketGap < 5) { // Low margin but not significantly above market
            recommendedPrice = item.avgCost * 1.15; // 15% above cost
            reasoning = `Current margin is very low at ${(margin * 100).toFixed(1)}%, below target thresholds`;
            type = 'increase';
            priority = 'medium';
          }
        }
      } 
      // Cases without market price
      else if (item.avgCost && item.avgCost > 0) {
        const margin = (currentPrice - item.avgCost) / currentPrice;
        
        // Very low margin products
        if (margin < 0.05) {
          recommendedPrice = item.avgCost * 1.15; // 15% above cost
          reasoning = `Critical low margin of ${(margin * 100).toFixed(1)}%, below minimum threshold`;
          type = 'increase';
          priority = 'high';
        }
      }
      
      // Only add if there's a recommendation to change price
      if (recommendedPrice !== currentPrice) {
        const percentChange = ((recommendedPrice - currentPrice) / currentPrice) * 100;
        const impact = percentChange * (item.revaUsage || 0) / 100;
        
        results.push({
          id: item.id,
          productName: item.description,
          currentPrice,
          recommendedPrice,
          percentChange,
          reasoning,
          impact,
          priority,
          type
        });
      }
    });
    
    // Sort recommendations by priority and impact
    return results
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority];
        const bPriority = priorityOrder[b.priority];
        
        if (aPriority !== bPriority) return bPriority - aPriority;
        return Math.abs(b.impact) - Math.abs(a.impact);
      })
      .slice(0, 10); // Top 10 recommendations
      
  }, [engineData]);
  
  // Calculate the overall impact of all recommendations
  const overallImpact = React.useMemo(() => {
    return recommendations.reduce((total, rec) => total + rec.impact, 0);
  }, [recommendations]);

  // Calculate metrics
  const increaseCount = recommendations.filter(r => r.type === 'increase').length;
  const decreaseCount = recommendations.filter(r => r.type === 'decrease').length;
  
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border border-white/10 bg-gray-900/40 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">AI Recommendations</h3>
              <p className="text-sm text-white/70">Algorithmic price change suggestions</p>
              <div className="grid grid-cols-3 gap-4 pt-4">
                <div>
                  <p className="text-sm text-white/50">Total</p>
                  <p className="text-2xl font-bold">{recommendations.length}</p>
                </div>
                <div>
                  <p className="text-sm text-white/50">Increases</p>
                  <p className="text-2xl font-bold text-green-500">{increaseCount}</p>
                </div>
                <div>
                  <p className="text-sm text-white/50">Decreases</p>
                  <p className="text-2xl font-bold text-red-500">{decreaseCount}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border border-white/10 bg-gray-900/40 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Estimated Impact</h3>
              <p className="text-sm text-white/70">Projected outcome if all applied</p>
              <div className="pt-4 flex items-center gap-2">
                <p className={`text-2xl font-bold ${overallImpact >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatCurrency(overallImpact)}
                </p>
                {overallImpact >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-green-500" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-500" />
                )}
              </div>
              <p className="text-sm text-white/50">Usage-weighted price impact</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border border-white/10 bg-gray-900/40 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Recommendation Basis</h3>
              <p className="text-sm text-white/70">Key factors for price suggestions</p>
              <ul className="pt-3 space-y-1 text-sm text-white/80">
                <li>• Market price comparison</li>
                <li>• Cost-based margin analysis</li>
                <li>• Usage and demand patterns</li>
                <li>• Competitive positioning</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="border border-white/10 bg-gray-900/40 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">Price Change Recommendations</CardTitle>
          <CardDescription>AI generated pricing suggestions based on comprehensive analysis</CardDescription>
        </CardHeader>
        <CardContent>
          {recommendations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Current Price</TableHead>
                  <TableHead>Recommended Price</TableHead>
                  <TableHead>Change</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Reasoning</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recommendations.map(rec => (
                  <TableRow key={rec.id}>
                    <TableCell className="font-medium truncate max-w-[180px]">
                      {rec.productName}
                    </TableCell>
                    <TableCell>{formatCurrency(rec.currentPrice)}</TableCell>
                    <TableCell>{formatCurrency(rec.recommendedPrice)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {rec.percentChange > 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                        <span className={rec.percentChange > 0 ? "text-green-500" : "text-red-500"}>
                          {formatPercentage(Math.abs(rec.percentChange) / 100)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={rec.priority === 'high' ? "destructive" : rec.priority === 'medium' ? "default" : "secondary"}
                        className="capitalize"
                      >
                        {rec.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate">
                      <div className="flex items-center gap-1">
                        <Info className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground truncate">{rec.reasoning}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-white/60">
              <p>No price change recommendations generated for current data set</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t border-white/10 flex justify-between p-4">
          <p className="text-sm text-white/50">
            AI recommendations based on market data, costs, and usage patterns
          </p>
          <Button variant="outline" size="sm">
            Apply Recommendations
          </Button>
        </CardFooter>
      </Card>
    </>
  );
};

export default PriceRecommendations;
