import React, { useState, useEffect } from 'react';
import { getAvailableMonths } from '@/utils/unified-data-service';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface MonthSelectorProps {
  onMonthChange: (month: string) => void;
  defaultMonth?: string;
  label?: string;
  className?: string;
}

const MonthSelector = ({ 
  onMonthChange, 
  defaultMonth, 
  label = "Select Month", 
  className 
}: MonthSelectorProps) => {
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const fetchMonths = async () => {
      try {
        setIsLoading(true);
        const months = await getAvailableMonths();
        setAvailableMonths(months);
        
        // Set default selection
        if (defaultMonth && months.includes(defaultMonth)) {
          setSelectedMonth(defaultMonth);
          onMonthChange(defaultMonth);
        } else if (months.length > 0) {
          // Default to the most recent month (first in the list since we sort descending)
          setSelectedMonth(months[0]);
          onMonthChange(months[0]);
        }
      } catch (error) {
        console.error('Error fetching available months:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMonths();
  }, [defaultMonth, onMonthChange]);
  
  const handleChange = (value: string) => {
    setSelectedMonth(value);
    onMonthChange(value);
  };
  
  return (
    <div className={className}>
      {label && <Label className="mb-2 block">{label}</Label>}
      <Select 
        value={selectedMonth} 
        onValueChange={handleChange}
        disabled={isLoading || availableMonths.length === 0}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a month" />
        </SelectTrigger>
        <SelectContent>
          {availableMonths.map(month => (
            <SelectItem key={month} value={month}>
              {month}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default MonthSelector; 