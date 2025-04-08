
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { ChevronUp, ChevronDown, Percent, Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface RepMarginComparisonProps {
  displayData: any[];
  repChanges: Record<string, any>;
  formatPercent: (value: number) => string;
  isLoading?: boolean;
}

const RepMarginComparison: React.FC<RepMarginComparisonProps> = ({ displayData, repChanges, formatPercent, isLoading }) => {
  const isMobile = useIsMobile();
  
  // Filter data to remove any reps with 0 margin
  const activeData = displayData.filter(item => item.margin > 0);
  
  // Sort by margin (highest to lowest)
  const sortedData = [...activeData].sort((a, b) => b.margin - a.margin);
  
  // Only show top 8 on mobile, top 12 otherwise
  const limitedData = sortedData.slice(0, isMobile ? 5 : 8);
  
  // Calculate the average margin across all reps
  const averageMargin = activeData.length > 0 ? 
    activeData.reduce((sum, item) => sum + item.margin, 0) / activeData.length : 0;
    
  // REVA is typically red, default is purple, but we can adjust as needed
  const defaultBarColor = '#818cf8';
  const belowAverageColor = '#ef4444';
  
  // Format the data for the chart
  const chartData = limitedData.map(item => ({
    rep: item.rep,
    margin: Number(item.margin.toFixed(1)),
    change: repChanges[item.rep] ? repChanges[item.rep].margin : 0
  }));
  
  return (
    <div className="bg-gray-900/40 rounded-lg border border-white/10 p-3 md:p-6 backdrop-blur-sm shadow-lg h-full flex flex-col">
      <h3 className="text-base md:text-lg font-medium mb-3 md:mb-4 text-white/90">Margin Comparison</h3>
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
            <span className="text-sm text-finance-gray">Loading data...</span>
          </div>
        </div>
      ) : chartData.length > 0 ? (
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 10, bottom: 5, left: isMobile ? 30 : 70 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
              <XAxis 
                type="number" 
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                axisLine={{ stroke: '#444' }}
                tickLine={{ stroke: '#444' }}
                tickFormatter={(value) => `${value}%`}
              />
              <YAxis 
                dataKey="rep" 
                type="category"
                tick={{ fontSize: isMobile ? 8 : 12, fill: '#9ca3af' }}
                axisLine={{ stroke: '#444' }}
                tickLine={{ stroke: '#444' }}
                width={isMobile ? 30 : 70}
              />
              <Tooltip
                formatter={(value) => [`${value}%`, 'Margin']}
                labelStyle={{ color: '#111' }}
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '4px' }}
              />
              <Bar dataKey="margin" name="Margin" barSize={20}>
                {chartData.map((entry, index) => {
                  const isAboveAverage = entry.margin >= averageMargin;
                  return (
                    <Cell 
                      key={`cell-${index}`}
                      fill={isAboveAverage ? defaultBarColor : belowAverageColor}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-finance-gray">
            <Percent className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No margin data available</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RepMarginComparison;
