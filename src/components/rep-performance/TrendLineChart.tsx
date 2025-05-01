
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
import { ChartLine, BarChart3, Users, Filter } from "lucide-react";
import RepSelector from './RepSelector';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Toggle } from "@/components/ui/toggle";

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
  includeRetail: boolean;
  includeReva: boolean;
  includeWholesale: boolean;
  compareRepsEnabled?: boolean;
  selectedReps?: string[];
}

type MetricType = 'profit' | 'spend' | 'margin' | 'packs';
type DataSourceType = 'overall' | 'retail' | 'reva' | 'wholesale';

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
  includeRetail,
  includeReva,
  includeWholesale,
  compareRepsEnabled = false,
  selectedReps = []
}) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('profit');
  const [selectedDataSource, setSelectedDataSource] = useState<DataSourceType>('overall');
  const [chartData, setChartData] = useState<Array<{name: string; value: number; color: string}>>([]);
  const [yAxisDomain, setYAxisDomain] = useState<[number, number]>([0, 'auto' as any]);
  const [compareRepsMode, setCompareRepsMode] = useState<boolean>(false);
  const [localSelectedReps, setLocalSelectedReps] = useState<string[]>([]);
  const [repChartData, setRepChartData] = useState<any[]>([]);
  const [showRepSelector, setShowRepSelector] = useState<boolean>(false);
  
  // Effect to sync props with local state
  useEffect(() => {
    setCompareRepsMode(compareRepsEnabled);
    setLocalSelectedReps(selectedReps);
  }, [compareRepsEnabled, selectedReps]);
  
  // Show rep selector when in compare mode
  useEffect(() => {
    setShowRepSelector(compareRepsMode);
  }, [compareRepsMode]);
  
  // Get available reps from data based on selected data source
  const getAvailableRepsForDataSource = (): string[] => {
    if (!repData) return [];
    
    let reps: Set<string> = new Set();
    
    // Logic for filtering reps based on selected data source and inclusion toggles
    const shouldProcessRetail = (selectedDataSource === 'overall' || selectedDataSource === 'retail') && includeRetail;
    const shouldProcessReva = (selectedDataSource === 'overall' || selectedDataSource === 'reva') && includeReva;
    const shouldProcessWholesale = (selectedDataSource === 'overall' || selectedDataSource === 'wholesale') && includeWholesale;
    
    if (shouldProcessRetail) {
      repData.february.forEach(r => reps.add(r.rep));
      repData.march.forEach(r => reps.add(r.rep));
      repData.april.forEach(r => reps.add(r.rep));
    }
    
    if (shouldProcessReva) {
      repData.february.forEach(r => {
        if (r.rep !== 'REVA' && !r.rep.includes('WHOLESALE')) {
          reps.add(r.rep);
        }
      });
      repData.march.forEach(r => {
        if (r.rep !== 'REVA' && !r.rep.includes('WHOLESALE')) {
          reps.add(r.rep);
        }
      });
      repData.april.forEach(r => {
        if (r.rep !== 'REVA' && !r.rep.includes('WHOLESALE')) {
          reps.add(r.rep);
        }
      });
    }
    
    if (shouldProcessWholesale) {
      repData.february.forEach(r => {
        if (r.rep !== 'Wholesale' && r.rep !== 'WHOLESALE') {
          reps.add(r.rep);
        }
      });
      repData.march.forEach(r => {
        if (r.rep !== 'Wholesale' && r.rep !== 'WHOLESALE') {
          reps.add(r.rep);
        }
      });
      repData.april.forEach(r => {
        if (r.rep !== 'Wholesale' && r.rep !== 'WHOLESALE') {
          reps.add(r.rep);
        }
      });
    }
    
    // Filter out special department names
    const result = Array.from(reps).filter(rep => 
      rep !== 'REVA' && 
      rep !== 'Wholesale' && 
      rep !== 'WHOLESALE'
    );
    
    console.log(`Available reps for data source ${selectedDataSource}:`, result);
    return result;
  };

  const availableReps = getAvailableRepsForDataSource();

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

  // Helper function to get summary data for a specific data source
  const getDataSourceSummary = (dataSource: DataSourceType, febData: SummaryData, marchData: SummaryData, aprilData: SummaryData) => {
    // Early return if data source is overall
    if (dataSource === 'overall') {
      return { febData, marchData, aprilData };
    }
    
    // Create empty summary objects for each data source
    const emptyFebSummary: SummaryData = {
      totalSpend: 0,
      totalProfit: 0,
      totalPacks: 0,
      totalAccounts: 0,
      activeAccounts: 0,
      averageMargin: 0
    };
    
    const emptyMarchSummary = { ...emptyFebSummary };
    const emptyAprilSummary = { ...emptyFebSummary };
    
    // Return department-specific data based on selection
    switch(dataSource) {
      case 'retail':
        // For retail, only return data if includeRetail is true
        if (!includeRetail) return { febData: emptyFebSummary, marchData: emptyMarchSummary, aprilData: emptyAprilSummary };
        
        return {
          febData: {
            totalSpend: febData.totalSpend,
            totalProfit: febData.totalProfit,
            totalPacks: febData.totalPacks,
            totalAccounts: febData.totalAccounts,
            activeAccounts: febData.activeAccounts,
            averageMargin: febData.averageMargin
          },
          marchData: {
            totalSpend: marchData.totalSpend,
            totalProfit: marchData.totalProfit,
            totalPacks: marchData.totalPacks,
            totalAccounts: marchData.totalAccounts,
            activeAccounts: marchData.activeAccounts,
            averageMargin: marchData.averageMargin
          },
          aprilData: {
            totalSpend: aprilData.totalSpend,
            totalProfit: aprilData.totalProfit,
            totalPacks: aprilData.totalPacks,
            totalAccounts: aprilData.totalAccounts,
            activeAccounts: aprilData.activeAccounts,
            averageMargin: aprilData.averageMargin
          }
        };
      case 'reva':
        // For REVA, only return data if includeReva is true
        if (!includeReva) return { febData: emptyFebSummary, marchData: emptyMarchSummary, aprilData: emptyAprilSummary };
        
        return {
          febData: {
            totalSpend: febSummary.totalProfit,
            totalProfit: febSummary.totalProfit,
            totalPacks: febSummary.totalPacks,
            totalAccounts: febSummary.totalAccounts,
            activeAccounts: febSummary.activeAccounts,
            averageMargin: febSummary.averageMargin
          },
          marchData: {
            totalSpend: marchSummary.totalSpend,
            totalProfit: marchSummary.totalProfit,
            totalPacks: marchSummary.totalPacks,
            totalAccounts: marchSummary.totalAccounts,
            activeAccounts: marchSummary.activeAccounts,
            averageMargin: marchSummary.averageMargin
          },
          aprilData: {
            totalSpend: aprilSummary.totalSpend,
            totalProfit: aprilSummary.totalProfit,
            totalPacks: aprilSummary.totalPacks,
            totalAccounts: aprilSummary.totalAccounts,
            activeAccounts: aprilSummary.activeAccounts,
            averageMargin: aprilSummary.averageMargin
          }
        };
      case 'wholesale':
        // For Wholesale, only return data if includeWholesale is true
        if (!includeWholesale) return { febData: emptyFebSummary, marchData: emptyMarchSummary, aprilData: emptyAprilSummary };
        
        return {
          febData: {
            totalSpend: febSummary.totalSpend,
            totalProfit: febSummary.totalProfit,
            totalPacks: febSummary.totalPacks,
            totalAccounts: febSummary.totalAccounts,
            activeAccounts: febSummary.activeAccounts,
            averageMargin: febSummary.averageMargin
          },
          marchData: {
            totalSpend: marchSummary.totalSpend,
            totalProfit: marchSummary.totalProfit,
            totalPacks: marchSummary.totalPacks,
            totalAccounts: marchSummary.totalAccounts,
            activeAccounts: marchSummary.activeAccounts,
            averageMargin: marchSummary.averageMargin
          },
          aprilData: {
            totalSpend: aprilSummary.totalSpend,
            totalProfit: aprilSummary.totalProfit,
            totalPacks: aprilSummary.totalPacks,
            totalAccounts: aprilSummary.totalAccounts,
            activeAccounts: aprilSummary.activeAccounts,
            averageMargin: aprilSummary.averageMargin
          }
        };
      default:
        return { febData, marchData, aprilData };
    }
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
  
  // Function to get filtered rep data based on data source
  const getFilteredRepData = (monthData: RepData[], dataSource: DataSourceType): RepData[] => {
    // Use department-specific filtering only if not in 'overall' mode
    if (dataSource === 'overall') {
      return monthData;
    }
    
    // Filter for specific department data
    return monthData.filter(r => {
      if (dataSource === 'reva' && includeReva) {
        // Include rep if it's REVA data
        return r.rep === 'REVA' || r.rep.includes('REVA');
      } else if (dataSource === 'wholesale' && includeWholesale) {
        // Include rep if it's Wholesale data
        return r.rep === 'Wholesale' || r.rep === 'WHOLESALE' || r.rep.includes('Wholesale') || r.rep.includes('WHOLESALE');
      } else if (dataSource === 'retail' && includeRetail) {
        // Include rep if it's retail data (and not REVA or Wholesale)
        return r.rep !== 'REVA' && 
               r.rep !== 'Wholesale' && 
               r.rep !== 'WHOLESALE' && 
               !r.rep.includes('REVA') && 
               !r.rep.includes('Wholesale') && 
               !r.rep.includes('WHOLESALE');
      }
      return false;
    });
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

  // Function to get title for data source
  const getDataSourceTitle = (dataSource: DataSourceType): string => {
    switch(dataSource) {
      case 'retail':
        return 'Retail';
      case 'reva':
        return 'REVA';
      case 'wholesale':
        return 'Wholesale';
      case 'overall':
      default:
        return 'Overall';
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
    
    // Get summary data filtered by the selected data source
    const { febData, marchData, aprilData } = getDataSourceSummary(
      selectedDataSource,
      febSummary,
      marchSummary,
      aprilSummary
    );
    
    const febValue = getMetricValue(febData, selectedMetric);
    const marchValue = getMetricValue(marchData, selectedMetric);
    const aprilValue = getMetricValue(aprilData, selectedMetric);
    
    console.log(`Generating chart data for ${selectedDataSource} ${selectedMetric}:`);
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
  }, [selectedMetric, selectedDataSource, febSummary, marchSummary, aprilSummary, isLoading, includeRetail, includeReva, includeWholesale]);

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
    
    // Filter the rep data based on the selected data source
    const filteredFebData = getFilteredRepData(repData.february, selectedDataSource);
    const filteredMarData = getFilteredRepData(repData.march, selectedDataSource);
    const filteredAprData = getFilteredRepData(repData.april, selectedDataSource);
    
    console.log("Filtered rep data counts:", {
      february: filteredFebData.length,
      march: filteredMarData.length,
      april: filteredAprData.length
    });
    
    // Add each selected rep's data for each month
    localSelectedReps.forEach(rep => {
      // Get values for this rep across all months
      const febValue = getRepMetricValue(filteredFebData, rep, selectedMetric);
      const marValue = getRepMetricValue(filteredMarData, rep, selectedMetric);
      const aprValue = getRepMetricValue(filteredAprData, rep, selectedMetric);
      
      console.log(`Rep ${rep} values for ${selectedDataSource}:`, { 
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
    
  }, [localSelectedReps, selectedMetric, selectedDataSource, repData, isLoading, compareRepsMode, includeRetail, includeReva, includeWholesale]);

  // Handle data source button clicks
  const handleDataSourceChange = (dataSource: DataSourceType) => {
    // Only change if data source is different
    if (dataSource !== selectedDataSource) {
      console.log(`Changing data source from ${selectedDataSource} to ${dataSource}`);
      setSelectedDataSource(dataSource);
    }
  };
  
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

  const dataSourceButtons: { label: string; value: DataSourceType }[] = [
    { label: 'Overall', value: 'overall' },
    { label: 'Retail', value: 'retail' },
    { label: 'REVA', value: 'reva' },
    { label: 'Wholesale', value: 'wholesale' }
  ];

  // Filtering for disabled data sources based on inclusion toggles
  const isDataSourceDisabled = (dataSource: DataSourceType): boolean => {
    if (dataSource === 'retail') return !includeRetail;
    if (dataSource === 'reva') return !includeReva;
    if (dataSource === 'wholesale') return !includeWholesale;
    return false;
  };

  const colorForChart = getColorForMetric(selectedMetric);

  return (
    <Card className="bg-gradient-to-b from-slate-950 to-slate-900 shadow-md border-slate-800">
      <CardHeader className="pb-2">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <CardTitle className="text-lg text-white flex items-center">
            <ChartLine className="w-5 h-5 mr-2" /> 
            {compareRepsMode && localSelectedReps.length > 0 
              ? `Rep Comparison: ${getMetricTitle(selectedMetric)}` 
              : `3-Month Trend: ${getDataSourceTitle(selectedDataSource)} ${getMetricTitle(selectedMetric)}`}
          </CardTitle>
        </div>
          
        <div className="flex flex-col space-y-3 mt-2">
          {/* Metric selection */}
          <div className="flex flex-wrap gap-2">
            <ToggleGroup type="single" value={selectedMetric} onValueChange={(val) => val && setSelectedMetric(val as MetricType)}>
              {metricButtons.map((button) => (
                <ToggleGroupItem 
                  key={button.value} 
                  value={button.value}
                  variant="outline"
                  size="sm"
                  className={`text-xs ${selectedMetric === button.value ? "bg-white/20 text-white" : "text-white/70"}`}
                >
                  {button.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          
          {/* Data source and rep comparison controls */}
          <div className="flex flex-wrap justify-between items-center gap-2">
            {/* Data source selection */}
            <div className="flex flex-wrap gap-2">
              <ToggleGroup type="single" value={selectedDataSource} onValueChange={(val) => val && handleDataSourceChange(val as DataSourceType)}>
                {dataSourceButtons.map((button) => (
                  <ToggleGroupItem 
                    key={button.value} 
                    value={button.value}
                    variant="outline"
                    size="sm"
                    disabled={isDataSourceDisabled(button.value)}
                    className={`text-xs ${selectedDataSource === button.value ? "bg-white/20 text-white" : "text-white/70"} ${
                      isDataSourceDisabled(button.value) ? "opacity-30 cursor-not-allowed" : ""
                    }`}
                  >
                    {button.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
            
            {/* Compare reps toggle */}
            <div className="flex items-center gap-2">
              <Toggle
                pressed={compareRepsMode}
                onPressedChange={setCompareRepsMode}
                size="sm"
                variant="outline"
                className={`${compareRepsMode ? "bg-white/20 text-white" : "text-white/70"}`}
              >
                <Users className="h-4 w-4 mr-1" />
                Compare Reps
              </Toggle>
            </div>
          </div>
          
          {/* Rep selector */}
          {compareRepsMode && showRepSelector && (
            <div className="mt-1">
              <RepSelector 
                availableReps={availableReps}
                selectedReps={localSelectedReps}
                onSelectRep={handleRepSelection}
                onClearSelection={clearRepSelection}
                maxSelections={5}
              />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-[200px] w-full">
          {isLoading ? (
            <div className="h-full w-full flex items-center justify-center">
              <div className="animate-pulse text-white/50">Loading chart data...</div>
            </div>
          ) : compareRepsMode && localSelectedReps.length > 0 ? (
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
                {localSelectedReps.map((rep, index) => (
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
