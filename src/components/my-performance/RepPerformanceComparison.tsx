import React, { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps } from 'recharts';
import { formatCurrency, formatPercent, formatNumber } from '@/utils/rep-performance-utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Info } from 'lucide-react';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';

// Define chart colors
const CHART_COLORS = {
  profit: '#ef4444', // Finance red
  spend: '#60a5fa',  // Blue
  packs: '#4ade80',  // Green
  margin: '#fef08a',  // Yellow
  average: '#8b5cf6', // Purple for average
  user: '#f97316',    // Orange for current user
};

// Define realistic rep names
const REALISTIC_REP_NAMES = [
  'Craig McDowall',
  'Pete Dhillon',
  'Yvonne Walton',
  'Clare Quinn',
  'REVA'
];

interface RepPerformanceComparisonProps {
  userData: {
    profit: { month: string; value: number }[];
    spend: { month: string; value: number }[];
    packs: { month: string; value: number }[];
    margin: { month: string; value: number }[];
  };
  averageData: {
    profit: { month: string; value: number }[];
    spend: { month: string; value: number }[];
    packs: { month: string; value: number }[];
    margin: { month: string; value: number }[];
  };
  // Optional comparison data from other reps
  comparisonData?: {
    repName: string;
    profit: { month: string; value: number }[];
    spend: { month: string; value: number }[];
    packs: { month: string; value: number }[];
    margin: { month: string; value: number }[];
  }[];
  isLoading: boolean;
  userName: string;
}

const RepPerformanceComparison: React.FC<RepPerformanceComparisonProps> = ({
  userData,
  averageData,
  comparisonData,
  isLoading,
  userName
}) => {
  // State for active metric
  const [activeMetric, setActiveMetric] = useState<'profit' | 'spend' | 'packs' | 'margin'>('profit');
  
  // State for comparison mode
  const [showAverage, setShowAverage] = useState(true);
  const [showComparison, setShowComparison] = useState(false);
  
  // Get selected comparison rep (if any)
  const [selectedComparisonRep, setSelectedComparisonRep] = useState<string | null>(null);
  
  const isMobile = useIsMobile();

  // Get the active data based on selected metric
  const activeUserData = useMemo(() => userData[activeMetric] || [], [userData, activeMetric]);
  const activeAverageData = useMemo(() => averageData[activeMetric] || [], [averageData, activeMetric]);
  
  // Get data for selected comparison rep (if any)
  const activeComparisonData = useMemo(() => {
    if (!selectedComparisonRep || !comparisonData) return null;
    const repData = comparisonData.find(rep => rep.repName === selectedComparisonRep);
    return repData ? repData[activeMetric] : null;
  }, [comparisonData, selectedComparisonRep, activeMetric]);

  // Chart label based on selected metric
  const chartLabel = useMemo(() => {
    switch (activeMetric) {
      case 'profit': return 'Profit';
      case 'spend': return 'Spend';
      case 'packs': return 'Packs';
      case 'margin': return 'Margin %';
    }
  }, [activeMetric]);
  
  // Format data value based on the metric type
  const formatValue = (value: number) => {
    switch (activeMetric) {
      case 'profit':
      case 'spend':
        return formatCurrency(value);
      case 'packs':
        return formatNumber(value);
      case 'margin':
        return formatPercent(value);
      default:
        return value.toString();
    }
  };

  // Custom tooltip component for the chart
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 border border-gray-700 p-3 rounded-md shadow-lg backdrop-blur-sm">
          <p className="font-semibold text-gray-200">{label}</p>
          
          {payload.map((entry, index) => {
            const name = entry.name as string;
            const color = entry.stroke as string;
            
            return (
              <p 
                key={index} 
                className="text-sm flex items-center gap-2 mt-1"
                style={{ color }}
              >
                <span className="w-2 h-2 inline-block rounded-full" style={{ backgroundColor: color }}></span>
                {name}: {formatValue(entry.value as number)}
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  // Render skeleton during loading
  if (isLoading) {
    return (
      <Card className="bg-gray-900/40 backdrop-blur-sm border-white/10 shadow-lg mt-8">
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

  // Create rep selector buttons with realistic rep names
  const renderRepButtons = () => {
    // If we have actual comparison data, use those rep names
    if (showComparison && comparisonData && comparisonData.length > 0) {
      return comparisonData.map((rep) => (
        <Button
          key={rep.repName}
          variant="outline"
          size="sm"
          className={`px-3 py-1 rounded-full text-xs ${
            selectedComparisonRep === rep.repName 
              ? 'bg-white/20 border-white/30' 
              : 'bg-transparent border-white/10'
          }`}
          onClick={() => setSelectedComparisonRep(
            selectedComparisonRep === rep.repName ? null : rep.repName
          )}
        >
          {rep.repName}
        </Button>
      ));
    }
    // Otherwise use our realistic rep names
    return REALISTIC_REP_NAMES.map((repName) => (
      <Button
        key={repName}
        variant="outline"
        size="sm"
        className={`px-3 py-1 rounded-full text-xs ${
          selectedComparisonRep === repName 
            ? 'bg-white/20 border-white/30' 
            : 'bg-transparent border-white/10'
        }`}
        onClick={() => setSelectedComparisonRep(
          selectedComparisonRep === repName ? null : repName
        )}
      >
        {repName}
      </Button>
    ));
  };

  return (
    <Card className="bg-gray-900/40 backdrop-blur-sm border-white/10 shadow-lg mt-8">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium text-white/90">
            Performance Trends - {chartLabel}
          </CardTitle>
          
          <TooltipProvider>
            <UITooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help">
                  <Info className="h-4 w-4 text-gray-400" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-sm">
                  Compare your performance trends against team average or specific team members.
                </p>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        </div>
        
        <div className={`flex ${isMobile ? 'flex-col' : 'justify-between'} items-center mt-4 gap-3`}>
          {/* Metric toggle group */}
          <ToggleGroup 
            type="single" 
            value={activeMetric} 
            onValueChange={(value) => value && setActiveMetric(value as 'profit' | 'spend' | 'packs' | 'margin')}
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
              value="packs" 
              aria-label="Toggle Packs" 
              className="data-[state=on]:bg-green-500/20 data-[state=on]:text-green-400 border-gray-700"
            >
              <div className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-full bg-green-500"></span>
                <span className="text-xs">Packs</span>
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
          </ToggleGroup>
          
          {/* Comparison toggles */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className={`px-4 py-1 rounded-full border ${showAverage ? 'bg-white/10 border-white/30' : 'bg-transparent border-white/10'} hover:bg-white/20 transition-colors`}
              onClick={() => setShowAverage(!showAverage)}
            >
              Team Average
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className={`px-4 py-1 rounded-full border ${showComparison ? 'bg-white/10 border-white/30' : 'bg-transparent border-white/10'} hover:bg-white/20 transition-colors`}
              onClick={() => setShowComparison(!showComparison)}
            >
              Compare Reps
            </Button>
          </div>
        </div>
        
        {/* Rep selector - now using realistic rep names */}
        {showComparison && (
          <div className="mt-4 flex flex-wrap gap-2">
            {renderRepButtons()}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="h-64 pt-3 pb-8">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              dataKey="month"
              tick={{ fill: 'rgba(255,255,255,0.6)' }}
              allowDuplicatedCategory={false}
            />
            <YAxis 
              tick={{ fill: 'rgba(255,255,255,0.6)' }}
              tickFormatter={(value) => {
                if (activeMetric === 'profit' || activeMetric === 'spend') {
                  return `£${(value / 1000)}k`;
                } else if (activeMetric === 'margin') {
                  return `${value}%`;
                } else {
                  return value.toString();
                }
              }}
              width={55}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* User's data line */}
            <Line 
              data={activeUserData}
              type="monotone"
              dataKey="value"
              name={userName}
              stroke={CHART_COLORS.user}
              strokeWidth={2}
              dot={{ r: 4, fill: CHART_COLORS.user }}
              activeDot={{ r: 6 }}
              connectNulls={true}
            />
            
            {/* Team average line (if enabled) */}
            {showAverage && (
              <Line 
                data={activeAverageData}
                type="monotone"
                dataKey="value"
                name="Team Average"
                stroke={CHART_COLORS.average}
                strokeWidth={1.5}
                strokeDasharray="3 3"
                dot={{ r: 3, fill: CHART_COLORS.average }}
                activeDot={{ r: 5 }}
                connectNulls={true}
              />
            )}
            
            {/* Selected comparison rep line (if any) */}
            {showComparison && selectedComparisonRep && activeComparisonData && (
              <Line 
                data={activeComparisonData}
                type="monotone"
                dataKey="value"
                name={selectedComparisonRep}
                stroke={CHART_COLORS.profit} // Using profit color for comparison
                strokeWidth={1.5}
                dot={{ r: 3, fill: CHART_COLORS.profit }}
                activeDot={{ r: 5 }}
                connectNulls={true}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default RepPerformanceComparison;
