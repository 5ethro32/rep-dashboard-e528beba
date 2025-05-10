import React, { useState, useCallback, useEffect } from 'react';
import { UploadCloud, FileText, Download, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import MetricCard from '@/components/MetricCard';
import { processEngineExcelFile } from '@/utils/engine-excel-utils';
import EngineDataTable from '@/components/engine-room/EngineDataTable';
import PricingRuleExplainer from '@/components/engine-room/PricingRuleExplainer';
import ExceptionsTable from '@/components/engine-room/ExceptionsTable';
import RevaMetricsChart from '@/components/engine-room/RevaMetricsChart';
import ConfigurationPanel from '@/components/engine-room/ConfigurationPanel';
import PricingActions from '@/components/engine-room/PricingActions';
import ApprovalsTab from '@/components/engine-room/ApprovalsTab';
import ApprovalHistoryTab from '@/components/engine-room/ApprovalHistoryTab';
import { exportPricingData } from '@/utils/pricing-export-utils';

// Define workflow status type
type WorkflowStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

// Define user role type
type UserRole = 'analyst' | 'manager' | 'admin';

const EngineRoom: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedRuleConfig, setSelectedRuleConfig] = useState<string | null>(null);
  const [showPricingExplainer, setShowPricingExplainer] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus>('draft');
  const [modifiedItems, setModifiedItems] = useState<Set<string>>(new Set());
  const [userRole, setUserRole] = useState<UserRole>('manager'); // Default role for demo - would be set based on authentication

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

    setErrorMessage(null);
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
      
      // Add workflow related fields to the processed data
      processedData.items = processedData.items.map((item: any) => ({
        ...item,
        priceModified: false,
        calculatedPrice: item.proposedPrice, // Store the original calculated price
        workflowStatus: 'draft',
      }));
      
      // Reset workflow status and modified items
      setWorkflowStatus('draft');
      setModifiedItems(new Set());
      
      // Update cache and trigger UI update
      localStorage.setItem('engineRoomData', JSON.stringify(processedData));
      await queryClient.invalidateQueries({ queryKey: ['engineRoomData'] });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      toast({
        title: "File processed successfully",
        description: `Processed ${processedData.totalItems} items with ${processedData.flaggedItems.length} exceptions.`
      });

      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
      
    } catch (error) {
      console.error('Error processing file:', error);
      
      // Get the error message and set it
      const errorMsg = error instanceof Error ? error.message : "Unknown error occurred";
      setErrorMessage(errorMsg);
      
      toast({
        title: "Error processing file",
        description: errorMsg,
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

  // Handle price change
  const handlePriceChange = (item: any, newPrice: number) => {
    if (!engineData) return;
    
    // Deep clone the data to avoid modifying the cache directly
    const updatedData = JSON.parse(JSON.stringify(engineData));
    
    // Find and update the item in the main items array
    const foundItem = updatedData.items.find((i: any) => i.id === item.id);
    if (foundItem) {
      foundItem.proposedPrice = newPrice;
      foundItem.priceModified = true;
      
      // Recalculate the margin
      foundItem.proposedMargin = (newPrice - foundItem.avgCost) / newPrice;
      
      // Update flag2 if margin is below 3%
      foundItem.flag2 = foundItem.proposedMargin < 0.03;
    }
    
    // Also update in flagged items if present
    const flaggedItemIndex = updatedData.flaggedItems.findIndex((i: any) => i.id === item.id);
    if (flaggedItemIndex >= 0) {
      updatedData.flaggedItems[flaggedItemIndex].proposedPrice = newPrice;
      updatedData.flaggedItems[flaggedItemIndex].priceModified = true;
      updatedData.flaggedItems[flaggedItemIndex].proposedMargin = 
        (newPrice - updatedData.flaggedItems[flaggedItemIndex].avgCost) / newPrice;
      updatedData.flaggedItems[flaggedItemIndex].flag2 = 
        updatedData.flaggedItems[flaggedItemIndex].proposedMargin < 0.03;
    }
    
    // Update the local storage and query cache
    localStorage.setItem('engineRoomData', JSON.stringify(updatedData));
    queryClient.setQueryData(['engineRoomData'], updatedData);
    
    // Track modified items
    setModifiedItems(prev => {
      const newSet = new Set(prev);
      newSet.add(item.id);
      return newSet;
    });
    
    toast({
      title: "Price updated",
      description: `Updated price for ${item.description} to £${newPrice.toFixed(2)}`,
    });
  };

  // Export data
  const handleExport = () => {
    if (!engineData) return;
    
    try {
      const result = exportPricingData(engineData.items, {
        includeWorkflowStatus: true,
        fileName: `REVA_Pricing_${new Date().toISOString().substring(0, 10)}.xlsx`
      });
      
      toast({
        title: "Export complete",
        description: `Exported ${result.exportedCount} items to ${result.fileName}`
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Export failed",
        description: "An error occurred while exporting the data",
        variant: "destructive"
      });
    }
  };

  // Handle save changes
  const handleSaveChanges = () => {
    toast({
      title: "Changes saved",
      description: `Saved changes to ${modifiedItems.size} items`
    });
  };

  // Handle reset changes
  const handleResetChanges = () => {
    if (!engineData) return;
    
    // Deep clone the data to avoid modifying the cache directly
    const updatedData = JSON.parse(JSON.stringify(engineData));
    
    // Reset all modified items
    updatedData.items = updatedData.items.map((item: any) => {
      if (item.priceModified) {
        return {
          ...item,
          proposedPrice: item.calculatedPrice,
          proposedMargin: (item.calculatedPrice - item.avgCost) / item.calculatedPrice,
          priceModified: false,
          flag2: ((item.calculatedPrice - item.avgCost) / item.calculatedPrice) < 0.03
        };
      }
      return item;
    });
    
    // Also update flagged items
    updatedData.flaggedItems = updatedData.items.filter((item: any) => item.flag1 || item.flag2);
    
    // Update the local storage and query cache
    localStorage.setItem('engineRoomData', JSON.stringify(updatedData));
    queryClient.setQueryData(['engineRoomData'], updatedData);
    
    // Clear modified items
    setModifiedItems(new Set());
    
    toast({
      title: "Changes reset",
      description: "All price changes have been reset to calculated values"
    });
  };

  // Handle submit for approval
  const handleSubmitForApproval = () => {
    if (!engineData) return;
    
    // Update workflow status
    setWorkflowStatus('submitted');
    
    // Deep clone the data to avoid modifying the cache directly
    const updatedData = JSON.parse(JSON.stringify(engineData));
    
    // Update workflow status for all modified items
    updatedData.items = updatedData.items.map((item: any) => {
      if (item.priceModified) {
        return {
          ...item,
          workflowStatus: 'submitted',
          submissionDate: new Date().toISOString(),
          submittedBy: 'Current User' // This would be the actual user in a real implementation
        };
      }
      return item;
    });
    
    // Update flagged items as well
    updatedData.flaggedItems = updatedData.items.filter((item: any) => item.flag1 || item.flag2);
    
    // Update the local storage and query cache
    localStorage.setItem('engineRoomData', JSON.stringify(updatedData));
    queryClient.setQueryData(['engineRoomData'], updatedData);
    
    toast({
      title: "Submitted for approval",
      description: `${modifiedItems.size} price changes have been submitted for approval`
    });
  };

  // Handle approve items
  const handleApproveItems = (itemIds: string[], comment?: string) => {
    if (!engineData) return;
    
    // Deep clone the data to avoid modifying the cache directly
    const updatedData = JSON.parse(JSON.stringify(engineData));
    
    // Update workflow status for approved items
    updatedData.items = updatedData.items.map((item: any) => {
      if (itemIds.includes(item.id)) {
        return {
          ...item,
          workflowStatus: 'approved',
          reviewDate: new Date().toISOString(),
          reviewer: 'Manager', // This would be the actual reviewer in a real implementation
          reviewComments: comment || 'Approved'
        };
      }
      return item;
    });
    
    // Update flagged items as well
    updatedData.flaggedItems = updatedData.items.filter((item: any) => item.flag1 || item.flag2);
    
    // Update the local storage and query cache
    localStorage.setItem('engineRoomData', JSON.stringify(updatedData));
    queryClient.setQueryData(['engineRoomData'], updatedData);
    
    toast({
      title: "Items approved",
      description: `Approved ${itemIds.length} price changes`
    });
  };

  // Handle reject items
  const handleRejectItems = (itemIds: string[], comment: string) => {
    if (!engineData || !comment.trim()) return;
    
    // Deep clone the data to avoid modifying the cache directly
    const updatedData = JSON.parse(JSON.stringify(engineData));
    
    // Update workflow status for rejected items
    updatedData.items = updatedData.items.map((item: any) => {
      if (itemIds.includes(item.id)) {
        return {
          ...item,
          workflowStatus: 'rejected',
          reviewDate: new Date().toISOString(),
          reviewer: 'Manager', // This would be the actual reviewer in a real implementation
          reviewComments: comment
        };
      }
      return item;
    });
    
    // Update flagged items as well
    updatedData.flaggedItems = updatedData.items.map((item: any) => {
      if (itemIds.includes(item.id)) {
        return {
          ...item,
          workflowStatus: 'rejected',
          reviewDate: new Date().toISOString(),
          reviewer: 'Manager',
          reviewComments: comment
        };
      }
      return item;
    });
    
    // Update the local storage and query cache
    localStorage.setItem('engineRoomData', JSON.stringify(updatedData));
    queryClient.setQueryData(['engineRoomData'], updatedData);
    
    toast({
      title: "Items rejected",
      description: `Rejected ${itemIds.length} price changes with comment`
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

  // Count pending approvals
  const getPendingApprovalCount = () => {
    if (!engineData) return 0;
    
    return engineData.items.filter((item: any) => 
      item.workflowStatus === 'submitted' && item.priceModified
    ).length;
  };

  // Helper function to render tabs based on user role
  const renderTabsList = () => {
    const baseTabItems = [
      <TabsTrigger key="all-items" value="all-items">All Items</TabsTrigger>,
      <TabsTrigger key="exceptions" value="exceptions">
        Exceptions ({metrics.rule1Flags + metrics.rule2Flags})
      </TabsTrigger>,
      <TabsTrigger key="configuration" value="configuration">Configuration</TabsTrigger>
    ];

    // Add approvals tab for manager/admin roles
    if (userRole === 'manager' || userRole === 'admin') {
      baseTabItems.splice(2, 0, 
        <TabsTrigger key="approvals" value="approvals">
          Approvals {getPendingApprovalCount() > 0 && `(${getPendingApprovalCount()})`}
        </TabsTrigger>,
        <TabsTrigger key="approval-history" value="approval-history">
          Approval History
        </TabsTrigger>
      );
    }

    return (
      <TabsList className="grid grid-cols-5 mb-6">
        {baseTabItems}
      </TabsList>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">REVA Pricing Engine</h1>
        <p className="text-muted-foreground">Upload, analyze, and optimize REVA pricing data</p>
      </div>

      {/* File upload area */}
      {!engineData && (
        <>
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
                  <AlertDescription className="mt-2">
                    <p className="font-medium">Supported column names include:</p>
                    <ul className="list-disc pl-5 mt-1 text-sm space-y-1">
                      <li>Description: "Description"</li>
                      <li>Stock: "InStock"</li>
                      <li>Order: "OnOrder"</li>
                      <li>Usage: "REVA Usage"</li>
                      <li>Rank: "Usage Rank"</li>
                      <li>Cost: "AvgCost"</li>
                      <li>Next Cost: "Next Buying Price"</li>
                      <li>Current Price: "Current REVA Price"</li>
                      <li>Current Margin: "Current REVA %"</li>
                      <li>Competitor prices: "ETH NET", "ETH", "Nupharm", "LEXON", "AAH"</li>
                    </ul>
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          )}
        </>
      )}

      {/* Dashboard content - shown after file upload */}
      {engineData && (
        <div className="space-y-6">
          {/* Role indicator for demo */}
          <div className="flex justify-end mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Current role:</span>
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value as UserRole)}
                className="bg-gray-800 border border-gray-700 rounded-md text-sm px-2 py-1"
              >
                <option value="analyst">Analyst</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

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
                onClick={() => {
                  localStorage.removeItem('engineRoomData');
                  queryClient.invalidateQueries({ queryKey: ['engineRoomData'] });
                }}
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

          {/* Workflow status and actions */}
          <PricingActions 
            modifiedCount={modifiedItems.size}
            totalExceptions={(metrics.rule1Flags || 0) + (metrics.rule2Flags || 0)}
            workflowStatus={workflowStatus}
            onSave={handleSaveChanges}
            onSubmit={handleSubmitForApproval}
            onReset={handleResetChanges}
            onExport={handleExport}
          />

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
            {renderTabsList()}
            
            <TabsContent value="all-items" className="space-y-4">
              <EngineDataTable 
                data={engineData.items || []} 
                onShowPriceDetails={handleShowItemDetails}
                onPriceChange={userRole !== 'manager' ? handlePriceChange : undefined}
              />
            </TabsContent>
            
            <TabsContent value="exceptions" className="space-y-4">
              <ExceptionsTable 
                data={engineData.flaggedItems || []} 
                onShowPriceDetails={handleShowItemDetails}
                onPriceChange={userRole !== 'manager' ? handlePriceChange : undefined}
              />
            </TabsContent>

            {(userRole === 'manager' || userRole === 'admin') && (
              <TabsContent value="approvals" className="space-y-4">
                <ApprovalsTab 
                  data={engineData.items || []}
                  onApprove={handleApproveItems}
                  onReject={handleRejectItems}
                />
              </TabsContent>
            )}
            
            {/* New Approval History Tab */}
            {(userRole === 'manager' || userRole === 'admin') && (
              <TabsContent value="approval-history" className="space-y-4">
                <ApprovalHistoryTab 
                  data={engineData.items || []}
                  onExport={handleExport}
                />
              </TabsContent>
            )}
            
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
