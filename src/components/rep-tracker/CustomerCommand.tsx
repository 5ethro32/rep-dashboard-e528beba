
import React, { useState, useEffect, useRef } from 'react';
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
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Ensure customers is always a valid array
  const safeCustomers = Array.isArray(customers) ? customers : [];
  
  // Filter customers based on search query with null checks
  const filteredCustomers = safeCustomers.filter(customer => {
    if (!customer || typeof customer.account_name !== 'string') return false;
    return customer.account_name.toLowerCase().includes(searchQuery.toLowerCase());
  });
  
  // Focus input on mount
  useEffect(() => {
    // Short delay to ensure the dialog has rendered and focus can be set
    const timeoutId = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 50);
    
    return () => clearTimeout(timeoutId);
  }, []);
  
  const handleSelect = (e: React.MouseEvent, customer: { account_ref: string; account_name: string }) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (customer && customer.account_ref && customer.account_name) {
      onSelect(customer.account_ref, customer.account_name);
      setInputValue('');
      setSearchQuery('');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setSearchQuery(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent form submission when pressing Enter within the search field
    if (e.key === 'Enter' && filteredCustomers.length > 0) {
      e.preventDefault();
      const firstCustomer = filteredCustomers[0];
      if (firstCustomer) {
        onSelect(firstCustomer.account_ref, firstCustomer.account_name);
        setInputValue('');
        setSearchQuery('');
      }
    }
  };
  
  return (
    <div className={cn("rounded-lg border shadow-md bg-popover", className)}>
      <div className="flex items-center border-b px-3">
        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        <Input 
          placeholder="Search customer..." 
          className="border-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          ref={inputRef}
          onClick={(e) => {
            // Ensure click doesn't propagate and close the dropdown
            e.stopPropagation();
          }}
        />
      </div>
      
      <ScrollArea className="max-h-[200px] overflow-y-auto">
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
