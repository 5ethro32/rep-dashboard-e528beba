
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, TrendingDown, TrendingUp } from 'lucide-react';

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
  if (!item) return null;

  // Format currency
  const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return '—';
    return `£${value.toFixed(2)}`;
  };

  // Format percentage
  const formatPercentage = (value: number | undefined) => {
    if (value === undefined) return '—';
    return `${(value * 100).toFixed(2)}%`;
  };
  
  // Get rule description
  const getRuleDescription = () => {
    const ruleType = item.appliedRule?.charAt(0) || '';
    const ruleVariant = item.appliedRule?.charAt(1) || '';
    const usageGroup = item.appliedRule?.includes('1-2') 
      ? 'Fast moving (rank 1-2)'
      : item.appliedRule?.includes('3-4')
        ? 'Medium moving (rank 3-4)'
        : 'Slow moving (rank 5-6)';
    
    if (ruleType === '1') {
      return (
        <>
          <p className="text-sm mb-2">
            <strong>Rule 1 ({ruleVariant}):</strong> Applied when Average Cost is less than Market Low
          </p>
          <p className="text-sm mb-2">
            <strong>Usage Group:</strong> {usageGroup}
          </p>
          <p className="text-sm">
            <strong>Cost Trend:</strong> {item.trend === 'TrendDown' ? 'Downward' : 'Flat/Upward'}
          </p>
        </>
      );
    } else {
      return (
        <>
          <p className="text-sm mb-2">
            <strong>Rule 2 ({ruleVariant}):</strong> Applied when Average Cost is greater than or equal to Market Low
          </p>
          <p className="text-sm mb-2">
            <strong>Usage Group:</strong> {usageGroup}
          </p>
          <p className="text-sm">
            <strong>Cost Trend:</strong> {item.trend === 'TrendDown' ? 'Downward' : 'Flat/Upward'}
          </p>
        </>
      );
    }
  };
  
  // Get calculation steps
  const getCalculationSteps = () => {
    const ruleType = item.appliedRule?.charAt(0) || '';
    
    if (ruleType === '1') {
      // Rule 1 calculation steps
      return (
        <ol className="space-y-2 pl-4 list-decimal">
          <li className="text-sm">
            <span className="font-medium">Determine multiplier based on usage rank and trend:</span>
            <div className="ml-4 mt-1 bg-gray-800/30 p-2 rounded text-xs font-mono">
              UsageRank: {item.usageRank}, Trend: {item.trend} → 
              Multiplier: {((item.proposedPrice / item.avgCost) || 0).toFixed(2)}
            </div>
          </li>
          <li className="text-sm">
            <span className="font-medium">Calculate base proposed price:</span>
            <div className="ml-4 mt-1 bg-gray-800/30 p-2 rounded text-xs font-mono">
              avgCost × multiplier = {formatCurrency(item.avgCost)} × {((item.proposedPrice / item.avgCost) || 0).toFixed(2)} = {formatCurrency(item.avgCost * ((item.proposedPrice / item.avgCost) || 0))}
            </div>
          </li>
          <li className="text-sm">
            <span className="font-medium">Ensure price is not lower than current price:</span>
            <div className="ml-4 mt-1 bg-gray-800/30 p-2 rounded text-xs font-mono">
              max(calculated price, current price) = max({formatCurrency(item.avgCost * ((item.proposedPrice / item.avgCost) || 0))}, {formatCurrency(item.currentREVAPrice)}) = {formatCurrency(item.proposedPrice)}
            </div>
          </li>
          <li className="text-sm">
            <span className="font-medium">Calculate margin:</span>
            <div className="ml-4 mt-1 bg-gray-800/30 p-2 rounded text-xs font-mono">
              (proposedPrice - avgCost) / proposedPrice = ({formatCurrency(item.proposedPrice)} - {formatCurrency(item.avgCost)}) / {formatCurrency(item.proposedPrice)} = {formatPercentage(item.proposedMargin)}
            </div>
          </li>
        </ol>
      );
    } else {
      // Rule 2 calculation steps
      return (
        <ol className="space-y-2 pl-4 list-decimal">
          <li className="text-sm">
            <span className="font-medium">Determine multiplier based on usage rank and trend:</span>
            <div className="ml-4 mt-1 bg-gray-800/30 p-2 rounded text-xs font-mono">
              UsageRank: {item.usageRank}, Trend: {item.trend} → 
              Multiplier: {((item.proposedPrice / item.avgCost) || 0).toFixed(2)}
            </div>
          </li>
          <li className="text-sm">
            <span className="font-medium">Calculate base proposed price:</span>
            <div className="ml-4 mt-1 bg-gray-800/30 p-2 rounded text-xs font-mono">
              avgCost × multiplier = {formatCurrency(item.avgCost)} × {((item.proposedPrice / item.avgCost) || 0).toFixed(2)} = {formatCurrency(item.avgCost * ((item.proposedPrice / item.avgCost) || 0))}
            </div>
          </li>
          <li className="text-sm">
            <span className="font-medium">Ensure price is not lower than current price:</span>
            <div className="ml-4 mt-1 bg-gray-800/30 p-2 rounded text-xs font-mono">
              max(calculated price, current price) = max({formatCurrency(item.avgCost * ((item.proposedPrice / item.avgCost) || 0))}, {formatCurrency(item.currentREVAPrice)}) = {formatCurrency(Math.max(item.avgCost * ((item.proposedPrice / item.avgCost) || 0), item.currentREVAPrice))}
            </div>
          </li>
          <li className="text-sm">
            <span className="font-medium">Ensure price is not higher than market low:</span>
            <div className="ml-4 mt-1 bg-gray-800/30 p-2 rounded text-xs font-mono">
              min(max price, marketLow) = min({formatCurrency(Math.max(item.avgCost * ((item.proposedPrice / item.avgCost) || 0), item.currentREVAPrice))}, {formatCurrency(item.marketLow)}) = {formatCurrency(item.proposedPrice)}
            </div>
          </li>
          <li className="text-sm">
            <span className="font-medium">Calculate margin:</span>
            <div className="ml-4 mt-1 bg-gray-800/30 p-2 rounded text-xs font-mono">
              (proposedPrice - avgCost) / proposedPrice = ({formatCurrency(item.proposedPrice)} - {formatCurrency(item.avgCost)}) / {formatCurrency(item.proposedPrice)} = {formatPercentage(item.proposedMargin)}
            </div>
          </li>
        </ol>
      );
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
          <span>Flagged: Proposed margin is below 3%</span>
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
          <DialogTitle>Pricing Rule Explanation</DialogTitle>
          <DialogDescription>
            Details for {item.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Input Values Card */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4">Input Values</h3>
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
                    <p className="text-lg font-semibold">{formatCurrency(item.nextCost)}</p>
                    {item.trend === 'TrendDown' ? (
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
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4">Applied Rule: {item.appliedRule}</h3>
              {getRuleDescription()}
            </CardContent>
          </Card>
          
          {/* Calculation Steps Card */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4">Calculation Steps</h3>
              {getCalculationSteps()}
              
              <div className="mt-4 pt-4 border-t border-gray-700">
                <h4 className="font-medium mb-2">Final Result</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Proposed Price</p>
                    <p className="text-xl font-semibold">{formatCurrency(item.proposedPrice)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Proposed Margin</p>
                    <p className="text-xl font-semibold">{formatPercentage(item.proposedMargin)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Flag Status Card */}
          <Card>
            <CardContent className="pt-6 flex items-center">
              {getFlagStatus()}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PricingRuleExplainer;
