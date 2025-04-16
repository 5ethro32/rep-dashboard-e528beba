
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
  const [searchQuery, setSearchQuery] = useState("");
  
  // Ensure customers is always a valid array
  const safeCustomers = Array.isArray(customers) ? customers : [];
  
  // Filter customers based on search query (handled manually to avoid cmdk issues)
  const filteredCustomers = safeCustomers.filter(customer => 
    customer.account_name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleSelect = (customer: { account_ref: string; account_name: string }) => {
    onSelect(customer.account_ref, customer.account_name);
    setInputValue(customer.account_name); // Update the input value when a customer is selected
    setOpen(false); // Close the command dialog after selection
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    setSearchQuery(value);
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
      shouldFilter={false} // We'll handle filtering manually
    >
      <CommandInput 
        placeholder="Search customer..." 
        className="border-none focus:ring-0"
        value={inputValue}
        onValueChange={handleInputChange}
        onFocus={() => setOpen(true)}
      />
      {open && (
        <CommandList>
          <ScrollArea className="max-h-[200px]">
            {filteredCustomers.length === 0 && (
              <CommandEmpty>No customer found.</CommandEmpty>
            )}
            <CommandGroup heading="Customers">
              {filteredCustomers.map((customer) => (
                <CommandItem
                  key={customer.account_ref}
                  onSelect={() => handleSelect(customer)}
                  className="flex items-center gap-2 cursor-pointer hover:bg-accent"
                  value={customer.account_name} // Explicitly provide value prop
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
