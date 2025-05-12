
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, X, RotateCcw, AlertCircle, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const { toast } = useToast();
  
  // Calculate price change percentage
  const priceChangePercent = calculatedPrice !== currentPrice ? 
    ((calculatedPrice - currentPrice) / currentPrice) * 100 : 0;
  
  // Determine if this is a price decrease
  const isPriceDecrease = priceChangePercent < 0;
    
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
  
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPriceValue(e.target.value);
  };
  
  const handleReset = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    console.log('PriceEditor: Reset clicked, setting price to:', calculatedPrice.toFixed(2));
    setPriceValue(calculatedPrice.toFixed(2));
    
    toast({
      title: "Price reset",
      description: `Reset to calculated price £${calculatedPrice.toFixed(2)}`,
    });
  };
  
  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    
    const numericPrice = parseFloat(priceValue);
    
    if (isValid && numericPrice > 0) {
      setIsSaving(true);
      console.log('PriceEditor: Saving price', numericPrice);
      
      try {
        onSave(numericPrice);
        
        toast({
          title: "Price saved",
          description: `Saved new price £${numericPrice.toFixed(2)}`,
          variant: "default",
        });
      } catch (error) {
        console.error('Error saving price:', error);
        toast({
          title: "Save failed",
          description: "An error occurred while saving the price",
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
    } else {
      console.error('PriceEditor: Invalid price value', priceValue);
      toast({
        title: "Invalid price",
        description: "Please enter a valid price greater than zero.",
        variant: "destructive",
      });
    }
  };
  
  const handleCancelClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    console.log('PriceEditor: Cancel clicked');
    onCancel();
    
    toast({
      title: "Edit cancelled",
      description: "Price changes were discarded",
    });
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
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7 p-0 hover:bg-gray-300/20" 
          onClick={handleReset} 
          title="Reset to calculated price"
        >
          <RotateCcw className="h-3 w-3" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7 p-0 hover:bg-gray-300/20" 
          onClick={handleCancelClick} 
          title="Cancel and discard changes"
        >
          <X className="h-3 w-3" />
        </Button>
        <Button 
          variant={isValid ? "secondary" : "outline"} 
          size="icon" 
          className={`h-7 w-7 p-0 ${isValid ? "bg-green-100 hover:bg-green-200" : "opacity-50 cursor-not-allowed"}`} 
          onClick={handleSave} 
          disabled={!isValid || isSaving} 
          title="Save price changes"
        >
          <Check className="h-3 w-3" />
        </Button>
        {isSaving && (
          <span className="animate-pulse text-xs text-blue-500 ml-1">Saving...</span>
        )}
        {isPriceDecrease && (
          <span title="Price decrease" aria-label="Price decrease">
            <AlertCircle className="h-3 w-3 text-amber-500" />
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
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleReset} 
          title="Reset to calculated price"
        >
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
      
      <div className="flex justify-end space-x-2 mt-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleCancelClick}
          title="Cancel and discard changes"
        >
          <X className="h-3 w-3 mr-1" />
          Cancel
        </Button>
        <Button 
          variant="default" 
          size="sm" 
          onClick={handleSave} 
          disabled={!isValid || isSaving}
          className={isValid ? "bg-green-600 hover:bg-green-700" : ""}
          title="Save price changes"
        >
          <Check className="h-3 w-3 mr-1" />
          Save
          {isSaving && <span className="ml-1 animate-pulse">...</span>}
        </Button>
      </div>
    </div>
  );
};

export default PriceEditor;
