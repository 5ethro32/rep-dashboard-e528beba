
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Zap, Shield, Target } from 'lucide-react';
import { ChartContainer } from '@/components/ui/chart';
import { useEngineRoom } from '@/contexts/EngineRoomContext';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const CompetitorAnalysis: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('pricing');
  const { engineData, isLoading } = useEngineRoom();

  // Generate competitor data from actual market price data
  const competitors = useMemo(() => {
    if (!engineData?.items || engineData.items.length === 0) {
      return [];
    }

    // Extract unique competitor names and their pricing data
    const competitorPrices = {
      'Your Company': { prices: [], priceChanges: [] },
      'ETH': { prices: [], priceChanges: [] },
      'NuPharm': { prices: [], priceChanges: [] },
      'Lexon': { prices: [], priceChanges: [] },
      'AAH': { prices: [], priceChanges: [] }
    };

    // Process each item with valid market data
    engineData.items.forEach(item => {
      if (item.proposedPrice || item.currentREVAPrice) {
        competitorPrices['Your Company'].prices.push(item.proposedPrice || item.currentREVAPrice);
      }
      
      if (item.eth !== undefined && item.eth > 0) {
        competitorPrices['ETH'].prices.push(item.eth);
      }
      
      if (item.nupharm !== undefined && item.nupharm > 0) {
        competitorPrices['NuPharm'].prices.push(item.nupharm);
      }
      
      if (item.lexon !== undefined && item.lexon > 0) {
        competitorPrices['Lexon'].prices.push(item.lexon);
      }
      
      if (item.aah !== undefined && item.aah > 0) {
        competitorPrices['AAH'].prices.push(item.aah);
      }
    });

    // Calculate average prices for each competitor
    const result = Object.entries(competitorPrices).map(([name, data], index) => {
      const prices = data.prices;
      if (prices.length === 0) return null;
      
      // Calculate average price
      const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      
      // Calculate price change (simulated for now, but could be enhanced with historical data)
      // For demo, generate more realistic changes rather than random
      const priceChange = name === 'Your Company' ? 2.3 :
                          name === 'ETH' ? 1.5 :
                          name === 'NuPharm' ? -0.8 :
                          name === 'Lexon' ? 3.1 :
                          -1.2;
      
      // Calculate market share based on price competitiveness
      const itemsWithPrices = prices.length;
      const totalItems = engineData.items.filter(i => !i.noMarketPrice && i.trueMarketLow > 0).length;
      const marketShare = (itemsWithPrices / (totalItems || 1)) * 100;
      
      // Generate historical pricing trends (simulated)
      const historicalPrices = generateHistoricalPrices(avgPrice, priceChange);
      
      return {
        name,
        price: avgPrice,
        marketShare: Math.min(Math.max(marketShare * (name === 'Your Company' ? 1.2 : 0.8), 0), 50), // Normalize market share
        priceChange,
        historicalPrices,
        lowPriceWins: prices.filter(p => {
          // Count items where this competitor has the lowest price
          const item = engineData.items.find(i => 
            (name === 'Your Company' && (i.proposedPrice === p || i.currentREVAPrice === p)) ||
            (name === 'ETH' && i.eth === p) ||
            (name === 'NuPharm' && i.nupharm === p) ||
            (name === 'Lexon' && i.lexon === p) ||
            (name === 'AAH' && i.aah === p)
          );
          
          if (!item) return false;
          
          // Check if this price is the market low for this item
          return p === item.trueMarketLow;
        }).length,
        competitiveness: calculateCompetitiveRating(name, engineData.items)
      };
    }).filter(Boolean);
    
    return result;
  }, [engineData?.items]);

  // Generate simulated historical price data
  const generateHistoricalPrices = (basePrice, trend) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May'];
    let currentPrice = basePrice * (1 - (trend / 100) * 2); // Start from an earlier price point
    
    return months.map(month => {
      const price = currentPrice;
      // Add a trend component plus a small random fluctuation
      currentPrice = currentPrice * (1 + (trend / 100) * 0.5 + (Math.random() - 0.5) * 0.01);
      return { month, price: parseFloat(price.toFixed(2)) };
    });
  };

  // Calculate competitive rating based on how often a competitor provides the lowest price
  const calculateCompetitiveRating = (competitorName, items) => {
    if (!items || items.length === 0) return { overall: 0, pricing: 0, availability: 0, consistency: 0 };
    
    let pricingScore = 0;
    let availabilityScore = 0;
    let consistencyScore = 0;
    
    // Count relevant items
    let relevantItems = 0;
    
    items.forEach(item => {
      if (!item.noMarketPrice) {
        relevantItems++;
        
        // Check pricing
        const price = competitorName === 'Your Company' ? (item.proposedPrice || item.currentREVAPrice) :
                      competitorName === 'ETH' ? item.eth :
                      competitorName === 'NuPharm' ? item.nupharm :
                      competitorName === 'Lexon' ? item.lexon :
                      item.aah;
        
        // If this competitor has a price for this item
        if (price && price > 0) {
          availabilityScore++; // They have the product
          
          // If they have the lowest price
          if (price === item.trueMarketLow) {
            pricingScore++;
          }
          
          // Consistency - how close to market low
          if (item.trueMarketLow > 0) {
            const ratio = price / item.trueMarketLow;
            // Score higher for consistently being within 5% of lowest price
            if (ratio <= 1.05) consistencyScore++;
          }
        }
      }
    });
    
    // Normalize scores to 0-100 scale
    const normalizedPricing = relevantItems > 0 ? (pricingScore / relevantItems) * 100 : 0;
    const normalizedAvailability = relevantItems > 0 ? (availabilityScore / relevantItems) * 100 : 0;
    const normalizedConsistency = availabilityScore > 0 ? (consistencyScore / availabilityScore) * 100 : 0;
    
    // Overall score is weighted average
    const overall = (normalizedPricing * 0.5) + (normalizedAvailability * 0.3) + (normalizedConsistency * 0.2);
    
    return {
      overall: Math.round(overall),
      pricing: Math.round(normalizedPricing),
      availability: Math.round(normalizedAvailability),
      consistency: Math.round(normalizedConsistency)
    };
  };

  // Prepare data for price trend chart
  const trendData = useMemo(() => {
    if (!competitors || competitors.length === 0) return [];
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May'];
    return months.map(month => {
      const dataPoint = { month };
      
      competitors.forEach(comp => {
        const monthData = comp.historicalPrices.find(h => h.month === month);
        if (monthData) {
          dataPoint[comp.name] = monthData.price;
        }
      });
      
      return dataPoint;
    });
  }, [competitors]);

  // Prepare data for competitive radar chart
  const competitiveRadarData = useMemo(() => {
    if (!competitors || competitors.length === 0) return [];
    
    return competitors.map(comp => ({
      name: comp.name,
      pricing: comp.competitiveness.pricing,
      availability: comp.competitiveness.availability,
      consistency: comp.competitiveness.consistency
    }));
  }, [competitors]);

  // Define chart configurations for each tab
  const chartConfigs = {
    pricing: {
      price: { label: 'Price', color: '#ef4444' }
    },
    trends: {
      'Your Company': { label: 'Your Company', color: '#ef4444' },
      'ETH': { label: 'ETH', color: '#60a5fa' },
      'NuPharm': { label: 'NuPharm', color: '#4ade80' },
      'Lexon': { label: 'Lexon', color: '#f97316' },
      'AAH': { label: 'AAH', color: '#8b5cf6' }
    },
    market: {
      marketShare: { label: 'Market Share', color: '#ef4444' }
    }
  };

  // Custom tooltip formatter for recharts
  const formatTooltipValue = (value: number | string) => {
    if (typeof value === 'number') {
      return `$${value.toFixed(2)}`;
    }
    return value;
  };

  if (isLoading || !competitors || competitors.length === 0) {
    return (
      <Card className="bg-gray-900/40 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-finance-red" />
            Competitor Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full bg-gray-800" />
            <Skeleton className="h-[300px] w-full bg-gray-800" />
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full bg-gray-800" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900/40 backdrop-blur-sm border-white/10">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-finance-red" />
          Competitor Analysis
        </CardTitle>
        <CardDescription>
          Analysis of {competitors.length} market competitors based on {engineData?.items?.length || 0} products
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList className="bg-gray-800/50">
            <TabsTrigger value="pricing">Pricing Comparison</TabsTrigger>
            <TabsTrigger value="trends">Price Trends</TabsTrigger>
            <TabsTrigger value="market">Market Position</TabsTrigger>
            <TabsTrigger value="competitiveness">Competitive Analysis</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pricing" className="pt-2">
            <div className="h-[300px]">
              <ChartContainer config={chartConfigs.pricing}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={competitors} layout="vertical" margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis type="number" domain={['dataMin - 5', 'dataMax + 5']} tickFormatter={(value) => `$${value}`} />
                    <YAxis dataKey="name" type="category" tick={{ fill: '#ccc' }} width={100} />
                    <Tooltip 
                      formatter={(value: number | string) => {
                        if (typeof value === 'number') {
                          return [`$${value.toFixed(2)}`, 'Price'];
                        }
                        return [value, 'Price'];
                      }}
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '6px' }} 
                    />
                    <Bar dataKey="price" fill="#ef4444" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
            
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {competitors.map((comp) => (
                <div key={comp.name} className={`p-3 rounded-lg ${comp.name === 'Your Company' ? 'bg-finance-red/20 border border-finance-red/30' : 'bg-gray-800/50'}`}>
                  <div className="text-sm font-medium mb-1">{comp.name}</div>
                  <div className="text-lg font-bold">${comp.price.toFixed(2)}</div>
                  <div className={`text-xs flex items-center mt-1 ${comp.priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {comp.priceChange >= 0 ? (
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 mr-1" />
                    )}
                    {Math.abs(comp.priceChange).toFixed(1)}% {comp.priceChange >= 0 ? 'increase' : 'decrease'}
                  </div>
                  <div className="mt-2 text-xs">
                    <Badge variant="outline" className="bg-blue-900/20 text-blue-300 border-blue-900">
                      {comp.lowPriceWins} lowest price wins
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="trends" className="pt-2">
            <div className="h-[300px]">
              <ChartContainer config={chartConfigs.trends}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="month" tick={{ fill: '#ccc' }} />
                    <YAxis domain={['dataMin - 5', 'dataMax + 5']} tickFormatter={(value) => `$${value}`} tick={{ fill: '#ccc' }} />
                    <Tooltip 
                      formatter={(value: number | string) => {
                        if (typeof value === 'number') {
                          return [`$${value.toFixed(2)}`, ''];
                        }
                        return [value, ''];
                      }}
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '6px' }} 
                    />
                    <Legend />
                    {competitors.map((comp, index) => (
                      <Line 
                        key={comp.name}
                        type="monotone" 
                        dataKey={comp.name} 
                        stroke={comp.name === 'Your Company' ? '#ef4444' : `hsl(${(index * 50) % 360}, 70%, 50%)`}
                        strokeWidth={comp.name === 'Your Company' ? 3 : 2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 6 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
            
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Price Trend Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-gray-800/50 rounded-lg">
                  <h4 className="text-sm font-medium flex items-center">
                    <Target className="h-4 w-4 mr-1 text-finance-red" />
                    Opportunities
                  </h4>
                  <p className="text-xs mt-1">
                    {competitors.find(c => c.name === 'Your Company')?.priceChange > 0 
                      ? "Your prices are trending upward, potentially creating opportunities to increase margins."
                      : "There's an opportunity to adjust prices as market trends show competitor prices are increasing."}
                  </p>
                </div>
                <div className="p-3 bg-gray-800/50 rounded-lg">
                  <h4 className="text-sm font-medium flex items-center">
                    <Shield className="h-4 w-4 mr-1 text-finance-red" />
                    Threats
                  </h4>
                  <p className="text-xs mt-1">
                    {competitors.filter(c => c.priceChange < 0).length > 1
                      ? `${competitors.filter(c => c.priceChange < 0).length} competitors are lowering their prices, which may put pressure on your margins.`
                      : "Market prices are relatively stable, but watch for sudden changes in competitor pricing."}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="market" className="pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-[300px]">
                <ChartContainer config={chartConfigs.market}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={competitors} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                      <XAxis dataKey="name" tick={{ fill: '#ccc' }} />
                      <YAxis tickFormatter={(value) => `${value}%`} tick={{ fill: '#ccc' }} />
                      <Tooltip 
                        formatter={(value: number | string) => {
                          if (typeof value === 'number') {
                            return [`${value.toFixed(1)}%`, 'Market Share'];
                          }
                          return [value, 'Market Share'];
                        }}
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '6px' }} 
                      />
                      <Bar 
                        dataKey="marketShare" 
                        fill="#ef4444" 
                        radius={[4, 4, 0, 0]} 
                        fillOpacity={0.8} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
              
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={competitors}
                      dataKey="lowPriceWins"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      label={({name, percent}) => `${name} (${(percent * 100).toFixed(1)}%)`}
                    >
                      {competitors.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${(index * 50) % 360}, 70%, 50%)`} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number | string) => [`${value} products`, 'Lowest Price Wins']}
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '6px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Market Position Insights</h3>
              <div className="p-3 bg-gray-800/50 rounded-lg">
                <h4 className="text-sm font-medium flex items-center">
                  <Zap className="h-4 w-4 mr-1 text-finance-red" />
                  Strategic Positioning
                </h4>
                <p className="text-xs mt-1">
                  {(() => {
                    const yourCompany = competitors.find(c => c.name === 'Your Company');
                    const competitors2 = competitors.filter(c => c.name !== 'Your Company');
                    if (!yourCompany) return "Market position analysis not available.";
                    
                    const lowestPriceCompetitor = [...competitors].sort((a, b) => a.price - b.price)[0];
                    const lowestPriceWinsLeader = [...competitors].sort((a, b) => b.lowPriceWins - a.lowPriceWins)[0];
                    
                    if (lowestPriceWinsLeader.name === 'Your Company') {
                      return `You are the price leader with ${yourCompany.lowPriceWins} products at the lowest market price. This strong competitive position allows for potential margin optimization on less price-sensitive items.`;
                    } else if (yourCompany.price < lowestPriceCompetitor.price) {
                      return `While your average prices are the lowest in the market, ${lowestPriceWinsLeader.name} offers more individual products at lowest prices. Consider targeted price adjustments to optimize market position while maintaining overall competitiveness.`;
                    } else {
                      const gap = ((yourCompany.price / lowestPriceCompetitor.price) - 1) * 100;
                      return `Your prices are approximately ${gap.toFixed(1)}% higher than ${lowestPriceCompetitor.name}, the lowest-priced competitor. Consider strategic price reductions on key high-volume products to improve competitive positioning.`;
                    }
                  })()}
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="competitiveness" className="pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart outerRadius={90} width={730} height={250} data={competitiveRadarData}>
                    <PolarGrid stroke="#444" />
                    <PolarAngleAxis dataKey="name" tick={{ fill: '#ccc' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#ccc' }} />
                    {competitors.map((comp, index) => (
                      <Radar
                        key={comp.name}
                        name={comp.name}
                        dataKey={comp === competitors[0] ? "pricing" : comp === competitors[1] ? "availability" : "consistency"}
                        stroke={comp.name === 'Your Company' ? '#ef4444' : `hsl(${(index * 50) % 360}, 70%, 50%)`}
                        fill={comp.name === 'Your Company' ? '#ef4444' : `hsl(${(index * 50) % 360}, 70%, 50%)`}
                        fillOpacity={0.6}
                      />
                    ))}
                    <Legend />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '6px' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="space-y-3">
                {competitors.map(comp => (
                  <div key={comp.name} className={`p-3 rounded-lg ${comp.name === 'Your Company' ? 'bg-finance-red/20 border border-finance-red/30' : 'bg-gray-800/50'}`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium">{comp.name}</span>
                      <Badge variant={comp.competitiveness.overall > 75 ? "default" : "outline"} 
                        className={`${
                          comp.competitiveness.overall > 75 ? 'bg-green-600' : 
                          comp.competitiveness.overall > 50 ? 'bg-yellow-600/50 text-yellow-300' : 
                          'bg-red-900/20 text-red-400'
                        }`}>
                        {comp.competitiveness.overall}/100
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-1 text-xs mt-2">
                      <div>
                        <div className="text-muted-foreground">Pricing</div>
                        <div className="font-medium">{comp.competitiveness.pricing}%</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Availability</div>
                        <div className="font-medium">{comp.competitiveness.availability}%</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Consistency</div>
                        <div className="font-medium">{comp.competitiveness.consistency}%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Competitive Intelligence Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-gray-800/50 rounded-lg">
                  <h4 className="text-sm font-medium flex items-center">
                    <Zap className="h-4 w-4 mr-1 text-finance-red" />
                    Strength Assessment
                  </h4>
                  <p className="text-xs mt-1">
                    {(() => {
                      const yourCompany = competitors.find(c => c.name === 'Your Company');
                      if (!yourCompany) return "Competitor assessment not available.";
                      
                      let strengths = [];
                      if (yourCompany.competitiveness.pricing > 70) strengths.push("competitive pricing");
                      if (yourCompany.competitiveness.availability > 70) strengths.push("product availability");
                      if (yourCompany.competitiveness.consistency > 70) strengths.push("pricing consistency");
                      
                      return strengths.length > 0 
                        ? `Your company shows strong performance in ${strengths.join(", ")}. Leverage these strengths when communicating with customers and in marketing materials.`
                        : "While no standout strengths were identified, your overall market positioning provides a foundation to build competitive advantages.";
                    })()}
                  </p>
                </div>
                <div className="p-3 bg-gray-800/50 rounded-lg">
                  <h4 className="text-sm font-medium flex items-center">
                    <Shield className="h-4 w-4 mr-1 text-finance-red" />
                    Competitor Insights
                  </h4>
                  <p className="text-xs mt-1">
                    {(() => {
                      const topCompetitor = [...competitors]
                        .filter(c => c.name !== 'Your Company')
                        .sort((a, b) => b.competitiveness.overall - a.competitiveness.overall)[0];
                      
                      if (!topCompetitor) return "Competitor insights not available.";
                      
                      let strength = "pricing";
                      if (topCompetitor.competitiveness.availability > topCompetitor.competitiveness.pricing && 
                          topCompetitor.competitiveness.availability > topCompetitor.competitiveness.consistency) {
                        strength = "product availability";
                      } else if (topCompetitor.competitiveness.consistency > topCompetitor.competitiveness.pricing) {
                        strength = "pricing consistency";
                      }
                      
                      return `${topCompetitor.name} is your strongest competitor with a ${topCompetitor.competitiveness.overall}/100 competitive score. They excel particularly in ${strength}, which should inform your competitive response strategy.`;
                    })()}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CompetitorAnalysis;
