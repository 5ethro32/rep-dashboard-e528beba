
import React, { useState } from 'react';
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
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(selectedCustomer || "");
  
  // Ensure customers is always a valid array
  const safeCustomers = Array.isArray(customers) ? customers : [];
  
  const handleSelect = (customer: { account_ref: string; account_name: string }) => {
    onSelect(customer.account_ref, customer.account_name);
    setInputValue(customer.account_name); // Update the input value when a customer is selected
    setOpen(false); // Close the command dialog after selection
  };

  // Update input value when selectedCustomer changes externally
  React.useEffect(() => {
    if (selectedCustomer) {
      setInputValue(selectedCustomer);
    }
  }, [selectedCustomer]);
  
  return (
    <Command 
      className={cn("rounded-lg border shadow-md", className)}
      shouldFilter={true} // Ensure filtering works
    >
      <CommandInput 
        placeholder="Search customer..." 
        className="border-none focus:ring-0"
        value={inputValue}
        onValueChange={setInputValue}
        onFocus={() => setOpen(true)}
      />
      {open && (
        <CommandList>
          <ScrollArea className="max-h-[200px]">
            <CommandEmpty>No customer found.</CommandEmpty>
            <CommandGroup>
              {safeCustomers.map((customer) => (
                <CommandItem
                  key={customer.account_ref}
                  value={customer.account_name}
                  onSelect={() => handleSelect(customer)}
                  className="flex items-center gap-2 cursor-pointer hover:bg-accent"
                >
                  <div className="flex items-center gap-2 w-full">
                    <Check
                      className={cn(
                        "h-4 w-4 flex-shrink-0",
                        selectedCustomer === customer.account_name 
                          ? "opacity-100" 
                          : "opacity-0"
                      )}
                    />
                    <span>{customer.account_name}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </ScrollArea>
        </CommandList>
      )}
    </Command>
  );
}
