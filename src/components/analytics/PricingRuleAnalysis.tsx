
import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import AnalyticsTooltip from './AnalyticsTooltip';

interface PricingRuleAnalysisProps {
  data: any[];
}

const RULE_COLORS = {
  'ML+3%': '#8b5cf6',       // Purple
  'AVC+12%': '#3b82f6',     // Blue
  'market-based': '#0ea5e9', // Light Blue
  'cost-based': '#d946ef',  // Magenta
  'unknown': '#94a3b8',     // Gray
};

const PricingRuleAnalysis: React.FC<PricingRuleAnalysisProps> = ({ data }) => {
  const analysisData = useMemo(() => {
    if (!data || data.length === 0) return { 
      ruleBreakdown: [],
      avgMarginByRule: [],
      optimizationCandidates: [] 
    };

    // Filter to only include products with all necessary data points
    const filteredData = data.filter(item => 
      item.currentREVAPrice > 0 && 
      item.avgCost > 0 && 
      item.revaUsage > 0
    );

    // Determine pricing rule for each product
    const productsWithRules = filteredData.map(item => {
      const currentMargin = (item.currentREVAPrice - item.avgCost) / item.currentREVAPrice * 100;
      
      // Determine pricing rule used (simulated as we don't have actual rule data)
      let pricingRule = 'unknown';
      let potentialRule = 'unknown';
      let potentialMargin = currentMargin;
      
      if (item.ethNetPrice > 0 && Math.abs(item.currentREVAPrice - item.ethNetPrice * 1.03) < 0.01) {
        pricingRule = 'ML+3%';
        
        // Check if AVC+12% would give better margin
        const avcPrice = item.avgCost * 1.12;
        if (avcPrice > item.currentREVAPrice) {
          potentialRule = 'AVC+12%';
          potentialMargin = (avcPrice - item.avgCost) / avcPrice * 100;
        }
      } else if (Math.abs(item.currentREVAPrice - item.avgCost * 1.12) < 0.01) {
        pricingRule = 'AVC+12%';
        
        // Check if ML+3% would give better margin (if ML exists)
        if (item.ethNetPrice > 0) {
          const mlPrice = item.ethNetPrice * 1.03;
          if (mlPrice > item.currentREVAPrice) {
            potentialRule = 'ML+3%';
            potentialMargin = (mlPrice - item.avgCost) / mlPrice * 100;
          }
        }
      } else if (item.ethNetPrice > 0 && item.currentREVAPrice > item.ethNetPrice) {
        pricingRule = 'market-based';
      } else {
        pricingRule = 'cost-based';
      }

      const marginGain = potentialMargin - currentMargin;

      return {
        id: item.id,
        name: item.description?.substring(0, 30) || 'Unknown',
        price: item.currentREVAPrice,
        cost: item.avgCost,
        margin: currentMargin.toFixed(1),
        usage: item.revaUsage,
        pricingRule,
        potentialRule: marginGain > 2 ? potentialRule : null,
        potentialMargin: potentialMargin.toFixed(1),
        marginGain: marginGain.toFixed(1),
        usageRank: item.usageRank || 99,
        ethNetMissing: item.ethNetPrice <= 0,
      };
    });

    // Calculate rule breakdown
    const ruleCounts = productsWithRules.reduce((acc, item) => {
      const rule = item.pricingRule;
      if (!acc[rule]) acc[rule] = 0;
      acc[rule]++;
      return acc;
    }, {});

    const ruleBreakdown = Object.entries(ruleCounts).map(([name, value]) => ({
      name,
      value,
      color: RULE_COLORS[name as keyof typeof RULE_COLORS] || '#94a3b8'
    }));

    // Calculate average margin by rule
    const marginByRule = productsWithRules.reduce((acc, item) => {
      const rule = item.pricingRule;
      if (!acc[rule]) {
        acc[rule] = { total: 0, count: 0 };
      }
      acc[rule].total += parseFloat(item.margin);
      acc[rule].count++;
      return acc;
    }, {});

    const avgMarginByRule = Object.entries(marginByRule).map(([name, data]) => ({
      name,
      value: ((data as any).total / (data as any).count).toFixed(1),
      count: (data as any).count,
      color: RULE_COLORS[name as keyof typeof RULE_COLORS] || '#94a3b8'
    }));

    // Find optimization candidates
    const optimizationCandidates = productsWithRules
      .filter(item => item.potentialRule && parseFloat(item.marginGain) > 2)
      .sort((a, b) => parseFloat(b.marginGain) - parseFloat(a.marginGain))
      .slice(0, 10);

    return { ruleBreakdown, avgMarginByRule, optimizationCandidates };
  }, [data]);

  if (analysisData.ruleBreakdown.length === 0) {
    return (
      <div className="text-center py-8">
        <h3 className="text-xl font-semibold mb-2">Pricing Rule Analysis</h3>
        <p className="text-muted-foreground">Insufficient data for rule analysis</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-1">Pricing Rules Effectiveness</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Analyzes performance of different pricing rules and identifies optimization opportunities
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rule Distribution Chart */}
        <Card className="border border-white/10 bg-gradient-to-b from-gray-950 to-gray-900 backdrop-blur-sm shadow-lg">
          <CardContent className="p-4">
            <h4 className="text-lg font-medium mb-3">Rule Distribution</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analysisData.ruleBreakdown}
                  margin={{ top: 20, right: 30, bottom: 40, left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#999' }}
                    angle={-45}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fill: '#999' }} />
                  <Tooltip 
                    content={({active, payload}) => (
                      <AnalyticsTooltip 
                        active={active}
                        payload={payload}
                        formatter={(value, name) => [value.toString(), 'Products Using Rule']}
                      />
                    )}
                  />
                  <Bar dataKey="value">
                    {analysisData.ruleBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Average Margin by Rule Chart */}
        <Card className="border border-white/10 bg-gradient-to-b from-gray-950 to-gray-900 backdrop-blur-sm shadow-lg">
          <CardContent className="p-4">
            <h4 className="text-lg font-medium mb-3">Average Margin by Rule</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analysisData.avgMarginByRule}
                  margin={{ top: 20, right: 30, bottom: 40, left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#999' }}
                    angle={-45}
                    textAnchor="end"
                  />
                  <YAxis 
                    tick={{ fill: '#999' }} 
                    domain={[0, 'auto']}
                    label={{ 
                      value: 'Avg. Margin %', 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { fill: '#999' } 
                    }}
                  />
                  <Tooltip 
                    content={({active, payload}) => (
                      <AnalyticsTooltip 
                        active={active}
                        payload={payload}
                        formatter={(value, name) => {
                          if (name === "count") return [value.toString(), "Products"];
                          return [`${value}%`, "Average Margin"];
                        }}
                      />
                    )}
                  />
                  <Bar dataKey="value" name="Margin %">
                    {analysisData.avgMarginByRule.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rule Optimization Candidates */}
      {analysisData.optimizationCandidates.length > 0 && (
        <div>
          <h4 className="text-lg font-medium mb-3">Rule Optimization Opportunities</h4>
          <div className="rounded-md border border-white/10 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="w-[100px]">Current Rule</TableHead>
                  <TableHead className="w-[100px]">Current Margin</TableHead>
                  <TableHead className="w-[100px]">Suggested Rule</TableHead>
                  <TableHead className="w-[100px]">Potential Margin</TableHead>
                  <TableHead className="w-[100px]">Margin Gain</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysisData.optimizationCandidates.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div 
                          className="w-2 h-2 rounded-full mr-1" 
                          style={{ backgroundColor: RULE_COLORS[item.pricingRule as keyof typeof RULE_COLORS] || '#94a3b8' }}
                        />
                        {item.pricingRule}
                      </div>
                    </TableCell>
                    <TableCell>{item.margin}%</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div 
                          className="w-2 h-2 rounded-full mr-1" 
                          style={{ backgroundColor: RULE_COLORS[item.potentialRule as keyof typeof RULE_COLORS] || '#94a3b8' }}
                        />
                        {item.potentialRule}
                      </div>
                    </TableCell>
                    <TableCell>{item.potentialMargin}%</TableCell>
                    <TableCell>
                      <span className="font-medium text-green-500">+{item.marginGain}%</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <div className="text-xs text-muted-foreground mt-3 px-4">
            <p>Products that would benefit from switching to a different pricing rule, showing potential margin improvement.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingRuleAnalysis;
