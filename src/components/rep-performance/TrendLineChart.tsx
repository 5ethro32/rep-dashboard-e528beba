import React, { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, TooltipProps } from 'recharts';
import { SummaryData } from '@/types/rep-performance.types';
import { formatCurrency, formatPercent } from '@/utils/rep-performance-utils';
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
  spend: number;
  packs: number;
  margin: number;
  activeAccounts: number;
  // Add rep-specific data
  [key: string]: any;
}

const CHART_COLORS = {
  profit: '#ef4444',
  spend: '#60a5fa',
  packs: '#4ade80',
  margin: '#fef08a', // Yellow color for margin
  rep1: '#f97316',   // Orange for first rep
  rep2: '#8b5cf6',   // Purple for second rep
  rep3: '#06b6d4',   // Cyan for third rep
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
  const [showMargin, setShowMargin] = useState(false); // Changed to false by default
  
  // State for rep comparison
  const [showRepComparison, setShowRepComparison] = useState(false);
  const [selectedReps, setSelectedReps] = useState<string[]>([]);
  const [availableReps, setAvailableReps] = useState<string[]>([]);

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

  // Create base chart data with overall metrics
  const chartData = useMemo(() => {
    const data: TrendData[] = [
      {
        month: 'Feb',
        profit: febSummary.totalProfit || 0,
        spend: febSummary.totalSpend || 0,
        packs: febSummary.totalPacks || 0,
        margin: febSummary.averageMargin || 0,
        activeAccounts: febSummary.activeAccounts || 0
      },
      {
        month: 'Mar',
        profit: marchSummary.totalProfit || 0,
        spend: marchSummary.totalSpend || 0,
        packs: marchSummary.totalPacks || 0,
        margin: marchSummary.averageMargin || 0,
        activeAccounts: marchSummary.activeAccounts || 0
      },
      {
        month: 'Apr',
        profit: aprilSummary.totalProfit || 0,
        spend: aprilSummary.totalSpend || 0,
        packs: aprilSummary.totalPacks || 0,
        margin: aprilSummary.averageMargin || 0,
        activeAccounts: aprilSummary.activeAccounts || 0
      },
      {
        month: 'May',
        profit: maySummary.totalProfit || 0,
        spend: maySummary.totalSpend || 0,
        packs: maySummary.totalPacks || 0,
        margin: maySummary.averageMargin || 0,
        activeAccounts: maySummary.activeAccounts || 0
      }
    ];
    
    return data;
  }, [febSummary, marchSummary, aprilSummary, maySummary]);

  // Calculate min and max margin values for the Y-axis domain
  const marginDomain = useMemo(() => {
    const margins = chartData.map(item => item.margin).filter(Boolean);
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
  }, [chartData]);

  // Enhance chart data with rep-specific metrics instead of creating separate data arrays
  const enhancedChartData = useMemo(() => {
    if (!selectedReps.length) return chartData;
    
    // Clone the base chart data
    const enhancedData = chartData.map(item => ({...item}));
    
    // Add rep-specific data to each month
    selectedReps.forEach((rep, repIndex) => {
      // Get rep data for each month
      const febRepData = repDataProp && repDataProp.february ? 
        repDataProp.february.find(r => r.rep === rep) : null;
      const marRepData = repDataProp && repDataProp.march ? 
        repDataProp.march.find(r => r.rep === rep) : null;
      const aprRepData = repDataProp && repDataProp.april ? 
        repDataProp.april.find(r => r.rep === rep) : null;
      const mayRepData = repDataProp && repDataProp.may ? 
        repDataProp.may.find(r => r.rep === rep) : null;
      
      // Feb data (index 0)
      if (febRepData) {
        enhancedData[0][`profit-rep-${repIndex}`] = febRepData.profit || 0;
        enhancedData[0][`spend-rep-${repIndex}`] = febRepData.spend || 0;
        enhancedData[0][`packs-rep-${repIndex}`] = febRepData.packs || 0;
        enhancedData[0][`margin-rep-${repIndex}`] = febRepData.margin || 0;
        enhancedData[0][`rep-name-${repIndex}`] = rep;
      }
      
      // March data (index 1)
      if (marRepData) {
        enhancedData[1][`profit-rep-${repIndex}`] = marRepData.profit || 0;
        enhancedData[1][`spend-rep-${repIndex}`] = marRepData.spend || 0;
        enhancedData[1][`packs-rep-${repIndex}`] = marRepData.packs || 0;
        enhancedData[1][`margin-rep-${repIndex}`] = marRepData.margin || 0;
        enhancedData[1][`rep-name-${repIndex}`] = rep;
      }
      
      // April data (index 2)
      if (aprRepData) {
        enhancedData[2][`profit-rep-${repIndex}`] = aprRepData.profit || 0;
        enhancedData[2][`spend-rep-${repIndex}`] = aprRepData.spend || 0;
        enhancedData[2][`packs-rep-${repIndex}`] = aprRepData.packs || 0;
        enhancedData[2][`margin-rep-${repIndex}`] = aprRepData.margin || 0;
        enhancedData[2][`rep-name-${repIndex}`] = rep;
      }
      
      // May data (index 3)
      if (mayRepData) {
        enhancedData[3][`profit-rep-${repIndex}`] = mayRepData.profit || 0;
        enhancedData[3][`spend-rep-${repIndex}`] = mayRepData.spend || 0;
        enhancedData[3][`packs-rep-${repIndex}`] = mayRepData.packs || 0;
        enhancedData[3][`margin-rep-${repIndex}`] = mayRepData.margin || 0;
        enhancedData[3][`rep-name-${repIndex}`] = rep;
      }
    });
    
    return enhancedData;
  }, [chartData, selectedReps, repDataProp]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const isRepData = payload.some(p => p.dataKey.toString().includes('rep'));
      
      return (
        <div className="bg-gray-800 border border-gray-700 p-3 rounded-md shadow-lg backdrop-blur-sm">
          <p className="font-semibold text-gray-200">{label}</p>
          
          {/* Show overall metrics only if no reps are selected */}
          {selectedReps.length === 0 && (
            <>
              {showProfit && payload.find(p => p.dataKey === 'profit') && (
                <p className="text-sm text-finance-red">Profit: {formatCurrency(payload.find(p => p.dataKey === 'profit')?.value || 0)}</p>
              )}
              {showSpend && payload.find(p => p.dataKey === 'spend') && (
                <p className="text-sm text-blue-400">Spend: {formatCurrency(payload.find(p => p.dataKey === 'spend')?.value || 0)}</p>
              )}
              {showPacks && payload.find(p => p.dataKey === 'packs') && (
                <p className="text-sm text-green-400">Packs: {Math.round(payload.find(p => p.dataKey === 'packs')?.value || 0).toLocaleString()}</p>
              )}
              {showMargin && payload.find(p => p.dataKey === 'margin') && (
                <p className="text-sm text-yellow-300">Margin: {formatPercent(payload.find(p => p.dataKey === 'margin')?.value || 0)}</p>
              )}
            </>
          )}
          
          {/* Show rep-specific metrics */}
          {selectedReps.map((rep, index) => {
            const repColor = CHART_COLORS[`rep${index + 1}` as keyof typeof CHART_COLORS];
            const profitValue = payload.find(p => p.dataKey === `profit-rep-${index}`)?.value;
            const spendValue = payload.find(p => p.dataKey === `spend-rep-${index}`)?.value;
            const packsValue = payload.find(p => p.dataKey === `packs-rep-${index}`)?.value;
            const marginValue = payload.find(p => p.dataKey === `margin-rep-${index}`)?.value;
            
            // Only show this rep section if at least one of their metrics is found in the payload
            if (profitValue !== undefined || spendValue !== undefined || packsValue !== undefined || marginValue !== undefined) {
              return (
                <div key={rep} className={`${index === 0 && selectedReps.length > 0 ? '' : 'mt-2 border-t border-gray-700 pt-2'}`}>
                  <p className="text-sm font-medium" style={{ color: repColor }}>{rep}</p>
                  
                  {showProfit && profitValue !== undefined && (
                    <p className="text-sm" style={{ color: repColor }}>
                      Profit: {formatCurrency(profitValue)}
                    </p>
                  )}
                  
                  {showSpend && spendValue !== undefined && (
                    <p className="text-sm" style={{ color: repColor }}>
                      Spend: {formatCurrency(spendValue)}
                    </p>
                  )}
                  
                  {showPacks && packsValue !== undefined && (
                    <p className="text-sm" style={{ color: repColor }}>
                      Packs: {Math.round(packsValue).toLocaleString()}
                    </p>
                  )}

                  {showMargin && marginValue !== undefined && (
                    <p className="text-sm" style={{ color: repColor }}>
                      Margin: {formatPercent(marginValue)}
                    </p>
                  )}
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

  // Clear all selected reps
  const clearSelectedReps = () => {
    setSelectedReps([]);
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
    ...(showPacks ? ['packs'] : []),
    ...(showMargin ? ['margin'] : [])
  ];
  
  // Determine which axes to show based on selected metrics
  const showLeftAxis = showProfit || showSpend || selectedReps.length > 0;
  const showRightAxis = showPacks || selectedReps.length > 0;
  const showMarginAxis = showMargin || selectedReps.some((_, i) => showMargin && enhancedChartData.some(item => item[`margin-rep-${i}`] !== undefined));
  
  return (
    <Card className="bg-gray-900/40 border border-white/10 backdrop-blur-sm shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-white/90 flex justify-between">
          <span>Monthly Performance Trends</span>
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
          <ToggleGroupItem value="margin" aria-label="Toggle Margin" className="data-[state=on]:bg-yellow-300/20 data-[state=on]:text-yellow-300 border-gray-700">
            <div className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-full bg-yellow-300"></span>
              <span className="text-xs">Margin</span>
            </div>
          </ToggleGroupItem>
        </ToggleGroup>
        
        {/* Rep comparison section with improved styling */}
        <div className="mt-3">
          <div 
            className="flex items-center justify-between text-sm cursor-pointer mb-1"
            onClick={() => setShowRepComparison(!showRepComparison)}
          >
            <span className="font-medium flex items-center bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Compare Reps
              {showRepComparison ? 
                <ChevronUp className="ml-1 h-4 w-4 text-blue-400" /> : 
                <ChevronDown className="ml-1 h-4 w-4 text-blue-400" />
              }
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

          {showRepComparison && (
            <div className="mt-2 mb-3">
              <Separator className="mb-3 bg-gray-700/50" />
              <RepSelector
                availableReps={availableReps}
                selectedReps={selectedReps}
                onSelectRep={handleRepSelect}
                onClearSelection={clearSelectedReps}
                maxSelections={3}
              />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={enhancedChartData}
              margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="month" 
                tick={{ fill: 'rgba(255,255,255,0.6)' }}
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
                  tickFormatter={(value) => value > 1000 ? `${(value / 1000)}k` : `${value}`}
                />
              )}
              {showMarginAxis && (
                <YAxis 
                  yAxisId="margin"
                  orientation="right"
                  tick={{ fill: 'rgba(255,255,255,0.6)' }}
                  tickFormatter={(value) => `${value.toFixed(1)}%`}
                  domain={marginDomain}
                  hide={false}
                  width={45}
                />
              )}
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {/* Overall metrics lines - only display when no reps are selected */}
              {selectedReps.length === 0 && showProfit && (
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="profit" 
                  name="Profit" 
                  stroke={CHART_COLORS.profit}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              )}
              {selectedReps.length === 0 && showSpend && (
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="spend" 
                  name="Spend" 
                  stroke={CHART_COLORS.spend}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              )}
              {selectedReps.length === 0 && showPacks && (
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="packs" 
                  name="Packs" 
                  stroke={CHART_COLORS.packs}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              )}
              {selectedReps.length === 0 && showMargin && (
                <Line 
                  yAxisId="margin"
                  type="monotone" 
                  dataKey="margin" 
                  name="Margin %" 
                  stroke={CHART_COLORS.margin}
                  strokeWidth={2}
                  dot={{ r: 4, fill: CHART_COLORS.margin }}
                  activeDot={{ r: 6 }}
                />
              )}
              
              {/* Rep-specific metric lines */}
              {selectedReps.map((rep, repIndex) => {
                const color = CHART_COLORS[`rep${repIndex + 1}` as keyof typeof CHART_COLORS];
                
                return (
                  <React.Fragment key={rep}>
                    {showProfit && (
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey={`profit-rep-${repIndex}`}
                        name={`${rep} - Profit`}
                        stroke={color}
                        strokeWidth={1.5}
                        strokeDasharray="5 5"
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    )}
                    
                    {showSpend && (
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey={`spend-rep-${repIndex}`}
                        name={`${rep} - Spend`}
                        stroke={color}
                        strokeWidth={1.5}
                        strokeDasharray="3 3"
                        dot={{ r: 3, strokeDasharray: '' }}
                        activeDot={{ r: 5 }}
                      />
                    )}
                    
                    {showPacks && (
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey={`packs-rep-${repIndex}`}
                        name={`${rep} - Packs`}
                        stroke={color}
                        strokeWidth={1.5}
                        strokeDasharray="1 1"
                        dot={{ r: 3, strokeDasharray: '' }}
                        activeDot={{ r: 5 }}
                      />
                    )}
                    
                    {showMargin && (
                      <Line
                        yAxisId="margin"
                        type="monotone"
                        dataKey={`margin-rep-${repIndex}`}
                        name={`${rep} - Margin %`}
                        stroke={color}
                        strokeWidth={1.5}
                        strokeDasharray="2 2"
                        dot={{ r: 3, strokeDasharray: '', fill: CHART_COLORS.margin, stroke: color }}
                        activeDot={{ r: 5 }}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrendLineChart;
