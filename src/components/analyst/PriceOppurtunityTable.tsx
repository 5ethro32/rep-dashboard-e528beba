
import React from 'react';
import { useEngineRoom } from '@/contexts/EngineRoomContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { formatCurrency, formatPercentage } from '@/utils/formatting-utils';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';

const PriceOppurtunityTable: React.FC = () => {
  const { engineData } = useEngineRoom();

  // Find top opportunities and risks based on market price comparison and usage
  const opportunities = React.useMemo(() => {
    if (!engineData?.items) return [];
    
    const potentialOpportunities = engineData.items
      .filter(item => 
        // Filter for valid market price info and significant usage
        !item.noMarketPrice && 
        item.trueMarketLow > 0 && 
        item.revaUsage > 0
      )
      .map(item => {
        const currentPrice = item.proposedPrice || item.currentREVAPrice;
        const marketPrice = item.trueMarketLow;
        const priceDifference = ((currentPrice - marketPrice) / marketPrice) * 100;
        const avgCost = item.avgCost || 0;
        const currentMargin = currentPrice > 0 ? ((currentPrice - avgCost) / currentPrice) * 100 : 0;
        const potentialMargin = marketPrice > 0 ? ((marketPrice - avgCost) / marketPrice) * 100 : 0;
        const marginDifference = potentialMargin - currentMargin;
        const revenue = item.revaUsage * currentPrice;
        const potentialRevenue = item.revaUsage * marketPrice;
        const revenueDifference = potentialRevenue - revenue;
        
        return {
          id: item.id,
          description: item.description,
          currentPrice,
          marketPrice,
          priceDifference,
          currentMargin,
          potentialMargin,
          marginDifference,
          usage: item.revaUsage,
          revenue,
          potentialRevenue,
          revenueDifference,
          // Calculate an opportunity score
          opportunityScore: Math.abs(priceDifference) * (item.revaUsage / 100)
        };
      })
      .sort((a, b) => b.opportunityScore - a.opportunityScore)
      .slice(0, 5);
    
    return potentialOpportunities;
  }, [engineData]);

  if (opportunities.length === 0) {
    return (
      <Card className="border border-white/10 bg-gray-900/40 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">Top Price Opportunities</CardTitle>
          <CardDescription>No price opportunity data available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border border-white/10 bg-gray-900/40 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg">Top Price Opportunities</CardTitle>
        <CardDescription>Products with highest potential for price optimization</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Current Price</TableHead>
              <TableHead>Market Price</TableHead>
              <TableHead>Gap</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Revenue Impact</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {opportunities.map(opp => (
              <TableRow key={opp.id}>
                <TableCell className="font-medium truncate max-w-[200px]">
                  {opp.description}
                </TableCell>
                <TableCell>{formatCurrency(opp.currentPrice)}</TableCell>
                <TableCell>{formatCurrency(opp.marketPrice)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {opp.priceDifference < 0 ? (
                      <TrendingDown className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingUp className="h-4 w-4 text-red-500" />
                    )}
                    <span>
                      {formatPercentage(Math.abs(opp.priceDifference) / 100)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{opp.usage.toLocaleString()}</TableCell>
                <TableCell className={opp.revenueDifference > 0 ? "text-green-400" : "text-red-400"}>
                  {formatCurrency(opp.revenueDifference)}
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={opp.priceDifference < 0 ? "default" : "destructive"}
                    className="whitespace-nowrap"
                  >
                    {opp.priceDifference < 0 ? "Increase Price" : "Review Price"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default PriceOppurtunityTable;
