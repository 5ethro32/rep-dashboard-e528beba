
import React, { useRef } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DatePickerFieldProps {
  id?: string; // Make id optional
  fieldName?: string; // Add fieldName as an alternative to id
  label: string;
  value: string;
  onChange: (date: string) => void;
  className?: string;
}

const DatePickerField: React.FC<DatePickerFieldProps> = ({
  id,
  fieldName,
  label,
  value,
  onChange,
  className,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const selectedDate = value ? new Date(value) : new Date();
  const inputId = id || fieldName || 'date-picker';
  
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onChange(format(date, 'yyyy-MM-dd'));
      // Close the popover after date selection
      popoverRef.current?.click();
    }
  };
  
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={inputId}>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id={inputId}
            variant="outline"
            className={cn(
              "w-full border-gray-300 bg-background justify-start text-left font-normal h-10",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(selectedDate, 'PPP') : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          ref={popoverRef}
          className="w-auto p-0 bg-background" 
          align="start"
        >
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            initialFocus
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
      <Input
        type="hidden"
        id={`${inputId}-input`}
        name={fieldName || inputId}
        value={value}
      />
    </div>
  );
};

export default DatePickerField;
