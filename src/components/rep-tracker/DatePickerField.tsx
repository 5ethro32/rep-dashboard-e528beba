
import React, { useState } from 'react';
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
  id: string;
  label: string;
  value: string;
  onChange: (date: string) => void;
  className?: string;
}

const DatePickerField: React.FC<DatePickerFieldProps> = ({
  id,
  label,
  value,
  onChange,
  className,
}) => {
  // Add state to control the open/closed state of the popover
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  // Ensure value is always a valid date or default to today
  const selectedDate = value && !isNaN(new Date(value).getTime()) 
    ? new Date(value) 
    : new Date();
  
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      // Format date properly and call onChange
      onChange(format(date, 'yyyy-MM-dd'));
      // Close the popover after date selection with a slight delay
      // to prevent interference with click events
      setTimeout(() => {
        setIsCalendarOpen(false);
      }, 100);
    }
  };
  
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Popover 
        open={isCalendarOpen} 
        onOpenChange={(open) => {
          // Prevent immediate closing on click within the calendar
          if (!open && document.activeElement?.closest('.rdp')) {
            return;
          }
          setIsCalendarOpen(open);
        }}
      >
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            className={cn(
              "w-full bg-gray-900/70 border border-gray-700 hover:bg-gray-800 text-white justify-start text-left font-normal h-10",
              !value && "text-gray-400"
            )}
            onClick={(e) => {
              e.stopPropagation();
              setIsCalendarOpen(true);
            }}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(selectedDate, 'PPP') : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-0 bg-gray-800/95 border-gray-700 z-50" 
          align="start"
          onClick={(e) => e.stopPropagation()} // Prevent clicks from bubbling up
        >
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            initialFocus
            className="pointer-events-auto bg-gray-800 text-white z-50"
          />
        </PopoverContent>
      </Popover>
      <Input
        type="hidden"
        id={`${id}-input`}
        name={id}
        value={value || ''}
      />
    </div>
  );
};

export default DatePickerField;
