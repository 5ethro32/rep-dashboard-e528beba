import React, { useState, useRef, useEffect } from 'react';
import { EngineRoomProvider, useEngineRoom } from '@/contexts/EngineRoomContext';
import { 
  UploadCloud, 
  FileText, 
  Download, 
  Filter, 
  Star, 
  Package, 
  Info, 
  AlertTriangle, 
  TrendingUp, 
  Percent, 
  DollarSign, 
  BarChart2, 
  ShoppingCart, 
  Tag, 
  TrendingDown,
  History
} from 'lucide-react';
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
import { toast } from "@/components/ui/use-toast";
import EngineDataTable from '@/components/engine-room/EngineDataTable';
import PricingRuleExplainer from '@/components/engine-room/PricingRuleExplainer';
import ConfigurationPanel from '@/components/engine-room/ConfigurationPanel';
import PricingActionsTabs from '@/components/engine-room/PricingActionsTabs';
import MetricCard from '@/components/MetricCard';
import { calculateUsageWeightedMetrics } from '@/utils/formatting-utils';

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
  
  // Add useEffect to clear localStorage on first load
  useEffect(() => {
    // Only clear the data if we're coming to this page directly
    // This ensures that stale data doesn't persist between sessions
    const needsReset = !sessionStorage.getItem('engineRoomInitialized');
    if (needsReset) {
      localStorage.removeItem('engineRoomData');
      sessionStorage.setItem('engineRoomInitialized', 'true');
    }
  }, []);
  
  const [showPricingExplainer, setShowPricingExplainer] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [starredItems, setStarredItems] = useState<Set<string>>(new Set());
  const [activeTabFlagFilter, setActiveTabFlagFilter] = useState('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  
  // Get pricing impact metrics - UPDATED to use the same calculation method as dashboard
  const getPricingImpactMetrics = () => {
    if (!engineData || !engineData.items) return {
      currentAvgMargin: 0,
      proposedAvgMargin: 0,
      currentProfit: 0,
      proposedProfit: 0,
      marginLift: 0,
      profitDelta: 0
    };

    // Use the centralized calculation function for consistent results
    const calculatedMetrics = calculateUsageWeightedMetrics(engineData.items || []);
    
    // Log the calculated values to help with debugging
    console.log('EngineOperations: Calculated metrics', {
      weightedMargin: calculatedMetrics.weightedMargin,
      proposedWeightedMargin: calculatedMetrics.proposedWeightedMargin,
      marginImprovement: calculatedMetrics.marginImprovement,
      businessMargin: calculatedMetrics.businessMargin,
      proposedBusinessMargin: calculatedMetrics.proposedBusinessMargin,
      totalProfit: calculatedMetrics.totalProfit,
      proposedProfit: calculatedMetrics.proposedProfit
    });

    // Return values focusing on business margin instead of weighted margin
    return {
      currentAvgMargin: calculatedMetrics.businessMargin || 0,
      proposedAvgMargin: calculatedMetrics.proposedBusinessMargin || 0,
      currentProfit: calculatedMetrics.totalProfit || 0,
      proposedProfit: calculatedMetrics.proposedProfit || 0,
      marginLift: calculatedMetrics.businessMarginImprovement || 0,
      profitDelta: calculatedMetrics.proposedProfit > 0 && calculatedMetrics.totalProfit > 0 ? 
                    ((calculatedMetrics.proposedProfit - calculatedMetrics.totalProfit) / calculatedMetrics.totalProfit) * 100 : 0
    };
  };
  
  // Show item details - used by all tables
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
  
  // Handler for clicking on the upload area to open file picker
  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };
  
  // Handler for file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Clear any existing data before uploading new file
      localStorage.removeItem('engineRoomData'); 
      handleFileUpload(e.target.files[0]);
    }
  };

  if (!engineData) {
    return (
      <div className="container mx-auto px-4 py-6">
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

      {/* Flag metrics cards - Updated to show Total Business Margin */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="High Price Flags"
          value={`${metrics.rule1Flags || 0}`}
          subtitle={`${metrics.rule1Flags > 0 ? ((metrics.rule1Flags / metrics.totalItems) * 100).toFixed(1) + '% of inventory' : 'No flags'}`}
          details={`Items priced significantly above market average requiring attention`}
          valueClassName="text-red-400"
          icon={<TrendingUp />}
          iconPosition="right"
          valueSize="medium"
        />
        
        <MetricCard
          title="Low Margin Flags"
          value={`${metrics.rule2Flags || 0}`}
          subtitle={`${metrics.rule2Flags > 0 ? ((metrics.rule2Flags / metrics.totalItems) * 100).toFixed(1) + '% of inventory' : 'No flags'}`}
          details={`Items with margins below threshold needing price adjustment`}
          valueClassName="text-amber-400"
          icon={<TrendingDown />}
          iconPosition="right"
          valueSize="medium"
        />

        <MetricCard
          title="Current Business Margin"
          value={`${(getPricingImpactMetrics().currentAvgMargin || 0).toFixed(2)}%`}
          subtitle="Total Profit ÷ Total Revenue"
          details={`Based on ${engineData.activeItems} active items`}
          valueClassName="text-blue-400"
          icon={<Percent />}
          iconPosition="right"
          valueSize="medium"
        />

        <MetricCard
          title="Proposed Business Margin"
          value={`${(getPricingImpactMetrics().proposedAvgMargin || 0).toFixed(2)}%`}
          subtitle={`${getPricingImpactMetrics().marginLift > 0 ? '+' : ''}${getPricingImpactMetrics().marginLift.toFixed(2)}% points change`}
          details={getPricingImpactMetrics().marginLift > 0 ? 'Improved margin after all changes' : 'Current margin after all changes'}
          valueClassName={getPricingImpactMetrics().marginLift > 0 ? "text-emerald-400" : "text-white"}
          icon={<Percent />}
          iconPosition="right"
          valueSize="medium"
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
          <TabsTrigger key="changes" value="changes" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Changes
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all-items" className="space-y-4">
          <EngineDataTable 
            data={engineData.items || []} 
            onShowPriceDetails={handleShowItemDetails}
            onPriceChange={handlePriceChange}
            onToggleStar={handleToggleStar}
            starredItems={starredItems}
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
            onPriceChange={handlePriceChange}
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
            onPriceChange={handlePriceChange}
            onToggleStar={handleToggleStar}
            starredItems={starredItems}
          />
        </TabsContent>
        
        <TabsContent value="starred" className="space-y-4">
          <EngineDataTable 
            data={getStarredItems()} 
            onShowPriceDetails={handleShowItemDetails}
            onPriceChange={handlePriceChange}
            onToggleStar={handleToggleStar}
            starredItems={starredItems}
          />
        </TabsContent>
        
        <TabsContent value="changes" className="space-y-4">
          <div className="bg-card rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <History className="h-5 w-5 text-muted-foreground" />
              Pricing Changes History
            </h2>
            
            <div className="space-y-6">
              <div className="border-b pb-4">
                <h3 className="font-medium text-md mb-2">Recent Changes</h3>
                {engineData && engineData.items && engineData.items.filter(item => item.priceModified).length > 0 ? (
                  <div className="space-y-3">
                    {engineData.items
                      .filter(item => item.priceModified)
                      .slice(0, 5)
                      .map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center p-2 rounded bg-muted/50">
                          <div>
                            <p className="font-medium">{item.description}</p>
                            <p className="text-sm text-muted-foreground">
                              Price changed from £{item.currentREVAPrice?.toFixed(2)} to £{item.proposedPrice?.toFixed(2)}
                              {item.submittedBy && <span> by {item.submittedBy}</span>}
                              {item.submissionDate && <span> on {new Date(item.submissionDate).toLocaleDateString()}</span>}
                            </p>
                          </div>
                          <Badge variant={item.proposedPrice > item.currentREVAPrice ? "default" : "destructive"}>
                            {item.proposedPrice > item.currentREVAPrice ? '+' : ''}
                            {((item.proposedPrice - item.currentREVAPrice) / item.currentREVAPrice * 100).toFixed(1)}%
                          </Badge>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">No recent price changes found</p>
                )}
              </div>
              
              <div>
                <h3 className="font-medium text-md mb-2">Team Activity</h3>
                {engineData && engineData.changeHistory && engineData.changeHistory.length > 0 ? (
                  <div className="border rounded-md">
                    <div className="grid grid-cols-4 gap-4 p-3 border-b bg-muted/50 font-medium text-sm">
                      <div>User</div>
                      <div>Action</div>
                      <div>Items</div>
                      <div>Date</div>
                    </div>
                    <div className="divide-y">
                      {engineData.changeHistory.map((change, idx) => (
                        <div key={idx} className="grid grid-cols-4 gap-4 p-3 text-sm">
                          <div>{change.user || "Unknown user"}</div>
                          <div>{change.action || "Price Updates"}</div>
                          <div>{change.itemCount || 0} items</div>
                          <div>{change.date ? new Date(change.date).toLocaleDateString() : "Unknown date"}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="border rounded-md">
                    <div className="grid grid-cols-4 gap-4 p-3 border-b bg-muted/50 font-medium text-sm">
                      <div>User</div>
                      <div>Action</div>
                      <div>Items</div>
                      <div>Date</div>
                    </div>
                    <div className="divide-y">
                      {engineData && engineData.items && engineData.items.filter(item => item.priceModified).length > 0 ? (
                        <div className="grid grid-cols-4 gap-4 p-3 text-sm">
                          <div>{engineData.currentUser || "Current User"}</div>
                          <div>Price Updates</div>
                          <div>{engineData.items.filter(item => item.priceModified).length} items</div>
                          <div>{new Date().toLocaleDateString()}</div>
                        </div>
                      ) : (
                        <div className="p-3 text-center text-muted-foreground text-sm">
                          No team activity recorded
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  This view shows all colleague activity related to pricing changes
                </p>
              </div>
            </div>
          </div>
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
