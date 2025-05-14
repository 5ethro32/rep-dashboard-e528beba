
import React from 'react';
import { useEngineRoom } from '@/contexts/EngineRoomContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { calculateUsageWeightedMetrics } from '@/utils/formatting-utils';

const SwotAnalysis: React.FC = () => {
  const { engineData } = useEngineRoom();
  
  // Calculate metrics
  const metrics = engineData?.items ? calculateUsageWeightedMetrics(engineData.items) : null;
  
  // SWOT analysis based on data
  const swotAnalysis = React.useMemo(() => {
    // Default analysis
    const analysis = {
      strengths: [
        "Strong data-driven pricing approach",
        "Competitive pricing intelligence capability",
        "Comprehensive usage and margin analytics"
      ],
      weaknesses: [
        "Manual price adjustment processes",
        "Limited real-time market data",
        "Variable pricing consistency across portfolio"
      ],
      opportunities: [
        "Margin optimization potential through data analysis",
        "Market-driven pricing strategy refinement",
        "Portfolio rationalization for improved profitability"
      ],
      threats: [
        "Competitor price undercutting in key segments",
        "Market volatility affecting benchmark pricing",
        "External cost pressures affecting margins"
      ]
    };
    
    // Customize based on actual data if available
    if (engineData?.items && engineData.items.length > 0 && metrics) {
      // Clear default arrays to populate with data-driven insights
      analysis.strengths = [];
      analysis.weaknesses = [];
      analysis.opportunities = [];
      analysis.threats = [];
      
      // Analyze overall margin performance
      if (metrics.weightedMargin > 20) {
        analysis.strengths.push("Strong overall portfolio margin performance");
      } else if (metrics.weightedMargin < 10) {
        analysis.weaknesses.push("Below-target portfolio margin performance");
        analysis.opportunities.push("Significant margin improvement opportunity across portfolio");
      }
      
      // Analyze market positioning
      const itemsWithMarketData = engineData.items.filter(i => !i.noMarketPrice && i.trueMarketLow > 0);
      if (itemsWithMarketData.length > 0) {
        const aboveMarket = itemsWithMarketData.filter(i => {
          const price = i.proposedPrice || i.currentREVAPrice;
          return price > i.trueMarketLow * 1.1;
        });
        
        const belowMarket = itemsWithMarketData.filter(i => {
          const price = i.proposedPrice || i.currentREVAPrice;
          return price < i.trueMarketLow * 0.9;
        });
        
        const aboveMarketPct = aboveMarket.length / itemsWithMarketData.length * 100;
        const belowMarketPct = belowMarket.length / itemsWithMarketData.length * 100;
        
        if (aboveMarketPct > 40) {
          analysis.weaknesses.push(`${aboveMarketPct.toFixed(1)}% of portfolio priced significantly above market`);
          analysis.threats.push("Competitive vulnerability due to above-market pricing");
        } else if (aboveMarketPct > 20) {
          analysis.threats.push("Potential competitive vulnerability in select product categories");
        }
        
        if (belowMarketPct > 40) {
          analysis.weaknesses.push(`${belowMarketPct.toFixed(1)}% of portfolio potentially underpriced vs. market`);
          analysis.opportunities.push("Immediate revenue opportunity through targeted price increases");
        } else if (belowMarketPct > 20) {
          analysis.opportunities.push("Selective price increase opportunity in underpriced segments");
        }
      }
      
      // Analyze low margin products
      const lowMarginItems = engineData.items.filter(i => {
        if (!i.avgCost || i.avgCost <= 0) return false;
        const price = i.proposedPrice || i.currentREVAPrice;
        if (!price || price <= 0) return false;
        const margin = (price - i.avgCost) / price;
        return margin < 0.05; // Less than 5% margin
      });
      
      if (lowMarginItems.length > 0) {
        const lowMarginPct = lowMarginItems.length / engineData.items.length * 100;
        if (lowMarginPct > 15) {
          analysis.weaknesses.push(`Critical low margins (<5%) in ${lowMarginPct.toFixed(1)}% of portfolio`);
          analysis.threats.push("Financial vulnerability due to concentration of minimal margin products");
        } else if (lowMarginPct > 5) {
          analysis.weaknesses.push("Low margin products requiring pricing attention");
        }
      }
      
      // Add additional insights based on usage patterns
      const highUsageItems = engineData.items
        .filter(i => i.revaUsage > 0)
        .sort((a, b) => (b.revaUsage || 0) - (a.revaUsage || 0))
        .slice(0, Math.ceil(engineData.items.length * 0.1)); // Top 10% by usage
        
      const highUsageBelowMarket = highUsageItems.filter(i => {
        if (i.noMarketPrice || !i.trueMarketLow || i.trueMarketLow <= 0) return false;
        const price = i.proposedPrice || i.currentREVAPrice;
        return price < i.trueMarketLow * 0.95; // 5% below market
      });
      
      if (highUsageBelowMarket.length > 0) {
        if (highUsageBelowMarket.length > highUsageItems.length * 0.3) {
          analysis.opportunities.push("High-impact price optimization potential in top usage products");
        } else if (highUsageBelowMarket.length > 0) {
          analysis.opportunities.push("Selective price optimization in high-usage product subset");
        }
      }
      
      // Fill in with default insights if we don't have enough data-driven insights
      if (analysis.strengths.length < 2) {
        analysis.strengths.push("Comprehensive pricing analytics capability");
      }
      if (analysis.weaknesses.length < 2) {
        analysis.weaknesses.push("Limited real-time market price intelligence");
      }
      if (analysis.opportunities.length < 2) {
        analysis.opportunities.push("Structured price optimization program opportunity");
      }
      if (analysis.threats.length < 2) {
        analysis.threats.push("Market volatility affecting pricing benchmarks");
      }
    }
    
    return analysis;
  }, [engineData, metrics]);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="border border-white/10 bg-gray-900/40 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-green-500">Strengths</CardTitle>
          <CardDescription>What's working well in pricing approach</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {swotAnalysis.strengths.map((strength, i) => (
              <li key={`strength-${i}`} className="flex items-start gap-2">
                <div className="h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                </div>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      
      <Card className="border border-white/10 bg-gray-900/40 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-red-500">Weaknesses</CardTitle>
          <CardDescription>Areas to improve in pricing approach</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {swotAnalysis.weaknesses.map((weakness, i) => (
              <li key={`weakness-${i}`} className="flex items-start gap-2">
                <div className="h-5 w-5 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="h-2 w-2 rounded-full bg-red-500"></div>
                </div>
                <span>{weakness}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      
      <Card className="border border-white/10 bg-gray-900/40 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-blue-500">Opportunities</CardTitle>
          <CardDescription>Potential pricing optimization levers</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {swotAnalysis.opportunities.map((opportunity, i) => (
              <li key={`opportunity-${i}`} className="flex items-start gap-2">
                <div className="h-5 w-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                </div>
                <span>{opportunity}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      
      <Card className="border border-white/10 bg-gray-900/40 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-amber-500">Threats</CardTitle>
          <CardDescription>External factors impacting pricing strategy</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {swotAnalysis.threats.map((threat, i) => (
              <li key={`threat-${i}`} className="flex items-start gap-2">
                <div className="h-5 w-5 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                </div>
                <span>{threat}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      
      <Card className="border border-white/10 bg-gray-900/40 backdrop-blur-sm md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Strategic Recommendations</CardTitle>
          <CardDescription>Actionable insights based on SWOT analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="h-2.5 w-2.5 rounded-full bg-purple-500"></div>
              </div>
              <span>Implement targeted price increases on products significantly below market pricing, focusing on high-usage items first</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="h-2.5 w-2.5 rounded-full bg-purple-500"></div>
              </div>
              <span>Review products with critical low margins and develop action plans for each (price increase, cost reduction, or strategic phase-out)</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="h-2.5 w-2.5 rounded-full bg-purple-500"></div>
              </div>
              <span>Establish competitive pricing intelligence program to improve real-time market positioning</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="h-2.5 w-2.5 rounded-full bg-purple-500"></div>
              </div>
              <span>Develop clear pricing corridors by product category to ensure consistent approach to market</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default SwotAnalysis;
