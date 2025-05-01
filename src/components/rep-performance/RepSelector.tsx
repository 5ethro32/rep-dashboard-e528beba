
import React from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { RepData } from "@/types/rep-performance.types";
import { CheckIcon, ChevronsUpDown, Users } from "lucide-react";

interface RepSelectorProps {
  availableReps: string[];
  selectedReps: string[];
  onSelectRep: (rep: string) => void;
  onClearSelection: () => void;
  maxSelections?: number;
}

const RepSelector: React.FC<RepSelectorProps> = ({
  availableReps,
  selectedReps,
  onSelectRep,
  onClearSelection,
  maxSelections = 5
}) => {
  // Check if a rep is selected
  const isSelected = (rep: string) => selectedReps.includes(rep);
  
  // Check if max selections reached
  const isMaxReached = selectedReps.length >= maxSelections;
  
  return (
    <div className="flex items-center space-x-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="bg-white/5 text-white/90 border-white/20 hover:bg-white/10">
            <Users className="mr-2 h-4 w-4" />
            {selectedReps.length === 0 
              ? "Select reps to compare" 
              : `${selectedReps.length} rep${selectedReps.length > 1 ? 's' : ''} selected`}
            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          {availableReps.map((rep) => (
            <DropdownMenuCheckboxItem
              key={rep}
              checked={isSelected(rep)}
              onCheckedChange={() => onSelectRep(rep)}
              disabled={isMaxReached && !isSelected(rep)}
            >
              {rep}
            </DropdownMenuCheckboxItem>
          ))}
          {selectedReps.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                onCheckedChange={onClearSelection}
              >
                Clear selection
              </DropdownMenuCheckboxItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      
      {isMaxReached && (
        <span className="text-xs text-white/50">
          Max {maxSelections} reps
        </span>
      )}
    </div>
  );
};

export default RepSelector;
