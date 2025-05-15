
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, TrendingDown, TrendingUp, ArrowRight, Calculator } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatPercentage } from '@/utils/formatting-utils';

interface PricingRuleExplainerProps {
  item: any;
  open: boolean;
  onClose: () => void;
}

const PricingRuleExplainer: React.FC<PricingRuleExplainerProps> = ({ 
  item, 
  open, 
  onClose 
}) => {
  const [simulatedPrice, setSimulatedPrice] = useState('');
  const [simulatedResults, setSimulatedResults] = useState<any>(null);

  if (!item) return null;
  
  // Simulate new price
  const handleSimulatePrice = () => {
    const newPrice = parseFloat(simulatedPrice);
    if (isNaN(newPrice) || newPrice <= 0) return;

    const newMargin = (newPrice - item.avgCost) / newPrice;
    const priceChangePercentage = ((newPrice - item.currentREVAPrice) / item.currentREVAPrice) * 100;
    const marginChangePercentage = ((newMargin - item.currentREVAMargin) / item.currentREVAMargin) * 100;
    const profitChange = (newPrice - item.avgCost) * item.revaUsage - 
                          (item.currentREVAPrice - item.avgCost) * item.revaUsage;

    setSimulatedResults({
      price: newPrice,
      margin: newMargin,
      priceChangePercentage,
      marginChangePercentage,
      profitChange
    });
  };
  
  // Get rule description
  const getRuleDescription = () => {
    // Extract rule number (1 or 2) and variation (a or b) from the appliedRule
    const ruleApplied = item.ruleApplied || '';
    const isRule1 = ruleApplied.startsWith('rule1');
    const isDownwardTrend = ruleApplied.includes('downward');
    
    // Determine usage group based on usageRank
    const usageRank = item.usageRank || 1;
    const usageGroup = usageRank <= 2 
      ? 'Fast moving (rank 1-2)'
      : usageRank <= 4
        ? 'Medium moving (rank 3-4)'
        : 'Slow moving (rank 5-6)';
    
    // Get usage-based uplift percentage
    const usageUplift = usageRank <= 2 ? 0 : usageRank <= 4 ? 1 : 2;
    
    // Standard uplifts and markup percentages
    const standardMLUplift = 3; // Standard 3% uplift for Market Low
    const standardCostMarkup = 12; // Standard 12% markup for cost
    
    if (isRule1) {
      return (
        <>
          <p className="text-sm mb-2">
            <strong>Rule 1{isDownwardTrend ? 'a' : 'b'}:</strong> Applied when Average Cost is less than Market Low
          </p>
          <p className="text-sm mb-2">
            <strong>Usage Group:</strong> {usageGroup} ({usageUplift}% additional uplift)
          </p>
          <p className="text-sm mb-2">
            <strong>Market Low Uplift:</strong> {standardMLUplift}% standard + {usageUplift}% usage-based
          </p>
          <p className="text-sm">
            <strong>Cost Trend:</strong> {isDownwardTrend ? 'Downward' : 'Flat/Upward'}
          </p>
        </>
      );
    } else {
      return (
        <>
          <p className="text-sm mb-2">
            <strong>Rule 2{isDownwardTrend ? 'a' : 'b'}:</strong> Applied when Average Cost is greater than or equal to Market Low
          </p>
          <p className="text-sm mb-2">
            <strong>Usage Group:</strong> {usageGroup} ({usageUplift}% additional uplift)
          </p>
          <p className="text-sm mb-2">
            <strong>Market Low Uplift:</strong> {standardMLUplift}% standard + {usageUplift}% usage-based
          </p>
          <p className="text-sm mb-2">
            <strong>Cost Markup:</strong> {standardCostMarkup}% standard + {usageUplift}% usage-based
          </p>
          <p className="text-sm">
            <strong>Cost Trend:</strong> {isDownwardTrend ? 'Downward' : 'Flat/Upward'}
          </p>
        </>
      );
    }
  };
  
  // Get calculation steps based on the actual rule applied
  const getCalculationSteps = () => {
    const ruleApplied = item.ruleApplied || '';
    const isRule1 = ruleApplied.startsWith('rule1');
    const isDownwardTrend = ruleApplied.includes('downward');
    const usageRank = item.usageRank || 1;
    
    // Get usage-based uplift percentage (0%, 1%, or 2%)
    const usageUplift = usageRank <= 2 ? 0 : usageRank <= 4 ? 1 : 2;
    
    // Standard uplifts and markup percentages aligned with rule-simulator-utils.ts
    const standardMLUplift = 3; // Standard 3% uplift for Market Low
    const standardCostMarkup = 12; // Standard 12% markup for cost
    
    // Calculate the total uplift percentages
    const mlUpliftPercentage = standardMLUplift + usageUplift;
    const costMarkupPercentage = standardCostMarkup + usageUplift;
    
    // Calculate the multipliers
    const mlUpliftMultiplier = 1 + (mlUpliftPercentage / 100);
    const costMarkupMultiplier = 1 + (costMarkupPercentage / 100);
    
    // Format rule name for display (1a, 1b, 2a, 2b)
    const ruleDisplay = `Rule ${isRule1 ? '1' : '2'}${isDownwardTrend ? 'a' : 'b'}`;
    
    if (isRule1) {
      // Rule 1: AVC < ML
      if (isDownwardTrend) {
        // Rule 1a - Market Low + usage-based uplift
        return (
          <div className="space-y-4">
            <div className="px-5 py-4 rounded-lg bg-slate-900/50 border border-slate-700/40">
              <h3 className="font-semibold text-base mb-3 text-blue-400">Calculation Steps</h3>
              
              <ol className="space-y-4">
                <li className="pl-2">
                  <div className="flex items-center gap-2 mb-1 text-sm font-semibold">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-800/70 text-white text-xs">1</div>
                    <span>Determine pricing based on usage rank and trend:</span>
                  </div>
                  <div className="ml-8 mt-1 bg-gray-800/50 p-3 rounded text-sm font-mono">
                    <div>Usage Rank: {usageRank}, Trend: Downward</div>
                    <div>Applied Rule: {ruleDisplay} (Market Low + {usageUplift}% usage-based uplift)</div>
                  </div>
                </li>
                
                <li className="pl-2">
                  <div className="flex items-center gap-2 mb-1 text-sm font-semibold">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-800/70 text-white text-xs">2</div>
                    <span>Calculate proposed price:</span>
                  </div>
                  <div className="ml-8 mt-1 bg-gray-800/50 p-3 rounded text-sm font-mono">
                    Market Low × (1 + {usageUplift}%) = {formatCurrency(item.marketLow)} × {(1 + usageUplift/100).toFixed(2)} = {formatCurrency(item.marketLow * (1 + usageUplift/100))}
                  </div>
                </li>
                
                <li className="pl-2">
                  <div className="flex items-center gap-2 mb-1 text-sm font-semibold">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-800/70 text-white text-xs">3</div>
                    <span>Ensure price is not lower than current price:</span>
                  </div>
                  <div className="ml-8 mt-1 bg-gray-800/50 p-3 rounded text-sm font-mono">
                    max(calculated price, current price) = max({formatCurrency(item.marketLow * (1 + usageUplift/100))}, {formatCurrency(item.currentREVAPrice)}) = {formatCurrency(Math.max(item.marketLow * (1 + usageUplift/100), item.currentREVAPrice))}
                  </div>
                </li>
                
                <li className="pl-2">
                  <div className="flex items-center gap-2 mb-1 text-sm font-semibold">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-800/70 text-white text-xs">4</div>
                    <span>Calculate margin:</span>
                  </div>
                  <div className="ml-8 mt-1 bg-gray-800/50 p-3 rounded text-sm font-mono">
                    (proposedPrice - avgCost) / proposedPrice = ({formatCurrency(item.proposedPrice)} - {formatCurrency(item.avgCost)}) / {formatCurrency(item.proposedPrice)} = {formatPercentage(item.proposedMargin)}
                  </div>
                </li>
              </ol>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-700/50">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-blue-400" />
                <h4 className="font-semibold text-lg">Final Result</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-3">
                <div className="bg-blue-950/30 p-4 rounded-lg border border-blue-900/50">
                  <p className="text-sm text-blue-300">Proposed Price</p>
                  <p className="text-2xl font-bold">{formatCurrency(item.proposedPrice)}</p>
                </div>
                <div className="bg-blue-950/30 p-4 rounded-lg border border-blue-900/50">
                  <p className="text-sm text-blue-300">Proposed Margin</p>
                  <p className="text-2xl font-bold">{formatPercentage(item.proposedMargin)}</p>
                </div>
              </div>
            </div>
          </div>
        );
      } else {
        // Rule 1b - Higher of Market Low + uplift or Cost + markup
        const mlPrice = item.marketLow * mlUpliftMultiplier;
        const costPrice = item.avgCost * costMarkupMultiplier;
        
        return (
          <div className="space-y-4">
            <div className="px-5 py-4 rounded-lg bg-slate-900/50 border border-slate-700/40">
              <h3 className="font-semibold text-base mb-3 text-blue-400">Calculation Steps</h3>
              
              <ol className="space-y-4">
                <li className="pl-2">
                  <div className="flex items-center gap-2 mb-1 text-sm font-semibold">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-800/70 text-white text-xs">1</div>
                    <span>Determine pricing based on usage rank and trend:</span>
                  </div>
                  <div className="ml-8 mt-1 bg-gray-800/50 p-3 rounded text-sm font-mono">
                    <div>Usage Rank: {usageRank}, Trend: Upward</div>
                    <div>Applied Rule: {ruleDisplay} (Higher of Market Low + {mlUpliftPercentage}% or Average Cost + {costMarkupPercentage}%)</div>
                  </div>
                </li>
                
                <li className="pl-2">
                  <div className="flex items-center gap-2 mb-1 text-sm font-semibold">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-800/70 text-white text-xs">2</div>
                    <span>Calculate Market Low price:</span>
                  </div>
                  <div className="ml-8 mt-1 bg-gray-800/50 p-3 rounded text-sm font-mono">
                    Market Low × (1 + {mlUpliftPercentage}%) = {formatCurrency(item.marketLow)} × {mlUpliftMultiplier.toFixed(2)} = {formatCurrency(mlPrice)}
                  </div>
                </li>
                
                <li className="pl-2">
                  <div className="flex items-center gap-2 mb-1 text-sm font-semibold">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-800/70 text-white text-xs">3</div>
                    <span>Calculate Cost-based price:</span>
                  </div>
                  <div className="ml-8 mt-1 bg-gray-800/50 p-3 rounded text-sm font-mono">
                    avgCost × (1 + {costMarkupPercentage}%) = {formatCurrency(item.avgCost)} × {costMarkupMultiplier.toFixed(2)} = {formatCurrency(costPrice)}
                  </div>
                </li>
                
                <li className="pl-2">
                  <div className="flex items-center gap-2 mb-1 text-sm font-semibold">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-800/70 text-white text-xs">4</div>
                    <span>Take higher of the two prices:</span>
                  </div>
                  <div className="ml-8 mt-1 bg-gray-800/50 p-3 rounded text-sm font-mono">
                    max(ML price, Cost price) = max({formatCurrency(mlPrice)}, {formatCurrency(costPrice)}) = {formatCurrency(Math.max(mlPrice, costPrice))}
                  </div>
                </li>
                
                <li className="pl-2">
                  <div className="flex items-center gap-2 mb-1 text-sm font-semibold">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-800/70 text-white text-xs">5</div>
                    <span>Ensure price is not lower than current price:</span>
                  </div>
                  <div className="ml-8 mt-1 bg-gray-800/50 p-3 rounded text-sm font-mono">
                    max(calculated price, current price) = max({formatCurrency(Math.max(mlPrice, costPrice))}, {formatCurrency(item.currentREVAPrice)}) = {formatCurrency(Math.max(Math.max(mlPrice, costPrice), item.currentREVAPrice))}
                  </div>
                </li>
                
                <li className="pl-2">
                  <div className="flex items-center gap-2 mb-1 text-sm font-semibold">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-800/70 text-white text-xs">6</div>
                    <span>Calculate margin:</span>
                  </div>
                  <div className="ml-8 mt-1 bg-gray-800/50 p-3 rounded text-sm font-mono">
                    (proposedPrice - avgCost) / proposedPrice = ({formatCurrency(item.proposedPrice)} - {formatCurrency(item.avgCost)}) / {formatCurrency(item.proposedPrice)} = {formatPercentage(item.proposedMargin)}
                  </div>
                </li>
              </ol>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-700/50">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-blue-400" />
                <h4 className="font-semibold text-lg">Final Result</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-3">
                <div className="bg-blue-950/30 p-4 rounded-lg border border-blue-900/50">
                  <p className="text-sm text-blue-300">Proposed Price</p>
                  <p className="text-2xl font-bold">{formatCurrency(item.proposedPrice)}</p>
                </div>
                <div className="bg-blue-950/30 p-4 rounded-lg border border-blue-900/50">
                  <p className="text-sm text-blue-300">Proposed Margin</p>
                  <p className="text-2xl font-bold">{formatPercentage(item.proposedMargin)}</p>
                </div>
              </div>
            </div>
          </div>
        );
      }
    } else {
      // Rule 2: AVC ≥ ML
      if (isDownwardTrend) {
        // Rule 2a - Lower of Market Low + uplift or Cost + markup
        const mlPrice = item.marketLow * mlUpliftMultiplier;
        const costPrice = item.avgCost * costMarkupMultiplier;
        
        return (
          <div className="space-y-4">
            <div className="px-5 py-4 rounded-lg bg-slate-900/50 border border-slate-700/40">
              <h3 className="font-semibold text-base mb-3 text-blue-400">Calculation Steps</h3>
              
              <ol className="space-y-4">
                <li className="pl-2">
                  <div className="flex items-center gap-2 mb-1 text-sm font-semibold">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-800/70 text-white text-xs">1</div>
                    <span>Determine pricing based on usage rank and trend:</span>
                  </div>
                  <div className="ml-8 mt-1 bg-gray-800/50 p-3 rounded text-sm font-mono">
                    <div>Usage Rank: {usageRank}, Trend: Downward</div>
                    <div>Applied Rule: {ruleDisplay} (Lower of Market Low + {mlUpliftPercentage}% or Average Cost + {costMarkupPercentage}%)</div>
                  </div>
                </li>
                
                <li className="pl-2">
                  <div className="flex items-center gap-2 mb-1 text-sm font-semibold">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-800/70 text-white text-xs">2</div>
                    <span>Calculate Market Low price:</span>
                  </div>
                  <div className="ml-8 mt-1 bg-gray-800/50 p-3 rounded text-sm font-mono">
                    Market Low × (1 + {mlUpliftPercentage}%) = {formatCurrency(item.marketLow)} × {mlUpliftMultiplier.toFixed(2)} = {formatCurrency(mlPrice)}
                  </div>
                </li>
                
                <li className="pl-2">
                  <div className="flex items-center gap-2 mb-1 text-sm font-semibold">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-800/70 text-white text-xs">3</div>
                    <span>Calculate Cost-based price:</span>
                  </div>
                  <div className="ml-8 mt-1 bg-gray-800/50 p-3 rounded text-sm font-mono">
                    avgCost × (1 + {costMarkupPercentage}%) = {formatCurrency(item.avgCost)} × {costMarkupMultiplier.toFixed(2)} = {formatCurrency(costPrice)}
                  </div>
                </li>
                
                <li className="pl-2">
                  <div className="flex items-center gap-2 mb-1 text-sm font-semibold">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-800/70 text-white text-xs">4</div>
                    <span>Take lower of the two prices:</span>
                  </div>
                  <div className="ml-8 mt-1 bg-gray-800/50 p-3 rounded text-sm font-mono">
                    min(ML price, Cost price) = min({formatCurrency(mlPrice)}, {formatCurrency(costPrice)}) = {formatCurrency(Math.min(mlPrice, costPrice))}
                  </div>
                </li>
                
                <li className="pl-2">
                  <div className="flex items-center gap-2 mb-1 text-sm font-semibold">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-800/70 text-white text-xs">5</div>
                    <span>Ensure price is not lower than current price:</span>
                  </div>
                  <div className="ml-8 mt-1 bg-gray-800/50 p-3 rounded text-sm font-mono">
                    max(calculated price, current price) = max({formatCurrency(Math.min(mlPrice, costPrice))}, {formatCurrency(item.currentREVAPrice)}) = {formatCurrency(Math.max(Math.min(mlPrice, costPrice), item.currentREVAPrice))}
                  </div>
                </li>
                
                <li className="pl-2">
                  <div className="flex items-center gap-2 mb-1 text-sm font-semibold">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-800/70 text-white text-xs">6</div>
                    <span>Calculate margin:</span>
                  </div>
                  <div className="ml-8 mt-1 bg-gray-800/50 p-3 rounded text-sm font-mono">
                    (proposedPrice - avgCost) / proposedPrice = ({formatCurrency(item.proposedPrice)} - {formatCurrency(item.avgCost)}) / {formatCurrency(item.proposedPrice)} = {formatPercentage(item.proposedMargin)}
                  </div>
                </li>
              </ol>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-700/50">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-blue-400" />
                <h4 className="font-semibold text-lg">Final Result</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-3">
                <div className="bg-blue-950/30 p-4 rounded-lg border border-blue-900/50">
                  <p className="text-sm text-blue-300">Proposed Price</p>
                  <p className="text-2xl font-bold">{formatCurrency(item.proposedPrice)}</p>
                </div>
                <div className="bg-blue-950/30 p-4 rounded-lg border border-blue-900/50">
                  <p className="text-sm text-blue-300">Proposed Margin</p>
                  <p className="text-2xl font-bold">{formatPercentage(item.proposedMargin)}</p>
                </div>
              </div>
            </div>
          </div>
        );
      } else {
        // Rule 2b - Higher of Market Low + uplift or Cost + markup
        const mlPrice = item.marketLow * mlUpliftMultiplier;
        const costPrice = item.avgCost * costMarkupMultiplier;
        
        return (
          <div className="space-y-4">
            <div className="px-5 py-4 rounded-lg bg-slate-900/50 border border-slate-700/40">
              <h3 className="font-semibold text-base mb-3 text-blue-400">Calculation Steps</h3>
              
              <ol className="space-y-4">
                <li className="pl-2">
                  <div className="flex items-center gap-2 mb-1 text-sm font-semibold">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-800/70 text-white text-xs">1</div>
                    <span>Determine pricing based on usage rank and trend:</span>
                  </div>
                  <div className="ml-8 mt-1 bg-gray-800/50 p-3 rounded text-sm font-mono">
                    <div>Usage Rank: {usageRank}, Trend: Upward</div>
                    <div>Applied Rule: {ruleDisplay} (Higher of Market Low + {mlUpliftPercentage}% or Average Cost + {costMarkupPercentage}%)</div>
                  </div>
                </li>
                
                <li className="pl-2">
                  <div className="flex items-center gap-2 mb-1 text-sm font-semibold">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-800/70 text-white text-xs">2</div>
                    <span>Calculate Market Low price:</span>
                  </div>
                  <div className="ml-8 mt-1 bg-gray-800/50 p-3 rounded text-sm font-mono">
                    Market Low × (1 + {mlUpliftPercentage}%) = {formatCurrency(item.marketLow)} × {mlUpliftMultiplier.toFixed(2)} = {formatCurrency(mlPrice)}
                  </div>
                </li>
                
                <li className="pl-2">
                  <div className="flex items-center gap-2 mb-1 text-sm font-semibold">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-800/70 text-white text-xs">3</div>
                    <span>Calculate Cost-based price:</span>
                  </div>
                  <div className="ml-8 mt-1 bg-gray-800/50 p-3 rounded text-sm font-mono">
                    avgCost × (1 + {costMarkupPercentage}%) = {formatCurrency(item.avgCost)} × {costMarkupMultiplier.toFixed(2)} = {formatCurrency(costPrice)}
                  </div>
                </li>
                
                <li className="pl-2">
                  <div className="flex items-center gap-2 mb-1 text-sm font-semibold">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-800/70 text-white text-xs">4</div>
                    <span>Take higher of the two prices:</span>
                  </div>
                  <div className="ml-8 mt-1 bg-gray-800/50 p-3 rounded text-sm font-mono">
                    max(ML price, Cost price) = max({formatCurrency(mlPrice)}, {formatCurrency(costPrice)}) = {formatCurrency(Math.max(mlPrice, costPrice))}
                  </div>
                </li>
                
                <li className="pl-2">
                  <div className="flex items-center gap-2 mb-1 text-sm font-semibold">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-800/70 text-white text-xs">5</div>
                    <span>Ensure price is not lower than current price:</span>
                  </div>
                  <div className="ml-8 mt-1 bg-gray-800/50 p-3 rounded text-sm font-mono">
                    max(calculated price, current price) = max({formatCurrency(Math.max(mlPrice, costPrice))}, {formatCurrency(item.currentREVAPrice)}) = {formatCurrency(Math.max(Math.max(mlPrice, costPrice), item.currentREVAPrice))}
                  </div>
                </li>
                
                <li className="pl-2">
                  <div className="flex items-center gap-2 mb-1 text-sm font-semibold">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-800/70 text-white text-xs">6</div>
                    <span>Calculate margin:</span>
                  </div>
                  <div className="ml-8 mt-1 bg-gray-800/50 p-3 rounded text-sm font-mono">
                    (proposedPrice - avgCost) / proposedPrice = ({formatCurrency(item.proposedPrice)} - {formatCurrency(item.avgCost)}) / {formatCurrency(item.proposedPrice)} = {formatPercentage(item.proposedMargin)}
                  </div>
                </li>
              </ol>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-700/50">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-blue-400" />
                <h4 className="font-semibold text-lg">Final Result</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-3">
                <div className="bg-blue-950/30 p-4 rounded-lg border border-blue-900/50">
                  <p className="text-sm text-blue-300">Proposed Price</p>
                  <p className="text-2xl font-bold">{formatCurrency(item.proposedPrice)}</p>
                </div>
                <div className="bg-blue-950/30 p-4 rounded-lg border border-blue-900/50">
                  <p className="text-sm text-blue-300">Proposed Margin</p>
                  <p className="text-2xl font-bold">{formatPercentage(item.proposedMargin)}</p>
                </div>
              </div>
            </div>
          </div>
        );
      }
    }
  };
  
  // Flag status
  const getFlagStatus = () => {
    if (item.flag1) {
      return (
        <div className="flex items-center space-x-2 text-red-500">
          <AlertCircle className="h-5 w-5" />
          <span>Flagged: Proposed price is ≥ 10% above True Market Low</span>
        </div>
      );
    } else if (item.flag2) {
      return (
        <div className="flex items-center space-x-2 text-red-500">
          <AlertCircle className="h-5 w-5" />
          <span>Flagged: Proposed margin is below 5%</span>
        </div>
      );
    }
    
    return (
      <div className="text-muted-foreground">
        No flags applied to this item
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Pricing Rule Explanation</DialogTitle>
          <DialogDescription className="text-base">
            Details for {item.description}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="details" className="mt-6">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="details">Price Details</TabsTrigger>
            <TabsTrigger value="simulator">Price Simulator</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-6">
            {/* Current vs Proposed Comparison */}
            <Card className="border border-white/10 bg-gray-900/40 backdrop-blur-sm shadow-lg">
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <span className="w-2 h-6 bg-blue-500 rounded-sm"></span>
                  Price Comparison
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-900/80 p-5 rounded-lg">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Current Price</p>
                      <p className="text-2xl font-bold">{formatCurrency(item.currentREVAPrice)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Current Margin</p>
                      <p className="text-xl font-semibold">{formatPercentage(item.currentREVAMargin)}</p>
                    </div>
                  </div>
                  <div className="space-y-3 relative">
                    <div className="absolute -left-3 top-1/2 transform -translate-y-1/2 text-gray-500 hidden md:block">
                      <ArrowRight className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Proposed Price</p>
                      <p className="text-2xl font-bold text-primary">{formatCurrency(item.proposedPrice)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Proposed Margin</p>
                      <p className="text-xl font-semibold text-primary">{formatPercentage(item.proposedMargin)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Price Change</p>
                      <p className={`text-lg ${item.proposedPrice > item.currentREVAPrice ? 'text-green-500' : item.proposedPrice < item.currentREVAPrice ? 'text-red-500' : ''}`}>
                        {((item.proposedPrice - item.currentREVAPrice) / item.currentREVAPrice * 100).toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          
            {/* Input Values Card */}
            <Card className="border border-white/10 bg-gray-900/40 backdrop-blur-sm shadow-lg">
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <span className="w-2 h-6 bg-blue-500 rounded-sm"></span>
                  Input Values
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Average Cost</p>
                    <p className="text-lg font-semibold">{formatCurrency(item.avgCost)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Market Low</p>
                    <p className="text-lg font-semibold">{formatCurrency(item.marketLow)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Next Cost</p>
                    <div className="flex items-center space-x-2">
                      <p className="text-lg font-semibold">{formatCurrency(item.nextCost || item.nextBuyingPrice)}</p>
                      {(item.ruleApplied || '').includes('downward') ? (
                        <TrendingDown className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingUp className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Usage Rank</p>
                    <p className="text-lg font-semibold">{item.usageRank}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">True Market Low</p>
                    <p className="text-lg font-semibold">{formatCurrency(item.trueMarketLow)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Current Price</p>
                    <p className="text-lg font-semibold">{formatCurrency(item.currentREVAPrice)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Applied Rule Card */}
            <Card className="border border-white/10 bg-gray-900/40 backdrop-blur-sm shadow-lg">
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <span className="w-2 h-6 bg-blue-500 rounded-sm"></span>
                  Applied Rule: {item.ruleApplied}
                </h3>
                {getRuleDescription()}
              </CardContent>
            </Card>
            
            {/* Calculation Steps Card */}
            <Card className="border border-white/10 bg-gray-900/40 backdrop-blur-sm shadow-lg">
              <CardContent className="pt-6">
                {getCalculationSteps()}
              </CardContent>
            </Card>
            
            {/* Flag Status Card */}
            <Card className="border border-white/10 bg-gray-900/40 backdrop-blur-sm shadow-lg">
              <CardContent className="pt-6 flex items-center">
                {getFlagStatus()}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="simulator" className="space-y-6">
            <Card className="border border-white/10 bg-gray-900/40 backdrop-blur-sm shadow-lg">
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <span className="w-2 h-6 bg-blue-500 rounded-sm"></span>
                  Price Simulator
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Enter a new price to simulate and see the impact on margins and profit.
                </p>
                
                <div className="flex items-end gap-3 mb-6">
                  <div className="flex-1">
                    <label htmlFor="simulated-price" className="text-sm font-medium mb-1 block">
                      Simulated Price
                    </label>
                    <Input
                      id="simulated-price"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Enter price"
                      value={simulatedPrice}
                      onChange={(e) => setSimulatedPrice(e.target.value)}
                      className="bg-gray-800/50 border-gray-700"
                    />
                  </div>
                  <Button onClick={handleSimulatePrice} className="bg-blue-600 hover:bg-blue-700">
                    Simulate
                  </Button>
                </div>
                
                {simulatedResults && (
                  <div className="bg-gray-900/80 p-5 rounded-lg border border-gray-800/80">
                    <h4 className="font-semibold mb-3 text-blue-400">Simulation Results</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Simulated Price</p>
                        <p className="text-lg font-semibold">{formatCurrency(simulatedResults.price)}</p>
                        <p className={`text-sm ${simulatedResults.priceChangePercentage > 0 ? 'text-green-500' : simulatedResults.priceChangePercentage < 0 ? 'text-red-500' : ''}`}>
                          {simulatedResults.priceChangePercentage > 0 ? '+' : ''}{simulatedResults.priceChangePercentage.toFixed(2)}% vs current
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Simulated Margin</p>
                        <p className="text-lg font-semibold">{formatPercentage(simulatedResults.margin)}</p>
                        <p className={`text-sm ${simulatedResults.marginChangePercentage > 0 ? 'text-green-500' : simulatedResults.marginChangePercentage < 0 ? 'text-red-500' : ''}`}>
                          {simulatedResults.marginChangePercentage > 0 ? '+' : ''}{simulatedResults.marginChangePercentage.toFixed(2)}% vs current
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-sm text-muted-foreground">Profit Impact</p>
                        <p className={`text-lg font-semibold ${simulatedResults.profitChange > 0 ? 'text-green-500' : simulatedResults.profitChange < 0 ? 'text-red-500' : ''}`}>
                          {simulatedResults.profitChange > 0 ? '+' : ''}{formatCurrency(simulatedResults.profitChange)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Based on usage of {item.revaUsage} units
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default PricingRuleExplainer;
