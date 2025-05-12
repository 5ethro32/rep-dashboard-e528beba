
import React, { useEffect, useState } from 'react';
import { EngineRoomProvider, useEngineRoom } from '@/contexts/EngineRoomContext';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Info, UploadCloud, Package, TrendingUp, Percent, Flag, DollarSign, RefreshCw, Trash2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import MetricCard from '@/components/MetricCard';
import UsageWeightedMetrics from '@/components/engine-room/UsageWeightedMetrics';
import MarketTrendAnalysis from '@/components/engine-room/MarketTrendAnalysis';
import RevaMetricsChartUpdated from '@/components/engine-room/RevaMetricsChartUpdated';
import PricingRuleToggle from '@/components/engine-room/PricingRuleToggle';
import ImpactAnalysis from '@/components/engine-room/ImpactAnalysis';
import { formatCurrency, calculateUsageWeightedMetrics } from '@/utils/formatting-utils';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';

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
  const [activeRule, setActiveRule] = useState('current');

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

  // Handle rule toggle change
  const handleRuleChange = (rule: string) => {
    setActiveRule(rule);
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

  // Calculate metrics for different pricing rule views
  const getUsageMetricsForCurrentView = () => {
    if (!engineData || !engineData.items) return null;

    const items = engineData.items || [];
    const currentMetrics = calculateUsageWeightedMetrics(items);
    
    // For proposed metrics, we need to determine which rule to apply
    let proposedItems;
    switch (activeRule) {
      case 'rule1':
        // Use Rule 1 prices
        proposedItems = items.map(item => ({
          ...item,
          proposedPrice: item.rule1Price || item.currentREVAPrice
        }));
        break;
      case 'rule2':
        // Use Rule 2 prices
        proposedItems = items.map(item => ({
          ...item,
          proposedPrice: item.rule2Price || item.currentREVAPrice
        }));
        break;
      case 'combined':
        // Use proposed prices (which should be the combined rules)
        proposedItems = items.map(item => ({
          ...item,
          proposedPrice: item.proposedPrice || item.currentREVAPrice
        }));
        break;
      default:
        // For 'current' view, use current prices as both current and proposed
        proposedItems = items;
    }
    
    const proposedMetrics = calculateUsageWeightedMetrics(proposedItems);
    
    return {
      current: currentMetrics,
      proposed: proposedMetrics
    };
  };
  
  const usageMetrics = getUsageMetricsForCurrentView();
  
  // Display the appropriate metrics based on the active rule
  const displayMetrics = activeRule === 'current' ? 
    usageMetrics?.current : 
    usageMetrics?.proposed;
  
  if (!usageMetrics || !displayMetrics) {
    // Handle case where metrics could not be calculated
    return <div>Error calculating metrics. Please check your data and try again.</div>;
  }
  
  return <div className="container mx-auto px-4 py-6">
      {/* Add more prominent reset buttons for clearing cache */}
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Engine Room Dashboard</h1>
        <div className="flex gap-2">
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
      
      {/* Add pricing rule toggle */}
      <div className="mb-4">
        <PricingRuleToggle activeRule={activeRule} onRuleChange={handleRuleChange} />
      </div>
      
      {/* Add impact analysis section (visible only when not in current view) */}
      {activeRule !== 'current' && (
        <ImpactAnalysis 
          currentMetrics={usageMetrics.current} 
          proposedMetrics={usageMetrics.proposed}
          activeRule={activeRule}
        />
      )}
      
      {/* Master container card for all metrics */}
      <Card className="mb-8 border border-white/10 bg-gray-950/60 backdrop-blur-sm shadow-lg">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            {activeRule === 'current' ? 'Current Pricing Metrics' : 'Projected Pricing Metrics'}
          </h2>
          
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
              value={`${displayMetrics.weightedMargin.toFixed(2)}%`}
              icon={<Percent className="h-5 w-5" />} 
              iconPosition="right"
              change={
                activeRule !== 'current' ? {
                  value: `${Math.abs(usageMetrics.proposed.weightedMargin - usageMetrics.current.weightedMargin).toFixed(2)}%`,
                  type: usageMetrics.proposed.weightedMargin >= usageMetrics.current.weightedMargin ? 'increase' : 'decrease'
                } : undefined
              }
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
          
          {/* Margin Analysis Metrics - Now integrated into the main dashboard card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <MetricCard 
              title="Usage-Weighted Margin" 
              value={`${displayMetrics.weightedMargin.toFixed(2)}%`} 
              icon={<Percent className="h-5 w-5" />}
              iconPosition="right"
              change={
                activeRule !== 'current' ? {
                  value: `${Math.abs(usageMetrics.proposed.weightedMargin - usageMetrics.current.weightedMargin).toFixed(2)}%`,
                  type: usageMetrics.proposed.weightedMargin >= usageMetrics.current.weightedMargin ? 'increase' : 'decrease'
                } : undefined
              }
            />
            
            <MetricCard 
              title="Total Revenue (Usage-Weighted)" 
              value={formatCurrency(displayMetrics.totalRevenue)} 
              subtitle={`${displayMetrics.totalUsage.toLocaleString()} total units`}
              icon={<DollarSign className="h-5 w-5" />}
              iconPosition="right"
              change={
                activeRule !== 'current' ? {
                  value: `${Math.abs(((usageMetrics.proposed.totalRevenue - usageMetrics.current.totalRevenue) / usageMetrics.current.totalRevenue) * 100).toFixed(2)}%`,
                  type: usageMetrics.proposed.totalRevenue >= usageMetrics.current.totalRevenue ? 'increase' : 'decrease'
                } : undefined
              }
            />
            
            <MetricCard 
              title="Usage-Weighted Profit" 
              value={formatCurrency(displayMetrics.totalProfit)} 
              icon={<TrendingUp className="h-5 w-5" />}
              iconPosition="right"
              change={
                activeRule !== 'current' ? {
                  value: `${Math.abs(((usageMetrics.proposed.totalProfit - usageMetrics.current.totalProfit) / usageMetrics.current.totalProfit) * 100).toFixed(2)}%`,
                  type: usageMetrics.proposed.totalProfit >= usageMetrics.current.totalProfit ? 'increase' : 'decrease'
                } : undefined
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* REVA Metrics Chart - Using the updated chart component */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Pricing Analysis</h2>
        <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm shadow-lg">
          <CardContent className="p-4">
            <RevaMetricsChartUpdated 
              data={engineData.chartData || []} 
              showProposed={activeRule !== 'current'} 
              activeRule={activeRule}
            />
          </CardContent>
        </Card>
      </div>

      {/* Margin Distribution Charts - Now rendered separately */}
      <UsageWeightedMetrics 
        data={activeRule === 'current' ? 
          engineData.items || [] : 
          (engineData.items || []).map(item => ({
            ...item,
            currentREVAPrice: 
              activeRule === 'rule1' ? (item.rule1Price || item.currentREVAPrice) :
              activeRule === 'rule2' ? (item.rule2Price || item.currentREVAPrice) :
              activeRule === 'combined' ? (item.proposedPrice || item.currentREVAPrice) :
              item.currentREVAPrice
          }))}
        showingProjected={activeRule !== 'current'}
        ruleName={
          activeRule === 'rule1' ? 'Rule 1 (Market-based)' :
          activeRule === 'rule2' ? 'Rule 2 (Margin-based)' :
          activeRule === 'combined' ? 'Combined Rules' :
          'Current'
        }
      />

      {/* Market Trend Analysis */}
      <MarketTrendAnalysis data={engineData.items || []} />
    </div>;
};

// Wrapper component to provide context
const EngineDashboard = () => <EngineRoomProvider>
    <EngineDashboardContent />
  </EngineRoomProvider>;
export default EngineDashboard;
