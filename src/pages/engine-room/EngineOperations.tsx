
import React, { useState, useEffect } from 'react';
import { EngineRoomProvider, useEngineRoom } from '@/contexts/EngineRoomContext';
import { UploadCloud, FileText, Download, Filter, Star, Info, AlertTriangle, TrendingUp, Percent, DollarSign, BarChart2, ShoppingCart, Tag, TrendingDown } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import ConfigurationPanel from '@/components/engine-room/ConfigurationPanel';
import PricingActionsTabs from '@/components/engine-room/PricingActionsTabs';
import MetricCard from '@/components/MetricCard';
import { useToast } from '@/hooks/use-toast';

const EngineOperationsContent = () => {
  const { toast } = useToast();
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
  const [activeTabFlagFilter, setActiveTabFlagFilter] = useState('all');

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
  
  // Handle showing price details - used by all tables
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
  
  // Display notification about the current workflow status
  useEffect(() => {
    if (engineData) {
      if (workflowStatus === 'draft' && modifiedItems.size > 0) {
        toast({
          title: "Price changes are in draft mode",
          description: `You have ${modifiedItems.size} pending changes. Submit for approval when ready.`,
          duration: 5000,
        });
      } else if (workflowStatus === 'submitted') {
        toast({
          title: "Changes submitted for approval",
          description: `${getPendingApprovalCount()} items are waiting for manager approval.`,
          duration: 5000,
        });
      }
    }
  }, [engineData, workflowStatus, modifiedItems.size, getPendingApprovalCount, toast]);

  // Get all unique flags from the data for the dropdown (not needed anymore as it's handled inside EngineDataTable)
  
  // Get starred items
  const getStarredItems = () => {
    if (!engineData?.items) return [];
    return engineData.items.filter(item => starredItems.has(item.id));
  };
  
  // Get submitted items
  const getSubmittedItems = () => {
    if (!engineData?.items) return [];
    return engineData.items.filter(item => item.workflowStatus === 'submitted' && item.priceModified);
  };
  
  // Get flagged items
  const getFlaggedItems = () => {
    if (!engineData?.items) return [];
    // Filter based on active flag filter
    if (activeTabFlagFilter === 'all') {
      return engineData.items.filter(item => item.flag1 || item.flag2 || (item.flags && item.flags.length > 0));
    } else if (activeTabFlagFilter === 'HIGH_PRICE') {
      return engineData.items.filter(item => item.flag1 || (item.flags && item.flags.includes('HIGH_PRICE')));
    } else if (activeTabFlagFilter === 'LOW_MARGIN') {
      return engineData.items.filter(item => item.flag2 || (item.flags && item.flags.includes('LOW_MARGIN')));
    } else {
      return engineData.items.filter(item => item.flags && item.flags.includes(activeTabFlagFilter));
    }
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
      {/* Pricing actions card with upload and export buttons */}
      <div className="mb-6">
        <PricingActionsTabs
          modifiedCount={modifiedItems.size}
          totalExceptions={(metrics.rule1Flags || 0) + (metrics.rule2Flags || 0)}
          workflowStatus={workflowStatus}
          onSave={handleSaveChanges}
          onSubmit={handleSubmitForApproval}
          onReset={handleResetChanges}
          onExport={handleExport}
          onUpload={() => {
            localStorage.removeItem('engineRoomData');
            window.location.reload();
          }}
          fileName={engineData.fileName || "REVA Pricing Data"}
          approvalMetrics={{
            pending: getPendingApprovalCount(),
            approved: engineData.approvedItems?.length || 0,
            rejected: engineData.rejectedItems?.length || 0
          }}
          pricingImpactMetrics={getPricingImpactMetrics()}
        />
      </div>

      {/* Flag metrics cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <MetricCard
          title="High Price Flags"
          value={`${metrics.rule1Flags || 0}`}
          subtitle="Items with prices significantly above market"
          valueClassName="text-red-400"
          icon={<TrendingUp />}
          iconPosition="right"
        />
        
        <MetricCard
          title="Low Margin Flags"
          value={`${metrics.rule2Flags || 0}`}
          subtitle="Items with margins below threshold"
          valueClassName="text-amber-400"
          icon={<TrendingDown />}
          iconPosition="right"
        />
        
        <MetricCard
          title="Items to Review"
          value={`${modifiedItems.size}`}
          subtitle="Items with pending price changes"
          icon={<Tag />}
          iconPosition="right"
        />
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="all-items" className="mt-8">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger key="all-items" value="all-items" className="flex gap-2">
            All Items
            {modifiedItems.size > 0 && (
              <Badge variant="secondary" className="bg-finance-red text-white rounded-full">{modifiedItems.size}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger key="exceptions" value="exceptions" className="flex gap-2">
            Exceptions
            <Badge variant="secondary" className="bg-amber-500 text-white rounded-full">{metrics.rule1Flags + metrics.rule2Flags}</Badge>
          </TabsTrigger>
          <TabsTrigger key="submitted" value="submitted" className="flex gap-2">
            Submitted
            <Badge variant="secondary" className="bg-blue-500 text-white rounded-full">{getPendingApprovalCount()}</Badge>
          </TabsTrigger>
          <TabsTrigger key="starred" value="starred" className="flex gap-2">
            Starred
            <Badge variant="secondary" className="bg-yellow-500 text-white rounded-full">{starredItems.size}</Badge>
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
            flagFilter="all"
            onFlagFilterChange={setActiveTabFlagFilter}
          />
        </TabsContent>
        
        <TabsContent value="exceptions" className="space-y-4">
          {/* Subtabs for different exception types */}
          <Tabs value={activeTabFlagFilter} onValueChange={setActiveTabFlagFilter} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All Exceptions</TabsTrigger>
              <TabsTrigger value="HIGH_PRICE">High Price</TabsTrigger>
              <TabsTrigger value="LOW_MARGIN">Low Margin</TabsTrigger>
            </TabsList>
          </Tabs>

          <EngineDataTable 
            data={getFlaggedItems()} 
            onShowPriceDetails={handleShowItemDetails}
            onPriceChange={userRole !== 'manager' ? handlePriceChange : undefined}
            onToggleStar={handleToggleStar}
            starredItems={starredItems}
            flagFilter={activeTabFlagFilter}
            onFlagFilterChange={setActiveTabFlagFilter}
          />
        </TabsContent>
        
        <TabsContent value="submitted" className="space-y-4">
          <EngineDataTable 
            data={getSubmittedItems()} 
            onShowPriceDetails={handleShowItemDetails}
            onPriceChange={undefined} // Read-only for submitted items
            onToggleStar={handleToggleStar}
            starredItems={starredItems}
            flagFilter="all"
            onFlagFilterChange={setActiveTabFlagFilter}
          />
        </TabsContent>
        
        <TabsContent value="starred" className="space-y-4">
          <EngineDataTable 
            data={getStarredItems()} 
            onShowPriceDetails={handleShowItemDetails}
            onPriceChange={userRole !== 'manager' ? handlePriceChange : undefined}
            onToggleStar={handleToggleStar}
            starredItems={starredItems}
            flagFilter="all"
            onFlagFilterChange={setActiveTabFlagFilter}
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

      {/* Pricing rule explainer dialog - used by both tables now */}
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
