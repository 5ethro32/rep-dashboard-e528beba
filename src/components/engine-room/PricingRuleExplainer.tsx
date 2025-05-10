
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, TrendingDown, TrendingUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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

  // Format currency
  const formatCurrency = (value: number | null | undefined) => {
    if (value === undefined || value === null) return '—';
    return `£${value.toFixed(2)}`;
  };

  // Format percentage
  const formatPercentage = (value: number | null | undefined) => {
    if (value === undefined || value === null) return '—';
    return `${(value * 100).toFixed(2)}%`;
  };
  
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
        
        <Tabs defaultValue="details" className="mt-4">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="details">Price Details</TabsTrigger>
            <TabsTrigger value="simulator">Price Simulator</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-6">
            {/* Current vs Proposed Comparison */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">Price Comparison</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-900/40 p-4 rounded-lg">
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
                  <div className="space-y-3">
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
          </TabsContent>
          
          <TabsContent value="simulator" className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">Price Simulator</h3>
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
                    />
                  </div>
                  <Button onClick={handleSimulatePrice}>
                    Simulate
                  </Button>
                </div>
                
                {simulatedResults && (
                  <div className="bg-gray-900/40 p-4 rounded-lg">
                    <h4 className="font-semibold mb-3">Simulation Results</h4>
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
