
import React, { useState, useEffect, useRef } from 'react';
import { Check, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
// Temporarily comment out react-virtuoso to fix dependency issue
// import { Virtuoso } from 'react-virtuoso';

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
  const isMobile = useIsMobile();
  
  // Ensure customers is always a valid array
  const safeCustomers = Array.isArray(customers) ? customers : [];
  
  useEffect(() => {
    console.log(`CustomerCommand received ${safeCustomers.length} customers`);
    // Log some details about customers that start with later letters for debugging
    const vCustomers = safeCustomers.filter(c => c.account_name.toLowerCase().startsWith('v')).length;
    const wCustomers = safeCustomers.filter(c => c.account_name.toLowerCase().startsWith('w')).length;
    const yCustomers = safeCustomers.filter(c => c.account_name.toLowerCase().startsWith('y')).length;
    const zCustomers = safeCustomers.filter(c => c.account_name.toLowerCase().startsWith('z')).length;
    console.log(`Customer counts by letter: V: ${vCustomers}, W: ${wCustomers}, Y: ${yCustomers}, Z: ${zCustomers}`);
  }, [safeCustomers]);
  
  // Filter customers based on search query with null checks - no slice limitation
  const filteredCustomers = safeCustomers.filter(customer => {
    if (!customer || typeof customer.account_name !== 'string') return false;
    return customer.account_name.toLowerCase().includes(searchQuery.toLowerCase());
  });
  
  // Log filtered results when search changes
  useEffect(() => {
    if (searchQuery) {
      console.log(`Search query "${searchQuery}" returned ${filteredCustomers.length} results`);
    }
  }, [searchQuery, filteredCustomers.length]);
  
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

  // Format the customer count with commas for better readability
  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  // Custom renderer for virtualized customer list items
  const CustomerItem = React.memo(({ customer, index }: { customer: { account_name: string; account_ref: string }, index: number }) => {
    const isSelected = selectedCustomer === customer.account_name;
    
    return (
      <button
        type="button"
        onClick={(e) => handleSelect(e, customer)}
        onMouseDown={(e) => e.preventDefault()}
        className={cn(
          "flex w-full items-center gap-2 px-2 py-1.5 text-sm cursor-pointer rounded-sm text-left",
          "hover:bg-accent hover:text-accent-foreground",
          "break-all whitespace-normal",
          isSelected && "bg-accent text-accent-foreground"
        )}
      >
        <Check
          className={cn(
            "h-4 w-4 flex-shrink-0",
            isSelected ? "opacity-100" : "opacity-0"
          )}
        />
        <span className="text-wrap break-all line-clamp-2 overflow-hidden">{customer.account_name}</span>
      </button>
    );
  });
  
  return (
    <div 
      className={cn(
        "rounded-lg border shadow-md bg-popover fixed inset-x-2 sm:relative sm:inset-auto", 
        className
      )}
      style={{ 
        zIndex: 1000,
        maxWidth: isMobile ? 'calc(100vw - 16px)' : 'none',
        width: isMobile ? 'calc(100vw - 16px)' : 'auto'
      }}
    >
      <div className="flex items-center border-b px-3 bg-muted/30">
        <Search className="mr-2 h-4 w-4 shrink-0 text-primary" />
        <Input 
          placeholder="Search customer..." 
          className="border-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 py-4"
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
      
      <div className="text-xs text-muted-foreground px-3 py-1">
        {formatNumber(filteredCustomers.length)} customer{filteredCustomers.length !== 1 ? 's' : ''} {searchQuery ? 'found' : 'available'} (total: {formatNumber(safeCustomers.length)})
      </div>
      
      <div className="relative">
        {filteredCustomers.length === 0 ? (
          <div className="py-6 text-center text-sm">No customer found.</div>
        ) : (
          <ScrollArea className="h-[60vh] max-h-[600px]">
            <div className="space-y-1 p-1">
              {filteredCustomers.map((customer, index) => (
                <div key={customer.account_ref} className="px-1 py-0.5">
                  <CustomerItem 
                    customer={customer} 
                    index={index} 
                  />
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
