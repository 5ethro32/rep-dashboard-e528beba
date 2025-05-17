
import React, { useEffect, useRef, useState } from 'react';
import { EngineRoomProvider, useEngineRoom } from '@/contexts/EngineRoomContext';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Info, UploadCloud, Package, TrendingUp, Percent, Flag, DollarSign } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import MetricCard from '@/components/MetricCard';
import UsageWeightedMetrics from '@/components/engine-room/UsageWeightedMetrics';
import MarketTrendAnalysis from '@/components/engine-room/MarketTrendAnalysis';
import RevaMetricsChartUpdated from '@/components/engine-room/RevaMetricsChartUpdated';
import { formatCurrency, calculateUsageWeightedMetrics } from '@/utils/formatting-utils';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';

// Micro component for donut chart to use on card backs
const MicroDonutChart = ({ percentage, color = '#10b981' }) => {
  const radius = 40;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex items-center justify-center h-full">
      <div className="relative flex items-center justify-center">
        <svg width="100" height="100" viewBox="0 0 100 100">
          <circle
            className="text-gray-800"
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="50"
            cy="50"
          />
          <circle
            className="text-primary"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke={color}
            fill="transparent"
            r={radius}
            cx="50"
            cy="50"
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div className="absolute text-xl font-bold text-white">
          {percentage.toFixed(1)}%
        </div>
      </div>
    </div>
  );
};

// Micro bar chart component for card backs
const MicroBarChart = ({ data, title }) => {
  const max = Math.max(...data.map(d => d.value));
  
  return (
    <div className="flex flex-col h-full">
      <div className="text-sm font-medium mb-2">{title}</div>
      <div className="flex-1 flex items-end space-x-1">
        {data.map((item, i) => (
          <div key={i} className="flex flex-col items-center flex-1">
            <div className="w-full bg-gray-800 rounded-t overflow-hidden" style={{ 
              height: `${(item.value / max * 100)}%`,
              minHeight: '10%',
              backgroundColor: item.color || '#10b981'
            }}></div>
            <div className="text-[10px] mt-1 text-white/60">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const EngineDashboardContent = () => {
  const {
    engineData,
    isUploading,
    uploadProgress,
    errorMessage,
    handleFileUpload
  } = useEngineRoom();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [usageMetrics, setUsageMetrics] = useState({
    weightedMargin: 0,
    proposedWeightedMargin: 0,
    marginImprovement: 0,
    businessMargin: 0,
    proposedBusinessMargin: 0,
    businessMarginImprovement: 0,
    totalRevenue: 0,
    proposedRevenue: 0,
    totalProfit: 0,
    proposedProfit: 0,
    totalUsage: 0
  });
  const [isMounted, setIsMounted] = useState(true);

  // Set mounted state
  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

  // Add a function to clear cache and force recalculation
  const handleClearCache = () => {
    localStorage.removeItem('engineRoomData');
    queryClient.invalidateQueries({
      queryKey: ['engineRoomData']
    });
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
  
  // Calculate usage-weighted metrics safely
  useEffect(() => {
    if (engineData?.items && engineData.items.length > 0 && isMounted) {
      try {
        const calculatedMetrics = calculateUsageWeightedMetrics(engineData.items || []);
        if (isMounted) {
          setUsageMetrics(calculatedMetrics);
          console.log('EngineDashboard: usageMetrics calculated', {
            weightedMargin: calculatedMetrics.weightedMargin,
            proposedWeightedMargin: calculatedMetrics.proposedWeightedMargin,
            marginImprovement: calculatedMetrics.marginImprovement,
            businessMargin: calculatedMetrics.businessMargin,
            proposedBusinessMargin: calculatedMetrics.proposedBusinessMargin,
            businessMarginImprovement: calculatedMetrics.businessMarginImprovement
          });
        }
      } catch (error) {
        console.error('Error calculating usage metrics:', error);
      }
    }
  }, [engineData?.items, isMounted]);

  // Functions for generating back content
  const generateSKUChartData = () => {
    return [
      { label: 'Active', value: metrics.activeItems, color: '#10b981' },
      { label: 'Inactive', value: metrics.totalItems - metrics.activeItems, color: '#6b7280' }
    ];
  };

  const generateMarginDistribution = () => {
    // Simple mock data for margin distribution
    return [
      { label: '<0%', value: 5, color: '#ef4444' },
      { label: '0-5%', value: 15, color: '#f97316' },
      { label: '5-10%', value: 30, color: '#eab308' },
      { label: '10-15%', value: 25, color: '#84cc16' },
      { label: '>15%', value: 25, color: '#10b981' },
    ];
  };

  const generateFlagDistribution = () => {
    return [
      { label: 'Rule 1', value: metrics.rule1Flags, color: '#f97316' },
      { label: 'Rule 2', value: metrics.rule2Flags, color: '#84cc16' }
    ];
  };

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
  
  // Handler for clicking upload area
  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };
  
  // Handle file selection from input
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  };
  
  if (!engineData) {
    return <div className="container mx-auto px-4 py-6">
        <div 
          onDragOver={handleDragOver} 
          onDrop={handleDrop}
          onClick={handleClickUpload}
          className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-all mt-4
            ${isUploading ? "pointer-events-none" : "border-gray-700 hover:border-primary/50"}`}
        >
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden"
            accept=".xlsx,.csv"
            onChange={handleFileInputChange}
          />
        
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

  // Calculate revenue and profit improvements for the metric cards
  const revenueImprovement = usageMetrics.proposedRevenue > 0 && usageMetrics.totalRevenue > 0 ? 
    (usageMetrics.proposedRevenue - usageMetrics.totalRevenue) / usageMetrics.totalRevenue * 100 : 0;
  const profitImprovement = usageMetrics.proposedProfit > 0 && usageMetrics.totalProfit > 0 ? 
    (usageMetrics.proposedProfit - usageMetrics.totalProfit) / usageMetrics.totalProfit * 100 : 0;

  // Log the calculated metrics for debugging
  console.log('EngineDashboard: Calculated usage-weighted metrics:', {
    weightedMargin: usageMetrics.weightedMargin,
    businessMargin: usageMetrics.businessMargin,
    totalRevenue: usageMetrics.totalRevenue,
    totalProfit: usageMetrics.totalProfit
  });
  
  return <div className="container mx-auto px-4 py-6">
      {/* Primary metrics - Updated to have 4 cards with Usage-Weighted Margin replacing Overall Margin */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <MetricCard 
          title="Total Active SKUs" 
          value={metrics.activeItems.toString()} 
          subtitle={`${metrics.totalItems} total SKUs`} 
          icon={<Package className="h-5 w-5" />} 
          iconPosition="right" 
          flippable={true}
          backContent={<MicroBarChart data={generateSKUChartData()} title="SKU Distribution" />}
        />
        
        <MetricCard 
          title="Usage-Weighted Margin" 
          value={`${usageMetrics.weightedMargin.toFixed(2)}%`} 
          icon={<Percent className="h-5 w-5" />} 
          iconPosition="right"
          subtitle="Weighted by usage volume"
          details="Average margin across products"
          flippable={true}
          backContent={<MicroDonutChart percentage={usageMetrics.weightedMargin} />}
        />
        
        <MetricCard 
          title="Average Cost < Market Low" 
          value={`${metrics.avgCostLessThanMLCount}`} 
          subtitle={`${Math.round(metrics.avgCostLessThanMLCount / metrics.totalItems * 100)}% of items`} 
          icon={<TrendingUp className="h-5 w-5" />} 
          iconPosition="right" 
          flippable={true}
          backContent={<MicroDonutChart 
            percentage={(metrics.avgCostLessThanMLCount / metrics.totalItems * 100)}
            color="#84cc16" 
          />}
        />
        
        <MetricCard 
          title="Flagged Items" 
          value={`${metrics.rule1Flags + metrics.rule2Flags}`} 
          subtitle={`Rule 1: ${metrics.rule1Flags} | Rule 2: ${metrics.rule2Flags}`} 
          icon={<Flag className="h-5 w-5" />} 
          iconPosition="right" 
          flippable={true}
          backContent={<MicroBarChart data={generateFlagDistribution()} title="Flag Distribution" />}
        />
      </div>
      
      {/* Business Margin and Analysis Metrics - Updated to have 3 cards, removing Usage-Weighted Margin */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
        <MetricCard 
          title="Total Business Margin" 
          value={`${usageMetrics.businessMargin.toFixed(2)}%`} 
          icon={<Percent className="h-5 w-5" />} 
          iconPosition="right" 
          subtitle="Total Profit ÷ Total Revenue"
          details="Best measure of overall financial performance"
          change={usageMetrics.businessMarginImprovement !== 0 ? {
            value: `${usageMetrics.businessMarginImprovement > 0 ? '+' : ''}${usageMetrics.businessMarginImprovement.toFixed(2)}%`,
            type: usageMetrics.businessMarginImprovement >= 0 ? 'increase' : 'decrease'
          } : undefined}
          flippable={true}
          backContent={<MicroDonutChart 
            percentage={usageMetrics.businessMargin} 
            color="#8b5cf6"
          />}
        />
        
        <MetricCard 
          title="Total Revenue" 
          value={formatCurrency(usageMetrics.totalRevenue)} 
          subtitle={`${usageMetrics.totalUsage.toLocaleString()} total units`} 
          icon={<DollarSign className="h-5 w-5" />} 
          iconPosition="right" 
          change={revenueImprovement !== 0 ? {
            value: `${revenueImprovement > 0 ? '+' : ''}${revenueImprovement.toFixed(2)}%`,
            type: revenueImprovement >= 0 ? 'increase' : 'decrease'
          } : undefined}
          flippable={true}
          backContent={<div className="flex flex-col h-full justify-center items-center">
            <div className="text-sm font-medium mb-2">Revenue Breakdown</div>
            <div className="text-lg font-bold">{formatCurrency(usageMetrics.totalRevenue)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Proposed: {formatCurrency(usageMetrics.proposedRevenue)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Difference: {formatCurrency(usageMetrics.proposedRevenue - usageMetrics.totalRevenue)}
            </div>
          </div>}
        />
        
        <MetricCard 
          title="Total Profit" 
          value={formatCurrency(usageMetrics.totalProfit)} 
          icon={<TrendingUp className="h-5 w-5" />} 
          iconPosition="right" 
          change={profitImprovement !== 0 ? {
            value: `${profitImprovement > 0 ? '+' : ''}${profitImprovement.toFixed(2)}%`,
            type: profitImprovement >= 0 ? 'increase' : 'decrease'
          } : undefined}
          flippable={true}
          backContent={<div className="flex flex-col h-full justify-center items-center">
            <div className="text-sm font-medium mb-2">Profit Breakdown</div>
            <div className="text-lg font-bold">{formatCurrency(usageMetrics.totalProfit)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Proposed: {formatCurrency(usageMetrics.proposedProfit)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Improvement: {formatCurrency(usageMetrics.proposedProfit - usageMetrics.totalProfit)}
            </div>
          </div>}
        />
      </div>

      {/* REVA Metrics Chart - Using the updated chart component */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Pricing Analysis</h2>
        <Card className="border border-white/10 bg-gradient-to-b from-gray-950 to-gray-900 backdrop-blur-sm shadow-lg">
          <CardContent className="p-4">
            <RevaMetricsChartUpdated data={engineData.chartData || []} />
          </CardContent>
        </Card>
      </div>

      {/* Margin Distribution Charts with business margin - Using the updated component */}
      <UsageWeightedMetrics data={engineData.items || []} showProposed={true} />

      {/* Market Trend Analysis */}
      <MarketTrendAnalysis data={engineData.items || []} />
    </div>;
};

// Wrapper component to provide context
const EngineDashboard = () => <EngineRoomProvider>
    <EngineDashboardContent />
  </EngineRoomProvider>;
export default EngineDashboard;
