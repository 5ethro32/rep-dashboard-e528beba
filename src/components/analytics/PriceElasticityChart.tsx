
import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Scatter,
  ScatterChart,
  ZAxis,
} from 'recharts';

interface PriceElasticityChartProps {
  data: any[];
}

const PriceElasticityChart: React.FC<PriceElasticityChartProps> = ({ data }) => {
  const elasticityData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Filter to only include products with all necessary data points
    const filteredData = data.filter(item => 
      item.currentREVAPrice > 0 && 
      item.revaUsage > 0 && 
      item.ethNetPrice > 0
    );

    // Transform the data for the chart
    return filteredData
      .filter(item => item.revaUsage > 0) // Ensure we have usage data
      .map(item => {
        const priceRatio = item.currentREVAPrice / item.ethNetPrice;
        // Size represents volume/importance
        const size = Math.min(Math.sqrt(item.revaUsage) * 2, 30);
        
        return {
          id: item.id,
          name: item.description?.substring(0, 30) || 'Unknown',
          priceRatio: priceRatio.toFixed(2),
          usage: item.revaUsage,
          currentPrice: item.currentREVAPrice,
          marketPrice: item.ethNetPrice,
          size,
          // Simulate elasticity score based on available data
          elasticity: priceRatio > 1.5 ? 'High' : priceRatio > 1.1 ? 'Medium' : 'Low'
        };
      })
      .sort((a, b) => b.usage - a.usage) // Sort by usage
      .slice(0, 100); // Only take top 100 products by usage for readability
  }, [data]);

  if (elasticityData.length === 0) {
    return (
      <div className="text-center py-8">
        <h3 className="text-xl font-semibold mb-2">Price Elasticity Analysis</h3>
        <p className="text-muted-foreground">Insufficient data for elasticity analysis</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Card className="bg-gray-800 border-gray-700 text-white p-2">
          <CardContent className="p-3">
            <p className="font-semibold">{data.name}</p>
            <p>Price Ratio: {data.priceRatio}</p>
            <p>Current Price: £{data.currentPrice.toFixed(2)}</p>
            <p>Market Price: £{data.marketPrice.toFixed(2)}</p>
            <p>Usage: {data.usage}</p>
            <p>Elasticity: {data.elasticity}</p>
          </CardContent>
        </Card>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-semibold mb-1">Price Elasticity Analysis</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Shows price sensitivity by comparing our prices to market reference prices
        </p>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            margin={{ top: 20, right: 30, bottom: 20, left: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              type="number" 
              dataKey="priceRatio" 
              name="Price Ratio" 
              domain={[0.5, 2.5]} 
              label={{ 
                value: 'Our Price ÷ Market Price', 
                position: 'insideBottom', 
                offset: -10,
                style: { fill: '#999' } 
              }}
              tick={{ fill: '#999' }}
            />
            <YAxis 
              type="number" 
              dataKey="usage" 
              name="Usage Volume"
              scale="log"
              domain={['auto', 'auto']}
              label={{ 
                value: 'Usage (log scale)', 
                angle: -90, 
                position: 'insideLeft',
                style: { fill: '#999' } 
              }}
              tick={{ fill: '#999' }}
            />
            <ZAxis 
              type="number" 
              dataKey="size" 
              range={[5, 20]} 
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Scatter 
              name="High elasticity (above market)" 
              data={elasticityData.filter(item => Number(item.priceRatio) > 1.1)} 
              fill="#f97316" // Orange for high elasticity
              shape="circle"
            />
            <Scatter 
              name="Balanced pricing (near market)" 
              data={elasticityData.filter(item => Number(item.priceRatio) >= 0.9 && Number(item.priceRatio) <= 1.1)} 
              fill="#10b981" // Green for balanced pricing
              shape="circle"
            />
            <Scatter 
              name="Low elasticity (below market)" 
              data={elasticityData.filter(item => Number(item.priceRatio) < 0.9)} 
              fill="#3b82f6" // Blue for low elasticity
              shape="circle"
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      
      <div className="text-xs text-muted-foreground px-4">
        <ul className="space-y-1 list-disc pl-4">
          <li>Bubble size represents product usage volume - larger bubbles indicate higher volume products</li>
          <li>Products significantly above market price (right side) may be sensitive to price changes</li>
          <li>High-volume products (top) have greater impact on overall revenue and profit</li>
          <li>Focus on large orange bubbles for immediate price optimization opportunities</li>
        </ul>
      </div>
    </div>
  );
};

export default PriceElasticityChart;
