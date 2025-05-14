
import React, { useMemo } from 'react';
import { useEngineRoom } from '@/contexts/EngineRoomContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { ChartContainer } from '@/components/ui/chart';
import LineChart from '@/components/LineChart';
import MetricCard from '@/components/MetricCard';
import { formatCurrency, formatPercentage } from '@/utils/formatting-utils';
import { Grid2X2, TrendingUp, TrendingDown } from 'lucide-react';

const CompetitorAnalysis: React.FC = () => {
  const { engineData } = useEngineRoom();

  // Calculated market stats
  const marketStats = useMemo(() => {
    if (!engineData?.items) {
      return { aboveMarket: 0, atMarket: 0, belowMarket: 0, totalItems: 0, averagePriceDiff: 0 };
    }

    let aboveMarket = 0;
    let atMarket = 0;
    let belowMarket = 0;
    let totalPriceDiff = 0;
    let validItems = 0;

    engineData.items.forEach(item => {
      if (!item.noMarketPrice && item.trueMarketLow > 0) {
        validItems++;
        const currentPrice = item.proposedPrice || item.currentREVAPrice;
        const priceDiff = ((currentPrice - item.trueMarketLow) / item.trueMarketLow) * 100;
        totalPriceDiff += priceDiff;

        if (priceDiff < -5) {
          belowMarket++;
        } else if (priceDiff > 5) {
          aboveMarket++;
        } else {
          atMarket++;
        }
      }
    });

    return {
      aboveMarket,
      atMarket,
      belowMarket,
      totalItems: validItems,
      averagePriceDiff: validItems > 0 ? totalPriceDiff / validItems : 0
    };
  }, [engineData]);

  // Category price gap data
  const categoryPriceData = useMemo(() => {
    if (!engineData?.items) return [];
    
    // Group items by category
    const categories: Record<string, {count: number, totalGap: number}> = {};
    
    engineData.items.forEach(item => {
      if (!item.noMarketPrice && item.trueMarketLow > 0 && item.category) {
        const currentPrice = item.proposedPrice || item.currentREVAPrice;
        const priceDiff = ((currentPrice - item.trueMarketLow) / item.trueMarketLow) * 100;
        
        if (!categories[item.category]) {
          categories[item.category] = { count: 0, totalGap: 0 };
        }
        
        categories[item.category].count++;
        categories[item.category].totalGap += priceDiff;
      }
    });
    
    return Object.entries(categories)
      .map(([name, data]) => ({
        name,
        value: data.count > 0 ? data.totalGap / data.count : 0,
        count: data.count
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [engineData]);

  // Market price trend data (simulated)
  const priceTrendData = [
    { name: 'Jan', value: 100, avg: 100 },
    { name: 'Feb', value: 101.2, avg: 100.5 },
    { name: 'Mar', value: 102.7, avg: 101.3 },
    { name: 'Apr', value: 103.5, avg: 102.4 },
    { name: 'May', value: 105.2, avg: 103.6 },
    { name: 'Jun', value: 106.8, avg: 104.9 },
  ];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Average Price Gap"
          value={formatPercentage(marketStats.averagePriceDiff / 100)}
          subtitle="Vs. competitive market prices"
          icon={<Grid2X2 />}
          change={marketStats.averagePriceDiff > 0 ? 
            { value: "Above Market", type: "increase" } : 
            { value: "Below Market", type: "decrease" }}
        />
        
        <MetricCard
          title="Above Market Pricing"
          value={`${marketStats.aboveMarket} Products`}
          subtitle={`${marketStats.totalItems > 0 ? ((marketStats.aboveMarket / marketStats.totalItems) * 100).toFixed(1) : 0}% of portfolio`}
          icon={<TrendingUp />}
        />
        
        <MetricCard
          title="Below Market Pricing"
          value={`${marketStats.belowMarket} Products`}
          subtitle={`${marketStats.totalItems > 0 ? ((marketStats.belowMarket / marketStats.totalItems) * 100).toFixed(1) : 0}% of portfolio`}
          icon={<TrendingDown />}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border border-white/10 bg-gray-900/40 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Category Price Gaps</CardTitle>
            <CardDescription>Avg. price difference vs. market by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryPriceData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <XAxis 
                    type="number" 
                    domain={[-20, 20]}
                    tickFormatter={(value) => `${value}%`}
                    tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name"
                    width={80}
                    tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value.toFixed(1)}%`, 'Gap vs. Market']}
                    contentStyle={{ backgroundColor: '#1A1F2C', borderColor: 'rgba(255,255,255,0.1)' }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="#8884d8"
                    minPointSize={2}
                    barSize={20}
                  >
                    {categoryPriceData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.value >= 0 ? '#ef4444' : '#34d399'} 
                      />
                    ))}
                    <LabelList 
                      dataKey="value" 
                      position="right"
                      formatter={(value) => `${value.toFixed(1)}%`} 
                      style={{ fill: 'rgba(255,255,255,0.8)', fontSize: 12 }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border border-white/10 bg-gray-900/40 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Market Price Index Trend</CardTitle>
            <CardDescription>Relative price index (base 100)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <LineChart
                data={priceTrendData}
                color="#ef4444"
                avgColor="#60a5fa"
                yAxisFormatter={(value) => value.toString()}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-white/10 bg-gray-900/40 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Competitor Price Intelligence</CardTitle>
          <CardDescription>Insights from market data analysis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-gray-800/50 border-white/5">
              <CardHeader className="p-4">
                <CardTitle className="text-sm font-medium">Observed Market Patterns</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-sm text-white/80">
                <ul className="space-y-2">
                  <li>• Competitor A has increased prices by an average of 3.5% across their portfolio</li>
                  <li>• Market prices for Category X have seen greater volatility than other categories</li>
                  <li>• Seasonal pricing patterns indicate potential increases in Q3</li>
                  <li>• New market entrants are pricing 8-12% below established products</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800/50 border-white/5">
              <CardHeader className="p-4">
                <CardTitle className="text-sm font-medium">Key Intelligence Findings</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-sm text-white/80">
                <ul className="space-y-2">
                  <li>• Price elasticity is decreasing in high-volume categories</li>
                  <li>• Competitors appear to be testing higher margins on specialty products</li>
                  <li>• Market leaders are maintaining stable prices despite cost increases</li>
                  <li>• Significant price gaps emerging in growth segments</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default CompetitorAnalysis;
