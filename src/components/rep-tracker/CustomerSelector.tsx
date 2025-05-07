
import React, { useState, useEffect, useRef } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface Customer {
  account_ref: string;
  account_name: string;
}

interface CustomerSelectorProps {
  customers: Customer[];
  selectedCustomer: string;
  onSelect: (ref: string, name: string) => void;
  className?: string;
  placeholder?: string;
  isLoading?: boolean;
}

export function CustomerSelector({ 
  customers = [], 
  selectedCustomer = '',
  onSelect,
  className,
  placeholder = "Select customer...",
  isLoading = false
}: CustomerSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus the input when popover opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  // Ensure customers is always an array
  const safeCustomers = Array.isArray(customers) ? customers : [];
  
  // Filter customers based on search query
  const filteredCustomers = !searchQuery 
    ? safeCustomers 
    : safeCustomers.filter(customer => {
        if (!customer || typeof customer !== 'object') return false;
        const name = customer.account_name || '';
        const ref = customer.account_ref || '';
        return (
          name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ref.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });

  // Handle customer selection with explicit event handling
  const handleCustomerSelect = (e: React.MouseEvent, customer: Customer) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (customer && customer.account_ref && customer.account_name) {
      onSelect(customer.account_ref, customer.account_name);
      setOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={isLoading}
        >
          {selectedCustomer || <span className="text-muted-foreground">{placeholder}</span>}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-full p-0" 
        sideOffset={4}
        align="start"
        style={{ 
          width: 'var(--radix-popover-trigger-width)',
          zIndex: 100
        }}
      >
        {isLoading ? (
          <div className="py-6 text-center text-sm">Loading customers...</div>
        ) : (
          <div className="w-full">
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <Input
                ref={inputRef}
                placeholder="Search customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-0 bg-transparent py-3 focus-visible:ring-0 focus-visible:ring-offset-0"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            
            <div 
              ref={listRef}
              className="max-h-72 overflow-y-auto"
              style={{ 
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {filteredCustomers.length > 0 ? (
                <div className="py-1">
                  {filteredCustomers.slice(0, 100).map((customer) => {
                    if (!customer || !customer.account_ref || !customer.account_name) return null;
                    
                    const isSelected = selectedCustomer === customer.account_name;
                    
                    return (
                      <div
                        key={customer.account_ref}
                        onClick={(e) => handleCustomerSelect(e, customer)}
                        className={cn(
                          "flex w-full cursor-pointer items-center justify-start px-3 py-2 text-sm",
                          "hover:bg-accent hover:text-accent-foreground",
                          isSelected && "bg-accent text-accent-foreground"
                        )}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            handleCustomerSelect(e as unknown as React.MouseEvent, customer);
                          }
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            isSelected ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span>{customer.account_name}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-6 text-center text-sm">No customers found.</div>
              )}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
