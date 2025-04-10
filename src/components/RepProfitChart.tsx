
import React from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card } from '@/components/ui/card';

interface RepProfitChartProps {
  displayData: any[];
  repChanges: Record<string, any>;
  formatCurrency: (value: number) => string;
  isLoading?: boolean;
  showChangeIndicators?: boolean;
}

const RepProfitChart: React.FC<RepProfitChartProps> = ({ 
  displayData, 
  repChanges, 
  formatCurrency,
  isLoading,
  showChangeIndicators = true
}) => {
  const isMobile = useIsMobile();
  
  // Sort data by profit descending
  const sortedData = [...displayData]
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 8); // Limit to top 8 reps
  
  // Prepare data for the chart
  const chartData = sortedData.map((item) => {
    // For April data, ensure we use consistent profit calculation as the summary card
    const profitValue = item.profit || 0;
    
    return {
      name: isMobile ? item.rep.substring(0, 2) : 
            item.rep.length > 10 ? item.rep.substring(0, 8) + '...' : item.rep,
      fullName: item.rep,
      profit: profitValue,
      change: repChanges[item.rep] ? repChanges[item.rep].profit : 0
    };
  });
  
  // Color handler function - red gradient for bars
  const getColor = (index: number) => {
    const colors = [
      "#ef4444", "#f87171", "#fca5a5", "#fee2e2", "#b91c1c",
      "#dc2626", "#991b1b", "#7f1d1d"
    ];
    return colors[index % colors.length];
  };

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-900/90 backdrop-blur-sm border border-white/10 rounded p-2 text-xs shadow-lg">
          <p className="font-medium text-white">{data.fullName}</p>
          <p className="text-finance-red">
            {formatCurrency(data.profit)}
          </p>
          {showChangeIndicators && Math.abs(data.change) >= 1 && (
            <p className={data.change > 0 ? 'text-emerald-400' : 'text-finance-red'}>
              {data.change > 0 ? '+' : ''}{data.change.toFixed(1)}% vs prev month
            </p>
          )}
        </div>
      );
    }
    return null;
  };
  
  // Handle display of chart for very small values
  const minHeight = Math.max(...chartData.map(d => d.profit)) * 0.01;
  
  return (
    <Card className="bg-gray-900/40 rounded-lg border border-white/10 p-3 md:p-6 backdrop-blur-sm shadow-lg h-full">
      <h3 className="text-base md:text-lg font-medium mb-3 md:mb-4 text-white/90">Profit Distribution</h3>
      
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center h-full">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
            <span className="text-sm text-gray-400">Loading data...</span>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 5, bottom: 20, left: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" vertical={false} />
            <XAxis 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: isMobile ? 8 : 10 }}
              dy={5}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: isMobile ? 8 : 10 }}
              tickFormatter={(value) => formatCurrency(value).replace('£', '')}
              width={isMobile ? 40 : 50}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
            <Bar 
              dataKey="profit" 
              minPointSize={3}
              barSize={isMobile ? 20 : 30}
              radius={[4, 4, 0, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(index)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
};

export default RepProfitChart;
