import React, { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, TooltipProps } from 'recharts';
import { SummaryData } from '@/types/rep-performance.types';
import { formatCurrency } from '@/utils/rep-performance-utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface TrendLineChartProps {
  febSummary: SummaryData;
  marchSummary: SummaryData;
  aprilSummary: SummaryData;
  maySummary: SummaryData;
  isLoading: boolean;
  repData: {
    february: any[];
    march: any[];
    april: any[];
    may: any[];
  };
  includeRetail: boolean;
  includeReva: boolean;
  includeWholesale: boolean;
}

interface TrendData {
  month: string;
  profit: number;
  spend: number;
  packs: number;
  activeAccounts: number;
}

const TrendLineChart: React.FC<TrendLineChartProps> = ({
  febSummary,
  marchSummary,
  aprilSummary,
  maySummary,
  isLoading,
  repData,
  includeRetail,
  includeReva,
  includeWholesale
}) => {
  // State to track which metrics are visible
  const [showProfit, setShowProfit] = useState(true);
  const [showSpend, setShowSpend] = useState(true);
  const [showPacks, setShowPacks] = useState(true);

  const chartData = useMemo(() => {
    const data: TrendData[] = [
      {
        month: 'Feb',
        profit: febSummary.totalProfit || 0,
        spend: febSummary.totalSpend || 0,
        packs: febSummary.totalPacks || 0,
        activeAccounts: febSummary.activeAccounts || 0
      },
      {
        month: 'Mar',
        profit: marchSummary.totalProfit || 0,
        spend: marchSummary.totalSpend || 0,
        packs: marchSummary.totalPacks || 0,
        activeAccounts: marchSummary.activeAccounts || 0
      },
      {
        month: 'Apr',
        profit: aprilSummary.totalProfit || 0,
        spend: aprilSummary.totalSpend || 0,
        packs: aprilSummary.totalPacks || 0,
        activeAccounts: aprilSummary.activeAccounts || 0
      },
      {
        month: 'May',
        profit: maySummary.totalProfit || 0,
        spend: maySummary.totalSpend || 0,
        packs: maySummary.totalPacks || 0,
        activeAccounts: maySummary.activeAccounts || 0
      }
    ];
    
    return data;
  }, [febSummary, marchSummary, aprilSummary, maySummary]);
  
  // Calculate month-to-month growth instead of Feb-May growth
  const monthToMonthGrowth = useMemo(() => {
    // Calculate the most recent month-to-month growth (May compared to April)
    const currentProfit = maySummary.totalProfit || 0;
    const previousProfit = aprilSummary.totalProfit || 0;
    
    if (previousProfit > 0) {
      const growth = ((currentProfit - previousProfit) / previousProfit) * 100;
      return growth.toFixed(1) + '%';
    }
    
    return '0.0%';
  }, [maySummary, aprilSummary]);

  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 border border-gray-700 p-3 rounded-md shadow-lg backdrop-blur-sm">
          <p className="font-semibold text-gray-200">{label}</p>
          {showProfit && payload.find(p => p.dataKey === 'profit') && (
            <p className="text-sm text-finance-red">Profit: {formatCurrency(payload.find(p => p.dataKey === 'profit')?.value || 0)}</p>
          )}
          {showSpend && payload.find(p => p.dataKey === 'spend') && (
            <p className="text-sm text-blue-400">Spend: {formatCurrency(payload.find(p => p.dataKey === 'spend')?.value || 0)}</p>
          )}
          {showPacks && payload.find(p => p.dataKey === 'packs') && (
            <p className="text-sm text-green-400">Packs: {Math.round(payload.find(p => p.dataKey === 'packs')?.value || 0).toLocaleString()}</p>
          )}
        </div>
      );
    }
  
    return null;
  };

  // Handler for toggle changes
  const handleToggleChange = (value: string[]) => {
    setShowProfit(value.includes('profit'));
    setShowSpend(value.includes('spend'));
    setShowPacks(value.includes('packs'));
  };
  
  if (isLoading) {
    return (
      <Card className="bg-gray-900/40 border border-white/10 backdrop-blur-sm shadow-lg">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-1/3 bg-gray-800/50" />
          <Skeleton className="h-4 w-1/4 bg-gray-800/50" />
        </CardHeader>
        <CardContent className="h-56">
          <Skeleton className="h-full w-full bg-gray-800/50" />
        </CardContent>
      </Card>
    );
  }

  // Calculate which toggles are active
  const activeToggles = [
    ...(showProfit ? ['profit'] : []),
    ...(showSpend ? ['spend'] : []),
    ...(showPacks ? ['packs'] : [])
  ];
  
  return (
    <Card className="bg-gray-900/40 border border-white/10 backdrop-blur-sm shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-white/90 flex justify-between">
          <span>Monthly Performance Trends</span>
          <span className="text-sm text-finance-red">May vs Apr MTD: {monthToMonthGrowth}</span>
        </CardTitle>
        <CardDescription className="text-xs md:text-sm mb-3 md:mb-4 text-white/60">
          {includeRetail && includeReva && includeWholesale ? 'Showing all departments' : 
            `Showing ${[
              includeRetail ? 'Retail' : '', 
              includeReva ? 'REVA' : '', 
              includeWholesale ? 'Wholesale' : ''
            ].filter(Boolean).join(', ')}`
          }
        </CardDescription>
        <ToggleGroup 
          type="multiple" 
          value={activeToggles} 
          onValueChange={handleToggleChange}
          className="justify-start mb-2"
        >
          <ToggleGroupItem value="profit" aria-label="Toggle Profit" className="data-[state=on]:bg-finance-red/20 data-[state=on]:text-finance-red border-gray-700">
            <div className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-full bg-finance-red"></span>
              <span className="text-xs">Profit</span>
            </div>
          </ToggleGroupItem>
          <ToggleGroupItem value="spend" aria-label="Toggle Spend" className="data-[state=on]:bg-blue-500/20 data-[state=on]:text-blue-400 border-gray-700">
            <div className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-full bg-blue-500"></span>
              <span className="text-xs">Spend</span>
            </div>
          </ToggleGroupItem>
          <ToggleGroupItem value="packs" aria-label="Toggle Packs" className="data-[state=on]:bg-green-500/20 data-[state=on]:text-green-400 border-gray-700">
            <div className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-full bg-green-500"></span>
              <span className="text-xs">Packs</span>
            </div>
          </ToggleGroupItem>
        </ToggleGroup>
      </CardHeader>
      <CardContent>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="month" 
                tick={{ fill: 'rgba(255,255,255,0.6)' }}
              />
              <YAxis 
                yAxisId="left"
                orientation="left"
                tick={{ fill: 'rgba(255,255,255,0.6)' }}
                tickFormatter={(value) => `£${(value / 1000)}k`}
                width={60}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fill: 'rgba(255,255,255,0.6)' }}
                tickFormatter={(value) => `${(value / 1000)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {showProfit && (
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="profit" 
                  name="Profit" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              )}
              {showSpend && (
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="spend" 
                  name="Spend" 
                  stroke="#60a5fa" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              )}
              {showPacks && (
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="packs" 
                  name="Packs" 
                  stroke="#4ade80" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrendLineChart;
