
import React from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FormControl, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Control, Controller } from 'react-hook-form';

interface DatePickerFieldProps {
  control: Control<any>;
  label: string;
  fieldName: string;
}

const DatePickerField = ({ control, label, fieldName }: DatePickerFieldProps) => {
  return (
    <FormItem className="flex flex-col">
      <FormLabel>{label}</FormLabel>
      <Controller
        control={control}
        name={fieldName}
        render={({ field }) => (
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full pl-3 text-left font-normal bg-gray-700 border-gray-600 text-white hover:bg-gray-600",
                    !field.value && "text-muted-foreground"
                  )}
                >
                  {field.value ? (
                    format(field.value, "dd MMMM yyyy")
                  ) : (
                    <span>Pick a date</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700 text-white" align="start">
              <Calendar
                mode="single"
                selected={field.value}
                onSelect={field.onChange}
                initialFocus
                className="p-3 pointer-events-auto"
                classNames={{
                  day_selected: "bg-finance-red text-white focus:bg-finance-red focus:text-white hover:bg-finance-red hover:text-white",
                  head_cell: "text-muted-foreground",
                  caption: "text-white",
                  day: "text-white hover:bg-gray-700"
                }}
              />
            </PopoverContent>
          </Popover>
        )}
      />
      <FormMessage />
    </FormItem>
  );
};

export default DatePickerField;
