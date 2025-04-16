
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
  const [open, setOpen] = useState(false);
  const selectedDate = value ? new Date(value) : new Date();
  
  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(format(date, 'yyyy-MM-dd'));
      setOpen(false); // Close the popover after selection
    }
  };
  
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
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
        <PopoverContent className="w-auto p-0 bg-background" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            initialFocus
            className="pointer-events-auto"
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
