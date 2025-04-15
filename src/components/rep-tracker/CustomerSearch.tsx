
import React, { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface Customer {
  account_name: string;
  account_ref: string;
}

interface CustomerSearchProps {
  customers: Customer[];
  selectedCustomer: string;
  onSelect: (ref: string, name: string) => void;
}

export function CustomerSearch({ customers, selectedCustomer, onSelect }: CustomerSearchProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Ensure customers is always an array
  const safeCustomers = Array.isArray(customers) ? customers : [];
  
  // Only filter customers if we have a valid array with objects containing account_name
  const filteredCustomers = React.useMemo(() => {
    if (safeCustomers.length === 0) return [];
    
    return safeCustomers
      .filter(customer => {
        if (!customer || typeof customer !== 'object') return false;
        if (!customer.account_name || typeof customer.account_name !== 'string') return false;
        return customer.account_name.toLowerCase().includes((searchQuery || '').toLowerCase());
      })
      .slice(0, 100); // Limit results for performance
  }, [safeCustomers, searchQuery]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedCustomer || "Select customer..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput 
            placeholder="Search customer..." 
            onValueChange={(value) => setSearchQuery(value || '')}
          />
          <CommandEmpty>No customer found.</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-y-auto">
            {filteredCustomers.map((customer) => (
              <CommandItem
                key={customer.account_ref}
                value={customer.account_name}
                onSelect={() => {
                  onSelect(customer.account_ref, customer.account_name);
                  setOpen(false);
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
        </Command>
      </PopoverContent>
    </Popover>
  );
}
