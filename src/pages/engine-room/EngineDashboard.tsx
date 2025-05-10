
import React from 'react';
import { EngineRoomProvider, useEngineRoom } from '@/contexts/EngineRoomContext';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Info, UploadCloud } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import MetricCard from '@/components/MetricCard';
import UsageWeightedMetrics from '@/components/engine-room/UsageWeightedMetrics';
import MarketTrendAnalysis from '@/components/engine-room/MarketTrendAnalysis';
import RevaMetricsChart from '@/components/engine-room/RevaMetricsChart';

const EngineDashboardContent = () => {
  const {
    engineData,
    isUploading,
    uploadProgress,
    errorMessage,
    handleFileUpload
  } = useEngineRoom();
  
  // Calculate metrics
  const getMetrics = () => {
    if (!engineData) return {
      totalItems: 0,
      activeItems: 0,
      totalRevenue: 0,
      totalProfit: 0,
      overallMargin: 0,
      rule1Flags: 0,
      rule2Flags: 0,
      profitDelta: 0,
      marginLift: 0
    };
    
    return {
      totalItems: engineData.totalItems || 0,
      activeItems: engineData.activeItems || 0,
      totalRevenue: engineData.totalRevenue || 0,
      totalProfit: engineData.totalProfit || 0,
      overallMargin: engineData.overallMargin || 0,
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
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">REVA Pricing Dashboard</h1>
          <p className="text-muted-foreground">Visualize and analyze REVA pricing data</p>
        </div>

        <div 
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-all
            ${isUploading ? "pointer-events-none" : "border-gray-700 hover:border-primary/50"}`}
        >
          <div className="flex flex-col items-center justify-center space-y-4">
            <UploadCloud className="h-12 w-12 text-gray-400" />
            <div className="space-y-1">
              <h3 className="text-lg font-medium">Upload REVA Pricing Sheet</h3>
              <p className="text-sm text-muted-foreground">
                Drag and drop your Excel or CSV file to begin analysis
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Required columns: Description, REVA Usage, Usage Rank, AvgCost, Next Buying Price, Current REVA Price
              </p>
            </div>
          </div>

          {isUploading && (
            <div className="mt-6 w-full max-w-md mx-auto">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-sm mt-2 text-muted-foreground">
                Processing file... {Math.round(uploadProgress)}%
              </p>
            </div>
          )}
        </div>
        
        {errorMessage && (
          <Alert variant="destructive" className="mt-4">
            <div className="flex items-start">
              <Info className="h-4 w-4 mr-2 mt-0.5" />
              <div>
                <AlertTitle>Error processing file</AlertTitle>
                <AlertDescription className="mt-1">{errorMessage}</AlertDescription>
              </div>
            </div>
          </Alert>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">REVA Pricing Dashboard</h1>
        <p className="text-muted-foreground">Analytics and insights for your pricing data</p>
      </div>

      {/* Metrics cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Total SKUs"
          value={`${metrics.totalItems}`}
          subtitle={`${metrics.activeItems} active SKUs`}
        />
        <MetricCard
          title="Total Profit"
          value={`£${metrics.totalProfit.toLocaleString()}`}
          change={{
            value: `${metrics.profitDelta > 0 ? '+' : ''}${metrics.profitDelta.toFixed(2)}%`,
            type: metrics.profitDelta >= 0 ? 'increase' : 'decrease'
          }}
        />
        <MetricCard
          title="Overall Margin"
          value={`${metrics.overallMargin.toFixed(2)}%`}
          change={{
            value: `${metrics.marginLift > 0 ? '+' : ''}${metrics.marginLift.toFixed(2)}%`,
            type: metrics.marginLift >= 0 ? 'increase' : 'decrease'
          }}
        />
        <MetricCard
          title="Flagged Items"
          value={`${metrics.rule1Flags + metrics.rule2Flags}`}
          subtitle={`Rule 1: ${metrics.rule1Flags} | Rule 2: ${metrics.rule2Flags}`}
        />
      </div>

      {/* REVA Metrics Chart - Moved up */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Pricing Analysis</h2>
        <div className="border border-white/10 bg-gray-900/40 backdrop-blur-sm rounded-lg p-4">
          <RevaMetricsChart data={engineData.chartData || []} />
        </div>
      </div>

      {/* Usage-Weighted Metrics Section */}
      <UsageWeightedMetrics data={engineData.items || []} />

      {/* Market Trend Analysis - Using updated UI style */}
      <MarketTrendAnalysis data={engineData.items || []} />
    </div>
  );
};

// Wrapper component to provide context
const EngineDashboard = () => (
  <EngineRoomProvider>
    <EngineDashboardContent />
  </EngineRoomProvider>
);

export default EngineDashboard;
