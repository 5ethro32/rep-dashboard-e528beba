
import React, { useState, useEffect } from 'react';
import { Check, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { CustomerCommand } from './CustomerCommand';

interface ImprovedCustomerSelectorProps {
  customers: Array<{ account_name: string; account_ref: string }>;
  selectedCustomer: string;
  onSelect: (ref: string, name: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function ImprovedCustomerSelector({
  customers = [],
  selectedCustomer = '',
  onSelect,
  placeholder = "Select customer...",
  className,
  disabled = false
}: ImprovedCustomerSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  // Safely handle customers array
  const safeCustomers = Array.isArray(customers) ? customers : [];
  
  // Clear search when selection is made
  useEffect(() => {
    if (!open) {
      setSearchValue('');
    }
  }, [open]);
  
  return (
    <div className={cn("relative w-full", className)}>
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className={cn("w-full justify-between text-left font-normal", className)}
        onClick={() => setOpen(!open)}
        disabled={disabled}
      >
        {selectedCustomer ? (
          <span className="truncate">{selectedCustomer}</span>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
      </Button>
      
      {open && (
        <div className="absolute w-full z-50 top-full mt-1 rounded-md border bg-popover shadow-md">
          <CustomerCommand 
            customers={safeCustomers}
            selectedCustomer={selectedCustomer}
            onSelect={(ref, name) => {
              onSelect(ref, name);
              setOpen(false);
            }}
            className="rounded-t-none border-t-0"
          />
        </div>
      )}
    </div>
  );
}
