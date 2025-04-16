
import React from 'react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CustomerCommandProps {
  customers: Array<{ account_name: string; account_ref: string }>;
  selectedCustomer: string;
  onSelect: (ref: string, name: string) => void;
  className?: string;
}

export function CustomerCommand({ 
  customers = [], 
  selectedCustomer,
  onSelect,
  className 
}: CustomerCommandProps) {
  // Ensure customers is always a valid array
  const safeCustomers = Array.isArray(customers) ? customers : [];
  
  return (
    <Command className={cn("rounded-lg border shadow-md", className)}>
      <CommandInput placeholder="Search customer..." className="border-none focus:ring-0" />
      <CommandList>
        <ScrollArea className="max-h-[200px]">
          <CommandEmpty>No customer found.</CommandEmpty>
          <CommandGroup>
            {safeCustomers.map((customer) => (
              <CommandItem
                key={customer.account_ref}
                onSelect={() => {
                  onSelect(customer.account_ref, customer.account_name);
                }}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Check
                  className={cn(
                    "h-4 w-4",
                    selectedCustomer === customer.account_name 
                      ? "opacity-100" 
                      : "opacity-0"
                  )}
                />
                <span>{customer.account_name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </ScrollArea>
      </CommandList>
    </Command>
  );
}
