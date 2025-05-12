
import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { ScatterChart } from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, Database, AlertTriangle } from 'lucide-react';
import DonutChart from '@/components/DonutChart';
import LineChart from '@/components/LineChart';

interface MarketTrendAnalysisProps {
  data: any[];
}

const MarketTrendAnalysis: React.FC<MarketTrendAnalysisProps> = ({ data }) => {
  const [chartType, setChartType] = useState<'trend' | 'usage' | 'comparison'>('trend');
  
  // Process data for trend analysis
  const trendData = useMemo(() => {
    if (!data || data.length === 0) return {
      trendDistribution: [],
      scatterData: [],
      trendCounts: { up: 0, down: 0 },
      competitorComparison: []
    };
    
    // For trend distribution
    let trendingUp = 0;
    let trendingDown = 0;
    const scatterData: any[] = [];
    
    // For competitor comparison
    const competitors = ['ETH', 'ETH_NET', 'Nupharm', 'LEXON', 'AAH'];
    const competitorData: {[key: string]: {name: string, margin: number, count: number}[]} = {};
    
    // Initialize competitor data structure
    competitors.forEach(comp => {
      competitorData[comp] = [];
    });
    
    // Process data for trend analysis and competitor comparison
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
          trend: isTrendingDown ? 'down' : 'up',
        });
      }
      
      // Process competitor data
      competitors.forEach(comp => {
        if (item[comp] && item.currentREVAPrice) {
          const compPrice = parseFloat(item[comp]);
          if (compPrice > 0) {
            // Calculate margin against our cost
            const margin = ((compPrice - item.avgCost) / compPrice) * 100;
            
            // Group by margin range
            let marginRange = Math.floor(margin / 5) * 5; // Group in 5% increments
            marginRange = Math.max(-20, Math.min(50, marginRange)); // Limit to -20% to 50%
            
            // Add to the competitor's data
            const existingRange = competitorData[comp].find(d => d.name === `${marginRange}%`);
            if (existingRange) {
              existingRange.count += 1;
              existingRange.margin = (existingRange.margin * (existingRange.count - 1) + margin) / existingRange.count;
            } else {
              competitorData[comp].push({
                name: `${marginRange}%`,
                margin: margin,
                count: 1
              });
            }
          }
        }
      });
    });
    
    // Create competition comparison chart data
    const competitorComparison = competitors.map(comp => {
      // Sort by margin range
      const sortedData = competitorData[comp]
        .sort((a, b) => parseInt(a.name) - parseInt(b.name))
        .map(d => ({
          name: d.name,
          value: d.margin,
          count: d.count
        }));
      
      return {
        name: comp,
        data: sortedData
      };
    }).filter(comp => comp.data.length > 0);
    
    const trendDistribution = [
      { name: 'Trending UP', value: trendingUp, color: '#9b87f5' }, // Brand purple
      { name: 'Trending DOWN', value: trendingDown, color: '#3b82f6' }, // Brand blue
    ];
    
    return {
      trendDistribution,
      scatterData: scatterData.sort((a, b) => b.usage - a.usage).slice(0, 100), // Top 100 by usage
      trendCounts: { up: trendingUp, down: trendingDown },
      competitorComparison
    };
  }, [data]);

  // Custom tooltip for scatter chart
  const CustomScatterTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800/90 backdrop-blur-sm p-3 border border-white/10 rounded-md shadow-lg">
          <p className="font-medium mb-1">{data.name}</p>
          <div className="text-sm space-y-1">
            <p>Usage: {data.usage}</p>
            <p>Price: £{data.price?.toFixed(2)}</p>
            <p>Margin: {data.margin?.toFixed(2)}%</p>
            <p>Profit: £{data.profit?.toFixed(2)}</p>
            <div className="flex items-center mt-1">
              <Badge variant="outline" className={data.trend === 'down' ? 'bg-blue-900/20 text-blue-400 border-blue-900' : 'bg-purple-900/20 text-purple-400 border-purple-900'}>
                {data.trend === 'down' ? 'Trending DOWN' : 'Trending UP'}
              </Badge>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Check if we have any competitor data
  const hasCompetitorData = trendData.competitorComparison.length > 0;

  return (
    <div className="space-y-4 mb-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Market Trend Analysis</h2>
        <div className="flex space-x-2">
          <Button 
            variant={chartType === 'trend' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartType('trend')}
          >
            Trend Distribution
          </Button>
          <Button
            variant={chartType === 'usage' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartType('usage')}
          >
            Usage vs Margin
          </Button>
          <Button
            variant={chartType === 'comparison' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartType('comparison')}
          >
            Competitor Margins
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        <Card className="border border-white/10 bg-gray-900/40 backdrop-blur-sm shadow-lg">
          <CardContent className="p-4">
            {chartType === 'trend' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1 flex flex-col justify-center space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg font-medium">Market Price Trend</h3>
                    <p className="text-sm text-muted-foreground">Distribution of products by price trend</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-blue-900/20 rounded-md">
                      <div className="flex items-center">
                        <ChevronDown className="h-5 w-5 text-blue-400 mr-2" />
                        <span className="font-medium">Trending DOWN</span>
                      </div>
                      <div className="font-bold">{trendData.trendCounts.down}</div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-purple-900/20 rounded-md">
                      <div className="flex items-center">
                        <ChevronUp className="h-5 w-5 text-purple-400 mr-2" />
                        <span className="font-medium">Trending UP</span>
                      </div>
                      <div className="font-bold">{trendData.trendCounts.up}</div>
                    </div>
                  </div>
                </div>
                
                <div className="md:col-span-2 h-80">
                  <DonutChart 
                    data={trendData.trendDistribution}
                    innerValue={`${trendData.trendCounts.up + trendData.trendCounts.down}`}
                    innerLabel="Products"
                  />
                </div>
              </div>
            ) : chartType === 'usage' ? (
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart
                    margin={{ top: 20, right: 20, bottom: 10, left: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                      type="number" 
                      dataKey="usage" 
                      name="Usage" 
                      label={{ value: 'Usage Volume', position: 'insideBottom', offset: -5 }}
                      tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="margin" 
                      name="Margin" 
                      label={{ value: 'Margin (%)', angle: -90, position: 'insideLeft' }}
                      tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
                    />
                    <ZAxis 
                      type="number" 
                      dataKey="price" 
                      range={[50, 400]} 
                      name="Price" 
                    />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomScatterTooltip />} />
                    <Scatter 
                      name="Trending DOWN" 
                      data={trendData.scatterData.filter(item => item.trend === 'down')} 
                      fill="#3b82f6" 
                    />
                    <Scatter 
                      name="Trending UP" 
                      data={trendData.scatterData.filter(item => item.trend === 'up')} 
                      fill="#9b87f5" 
                    />
                    <Legend />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-96">
                <h3 className="text-lg font-medium mb-4">Margin Comparison with Competitors</h3>
                {hasCompetitorData ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                    {trendData.competitorComparison.slice(0, 4).map((competitor, index) => (
                      <div key={index} className="h-80">
                        <h4 className="text-sm font-medium mb-2">{competitor.name} Margin Distribution</h4>
                        <div className="h-72">
                          <LineChart
                            data={competitor.data}
                            color={index % 2 === 0 ? '#9b87f5' : '#3b82f6'}
                            yAxisFormatter={(value) => `${value.toFixed(1)}%`}
                            showAverage={false}
                            hasPercentageMetric={true}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full bg-gray-800/30 rounded-lg border border-gray-700/50">
                    <div className="text-center p-8 max-w-md">
                      <AlertTriangle className="h-12 w-12 text-amber-400/70 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-white mb-2">No Competitor Data Available</h3>
                      <p className="text-gray-300 mb-6">
                        No competitor pricing information was found in the uploaded data.
                      </p>
                      <div className="bg-gray-700/30 p-4 rounded-md text-sm text-gray-300 text-left mb-4">
                        <p className="mb-2 font-medium">Required columns for competitor analysis:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>ETH</li>
                          <li>ETH_NET</li>
                          <li>Nupharm</li>
                          <li>LEXON</li>
                          <li>AAH</li>
                        </ul>
                      </div>
                      <div className="flex justify-center">
                        <Button 
                          variant="outline" 
                          onClick={() => setChartType('trend')}
                          className="border-gray-600 hover:bg-gray-700/50"
                        >
                          <Database className="h-4 w-4 mr-2" />
                          View Trend Analysis Instead
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MarketTrendAnalysis;
