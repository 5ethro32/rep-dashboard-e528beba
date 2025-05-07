
import React, { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ControllerRenderProps } from 'react-hook-form';

interface Customer {
  account_name: string;
  account_ref: string;
}

interface CustomerSearchProps {
  customers: Customer[];
  field?: ControllerRenderProps<any, 'customer_ref'>;
  onChange?: (value: string) => void;
  value?: string;
}

export function CustomerSearch({ customers, field, onChange, value }: CustomerSearchProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef<Array<HTMLDivElement | null>>([]);
  
  // Get the current value from either field or direct value prop
  const currentValue = field?.value || value || '';
  
  // Get the setter function
  const setValue = (newValue: string) => {
    if (field) {
      field.onChange(newValue);
    }
    if (onChange) {
      onChange(newValue);
    }
  };

  // Ensure customers is always an array
  const safeCustomers = Array.isArray(customers) ? customers : [];
  
  // Get the selected customer name
  const selectedCustomerName = currentValue 
    ? customers.find(c => c.account_ref === currentValue)?.account_name || ''
    : '';
  
  // Filter customers based on search query
  const filteredCustomers = !searchQuery 
    ? safeCustomers 
    : safeCustomers.filter(customer => {
        if (!customer || typeof customer !== 'object') return false;
        if (!customer.account_name || typeof customer.account_name !== 'string') return false;
        return customer.account_name.toLowerCase().includes(searchQuery.toLowerCase());
      })
      .slice(0, 100); // Limit results for performance

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (filteredCustomers.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredCustomers.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredCustomers.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredCustomers.length) {
          const selected = filteredCustomers[highlightedIndex];
          handleSelect(selected.account_ref);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        break;
    }
  };

  // Handle customer selection
  const handleSelect = (ref: string) => {
    console.log("Customer selection triggered:", ref);
    setValue(ref);
    setOpen(false);
    setSearchQuery('');
  };

  // Scroll to highlighted item
  useEffect(() => {
    if (highlightedIndex >= 0 && itemsRef.current[highlightedIndex]) {
      itemsRef.current[highlightedIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [highlightedIndex]);

  // Reset refs when filtered customers change
  useEffect(() => {
    itemsRef.current = itemsRef.current.slice(0, filteredCustomers.length);
  }, [filteredCustomers.length]);

  return (
    <div className="relative w-full">
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className="w-full justify-between"
        onClick={() => setOpen(!open)}
      >
        {selectedCustomerName || "Select customer..."}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
      
      {open && (
        <div className="absolute top-full mt-1 w-full z-50 rounded-md border bg-popover shadow-lg">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              ref={inputRef}
              placeholder="Search customer..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="border-0 bg-transparent py-3 focus-visible:ring-0 focus-visible:ring-offset-0"
              autoFocus
            />
          </div>
          
          <ScrollArea className="max-h-64">
            {filteredCustomers.length > 0 ? (
              <div className="py-1">
                {filteredCustomers.map((customer, index) => (
                  <div
                    key={customer.account_ref}
                    ref={el => itemsRef.current[index] = el}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log("Customer item clicked:", customer.account_name);
                      handleSelect(customer.account_ref);
                    }}
                    className={cn(
                      "flex cursor-pointer items-center px-3 py-2 text-sm",
                      "hover:bg-accent hover:text-accent-foreground",
                      (currentValue === customer.account_ref || index === highlightedIndex) && 
                        "bg-accent text-accent-foreground"
                    )}
                    role="option"
                    aria-selected={currentValue === customer.account_ref || index === highlightedIndex}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        currentValue === customer.account_ref ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span>{customer.account_name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-sm">No customer found.</div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
