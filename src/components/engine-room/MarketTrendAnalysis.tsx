import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { ScatterChart } from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown } from 'lucide-react';
import DonutChart from '@/components/DonutChart';
interface MarketTrendAnalysisProps {
  data: any[];
}
const MarketTrendAnalysis: React.FC<MarketTrendAnalysisProps> = ({
  data
}) => {
  const [chartType, setChartType] = useState<'trend' | 'usage'>('trend');

  // Process data for trend analysis
  const trendData = useMemo(() => {
    if (!data || data.length === 0) return {
      trendDistribution: [],
      scatterData: [],
      trendCounts: {
        up: 0,
        down: 0
      }
    };

    // For trend distribution
    let trendingUp = 0;
    let trendingDown = 0;
    const scatterData: any[] = [];
    data.forEach(item => {
      // Determine trend
      const isTrendingDown = item.nextCost <= item.avgCost;
      if (isTrendingDown) {
        trendingDown++;
      } else {
        trendingUp++;
      }

      // Add to scatter data
      if (item.revaUsage > 0 && item.currentREVAMargin !== undefined) {
        scatterData.push({
          usage: item.revaUsage,
          margin: item.currentREVAMargin * 100,
          price: item.currentREVAPrice,
          profit: (item.currentREVAPrice - item.avgCost) * item.revaUsage,
          name: item.description,
          trend: isTrendingDown ? 'down' : 'up'
        });
      }
    });

    // Use colors that match the homepage donut charts
    const trendDistribution = [{
      name: 'Trending UP',
      value: trendingUp,
      color: '#f87171'
    },
    // Lighter red
    {
      name: 'Trending DOWN',
      value: trendingDown,
      color: '#ef4444'
    } // Main red
    ];
    return {
      trendDistribution,
      scatterData: scatterData.sort((a, b) => b.usage - a.usage).slice(0, 100),
      // Top 100 by usage
      trendCounts: {
        up: trendingUp,
        down: trendingDown
      }
    };
  }, [data]);

  // Custom tooltip for scatter chart
  const CustomScatterTooltip = ({
    active,
    payload
  }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return <div className="bg-gray-800 p-3 border border-gray-700 rounded-md shadow-lg">
          <p className="font-medium mb-1">{data.name}</p>
          <div className="text-sm space-y-1">
            <p>Usage: {data.usage.toLocaleString()}</p>
            <p>Price: £{data.price?.toFixed(2)}</p>
            <p>Margin: {data.margin?.toFixed(2)}%</p>
            <p>Profit: £{data.profit?.toFixed(2)}</p>
            <div className="flex items-center mt-1">
              <Badge variant="outline" className={data.trend === 'down' ? 'bg-red-900/20 text-red-400 border-red-900' : 'bg-red-500/20 text-red-300 border-red-700'}>
                {data.trend === 'down' ? 'Trending DOWN' : 'Trending UP'}
              </Badge>
            </div>
          </div>
        </div>;
    }
    return null;
  };
  return <div className="space-y-4 mb-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Market Trend Analysis</h2>
        <div className="flex space-x-2">
          <Button variant={chartType === 'trend' ? 'default' : 'outline'} size="sm" onClick={() => setChartType('trend')} className={chartType === 'trend' ? 'bg-finance-red hover:bg-finance-red/90' : ''}>
            Trend Distribution
          </Button>
          <Button variant={chartType === 'usage' ? 'default' : 'outline'} size="sm" onClick={() => setChartType('usage')} className={chartType === 'usage' ? 'bg-finance-red hover:bg-finance-red/90' : ''}>
            Usage vs Margin
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        <Card className="border border-white/10 bg-gray-900/40 backdrop-blur-sm shadow-lg">
          <CardContent className="p-4">
            {chartType === 'trend' ? <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1 flex flex-col justify-center space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg font-medium">Market Price Trend</h3>
                    <p className="text-sm text-muted-foreground">Distribution of products by price trend</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-red-900/20 rounded-md">
                      <div className="flex items-center">
                        <ChevronDown className="h-5 w-5 text-red-400 mr-2" />
                        <span className="font-medium">Trending DOWN</span>
                      </div>
                      <div className="font-bold">{trendData.trendCounts.down}</div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-red-500/20 rounded-md">
                      <div className="flex items-center">
                        <ChevronUp className="h-5 w-5 text-red-300 mr-2" />
                        <span className="font-medium">Trending UP</span>
                      </div>
                      <div className="font-bold">{trendData.trendCounts.up}</div>
                    </div>
                  </div>
                </div>
                
                <div className="md:col-span-2 h-80">
                  <DonutChart data={trendData.trendDistribution} innerValue={`${trendData.trendCounts.up + trendData.trendCounts.down}`} innerLabel="Products" />
                </div>
              </div> : <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{
                top: 20,
                right: 20,
                bottom: 10,
                left: 10
              }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis type="number" dataKey="usage" name="Usage" tick={{
                  fill: 'rgba(255,255,255,0.6)',
                  fontSize: 12
                }} axisLine={{
                  stroke: 'rgba(255,255,255,0.1)'
                }} />
                    <YAxis type="number" dataKey="margin" name="Margin" tick={{
                  fill: 'rgba(255,255,255,0.6)',
                  fontSize: 12
                }} axisLine={{
                  stroke: 'rgba(255,255,255,0.1)'
                }} />
                    <ZAxis type="number" dataKey="price" range={[50, 400]} name="Price" />
                    <Tooltip cursor={{
                  strokeDasharray: '3 3'
                }} content={<CustomScatterTooltip />} />
                    <Scatter name="Trending DOWN" data={trendData.scatterData.filter(item => item.trend === 'down')} fill="#ef4444" />
                    <Scatter name="Trending UP" data={trendData.scatterData.filter(item => item.trend === 'up')} fill="#f87171" />
                    <Legend />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>}
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default MarketTrendAnalysis;