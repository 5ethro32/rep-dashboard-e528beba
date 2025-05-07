import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SummaryData, RepData } from '@/types/rep-performance.types';  // Add RepData import
import { formatCurrency, formatPercent, formatNumber } from '@/utils/rep-performance-utils';
import { Skeleton } from "@/components/ui/skeleton";

interface TrendLineChartProps {
  febSummary: SummaryData;
  marchSummary: SummaryData;
  aprilSummary: SummaryData;
  maySummary: SummaryData;
  isLoading?: boolean;
  repDataProp: {
    february: RepData[];
    march: RepData[];
    april: RepData[];
    may: RepData[];
  };
  includeRetail: boolean;
  includeReva: boolean;
  includeWholesale: boolean;
  selectedUserName?: string;
}

const TrendLineChart: React.FC<TrendLineChartProps> = ({
  febSummary,
  marchSummary,
  aprilSummary,
  maySummary,
  isLoading,
  repDataProp,
  includeRetail,
  includeReva,
  includeWholesale,
  selectedUserName = 'All Data'
}) => {
  const [activeTab, setActiveTab] = useState('revenue');

  // Function to generate dynamic title prefix
  const getTitlePrefix = () => {
    if (!selectedUserName || selectedUserName === 'All Data') return '';
    if (selectedUserName === 'My Data') return 'My ';
    return `${selectedUserName}'s `;
  };

  const titlePrefix = getTitlePrefix();

  // Prepare data for the chart
  const data = [
    {
      name: 'February',
      revenue: febSummary.totalSpend,
      profit: febSummary.totalProfit,
      margin: febSummary.averageMargin,
      packs: febSummary.totalPacks,
    },
    {
      name: 'March',
      revenue: marchSummary.totalSpend,
      profit: marchSummary.totalProfit,
      margin: marchSummary.averageMargin,
      packs: marchSummary.totalPacks,
    },
    {
      name: 'April',
      revenue: aprilSummary.totalSpend,
      profit: aprilSummary.totalProfit,
      margin: aprilSummary.averageMargin,
      packs: aprilSummary.totalPacks,
    },
    {
      name: 'May',
      revenue: maySummary.totalSpend,
      profit: maySummary.totalProfit,
      margin: maySummary.averageMargin,
      packs: maySummary.totalPacks,
    },
  ];

  // Determine which data key to use based on the active tab
  const dataKey = activeTab === 'revenue' ? 'revenue' : activeTab === 'profit' ? 'profit' : activeTab === 'margin' ? 'margin' : 'packs';

  // Format tooltip content based on the active tab
  const formatTooltip = (value: number) => {
    if (activeTab === 'revenue' || activeTab === 'profit') {
      return formatCurrency(value, 0);
    } else if (activeTab === 'margin') {
      return formatPercent(value);
    } else {
      return formatNumber(value);
    }
  };

  const renderSkeleton = () => (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle className="text-lg">
          <Skeleton className="h-6 w-64" />
        </CardTitle>
      </CardHeader>
      <CardContent className="pl-2 flex justify-center items-center">
        <Skeleton className="w-[90%] h-48" />
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return renderSkeleton();
  }

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle className="text-lg">{titlePrefix}Performance Trend</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <Tabs defaultValue="revenue" className="w-full">
          <TabsList>
            <TabsTrigger value="revenue" onClick={() => setActiveTab('revenue')}>Revenue</TabsTrigger>
            <TabsTrigger value="profit" onClick={() => setActiveTab('profit')}>Profit</TabsTrigger>
            <TabsTrigger value="margin" onClick={() => setActiveTab('margin')}>Margin</TabsTrigger>
            <TabsTrigger value="packs" onClick={() => setActiveTab('packs')}>Packs</TabsTrigger>
          </TabsList>
          <TabsContent value="revenue">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => formatCurrency(value, 0)} />
                <Tooltip formatter={(value) => formatTooltip(value)} />
                <Legend />
                <Line type="monotone" dataKey={dataKey} stroke="#8884d8" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>
          <TabsContent value="profit">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => formatCurrency(value, 0)} />
                <Tooltip formatter={(value) => formatTooltip(value)} />
                <Legend />
                <Line type="monotone" dataKey={dataKey} stroke="#82ca9d" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>
          <TabsContent value="margin">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => formatPercent(value)} />
                <Tooltip formatter={(value) => formatTooltip(value)} />
                <Legend />
                <Line type="monotone" dataKey={dataKey} stroke="#ffc658" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>
          <TabsContent value="packs">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => formatNumber(value)} />
                <Tooltip formatter={(value) => formatTooltip(value)} />
                <Legend />
                <Line type="monotone" dataKey={dataKey} stroke="#a458ff" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TrendLineChart;
