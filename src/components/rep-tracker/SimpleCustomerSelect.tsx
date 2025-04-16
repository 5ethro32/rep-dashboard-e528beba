
import React, { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface SimpleCustomerSelectProps {
  customers: Array<{ account_name: string; account_ref: string }>;
  selectedCustomer: string;
  onSelect: (ref: string, name: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function SimpleCustomerSelect({
  customers = [],
  selectedCustomer = '',
  onSelect,
  placeholder = 'Select a customer...',
  className,
  disabled = false
}: SimpleCustomerSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  
  // Ensure customers is always a valid array
  const safeCustomers = Array.isArray(customers) ? customers : [];
  
  // Filter customers based on search, with safety checks
  const filteredCustomers = searchValue === '' 
    ? safeCustomers 
    : safeCustomers.filter(customer => 
        customer?.account_name?.toLowerCase().includes(searchValue.toLowerCase()));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          {selectedCustomer || <span className="text-muted-foreground">{placeholder}</span>}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]" align="start">
        <Command>
          <CommandInput 
            placeholder="Search customers..." 
            value={searchValue}
            onValueChange={setSearchValue}
            className="h-9"
          />
          <ScrollArea className="max-h-[300px]">
            {filteredCustomers.length === 0 ? (
              <CommandEmpty>No customer found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {filteredCustomers.map((customer) => (
                  <CommandItem
                    key={customer.account_ref}
                    value={customer.account_name}
                    onSelect={() => {
                      onSelect(customer.account_ref, customer.account_name);
                      setOpen(false);
                      setSearchValue('');
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedCustomer === customer.account_name ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {customer.account_name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </ScrollArea>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
