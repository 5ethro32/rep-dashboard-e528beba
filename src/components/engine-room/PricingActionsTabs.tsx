
import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Send, Download, Save, RotateCcw, Info, AlertTriangle, FileText, PenLine, CheckCircle, XCircle } from 'lucide-react';

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
      case 'draft':
        return 'bg-gray-700';
      case 'submitted':
        return 'bg-amber-700';
      case 'approved':
        return 'bg-green-700';
      case 'rejected':
        return 'bg-red-700';
      default:
        return 'bg-gray-700';
    }
  };
  
  const getStatusText = () => {
    switch (workflowStatus) {
      case 'draft':
        return 'Draft';
      case 'submitted':
        return 'Submitted for Approval';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Draft';
    }
  };
  
  return (
    <Card className="border border-white/10 bg-gray-950/60 backdrop-blur-sm shadow-lg w-full">
      <CardContent className="p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-medium">Pricing Actions</h3>
            <div className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor()}`}>
              {getStatusText()}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {modifiedCount > 0 && (
              <Badge variant="outline" className="bg-finance-red/10 border-finance-red/30 text-finance-red flex items-center gap-1 py-1.5 px-3">
                <PenLine className="h-3 w-3" />
                <span>{modifiedCount} modified</span>
              </Badge>
            )}
            {approvalMetrics.pending > 0 && (
              <Badge variant="outline" className="bg-amber-500/10 border-amber-500/30 text-amber-400 flex items-center gap-1 py-1.5 px-3">
                <AlertCircle className="h-3 w-3" />
                <span>{approvalMetrics.pending} pending</span>
              </Badge>
            )}
            {approvalMetrics.approved > 0 && (
              <Badge variant="outline" className="bg-green-500/10 border-green-500/30 text-green-400 flex items-center gap-1 py-1.5 px-3">
                <CheckCircle className="h-3 w-3" />
                <span>{approvalMetrics.approved} approved</span>
              </Badge>
            )}
            {approvalMetrics.rejected > 0 && (
              <Badge variant="outline" className="bg-red-500/10 border-red-500/30 text-red-400 flex items-center gap-1 py-1.5 px-3">
                <XCircle className="h-3 w-3" />
                <span>{approvalMetrics.rejected} rejected</span>
              </Badge>
            )}
            {totalExceptions > 0 && (
              <Badge variant="outline" className="bg-amber-700/10 border-amber-700/30 text-amber-400 flex items-center gap-1 py-1.5 px-3">
                <AlertTriangle className="h-3 w-3" />
                <span>{totalExceptions} exceptions</span>
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onSave} disabled={modifiedCount === 0} className="bg-gray-900/40">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
          
          <Button variant="default" size="sm" onClick={onSubmit} disabled={workflowStatus !== 'draft' || modifiedCount === 0}>
            <Send className="h-4 w-4 mr-2" />
            Submit for Approval
          </Button>
          
          <Button variant="outline" size="sm" onClick={onReset} disabled={modifiedCount === 0} className="bg-gray-900/40">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset Changes
          </Button>
          
          <Button variant="secondary" size="sm" onClick={onExport}>
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
        
        {approvalMetrics.pending > 0 && (
          <div className="mt-2 p-3 bg-amber-900/20 rounded-md border border-amber-900/40">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5" />
              <div>
                <h4 className="font-medium">Pending Approvals</h4>
                <p className="text-sm text-muted-foreground">
                  You have {approvalMetrics.pending} items awaiting approval. Visit the Approvals page to review them.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PricingActionsTabs;
