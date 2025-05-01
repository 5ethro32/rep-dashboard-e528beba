
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
import { SummaryData } from "@/types/rep-performance.types";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatPercent, formatNumber } from "@/utils/rep-performance-utils";
import { ChartLine } from "lucide-react";

interface TrendLineChartProps {
  febSummary: SummaryData;
  marchSummary: SummaryData;
  aprilSummary: SummaryData;
  includeRetail: boolean;
  includeReva: boolean;
  includeWholesale: boolean;
  isLoading: boolean;
}

type MetricType = 'profit' | 'spend' | 'margin' | 'packs';

const TrendLineChart: React.FC<TrendLineChartProps> = ({
  febSummary,
  marchSummary,
  aprilSummary,
  includeRetail,
  includeReva,
  includeWholesale,
  isLoading
}) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('profit');
  const [chartData, setChartData] = useState<Array<{name: string; value: number; color: string}>>([]);
  const [yAxisDomain, setYAxisDomain] = useState<[number, number]>([0, 'auto' as any]);

  // Function to get metric value from summary data
  const getMetricValue = (summary: SummaryData, metric: MetricType): number => {
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

  // Prepare chart data whenever dependencies change
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
    
    // Calculate appropriate Y-axis domain
    if (data.length > 0) {
      const values = data.map(item => item.value).filter(val => !isNaN(val) && val !== null && val !== undefined);
      
      if (values.length > 0) {
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);
        
        if (minValue === maxValue) {
          // If all values are the same, create a range around that value
          const valueOffset = Math.max(maxValue * 0.05, 10);
          const calculatedMin = Math.max(0, minValue - valueOffset);
          const calculatedMax = maxValue + valueOffset;
          
          setYAxisDomain([calculatedMin, calculatedMax]);
          console.log("Y-axis domain for identical values:", [calculatedMin, calculatedMax]);
        } else {
          const range = maxValue - minValue;
          
          // Make the Y-axis show more variation by zooming in on the data
          // Use at most 80% of the lowest value as the minimum
          const calculatedMin = Math.max(0, minValue - (range * 0.1));
          
          // Set max to be slightly higher than the maximum value
          const calculatedMax = maxValue + (range * 0.1);
          
          setYAxisDomain([calculatedMin, calculatedMax]);
          console.log("Calculated Y-axis domain:", [calculatedMin, calculatedMax]);
        }
      }
    }
  }, [selectedMetric, febSummary, marchSummary, aprilSummary, includeRetail, includeReva, includeWholesale, isLoading]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const formatter = getMetricFormatter(selectedMetric);
      return (
        <div className="bg-background/90 border border-border p-2 rounded-md shadow-sm">
          <p className="text-xs font-medium">{label}</p>
          <p className="text-sm font-semibold text-foreground">
            {formatter(payload[0].value)}
          </p>
        </div>
      );
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
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg text-white flex items-center">
            <ChartLine className="w-5 h-5 mr-2" /> 
            3-Month Trend: {getMetricTitle(selectedMetric)}
          </CardTitle>
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
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-[200px] w-full">
          {isLoading ? (
            <div className="h-full w-full flex items-center justify-center">
              <div className="animate-pulse text-white/50">Loading chart data...</div>
            </div>
          ) : (
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
