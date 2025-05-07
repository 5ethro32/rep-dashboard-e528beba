
import React, { useState, useEffect } from 'react';
import { Check, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { CustomerCommand } from './CustomerCommand';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();

  // Safely handle customers array
  const safeCustomers = Array.isArray(customers) ? customers : [];
  
  // Clear search when selection is made
  useEffect(() => {
    if (!open) {
      setSearchValue('');
    }
  }, [open]);

  // Close dropdown when clicking outside (for mobile)
  useEffect(() => {
    if (!open) return;
    
    const handleOutsideClick = (e: MouseEvent) => {
      // We're just closing the dropdown here, not triggering other actions
      setOpen(false);
    };
    
    // Delay adding the event listener to prevent immediate closing
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleOutsideClick);
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [open]);

  // Handle customer selection with explicit error handling
  const handleCustomerSelection = (ref: string, name: string) => {
    try {
      if (!ref || !name) {
        console.error('Invalid customer selection:', { ref, name });
        return;
      }
      
      // Call the onSelect prop with the selected customer
      onSelect(ref, name);
      setOpen(false);
    } catch (error) {
      console.error('Error selecting customer:', error);
    }
  };
  
  return (
    <div className={cn("relative w-full", className)}>
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className={cn(
          "w-full justify-between text-left font-normal", 
          selectedCustomer ? "text-foreground" : "text-muted-foreground",
          className
        )}
        onClick={(e) => {
          e.preventDefault(); // Prevent form submission
          e.stopPropagation(); // Stop event from propagating up
          setOpen(!open);
        }}
        disabled={disabled}
        type="button" // Explicitly set type to button to prevent form submission
      >
        {selectedCustomer ? (
          <span className="truncate">{selectedCustomer}</span>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
      </Button>
      
      {open && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center sm:relative sm:inset-auto sm:bg-transparent"
          onClick={(e) => {
            e.preventDefault(); // Prevent form submission
            e.stopPropagation(); // Stop event propagation
          }}
          style={{ zIndex: 990 }}
        >
          {isMobile && (
            <div className="fixed top-0 left-0 right-0 bg-black px-4 py-3 flex justify-between items-center z-[1000]">
              <h3 className="font-semibold text-white">Select Customer</h3>
              <button 
                onClick={(e) => {
                  e.preventDefault(); // Prevent form submission
                  e.stopPropagation(); // Stop event propagation
                  setOpen(false);
                }}
                className="text-white"
                type="button" // Explicitly set type to button
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
          
          <div 
            className={cn(
              "z-[1000]",
              isMobile 
                ? "fixed inset-x-2 top-14 bottom-4" 
                : "absolute w-full top-full mt-1"
            )}
            onClick={(e) => {
              e.preventDefault(); // Prevent form submission
              e.stopPropagation(); // Stop event propagation
            }}
          >
            <CustomerCommand 
              customers={safeCustomers}
              selectedCustomer={selectedCustomer}
              onSelect={(ref, name) => handleCustomerSelection(ref, name)}
              className={cn(
                isMobile 
                  ? "rounded-lg border shadow-lg" 
                  : "rounded-t-none border-t-0"
              )}
            />
          </div>
        </div>
      )}
    </div>
  );
}
