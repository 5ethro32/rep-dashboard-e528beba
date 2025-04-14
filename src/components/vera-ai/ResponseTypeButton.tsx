
import React from 'react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface ResponseTypeButtonProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick: () => void;
}

const ResponseTypeButton = ({ 
  icon: Icon, 
  label, 
  active = false, 
  onClick 
}: ResponseTypeButtonProps) => {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-colors",
        active 
          ? "bg-gradient-to-r from-finance-red to-rose-700 text-white" 
          : "bg-gray-800/50 text-gray-300 hover:bg-gray-700/70 hover:text-gray-100"
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </Button>
  );
};

export default ResponseTypeButton;
