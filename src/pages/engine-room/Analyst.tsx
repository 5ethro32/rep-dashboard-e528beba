
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useEngineRoom } from '@/contexts/EngineRoomContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import DonutChart from '@/components/DonutChart';
import LineChart from '@/components/LineChart';
import MetricCard from '@/components/MetricCard';
import { calculateUsageWeightedMetrics } from '@/utils/formatting-utils';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { formatCurrency, formatPercentage } from '@/utils/formatting-utils';
import { BarChart, Bar, XAxis, YAxis, Rectangle, ResponsiveContainer, Cell } from 'recharts';
import PriceOppurtunityTable from '@/components/analyst/PriceOppurtunityTable';
import CompetitorAnalysis from '@/components/analyst/CompetitorAnalysis';
import SwotAnalysis from '@/components/analyst/SwotAnalysis';
import PriceRecommendations from '@/components/analyst/PriceRecommendations';
import { Skeleton } from '@/components/ui/skeleton';

const Analyst = () => {
  const { engineData, isLoading } = useEngineRoom();
  const [activeTab, setActiveTab] = useState('insights');

  // Calculate key metrics if we have data
  const metrics = engineData?.items ? calculateUsageWeightedMetrics(engineData.items) : null;

  // Prepare data for margin distribution chart
  const marginData = metrics?.marginDistribution || [];

  // Prepare price position data
  const pricePositionData = React.useMemo(() => {
    if (!engineData?.items) return [];
    
    // Calculate price position distribution
    const result = [
      { name: 'Below Market', value: 0, count: 0, color: '#34d399' },
      { name: 'At Market', value: 0, count: 0, color: '#60a5fa' },
      { name: 'Above Market', value: 0, count: 0, color: '#f87171' }
    ];
    
    engineData.items.forEach(item => {
      if (!item.noMarketPrice && item.trueMarketLow > 0) {
        const currentPrice = item.proposedPrice || item.currentREVAPrice;
        
        // Calculate position relative to market
        const marketRatio = currentPrice / item.trueMarketLow;
        
        if (marketRatio < 0.95) {
          result[0].count++;
          result[0].value += (item.revaUsage || 0);
        } else if (marketRatio <= 1.05) {
          result[1].count++;
          result[1].value += (item.revaUsage || 0);
        } else {
          result[2].count++;
          result[2].value += (item.revaUsage || 0);
        }
      }
    });
    
    // Convert to percentages
    const totalCount = result.reduce((sum, item) => sum + item.value, 0);
    
    return result.map(item => ({
      ...item,
      value: totalCount > 0 ? (item.value / totalCount) * 100 : 0
    }));
  }, [engineData]);

  // Prepare monthly trend data
  const trendData = [
    { name: 'Jan', value: 15.4, avg: 14.3 },
    { name: 'Feb', value: 15.8, avg: 14.5 },
    { name: 'Mar', value: 14.9, avg: 14.6 },
    { name: 'Apr', value: 15.2, avg: 14.8 },
    { name: 'May', value: 15.5, avg: 15.0 },
    { name: 'Jun', value: 16.1, avg: 15.1 },
  ];

  // Define chart configuration
  const chartConfig = {
    margin: { label: 'Margin %', color: '#f87171' },
    count: { label: 'Products', color: '#60a5fa' }
  };

  if (isLoading) {
    return (
      <div className="container p-4 md:p-6 space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">Pricing Analyst</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="border border-white/10 bg-gray-900/40 backdrop-blur-sm">
              <CardContent className="p-6">
                <Skeleton className="h-[180px] w-full bg-white/5" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container p-4 md:p-6 space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Pricing Analyst</h2>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full md:w-auto grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="insights">Strategic Insights</TabsTrigger>
          <TabsTrigger value="competitors">Competitive Analysis</TabsTrigger>
          <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
          <TabsTrigger value="swot">SWOT Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="insights" className="space-y-6">
          {/* Row 1: Key metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="Usage-Weighted Margin"
              value={metrics ? formatPercentage(metrics.weightedMargin / 100) : '0.00%'}
              subtitle={`Across ${metrics?.validItemCount || 0} active products`}
              icon={<div className="h-4 w-4 rounded-full bg-blue-500" />}
              valueSize="large"
            />
            <MetricCard
              title="Market Position"
              value={formatPercentage(pricePositionData[1]?.value / 100 || 0)}
              subtitle="Products priced at market level"
              icon={<div className="h-4 w-4 rounded-full bg-green-500" />}
              valueSize="large"
            />
            <MetricCard
              title="Price Opportunity Score"
              value={metrics ? `${Math.round((metrics.weightedMargin / 30) * 100)}%` : '0%'}
              subtitle="Based on margin optimization potential"
              icon={<div className="h-4 w-4 rounded-full bg-purple-500" />}
              valueSize="large"
            />
          </div>

          {/* Row 2: Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Price position chart */}
            <Card className="border border-white/10 bg-gray-900/40 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Market Price Positioning</CardTitle>
                <CardDescription>Product positioning by market price comparison</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <DonutChart 
                    data={pricePositionData} 
                    innerValue={`${pricePositionData[1]?.count || 0}`}
                    innerLabel="At Market"
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Margin distribution chart */}
            <Card className="border border-white/10 bg-gray-900/40 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Margin Distribution</CardTitle>
                <CardDescription>Profile of margin categories by product count</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ChartContainer config={chartConfig}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={marginData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
                        barCategoryGap={5}
                      >
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
                          tickFormatter={(value) => `${value}`}
                        />
                        <ChartTooltip 
                          content={<ChartTooltipContent />}
                        />
                        <Bar dataKey="count" fill="#8884d8" shape={<Rectangle radius={[4, 4, 0, 0]} />}>
                          {marginData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Row 3: Margin Trend Chart */}
          <Card className="border border-white/10 bg-gray-900/40 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Margin Trend Analysis</CardTitle>
              <CardDescription>6-month trend of usage-weighted margin</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <LineChart 
                  data={trendData} 
                  color="#ef4444" 
                  avgColor="#8b5cf6"
                  hasPercentageMetric={true}
                  yAxisFormatter={(value) => `${value}%`}
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Row 4: Price Opportunities */}
          <PriceOppurtunityTable />
        </TabsContent>
        
        <TabsContent value="competitors" className="space-y-6">
          <CompetitorAnalysis />
        </TabsContent>
        
        <TabsContent value="recommendations" className="space-y-6">
          <PriceRecommendations />
        </TabsContent>
        
        <TabsContent value="swot" className="space-y-6">
          <SwotAnalysis />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analyst;
