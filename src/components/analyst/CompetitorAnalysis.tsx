
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown } from 'lucide-react';

// Define the data structure
interface CompetitorData {
  name: string;
  price: number;
  marketShare: number;
  priceChange: number;
  historicalPrices: { month: string; price: number }[];
}

const competitors: CompetitorData[] = [
  {
    name: 'Your Company',
    price: 78.50,
    marketShare: 32,
    priceChange: 2.3,
    historicalPrices: [
      { month: 'Jan', price: 74.20 },
      { month: 'Feb', price: 75.10 },
      { month: 'Mar', price: 76.50 },
      { month: 'Apr', price: 77.20 },
      { month: 'May', price: 78.50 }
    ]
  },
  {
    name: 'CompPharma',
    price: 81.20,
    marketShare: 28,
    priceChange: 1.5,
    historicalPrices: [
      { month: 'Jan', price: 79.00 },
      { month: 'Feb', price: 79.50 },
      { month: 'Mar', price: 80.10 },
      { month: 'Apr', price: 80.70 },
      { month: 'May', price: 81.20 }
    ]
  },
  {
    name: 'MediCorp',
    price: 72.80,
    marketShare: 18,
    priceChange: -0.8,
    historicalPrices: [
      { month: 'Jan', price: 74.00 },
      { month: 'Feb', price: 73.70 },
      { month: 'Mar', price: 73.20 },
      { month: 'Apr', price: 73.00 },
      { month: 'May', price: 72.80 }
    ]
  },
  {
    name: 'PharmaTech',
    price: 85.30,
    marketShare: 12,
    priceChange: 3.1,
    historicalPrices: [
      { month: 'Jan', price: 81.00 },
      { month: 'Feb', price: 82.40 },
      { month: 'Mar', price: 83.50 },
      { month: 'Apr', price: 84.20 },
      { month: 'May', price: 85.30 }
    ]
  },
  {
    name: 'GeneriMed',
    price: 64.90,
    marketShare: 10,
    priceChange: -1.2,
    historicalPrices: [
      { month: 'Jan', price: 66.50 },
      { month: 'Feb', price: 66.00 },
      { month: 'Mar', price: 65.50 },
      { month: 'Apr', price: 65.20 },
      { month: 'May', price: 64.90 }
    ]
  }
];

// Prepare data for price trend chart
const prepareTrendData = (competitors: CompetitorData[]) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May'];
  return months.map(month => {
    const dataPoint: Record<string, string | number> = { month };
    
    competitors.forEach(comp => {
      const monthData = comp.historicalPrices.find(h => h.month === month);
      if (monthData) {
        dataPoint[comp.name] = monthData.price;
      }
    });
    
    return dataPoint;
  });
};

const CompetitorAnalysis: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('pricing');
  const trendData = prepareTrendData(competitors);

  // Custom tooltip formatter for recharts
  const formatTooltipValue = (value: number | string) => {
    if (typeof value === 'number') {
      return `$${value.toFixed(2)}`;
    }
    return value;
  };

  return (
    <Card className="bg-gray-900/40 backdrop-blur-sm border-white/10">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-finance-red" />
          Competitor Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList className="bg-gray-800/50">
            <TabsTrigger value="pricing">Pricing Comparison</TabsTrigger>
            <TabsTrigger value="trends">Price Trends</TabsTrigger>
            <TabsTrigger value="market">Market Share</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pricing" className="pt-2">
            <div className="h-[300px]">
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
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="trends" className="pt-2">
            <div className="h-[300px]">
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
            </div>
          </TabsContent>
          
          <TabsContent value="market" className="pt-2">
            <div className="h-[300px]">
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
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CompetitorAnalysis;
