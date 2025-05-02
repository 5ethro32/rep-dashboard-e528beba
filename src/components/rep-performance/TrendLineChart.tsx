
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

const CHART_COLORS = {
  profit: '#ef4444',
  spend: '#60a5fa',
  packs: '#4ade80',
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
  repData,
  includeRetail,
  includeReva,
  includeWholesale
}) => {
  // State to track which metrics are visible - only profit selected by default
  const [showProfit, setShowProfit] = useState(true);
  const [showSpend, setShowSpend] = useState(false);
  const [showPacks, setShowPacks] = useState(false);
  
  // State for rep comparison
  const [showRepComparison, setShowRepComparison] = useState(false);
  const [selectedReps, setSelectedReps] = useState<string[]>([]);
  const [availableReps, setAvailableReps] = useState<string[]>([]);

  // Generate the list of available reps from all months' data
  React.useEffect(() => {
    const allReps = new Set<string>();
    
    // Collect unique rep names from all months
    ['february', 'march', 'april', 'may'].forEach(month => {
      if (repData[month]) {
        repData[month].forEach(item => {
          if (item.rep) {
            allReps.add(item.rep);
          }
        });
      }
    });
    
    setAvailableReps(Array.from(allReps).sort());
  }, [repData]);

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

  // Generate rep-specific data for the chart
  const repChartData = useMemo(() => {
    if (!selectedReps.length) return [];
    
    const repData = selectedReps.map((rep, index) => {
      // Get rep data for each month
      const febRepData = repData.february.find(r => r.rep === rep);
      const marRepData = repData.march.find(r => r.rep === rep);
      const aprRepData = repData.april.find(r => r.rep === rep);
      const mayRepData = repData.may.find(r => r.rep === rep);
      
      return {
        rep,
        index,
        data: [
          {
            month: 'Feb',
            profit: febRepData?.profit || 0,
            spend: febRepData?.spend || 0,
            packs: febRepData?.packs || 0
          },
          {
            month: 'Mar',
            profit: marRepData?.profit || 0,
            spend: marRepData?.spend || 0,
            packs: marRepData?.packs || 0
          },
          {
            month: 'Apr',
            profit: aprRepData?.profit || 0,
            spend: aprRepData?.spend || 0,
            packs: aprRepData?.packs || 0
          },
          {
            month: 'May',
            profit: mayRepData?.profit || 0,
            spend: mayRepData?.spend || 0,
            packs: mayRepData?.packs || 0
          }
        ]
      };
    });
    
    return repData;
  }, [selectedReps, repData]);

  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const isRepData = payload.some(p => p.dataKey.toString().includes('rep'));
      
      return (
        <div className="bg-gray-800 border border-gray-700 p-3 rounded-md shadow-lg backdrop-blur-sm">
          <p className="font-semibold text-gray-200">{label}</p>
          
          {/* Show overall metrics */}
          {showProfit && payload.find(p => p.dataKey === 'profit') && !isRepData && (
            <p className="text-sm text-finance-red">Profit: {formatCurrency(payload.find(p => p.dataKey === 'profit')?.value || 0)}</p>
          )}
          {showSpend && payload.find(p => p.dataKey === 'spend') && !isRepData && (
            <p className="text-sm text-blue-400">Spend: {formatCurrency(payload.find(p => p.dataKey === 'spend')?.value || 0)}</p>
          )}
          {showPacks && payload.find(p => p.dataKey === 'packs') && !isRepData && (
            <p className="text-sm text-green-400">Packs: {Math.round(payload.find(p => p.dataKey === 'packs')?.value || 0).toLocaleString()}</p>
          )}
          
          {/* Show rep-specific metrics */}
          {selectedReps.map((rep, index) => {
            const repColor = CHART_COLORS[`rep${index + 1}` as keyof typeof CHART_COLORS];
            
            return (
              <div key={rep} className="mt-2 border-t border-gray-700 pt-2">
                <p className="text-sm font-medium" style={{ color: repColor }}>{rep}</p>
                
                {showProfit && payload.find(p => p.dataKey === `profit-rep-${index}`) && (
                  <p className="text-sm" style={{ color: repColor }}>
                    Profit: {formatCurrency(payload.find(p => p.dataKey === `profit-rep-${index}`)?.value || 0)}
                  </p>
                )}
                
                {showSpend && payload.find(p => p.dataKey === `spend-rep-${index}`) && (
                  <p className="text-sm" style={{ color: repColor }}>
                    Spend: {formatCurrency(payload.find(p => p.dataKey === `spend-rep-${index}`)?.value || 0)}
                  </p>
                )}
                
                {showPacks && payload.find(p => p.dataKey === `packs-rep-${index}`) && (
                  <p className="text-sm" style={{ color: repColor }}>
                    Packs: {Math.round(payload.find(p => p.dataKey === `packs-rep-${index}`)?.value || 0).toLocaleString()}
                  </p>
                )}
              </div>
            );
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
    ...(showPacks ? ['packs'] : [])
  ];
  
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
        </ToggleGroup>
        
        {/* Rep comparison section */}
        <div className="mt-2">
          <div 
            className="flex items-center justify-between text-sm text-white/80 cursor-pointer mb-1"
            onClick={() => setShowRepComparison(!showRepComparison)}
          >
            <span className="font-medium flex items-center">
              Compare Reps
              {showRepComparison ? 
                <ChevronUp className="ml-1 h-4 w-4 opacity-70" /> : 
                <ChevronDown className="ml-1 h-4 w-4 opacity-70" />
              }
            </span>
            
            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger asChild>
                  <span className="text-xs text-white/50">
                    {selectedReps.length > 0 ? `${selectedReps.length} rep${selectedReps.length > 1 ? 's' : ''} selected` : 'No reps selected'}
                  </span>
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
              
              {/* Overall metrics lines */}
              {showProfit && (
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
              {showSpend && (
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
              {showPacks && (
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
              
              {/* Rep-specific metric lines */}
              {repChartData.map((repData, repIndex) => {
                const color = CHART_COLORS[`rep${repIndex + 1}` as keyof typeof CHART_COLORS];
                return (
                  <React.Fragment key={repData.rep}>
                    {showProfit && (
                      <Line
                        yAxisId="left"
                        type="monotone"
                        data={repData.data}
                        dataKey="profit"
                        name={`${repData.rep} - Profit`}
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
                        data={repData.data}
                        dataKey="spend"
                        name={`${repData.rep} - Spend`}
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
                        data={repData.data}
                        dataKey="packs"
                        name={`${repData.rep} - Packs`}
                        stroke={color}
                        strokeWidth={1.5}
                        strokeDasharray="1 1"
                        dot={{ r: 3, strokeDasharray: '' }}
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
