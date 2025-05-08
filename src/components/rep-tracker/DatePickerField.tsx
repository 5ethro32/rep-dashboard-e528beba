
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
  const selectedDate = value ? new Date(value) : new Date();
  
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onChange(format(date, 'yyyy-MM-dd'));
      // Close the popover after date selection
      setIsCalendarOpen(false);
    }
  };
  
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            className={cn(
              "w-full bg-gray-900/70 border border-gray-700 hover:bg-gray-800 text-white justify-start text-left font-normal h-10",
              !value && "text-gray-400"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(selectedDate, 'PPP') : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-0 bg-gray-800 border-gray-700" 
          align="start"
        >
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            initialFocus
            className="pointer-events-auto bg-gray-800 text-white"
          />
        </PopoverContent>
      </Popover>
      <Input
        type="hidden"
        id={`${id}-input`}
        name={id}
        value={value}
      />
    </div>
  );
};

export default DatePickerField;
