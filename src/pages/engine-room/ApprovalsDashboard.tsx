
import React from 'react';
import { EngineRoomProvider, useEngineRoom } from '@/contexts/EngineRoomContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertCircle, Download } from 'lucide-react';
import ApprovalsTab from '@/components/engine-room/ApprovalsTab';
import ApprovalHistoryTab from '@/components/engine-room/ApprovalHistoryTab';

const ApprovalsDashboardContent = () => {
  const {
    engineData,
    isLoading,
    handleApproveItems,
    handleRejectItems,
    handleExport,
    getPendingApprovalCount
  } = useEngineRoom();

  // Get usage-weighted impact metrics
  const getMetrics = () => {
    if (!engineData) return {
      pendingApprovals: 0,
      approvedItems: 0,
      rejectedItems: 0,
      profitImpact: 0,
      marginImpact: 0,
      changePercentage: 0
    };

    return {
      pendingApprovals: getPendingApprovalCount(),
      approvedItems: engineData.approvedItems?.length || 0,
      rejectedItems: engineData.rejectedItems?.length || 0,
      profitImpact: engineData.profitDelta || 0,
      marginImpact: engineData.marginLift || 0,
      changePercentage: engineData.overallMargin ? (engineData.marginLift / engineData.overallMargin) * 100 : 0
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
      marginLift: metrics.marginImpact || 0,
      profitDelta: metrics.profitImpact || 0
    };
  };

  const pricingImpact = getPricingImpactMetrics();

  if (!engineData) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <h3 className="text-xl font-medium mb-2">No Data Available</h3>
          <p className="text-muted-foreground max-w-md">
            Please upload pricing data in the Engine page to view approvals.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-bold">Approvals Dashboard</h1>
        
        <Button 
          variant="secondary" 
          size="sm"
          onClick={handleExport}
          className="flex items-center space-x-1"
        >
          <Download className="h-4 w-4 mr-1" />
          <span>Export Approval Report</span>
        </Button>
      </div>
      
      {/* Metrics Cards - Styled like the image reference */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="border border-amber-800/30 bg-amber-900/10">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Pending Approval</h4>
                <p className="text-2xl font-semibold">{metrics.pendingApprovals}</p>
              </div>
              <div className="bg-amber-900/20 p-2 rounded-full">
                <AlertCircle className="h-6 w-6 text-amber-400" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Items awaiting manager review
            </p>
          </CardContent>
        </Card>
        
        <Card className="border border-green-800/30 bg-green-900/10">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Approved</h4>
                <p className="text-2xl font-semibold">{metrics.approvedItems}</p>
              </div>
              <div className="bg-green-900/20 p-2 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Items approved for implementation
            </p>
          </CardContent>
        </Card>
        
        <Card className="border border-red-800/30 bg-red-900/10">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Rejected</h4>
                <p className="text-2xl font-semibold">{metrics.rejectedItems}</p>
              </div>
              <div className="bg-red-900/20 p-2 rounded-full">
                <XCircle className="h-6 w-6 text-red-400" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Items needing revision
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Additional performance metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card className="border border-white/10 bg-gray-900/40 backdrop-blur-sm shadow-lg">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium mb-2">Profit Impact</h3>
            <div className="text-2xl font-bold mb-1 flex items-center">
              {pricingImpact.profitDelta >= 0 ? '+' : ''}
              £{pricingImpact.profitDelta.toLocaleString(undefined, {maximumFractionDigits: 0})}
            </div>
            <div className="text-sm text-muted-foreground">
              Projected additional profit
            </div>
          </CardContent>
        </Card>
        
        <Card className="border border-white/10 bg-gray-900/40 backdrop-blur-sm shadow-lg">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium mb-2">Margin Impact</h3>
            <div className="text-2xl font-bold mb-1 flex items-center">
              {pricingImpact.proposedAvgMargin.toFixed(2)}%
              <span className="text-sm ml-2 text-green-500">
                ({pricingImpact.marginLift >= 0 ? '+' : ''}{pricingImpact.marginLift.toFixed(2)}%)
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              Projected margin improvement
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Approval process explanation */}
      <div className="bg-gray-900/40 border border-gray-800 p-4 rounded-md mb-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <h3 className="font-medium mb-1">Approval Process</h3>
            <p className="text-sm text-muted-foreground">
              The approval process ensures pricing changes are reviewed before implementation. 
              Managers can approve individual items or in bulk.
            </p>
          </div>
        </div>
      </div>
      
      {/* Tabs for approvals and history */}
      <Tabs defaultValue="approvals" className="mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="approvals">
            Pending Approvals {metrics.pendingApprovals > 0 && `(${metrics.pendingApprovals})`}
          </TabsTrigger>
          <TabsTrigger value="history">Approval History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="approvals" className="space-y-4">
          <ApprovalsTab 
            data={engineData.items || []}
            onApprove={handleApproveItems}
            onReject={handleRejectItems}
            onToggleStar={() => {}}
            starredItems={new Set()}
          />
        </TabsContent>
        
        <TabsContent value="history" className="space-y-4">
          <ApprovalHistoryTab 
            data={engineData.items || []}
            onExport={handleExport}
            onToggleStar={() => {}}
            starredItems={new Set()}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Wrapper component to provide context
const ApprovalsDashboard = () => (
  <EngineRoomProvider>
    <ApprovalsDashboardContent />
  </EngineRoomProvider>
);

export default ApprovalsDashboard;
