
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, X, RotateCcw, AlertCircle } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";

interface PriceEditorProps {
  initialPrice: number;
  currentPrice: number;
  calculatedPrice: number;
  cost: number;
  onSave: (newPrice: number) => void;
  onCancel: () => void;
  compact?: boolean;
}

const PriceEditor: React.FC<PriceEditorProps> = ({
  initialPrice,
  currentPrice,
  calculatedPrice,
  cost,
  onSave,
  onCancel,
  compact = false
}) => {
  const [priceValue, setPriceValue] = useState<string>(initialPrice.toFixed(2));
  const [margin, setMargin] = useState<number>(0);
  const [isValid, setIsValid] = useState<boolean>(true);
  
  // Calculate price change percentage
  const priceChangePercent = calculatedPrice !== currentPrice ? 
    ((calculatedPrice - currentPrice) / currentPrice) * 100 : 0;
  
  // Determine if this is a price decrease
  const isPriceDecrease = priceChangePercent < 0;
    
  // Check for possible data issues where current price matches cost
  const possibleDataIssue = Math.abs(currentPrice - cost) < 0.001 && currentPrice > 0;
  
  useEffect(() => {
    const numericPrice = parseFloat(priceValue);
    if (!isNaN(numericPrice) && numericPrice > 0) {
      const calculatedMargin = (numericPrice - cost) / numericPrice;
      setMargin(calculatedMargin * 100);
      setIsValid(true);
    } else {
      setIsValid(false);
    }
  }, [priceValue, cost]);
  
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
  
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPriceValue(e.target.value);
  };
  
  const handleReset = () => {
    setPriceValue(calculatedPrice.toFixed(2));
  };
  
  const handleSave = () => {
    const numericPrice = parseFloat(priceValue);
    if (isValid && numericPrice > 0) {
      // Ensure we're calling onSave with the parsed numeric value
      onSave(numericPrice);
      // Toast notification for user feedback
      toast({
        title: "Price updated",
        description: `Price has been updated to £${numericPrice.toFixed(2)}`
      });
    } else {
      toast({
        title: "Invalid price",
        description: "Please enter a valid price greater than zero",
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
          disabled={!isValid} 
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
          disabled={!isValid}
        >
          <Check className="h-3 w-3 mr-1" />
          Save
        </Button>
      </div>
    </div>
  );
};

export default PriceEditor;
