import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, X, RotateCcw, AlertCircle } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Define price change rationales
export const PRICE_RATIONALES = {
  TOO_HIGH_MARKET: "Too High For Market",
  TOO_LOW_AVCO: "Too Low For AVCO",
  NEXT_BP_INCORRECT: "Next BP Incorrect",
  COMPETITOR_PRICE: "Competitor Price Match",
  VOLUME_DISCOUNT: "Volume Discount Applied",
  PRICING_ERROR: "Previous Pricing Error",
  OTHER: "Other"
} as const;

export type PriceRationale = keyof typeof PRICE_RATIONALES;

interface PriceEditorProps {
  initialPrice: number;
  currentPrice: number;
  calculatedPrice: number;
  cost: number;
  onSave: (newPrice: number, rationale?: PriceRationale) => void;
  onCancel: () => void;
  compact?: boolean;
  autoSaveOnExit?: boolean;
}

const PriceEditor: React.FC<PriceEditorProps> = ({
  initialPrice,
  currentPrice,
  calculatedPrice,
  cost,
  onSave,
  onCancel,
  compact = false,
  autoSaveOnExit = false
}) => {
  // Set a minimum price to prevent £0.00 prices
  const MIN_VALID_PRICE = 0.01;
  
  // Initialize with initialPrice, but ensure it's at least MIN_VALID_PRICE
  const [priceValue, setPriceValue] = useState<string>(
    Math.max(initialPrice, MIN_VALID_PRICE).toFixed(2)
  );
  const [margin, setMargin] = useState<number>(0);
  const [isValid, setIsValid] = useState<boolean>(true);
  const [rationale, setRationale] = useState<PriceRationale | undefined>(undefined);
  
  // Calculate price change percentage
  const priceChangePercent = calculatedPrice !== currentPrice ? 
    ((calculatedPrice - currentPrice) / currentPrice) * 100 : 0;
  
  // Determine if this is a price decrease
  const isPriceDecrease = priceChangePercent < 0;
    
  // Check for possible data issues where current price matches cost
  const possibleDataIssue = Math.abs(currentPrice - cost) < 0.001 && currentPrice > 0;
  
  useEffect(() => {
    const numericPrice = parseFloat(priceValue);
    if (!isNaN(numericPrice) && numericPrice >= MIN_VALID_PRICE) {
      const calculatedMargin = (numericPrice - cost) / numericPrice;
      setMargin(calculatedMargin * 100);
      setIsValid(true);
    } else {
      setIsValid(false);
    }
  }, [priceValue, cost, MIN_VALID_PRICE]);
  
  useEffect(() => {
    // Show warning toast if current price matches next cost (possible data issue)
    if (possibleDataIssue) {
      toast({
        title: "Possible data issue detected",
        description: "Current price matches next buying price. This might indicate an issue with your Excel data.",
        variant: "destructive" 
      });
    }
  }, [possibleDataIssue]);

  // Added effect to handle changes to initialPrice from parent
  // Ensure the price is never below MIN_VALID_PRICE
  useEffect(() => {
    setPriceValue(Math.max(initialPrice, MIN_VALID_PRICE).toFixed(2));
  }, [initialPrice, MIN_VALID_PRICE]);

  // Handle rationale change
  const handleRationaleChange = (value: PriceRationale) => {
    setRationale(value);
  };

  // Handle component unmount with autoSaveOnExit
  useEffect(() => {
    return () => {
      if (autoSaveOnExit) {
        const numericPrice = parseFloat(priceValue);
        if (isValid && numericPrice >= MIN_VALID_PRICE && numericPrice !== initialPrice) {
          if (rationale) { // Only auto-save if rationale is selected
            console.log("Auto-saving price on exit:", numericPrice, "with rationale:", rationale);
            onSave(numericPrice, rationale);
          } else {
            console.log("Not auto-saving as no rationale was provided");
          }
        }
      }
    };
  }, [autoSaveOnExit, priceValue, isValid, initialPrice, onSave, MIN_VALID_PRICE, rationale]);
  
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPriceValue(e.target.value);
  };
  
  const handleReset = () => {
    // Ensure the reset price is never below MIN_VALID_PRICE
    setPriceValue(Math.max(calculatedPrice, MIN_VALID_PRICE).toFixed(2));
  };
  
  const handleSave = () => {
    const numericPrice = parseFloat(priceValue);
    if (isValid && numericPrice >= MIN_VALID_PRICE) {
      // Make rationale required if price is being changed
      if (numericPrice !== initialPrice && !rationale) {
        toast({
          title: "Rationale required",
          description: "Please select a reason for this price change",
          variant: "destructive"
        });
        return;
      }
      
      // Call onSave with the price and rationale
      onSave(numericPrice, rationale);
    } else {
      toast({
        title: "Invalid price",
        description: `Please enter a valid price of at least £${MIN_VALID_PRICE.toFixed(2)}`,
        variant: "destructive"
      });
    }
  };
  
  const getMarginClass = () => {
    if (margin < 3) return "text-red-400";
    if (margin < 5) return "text-yellow-400";
    return "text-green-400";
  };
  
  const getPriceChangeClass = () => {
    return isPriceDecrease ? "text-red-400" : "text-green-400";
  };
  
  if (compact) {
    return (
      <div className="flex flex-col space-y-2">
        <div className="flex space-x-1 items-center">
          <Input
            type="number"
            step="0.01"
            min="0"
            value={priceValue}
            onChange={handlePriceChange}
            className={`h-7 w-24 ${isValid ? "" : "border-red-500"}`}
            autoFocus
          />
          <Button variant="ghost" size="icon" className="h-7 w-7 p-0" onClick={handleReset} title="Reset to calculated price">
            <RotateCcw className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 p-0" onClick={onCancel} title="Cancel">
            <X className="h-3 w-3" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 p-0" 
            onClick={handleSave} 
            disabled={!isValid || (priceValue !== initialPrice.toFixed(2) && !rationale)} 
            title="Save"
          >
            <Check className="h-3 w-3" />
          </Button>
          {isPriceDecrease && (
            <span title="Price decrease" aria-label="Price decrease">
              <AlertCircle className="h-3 w-3 text-amber-500" />
            </span>
          )}
          {possibleDataIssue && (
            <span title="Current price may be incorrect" aria-label="Data issue">
              <AlertCircle className="h-3 w-3 text-red-500 ml-1" />
            </span>
          )}
        </div>
        
        {/* Add rationale dropdown for compact view */}
        <Select value={rationale} onValueChange={handleRationaleChange}>
          <SelectTrigger className="h-7 w-full text-xs">
            <SelectValue placeholder="Select reason for change..." />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PRICE_RATIONALES).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col space-y-2 p-2">
      <div className="flex space-x-2">
        <Input
          type="number"
          step="0.01"
          min="0"
          value={priceValue}
          onChange={handlePriceChange}
          className={isValid ? "" : "border-red-500"}
          autoFocus
        />
        <Button variant="ghost" size="icon" onClick={handleReset} title="Reset to calculated price">
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Add rationale dropdown for full view */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Reason for change:</label>
        <Select value={rationale} onValueChange={handleRationaleChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select reason..." />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PRICE_RATIONALES).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex justify-between items-center text-xs text-muted-foreground">
        <span>Current: £{currentPrice.toFixed(2)}</span>
        <span className={getMarginClass()}>
          Margin: {isValid ? margin.toFixed(2) : "0.00"}%
        </span>
      </div>
      
      <div className="flex justify-between items-center text-xs text-muted-foreground">
        <span>Calculated: £{calculatedPrice.toFixed(2)}</span>
        <span className={getPriceChangeClass()}>
          Change: {priceChangePercent.toFixed(2)}%
        </span>
      </div>
      
      {possibleDataIssue && (
        <div className="text-xs text-red-500 flex items-center">
          <AlertCircle className="h-3 w-3 mr-1" />
          Warning: Current price matches next cost value
        </div>
      )}
      
      <div className="flex justify-end space-x-2 mt-2">
        <Button variant="outline" size="sm" onClick={onCancel}>
          <X className="h-3 w-3 mr-1" />
          Cancel
        </Button>
        <Button 
          variant="default" 
          size="sm" 
          onClick={handleSave} 
          disabled={!isValid || (priceValue !== initialPrice.toFixed(2) && !rationale)}
        >
          <Check className="h-3 w-3 mr-1" />
          Save
        </Button>
      </div>
    </div>
  );
};

export default PriceEditor;
