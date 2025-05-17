
import React, { useMemo } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import AnalyticsTooltip from './AnalyticsTooltip';

interface MarginOpportunityMatrixProps {
  data: any[];
}

const CHART_COLORS = {
  star: '#eab308',        // Yellow for stars
  cash: '#10b981',        // Green for cash generators
  opportunity: '#f97316', // Orange for opportunities
  problem: '#ef4444',     // Red for problems
  rule1: '#8b5cf6',       // Purple for Rule 1 (ML based)
  rule2: '#3b82f6',       // Blue for Rule 2 (AVC based)
  ruleOther: '#d946ef',   // Magenta for other rules
};

const MarginOpportunityMatrix: React.FC<MarginOpportunityMatrixProps> = ({ data }) => {
  const matrixData = useMemo(() => {
    if (!data || data.length === 0) return { chartData: [], topOpportunities: [], ruleBreakdown: {} };

    // Filter to only include products with all necessary data points
    const filteredData = data.filter(item => 
      item.currentREVAPrice > 0 && 
      item.avgCost > 0 && 
      item.revaUsage > 0
    );

    // Calculate margin and map to chart data
    const chartData = filteredData.map(item => {
      const currentMargin = (item.currentREVAPrice - item.avgCost) / item.currentREVAPrice * 100;
      // Calculate a margin opportunity score
      const marginOpportunity = currentMargin < 15 ? (15 - currentMargin) * (item.revaUsage / 10) : 0;
      
      // Determine pricing rule used (simulated as we don't have actual rule data)
      let pricingRule = 'unknown';
      if (item.ethNetPrice > 0 && Math.abs(item.currentREVAPrice - item.ethNetPrice * 1.03) < 0.01) {
        pricingRule = 'ML+3%';
      } else if (Math.abs(item.currentREVAPrice - item.avgCost * 1.12) < 0.01) {
        pricingRule = 'AVC+12%';
      } else if (item.ethNetPrice > 0 && item.currentREVAPrice > item.ethNetPrice) {
        pricingRule = 'market-based';
      } else {
        pricingRule = 'cost-based';
      }

      return {
        id: item.id,
        name: item.description?.substring(0, 30) || 'Unknown',
        margin: currentMargin.toFixed(1),
        usage: item.revaUsage,
        cost: item.avgCost,
        price: item.currentREVAPrice,
        marketPrice: item.ethNetPrice || 0,
        marginOpportunity: marginOpportunity.toFixed(1),
        pricingRule,
        // Size is based on usage and represents importance
        size: Math.min(Math.sqrt(item.revaUsage) * 2, 30),
        // Quadrant helps with coloring and filtering
        quadrant: currentMargin >= 15 && item.revaUsage >= 10 ? 'star' :
                 currentMargin >= 15 ? 'cash' :
                 item.revaUsage >= 10 ? 'opportunity' : 'problem',
        // Shape based on pricing rule
        shape: pricingRule === 'ML+3%' ? 'circle' : 
               pricingRule === 'AVC+12%' ? 'triangle' : 'square',
        // Rule color
        ruleColor: pricingRule.includes('ML') ? CHART_COLORS.rule1 :
                  pricingRule.includes('AVC') ? CHART_COLORS.rule2 :
                  CHART_COLORS.ruleOther
      };
    });

    // Calculate rule breakdown
    const ruleBreakdown = chartData.reduce((acc: Record<string, number>, item: any) => {
      const rule = item.pricingRule;
      acc[rule] = (acc[rule] || 0) + 1;
      return acc;
    }, {});

    // Calculate top 10 opportunities based on margin opportunity and usage
    const topOpportunities = [...chartData]
      .filter(item => item.quadrant === 'opportunity')
      .sort((a, b) => Number(b.marginOpportunity) - Number(a.marginOpportunity))
      .slice(0, 10);

    return { chartData, topOpportunities, ruleBreakdown };
  }, [data]);

  if (matrixData.chartData.length === 0) {
    return (
      <div className="text-center py-8">
        <h3 className="text-xl font-semibold mb-2">Margin Opportunity Matrix</h3>
        <p className="text-muted-foreground">Insufficient data for margin analysis</p>
      </div>
    );
  }

  const renderRuleTooltip = () => {
    if (!matrixData.ruleBreakdown) return null;
    
    return (
      <div className="mt-3 px-4 py-2 bg-gray-800/60 backdrop-blur-sm border border-white/10 rounded-md">
        <h4 className="text-sm font-medium mb-2">Pricing Rule Distribution</h4>
        <div className="flex flex-wrap gap-3 text-xs">
          {Object.entries(matrixData.ruleBreakdown).map(([rule, count], index) => (
            <div key={rule} className="flex items-center">
              <div 
                className="w-2 h-2 rounded-full mr-1" 
                style={{ backgroundColor: 
                  rule.includes('ML') ? CHART_COLORS.rule1 :
                  rule.includes('AVC') ? CHART_COLORS.rule2 :
                  CHART_COLORS.ruleOther 
                }}
              />
              <span>
                {rule}: <span className="font-medium">{count}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-1">Margin Opportunity Matrix</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Identifies high-impact margin improvement opportunities based on usage and current margin
        </p>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            margin={{ top: 20, right: 30, bottom: 20, left: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis 
              type="number" 
              dataKey="margin" 
              name="Margin %" 
              domain={[-10, 40]} 
              label={{ 
                value: 'Margin %', 
                position: 'insideBottom', 
                offset: -10,
                style: { fill: '#999' } 
              }}
              tick={{ fill: '#999' }}
            />
            <YAxis 
              type="number" 
              dataKey="usage" 
              name="Usage Volume"
              scale="log"
              domain={['auto', 'auto']}
              label={{ 
                value: 'Usage (log scale)', 
                angle: -90, 
                position: 'insideLeft',
                style: { fill: '#999' } 
              }}
              tick={{ fill: '#999' }}
            />
            <ZAxis 
              type="number" 
              dataKey="size" 
              range={[5, 20]} 
            />
            <Tooltip 
              content={({active, payload}) => (
                <AnalyticsTooltip 
                  active={active}
                  payload={payload}
                  title={payload && payload[0] ? payload[0]?.payload?.name : ''}
                  formatter={(value, name) => {
                    // Format different properties
                    if (name === 'Margin %') return [`${value}%`, name];
                    if (name === 'Usage Volume') return [value.toLocaleString(), name];
                    if (name === 'Price') return [`£${value.toFixed(2)}`, name];
                    if (name === 'Cost') return [`£${value.toFixed(2)}`, name];
                    if (name === 'Market Price') {
                      return [value > 0 ? `£${value.toFixed(2)}` : 'N/A', 'ETH NET Price'];
                    }
                    if (name === 'marginOpportunity') return [value, 'Opportunity Score'];
                    if (name === 'pricingRule') return [value, 'Pricing Rule'];
                    return [value, name];
                  }}
                />
              )}
            />
            <ReferenceLine y={10} stroke="rgba(255,255,255,0.2)" strokeDasharray="3 3" label={{ value: 'High Usage Threshold', angle: -90, position: 'insideLeft', fill: '#999', fontSize: 10 }} />
            <ReferenceLine x={15} stroke="rgba(255,255,255,0.2)" strokeDasharray="3 3" label={{ value: 'Target Margin', position: 'insideBottom', fill: '#999', fontSize: 10 }} />
            
            <Legend 
              formatter={(value) => <span className="text-sm font-medium">{value}</span>}
              wrapperStyle={{ paddingTop: 10 }}
            />
            
            <Scatter 
              name="Star Products (High Margin, High Usage)" 
              data={matrixData.chartData.filter(item => item.quadrant === 'star')} 
              fill={CHART_COLORS.star}
              shape="circle"
              className="animate-fade-in"
            />
            <Scatter 
              name="Cash Generator (High Margin, Low Usage)" 
              data={matrixData.chartData.filter(item => item.quadrant === 'cash')} 
              fill={CHART_COLORS.cash}
              shape="circle"
              className="animate-fade-in"
            />
            <Scatter 
              name="Opportunity Products (Low Margin, High Usage)" 
              data={matrixData.chartData.filter(item => item.quadrant === 'opportunity')} 
              fill={CHART_COLORS.opportunity}
              shape="circle"
              className="animate-fade-in"
            />
            <Scatter 
              name="Problem Products (Low Margin, Low Usage)" 
              data={matrixData.chartData.filter(item => item.quadrant === 'problem')} 
              fill={CHART_COLORS.problem}
              shape="circle"
              className="animate-fade-in"
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {renderRuleTooltip()}
      
      <div>
        <h4 className="text-lg font-medium mb-3">Top Margin Improvement Opportunities</h4>
        <div className="rounded-md border border-white/10 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="w-[100px]">Current Margin</TableHead>
                <TableHead className="w-[100px]">Usage</TableHead>
                <TableHead className="w-[120px]">Price</TableHead>
                <TableHead className="w-[120px]">Rule</TableHead>
                <TableHead className="w-[120px]">Opportunity Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matrixData.topOpportunities.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.margin}%</TableCell>
                  <TableCell>{item.usage}</TableCell>
                  <TableCell>£{item.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <div 
                        className="w-2 h-2 rounded-full mr-1" 
                        style={{ backgroundColor: item.ruleColor }}
                      />
                      {item.pricingRule}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-orange-500">{item.marginOpportunity}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        <div className="text-xs text-muted-foreground mt-3 px-4">
          <p>The opportunity score measures potential margin improvement impact based on usage volume and margin gap.</p>
        </div>
      </div>
    </div>
  );
};

export default MarginOpportunityMatrix;
