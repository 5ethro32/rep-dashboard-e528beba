
import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface Customer {
  account_name: string;
  account_ref: string;
}

interface ImprovedCustomerSelectorProps {
  customers: Customer[];
  selectedCustomer: string;
  onSelect: (ref: string, name: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function ImprovedCustomerSelector({
  customers = [],
  selectedCustomer = '',
  onSelect,
  placeholder = "Select customer...",
  className,
  disabled = false
}: ImprovedCustomerSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Safety check for customers array
  const safeCustomers = Array.isArray(customers) ? customers : [];
  
  // Filter customers based on search
  const filteredCustomers = searchQuery === '' 
    ? safeCustomers 
    : safeCustomers.filter(customer => {
        if (!customer || typeof customer.account_name !== 'string') return false;
        return customer.account_name.toLowerCase().includes(searchQuery.toLowerCase());
      });
  
  // Clear search when popover closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
    }
  }, [open]);
  
  // Select a customer safely with explicit event handling
  const selectCustomer = (customer: Customer) => {
    if (!customer || !customer.account_ref || !customer.account_name) return;
    
    onSelect(customer.account_ref, customer.account_name);
    setOpen(false);
    setSearchQuery('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between text-left font-normal", className)}
        >
          {selectedCustomer ? (
            <span className="truncate">{selectedCustomer}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-[var(--radix-popover-trigger-width)] p-0 z-50 bg-background" 
        align="start"
        sideOffset={4}
      >
        {/* Search input with clear button */}
        <div className="flex items-center border-b p-2">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customers..."
            className="border-0 bg-transparent p-1 text-sm focus-visible:outline-none focus-visible:ring-0"
            onKeyDown={(e) => {
              // Prevent form submission on Enter key
              if (e.key === 'Enter') {
                e.preventDefault();
              }
            }}
            // Stop propagation to prevent dropdown from closing
            onClick={(e) => e.stopPropagation()}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0"
              onClick={(e) => {
                e.stopPropagation();
                setSearchQuery('');
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Customer list with native scrolling instead of ScrollArea */}
        <div className="max-h-[300px] overflow-y-auto">
          <div className="p-1">
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => {
                const isSelected = selectedCustomer === customer.account_name;
                
                return (
                  <Button
                    key={customer.account_ref}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start text-left px-3 py-2 text-sm rounded-sm",
                      isSelected && "bg-accent text-accent-foreground"
                    )}
                    onClick={() => selectCustomer(customer)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="truncate">{customer.account_name}</span>
                  </Button>
                );
              })
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No customers found
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
