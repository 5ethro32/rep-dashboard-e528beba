import React, { useState } from 'react';
import { EngineRoomProvider, useEngineRoom } from '@/contexts/EngineRoomContext';
import { UploadCloud, FileText, Download, Filter, Star, Package, TrendingDown, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Info } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import MetricCard from '@/components/MetricCard';
import EngineDataTable from '@/components/engine-room/EngineDataTable';
import PricingRuleExplainer from '@/components/engine-room/PricingRuleExplainer';
import ExceptionsTable from '@/components/engine-room/ExceptionsTable';
import ConfigurationPanel from '@/components/engine-room/ConfigurationPanel';
import PricingActionsTabs from '@/components/engine-room/PricingActionsTabs';
import ApprovalsTab from '@/components/engine-room/ApprovalsTab';
import ApprovalHistoryTab from '@/components/engine-room/ApprovalHistoryTab';

const EngineOperationsContent = () => {
  const {
    engineData,
    isLoading,
    isUploading,
    uploadProgress,
    errorMessage,
    modifiedItems,
    workflowStatus,
    userRole,
    handleFileUpload,
    handlePriceChange,
    handleResetChanges,
    handleSaveChanges,
    handleSubmitForApproval,
    handleApproveItems,
    handleRejectItems,
    handleExport,
    getPendingApprovalCount
  } = useEngineRoom();
  const [showPricingExplainer, setShowPricingExplainer] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [starredItems, setStarredItems] = useState<Set<string>>(new Set());
  const [hideInactiveProducts, setHideInactiveProducts] = useState(false);
  const [showShortageOnly, setShowShortageOnly] = useState(false);

  // Calculate metrics for the summary cards
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
  
  // Get pricing impact metrics
  const getPricingImpactMetrics = () => {
    if (!engineData) return {
      currentAvgMargin: 0,
      proposedAvgMargin: 0,
      currentProfit: 0,
      proposedProfit: 0,
      marginLift: 0,
      profitDelta: 0
    };

    return {
      currentAvgMargin: engineData.currentAvgMargin || 0,
      proposedAvgMargin: engineData.proposedAvgMargin || 0,
      currentProfit: engineData.currentProfit || 0,
      proposedProfit: engineData.proposedProfit || 0,
      marginLift: metrics.marginLift || 0,
      profitDelta: metrics.profitDelta || 0
    };
  };
  
  // Show item details
  const handleShowItemDetails = (item: any) => {
    setSelectedItem(item);
    setShowPricingExplainer(true);
  };
  
  // Toggle star for a single item (fixed to prevent toggling all stars)
  const handleToggleStar = (itemId: string) => {
    setStarredItems(prev => {
      const newStarred = new Set(prev);
      if (newStarred.has(itemId)) {
        newStarred.delete(itemId);
      } else {
        newStarred.add(itemId);
      }
      return newStarred;
    });
  };
  
  // Filter data based on toggles
  const filterData = (items: any[]) => {
    if (!items) return [];
    
    // Apply inactive product filter if enabled
    let filteredItems = items;
    
    if (hideInactiveProducts) {
      filteredItems = filteredItems.filter(item => (item.revaUsage || 0) > 0);
    }
    
    // Apply shortage filter if enabled
    if (showShortageOnly) {
      filteredItems = filteredItems.filter(item => item.shortage === true);
    }
    
    return filteredItems;
  };
  
  // Get starred items
  const getStarredItems = () => {
    if (!engineData?.items) return [];
    return engineData.items.filter(item => starredItems.has(item.id));
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

  // Helper function to render tabs based on user role
  const renderTabsList = () => {
    const baseTabItems = [
      <TabsTrigger key="all-items" value="all-items">All Items</TabsTrigger>,
      <TabsTrigger key="exceptions" value="exceptions">
        Exceptions ({metrics.rule1Flags + metrics.rule2Flags})
      </TabsTrigger>,
      <TabsTrigger key="starred" value="starred">
        Starred ({starredItems.size})
      </TabsTrigger>,
      <TabsTrigger key="configuration" value="configuration">Configuration</TabsTrigger>
    ];

    // Add approvals tab for manager/admin roles
    if (userRole === 'manager' || userRole === 'admin') {
      baseTabItems.splice(3, 0, 
        <TabsTrigger key="approvals" value="approvals">
          Approvals {getPendingApprovalCount() > 0 && `(${getPendingApprovalCount()})`}
        </TabsTrigger>,
        <TabsTrigger key="approval-history" value="approval-history">
          Approval History
        </TabsTrigger>
      );
    }

    return (
      <TabsList className="inline-flex w-full">
        {baseTabItems}
      </TabsList>
    );
  };

  if (!engineData) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div 
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-all mt-4
            ${isUploading ? "pointer-events-none" : "border-gray-700 hover:border-primary/50"}`}
        >
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
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
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
              window.location.reload();
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

      {/* Pricing workflow status and actions */}
      <div className="mb-6">
        <PricingActionsTabs
          modifiedCount={modifiedItems.size}
          totalExceptions={(metrics.rule1Flags || 0) + (metrics.rule2Flags || 0)}
          workflowStatus={workflowStatus}
          onSave={handleSaveChanges}
          onSubmit={handleSubmitForApproval}
          onReset={handleResetChanges}
          onExport={handleExport}
          approvalMetrics={{
            pending: getPendingApprovalCount(),
            approved: engineData.approvedItems?.length || 0,
            rejected: engineData.rejectedItems?.length || 0
          }}
          pricingImpactMetrics={getPricingImpactMetrics()}
        />
      </div>

      {/* Key metrics summary - Simple metrics now that pricing impact is in PricingActionsTabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-4 my-6">
        <MetricCard
          title="Modified Items"
          value={`${modifiedItems.size}`}
          subtitle="Items with price changes"
        />
        <MetricCard
          title="Pending Approvals"
          value={`${getPendingApprovalCount()}`}
          subtitle="Items awaiting review"
        />
        <MetricCard
          title="Flagged Items"
          value={`${metrics.rule1Flags + metrics.rule2Flags}`}
          subtitle={`Rule 1: ${metrics.rule1Flags} | Rule 2: ${metrics.rule2Flags}`}
        />
      </div>

      {/* Filter toggles */}
      <div className="flex flex-wrap gap-4 items-center my-4 p-3 bg-gray-900/40 rounded-lg">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filters:</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch 
            id="hideInactive" 
            checked={hideInactiveProducts}
            onCheckedChange={setHideInactiveProducts}
          />
          <label htmlFor="hideInactive" className="text-sm cursor-pointer">
            Hide Inactive Products
          </label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch 
            id="shortageOnly" 
            checked={showShortageOnly}
            onCheckedChange={setShowShortageOnly}
          />
          <label htmlFor="shortageOnly" className="text-sm cursor-pointer">
            Shortage Only
          </label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Star className={`h-4 w-4 ${starredItems.size > 0 ? 'text-yellow-400' : 'text-muted-foreground'}`} />
          <span className="text-sm">
            {starredItems.size} items starred
          </span>
        </div>
        
        {/* Market trend indicators */}
        <div className="flex items-center space-x-4 ml-auto">
          <div className="flex items-center space-x-1">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-xs text-muted-foreground">Market Trend Up</span>
          </div>
          <div className="flex items-center space-x-1">
            <TrendingDown className="h-4 w-4 text-red-500" />
            <span className="text-xs text-muted-foreground">Market Trend Down</span>
          </div>
        </div>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="all-items" className="mt-8">
        {renderTabsList()}
        
        <TabsContent value="all-items" className="space-y-4">
          <EngineDataTable 
            data={filterData(engineData.items || [])} 
            onShowPriceDetails={handleShowItemDetails}
            onPriceChange={userRole !== 'manager' ? handlePriceChange : undefined}
            onToggleStar={handleToggleStar}
            starredItems={starredItems}
          />
        </TabsContent>
        
        <TabsContent value="exceptions" className="space-y-4">
          <ExceptionsTable 
            data={filterData(engineData.flaggedItems || [])} 
            onShowPriceDetails={handleShowItemDetails}
            onPriceChange={userRole !== 'manager' ? handlePriceChange : undefined}
            onToggleStar={handleToggleStar}
            starredItems={starredItems}
          />
        </TabsContent>
        
        <TabsContent value="starred" className="space-y-4">
          <EngineDataTable 
            data={getStarredItems()} 
            onShowPriceDetails={handleShowItemDetails}
            onPriceChange={userRole !== 'manager' ? handlePriceChange : undefined}
            onToggleStar={handleToggleStar}
            starredItems={starredItems}
          />
        </TabsContent>

        {(userRole === 'manager' || userRole === 'admin') && (
          <TabsContent value="approvals" className="space-y-4">
            <ApprovalsTab 
              data={engineData.items || []}
              onApprove={handleApproveItems}
              onReject={handleRejectItems}
              onToggleStar={handleToggleStar}
              starredItems={starredItems}
            />
          </TabsContent>
        )}
        
        {/* Approval History Tab */}
        {(userRole === 'manager' || userRole === 'admin') && (
          <TabsContent value="approval-history" className="space-y-4">
            <ApprovalHistoryTab 
              data={engineData.items || []}
              onExport={handleExport}
              onToggleStar={handleToggleStar}
              starredItems={starredItems}
            />
          </TabsContent>
        )}
        
        <TabsContent value="configuration" className="space-y-4">
          <ConfigurationPanel 
            currentConfig={engineData.ruleConfig || {}} 
            onConfigChange={(newConfig) => {
              console.log("Updated rule config:", newConfig);
            }}
          />
        </TabsContent>
      </Tabs>

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

// Wrapper component to provide context
const EngineOperations = () => (
  <EngineRoomProvider>
    <EngineOperationsContent />
  </EngineRoomProvider>
);

export default EngineOperations;
