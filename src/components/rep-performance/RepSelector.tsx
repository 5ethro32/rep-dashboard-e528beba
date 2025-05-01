
import React from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, X } from "lucide-react";

interface RepSelectorProps {
  availableReps: string[];
  selectedReps: string[];
  onSelectRep: (rep: string) => void;
  onClearSelection: () => void;
  maxSelections: number;
}

const RepSelector: React.FC<RepSelectorProps> = ({
  availableReps,
  selectedReps,
  onSelectRep,
  onClearSelection,
  maxSelections
}) => {
  // Sort reps alphabetically for better UX
  const sortedReps = [...availableReps].sort((a, b) => a.localeCompare(b));
  
  // Add console log to help debug
  console.log("RepSelector rendering with:", {
    availableRepsCount: availableReps.length,
    selectedRepsCount: selectedReps.length,
    sortedReps
  });
  
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-white/70">
          Select up to {maxSelections} reps to compare ({selectedReps.length}/{maxSelections})
        </span>
        {selectedReps.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm"
            className="h-6 px-2 text-xs text-white/70 hover:text-white hover:bg-white/10"
            onClick={onClearSelection}
          >
            <X className="h-3 w-3 mr-1" /> Clear
          </Button>
        )}
      </div>
      
      {availableReps.length === 0 ? (
        <div className="text-xs text-white/50 text-center p-2">
          No reps available for the selected filters
        </div>
      ) : (
        <ScrollArea className="h-[120px] w-full border border-white/10 rounded-md p-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1 p-1">
            {sortedReps.map(rep => (
              <Button
                key={rep}
                variant="ghost"
                size="sm"
                className={`text-xs justify-start ${
                  selectedReps.includes(rep) 
                    ? "bg-white/20 text-white" 
                    : "text-white/70 hover:text-white hover:bg-white/10"
                } ${
                  selectedReps.length >= maxSelections && !selectedReps.includes(rep)
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                onClick={() => onSelectRep(rep)}
                disabled={selectedReps.length >= maxSelections && !selectedReps.includes(rep)}
              >
                {selectedReps.includes(rep) && (
                  <Check className="h-3 w-3 mr-1" />
                )}
                <span className="truncate">{rep}</span>
              </Button>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default RepSelector;
