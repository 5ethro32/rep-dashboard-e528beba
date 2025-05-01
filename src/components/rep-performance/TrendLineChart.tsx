
import React, { useState, useEffect } from 'react';
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { SummaryData, RepData } from "@/types/rep-performance.types";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatPercent, formatNumber } from "@/utils/rep-performance-utils";
import { ChartLine, BarChart3, Users } from "lucide-react";
import RepSelector from './RepSelector';

interface TrendLineChartProps {
  febSummary: SummaryData;
  marchSummary: SummaryData;
  aprilSummary: SummaryData;
  isLoading: boolean;
  repData?: {
    february: RepData[];
    march: RepData[];
    april: RepData[];
  };
  compareRepsEnabled?: boolean;
  selectedReps?: string[];
}

type MetricType = 'profit' | 'spend' | 'margin' | 'packs';

interface RepDataPoint {
  repName: string;
  february: number;
  march: number;
  april: number;
  color: string;
}

const COLORS = [
  '#22c55e', // Green
  '#3b82f6', // Blue
  '#f59e0b', // Amber
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f43f5e', // Rose
  '#14b8a6', // Teal
  '#d946ef', // Fuchsia
  '#64748b', // Slate
];

const TrendLineChart: React.FC<TrendLineChartProps> = ({
  febSummary,
  marchSummary,
  aprilSummary,
  isLoading,
  repData,
  compareRepsEnabled = false,
  selectedReps = []
}) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('profit');
  const [chartData, setChartData] = useState<Array<{name: string; value: number; color: string}>>([]);
  const [yAxisDomain, setYAxisDomain] = useState<[number, number]>([0, 'auto' as any]);
  const [compareRepsMode, setCompareRepsMode] = useState<boolean>(false);
  const [localSelectedReps, setLocalSelectedReps] = useState<string[]>([]);
  const [repChartData, setRepChartData] = useState<any[]>([]);
  
  // Effect to sync props with local state
  useEffect(() => {
    setCompareRepsMode(compareRepsEnabled);
    setLocalSelectedReps(selectedReps);
  }, [compareRepsEnabled, selectedReps]);
  
  // Get available reps from data
  const availableReps = repData ? 
    Array.from(new Set([
      ...repData.february.map(r => r.rep),
      ...repData.march.map(r => r.rep),
      ...repData.april.map(r => r.rep)
    ])).filter(rep => rep !== 'REVA' && rep !== 'Wholesale') : 
    [];

  // Handle rep selection
  const handleRepSelection = (rep: string) => {
    setLocalSelectedReps(prev => {
      if (prev.includes(rep)) {
        return prev.filter(r => r !== rep);
      } else {
        if (prev.length >= 5) return prev; // Max 5 reps
        return [...prev, rep];
      }
    });
  };

  // Clear rep selection
  const clearRepSelection = () => {
    setLocalSelectedReps([]);
  };

  // Function to get metric value from summary data
  const getMetricValue = (summary: SummaryData, metric: MetricType): number => {
    if (!summary) return 0;
    
    switch(metric) {
      case 'profit':
        return Number(summary.totalProfit) || 0;
      case 'spend':
        return Number(summary.totalSpend) || 0;
      case 'margin':
        return Number(summary.averageMargin) || 0;
      case 'packs':
        return Number(summary.totalPacks) || 0;
      default:
        return 0;
    }
  };
  
  // Function to extract rep data based on metric
  const getRepMetricValue = (repsList: RepData[], rep: string, metric: MetricType): number => {
    const foundRep = repsList.find(r => r.rep === rep);
    if (!foundRep) return 0;
    
    switch(metric) {
      case 'profit':
        return Number(foundRep.profit) || 0;
      case 'spend':
        return Number(foundRep.spend) || 0;
      case 'margin':
        return Number(foundRep.margin) || 0;
      case 'packs':
        return Number(foundRep.packs) || 0;
      default:
        return 0;
    }
  };

  // Function to get formatter based on metric type
  const getMetricFormatter = (metric: MetricType) => {
    switch(metric) {
      case 'profit':
      case 'spend':
        return (value: number) => formatCurrency(value);
      case 'margin':
        return (value: number) => formatPercent(value);
      case 'packs':
        return (value: number) => formatNumber(value);
      default:
        return (value: number) => `${value}`;
    }
  };

  // Function to get display title for metric
  const getMetricTitle = (metric: MetricType): string => {
    switch(metric) {
      case 'profit':
        return 'Profit';
      case 'spend':
        return 'Revenue';
      case 'margin':
        return 'Margin';
      case 'packs':
        return 'Packs';
      default:
        return '';
    }
  };

  // Function to get color for metric
  const getColorForMetric = (metric: MetricType): string => {
    switch(metric) {
      case 'profit':
        return '#22c55e';
      case 'spend':
        return '#3b82f6';
      case 'margin':
        return '#f59e0b';
      case 'packs':
        return '#8b5cf6';
      default:
        return '#64748b';
    }
  };

  // Prepare overall chart data (all reps combined)
  useEffect(() => {
    if (isLoading) return;
    
    const febValue = getMetricValue(febSummary, selectedMetric);
    const marchValue = getMetricValue(marchSummary, selectedMetric);
    const aprilValue = getMetricValue(aprilSummary, selectedMetric);
    
    console.log("Generating chart data for:", selectedMetric);
    console.log("February value:", febValue);
    console.log("March value:", marchValue);
    console.log("April value:", aprilValue);
    
    const metricColor = getColorForMetric(selectedMetric);
    
    const data = [
      {
        name: 'February',
        value: febValue,
        color: metricColor
      },
      {
        name: 'March',
        value: marchValue,
        color: metricColor
      },
      {
        name: 'April',
        value: aprilValue,
        color: metricColor
      }
    ];
    
    setChartData(data);
    
    // Calculate appropriate Y-axis domain with improved logic
    if (data.length > 0) {
      const values = data.map(item => item.value).filter(val => !isNaN(val) && val !== null && val !== undefined);
      
      if (values.length > 0) {
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);
        
        const range = maxValue - minValue;
        
        // For very small ranges, create a more visible difference
        if (range < maxValue * 0.01) {
          // If the range is less than 1% of the max value
          const padding = maxValue * 0.05; // 5% padding
          const calculatedMin = Math.max(0, minValue - padding);
          const calculatedMax = maxValue + padding;
          
          setYAxisDomain([calculatedMin, calculatedMax]);
        } else {
          // Normal range calculation with 10% padding
          const padding = range * 0.1;
          const calculatedMin = Math.max(0, minValue - padding);
          const calculatedMax = maxValue + padding;
          
          setYAxisDomain([calculatedMin, calculatedMax]);
        }
      }
    }
  }, [selectedMetric, febSummary, marchSummary, aprilSummary, isLoading]);

  // Prepare rep-specific chart data
  useEffect(() => {
    if (isLoading || !repData || !compareRepsMode || localSelectedReps.length === 0) return;

    // Log rep data sources for debugging
    console.log("Rep data sources for chart:", {
      february: repData.february.length,
      march: repData.march.length,
      april: repData.april.length
    });
    
    // Format the data for the chart - one data point per month
    const formattedData = [
      { name: "February" },
      { name: "March" },
      { name: "April" }
    ];
    
    // Add each selected rep's data for each month
    localSelectedReps.forEach(rep => {
      // Get values for this rep across all months
      const febValue = getRepMetricValue(repData.february, rep, selectedMetric);
      const marValue = getRepMetricValue(repData.march, rep, selectedMetric);
      const aprValue = getRepMetricValue(repData.april, rep, selectedMetric);
      
      console.log(`Rep ${rep} values:`, { 
        february: febValue, 
        march: marValue, 
        april: aprValue 
      });
      
      // Add to the formatted data
      formattedData[0][rep] = febValue;
      formattedData[1][rep] = marValue;
      formattedData[2][rep] = aprValue;
    });
    
    console.log("Rep comparison formatted data:", formattedData);
    setRepChartData(formattedData);
    
    // Calculate Y-axis domain for rep comparison
    const allValues = formattedData.flatMap(point => {
      return localSelectedReps.map(rep => point[rep] || 0);
    }).filter(v => !isNaN(v) && v !== null && v !== undefined);
    
    if (allValues.length > 0) {
      const minValue = Math.min(...allValues);
      const maxValue = Math.max(...allValues);
      const range = maxValue - minValue;
      
      // Adjust domain with padding
      const padding = range * 0.1;
      const calculatedMin = Math.max(0, minValue - padding);
      const calculatedMax = maxValue + padding;
      
      setYAxisDomain([calculatedMin, calculatedMax]);
    }
    
  }, [localSelectedReps, selectedMetric, repData, isLoading, compareRepsMode]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const formatter = getMetricFormatter(selectedMetric);
      
      if (!compareRepsMode || localSelectedReps.length === 0) {
        // Single line tooltip
        return (
          <div className="bg-background/90 border border-border p-2 rounded-md shadow-sm">
            <p className="text-xs font-medium">{label}</p>
            <p className="text-sm font-semibold text-foreground">
              {formatter(payload[0].value)}
            </p>
          </div>
        );
      } else {
        // Multi-line tooltip for rep comparison
        return (
          <div className="bg-background/90 border border-border p-2 rounded-md shadow-sm min-w-[150px]">
            <p className="text-xs font-medium border-b pb-1 mb-1">{label}</p>
            {payload.map((entry: any, index: number) => {
              if (entry.dataKey === 'value') return null; // Skip the overall line if showing rep comparison
              return (
                <div key={`rep-${index}`} className="flex justify-between items-center py-0.5">
                  <span className="text-xs" style={{ color: entry.color }}>
                    {entry.dataKey}:
                  </span>
                  <span className="text-xs font-medium">
                    {formatter(entry.value)}
                  </span>
                </div>
              );
            })}
          </div>
        );
      }
    }
    return null;
  };

  const metricButtons: { label: string; value: MetricType }[] = [
    { label: 'Profit', value: 'profit' },
    { label: 'Revenue', value: 'spend' },
    { label: 'Margin', value: 'margin' },
    { label: 'Packs', value: 'packs' }
  ];

  const colorForChart = getColorForMetric(selectedMetric);

  return (
    <Card className="bg-gradient-to-b from-slate-950 to-slate-900 shadow-md border-slate-800">
      <CardHeader className="pb-2">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <CardTitle className="text-lg text-white flex items-center">
            <ChartLine className="w-5 h-5 mr-2" /> 
            {compareRepsMode && localSelectedReps.length > 0 
              ? `Rep Comparison: ${getMetricTitle(selectedMetric)}` 
              : `3-Month Trend: ${getMetricTitle(selectedMetric)}`}
          </CardTitle>
          
          <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
            <div className="flex space-x-2">
              {metricButtons.map((button) => (
                <Button
                  key={button.value}
                  size="sm"
                  variant={selectedMetric === button.value ? "default" : "ghost"}
                  className={`text-xs px-3 ${selectedMetric === button.value ? "bg-white/20 text-white" : "text-white/70"}`}
                  onClick={() => setSelectedMetric(button.value)}
                >
                  {button.label}
                </Button>
              ))}
            </div>
            
            {repData && !compareRepsEnabled && (
              <Button 
                size="sm" 
                variant={compareRepsMode ? "default" : "ghost"}
                className={`text-xs px-3 ${compareRepsMode ? "bg-white/20 text-white" : "text-white/70"}`}
                onClick={() => setCompareRepsMode(!compareRepsMode)}
              >
                <Users className="h-4 w-4 mr-1" />
                Compare Reps
              </Button>
            )}
          </div>
        </div>
        
        {compareRepsMode && repData && !compareRepsEnabled && (
          <div className="mt-2">
            <RepSelector 
              availableReps={availableReps}
              selectedReps={localSelectedReps}
              onSelectRep={handleRepSelection}
              onClearSelection={clearRepSelection}
              maxSelections={5}
            />
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-[200px] w-full">
          {isLoading ? (
            <div className="h-full w-full flex items-center justify-center">
              <div className="animate-pulse text-white/50">Loading chart data...</div>
            </div>
          ) : (compareRepsMode && localSelectedReps.length > 0) || (compareRepsEnabled && selectedReps.length > 0) ? (
            // Rep comparison chart
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={repChartData}
                margin={{
                  top: 10,
                  right: 30,
                  left: 0,
                  bottom: 10,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="name" 
                  stroke="rgba(255,255,255,0.5)"
                  tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.5)"
                  tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                  tickFormatter={getMetricFormatter(selectedMetric)}
                  domain={yAxisDomain}
                  allowDataOverflow={false}
                  padding={{ top: 10, bottom: 0 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle" 
                  iconSize={8}
                  wrapperStyle={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)' }}
                />
                {(compareRepsEnabled ? selectedReps : localSelectedReps).map((rep, index) => (
                  <Line
                    key={rep}
                    type="monotone"
                    dataKey={rep}
                    name={rep}
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={2}
                    dot={{ fill: COLORS[index % COLORS.length], strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: COLORS[index % COLORS.length] }}
                    isAnimationActive={true}
                    animationDuration={1000}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            // Default overall chart
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{
                  top: 10,
                  right: 30,
                  left: 0,
                  bottom: 10,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="name" 
                  stroke="rgba(255,255,255,0.5)"
                  tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.5)"
                  tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                  tickFormatter={getMetricFormatter(selectedMetric)}
                  domain={yAxisDomain}
                  allowDataOverflow={false}
                  padding={{ top: 10, bottom: 0 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={colorForChart}
                  strokeWidth={3}
                  dot={{ fill: colorForChart, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: colorForChart }}
                  isAnimationActive={true}
                  animationDuration={1000}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TrendLineChart;
