
import React, { useEffect } from 'react';
import { EngineRoomProvider, useEngineRoom } from '@/contexts/EngineRoomContext';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Info, UploadCloud, Package, TrendingUp, Percent, Flag, DollarSign, RefreshCw, Trash2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import MetricCard from '@/components/MetricCard';
import UsageWeightedMetrics from '@/components/engine-room/UsageWeightedMetrics';
import MarketTrendAnalysis from '@/components/engine-room/MarketTrendAnalysis';
import RevaMetricsChartUpdated from '@/components/engine-room/RevaMetricsChartUpdated';
import { formatCurrency, calculateUsageWeightedMetrics } from '@/utils/formatting-utils';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';

const EngineDashboardContent = () => {
  const {
    engineData,
    isUploading,
    uploadProgress,
    errorMessage,
    handleFileUpload,
    applyMarginCap,
    setApplyMarginCap
  } = useEngineRoom();
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Add a function to clear cache and force recalculation
  const handleClearCache = () => {
    localStorage.removeItem('engineRoomData');
    queryClient.invalidateQueries({ queryKey: ['engineRoomData'] });
    toast({
      title: "Cache cleared",
      description: "The data cache has been cleared. Please upload your file again to see recalculated metrics."
    });
  };
  
  // Add a more aggressive cache reset
  const handleForceReset = () => {
    localStorage.removeItem('engineRoomData');
    queryClient.clear(); // Clear all query cache
    toast({
      title: "Complete Data Reset",
      description: "All cached data has been cleared. Please refresh the page and upload your file again."
    });
    // Force page refresh after a short delay
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  // Toggle margin cap application
  const handleToggleMarginCap = (checked: boolean) => {
    setApplyMarginCap(checked);
    toast({
      title: checked ? "Margin Cap Applied" : "Margin Cap Removed",
      description: checked 
        ? "Price calculations now include margin caps (10%, 20%, 30% by usage group)" 
        : "Price calculations now exclude margin caps for maximum profit"
    });
  };

  // Get metrics
  const getMetrics = () => {
    if (!engineData) return {
      totalItems: 0,
      activeItems: 0,
      totalRevenue: 0,
      totalProfit: 0,
      overallMargin: 0,
      avgCostLessThanMLCount: 0,
      rule1Flags: 0,
      rule2Flags: 0,
      profitDelta: 0,
      marginLift: 0
    };

    // Make sure we're using the correct overallMargin from the processed data
    return {
      totalItems: engineData.totalItems || 0,
      activeItems: engineData.activeItems || 0,
      totalRevenue: engineData.totalRevenue || 0,
      totalProfit: engineData.totalProfit || 0,
      overallMargin: engineData.overallMargin || 0,
      avgCostLessThanMLCount: engineData.avgCostLessThanMLCount || 0,
      rule1Flags: engineData.rule1Flags || 0,
      rule2Flags: engineData.rule2Flags || 0,
      profitDelta: engineData.profitDelta || 0,
      marginLift: engineData.marginLift || 0
    };
  };
  
  const metrics = getMetrics();

  // Handle drag and drop file upload
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };
  
  if (!engineData) {
    return <div className="container mx-auto px-4 py-6">
        <div onDragOver={handleDragOver} onDrop={handleDrop} className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-all mt-4
            ${isUploading ? "pointer-events-none" : "border-gray-700 hover:border-primary/50"}`}>
          <div className="flex flex-col items-center justify-center space-y-4">
            <UploadCloud className="h-12 w-12 text-gray-400" />
            <div className="space-y-1">
              <h3 className="text-lg font-medium">Upload Pricing Sheet</h3>
              <p className="text-sm text-muted-foreground">
                Drag and drop your Excel or CSV file to begin analysis
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Required columns: Description, REVA Usage, Usage Rank, AvgCost, Next Buying Price, Current REVA Price
              </p>
            </div>
          </div>

          {isUploading && <div className="mt-6 w-full max-w-md mx-auto">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-sm mt-2 text-muted-foreground">
                Processing file... {Math.round(uploadProgress)}%
              </p>
            </div>}
        </div>
        
        {errorMessage && <Alert variant="destructive" className="mt-4">
            <div className="flex items-start">
              <Info className="h-4 w-4 mr-2 mt-0.5" />
              <div>
                <AlertTitle>Error processing file</AlertTitle>
                <AlertDescription className="mt-1">{errorMessage}</AlertDescription>
              </div>
            </div>
          </Alert>}
      </div>;
  }

  // Get usage-weighted metrics with the correct calculation method
  // Get metrics with and without margin cap for comparison
  const usageMetrics = calculateUsageWeightedMetrics(engineData.items || []);
  const uncappedMetrics = calculateUsageWeightedMetrics(engineData.items || [], true);
  
  // Log the calculated metrics for debugging
  console.log('EngineDashboard: Calculated usage-weighted metrics:', {
    weightedMargin: usageMetrics.weightedMargin,
    totalRevenue: usageMetrics.totalRevenue,
    totalProfit: usageMetrics.totalProfit,
    uncappedWeightedMargin: uncappedMetrics.weightedMargin,
    uncappedRevenue: uncappedMetrics.totalRevenue, 
    uncappedProfit: uncappedMetrics.totalProfit
  });
  
  return <div className="container mx-auto px-4 py-6">
      {/* Add more prominent reset buttons for clearing cache */}
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Engine Room Dashboard</h1>
        <div className="flex gap-2">
          {/* Add margin cap toggle */}
          <div className="flex items-center space-x-2 mr-4 bg-gray-800 p-2 rounded-md">
            <Switch 
              id="margin-cap" 
              checked={applyMarginCap} 
              onCheckedChange={handleToggleMarginCap} 
            />
            <Label htmlFor="margin-cap" className="text-xs">
              {applyMarginCap ? "Margin Cap ON" : "Margin Cap OFF"}
            </Label>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleClearCache}
            className="flex items-center gap-2 text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reset Calculations
          </Button>
          
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleForceReset}
            className="flex items-center gap-2 text-xs"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Force Complete Reset
          </Button>
        </div>
      </div>
      
      {/* Master container card for all metrics */}
      <Card className="mb-8 border border-white/10 bg-gray-950/60 backdrop-blur-sm shadow-lg">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Pricing Metrics</h2>
          
          {/* Primary metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <MetricCard 
              title="Total Active SKUs" 
              value={metrics.activeItems.toString()} 
              subtitle={`${metrics.totalItems} total SKUs`} 
              icon={<Package className="h-5 w-5" />} 
              iconPosition="right" 
            />
            
            <MetricCard 
              title="Overall Margin" 
              value={`${metrics.overallMargin.toFixed(2)}%`}
              icon={<Percent className="h-5 w-5" />} 
              iconPosition="right" 
            />
            
            <MetricCard 
              title="Average Cost < Market Low" 
              value={`${metrics.avgCostLessThanMLCount}`} 
              subtitle={`${Math.round(metrics.avgCostLessThanMLCount / metrics.totalItems * 100)}% of items`} 
              icon={<TrendingUp className="h-5 w-5" />} 
              iconPosition="right" 
            />
            
            <MetricCard 
              title="Flagged Items" 
              value={`${metrics.rule1Flags + metrics.rule2Flags}`} 
              subtitle={`Rule 1: ${metrics.rule1Flags} | Rule 2: ${metrics.rule2Flags}`} 
              icon={<Flag className="h-5 w-5" />} 
              iconPosition="right" 
            />
          </div>
          
          {/* Margin Analysis Metrics - Now showing both current and proposed with/without cap */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
            <MetricCard 
              title="Usage-Weighted Margin" 
              value={`${usageMetrics.weightedMargin.toFixed(2)}%`} 
              icon={<Percent className="h-5 w-5" />}
              iconPosition="right"
              change={usageMetrics.marginImprovement !== 0 ? {
                value: `${usageMetrics.marginImprovement > 0 ? '+' : ''}${usageMetrics.marginImprovement.toFixed(2)}%`,
                type: usageMetrics.marginImprovement >= 0 ? 'increase' : 'decrease'
              } : undefined}
            />
            
            <MetricCard 
              title="Total Revenue (Usage-Weighted)" 
              value={formatCurrency(usageMetrics.totalRevenue)} 
              subtitle={`${usageMetrics.totalUsage.toLocaleString()} total units`}
              icon={<DollarSign className="h-5 w-5" />}
              iconPosition="right"
            />
            
            <MetricCard 
              title="Usage-Weighted Profit" 
              value={formatCurrency(usageMetrics.totalProfit)} 
              icon={<TrendingUp className="h-5 w-5" />}
              iconPosition="right"
            />
          </div>
          
          {/* Comparison metrics for capped vs. uncapped */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card className="border border-white/10 bg-gray-900/40 shadow-md">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2 text-sm text-gray-300">Profit Comparison: {applyMarginCap ? "With" : "Without"} Margin Cap</h3>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-400">Current</p>
                    <p className="text-lg font-medium">{formatCurrency(usageMetrics.totalProfit)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Without Cap</p>
                    <p className="text-lg font-medium">{formatCurrency(uncappedMetrics.totalProfit)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Difference</p>
                    <p className={`text-lg font-medium ${uncappedMetrics.totalProfit > usageMetrics.totalProfit ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(uncappedMetrics.totalProfit - usageMetrics.totalProfit)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border border-white/10 bg-gray-900/40 shadow-md">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2 text-sm text-gray-300">Margin Comparison: {applyMarginCap ? "With" : "Without"} Margin Cap</h3>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-400">Current</p>
                    <p className="text-lg font-medium">{usageMetrics.weightedMargin.toFixed(2)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Without Cap</p>
                    <p className="text-lg font-medium">{uncappedMetrics.weightedMargin.toFixed(2)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Difference</p>
                    <p className={`text-lg font-medium ${uncappedMetrics.weightedMargin > usageMetrics.weightedMargin ? 'text-green-400' : 'text-red-400'}`}>
                      {(uncappedMetrics.weightedMargin - usageMetrics.weightedMargin).toFixed(2)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* REVA Metrics Chart - Using the updated chart component */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Pricing Analysis</h2>
        <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm shadow-lg">
          <CardContent className="p-4">
            <RevaMetricsChartUpdated data={engineData.chartData || []} />
          </CardContent>
        </Card>
      </div>

      {/* Margin Distribution Charts - Now showing both current and proposed */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-2">Current Metrics</h3>
        <UsageWeightedMetrics data={engineData.items || []} showProposed={false} />
      </div>
      
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-2">
          {applyMarginCap ? "Proposed Metrics (With Margin Cap)" : "Proposed Metrics (Without Margin Cap)"}
        </h3>
        <UsageWeightedMetrics data={engineData.items || []} showProposed={true} />
      </div>

      {/* Market Trend Analysis */}
      <MarketTrendAnalysis data={engineData.items || []} />
    </div>;
};

// Wrapper component to provide context
const EngineDashboard = () => <EngineRoomProvider>
    <EngineDashboardContent />
  </EngineRoomProvider>;
export default EngineDashboard;
