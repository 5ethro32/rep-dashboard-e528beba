
import React, { useState } from 'react';
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

  const getMetricValue = (summary: SummaryData, metric: MetricType): number => {
    switch(metric) {
      case 'profit':
        return summary.totalProfit;
      case 'spend':
        return summary.totalSpend;
      case 'margin':
        return summary.averageMargin;
      case 'packs':
        return summary.totalPacks;
      default:
        return 0;
    }
  };

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

  const chartData = [
    {
      name: 'February',
      value: getMetricValue(febSummary, selectedMetric),
      color: getColorForMetric(selectedMetric)
    },
    {
      name: 'March',
      value: getMetricValue(marchSummary, selectedMetric),
      color: getColorForMetric(selectedMetric)
    },
    {
      name: 'April',
      value: getMetricValue(aprilSummary, selectedMetric),
      color: getColorForMetric(selectedMetric)
    }
  ];

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
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={colorForChart}
                  strokeWidth={3}
                  dot={{ fill: colorForChart, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: colorForChart }}
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
