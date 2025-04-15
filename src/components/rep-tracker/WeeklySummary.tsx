
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/utils/rep-performance-utils';

interface WeeklySummaryProps {
  data: {
    totalVisits: number;
    totalProfit: number;
    totalOrders: number;
    conversionRate: number;
    dailyAvgProfit: number;
    avgProfitPerVisit: number;
    avgProfitPerOrder: number;
  };
  weekStartDate: Date;
  weekEndDate: Date;
}

const WeeklySummary: React.FC<WeeklySummaryProps> = ({ data, weekStartDate, weekEndDate }) => {
  return (
    <div className="mb-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Visits */}
        <Card className="border-none bg-black/20 text-white">
          <CardHeader className="py-3 pb-1">
            <CardTitle className="text-sm text-white/60 font-normal">Total Visits</CardTitle>
          </CardHeader>
          <CardContent className="py-1">
            <p className="text-2xl font-bold">{data.totalVisits}</p>
          </CardContent>
        </Card>
        
        {/* Total Profit */}
        <Card className="border-none bg-black/20 text-white">
          <CardHeader className="py-3 pb-1">
            <CardTitle className="text-sm text-white/60 font-normal">Total Profit</CardTitle>
          </CardHeader>
          <CardContent className="py-1">
            <p className="text-2xl font-bold">{formatCurrency(data.totalProfit)}</p>
          </CardContent>
        </Card>
        
        {/* Total Orders */}
        <Card className="border-none bg-black/20 text-white">
          <CardHeader className="py-3 pb-1">
            <CardTitle className="text-sm text-white/60 font-normal">Total Orders</CardTitle>
          </CardHeader>
          <CardContent className="py-1">
            <p className="text-2xl font-bold">{data.totalOrders}</p>
          </CardContent>
        </Card>
        
        {/* Conversion Rate */}
        <Card className="border-none bg-black/20 text-white">
          <CardHeader className="py-3 pb-1">
            <CardTitle className="text-sm text-white/60 font-normal">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent className="py-1">
            <p className="text-2xl font-bold">{data.conversionRate}%</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        {/* Daily Avg Profit */}
        <Card className="border-none bg-black/20 text-white">
          <CardHeader className="py-3 pb-1">
            <CardTitle className="text-sm text-white/60 font-normal">Daily Avg Profit</CardTitle>
          </CardHeader>
          <CardContent className="py-1">
            <p className="text-2xl font-bold">{formatCurrency(data.dailyAvgProfit)}</p>
          </CardContent>
        </Card>
        
        {/* Avg Profit Per Visit */}
        <Card className="border-none bg-black/20 text-white">
          <CardHeader className="py-3 pb-1">
            <CardTitle className="text-sm text-white/60 font-normal">Avg Profit Per Visit</CardTitle>
          </CardHeader>
          <CardContent className="py-1">
            <p className="text-2xl font-bold">{formatCurrency(data.avgProfitPerVisit)}</p>
          </CardContent>
        </Card>
        
        {/* Avg Profit Per Order */}
        <Card className="border-none bg-black/20 text-white">
          <CardHeader className="py-3 pb-1">
            <CardTitle className="text-sm text-white/60 font-normal">Avg Profit Per Order</CardTitle>
          </CardHeader>
          <CardContent className="py-1">
            <p className="text-2xl font-bold">{formatCurrency(data.avgProfitPerOrder)}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WeeklySummary;
