
import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle, 
  Send, 
  Download, 
  Save, 
  RotateCcw,
  Info,
  AlertTriangle,
  FileText,
  CheckCircle,
  XCircle,
  TrendingUp,
  DollarSign
} from 'lucide-react';

interface PricingActionsTabsProps {
  modifiedCount: number;
  totalExceptions: number;
  workflowStatus: 'draft' | 'submitted' | 'approved' | 'rejected';
  onSave: () => void;
  onSubmit: () => void;
  onReset: () => void;
  onExport: () => void;
  approvalMetrics: {
    pending: number;
    approved: number;
    rejected: number;
  };
  pricingImpactMetrics?: {
    currentAvgMargin: number;
    proposedAvgMargin: number;
    currentProfit: number;
    proposedProfit: number;
    marginLift: number;
    profitDelta: number;
  };
}

const PricingActionsTabs: React.FC<PricingActionsTabsProps> = ({
  modifiedCount,
  totalExceptions,
  workflowStatus,
  onSave,
  onSubmit,
  onReset,
  onExport,
  approvalMetrics,
  pricingImpactMetrics = {
    currentAvgMargin: 0,
    proposedAvgMargin: 0,
    currentProfit: 0,
    proposedProfit: 0,
    marginLift: 0,
    profitDelta: 0
  }
}) => {
  const getStatusColor = () => {
    switch (workflowStatus) {
      case 'draft': return 'bg-gray-700';
      case 'submitted': return 'bg-amber-700';
      case 'approved': return 'bg-green-700';
      case 'rejected': return 'bg-red-700';
      default: return 'bg-gray-700';
    }
  };

  const getStatusText = () => {
    switch (workflowStatus) {
      case 'draft': return 'Draft';
      case 'submitted': return 'Submitted for Approval';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      default: return 'Draft';
    }
  };

  return (
    <Card className="border border-gray-800 bg-gray-950/50 w-full">
      <CardContent className="p-0">
        <Tabs defaultValue="pricing-actions" className="w-full">
          <div className="border-b border-gray-800">
            <TabsList className="w-full rounded-none bg-transparent h-12">
              <TabsTrigger 
                value="pricing-actions" 
                className="flex-1 h-12 rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-finance-red"
              >
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>Pricing Actions</span>
                  {modifiedCount > 0 && (
                    <Badge variant="outline" className="ml-2 bg-blue-900/20 text-blue-400 border-blue-900">
                      {modifiedCount} Modified
                    </Badge>
                  )}
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="approvals" 
                className="flex-1 h-12 rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-finance-red"
              >
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Approvals</span>
                  {approvalMetrics.pending > 0 && (
                    <Badge variant="outline" className="ml-2 bg-amber-900/20 text-amber-400 border-amber-900">
                      {approvalMetrics.pending} Pending
                    </Badge>
                  )}
                </div>
              </TabsTrigger>
            </TabsList>
          </div>
          
          {/* Pricing Actions Tab Content */}
          <TabsContent value="pricing-actions" className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-medium">Pricing Actions</h3>
                <div className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor()}`}>
                  {getStatusText()}
                </div>
              </div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                {modifiedCount > 0 && (
                  <div className="flex items-center">
                    <Info className="h-3 w-3 mr-1" />
                    <span>{modifiedCount} modified prices</span>
                  </div>
                )}
                {totalExceptions > 0 && (
                  <div className="flex items-center ml-3">
                    <AlertTriangle className="h-3 w-3 mr-1 text-amber-400" />
                    <span>{totalExceptions} exceptions</span>
                  </div>
                )}
              </div>
            </div>

            {/* Pricing Impact Overview */}
            <div className="bg-gray-900/20 rounded-lg p-3 mb-3">
              <h4 className="text-sm font-medium mb-2 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" />
                Pricing Impact Overview
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gray-900/30 p-2 rounded-md">
                  <p className="text-xs text-muted-foreground">Current Average Margin</p>
                  <p className="text-lg font-semibold">{pricingImpactMetrics.currentAvgMargin?.toFixed(2) || 0}%</p>
                </div>
                <div className="bg-gray-900/30 p-2 rounded-md">
                  <p className="text-xs text-muted-foreground">Proposed Average Margin</p>
                  <p className="text-lg font-semibold">{pricingImpactMetrics.proposedAvgMargin?.toFixed(2) || 0}%</p>
                  <p className={`text-xs ${pricingImpactMetrics.marginLift > 0 ? 'text-green-500' : pricingImpactMetrics.marginLift < 0 ? 'text-red-500' : ''}`}>
                    {pricingImpactMetrics.marginLift > 0 ? '+' : ''}{pricingImpactMetrics.marginLift.toFixed(2)}%
                  </p>
                </div>
                <div className="bg-gray-900/30 p-2 rounded-md">
                  <p className="text-xs text-muted-foreground">Current Total Profit</p>
                  <p className="text-lg font-semibold">£{(pricingImpactMetrics.currentProfit || 0).toLocaleString()}</p>
                </div>
                <div className="bg-gray-900/30 p-2 rounded-md">
                  <p className="text-xs text-muted-foreground">Proposed Total Profit</p>
                  <p className="text-lg font-semibold">£{(pricingImpactMetrics.proposedProfit || 0).toLocaleString()}</p>
                  <p className={`text-xs ${pricingImpactMetrics.profitDelta > 0 ? 'text-green-500' : pricingImpactMetrics.profitDelta < 0 ? 'text-red-500' : ''}`}>
                    {pricingImpactMetrics.profitDelta > 0 ? '+' : ''}£{Math.abs(pricingImpactMetrics.profitDelta || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={onSave}
                disabled={modifiedCount === 0}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
              
              <Button 
                variant="default" 
                size="sm"
                onClick={onSubmit}
                disabled={workflowStatus !== 'draft' || modifiedCount === 0}
              >
                <Send className="h-4 w-4 mr-2" />
                Submit for Approval
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={onReset}
                disabled={modifiedCount === 0}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Changes
              </Button>
              
              <Button 
                variant="secondary" 
                size="sm"
                onClick={onExport}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>
            
            {workflowStatus === 'rejected' && (
              <div className="mt-2 p-3 bg-red-900/20 rounded-md border border-red-900/40">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Changes Rejected</h4>
                    <p className="text-sm text-muted-foreground">
                      Your price changes have been rejected by the approver. Please review the comments and make necessary adjustments.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
          
          {/* Approvals Tab Content */}
          <TabsContent value="approvals" className="p-4 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Approval Status</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border border-amber-800/30 bg-amber-900/10">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Pending Approval</h4>
                      <p className="text-2xl font-semibold">{approvalMetrics.pending}</p>
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
                      <p className="text-2xl font-semibold">{approvalMetrics.approved}</p>
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
                      <p className="text-2xl font-semibold">{approvalMetrics.rejected}</p>
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
            
            <div className="flex flex-col gap-2 mt-4">
              <div className="flex items-center text-sm text-muted-foreground">
                <Info className="h-4 w-4 mr-2" />
                <span>
                  {workflowStatus === 'draft' && 'Submit price changes for approval using the Pricing Actions tab.'}
                  {workflowStatus === 'submitted' && 'Your changes have been submitted and are awaiting approval.'}
                  {workflowStatus === 'approved' && 'Your changes have been approved and are ready to be implemented.'}
                  {workflowStatus === 'rejected' && 'Your changes have been rejected. Please review and resubmit.'}
                </span>
              </div>
              
              <p className="text-xs text-muted-foreground">
                The approval process ensures pricing changes are reviewed before implementation. Managers can approve individual items or in bulk.
              </p>
            </div>
            
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={onExport}>
                <Download className="h-4 w-4 mr-2" />
                Export Approval Report
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PricingActionsTabs;
