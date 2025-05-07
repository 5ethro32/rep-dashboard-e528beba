import React, { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps } from 'recharts';
import { SummaryData } from '@/types/rep-performance.types';
import { formatCurrency, formatPercent } from '@/utils/rep-performance-utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import RepSelector from '@/components/rep-performance/RepSelector';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';
import { getWorkingDayPercentage, projectMonthlyValue } from '@/utils/date-utils';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';

interface TrendLineChartProps {
  febSummary: SummaryData;
  marchSummary: SummaryData;
  aprilSummary: SummaryData;
  maySummary: SummaryData;
  isLoading: boolean;
  repDataProp: {
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
  margin: number;
  activeAccounts: number;
  isProjected?: boolean;
  isTrajectory?: boolean;
  [key: string]: any;
}

// Define a month ordering to ensure proper display sequence
const MONTH_ORDER = {
  'Feb': 1,
  'Mar': 2,
  'Apr': 3,
  'May': 4
};

const CHART_COLORS = {
  profit: '#ef4444',
  spend: '#60a5fa',
  packs: '#4ade80',
  margin: '#fef08a',
  rep1: '#f97316',
  rep2: '#8b5cf6',
  rep3: '#06b6d4',
};

const TrendLineChart: React.FC<TrendLineChartProps> = ({
  febSummary,
  marchSummary,
  aprilSummary,
  maySummary,
  isLoading,
  repDataProp,
  includeRetail,
  includeReva,
  includeWholesale
}) => {
  // State to track which metrics are visible - only profit selected by default
  const [showProfit, setShowProfit] = useState(true);
  const [showSpend, setShowSpend] = useState(false);
  const [showPacks, setShowPacks] = useState(false);
  const [showMargin, setShowMargin] = useState(false);
  
  // State for rep comparison
  const [showRepComparison, setShowRepComparison] = useState(false);
  const [selectedReps, setSelectedReps] = useState<string[]>([]);
  const [availableReps, setAvailableReps] = useState<string[]>([]);

  // Calculate the working day percentage for the current month (May)
  const workingDayPercentage = useMemo(() => getWorkingDayPercentage(new Date(2025, 4, 7)), []);

  // Generate the list of available reps from all months' data
  React.useEffect(() => {
    const allReps = new Set<string>();
    
    // Collect unique rep names from all months
    ['february', 'march', 'april', 'may'].forEach(month => {
      if (repDataProp && repDataProp[month]) {
        repDataProp[month].forEach(item => {
          if (item.rep) {
            allReps.add(item.rep);
          }
        });
      }
    });
    
    setAvailableReps(Array.from(allReps).sort());
  }, [repDataProp]);

  // Add isMobile hook for responsive design
  const isMobile = useIsMobile();

  // Create actual chart data for February through April
  const actualChartData = useMemo(() => {
    return [
      {
        month: 'Feb',
        profit: febSummary.totalProfit || 0,
        spend: febSummary.totalSpend || 0,
        packs: febSummary.totalPacks || 0,
        margin: febSummary.averageMargin || 0,
        activeAccounts: febSummary.activeAccounts || 0,
        isProjected: false,
        isTrajectory: false
      },
      {
        month: 'Mar',
        profit: marchSummary.totalProfit || 0,
        spend: marchSummary.totalSpend || 0,
        packs: marchSummary.totalPacks || 0,
        margin: marchSummary.averageMargin || 0,
        activeAccounts: marchSummary.activeAccounts || 0,
        isProjected: false,
        isTrajectory: false
      },
      {
        month: 'Apr',
        profit: aprilSummary.totalProfit || 0,
        spend: aprilSummary.totalSpend || 0,
        packs: aprilSummary.totalPacks || 0,
        margin: aprilSummary.averageMargin || 0,
        activeAccounts: aprilSummary.activeAccounts || 0,
        isProjected: false,
        isTrajectory: false
      }
    ];
  }, [febSummary, marchSummary, aprilSummary]);
  
  // Calculate projected May values based on MTD data
  const projectedMayValues = useMemo(() => {
    const projectedProfit = projectMonthlyValue(maySummary.totalProfit || 0, workingDayPercentage);
    const projectedSpend = projectMonthlyValue(maySummary.totalSpend || 0, workingDayPercentage);
    const projectedPacks = projectMonthlyValue(maySummary.totalPacks || 0, workingDayPercentage);
    const projectedAccounts = projectMonthlyValue(maySummary.activeAccounts || 0, workingDayPercentage);
    // Margin doesn't need projection as it's a ratio
    const projectedMargin = maySummary.averageMargin || 0;
    
    return {
      profit: projectedProfit,
      spend: projectedSpend,
      packs: projectedPacks,
      margin: projectedMargin,
      activeAccounts: projectedAccounts
    };
  }, [maySummary, workingDayPercentage]);

  // Create trajectory data point for May
  const mayTrajectoryPoint = useMemo(() => {
    return {
      month: 'May',
      profit: projectedMayValues.profit,
      spend: projectedMayValues.spend,
      packs: projectedMayValues.packs,
      margin: projectedMayValues.margin,
      activeAccounts: projectedMayValues.activeAccounts,
      isProjected: true,
      isTrajectory: true
    };
  }, [projectedMayValues]);

  // Create the final display data by adding May trajectory point
  const displayData = useMemo(() => {
    // Add May projection to the actual data
    return [
      ...actualChartData,
      mayTrajectoryPoint
    ];
  }, [actualChartData, mayTrajectoryPoint]);

  // Calculate min and max margin values for the Y-axis domain
  const marginDomain = useMemo(() => {
    const allData = [...actualChartData, mayTrajectoryPoint];
    const margins = allData.map(item => item.margin).filter(Boolean);
    if (!margins.length) return [0, 100]; // Default range
    
    const minMargin = Math.max(0, Math.min(...margins) - 5); // Min with 5% padding, but not below 0
    const maxMargin = Math.min(100, Math.max(...margins) + 5); // Max with 5% padding, but not above 100%
    
    // Ensure there's at least a 10% range to show variation
    if (maxMargin - minMargin < 10) {
      return [
        Math.max(0, Math.floor(minMargin - 5)),
        Math.min(100, Math.ceil(maxMargin + 5))
      ];
    }
    
    return [Math.floor(minMargin), Math.ceil(maxMargin)];
  }, [actualChartData, mayTrajectoryPoint]);

  // Create rep-specific data with the same approach - actuals for Feb-Apr and trajectory for May
  const repChartData = useMemo(() => {
    if (!selectedReps.length) return [];
    
    return selectedReps.map((rep, repIndex) => {
      const repActualData: any[] = [];
      
      // Get rep data for Feb-Apr
      const febRepData = repDataProp.february ? repDataProp.february.find(r => r.rep === rep) : null;
      const marRepData = repDataProp.march ? repDataProp.march.find(r => r.rep === rep) : null;
      const aprRepData = repDataProp.april ? repDataProp.april.find(r => r.rep === rep) : null;
      const mayRepData = repDataProp.may ? repDataProp.may.find(r => r.rep === rep) : null;
      
      // Add February data
      if (febRepData) {
        repActualData.push({
          month: 'Feb',
          value: febRepData.profit || 0,
          spend: febRepData.spend || 0,
          packs: febRepData.packs || 0,
          margin: febRepData.margin || 0,
          rep: rep,
          isProjected: false,
          isTrajectory: false
        });
      }
      
      // Add March data
      if (marRepData) {
        repActualData.push({
          month: 'Mar',
          value: marRepData.profit || 0,
          spend: marRepData.spend || 0,
          packs: marRepData.packs || 0,
          margin: marRepData.margin || 0,
          rep: rep,
          isProjected: false,
          isTrajectory: false
        });
      }
      
      // Add April data
      if (aprRepData) {
        repActualData.push({
          month: 'Apr',
          value: aprRepData.profit || 0,
          spend: aprRepData.spend || 0,
          packs: aprRepData.packs || 0,
          margin: aprRepData.margin || 0,
          rep: rep,
          isProjected: false,
          isTrajectory: false
        });
      }
      
      // Add May trajectory point
      let mayTrajectoryPoint = null;
      if (mayRepData) {
        const projectedProfit = projectMonthlyValue(mayRepData.profit || 0, workingDayPercentage);
        const projectedSpend = projectMonthlyValue(mayRepData.spend || 0, workingDayPercentage);
        const projectedPacks = projectMonthlyValue(mayRepData.packs || 0, workingDayPercentage);
        
        mayTrajectoryPoint = {
          month: 'May',
          value: projectedProfit,
          spend: projectedSpend,
          packs: projectedPacks,
          margin: mayRepData.margin || 0,
          rep: rep,
          isProjected: true,
          isTrajectory: true
        };
      }
      
      // Return the final rep data with all months
      return {
        rep,
        color: CHART_COLORS[`rep${repIndex + 1}` as keyof typeof CHART_COLORS],
        // Create a single array with all data points including May trajectory
        data: mayTrajectoryPoint ? [...repActualData, mayTrajectoryPoint] : repActualData
      };
    });
  }, [selectedReps, repDataProp, workingDayPercentage]);

  // Enhanced tooltip for the chart - MODIFIED to simplify the tooltip content
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      // Check if this is a projected month
      const firstPayload = payload[0]?.payload;
      const isProjected = firstPayload?.isProjected;
      
      return (
        <div className="bg-gray-800 border border-gray-700 p-3 rounded-md shadow-lg backdrop-blur-sm">
          <p className="font-semibold text-gray-200">{label}</p>
          
          {/* Show overall metrics only if no reps are selected */}
          {selectedReps.length === 0 && (
            <>
              {showProfit && payload.find(p => p.dataKey === 'profit') && (
                <p className="text-sm text-finance-red flex items-center">
                  Profit: {formatCurrency(payload.find(p => p.dataKey === 'profit')?.value || 0)}
                  {isProjected && <span className="text-xs text-yellow-300 ml-1">(Projected)</span>}
                </p>
              )}
              {showSpend && payload.find(p => p.dataKey === 'spend') && (
                <p className="text-sm text-blue-400 flex items-center">
                  Spend: {formatCurrency(payload.find(p => p.dataKey === 'spend')?.value || 0)}
                  {isProjected && <span className="text-xs text-yellow-300 ml-1">(Projected)</span>}
                </p>
              )}
              {showPacks && payload.find(p => p.dataKey === 'packs') && (
                <p className="text-sm text-green-400 flex items-center">
                  Packs: {Math.round(payload.find(p => p.dataKey === 'packs')?.value || 0).toLocaleString()}
                  {isProjected && <span className="text-xs text-yellow-300 ml-1">(Projected)</span>}
                </p>
              )}
              {showMargin && payload.find(p => p.dataKey === 'margin') && (
                <p className="text-sm text-yellow-300 flex items-center">
                  Margin: {formatPercent(payload.find(p => p.dataKey === 'margin')?.value || 0)}
                </p>
              )}
            </>
          )}
          
          {/* Show rep-specific metrics */}
          {selectedReps.map((rep, index) => {
            const repData = payload.find(p => p.name === `${rep} - Profit` || p.name === `${rep} - Spend` || 
                                          p.name === `${rep} - Packs` || p.name === `${rep} - Margin %`);
            
            if (repData) {
              const repColor = CHART_COLORS[`rep${index + 1}` as keyof typeof CHART_COLORS];
              const isRepProjected = repData.payload?.isProjected;
              const metricType = repData.name.split(' - ')[1]; // Extract metric type (Profit, Spend, etc.)
              const value = repData.value;
              
              return (
                <div key={rep} className={`${index === 0 ? '' : 'mt-2 border-t border-gray-700 pt-2'}`}>
                  <p className="text-sm font-medium" style={{ color: repColor }}>{rep}</p>
                  <p className="text-sm flex items-center" style={{ color: repColor }}>
                    {metricType}: 
                    {metricType === 'Margin %' 
                      ? ` ${formatPercent(value)}` 
                      : metricType === 'Packs' 
                        ? ` ${Math.round(value).toLocaleString()}`
                        : ` ${formatCurrency(value)}`
                    }
                    {isRepProjected && <span className="text-xs text-yellow-300 ml-1">(Projected)</span>}
                  </p>
                </div>
              );
            }
            return null;
          })}
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
    setShowMargin(value.includes('margin'));
  };

  // Handle rep selection
  const handleRepSelect = (rep: string) => {
    if (selectedReps.includes(rep)) {
      setSelectedReps(selectedReps.filter(r => r !== rep));
    } else if (selectedReps.length < 3) {
      setSelectedReps([...selectedReps, rep]);
    }
  };

  const clearSelectedReps = () => {
    setSelectedReps([]);
  };

  // Split data into regular data and trajectory data
  const createSplitData = (data: any[]) => {
    // Sort data to ensure months are in correct order
    const sortedData = [...data].sort((a, b) => MONTH_ORDER[a.month] - MONTH_ORDER[b.month]);
    
    // Create two separate datasets - one for actual data, one for trajectory
    const actualData = sortedData.filter(item => !item.isTrajectory);
    const trajectoryData = sortedData.filter(item => item.isTrajectory);
    
    return { actualData, trajectoryData };
  };
  
  const { actualData: mainActualData, trajectoryData: mainTrajectoryData } = useMemo(
    () => createSplitData(displayData),
    [displayData]
  );
  
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
    ...(showPacks ? ['packs'] : []),
    ...(showMargin ? ['margin'] : [])
  ];
  
  // Determine which axes to show based on selected metrics
  const showLeftAxis = showProfit || showSpend || selectedReps.length > 0;
  const showRightAxis = showPacks || showMargin || selectedReps.length > 0;
  
  // Generate department display text
  const getDepartmentDisplayText = () => {
    const departments = [];
    if (includeRetail) departments.push('Retail');
    if (includeReva) departments.push('REVA');
    if (includeWholesale) departments.push('Wholesale');
    return departments.join(', ');
  };
  
  // Custom right axis formatter that handles both packs and margin
  const rightAxisFormatter = (value: number) => {
    // If margin is selected and the value is likely a percentage (between 0-100)
    if (showMargin && !showPacks && value <= 100) {
      return `${value.toFixed(1)}%`;
    }
    // If both margin and packs are selected, or just packs
    // Format numbers appropriately
    return value > 1000 ? `${(value / 1000)}k` : `${value}`;
  };
  
  // Function to calculate the right domain based on selected metrics
  const calculateRightDomain = () => {
    if (showMargin && !showPacks) {
      // If only margin is selected, use margin domain
      return marginDomain;
    } else if (!showMargin && showPacks) {
      // If only packs is selected, let recharts auto-scale
      return undefined;
    } else if (showMargin && showPacks) {
      // If both are selected, this requires special handling
      // We'll need to normalize values to work in a single axis
      // This is complex and might require data transformation
      // For now, we'll prioritize packs for domain scaling
      return undefined;
    }
    return undefined;
  };
  
  return (
    <Card className="bg-gray-900/40 border border-white/10 backdrop-blur-sm shadow-lg">
      <CardHeader className="pb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-medium text-white/90">
              Monthly Performance Trends
            </CardTitle>
            
            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
                    <Info className="h-4 w-4 text-gray-400" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-[280px]">
                  <p className="text-sm">
                    May shows projected performance based on {workingDayPercentage.toFixed(1)}% 
                    of working days completed. Dotted lines indicate projections.
                  </p>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>
          </div>
          
          {workingDayPercentage > 0 && workingDayPercentage < 100 && (
            <div className="text-xs text-yellow-300/80">
              May: {workingDayPercentage.toFixed(1)}% complete
            </div>
          )}
        </div>
        
        <div className={`flex ${isMobile ? 'flex-col' : 'justify-between'} items-center mt-8 gap-3`}>
          <ToggleGroup 
            type="multiple" 
            value={activeToggles} 
            onValueChange={handleToggleChange}
            className="justify-start"
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
            <ToggleGroupItem value="margin" aria-label="Toggle Margin" className="data-[state=on]:bg-yellow-300/20 data-[state=on]:text-yellow-300 border-gray-700">
              <div className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-full bg-yellow-300"></span>
                <span className="text-xs">Margin</span>
              </div>
            </ToggleGroupItem>
          </ToggleGroup>
          
          <Button
            variant="outline"
            size="sm"
            className="px-4 py-1 rounded-full border border-white/30 bg-transparent text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            onClick={() => setShowRepComparison(!showRepComparison)}
          >
            Compare Reps
          </Button>
        </div>
        
        {/* Rep comparison section */}
        {showRepComparison && (
          <div className="mt-8">
            <Separator className="mb-6 bg-gray-700/50" />
            <RepSelector
              availableReps={availableReps}
              selectedReps={selectedReps}
              onSelectRep={handleRepSelect}
              onClearSelection={clearSelectedReps}
              maxSelections={3}
            />
          </div>
        )}
      </CardHeader>
      
      {/* Added departments display above the chart */}
      <div className="px-6 pb-3 text-sm text-white/70">
        <span className="font-medium">Data Sources:</span> {getDepartmentDisplayText()}
      </div>
      
      <CardContent className="pt-3 pb-8">
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={displayData}
              margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="month" 
                tick={{ fill: 'rgba(255,255,255,0.6)' }}
                xAxisId="shared"
                allowDuplicatedCategory={false}
              />
              {showLeftAxis && (
                <YAxis 
                  yAxisId="left"
                  orientation="left"
                  tick={{ fill: 'rgba(255,255,255,0.6)' }}
                  tickFormatter={(value) => `£${(value / 1000)}k`}
                  width={60}
                />
              )}
              {showRightAxis && (
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: 'rgba(255,255,255,0.6)' }}
                  tickFormatter={rightAxisFormatter}
                  domain={calculateRightDomain()}
                  width={45}
                />
              )}
              <Tooltip content={<CustomTooltip />} />
              
              {/* Display profit metric if selected - split into actual and trajectory lines */}
              {selectedReps.length === 0 && showProfit && (
                <>
                  {/* Actual data line (Feb-Apr) */}
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="profit" 
                    name="Profit" 
                    stroke={CHART_COLORS.profit}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    xAxisId="shared"
                    data={mainActualData}
                    connectNulls={true}
                  />
                  {/* Trajectory line for May (needs to include April for continuity) */}
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
                    xAxisId="shared"
                    data={mainTrajectoryData.length ? [mainActualData[mainActualData.length - 1], ...mainTrajectoryData] : []}
                    connectNulls={true}
                  />
                </>
              )}
              
              {/* Display spend metric if selected */}
              {selectedReps.length === 0 && showSpend && (
                <>
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="spend" 
                    name="Spend" 
                    stroke={CHART_COLORS.spend}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    xAxisId="shared"
                    data={mainActualData}
                    connectNulls={true}
                  />
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
                    xAxisId="shared"
                    data={mainTrajectoryData.length ? [mainActualData[mainActualData.length - 1], ...mainTrajectoryData] : []}
                    connectNulls={true}
                  />
                </>
              )}
              
              {/* Display packs metric if selected */}
              {selectedReps.length === 0 && showPacks && (
                <>
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="packs" 
                    name="Packs" 
                    stroke={CHART_COLORS.packs}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    xAxisId="shared"
                    data={mainActualData}
                    connectNulls={true}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="packs" 
                    name="Packs" 
                    stroke={CHART_COLORS.packs}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    xAxisId="shared"
                    data={mainTrajectoryData.length ? [mainActualData[mainActualData.length - 1], ...mainTrajectoryData] : []}
                    connectNulls={true}
                  />
                </>
              )}
              
              {/* Display margin metric if selected - now using the right axis */}
              {selectedReps.length === 0 && showMargin && (
                <>
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="margin" 
                    name="Margin %" 
                    stroke={CHART_COLORS.margin}
                    strokeWidth={2}
                    dot={{ r: 4, fill: CHART_COLORS.margin }}
                    activeDot={{ r: 6 }}
                    xAxisId="shared"
                    data={mainActualData}
                    connectNulls={true}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="margin" 
                    name="Margin %" 
                    stroke={CHART_COLORS.margin}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 4, fill: CHART_COLORS.margin }}
                    activeDot={{ r: 6 }}
                    xAxisId="shared"
                    data={mainTrajectoryData.length ? [mainActualData[mainActualData.length - 1], ...mainTrajectoryData] : []}
                    connectNulls={true}
                  />
                </>
              )}
              
              {/* Rep-specific metrics with continuous lines that change to dotted for May */}
              {repChartData.map((repData) => {
                const { actualData: repActualData, trajectoryData: repTrajectoryData } = createSplitData(repData.data);
                
                return (
                  <React.Fragment key={repData.rep}>
                    {/* Display rep profit */}
                    {showProfit && (
                      <>
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="value"
                          name={`${repData.rep} - Profit`}
                          stroke={repData.color}
                          strokeWidth={1.5}
                          dot={{ r: 3 }}
                          activeDot={{ r: 5 }}
                          data={repActualData}
                          xAxisId="shared"
                          connectNulls={true}
                        />
                        {repTrajectoryData.length > 0 && (
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="value"
                            name={`${repData.rep} - Profit`}
                            stroke={repData.color}
                            strokeWidth={1.5}
                            strokeDasharray="5 5"
                            dot={{ r: 3 }}
                            activeDot={{ r: 5 }}
                            data={repTrajectoryData.length ? [repActualData[repActualData.length - 1], ...repTrajectoryData] : []}
                            xAxisId="shared"
                            connectNulls={true}
                          />
                        )}
                      </>
                    )}
                    
                    {/* Display rep spend */}
                    {showSpend && (
                      <>
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="spend"
                          name={`${repData.rep} - Spend`}
                          stroke={repData.color}
                          strokeWidth={1.5}
                          dot={{ r: 3 }}
                          activeDot={{ r: 5 }}
                          data={repActualData}
                          xAxisId="shared"
                          connectNulls={true}
                          strokeDasharray="3 3"
                        />
                        {repTrajectoryData.length > 0 && (
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="spend"
                            name={`${repData.rep} - Spend`}
                            stroke={repData.color}
                            strokeWidth={1.5}
                            strokeDasharray="5 5"
                            dot={{ r: 3 }}
                            activeDot={{ r: 5 }}
                            data={repTrajectoryData.length ? [repActualData[repActualData.length - 1], ...repTrajectoryData] : []}
                            xAxisId="shared"
                            connectNulls={true}
                          />
                        )}
                      </>
                    )}
                    
                    {/* Display rep packs */}
                    {showPacks && (
                      <>
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="packs"
                          name={`${repData.
