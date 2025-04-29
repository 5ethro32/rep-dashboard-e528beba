
import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SimpleCustomerSelectProps {
  customers: Array<{ account_name: string; account_ref: string }>;
  selectedCustomer: string;
  onSelect: (ref: string, name: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function SimpleCustomerSelect({
  customers = [],
  selectedCustomer = '',
  onSelect,
  placeholder = 'Select a customer...',
  className,
  disabled = false
}: SimpleCustomerSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const isMobile = useIsMobile();
  
  // Ensure customers is always a valid array
  const safeCustomers = Array.isArray(customers) ? customers : [];
  
  // Filter customers based on search, with safety checks
  const filteredCustomers = searchValue === '' 
    ? safeCustomers 
    : safeCustomers.filter(customer => {
        if (!customer || typeof customer.account_name !== 'string') return false;
        return customer.account_name.toLowerCase().includes(searchValue.toLowerCase());
      });

  // Handle selecting a customer with proper safety checks
  const handleSelect = (e: React.MouseEvent, customer: { account_name: string; account_ref: string }) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (customer && customer.account_ref && customer.account_name) {
      onSelect(customer.account_ref, customer.account_name);
      setOpen(false);
      setSearchValue('');
    }
  };

  // Custom content for mobile view
  if (isMobile && open) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex flex-col">
        <div className="bg-black px-4 py-3 flex justify-between items-center">
          <h3 className="font-semibold text-white">{placeholder}</h3>
          <button 
            onClick={() => setOpen(false)}
            className="text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex-1 bg-popover p-2 flex flex-col">
          <div className="mb-2">
            <Input
              placeholder="Search customers..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="h-9 w-full"
              autoComplete="off"
            />
          </div>
          
          <ScrollArea className="flex-1 rounded-md border">
            {filteredCustomers.length === 0 ? (
              <div className="text-center p-4 text-sm text-muted-foreground">
                No customer found.
              </div>
            ) : (
              <div className="p-1">
                {filteredCustomers.map((customer) => (
                  customer && customer.account_ref && customer.account_name ? (
                    <button
                      key={customer.account_ref}
                      type="button"
                      className={cn(
                        "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer text-left",
                        "hover:bg-accent hover:text-accent-foreground",
                        "break-all whitespace-normal",
                        selectedCustomer === customer.account_name && "bg-accent text-accent-foreground"
                      )}
                      onClick={(e) => handleSelect(e, customer)}
                    >
                      <Check
                        className={cn(
                          "h-4 w-4 flex-shrink-0",
                          selectedCustomer === customer.account_name ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="text-wrap break-all line-clamp-2">{customer.account_name}</span>
                    </button>
                  ) : null
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          {selectedCustomer || <span className="text-muted-foreground">{placeholder}</span>}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="p-0 bg-popover" 
        align="start"
        sideOffset={4}
        style={{ 
          zIndex: 999,
          width: isMobile ? '85vw' : 'var(--radix-popover-trigger-width)',
          maxWidth: isMobile ? '85vw' : 'none'
        }}
      >
        <div className="border-b p-2">
          <Input
            placeholder="Search customers..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="h-9"
            autoComplete="off"
          />
        </div>
        <div className="max-h-[300px] overflow-y-auto p-1">
          {filteredCustomers.length === 0 ? (
            <div className="text-center p-4 text-sm text-muted-foreground">
              No customer found.
            </div>
          ) : (
            filteredCustomers.map((customer) => (
              customer && customer.account_ref && customer.account_name ? (
                <button
                  key={customer.account_ref}
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer text-left",
                    "hover:bg-accent hover:text-accent-foreground",
                    "break-all whitespace-normal",
                    selectedCustomer === customer.account_name && "bg-accent text-accent-foreground"
                  )}
                  onClick={(e) => handleSelect(e, customer)}
                >
                  <Check
                    className={cn(
                      "h-4 w-4 flex-shrink-0",
                      selectedCustomer === customer.account_name ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="text-wrap break-all line-clamp-2">{customer.account_name}</span>
                </button>
              ) : null
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
