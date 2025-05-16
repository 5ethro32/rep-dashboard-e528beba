
import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatCurrency } from '@/utils/formatting-utils';

interface PricingActionRecommendationsProps {
  data: any[];
}

const PricingActionRecommendations: React.FC<PricingActionRecommendationsProps> = ({ data }) => {
  const [actionType, setActionType] = useState<string>('increase');

  const actionRecommendations = useMemo(() => {
    if (!data || data.length === 0) return {
      increase: [],
      decrease: [],
      review: [],
      summary: []
    };

    // Filter to only include products with all necessary data points
    const filteredData = data.filter(item => 
      item.currentREVAPrice > 0 && 
      item.avgCost > 0 && 
      item.revaUsage > 0
    );

    // Recommendations for price increases
    const increaseRecs = filteredData
      .filter(item => {
        const currentMargin = (item.currentREVAPrice - item.avgCost) / item.currentREVAPrice * 100;
        return currentMargin < 15 && item.revaUsage >= 5;
      })
      .map(item => {
        const currentMargin = (item.currentREVAPrice - item.avgCost) / item.currentREVAPrice * 100;
        const targetPrice = item.avgCost / (1 - 0.15); // Price to achieve 15% margin
        const priceDiff = targetPrice - item.currentREVAPrice;
        const percentIncrease = (priceDiff / item.currentREVAPrice) * 100;
        const impactValue = priceDiff * item.revaUsage;
        
        return {
          id: item.id,
          name: item.description?.substring(0, 30) || 'Unknown',
          currentPrice: item.currentREVAPrice,
          currentMargin: currentMargin.toFixed(1),
          recommendedPrice: targetPrice.toFixed(2),
          priceChange: priceDiff.toFixed(2),
          percentChange: percentIncrease.toFixed(1),
          usage: item.revaUsage,
          impact: impactValue.toFixed(2),
          reason: currentMargin < 0 ? 'Negative margin' : 'Low margin',
          priority: currentMargin < 0 ? 'High' : currentMargin < 10 ? 'Medium' : 'Low'
        };
      })
      .sort((a, b) => Number(b.impact) - Number(a.impact));

    // Recommendations for price decreases
    const decreaseRecs = filteredData
      .filter(item => {
        const currentMargin = (item.currentREVAPrice - item.avgCost) / item.currentREVAPrice * 100;
        return currentMargin > 30 && 
               item.ethNetPrice > 0 && 
               item.currentREVAPrice > item.ethNetPrice * 1.15 &&
               item.revaUsage < 10;
      })
      .map(item => {
        const currentMargin = (item.currentREVAPrice - item.avgCost) / item.currentREVAPrice * 100;
        const marketCompetitivePrice = item.ethNetPrice * 1.1; // 10% above market
        const priceDiff = marketCompetitivePrice - item.currentREVAPrice;
        const percentChange = (priceDiff / item.currentREVAPrice) * 100;
        
        // Estimate usage increase based on price elasticity
        // Using a simple model: for every 10% price decrease, usage increases by X%
        const elasticityFactor = 1.5; // 1.5x usage increase for every 10% price decrease
        const effectivePercentChange = Math.abs(percentChange);
        const estimatedUsageIncrease = item.revaUsage * (Math.pow(1 + (elasticityFactor * 0.1), effectivePercentChange/10) - 1);
        
        // Calculate revenue impact after usage increase
        const newUsage = item.revaUsage + estimatedUsageIncrease;
        const currentRevenue = item.currentREVAPrice * item.revaUsage;
        const newRevenue = marketCompetitivePrice * newUsage;
        const revenueImpact = newRevenue - currentRevenue;
        
        return {
          id: item.id,
          name: item.description?.substring(0, 30) || 'Unknown',
          currentPrice: item.currentREVAPrice,
          currentMargin: currentMargin.toFixed(1),
          recommendedPrice: marketCompetitivePrice.toFixed(2),
          priceChange: priceDiff.toFixed(2),
          percentChange: percentChange.toFixed(1),
          usage: item.revaUsage,
          estimatedNewUsage: newUsage.toFixed(0),
          impact: revenueImpact.toFixed(2),
          reason: 'Significantly above market',
          priority: currentMargin > 50 ? 'High' : currentMargin > 40 ? 'Medium' : 'Low'
        };
      })
      .sort((a, b) => Number(b.impact) - Number(a.impact));

    // Products that need review
    const reviewRecs = filteredData
      .filter(item => {
        // Products with unusual pricing characteristics
        const currentMargin = (item.currentREVAPrice - item.avgCost) / item.currentREVAPrice * 100;
        
        return (item.avgCost === 0 && item.currentREVAPrice > 0) || // No cost data
               (item.ethNetPrice === 0 && item.currentREVAPrice > 0) || // No market price data
               (item.revaUsage > 20 && currentMargin < 0); // High usage negative margin
      })
      .map(item => {
        const currentMargin = item.currentREVAPrice > 0 ? 
          (item.currentREVAPrice - item.avgCost) / item.currentREVAPrice * 100 : 0;
        
        let reason = 'Needs review';
        if (item.avgCost === 0) reason = 'Missing cost data';
        else if (item.ethNetPrice === 0) reason = 'Missing market price data';
        else if (currentMargin < 0 && item.revaUsage > 20) reason = 'High volume negative margin';
        
        return {
          id: item.id,
          name: item.description?.substring(0, 30) || 'Unknown',
          currentPrice: item.currentREVAPrice,
          currentMargin: currentMargin.toFixed(1),
          cost: item.avgCost,
          marketPrice: item.ethNetPrice,
          usage: item.revaUsage,
          reason,
          priority: currentMargin < 0 && item.revaUsage > 20 ? 'High' : 
                   item.revaUsage > 10 ? 'Medium' : 'Low'
        };
      })
      .sort((a, b) => b.usage - a.usage);

    // Summary for the chart
    const summary = [
      {
        name: 'Price Increase',
        value: increaseRecs.length,
        fill: '#10b981' // Green
      },
      {
        name: 'Price Decrease',
        value: decreaseRecs.length,
        fill: '#3b82f6' // Blue
      },
      {
        name: 'Needs Review',
        value: reviewRecs.length,
        fill: '#f97316' // Orange
      }
    ];

    return {
      increase: increaseRecs,
      decrease: decreaseRecs,
      review: reviewRecs,
      summary
    };
  }, [data]);

  if (!actionRecommendations.increase.length && !actionRecommendations.decrease.length && !actionRecommendations.review.length) {
    return (
      <div className="text-center py-8">
        <h3 className="text-xl font-semibold mb-2">Price Action Recommendations</h3>
        <p className="text-muted-foreground">Insufficient data for generating pricing recommendations</p>
      </div>
    );
  }

  const renderActionTable = () => {
    let recommendations = [];
    let columns = [];
    
    switch (actionType) {
      case 'increase':
        recommendations = actionRecommendations.increase.slice(0, 15);
        columns = [
          { key: 'name', label: 'Product' },
          { key: 'currentPrice', label: 'Current Price', format: (val) => `£${Number(val).toFixed(2)}` },
          { key: 'currentMargin', label: 'Current Margin', format: (val) => `${val}%` },
          { key: 'recommendedPrice', label: 'Rec. Price', format: (val) => `£${val}` },
          { key: 'priceChange', label: 'Change', format: (val) => `£${val}` },
          { key: 'percentChange', label: '% Change', format: (val) => `${val}%` },
          { key: 'usage', label: 'Usage' },
          { key: 'priority', label: 'Priority' }
        ];
        break;
      case 'decrease':
        recommendations = actionRecommendations.decrease.slice(0, 15);
        columns = [
          { key: 'name', label: 'Product' },
          { key: 'currentPrice', label: 'Current Price', format: (val) => `£${Number(val).toFixed(2)}` },
          { key: 'currentMargin', label: 'Current Margin', format: (val) => `${val}%` },
          { key: 'recommendedPrice', label: 'Rec. Price', format: (val) => `£${val}` },
          { key: 'priceChange', label: 'Change', format: (val) => `£${val}` },
          { key: 'usage', label: 'Usage' },
          { key: 'estimatedNewUsage', label: 'Est. New Usage' },
          { key: 'priority', label: 'Priority' }
        ];
        break;
      case 'review':
        recommendations = actionRecommendations.review.slice(0, 15);
        columns = [
          { key: 'name', label: 'Product' },
          { key: 'currentPrice', label: 'Current Price', format: (val) => `£${Number(val).toFixed(2)}` },
          { key: 'currentMargin', label: 'Current Margin', format: (val) => `${val}%` },
          { key: 'usage', label: 'Usage' },
          { key: 'reason', label: 'Reason' },
          { key: 'priority', label: 'Priority' }
        ];
        break;
    }

    if (recommendations.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No recommendations in this category</p>
        </div>
      );
    }
    
    return (
      <div className="rounded-md border border-white/10 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map(col => (
                <TableHead key={col.key} className={col.key === 'name' ? '' : 'w-[100px]'}>
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {recommendations.map((rec) => (
              <TableRow key={rec.id}>
                {columns.map(col => (
                  <TableCell key={`${rec.id}-${col.key}`}>
                    {col.key === 'priority' ? (
                      <Badge variant={
                          rec.priority === 'High' ? 'destructive' : 
                          rec.priority === 'Medium' ? 'default' : 
                          'outline'
                        }
                      >
                        {rec.priority}
                      </Badge>
                    ) : col.format ? col.format(rec[col.key]) : rec[col.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  const calculateImpactSummary = () => {
    const totalIncreaseValue = actionRecommendations.increase.reduce((sum, item) => sum + Number(item.impact), 0);
    const totalDecreaseValue = actionRecommendations.decrease.reduce((sum, item) => sum + Number(item.impact), 0);
    const totalProductsToReview = actionRecommendations.review.length;
    
    const highPriorityCount = [
      ...actionRecommendations.increase,
      ...actionRecommendations.decrease,
      ...actionRecommendations.review
    ].filter(item => item.priority === 'High').length;
    
    return { totalIncreaseValue, totalDecreaseValue, totalProductsToReview, highPriorityCount };
  };

  const impactSummary = calculateImpactSummary();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-1">Price Action Recommendations</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Actionable pricing recommendations to optimize margin and market position
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <div className="space-y-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={actionRecommendations.summary}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#999' }} />
                  <YAxis tick={{ fill: '#999' }} />
                  <Tooltip 
                    formatter={(value) => [`${value} products`, 'Count']}
                    contentStyle={{ backgroundColor: '#333', borderColor: '#555' }}
                  />
                  <Bar dataKey="value" barSize={60}>
                    {actionRecommendations.summary.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <Card className="border border-white/10 bg-gray-800/30">
              <CardContent className="p-4 space-y-3">
                <h4 className="font-medium">Potential Impact Summary</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Revenue Increase Potential:</p>
                    <p className="font-medium">{formatCurrency(impactSummary.totalIncreaseValue)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Elasticity Revenue Impact:</p>
                    <p className="font-medium">{formatCurrency(impactSummary.totalDecreaseValue)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Products Needing Review:</p>
                    <p className="font-medium">{impactSummary.totalProductsToReview}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">High Priority Actions:</p>
                    <p className="font-medium">{impactSummary.highPriorityCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="lg:col-span-3">
          <Tabs defaultValue="increase" className="w-full" onValueChange={setActionType}>
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="increase">Price Increases ({actionRecommendations.increase.length})</TabsTrigger>
              <TabsTrigger value="decrease">Price Decreases ({actionRecommendations.decrease.length})</TabsTrigger>
              <TabsTrigger value="review">Needs Review ({actionRecommendations.review.length})</TabsTrigger>
            </TabsList>

            <TabsContent value={actionType} className="mt-0">
              {renderActionTable()}
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <div className="text-xs text-muted-foreground mt-3 px-4">
        <p>
          These recommendations are based on margin analysis, market price comparison, and usage patterns.
          The priority is determined by the potential financial impact and urgency of the price action.
        </p>
      </div>
    </div>
  );
};

export default PricingActionRecommendations;
