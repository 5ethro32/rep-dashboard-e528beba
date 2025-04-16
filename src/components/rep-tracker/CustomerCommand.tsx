
import React, { useState, useEffect } from 'react';
import { Check, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CustomerCommandProps {
  customers: Array<{ account_name: string; account_ref: string }>;
  selectedCustomer: string;
  onSelect: (ref: string, name: string) => void;
  className?: string;
}

export function CustomerCommand({ 
  customers = [], 
  selectedCustomer = '',
  onSelect,
  className 
}: CustomerCommandProps) {
  const [inputValue, setInputValue] = useState(selectedCustomer || "");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Ensure customers is always a valid array
  const safeCustomers = Array.isArray(customers) ? customers : [];
  
  // Filter customers based on search query with null checks
  const filteredCustomers = safeCustomers.filter(customer => {
    if (!customer || typeof customer.account_name !== 'string') return false;
    return customer.account_name.toLowerCase().includes(searchQuery.toLowerCase());
  });
  
  const handleSelect = (e: React.MouseEvent, customer: { account_ref: string; account_name: string }) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (customer && customer.account_ref && customer.account_name) {
      onSelect(customer.account_ref, customer.account_name);
      setInputValue(customer.account_name); 
    }
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    setSearchQuery(value);
  };

  // Update input value when selectedCustomer changes externally
  useEffect(() => {
    if (selectedCustomer) {
      setInputValue(selectedCustomer);
    }
  }, [selectedCustomer]);
  
  return (
    <div className={cn("rounded-lg border shadow-md", className)}>
      <div className="flex items-center border-b px-3">
        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        <Input 
          placeholder="Search customer..." 
          className="border-none focus:ring-0"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      
      <ScrollArea className="max-h-[200px]">
        {filteredCustomers.length === 0 ? (
          <div className="py-6 text-center text-sm">No customer found.</div>
        ) : (
          <div className="p-1">
            {filteredCustomers.map((customer) => (
              customer && customer.account_ref && customer.account_name ? (
                <button
                  key={customer.account_ref}
                  type="button"
                  onClick={(e) => handleSelect(e, customer)}
                  onMouseDown={(e) => e.preventDefault()} // Prevent focus loss
                  className={cn(
                    "flex w-full items-center gap-2 px-2 py-1.5 text-sm cursor-pointer rounded-sm text-left",
                    "hover:bg-accent hover:text-accent-foreground",
                    selectedCustomer === customer.account_name && "bg-accent text-accent-foreground"
                  )}
                >
                  <Check
                    className={cn(
                      "h-4 w-4 flex-shrink-0",
                      selectedCustomer === customer.account_name ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span>{customer.account_name}</span>
                </button>
              ) : null
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
