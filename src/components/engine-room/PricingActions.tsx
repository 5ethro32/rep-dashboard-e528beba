
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  AlertCircle, 
  Send, 
  Download, 
  Save, 
  RotateCcw,
  Info,
  AlertTriangle
} from 'lucide-react';

interface PricingActionsProps {
  modifiedCount: number;
  totalExceptions: number;
  workflowStatus: 'draft' | 'submitted' | 'approved' | 'rejected';
  onSave: () => void;
  onSubmit: () => void;
  onReset: () => void;
  onExport: () => void;
  approvalMetrics?: {
    pending: number;
    approved: number;
    rejected: number;
  };
}

const PricingActions: React.FC<PricingActionsProps> = ({
  modifiedCount,
  totalExceptions,
  workflowStatus,
  onSave,
  onSubmit,
  onReset,
  onExport,
  approvalMetrics
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
    <div className="flex flex-col space-y-4 rounded-lg border border-gray-800 bg-gray-950/50 p-4">
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
    </div>
  );
};

export default PricingActions;
