
import React, { useState } from 'react';
import { EngineRoomProvider, useEngineRoom } from '@/contexts/EngineRoomContext';
import { UploadCloud, FileText, Download, Filter, Star, Package } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Info } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import EngineDataTable from '@/components/engine-room/EngineDataTable';
import PricingRuleExplainer from '@/components/engine-room/PricingRuleExplainer';
import ExceptionsTable from '@/components/engine-room/ExceptionsTable';
import ConfigurationPanel from '@/components/engine-room/ConfigurationPanel';
import PricingActionsTabs from '@/components/engine-room/PricingActionsTabs';

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
    handleExport,
    getPendingApprovalCount
  } = useEngineRoom();
  const [showPricingExplainer, setShowPricingExplainer] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [starredItems, setStarredItems] = useState<Set<string>>(new Set());

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
  
  // Toggle star for a single item
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
  
  // Get all unique flags from the data for the dropdown
  const getUniqueFlags = () => {
    if (!engineData?.items) return [];
    
    const flags = new Set<string>();
    
    // Add built-in flag types
    flags.add('SHORT');
    flags.add('HIGH_PRICE');
    flags.add('LOW_MARGIN');
    
    // Add flags from the data
    engineData.items.forEach(item => {
      if (item.flag && typeof item.flag === 'string' && item.flag.trim()) {
        flags.add(item.flag.trim());
      }
      
      // Add any flags from the flags array
      if (item.flags && Array.isArray(item.flags)) {
        item.flags.forEach(flagItem => {
          if (typeof flagItem === 'string' && flagItem.trim()) {
            flags.add(flagItem.trim());
          }
        });
      }
    });
    
    return Array.from(flags).sort();
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

      {/* Flag metrics cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border border-white/10 bg-gray-900/40 backdrop-blur-sm shadow-lg">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium mb-2">High Price Flags</h3>
            <div className="text-2xl font-bold mb-1 text-red-400">
              {metrics.rule1Flags || 0}
            </div>
            <div className="text-sm text-muted-foreground">
              Items with prices significantly above market
            </div>
          </CardContent>
        </Card>
        
        <Card className="border border-white/10 bg-gray-900/40 backdrop-blur-sm shadow-lg">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium mb-2">Low Margin Flags</h3>
            <div className="text-2xl font-bold mb-1 text-amber-400">
              {metrics.rule2Flags || 0}
            </div>
            <div className="text-sm text-muted-foreground">
              Items with margins below threshold
            </div>
          </CardContent>
        </Card>
        
        <Card className="border border-white/10 bg-gray-900/40 backdrop-blur-sm shadow-lg">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium mb-2">Items to Review</h3>
            <div className="text-2xl font-bold mb-1">{modifiedItems.size}</div>
            <div className="text-sm text-muted-foreground">
              Items with pending price changes
            </div>
          </CardContent>
        </Card>
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

      {/* Tabs for different views */}
      <Tabs defaultValue="all-items" className="mt-8">
        <TabsList className="inline-flex w-full">
          <TabsTrigger key="all-items" value="all-items">All Items</TabsTrigger>
          <TabsTrigger key="exceptions" value="exceptions">
            Exceptions ({metrics.rule1Flags + metrics.rule2Flags})
          </TabsTrigger>
          <TabsTrigger key="starred" value="starred">
            Starred ({starredItems.size})
          </TabsTrigger>
          <TabsTrigger key="configuration" value="configuration">Configuration</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all-items" className="space-y-4">
          <EngineDataTable 
            data={engineData.items || []} 
            onShowPriceDetails={handleShowItemDetails}
            onPriceChange={userRole !== 'manager' ? handlePriceChange : undefined}
            onToggleStar={handleToggleStar}
            starredItems={starredItems}
          />
        </TabsContent>
        
        <TabsContent value="exceptions" className="space-y-4">
          <ExceptionsTable 
            data={engineData.flaggedItems || []} 
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
