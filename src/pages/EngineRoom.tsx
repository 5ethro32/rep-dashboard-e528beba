
import React, { useState, useCallback } from 'react';
import { UploadCloud, FileText, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MetricCard from '@/components/MetricCard';
import { processEngineExcelFile } from '@/utils/engine-excel-utils';
import EngineDataTable from '@/components/engine-room/EngineDataTable';
import PricingRuleExplainer from '@/components/engine-room/PricingRuleExplainer';
import ExceptionsTable from '@/components/engine-room/ExceptionsTable';
import RevaMetricsChart from '@/components/engine-room/RevaMetricsChart';
import ConfigurationPanel from '@/components/engine-room/ConfigurationPanel';

const EngineRoom: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedRuleConfig, setSelectedRuleConfig] = useState<string | null>(null);
  const [showPricingExplainer, setShowPricingExplainer] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Get cached data if available
  const { data: engineData, isLoading, error } = useQuery({
    queryKey: ['engineRoomData'],
    queryFn: () => {
      const cachedData = localStorage.getItem('engineRoomData');
      if (cachedData) {
        return JSON.parse(cachedData);
      }
      return null;
    },
    staleTime: Infinity // Don't refetch automatically
  });

  // Handle file drop
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.csv')) {
      toast({
        title: "Invalid file format",
        description: "Please upload an Excel (.xlsx) or CSV file.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsUploading(true);
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + Math.random() * 15;
          return newProgress >= 95 ? 95 : newProgress;
        });
      }, 200);

      // Process the file
      const processedData = await processEngineExcelFile(file);
      
      // Update cache and trigger UI update
      localStorage.setItem('engineRoomData', JSON.stringify(processedData));
      await queryClient.invalidateQueries({ queryKey: ['engineRoomData'] });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      toast({
        title: "File processed successfully",
        description: `Processed ${processedData.totalItems} items with ${processedData.flaggedItems} exceptions.`
      });

      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
      
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Error processing file",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [queryClient, toast]);

  // Dropzone setup
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv']
    },
    disabled: isUploading
  });

  // Show item details
  const handleShowItemDetails = (item: any) => {
    setSelectedItem(item);
    setShowPricingExplainer(true);
  };

  // Export data
  const handleExport = () => {
    if (!engineData) return;
    
    // Implementation for exporting data would go here
    toast({
      title: "Export started",
      description: "Your data export is being prepared."
    });
  };

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

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">REVA Pricing Engine</h1>
        <p className="text-muted-foreground">Upload, analyze, and optimize REVA pricing data</p>
      </div>

      {/* File upload area */}
      {!engineData && (
        <div 
          {...getRootProps()} 
          className={cn(
            "border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-all",
            isDragActive ? "border-primary bg-primary/5" : "border-gray-700 hover:border-primary/50",
            isUploading ? "pointer-events-none" : ""
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center space-y-4">
            <UploadCloud className="h-12 w-12 text-gray-400" />
            <div className="space-y-1">
              <h3 className="text-lg font-medium">Upload REVA Pricing Sheet</h3>
              <p className="text-sm text-muted-foreground">
                Drag and drop your Excel or CSV file, or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Required columns: Description, InStock, OnOrder, RevaUsage, UsageRank, AvgCost, NextCost, CurrentREVAPrice, CurrentREVAMargin
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
      )}

      {/* Dashboard content - shown after file upload */}
      {engineData && (
        <div className="space-y-6">
          {/* Top actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {engineData.fileName || "REVA Pricing Data"}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onDrop([])}
                className="flex items-center space-x-1"
              >
                <UploadCloud className="h-4 w-4 mr-1" />
                <span>New Upload</span>
              </Button>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={handleExport}
                className="flex items-center space-x-1"
              >
                <Download className="h-4 w-4 mr-1" />
                <span>Export Data</span>
              </Button>
            </div>
          </div>

          {/* Metrics cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

          {/* Chart */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Pricing Analysis</h2>
            <div className="border border-white/10 bg-gray-900/40 backdrop-blur-sm rounded-lg p-4">
              <RevaMetricsChart data={engineData.chartData || []} />
            </div>
          </div>

          {/* Tabs for different views */}
          <Tabs defaultValue="all-items" className="mt-8">
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="all-items">All Items</TabsTrigger>
              <TabsTrigger value="exceptions">
                Exceptions ({metrics.rule1Flags + metrics.rule2Flags})
              </TabsTrigger>
              <TabsTrigger value="configuration">Configuration</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all-items" className="space-y-4">
              <EngineDataTable 
                data={engineData.items || []} 
                onShowPriceDetails={handleShowItemDetails} 
              />
            </TabsContent>
            
            <TabsContent value="exceptions" className="space-y-4">
              <ExceptionsTable 
                data={engineData.flaggedItems || []} 
                onShowPriceDetails={handleShowItemDetails}
              />
            </TabsContent>
            
            <TabsContent value="configuration" className="space-y-4">
              <ConfigurationPanel 
                currentConfig={engineData.ruleConfig || {}} 
                onConfigChange={(newConfig) => {
                  // In a real implementation, this would update the rule config
                  console.log("Updated rule config:", newConfig);
                  toast({
                    title: "Configuration updated",
                    description: "The pricing rules have been updated."
                  });
                }}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Pricing rule explainer dialog */}
      {showPricingExplainer && selectedItem && (
        <PricingRuleExplainer
          item={selectedItem}
          open={showPricingExplainer}
          onClose={() => setShowPricingExplainer(false)}
        />
      )}
    </div>
  );
};

export default EngineRoom;

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
