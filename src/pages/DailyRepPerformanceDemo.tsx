import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import DailyProfitDistribution from '@/components/daily-rep-performance/DailyProfitDistribution';
import DailyMarginComparison from '@/components/daily-rep-performance/DailyMarginComparison';
import DailyRepProfitShare from '@/components/daily-rep-performance/DailyRepProfitShare';
import DailyDepartmentProfitShare from '@/components/daily-rep-performance/DailyDepartmentProfitShare';

const DailyRepPerformanceDemo = () => {
  // Mock data for testing
  const mockRepData = [
    { rep: 'Michael McKay', revenue: 180000, profit: 54000, margin: 30, orders: 145 },
    { rep: 'Sarah Johnson', revenue: 150000, profit: 45000, margin: 30, orders: 120 },
    { rep: 'Tom Williams', revenue: 125000, profit: 31250, margin: 25, orders: 98 },
    { rep: 'Emma Davis', revenue: 110000, profit: 33000, margin: 30, orders: 85 },
    { rep: 'James Brown', revenue: 95000, profit: 19000, margin: 20, orders: 75 },
    { rep: 'Lisa Garcia', revenue: 88000, profit: 22000, margin: 25, orders: 68 },
    { rep: 'Robert Miller', revenue: 76000, profit: 15200, margin: 20, orders: 55 },
    { rep: 'Jennifer Lee', revenue: 72000, profit: 21600, margin: 30, orders: 52 },
  ];

  const mockDepartmentData = [
    { department: 'Retail', revenue: 450000, profit: 135000, margin: 30, orders: 375 },
    { department: 'REVA', revenue: 250000, profit: 62500, margin: 25, orders: 200 },
    { department: 'Wholesale', revenue: 195000, profit: 43875, margin: 22.5, orders: 123 },
  ];

  const mockSummary = {
    revenue: 895000,
    profit: 241375,
    margin: 27,
    orders: 698
  };

  const mockFilters = {
    includeRetail: true,
    includeReva: true,
    includeWholesale: true
  };

  return (
    <div className="container max-w-7xl mx-auto px-4 md:px-6 py-8 bg-transparent">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Daily Sales Performance - Demo with Mock Data
        </h1>
        <p className="text-gray-400">
          This page demonstrates the charts with mock data to verify they're working correctly.
        </p>
      </header>

      {/* Summary Metrics */}
      <Card className="bg-gray-900/40 backdrop-blur-sm border-white/10 mb-8">
        <CardContent className="pt-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-400">Revenue</p>
              <p className="text-xl font-bold text-white">
                £{(mockSummary.revenue / 1000).toFixed(1)}k
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-400">Profit</p>
              <p className="text-xl font-bold text-white">
                £{(mockSummary.profit / 1000).toFixed(1)}k
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-400">Margin</p>
              <p className="text-xl font-bold text-white">
                {mockSummary.margin.toFixed(1)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-400">Orders</p>
              <p className="text-xl font-bold text-white">
                {mockSummary.orders.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Top Row - Bar Charts */}
        <div className="h-[300px] md:h-[400px]">
          <DailyProfitDistribution
            data={mockRepData}
            comparisonData={[]}
            isLoading={false}
            showChangeIndicators={false}
          />
        </div>
        
        <div className="h-[300px] md:h-[400px]">
          <DailyMarginComparison
            data={mockRepData}
            comparisonData={[]}
            isLoading={false}
            showChangeIndicators={false}
          />
        </div>
        
        {/* Bottom Row - Donut Charts */}
        <div className="h-[300px] md:h-[400px]">
          <DailyRepProfitShare
            data={mockRepData}
            isLoading={false}
            totalProfit={mockSummary.profit}
          />
        </div>
        
        <div className="h-[300px] md:h-[400px]">
          <DailyDepartmentProfitShare
            data={mockDepartmentData}
            filters={mockFilters}
            isLoading={false}
          />
        </div>
      </div>

      {/* Mock Data Display */}
      <Card className="bg-gray-900/40 backdrop-blur-sm border-white/10">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Mock Data Being Used</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-300 mb-2">Rep Data (first 3):</h4>
              <pre className="text-xs bg-gray-800 p-3 rounded overflow-auto text-gray-400">
{JSON.stringify(mockRepData.slice(0, 3), null, 2)}
              </pre>
            </div>
            <div>
              <h4 className="font-medium text-gray-300 mb-2">Department Data:</h4>
              <pre className="text-xs bg-gray-800 p-3 rounded overflow-auto text-gray-400">
{JSON.stringify(mockDepartmentData, null, 2)}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyRepPerformanceDemo;