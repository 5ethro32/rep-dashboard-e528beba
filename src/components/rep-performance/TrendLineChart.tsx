import React, { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, TooltipProps } from 'recharts';
import { SummaryData } from '@/types/rep-performance.types';
import { formatCurrency } from '@/utils/rep-performance-utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import RepSelector from '@/components/rep-performance/RepSelector';
import { Separator } from '@/components/ui/separator';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronDown, ChevronUp } from 'lucide-react';
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
  revenue: number;
  packs: number;
  activeAccounts: number;
  margin: number;
  // Add rep-specific data
  [key: string]: any;
}
const CHART_COLORS = {
  profit: '#ef4444',
  revenue: '#60a5fa',
  packs: '#4ade80',
  margin: '#fbbf24',
  // Yellow color for margin
  rep1: '#f97316',
  // Orange for first rep
  rep2: '#8b5cf6',
  // Purple for second rep
  rep3: '#06b6d4' // Cyan for third rep
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
  const [showRevenue, setShowRevenue] = useState(false);
  const [showPacks, setShowPacks] = useState(false);
  const [showMargin, setShowMargin] = useState(false);

  // State for rep comparison
  const [showRepComparison, setShowRepComparison] = useState(false);
  const [selectedReps, setSelectedReps] = useState<string[]>([]);
  const [availableReps, setAvailableReps] = useState<string[]>([]);

  // Generate the list of available reps from all months' data
  React.useEffect(() => {
    const allReps = new Set<string>();

    // Collect unique rep names from all months
    ['february', 'march', 'april', 'may'].forEach(month => {
      if (repDataProp[month]) {
        repDataProp[month].forEach(item => {
          if (item.rep) {
            allReps.add(item.rep);
          }
        });
      }
    });
    setAvailableReps(Array.from(allReps).sort());
  }, [repDataProp]);

  // Create base chart data with overall metrics
  const chartData = useMemo(() => {
    const data: TrendData[] = [{
      month: 'Feb',
      profit: febSummary.totalProfit || 0,
      revenue: febSummary.totalSpend || 0,
      packs: febSummary.totalPacks || 0,
      activeAccounts: febSummary.activeAccounts || 0,
      margin: febSummary.totalSpend > 0 ? febSummary.totalProfit / febSummary.totalSpend * 100 : 0
    }, {
      month: 'Mar',
      profit: marchSummary.totalProfit || 0,
      revenue: marchSummary.totalSpend || 0,
      packs: marchSummary.totalPacks || 0,
      activeAccounts: marchSummary.activeAccounts || 0,
      margin: marchSummary.totalSpend > 0 ? marchSummary.totalProfit / marchSummary.totalSpend * 100 : 0
    }, {
      month: 'Apr',
      profit: aprilSummary.totalProfit || 0,
      revenue: aprilSummary.totalSpend || 0,
      packs: aprilSummary.totalPacks || 0,
      activeAccounts: aprilSummary.activeAccounts || 0,
      margin: aprilSummary.totalSpend > 0 ? aprilSummary.totalProfit / aprilSummary.totalSpend * 100 : 0
    }
    // May data removed to prevent distorted scales during mid-month periods
    ];
    return data;
  }, [febSummary, marchSummary, aprilSummary]);

  // Enhance chart data with rep-specific metrics instead of creating separate data arrays
  const enhancedChartData = useMemo(() => {
    if (!selectedReps.length) return chartData;

    // Clone the base chart data
    const enhancedData = chartData.map(item => ({
      ...item
    }));

    // Add rep-specific data to each month
    selectedReps.forEach((rep, repIndex) => {
      // Get rep data for each month
      const febRepData = repDataProp.february.find(r => r.rep === rep);
      const marRepData = repDataProp.march.find(r => r.rep === rep);
      const aprRepData = repDataProp.april.find(r => r.rep === rep);

      // Feb data (index 0)
      if (febRepData) {
        enhancedData[0][`profit-rep-${repIndex}`] = febRepData.profit || 0;
        enhancedData[0][`revenue-rep-${repIndex}`] = febRepData.spend || 0;
        enhancedData[0][`packs-rep-${repIndex}`] = febRepData.packs || 0;
        enhancedData[0][`margin-rep-${repIndex}`] = febRepData.spend > 0 ? febRepData.profit / febRepData.spend * 100 : 0;
        enhancedData[0][`rep-name-${repIndex}`] = rep;
      }

      // March data (index 1)
      if (marRepData) {
        enhancedData[1][`profit-rep-${repIndex}`] = marRepData.profit || 0;
        enhancedData[1][`revenue-rep-${repIndex}`] = marRepData.spend || 0;
        enhancedData[1][`packs-rep-${repIndex}`] = marRepData.packs || 0;
        enhancedData[1][`margin-rep-${repIndex}`] = marRepData.spend > 0 ? marRepData.profit / marRepData.spend * 100 : 0;
        enhancedData[1][`rep-name-${repIndex}`] = rep;
      }

      // April data (index 2)
      if (aprRepData) {
        enhancedData[2][`profit-rep-${repIndex}`] = aprRepData.profit || 0;
        enhancedData[2][`revenue-rep-${repIndex}`] = aprRepData.spend || 0;
        enhancedData[2][`packs-rep-${repIndex}`] = aprRepData.packs || 0;
        enhancedData[2][`margin-rep-${repIndex}`] = aprRepData.spend > 0 ? aprRepData.profit / aprRepData.spend * 100 : 0;
        enhancedData[2][`rep-name-${repIndex}`] = rep;
      }

      // May data removed to prevent distorted scales
    });
    return enhancedData;
  }, [chartData, selectedReps, repDataProp]);

  // Custom tooltip component
  const CustomTooltip = ({
    active,
    payload,
    label
  }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const isRepData = payload.some(p => p.dataKey.toString().includes('rep'));
      return <div className="bg-gray-800 border border-gray-700 p-3 rounded-md shadow-lg backdrop-blur-sm">
          <p className="font-semibold text-gray-200">{label}</p>
          
          {/* Show overall metrics only if no reps are selected */}
          {selectedReps.length === 0 && <>
              {showProfit && payload.find(p => p.dataKey === 'profit') && <p className="text-sm text-finance-red">
                  Profit: {formatCurrency(Math.round(payload.find(p => p.dataKey === 'profit')?.value || 0))}
                </p>}
              {showRevenue && payload.find(p => p.dataKey === 'revenue') && <p className="text-sm text-blue-400">
                  Revenue: {formatCurrency(Math.round(payload.find(p => p.dataKey === 'revenue')?.value || 0))}
                </p>}
              {showPacks && payload.find(p => p.dataKey === 'packs') && <p className="text-sm text-green-400">
                  Packs: {Math.round(payload.find(p => p.dataKey === 'packs')?.value || 0).toLocaleString()}
                </p>}
              {showMargin && payload.find(p => p.dataKey === 'margin') && <p className="text-sm text-yellow-400">
                  Margin: {Math.round(payload.find(p => p.dataKey === 'margin')?.value || 0)}%
                </p>}
            </>}
          
          {/* Show rep-specific metrics */}
          {selectedReps.map((rep, index) => {
          const repColor = CHART_COLORS[`rep${index + 1}` as keyof typeof CHART_COLORS];
          const profitValue = payload.find(p => p.dataKey === `profit-rep-${index}`)?.value;
          const revenueValue = payload.find(p => p.dataKey === `revenue-rep-${index}`)?.value;
          const packsValue = payload.find(p => p.dataKey === `packs-rep-${index}`)?.value;
          const marginValue = payload.find(p => p.dataKey === `margin-rep-${index}`)?.value;

          // Only show this rep section if at least one of their metrics is found in the payload
          if (profitValue !== undefined || revenueValue !== undefined || packsValue !== undefined || marginValue !== undefined) {
            return <div key={rep} className={`${index === 0 && selectedReps.length > 0 ? '' : 'mt-2 border-t border-gray-700 pt-2'}`}>
                  <p className="text-sm font-medium" style={{
                color: repColor
              }}>{rep}</p>
                  
                  {showProfit && profitValue !== undefined && <p className="text-sm" style={{
                color: repColor
              }}>
                      Profit: {formatCurrency(Math.round(profitValue))}
                    </p>}
                  
                  {showRevenue && revenueValue !== undefined && <p className="text-sm" style={{
                color: repColor
              }}>
                      Revenue: {formatCurrency(Math.round(revenueValue))}
                    </p>}
                  
                  {showPacks && packsValue !== undefined && <p className="text-sm" style={{
                color: repColor
              }}>
                      Packs: {Math.round(packsValue).toLocaleString()}
                    </p>}
                  
                  {showMargin && marginValue !== undefined && <p className="text-sm" style={{
                color: repColor
              }}>
                      Margin: {Math.round(marginValue)}%
                    </p>}
                </div>;
          }
          return null;
        })}
        </div>;
    }
    return null;
  };

  // Handler for toggle changes
  const handleToggleChange = (value: string[]) => {
    setShowProfit(value.includes('profit'));
    setShowRevenue(value.includes('revenue'));
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

  // Clear all selected reps
  const clearSelectedReps = () => {
    setSelectedReps([]);
  };

  // Calculate the min and max values for better y-axis scaling
  const getYAxisDomain = useMemo(() => {
    // Get values for each metric type
    const allProfitValues = chartData.map(item => item.profit).filter(val => val > 0);
    const allRevenueValues = chartData.map(item => item.revenue).filter(val => val > 0);
    const allPacksValues = chartData.map(item => item.packs).filter(val => val > 0);
    const allMarginValues = chartData.map(item => item.margin).filter(val => val > 0);

    // Calculate domains for each metric independently
    const getPaddedDomain = (values: number[]) => {
      if (values.length === 0) return [0, 100];
      const min = Math.min(...values);
      const max = Math.max(...values);
      const padding = (max - min) * 0.1;
      return [Math.max(0, min - padding), max + padding];
    };
    const profitDomain = getPaddedDomain(allProfitValues);
    const revenueDomain = getPaddedDomain(allRevenueValues);
    const packsDomain = getPaddedDomain(allPacksValues);
    const marginDomain = getPaddedDomain(allMarginValues);

    // Determine left axis domain based on selected metrics
    let leftDomain;
    if (showProfit && showRevenue) {
      // If both profit and revenue are shown, use a domain that encompasses both
      const allMoneyValues = [...allProfitValues, ...allRevenueValues];
      leftDomain = getPaddedDomain(allMoneyValues);
    } else if (showProfit) {
      // If only profit is shown, use profit-specific domain
      leftDomain = profitDomain;
    } else if (showRevenue) {
      // If only revenue is shown, use revenue-specific domain
      leftDomain = revenueDomain;
    } else {
      // Fallback
      leftDomain = [0, 100000];
    }

    // Determine right axis domain based on selected metrics
    let rightDomain;
    if (showPacks && !showMargin) {
      // Only packs is shown
      rightDomain = packsDomain;
    } else if (showMargin && !showPacks) {
      // Only margin is shown - use margin-specific domain
      rightDomain = marginDomain;
    } else if (showPacks && showMargin) {
      // Both are shown - packs gets the regular right axis, margin gets its own axis
      rightDomain = packsDomain;
    } else {
      // No right axis metrics selected
      rightDomain = [0, 100];
    }
    return {
      left: leftDomain,
      right: rightDomain,
      margin: marginDomain // Always provide the margin domain separately
    };
  }, [chartData, showProfit, showRevenue, showPacks, showMargin]);
  if (isLoading) {
    return <Card className="bg-gray-900/40 border border-white/10 backdrop-blur-sm shadow-lg">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-1/3 bg-gray-800/50" />
          <Skeleton className="h-4 w-1/4 bg-gray-800/50" />
        </CardHeader>
        <CardContent className="h-56">
          <Skeleton className="h-full w-full bg-gray-800/50" />
        </CardContent>
      </Card>;
  }

  // Calculate which toggles are active
  const activeToggles = [...(showRevenue ? ['revenue'] : []), ...(showProfit ? ['profit'] : []), ...(showMargin ? ['margin'] : []), ...(showPacks ? ['packs'] : [])];
  return <Card className="bg-gray-900/40 border border-white/10 backdrop-blur-sm shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-white/90 flex justify-between">
          <span>Monthly Performance Trends</span>
        </CardTitle>
        
        <ToggleGroup type="multiple" value={activeToggles} onValueChange={handleToggleChange} className="justify-start mb-2">
          <ToggleGroupItem value="revenue" aria-label="Toggle Revenue" className="data-[state=on]:bg-blue-500/20 data-[state=on]:text-blue-400 border-gray-700">
            <div className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-full bg-blue-500"></span>
              <span className="text-xs">Revenue</span>
            </div>
          </ToggleGroupItem>
          <ToggleGroupItem value="profit" aria-label="Toggle Profit" className="data-[state=on]:bg-finance-red/20 data-[state=on]:text-finance-red border-gray-700">
            <div className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-full bg-finance-red"></span>
              <span className="text-xs">Profit</span>
            </div>
          </ToggleGroupItem>
          <ToggleGroupItem value="margin" aria-label="Toggle Margin" className="data-[state=on]:bg-yellow-500/20 data-[state=on]:text-yellow-400 border-gray-700">
            <div className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-full bg-yellow-500"></span>
              <span className="text-xs">Margin</span>
            </div>
          </ToggleGroupItem>
          <ToggleGroupItem value="packs" aria-label="Toggle Packs" className="data-[state=on]:bg-green-500/20 data-[state=on]:text-green-400 border-gray-700">
            <div className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-full bg-green-500"></span>
              <span className="text-xs">Packs</span>
            </div>
          </ToggleGroupItem>
        </ToggleGroup>
        
        {/* Rep comparison section with improved styling */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-sm cursor-pointer mb-1" onClick={() => setShowRepComparison(!showRepComparison)}>
            <span className="font-medium flex items-center bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Compare Reps
              {showRepComparison ? <ChevronUp className="ml-1 h-4 w-4 text-blue-400" /> : <ChevronDown className="ml-1 h-4 w-4 text-blue-400" />}
            </span>
            
            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger asChild>
                  <button className="text-xs px-3 py-1 rounded-full border border-purple-400/30 bg-purple-400/10 text-purple-300 hover:bg-purple-400/20 transition-colors">
                    Compare Reps
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Select up to 3 reps to compare their performance</p>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>
          </div>

          {showRepComparison && <div className="mt-2 mb-3">
              <Separator className="mb-3 bg-gray-700/50" />
              <RepSelector availableReps={availableReps} selectedReps={selectedReps} onSelectRep={handleRepSelect} onClearSelection={clearSelectedReps} maxSelections={3} />
            </div>}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={enhancedChartData} margin={{
            top: 10,
            right: 10,
            left: 10,
            bottom: 10
          }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="month" tick={{
              fill: 'rgba(255,255,255,0.6)'
            }} />
              {/* Always include a left axis */}
              <YAxis yAxisId="left" orientation="left" tick={{
              fill: 'rgba(255,255,255,0.6)'
            }} tickFormatter={value => `£${Math.round(value / 1000)}k`} width={60} domain={getYAxisDomain.left} hide={!showProfit && !showRevenue && (showPacks || showMargin)} />
              {/* Packs axis */}
              {showPacks && <YAxis yAxisId="right" orientation="right" tick={{
              fill: 'rgba(255,255,255,0.6)'
            }} tickFormatter={value => `${Math.round(value / 1000)}k`} domain={getYAxisDomain.right} />}
              {/* Margin axis - separate when both packs and margin are shown */}
              {showMargin && <YAxis yAxisId={showPacks ? "margin" : "right"} orientation="right" tick={{
              fill: 'rgba(255,255,255,0.6)'
            }} tickFormatter={value => `${Math.round(value)}%`} domain={getYAxisDomain.margin} axisLine={showPacks ? {
              stroke: CHART_COLORS.margin
            } : undefined} tickLine={showPacks ? {
              stroke: CHART_COLORS.margin
            } : undefined} allowDecimals={false} />}
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {/* Overall metrics lines - only display when no reps are selected */}
              {selectedReps.length === 0 && showProfit && <Line yAxisId="left" type="monotone" dataKey="profit" name="Profit" stroke={CHART_COLORS.profit} strokeWidth={2} dot={{
              r: 4
            }} activeDot={{
              r: 6
            }} />}
              {selectedReps.length === 0 && showRevenue && <Line yAxisId="left" type="monotone" dataKey="revenue" name="Revenue" stroke={CHART_COLORS.revenue} strokeWidth={2} dot={{
              r: 4
            }} activeDot={{
              r: 6
            }} />}
              {selectedReps.length === 0 && showPacks && <Line yAxisId="right" type="monotone" dataKey="packs" name="Packs" stroke={CHART_COLORS.packs} strokeWidth={2} dot={{
              r: 4
            }} activeDot={{
              r: 6
            }} />}
              {selectedReps.length === 0 && showMargin && <Line yAxisId={showPacks ? "margin" : "right"} type="monotone" dataKey="margin" name="Margin" stroke={CHART_COLORS.margin} strokeWidth={2} dot={{
              r: 4
            }} activeDot={{
              r: 6
            }} />}
              
              {/* Rep-specific metric lines */}
              {selectedReps.map((rep, repIndex) => {
              const color = CHART_COLORS[`rep${repIndex + 1}` as keyof typeof CHART_COLORS];
              return <React.Fragment key={rep}>
                    {showProfit && <Line yAxisId="left" type="monotone" dataKey={`profit-rep-${repIndex}`} name={`${rep} - Profit`} stroke={color} strokeWidth={1.5} strokeDasharray="5 5" dot={{
                  r: 3
                }} activeDot={{
                  r: 5
                }} />}
                    
                    {showRevenue && <Line yAxisId="left" type="monotone" dataKey={`revenue-rep-${repIndex}`} name={`${rep} - Revenue`} stroke={color} strokeWidth={1.5} strokeDasharray="3 3" dot={{
                  r: 3,
                  strokeDasharray: ''
                }} activeDot={{
                  r: 5
                }} />}
                    
                    {showPacks && <Line yAxisId="right" type="monotone" dataKey={`packs-rep-${repIndex}`} name={`${rep} - Packs`} stroke={color} strokeWidth={1.5} strokeDasharray="1 1" dot={{
                  r: 3,
                  strokeDasharray: ''
                }} activeDot={{
                  r: 5
                }} />}
                    
                    {showMargin && <Line yAxisId={showPacks ? "margin" : "right"} type="monotone" dataKey={`margin-rep-${repIndex}`} name={`${rep} - Margin`} stroke={color} strokeWidth={1.5} strokeDasharray="4 4" dot={{
                  r: 3,
                  strokeDasharray: ''
                }} activeDot={{
                  r: 5
                }} />}
                  </React.Fragment>;
            })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>;
};
export default TrendLineChart;