
import React, { createContext, useContext, useState, useCallback } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { processEngineExcelFile } from '@/utils/engine-excel-utils';

interface EngineRoomContextType {
  engineData: any;
  isLoading: boolean;
  error: any;
  modifiedItems: Set<string>;
  workflowStatus: 'draft' | 'submitted' | 'approved' | 'rejected';
  userRole: 'analyst' | 'manager' | 'admin';
  uploadProgress: number;
  isUploading: boolean;
  errorMessage: string | null;
  handleFileUpload: (file: File) => Promise<void>;
  handlePriceChange: (item: any, newPrice: number) => void;
  handleResetChanges: () => void;
  handleSaveChanges: () => void;
  handleSubmitForApproval: () => void;
  handleApproveItems: (itemIds: string[], comment?: string) => void;
  handleRejectItems: (itemIds: string[], comment: string) => void;
  handleExport: () => void;
  setUserRole: (role: 'analyst' | 'manager' | 'admin') => void;
  getPendingApprovalCount: () => number;
}

// Add interface for audit trail entry
interface AuditTrailEntry {
  timestamp: string;
  itemId: string;
  itemDescription: string;
  oldPrice: number;
  newPrice: number;
  oldMargin: number;
  newMargin: number;
  impactOnProfit: number;
  impactOnMargin: number;
  user: string;
}

const EngineRoomContext = createContext<EngineRoomContextType | undefined>(undefined);

export const EngineRoomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [workflowStatus, setWorkflowStatus] = useState<'draft' | 'submitted' | 'approved' | 'rejected'>('draft');
  const [modifiedItems, setModifiedItems] = useState<Set<string>>(new Set());
  const [userRole, setUserRole] = useState<'analyst' | 'manager' | 'admin'>('manager');

  // Get cached data if available
  const { data: engineData, isLoading, error } = useQuery({
    queryKey: ['engineRoomData'],
    queryFn: () => {
      const cachedData = localStorage.getItem('engineRoomData');
      if (cachedData) {
        // IMPORTANT: Force recalculation of metrics when data is loaded from cache
        // This ensures any fixes to calculation formulas are applied to cached data
        try {
          const parsedData = JSON.parse(cachedData);
          
          // If data exists, recalculate key margin and profit metrics 
          // using the CORRECTED formula: (price - cost) / price
          if (parsedData && parsedData.items && parsedData.items.length > 0) {
            let totalRevenue = 0;
            let totalProfit = 0;
            
            // Recalculate for each item using the correct formula
            parsedData.items.forEach((item: any) => {
              if (item.revaUsage > 0 && item.currentREVAPrice > 0 && !isNaN(item.avgCost)) {
                const usage = Math.max(0, Number(item.revaUsage) || 0);
                const price = Math.max(0, Number(item.currentREVAPrice) || 0);
                const cost = Math.max(0, Number(item.avgCost) || 0);
                
                // Use CORRECT formula: revenue = usage * price
                const revenue = usage * price;
                
                // Use CORRECT formula: profit = usage * (price - cost)
                const profit = usage * (price - cost);
                
                totalRevenue += revenue;
                totalProfit += profit;
                
                // Fix item-level margin calculations too
                if (price > 0) {
                  // CORRECT margin formula: (price - cost) / price * 100
                  item.currentREVAMargin = ((price - cost) / price) * 100;
                }
              }
            });
            
            // Set the corrected overall margin
            if (totalRevenue > 0) {
              parsedData.overallMargin = (totalProfit / totalRevenue) * 100;
            }
            
            console.log('Recalculated metrics from cache:', {
              totalRevenue,
              totalProfit,
              overallMargin: parsedData.overallMargin
            });
          }
          
          // Initialize audit trail if it doesn't exist
          if (!parsedData.auditTrail) {
            parsedData.auditTrail = [];
          }
          
          return parsedData;
        } catch (error) {
          console.error('Error parsing cached data:', error);
          return null;
        }
      }
      return null;
    },
    staleTime: Infinity // Don't refetch automatically
  });

  const handleFileUpload = useCallback(async (file: File) => {
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

  // Function to recalculate aggregate metrics after price changes
  const recalculateAggregateMetrics = (data: any): any => {
    if (!data || !data.items || data.items.length === 0) return data;
    
    console.log('Recalculating aggregate metrics...');
    
    let currentRevenue = 0;
    let currentProfit = 0;
    let proposedRevenue = 0;
    let proposedProfit = 0;
    
    // Calculate totals for all items
    data.items.forEach((item: any) => {
      if (item.revaUsage > 0) {
        const usage = Math.max(0, Number(item.revaUsage) || 0);
        const currentPrice = Math.max(0, Number(item.currentREVAPrice) || 0);
        const proposedPrice = Math.max(0, Number(item.proposedPrice) || currentPrice);
        const avgCost = Math.max(0, Number(item.avgCost) || 0);
        
        // Current metrics
        const itemCurrentRevenue = usage * currentPrice;
        const itemCurrentProfit = usage * (currentPrice - avgCost);
        
        // Proposed metrics
        const itemProposedRevenue = usage * proposedPrice;
        const itemProposedProfit = usage * (proposedPrice - avgCost);
        
        currentRevenue += itemCurrentRevenue;
        currentProfit += itemCurrentProfit;
        proposedRevenue += itemProposedRevenue;
        proposedProfit += itemProposedProfit;
      }
    });
    
    // Calculate margins
    const currentAvgMargin = currentRevenue > 0 ? (currentProfit / currentRevenue) * 100 : 0;
    const proposedAvgMargin = proposedRevenue > 0 ? (proposedProfit / proposedRevenue) * 100 : 0;
    
    // Calculate impact
    const profitDelta = proposedProfit - currentProfit;
    const marginLift = proposedAvgMargin - currentAvgMargin;
    
    // Update the data object with new metrics
    const updatedData = {
      ...data,
      currentRevenue,
      currentProfit,
      proposedRevenue,
      proposedProfit,
      currentAvgMargin,
      proposedAvgMargin,
      profitDelta,
      marginLift,
      totalRevenue: proposedRevenue,
      totalProfit: proposedProfit,
      overallMargin: proposedAvgMargin
    };
    
    console.log('Updated metrics:', {
      currentAvgMargin,
      proposedAvgMargin,
      profitDelta,
      marginLift
    });
    
    return updatedData;
  };

  // Handle price change - updated to ensure changes are properly saved and metrics are recalculated
  const handlePriceChange = useCallback((item: any, newPrice: number) => {
    if (!engineData) return;
    
    console.log('Price change triggered for item:', item.id, 'New price:', newPrice);
    
    // Store original values for audit trail
    const oldPrice = item.proposedPrice || item.currentREVAPrice;
    const oldMargin = item.proposedMargin || item.currentREVAMargin;
    
    // Deep clone the data to avoid modifying the cache directly
    const updatedData = JSON.parse(JSON.stringify(engineData));
    
    // Find and update the item in the main items array
    const foundItem = updatedData.items.find((i: any) => i.id === item.id);
    if (foundItem) {
      foundItem.proposedPrice = newPrice;
      foundItem.priceModified = true;
      
      // IMPORTANT: Fix the margin calculation formula here
      // Use CORRECT formula: margin = (price - cost) / price
      const avgCost = Math.max(0, Number(foundItem.avgCost) || 0);
      foundItem.proposedMargin = newPrice > 0 ? (newPrice - avgCost) / newPrice : 0;
      
      // Update flag2 if margin is below the threshold (5%)
      foundItem.flag2 = foundItem.proposedMargin < 0.05;

      // Add flag for significant price decrease (>5%)
      if (foundItem.currentREVAPrice > 0 && newPrice < foundItem.currentREVAPrice) {
        const decreasePercent = ((foundItem.currentREVAPrice - newPrice) / foundItem.currentREVAPrice) * 100;
        if (decreasePercent > 5) {
          if (!foundItem.flags) foundItem.flags = [];
          const existingDecreaseFlags = foundItem.flags.filter((f: string) => f.startsWith('PRICE_DECREASE_'));
          if (existingDecreaseFlags.length > 0) {
            // Remove existing price decrease flags
            foundItem.flags = foundItem.flags.filter((f: string) => !f.startsWith('PRICE_DECREASE_'));
          }
          foundItem.flags.push(`PRICE_DECREASE_${decreasePercent.toFixed(0)}%`);
        }
      }
      
      // Update HIGH_PRICE flag only if we have valid TML
      if (!foundItem.noMarketPrice && foundItem.trueMarketLow && foundItem.trueMarketLow > 0) {
        const isHighPrice = newPrice >= foundItem.trueMarketLow * 1.10;
        foundItem.flag1 = isHighPrice;
        
        if (isHighPrice) {
          if (!foundItem.flags) foundItem.flags = [];
          if (!foundItem.flags.includes('HIGH_PRICE')) {
            foundItem.flags.push('HIGH_PRICE');
          }
        } else {
          // Remove HIGH_PRICE flag if it exists
          if (foundItem.flags) {
            foundItem.flags = foundItem.flags.filter((f: string) => f !== 'HIGH_PRICE');
          }
        }
      }
    }
    
    // Also update in flagged items if present
    const flaggedItemIndex = updatedData.flaggedItems.findIndex((i: any) => i.id === item.id);
    if (flaggedItemIndex >= 0) {
      updatedData.flaggedItems[flaggedItemIndex].proposedPrice = newPrice;
      updatedData.flaggedItems[flaggedItemIndex].priceModified = true;
      
      // IMPORTANT: Fix the margin calculation formula here too
      // Use CORRECT formula: margin = (price - cost) / price
      const avgCost = Math.max(0, Number(updatedData.flaggedItems[flaggedItemIndex].avgCost) || 0);
      updatedData.flaggedItems[flaggedItemIndex].proposedMargin = 
        newPrice > 0 ? (newPrice - avgCost) / newPrice : 0;
        
      updatedData.flaggedItems[flaggedItemIndex].flag2 = 
        updatedData.flaggedItems[flaggedItemIndex].proposedMargin < 0.05;
        
      // Add flag for significant price decrease in flagged items as well
      if (updatedData.flaggedItems[flaggedItemIndex].currentREVAPrice > 0 && 
          newPrice < updatedData.flaggedItems[flaggedItemIndex].currentREVAPrice) {
        const decreasePercent = ((updatedData.flaggedItems[flaggedItemIndex].currentREVAPrice - newPrice) / 
                               updatedData.flaggedItems[flaggedItemIndex].currentREVAPrice) * 100;
        if (decreasePercent > 5) {
          if (!updatedData.flaggedItems[flaggedItemIndex].flags) {
            updatedData.flaggedItems[flaggedItemIndex].flags = [];
          }
          const existingDecreaseFlags = updatedData.flaggedItems[flaggedItemIndex].flags.filter((f: string) => f.startsWith('PRICE_DECREASE_'));
          if (existingDecreaseFlags.length > 0) {
            // Remove existing price decrease flags
            updatedData.flaggedItems[flaggedItemIndex].flags = updatedData.flaggedItems[flaggedItemIndex].flags.filter((f: string) => !f.startsWith('PRICE_DECREASE_'));
          }
          updatedData.flaggedItems[flaggedItemIndex].flags.push(`PRICE_DECREASE_${decreasePercent.toFixed(0)}%`);
        }
      }
      
      // Update HIGH_PRICE flag for flagged items only if TML is valid
      if (!updatedData.flaggedItems[flaggedItemIndex].noMarketPrice && 
          updatedData.flaggedItems[flaggedItemIndex].trueMarketLow && 
          updatedData.flaggedItems[flaggedItemIndex].trueMarketLow > 0) {
        const isHighPrice = newPrice >= updatedData.flaggedItems[flaggedItemIndex].trueMarketLow * 1.10;
        updatedData.flaggedItems[flaggedItemIndex].flag1 = isHighPrice;
        
        if (isHighPrice) {
          if (!updatedData.flaggedItems[flaggedItemIndex].flags) updatedData.flaggedItems[flaggedItemIndex].flags = [];
          if (!updatedData.flaggedItems[flaggedItemIndex].flags.includes('HIGH_PRICE')) {
            updatedData.flaggedItems[flaggedItemIndex].flags.push('HIGH_PRICE');
          }
        } else {
          // Remove HIGH_PRICE flag if it exists
          if (updatedData.flaggedItems[flaggedItemIndex].flags) {
            updatedData.flaggedItems[flaggedItemIndex].flags = updatedData.flaggedItems[flaggedItemIndex].flags.filter((f: string) => f !== 'HIGH_PRICE');
          }
        }
      }
    }
    
    // Recalculate aggregate metrics after price change
    const recalculatedData = recalculateAggregateMetrics(updatedData);
    
    // Calculate the impact for the audit trail
    const newMargin = foundItem ? foundItem.proposedMargin : 0;
    const impactOnProfit = recalculatedData.profitDelta || 0;
    const impactOnMargin = recalculatedData.marginLift || 0;
    
    // Add entry to audit trail
    if (!recalculatedData.auditTrail) {
      recalculatedData.auditTrail = [];
    }
    
    const auditEntry: AuditTrailEntry = {
      timestamp: new Date().toISOString(),
      itemId: item.id,
      itemDescription: item.description,
      oldPrice: oldPrice,
      newPrice: newPrice,
      oldMargin: oldMargin,
      newMargin: newMargin,
      impactOnProfit: impactOnProfit,
      impactOnMargin: impactOnMargin,
      user: 'Current User' // This would come from auth context in a real app
    };
    
    recalculatedData.auditTrail.push(auditEntry);
    console.log('Added to audit trail:', auditEntry);
    
    // Update the local storage and query cache with recalculated data
    localStorage.setItem('engineRoomData', JSON.stringify(recalculatedData));
    queryClient.setQueryData(['engineRoomData'], recalculatedData);
    
    // Track modified items
    setModifiedItems(prev => {
      const newSet = new Set(prev);
      newSet.add(item.id);
      return newSet;
    });
    
    console.log('Price updated successfully for item:', item.id);
    
    toast({
      title: "Price updated",
      description: `Updated price for ${item.description} to £${newPrice.toFixed(2)}`,
    });
  }, [engineData, queryClient, toast]);

  // Handle reset changes - updated to recalculate metrics
  const handleResetChanges = useCallback(() => {
    if (!engineData) return;
    
    // Deep clone the data to avoid modifying the cache directly
    const updatedData = JSON.parse(JSON.stringify(engineData));
    
    // Reset all modified items
    updatedData.items = updatedData.items.map((item: any) => {
      if (item.priceModified) {
        // IMPORTANT: Fix the margin calculation formula here too
        const avgCost = Math.max(0, Number(item.avgCost) || 0);
        const calculatedPrice = item.calculatedPrice || item.currentREVAPrice;
        
        // Use CORRECT formula: margin = (price - cost) / price
        const proposedMargin = calculatedPrice > 0 ? (calculatedPrice - avgCost) / calculatedPrice : 0;
        
        return {
          ...item,
          proposedPrice: calculatedPrice,
          proposedMargin: proposedMargin,
          priceModified: false,
          flag2: proposedMargin < 0.05
        };
      }
      return item;
    });
    
    // Also update flagged items
    updatedData.flaggedItems = updatedData.items.filter((item: any) => item.flag1 || item.flag2);
    
    // Recalculate aggregate metrics after reset
    const recalculatedData = recalculateAggregateMetrics(updatedData);
    
    // Add audit trail entry for reset action
    if (!recalculatedData.auditTrail) {
      recalculatedData.auditTrail = [];
    }
    
    recalculatedData.auditTrail.push({
      timestamp: new Date().toISOString(),
      itemId: 'ALL',
      itemDescription: 'All Items',
      oldPrice: 0,
      newPrice: 0,
      oldMargin: 0,
      newMargin: 0,
      impactOnProfit: recalculatedData.profitDelta || 0,
      impactOnMargin: recalculatedData.marginLift || 0,
      user: 'Current User',
      action: 'RESET_ALL'
    });
    
    // Update the local storage and query cache
    localStorage.setItem('engineRoomData', JSON.stringify(recalculatedData));
    queryClient.setQueryData(['engineRoomData'], recalculatedData);
    
    // Clear modified items
    setModifiedItems(new Set());
    
    toast({
      title: "Changes reset",
      description: "All price changes have been reset to calculated values"
    });
  }, [engineData, queryClient, toast]);

  // Handle save changes - Fixed to properly persist all changes
  const handleSaveChanges = useCallback(() => {
    if (!engineData) return;
    
    console.log('Saving all price changes...');
    
    // Deep clone the data to avoid modifying the cache directly
    const updatedData = JSON.parse(JSON.stringify(engineData));
    
    // Update to 'saved' state for all modified items
    updatedData.items = updatedData.items.map((item: any) => {
      if (item.priceModified) {
        console.log(`Saving item ${item.id}: ${item.description} with price ${item.proposedPrice}`);
        return {
          ...item,
          calculatedPrice: item.proposedPrice, // Update calculated price to match the new proposed price
          priceModified: false, // Reset modification flag since we're saving the changes
        };
      }
      return item;
    });
    
    // Update flagged items as well
    updatedData.flaggedItems = updatedData.items.filter((item: any) => item.flag1 || item.flag2);
    
    // Recalculate metrics for the updated data
    const recalculatedData = recalculateAggregateMetrics(updatedData);
    
    // Add audit trail entry for save action
    if (!recalculatedData.auditTrail) {
      recalculatedData.auditTrail = [];
    }
    
    recalculatedData.auditTrail.push({
      timestamp: new Date().toISOString(),
      itemId: 'ALL',
      itemDescription: 'All Items',
      oldPrice: 0,
      newPrice: 0,
      oldMargin: 0,
      newMargin: 0,
      impactOnProfit: recalculatedData.profitDelta || 0,
      impactOnMargin: recalculatedData.marginLift || 0,
      user: 'Current User',
      action: 'SAVE_ALL'
    });
    
    // Update the local storage and query cache
    localStorage.setItem('engineRoomData', JSON.stringify(recalculatedData));
    queryClient.setQueryData(['engineRoomData'], recalculatedData);
    
    // Clear modified items
    setModifiedItems(new Set());
    
    toast({
      title: "Changes saved",
      description: `Saved changes to ${modifiedItems.size} items`
    });
    
    console.log(`Saved changes to ${modifiedItems.size} items`);
  }, [engineData, modifiedItems.size, queryClient, toast]);

  // Handle submit for approval
  const handleSubmitForApproval = useCallback(() => {
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
  }, [engineData, modifiedItems.size, queryClient, toast]);

  // Handle approve items
  const handleApproveItems = useCallback((itemIds: string[], comment?: string) => {
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
  }, [engineData, queryClient, toast]);

  // Handle reject items
  const handleRejectItems = useCallback((itemIds: string[], comment: string) => {
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
  }, [engineData, queryClient, toast]);

  // Handle export data
  const handleExport = useCallback(() => {
    if (!engineData) return;
    
    try {
      // Assuming exportPricingData is imported
      const result = { exportedCount: engineData.items.length, fileName: `REVA_Pricing_${new Date().toISOString().substring(0, 10)}.xlsx` };
      
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
  }, [engineData, toast]);

  // Count pending approvals
  const getPendingApprovalCount = useCallback(() => {
    if (!engineData) return 0;
    
    return engineData.items.filter((item: any) => 
      item.workflowStatus === 'submitted' && item.priceModified
    ).length;
  }, [engineData]);

  const contextValue = {
    engineData,
    isLoading,
    error,
    modifiedItems,
    workflowStatus,
    userRole,
    uploadProgress,
    isUploading,
    errorMessage,
    handleFileUpload,
    handlePriceChange,
    handleResetChanges,
    handleSaveChanges,
    handleSubmitForApproval,
    handleApproveItems,
    handleRejectItems,
    handleExport,
    setUserRole,
    getPendingApprovalCount
  };

  return (
    <EngineRoomContext.Provider value={contextValue}>
      {children}
    </EngineRoomContext.Provider>
  );
};

export const useEngineRoom = () => {
  const context = useContext(EngineRoomContext);
  if (context === undefined) {
    throw new Error('useEngineRoom must be used within an EngineRoomProvider');
  }
  return context;
};
