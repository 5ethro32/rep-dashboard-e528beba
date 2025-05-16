import React, { createContext, useContext, useState, useCallback } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { processEngineExcelFile } from '@/utils/engine-excel-utils';

// Import PriceRationale type
import { PriceRationale, PRICE_RATIONALES } from '@/components/engine-room/PriceEditor';

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
  handlePriceChange: (item: any, newPrice: number, rationale?: PriceRationale) => void;
  handleResetChanges: () => void;
  handleSaveChanges: () => void;
  handleSubmitForApproval: () => void;
  handleApproveItems: (itemIds: string[], comment?: string) => void;
  handleRejectItems: (itemIds: string[], comment: string) => void;
  handleExport: () => void;
  setUserRole: (role: 'analyst' | 'manager' | 'admin') => void;
  getPendingApprovalCount: () => number;
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
            
            // Initialize changeHistory if it doesn't exist
            if (!parsedData.changeHistory) {
              parsedData.changeHistory = [];
            }
            
            console.log('Recalculated metrics from cache:', {
              totalRevenue,
              totalProfit,
              overallMargin: parsedData.overallMargin
            });
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

  // Function to recalculate metrics based on current prices
  const recalculateEngineMetrics = useCallback((data: any) => {
    if (!data || !data.items || data.items.length === 0) return data;
    
    console.log('Recalculating engine metrics...');
    
    let totalRevenue = 0;
    let totalProfit = 0;
    let currentRevenue = 0;
    let currentProfit = 0;
    let currentTotalMargin = 0;
    let proposedTotalMargin = 0;
    let totalUsage = 0;
    let rule1Flags = 0;
    let rule2Flags = 0;
    
    // Recalculate for each item
    data.items.forEach((item: any) => {
      if (item.revaUsage > 0) {
        const usage = Math.max(0, Number(item.revaUsage) || 0);
        const currentPrice = Math.max(0, Number(item.currentREVAPrice) || 0);
        const proposedPrice = Math.max(0, Number(item.proposedPrice) || currentPrice);
        const cost = Math.max(0, Number(item.avgCost) || 0);
        
        // Calculate current metrics
        const curRevenue = usage * currentPrice;
        const curProfit = usage * (currentPrice - cost);
        const curMargin = currentPrice > 0 ? (currentPrice - cost) / currentPrice : 0;
        
        // Calculate proposed metrics
        const propRevenue = usage * proposedPrice;
        const propProfit = usage * (proposedPrice - cost);
        const propMargin = proposedPrice > 0 ? (proposedPrice - cost) / proposedPrice : 0;
        
        // Update totals
        currentRevenue += curRevenue;
        currentProfit += curProfit;
        totalRevenue += propRevenue;
        totalProfit += propProfit;
        
        // Update weighted margins
        currentTotalMargin += curMargin * usage;
        proposedTotalMargin += propMargin * usage;
        totalUsage += usage;
        
        // Count flags
        if (item.flag1) rule1Flags++;
        if (item.flag2) rule2Flags++;
      }
    });
    
    // Calculate overall margins
    const currentAvgMargin = totalUsage > 0 ? (currentTotalMargin / totalUsage) * 100 : 0;
    const proposedAvgMargin = totalUsage > 0 ? (proposedTotalMargin / totalUsage) * 100 : 0;
    
    // Update metrics in the data object
    data.currentRevenue = currentRevenue;
    data.currentProfit = currentProfit;
    data.currentAvgMargin = currentAvgMargin;
    data.totalRevenue = totalRevenue;
    data.totalProfit = totalProfit;
    data.proposedAvgMargin = proposedAvgMargin;
    data.overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    data.rule1Flags = rule1Flags;
    data.rule2Flags = rule2Flags;
    data.profitDelta = totalProfit - currentProfit;
    data.marginLift = proposedAvgMargin - currentAvgMargin;
    
    console.log('Metrics recalculated:', {
      currentRevenue,
      totalRevenue,
      currentProfit,
      totalProfit,
      currentAvgMargin,
      proposedAvgMargin,
      profitDelta: data.profitDelta,
      marginLift: data.marginLift
    });
    
    return data;
  }, []);

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
      
      // Initialize changeHistory array
      processedData.changeHistory = [];
      
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
      
      // Calculate initial metrics
      const dataWithMetrics = recalculateEngineMetrics(processedData);
      
      // Update cache and trigger UI update
      localStorage.setItem('engineRoomData', JSON.stringify(dataWithMetrics));
      await queryClient.invalidateQueries({ queryKey: ['engineRoomData'] });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      toast({
        title: "File processed successfully",
        description: `Processed ${dataWithMetrics.totalItems} items with ${dataWithMetrics.flaggedItems.length} exceptions.`
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
  }, [queryClient, toast, recalculateEngineMetrics]);

  // Updated handlePriceChange to include rationale
  const handlePriceChange = useCallback((item: any, newPrice: number, rationale?: PriceRationale) => {
    if (!engineData) return;
    
    console.log('Price change triggered for item:', item.id, 'New price:', newPrice, 'Rationale:', rationale);
    
    // Deep clone the data to avoid modifying the cache directly
    const updatedData = JSON.parse(JSON.stringify(engineData));
    
    // Find and update the item in the main items array
    const foundItem = updatedData.items.find((i: any) => i.id === item.id);
    if (foundItem) {
      // Store the old price for change tracking
      const oldPrice = foundItem.proposedPrice || foundItem.currentREVAPrice;
      
      // Update price and tracking information
      foundItem.proposedPrice = newPrice;
      foundItem.priceModified = true;
      
      // Add rationale if provided
      if (rationale) {
        foundItem.priceChangeRationale = rationale;
        foundItem.priceChangeRationaleDescription = PRICE_RATIONALES[rationale];
      }
      
      // Track exception history to identify repeat offenders
      // Initialize exception history array if it doesn't exist
      if (!foundItem.exceptionHistory) foundItem.exceptionHistory = [];
      
      // Check if the item is flagged
      const isFlagged = foundItem.flag1 || foundItem.flag2;
      const hasFlag = foundItem.flags && foundItem.flags.length > 0;
      
      // If the item is flagged, add an entry to the exception history
      if (isFlagged || hasFlag) {
        foundItem.exceptionHistory.push({
          date: new Date().toISOString(),
          flags: foundItem.flags || [],
          flag1: foundItem.flag1,
          flag2: foundItem.flag2,
          price: newPrice,
          oldPrice: oldPrice,
          rationale: rationale
        });
      }
      
      // IMPORTANT: Fix the margin calculation formula here
      // Use CORRECT formula: margin = (price - cost) / price
      const avgCost = Math.max(0, Number(foundItem.avgCost) || 0);
      foundItem.proposedMargin = newPrice > 0 ? (newPrice - avgCost) / newPrice : 0;
      
      // Update flag2 if margin is at or below 0% (changed from < 5%)
      foundItem.flag2 = foundItem.proposedMargin <= 0;

      // Add flag for significant price decrease (>5%)
      if (foundItem.currentREVAPrice > 0 && newPrice < foundItem.currentREVAPrice) {
        const decreasePercent = ((foundItem.currentREVAPrice - newPrice) / foundItem.currentREVAPrice) * 100;
        if (decreasePercent > 5) {
          if (!foundItem.flags) foundItem.flags = [];
          const existingDecreaseFlags = foundItem.flags.filter(f => f.startsWith('PRICE_DECREASE_'));
          if (existingDecreaseFlags.length > 0) {
            // Remove existing price decrease flags
            foundItem.flags = foundItem.flags.filter(f => !f.startsWith('PRICE_DECREASE_'));
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
            foundItem.flags = foundItem.flags.filter(f => f !== 'HIGH_PRICE');
          }
        }
      }
    }
    
    // Also update in flagged items if present - same pattern as above
    const flaggedItemIndex = updatedData.flaggedItems?.findIndex((i: any) => i.id === item.id);
    if (flaggedItemIndex >= 0) {
      const flaggedItem = updatedData.flaggedItems[flaggedItemIndex];
      flaggedItem.proposedPrice = newPrice;
      flaggedItem.priceModified = true;
      
      // Add rationale if provided
      if (rationale) {
        flaggedItem.priceChangeRationale = rationale;
        flaggedItem.priceChangeRationaleDescription = PRICE_RATIONALES[rationale];
      }
      
      // Track exception history for flagged items as well
      if (!flaggedItem.exceptionHistory) flaggedItem.exceptionHistory = [];
      
      // If the item is already flagged, that's an exception worth tracking
      flaggedItem.exceptionHistory.push({
        date: new Date().toISOString(),
        flags: flaggedItem.flags || [],
        flag1: flaggedItem.flag1,
        flag2: flaggedItem.flag2,
        price: newPrice,
        oldPrice: flaggedItem.proposedPrice || flaggedItem.currentREVAPrice,
        rationale: rationale
      });
      
      // IMPORTANT: Fix the margin calculation formula here
      // Use CORRECT formula: margin = (price - cost) / price
      const avgCost = Math.max(0, Number(flaggedItem.avgCost) || 0);
      flaggedItem.proposedMargin = 
        newPrice > 0 ? (newPrice - avgCost) / newPrice : 0;
        
      // Update flag2 if margin is at or below 0% (changed from < 5%)
      flaggedItem.flag2 = flaggedItem.proposedMargin <= 0;
        
      // Add flag for significant price decrease in flagged items as well
      if (flaggedItem.currentREVAPrice > 0 && 
          newPrice < flaggedItem.currentREVAPrice) {
        const decreasePercent = ((flaggedItem.currentREVAPrice - newPrice) / 
                               flaggedItem.currentREVAPrice) * 100;
        if (decreasePercent > 5) {
          if (!flaggedItem.flags) {
            flaggedItem.flags = [];
          }
          const existingDecreaseFlags = flaggedItem.flags.filter(f => f.startsWith('PRICE_DECREASE_'));
          if (existingDecreaseFlags.length > 0) {
            // Remove existing price decrease flags
            flaggedItem.flags = flaggedItem.flags.filter(f => !f.startsWith('PRICE_DECREASE_'));
          }
          flaggedItem.flags.push(`PRICE_DECREASE_${decreasePercent.toFixed(0)}%`);
        }
      }
      
      // Update HIGH_PRICE flag for flagged items only if TML is valid
      if (!flaggedItem.noMarketPrice && 
          flaggedItem.trueMarketLow && 
          flaggedItem.trueMarketLow > 0) {
        const isHighPrice = newPrice >= flaggedItem.trueMarketLow * 1.10;
        flaggedItem.flag1 = isHighPrice;
        
        if (isHighPrice) {
          if (!flaggedItem.flags) flaggedItem.flags = [];
          if (!flaggedItem.flags.includes('HIGH_PRICE')) {
            flaggedItem.flags.push('HIGH_PRICE');
          }
        } else {
          // Remove HIGH_PRICE flag if it exists
          if (flaggedItem.flags) {
            flaggedItem.flags = flaggedItem.flags.filter(f => f !== 'HIGH_PRICE');
          }
        }
      }
    }
    
    // Recalculate all metrics
    const dataWithUpdatedMetrics = recalculateEngineMetrics(updatedData);
    
    // Update the local storage and query cache
    localStorage.setItem('engineRoomData', JSON.stringify(dataWithUpdatedMetrics));
    queryClient.setQueryData(['engineRoomData'], dataWithUpdatedMetrics);
    
    // Track modified items
    setModifiedItems(prev => {
      const newSet = new Set(prev);
      newSet.add(item.id);
      return newSet;
    });
    
    console.log('Price updated successfully for item:', item.id);
    
    toast({
      title: "Price updated",
      description: `Updated price for ${item.description} to £${newPrice.toFixed(2)}${rationale ? ` (${PRICE_RATIONALES[rationale]})` : ''}`,
    });
  }, [engineData, queryClient, toast, recalculateEngineMetrics]);

  // Handle reset changes
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
          priceModified: false, // Reset modification flag since we're saving the changes
          flag2: proposedMargin <= 0  // Updated from < 0.05 to <= 0
        };
      }
      return item;
    });
    
    // Also update flagged items
    updatedData.flaggedItems = updatedData.items.filter((item: any) => item.flag1 || item.flag2);
    
    // Recalculate all metrics
    const dataWithUpdatedMetrics = recalculateEngineMetrics(updatedData);
    
    // Update the local storage and query cache
    localStorage.setItem('engineRoomData', JSON.stringify(dataWithUpdatedMetrics));
    queryClient.setQueryData(['engineRoomData'], dataWithUpdatedMetrics);
    
    // Clear modified items
    setModifiedItems(new Set());
    
    toast({
      title: "Changes reset",
      description: "All price changes have been reset to calculated values"
    });
  }, [engineData, queryClient, toast, recalculateEngineMetrics]);

  // Handle save changes - Updated to properly preserve price changes and rationales
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
          currentREVAPrice: item.proposedPrice, // Also update the currentREVAPrice to persist the change
          priceModified: false, // Reset modification flag since we're saving the changes
          // Preserve the rationale information
          // We don't clear priceChangeRationale because we want to keep track of why this price was changed
        };
      }
      return item;
    });
    
    // Update flagged items as well
    updatedData.flaggedItems = updatedData.items.filter((item: any) => item.flag1 || item.flag2);
    
    // Add entry to changeHistory
    if (!updatedData.changeHistory) {
      updatedData.changeHistory = [];
    }
    
    // Add a new change history entry
    updatedData.changeHistory.push({
      user: updatedData.currentUser || 'Current User',
      action: 'Price Updates',
      itemCount: modifiedItems.size,
      date: new Date().toISOString(),
    });
    
    // Recalculate all metrics after changes
    const dataWithUpdatedMetrics = recalculateEngineMetrics(updatedData);
    
    // Update the local storage and query cache
    localStorage.setItem('engineRoomData', JSON.stringify(dataWithUpdatedMetrics));
    queryClient.setQueryData(['engineRoomData'], dataWithUpdatedMetrics);
    
    // Clear modified items
    setModifiedItems(new Set());
    
    toast({
      title: "Changes saved",
      description: `Saved changes to ${modifiedItems.size} items`
    });
    
    console.log(`Saved changes to ${modifiedItems.size} items`);
    console.log('Updated metrics:', {
      currentAvgMargin: dataWithUpdatedMetrics.currentAvgMargin,
      proposedAvgMargin: dataWithUpdatedMetrics.proposedAvgMargin,
      marginLift: dataWithUpdatedMetrics.marginLift,
      profitDelta: dataWithUpdatedMetrics.profitDelta
    });
  }, [engineData, modifiedItems.size, queryClient, toast, recalculateEngineMetrics]);

  // Handle submit for approval - Updated to track in change history
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
          submittedBy: updatedData.currentUser || 'Current User' // Track the actual user
        };
      }
      return item;
    });
    
    // Update flagged items as well
    updatedData.flaggedItems = updatedData.items.filter((item: any) => item.flag1 || item.flag2);
    
    // Add entry to changeHistory
    if (!updatedData.changeHistory) {
      updatedData.changeHistory = [];
    }
    
    // Add a new change history entry for the submission
    updatedData.changeHistory.push({
      user: updatedData.currentUser || 'Current User',
      action: 'Submitted for Approval',
      itemCount: modifiedItems.size,
      date: new Date().toISOString(),
    });
    
    // Recalculate metrics
    const dataWithUpdatedMetrics = recalculateEngineMetrics(updatedData);
    
    // Update the local storage and query cache
    localStorage.setItem('engineRoomData', JSON.stringify(dataWithUpdatedMetrics));
    queryClient.setQueryData(['engineRoomData'], dataWithUpdatedMetrics);
    
    toast({
      title: "Submitted for approval",
      description: `${modifiedItems.size} price changes have been submitted for approval`
    });
  }, [engineData, modifiedItems.size, queryClient, toast, recalculateEngineMetrics]);

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
          reviewer: updatedData.currentUser || 'Manager', // This would be the actual reviewer in a real implementation
          reviewComments: comment || 'Approved'
        };
      }
      return item;
    });
    
    // Update flagged items as well
    updatedData.flaggedItems = updatedData.items.filter((item: any) => item.flag1 || item.flag2);
    
    // Add entry to changeHistory
    if (!updatedData.changeHistory) {
      updatedData.changeHistory = [];
    }
    
    // Add a new change history entry
    updatedData.changeHistory.push({
      user: updatedData.currentUser || 'Manager',
      action: 'Approved Items',
      itemCount: itemIds.length,
      date: new Date().toISOString(),
    });
    
    // Recalculate metrics
    const dataWithUpdatedMetrics = recalculateEngineMetrics(updatedData);
    
    // Update the local storage and query cache
    localStorage.setItem('engineRoomData', JSON.stringify(dataWithUpdatedMetrics));
    queryClient.setQueryData(['engineRoomData'], dataWithUpdatedMetrics);
    
    toast({
      title: "Items approved",
      description: `Approved ${itemIds.length} price changes`
    });
  }, [engineData, queryClient, toast, recalculateEngineMetrics]);

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
          reviewer: updatedData.currentUser || 'Manager', // This would be the actual reviewer in a real implementation
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
          reviewer: updatedData.currentUser || 'Manager',
          reviewComments: comment
        };
      }
      return item;
    });
    
    // Add entry to changeHistory
    if (!updatedData.changeHistory) {
      updatedData.changeHistory = [];
    }
    
    // Add a new change history entry
    updatedData.changeHistory.push({
      user: updatedData.currentUser || 'Manager',
      action: 'Rejected Items',
      itemCount: itemIds.length,
      date: new Date().toISOString(),
    });
    
    // Recalculate metrics
    const dataWithUpdatedMetrics = recalculateEngineMetrics(updatedData);
    
    // Update the local storage and query cache
    localStorage.setItem('engineRoomData', JSON.stringify(dataWithUpdatedMetrics));
    queryClient.setQueryData(['engineRoomData'], dataWithUpdatedMetrics);
    
    toast({
      title: "Items rejected",
      description: `Rejected ${itemIds.length} price changes with comment`
    });
  }, [engineData, queryClient, toast, recalculateEngineMetrics]);

  // Update handleExport to include rationale in the export
  const handleExport = useCallback(() => {
    if (!engineData) return;
    
    try {
      // Import the exportPricingData function from our utility
      import('@/utils/pricing-export-utils').then(({ exportPricingData }) => {
        // Call the export function with the engineData items
        const result = exportPricingData(engineData.items, {
          includeWorkflowStatus: true,
          includeRationales: true, // Add this option to include rationales in export
          fileName: `REVA_Pricing_${new Date().toISOString().substring(0, 10)}.xlsx`
        });
        
        toast({
          title: "Export complete",
          description: `Exported ${result.exportedCount} items to ${result.fileName}`
        });
      }).catch(error => {
        console.error('Error loading export utility:', error);
        toast({
          title: "Export failed",
          description: "Could not load the export utility",
          variant: "destructive"
        });
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
