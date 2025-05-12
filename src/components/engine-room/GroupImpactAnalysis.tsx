
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LineChart from '@/components/LineChart';
import { formatCurrency, formatPercentage } from '@/utils/formatting-utils';

interface GroupImpactAnalysisProps {
  result: {
    groupImpact: {
      name: string;
      margin: {
        current: number;
        simulated: number;
        diff: number;
      };
      profit: {
        current: number;
        simulated: number;
        diff: number;
        diffPercent: number;
      };
      revenue: {
        current: number;
        simulated: number;
        diff: number;
      };
      itemCount: number;
    }[];
  };
}

const GroupImpactAnalysis: React.FC<GroupImpactAnalysisProps> = ({ result }) => {
  const [metric, setMetric] = useState<'margin'|'profit'|'revenue'>('margin');
  
  // Format the data for the LineChart component
  const formatChartData = () => {
    if (metric === 'margin') {
      return result.groupImpact.map(group => ({
        name: group.name,
        value: group.margin.current,
        avg: group.margin.simulated,
        itemCount: group.itemCount
      }));
    } else if (metric === 'profit') {
      return result.groupImpact.map(group => ({
        name: group.name,
        value: group.profit.current,
        avg: group.profit.simulated,
        itemCount: group.itemCount
      }));
    } else {
      return result.groupImpact.map(group => ({
        name: group.name,
        value: group.revenue.current,
        avg: group.revenue.simulated,
        itemCount: group.itemCount
      }));
    }
  };
  
  // Format the Y-axis labels
  const yAxisFormatter = (value: number): string => {
    if (metric === 'margin') {
      return formatPercentage(value);
    } else {
      return formatCurrency(value);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Group Impact Analysis</h3>
        
        <Tabs value={metric} onValueChange={(value: string) => setMetric(value as 'margin'|'profit'|'revenue')}>
          <TabsList>
            <TabsTrigger value="margin">Margin</TabsTrigger>
            <TabsTrigger value="profit">Profit</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <Card className="border border-white/10 bg-gray-900/40 backdrop-blur-sm shadow-lg">
        <CardContent className="p-4">
          <div className="h-[400px]">
            <LineChart 
              data={formatChartData()}
              color="#ea384c"
              avgColor="#1EAEDB"
              yAxisFormatter={yAxisFormatter}
              showAverage={true}
              hasPercentageMetric={metric === 'margin'}
            />
          </div>
          <div className="flex items-center justify-center mt-4 space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-[#ea384c]"></div>
              <span className="text-sm">Current</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-[#1EAEDB]"></div>
              <span className="text-sm">Simulated</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-white/10 bg-gray-900/40 backdrop-blur-sm shadow-lg">
          <CardContent className="p-4">
            <h4 className="font-medium mb-4">Group Impact Summary</h4>
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-white/10">
                  <th className="pb-2 font-medium text-xs text-muted-foreground">Usage Group</th>
                  <th className="pb-2 font-medium text-xs text-muted-foreground">Items</th>
                  <th className="pb-2 font-medium text-xs text-muted-foreground">Margin Change</th>
                  <th className="pb-2 font-medium text-xs text-muted-foreground">Profit Change</th>
                </tr>
              </thead>
              <tbody>
                {result.groupImpact.map((group, index) => (
                  <tr key={index} className="border-b border-white/5 last:border-0">
                    <td className="py-2 text-sm">{group.name}</td>
                    <td className="py-2 text-sm">{group.itemCount}</td>
                    <td className={`py-2 text-sm ${group.margin.diff > 0 ? 'text-green-400' : group.margin.diff < 0 ? 'text-red-400' : ''}`}>
                      {group.margin.diff > 0 ? '+' : ''}{group.margin.diff.toFixed(2)}%
                    </td>
                    <td className={`py-2 text-sm ${group.profit.diff > 0 ? 'text-green-400' : group.profit.diff < 0 ? 'text-red-400' : ''}`}>
                      {group.profit.diff > 0 ? '+' : ''}{formatCurrency(group.profit.diff)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
        
        <Card className="border border-white/10 bg-gray-900/40 backdrop-blur-sm shadow-lg">
          <CardContent className="p-4">
            <h4 className="font-medium mb-4">Impact Percentage by Group</h4>
            <div className="h-[300px]">
              <LineChart 
                data={result.groupImpact.map(group => ({
                  name: group.name,
                  value: group.profit.diffPercent,
                }))}
                color="#8B5CF6"
                yAxisFormatter={(value) => `${value.toFixed(2)}%`}
                showAverage={false}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GroupImpactAnalysis;
