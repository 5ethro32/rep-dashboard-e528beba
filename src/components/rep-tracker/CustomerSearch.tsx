
import React, { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef<Array<HTMLDivElement | null>>([]);

  // Focus the input when popover opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
    
    // Reset highlighted index when opening/closing
    setHighlightedIndex(-1);
  }, [open]);

  // Ensure customers is always an array
  const safeCustomers = Array.isArray(customers) ? customers : [];
  
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
          handleSelect(selected.account_ref, selected.account_name);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        break;
    }
  };

  // Handle customer selection
  const handleSelect = (ref: string, name: string) => {
    onSelect(ref, name);
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
        <div className="w-full">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              ref={inputRef}
              placeholder="Search customer..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="border-0 bg-transparent py-3 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          
          <ScrollArea className="max-h-64">
            {filteredCustomers.length > 0 ? (
              <div className="py-1">
                {filteredCustomers.map((customer, index) => (
                  <div
                    key={customer.account_ref}
                    ref={el => itemsRef.current[index] = el}
                    onClick={() => handleSelect(customer.account_ref, customer.account_name)}
                    className={cn(
                      "flex cursor-pointer items-center px-3 py-2 text-sm",
                      "hover:bg-accent hover:text-accent-foreground",
                      (selectedCustomer === customer.account_name || index === highlightedIndex) && 
                        "bg-accent text-accent-foreground"
                    )}
                    role="option"
                    aria-selected={selectedCustomer === customer.account_name || index === highlightedIndex}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedCustomer === customer.account_name ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {customer.account_name}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-sm">No customer found.</div>
            )}
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}
