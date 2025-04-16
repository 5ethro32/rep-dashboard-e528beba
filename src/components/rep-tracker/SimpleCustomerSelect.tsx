
import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

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
    : safeCustomers.filter(customer => {
        if (!customer || typeof customer.account_name !== 'string') return false;
        return customer.account_name.toLowerCase().includes(searchValue.toLowerCase());
      });

  // Clear search when popover closes
  useEffect(() => {
    if (!open) {
      setSearchValue('');
    }
  }, [open]);

  // Handle selecting a customer with proper safety checks
  const handleSelect = (customer: { account_name: string; account_ref: string }) => {
    if (customer && customer.account_ref && customer.account_name) {
      onSelect(customer.account_ref, customer.account_name);
      setOpen(false);
      setSearchValue('');
    }
  };

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
      <PopoverContent 
        className="p-0 w-[var(--radix-popover-trigger-width)] bg-background z-50" 
        align="start"
        sideOffset={4}
      >
        <div className="border-b p-2">
          <Input
            placeholder="Search customers..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="h-9"
            autoComplete="off"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              // Prevent form submission on Enter key
              if (e.key === 'Enter') {
                e.preventDefault();
              }
            }}
          />
        </div>
        <div className="relative">
          <ScrollArea className="h-[300px]" type="auto">
            <div className="p-1">
              {filteredCustomers.length === 0 ? (
                <div className="text-center p-4 text-sm text-muted-foreground">
                  No customer found.
                </div>
              ) : (
                filteredCustomers.map((customer) => (
                  customer && customer.account_ref && customer.account_name ? (
                    <Button
                      key={customer.account_ref}
                      variant="ghost"
                      className={cn(
                        "flex w-full items-center justify-start gap-2 rounded-sm px-2 py-1.5 text-sm text-left",
                        "hover:bg-accent hover:text-accent-foreground",
                        selectedCustomer === customer.account_name && "bg-accent text-accent-foreground"
                      )}
                      onClick={() => handleSelect(customer)}
                    >
                      <Check
                        className={cn(
                          "h-4 w-4",
                          selectedCustomer === customer.account_name ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="truncate">{customer.account_name}</span>
                    </Button>
                  ) : null
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}
