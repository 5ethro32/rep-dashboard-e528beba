import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatCurrency, formatPercent } from '@/utils/rep-performance-utils';
import { 
  TimeRangeType, 
  MonthlyTrendsChartData,
  DailyFilterOptions
} from '@/types/daily-rep-performance.types';
import { 
  fetchMonthlyTrendsData,
  getTimeRangeOptions 
} from '@/services/monthly-trends-service';

interface DailyMonthlyTrendsChartProps {
  filters: DailyFilterOptions;
  loading?: boolean;
}

// Chart colors matching the existing TrendLineChart
const CHART_COLORS = {
  profit: '#ef4444',
  spend: '#60a5fa',
  margin: '#fef08a',
  activeAccounts: '#4ade80',
};

const DailyMonthlyTrendsChart: React.FC<DailyMonthlyTrendsChartProps> = ({
  filters,
  loading: externalLoading = false
}) => {
  // State management
  const [timeRange, setTimeRange] = useState<TimeRangeType>('ALL');
  const [chartData, setChartData] = useState<MonthlyTrendsChartData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Metric visibility toggles - profit selected by default
  const [showProfit, setShowProfit] = useState(true);
  const [showSpend, setShowSpend] = useState(false);
  const [showMargin, setShowMargin] = useState(false);
  const [showActiveAccounts, setShowActiveAccounts] = useState(false);
  
  const isMobile = useIsMobile();
  
  // Time range options
  const timeRangeOptions = getTimeRangeOptions();
  
  // Fetch data when timeRange or filters change
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('🔍 Fetching chart data for:', { timeRange, filters });
        const result = await fetchMonthlyTrendsData({
          timeRange,
          filters
        });
        
        console.log('📊 Chart data received:', {
          actualData: result.length
        });
        
        setChartData(result);
        
        // If no data, log for debugging
        if (result.length === 0) {
          console.warn('⚠️ No chart data returned for time range:', timeRange);
        }
      } catch (err) {
        console.error('❌ Failed to fetch monthly trends data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch chart data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [timeRange, filters]);
  
  // Create display data that matches original TrendLineChart approach
  const displayData = useMemo(() => {
    const sortedData = chartData.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    console.log(`📊 Chart data for ${timeRange}:`, sortedData);
    console.log(`📊 Projections enabled for YTD/ALL:`, timeRange === 'YTD' || timeRange === 'ALL');
    
    return sortedData;
  }, [chartData, timeRange]);

  // Split data for rendering (like original TrendLineChart)
  const { actualData, trajectoryData } = useMemo(() => {
    const actual = displayData.filter(item => !item.isProjected);
    const projected = displayData.filter(item => item.isProjected);
    
    // For trajectory line, we need: last actual point + projected point (like original)
    // This creates a line FROM the last actual month TO the projected current month
    const trajectory = actual.length > 0 && projected.length > 0 
      ? [actual[actual.length - 1], ...projected]  // June + Projected July
      : [];
    
    console.log(`📊 Actual data points:`, actual.length);
    console.log(`📊 Trajectory data points:`, trajectory.length);
    console.log(`📊 Last actual point:`, actual[actual.length - 1]?.period);
    console.log(`📊 Projected point:`, projected[0]?.period);
    
    return { actualData: actual, trajectoryData: trajectory };
  }, [displayData]);
  
  // Enhanced tooltip with projection support
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const firstPayload = payload[0]?.payload;
      const fullPeriod = firstPayload?.fullPeriod || label;
      const isProjected = firstPayload?.isProjected || false;
      
      return (
        <div className="bg-gray-800 border border-gray-700 p-3 rounded-md shadow-lg backdrop-blur-sm">
          <p className="font-semibold text-gray-200">
            {fullPeriod}
            {isProjected && (
              <span className="text-xs text-orange-400 ml-2">(Projected)</span>
            )}
          </p>
          
          {showProfit && payload.find(p => p.dataKey === 'profit') && (
            <p className="text-sm text-finance-red">
              Profit: {formatCurrency(payload.find(p => p.dataKey === 'profit')?.value || 0)}
            </p>
          )}
          
          {showSpend && payload.find(p => p.dataKey === 'spend') && (
            <p className="text-sm text-blue-400">
              Spend: {formatCurrency(payload.find(p => p.dataKey === 'spend')?.value || 0)}
            </p>
          )}
          
          {showMargin && payload.find(p => p.dataKey === 'margin') && (
            <p className="text-sm text-yellow-300">
              Margin: {formatPercent(payload.find(p => p.dataKey === 'margin')?.value || 0)}
            </p>
          )}
          
          {showActiveAccounts && payload.find(p => p.dataKey === 'activeAccounts') && (
            <p className="text-sm text-green-400">
              Active Accounts: {Math.round(payload.find(p => p.dataKey === 'activeAccounts')?.value || 0).toLocaleString()}
            </p>
          )}
        </div>
      );
    }
    
    return null;
  };
  
  // Handle toggle changes
  const handleToggleChange = (value: string[]) => {
    setShowProfit(value.includes('profit'));
    setShowSpend(value.includes('spend'));
    setShowMargin(value.includes('margin'));
    setShowActiveAccounts(value.includes('activeAccounts'));
  };
  
  // Loading state
  if (isLoading || externalLoading) {
    return (
      <Card className="bg-gray-900/40 border border-white/10 backdrop-blur-sm shadow-lg">
        <CardContent className="h-96">
          <Skeleton className="h-full w-full bg-gray-800/50" />
        </CardContent>
      </Card>
    );
  }
  
  // Error state
  if (error) {
    return (
      <Card className="bg-gray-900/40 border border-white/10 backdrop-blur-sm shadow-lg">
        <CardContent className="h-96 flex items-center justify-center">
          <div className="text-red-400 text-center">
            <p className="font-medium">Failed to load chart data</p>
            <p className="text-sm text-gray-400 mt-1">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // No data state
  if (!isLoading && chartData.length === 0) {
    return (
      <Card className="bg-gray-900/40 border border-white/10 backdrop-blur-sm shadow-lg">
        <CardContent className="h-96 flex items-center justify-center">
          <div className="text-gray-400 text-center">
            <p className="font-medium">No chart data available</p>
            <p className="text-sm text-gray-500 mt-1">
              No records found for the selected time range: {timeRange}
            </p>
            <p className="text-xs text-gray-600 mt-2">
              Try selecting a different time range or check your date range selection
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Calculate active toggles
  const activeToggles = [
    ...(showProfit ? ['profit'] : []),
    ...(showSpend ? ['spend'] : []),
    ...(showMargin ? ['margin'] : []),
    ...(showActiveAccounts ? ['activeAccounts'] : [])
  ];
  
  // Get departments display text
  const getDepartmentDisplayText = () => {
    const departments = [];
    if (filters.includeRetail) departments.push('Retail');
    if (filters.includeReva) departments.push('REVA');
    if (filters.includeWholesale) departments.push('Wholesale');
    return departments.join(', ');
  };
  
  return (
    <Card className="bg-gray-900/40 backdrop-blur-sm border-white/10 shadow-lg">
      <CardHeader className="pb-6">
        {/* Controls Row: Time range buttons on left, Metric toggles on right */}
        <div className={`flex ${isMobile ? 'flex-col' : 'justify-between'} items-center gap-4`}>
          {/* Time range buttons */}
          <div className="flex flex-wrap gap-2">
            {timeRangeOptions.map(option => (
              <Button
                key={option.value}
                variant={timeRange === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(option.value)}
                className={`
                  px-3 py-1 text-sm transition-all duration-200
                  ${timeRange === option.value 
                    ? 'bg-finance-red text-white border-finance-red hover:bg-finance-red/90' 
                    : 'bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white'
                  }
                `}
              >
                {option.label}
              </Button>
            ))}
          </div>
          
          {/* Metric toggles */}
          <ToggleGroup 
            type="multiple" 
            value={activeToggles} 
            onValueChange={handleToggleChange}
            className="justify-start"
          >
            <ToggleGroupItem 
              value="profit" 
              aria-label="Toggle Profit" 
              className="data-[state=on]:bg-finance-red/20 data-[state=on]:text-finance-red border-gray-700"
            >
              <div className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-full bg-finance-red"></span>
                <span className="text-xs">Profit</span>
              </div>
            </ToggleGroupItem>
            
            <ToggleGroupItem 
              value="spend" 
              aria-label="Toggle Spend" 
              className="data-[state=on]:bg-blue-500/20 data-[state=on]:text-blue-400 border-gray-700"
            >
              <div className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-full bg-blue-500"></span>
                <span className="text-xs">Spend</span>
              </div>
            </ToggleGroupItem>
            
            <ToggleGroupItem 
              value="margin" 
              aria-label="Toggle Margin" 
              className="data-[state=on]:bg-yellow-300/20 data-[state=on]:text-yellow-300 border-gray-700"
            >
              <div className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-full bg-yellow-300"></span>
                <span className="text-xs">Margin</span>
              </div>
            </ToggleGroupItem>
            
            <ToggleGroupItem 
              value="activeAccounts" 
              aria-label="Toggle Active Accounts" 
              className="data-[state=on]:bg-green-500/20 data-[state=on]:text-green-400 border-gray-700"
            >
              <div className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-full bg-green-500"></span>
                <span className="text-xs">Active Accounts</span>
              </div>
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardHeader>
      
      {/* Data sources display */}
      <div className="px-6 pb-3 text-sm text-white/70">
        <span className="font-medium">Data Sources:</span> {getDepartmentDisplayText()}
      </div>
      
      <CardContent className="pt-3 pb-8">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={displayData}
              margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="period" 
                tick={{ fill: 'rgba(255,255,255,0.6)' }}
                allowDuplicatedCategory={false}
              />
              <YAxis 
                yAxisId="left"
                orientation="left"
                tick={{ fill: 'rgba(255,255,255,0.6)' }}
                tickFormatter={(value) => `£${(value / 1000)}k`}
                width={60}
              />
              {(showMargin || showActiveAccounts) && (
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: 'rgba(255,255,255,0.6)' }}
                  tickFormatter={(value) => showMargin ? `${value}%` : value.toString()}
                  width={45}
                />
              )}
              <Tooltip content={<CustomTooltip />} />
              
              {/* Profit lines - split into actual and trajectory like original */}
              {showProfit && (
                <>
                  {/* Actual profit line */}
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="profit" 
                    name="Profit" 
                    stroke={CHART_COLORS.profit}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    connectNulls={true}
                    data={actualData}
                  />
                                     {/* Trajectory profit line (connects from June to projected July) */}
                   {trajectoryData.length > 0 && (timeRange === 'YTD' || timeRange === 'ALL') && (
                     <Line 
                       yAxisId="left"
                       type="monotone" 
                       dataKey="profit" 
                       name="Profit" 
                       stroke={CHART_COLORS.profit}
                       strokeWidth={2}
                       strokeDasharray="5 5"
                       dot={{ r: 4 }}
                       activeDot={{ r: 6 }}
                       connectNulls={true}
                       data={trajectoryData}
                     />
                   )}
                </>
              )}
              
              {/* Spend lines - split into actual and trajectory like original */}
              {showSpend && (
                <>
                  {/* Actual spend line */}
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="spend" 
                    name="Spend" 
                    stroke={CHART_COLORS.spend}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    connectNulls={true}
                    data={actualData}
                  />
                                     {/* Trajectory spend line */}
                   {trajectoryData.length > 0 && (timeRange === 'YTD' || timeRange === 'ALL') && (
                     <Line 
                       yAxisId="left"
                       type="monotone" 
                       dataKey="spend" 
                       name="Spend" 
                       stroke={CHART_COLORS.spend}
                       strokeWidth={2}
                       strokeDasharray="5 5"
                       dot={{ r: 4 }}
                       activeDot={{ r: 6 }}
                       connectNulls={true}
                       data={trajectoryData}
                     />
                   )}
                </>
              )}
              
              {/* Margin lines - split into actual and trajectory like original */}
              {showMargin && (
                <>
                  {/* Actual margin line */}
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="margin" 
                    name="Margin" 
                    stroke={CHART_COLORS.margin}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    connectNulls={true}
                    data={actualData}
                  />
                                     {/* Trajectory margin line */}
                   {trajectoryData.length > 0 && (timeRange === 'YTD' || timeRange === 'ALL') && (
                     <Line 
                       yAxisId="right"
                       type="monotone" 
                       dataKey="margin" 
                       name="Margin" 
                       stroke={CHART_COLORS.margin}
                       strokeWidth={2}
                       strokeDasharray="5 5"
                       dot={{ r: 4 }}
                       activeDot={{ r: 6 }}
                       connectNulls={true}
                       data={trajectoryData}
                     />
                   )}
                </>
              )}
              
              {/* Active Accounts lines - split into actual and trajectory like original */}
              {showActiveAccounts && (
                <>
                  {/* Actual active accounts line */}
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="activeAccounts" 
                    name="Active Accounts" 
                    stroke={CHART_COLORS.activeAccounts}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    connectNulls={true}
                    data={actualData}
                  />
                                     {/* Trajectory active accounts line */}
                   {trajectoryData.length > 0 && (timeRange === 'YTD' || timeRange === 'ALL') && (
                     <Line 
                       yAxisId="right"
                       type="monotone" 
                       dataKey="activeAccounts" 
                       name="Active Accounts" 
                       stroke={CHART_COLORS.activeAccounts}
                       strokeWidth={2}
                       strokeDasharray="5 5"
                       dot={{ r: 4 }}
                       activeDot={{ r: 6 }}
                       connectNulls={true}
                       data={trajectoryData}
                     />
                   )}
                </>
              )}

            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyMonthlyTrendsChart; 