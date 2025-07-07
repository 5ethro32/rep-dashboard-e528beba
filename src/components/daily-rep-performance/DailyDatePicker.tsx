import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Clock, TrendingUp, X, CalendarDays } from 'lucide-react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { 
  DateRange, 
  DateRangeShortcut, 
  FormattedDateRange 
} from '@/types/daily-rep-performance.types';
import { 
  getDateRangeShortcuts, 
  formatDateRange, 
  validateDateRange
} from '@/utils/daily-date-utils';

interface DailyDatePickerProps {
  value: DateRange;
  onChange: (dateRange: DateRange) => void;
  className?: string;
  disabled?: boolean;
  showShortcuts?: boolean;
}

const DailyDatePicker: React.FC<DailyDatePickerProps> = ({
  value,
  onChange,
  className = '',
  disabled = false,
  showShortcuts = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [shortcuts] = useState<DateRangeShortcut[]>(getDateRangeShortcuts());
  const [formattedRange, setFormattedRange] = useState<FormattedDateRange | null>(null);
  const [activeTab, setActiveTab] = useState<'shortcuts' | 'calendar'>('shortcuts');
  const [calendarRange, setCalendarRange] = useState<{ from?: Date; to?: Date } | undefined>(undefined);

  // Update formatted range when value changes
  useEffect(() => {
    if (value.startDate && value.endDate) {
      try {
        const formatted = formatDateRange(value.startDate, value.endDate);
        setFormattedRange(formatted);
        // Update calendar range when value changes
        setCalendarRange({ from: value.startDate, to: value.endDate });
      } catch (error) {
        console.error('Error formatting date range:', error);
        setFormattedRange(null);
      }
          } else {
        setFormattedRange(null);
        setCalendarRange(undefined);
      }
  }, [value]);

  // Handle shortcut selection
  const handleShortcutClick = (shortcut: DateRangeShortcut) => {
    console.log('⚡ Shortcut selected:', shortcut.label);
    onChange(shortcut.value);
    setIsOpen(false);
  };

  // Handle calendar range selection
  const handleCalendarSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (!range) {
      setCalendarRange(undefined);
      return;
    }

    setCalendarRange(range);

    // Only apply if we have both start and end dates
    if (range.from && range.to) {
      // Ensure proper time handling: start of day for start date, end of day for end date
      const startDate = new Date(range.from);
      startDate.setHours(0, 0, 0, 0); // Start of day
      
      const endDate = new Date(range.to);
      endDate.setHours(23, 59, 59, 999); // End of day
      
      const dateRange: DateRange = {
        startDate: startDate,
        endDate: endDate
      };

      const validation = validateDateRange(range.from, range.to);
      if (validation.valid) {
        console.log('📅 Custom date range selected:', dateRange);
        onChange(dateRange);
        setIsOpen(false);
      } else {
        console.warn('Invalid date range:', validation.message);
        // You could show a toast notification here
      }
    }
  };

  // Check if a shortcut matches current range
  const isCurrentRange = (shortcutRange: DateRange): boolean => {
    if (!value.startDate || !value.endDate || !shortcutRange.startDate || !shortcutRange.endDate) {
      return false;
    }
    
    return (
      value.startDate.toDateString() === shortcutRange.startDate.toDateString() &&
      value.endDate.toDateString() === shortcutRange.endDate.toDateString()
    );
  };

  // Reset calendar when opening modal
  const handleOpenModal = () => {
    setIsOpen(true);
    if (value.startDate && value.endDate) {
      setCalendarRange({ from: value.startDate, to: value.endDate });
    }
  };

  // Modal overlay component
  const modalOverlay = isOpen && (
    <div 
      className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center"
      style={{ zIndex: 9999999 }}
      onClick={() => setIsOpen(false)}
    >
      <div 
        className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl min-w-[420px] max-w-[90vw] max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-white font-medium">Select Date Range</h3>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('shortcuts')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'shortcuts'
                ? 'text-finance-red border-b-2 border-finance-red bg-gray-700/30'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Clock className="h-4 w-4" />
              Quick Select
            </div>
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'calendar'
                ? 'text-finance-red border-b-2 border-finance-red bg-gray-700/30'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Custom Range
            </div>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {activeTab === 'shortcuts' && (
            <div>
              <div className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wider">
                Choose a predefined period
              </div>
              
              <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
                {shortcuts.map((shortcut) => (
                  <button
                    key={shortcut.label}
                    onClick={() => handleShortcutClick(shortcut)}
                    disabled={disabled}
                    className={`
                      px-3 py-2.5 text-sm rounded border transition-all duration-200
                      hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-finance-red/50
                      disabled:opacity-50 disabled:cursor-not-allowed text-left
                      ${isCurrentRange(shortcut.value) 
                        ? 'bg-finance-red/20 border-finance-red/40 text-finance-red font-medium' 
                        : 'bg-gray-700/50 border-gray-600 text-gray-300 hover:text-white'
                      }
                    `}
                  >
                    {shortcut.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'calendar' && (
            <div>
              <div className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wider">
                Select start and end dates
              </div>
              
              <div className="flex justify-center">
                <CalendarComponent
                  mode="range"
                  selected={calendarRange as any}
                  onSelect={handleCalendarSelect}
                  numberOfMonths={2}
                  className="text-white"
                  classNames={{
                    months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                    month: "space-y-4",
                    caption: "flex justify-center pt-1 relative items-center text-white",
                    caption_label: "text-sm font-medium text-white",
                    nav: "space-x-1 flex items-center",
                    nav_button: "h-7 w-7 bg-transparent p-0 text-gray-400 hover:text-white",
                    nav_button_previous: "absolute left-1",
                    nav_button_next: "absolute right-1",
                    table: "w-full border-collapse space-y-1",
                    head_row: "flex",
                    head_cell: "text-gray-400 rounded-md w-9 font-normal text-[0.8rem]",
                    row: "flex w-full mt-2",
                    cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-gray-700/50 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                    day: "h-9 w-9 p-0 font-normal text-gray-300 hover:bg-gray-700 hover:text-white rounded-md",
                    day_selected: "bg-finance-red text-white hover:bg-finance-red hover:text-white focus:bg-finance-red focus:text-white",
                    day_today: "bg-gray-700 text-white font-medium",
                    day_outside: "text-gray-600 opacity-50",
                    day_disabled: "text-gray-600 opacity-50 cursor-not-allowed",
                    day_range_middle: "aria-selected:bg-gray-700/50 aria-selected:text-white",
                    day_hidden: "invisible",
                  }}
                  disabled={(date) => date > new Date()}
                />
              </div>

              {/* Calendar Instructions */}
              <div className="mt-4 p-3 bg-gray-700/30 rounded-lg">
                <div className="text-xs text-gray-400 space-y-1">
                  <div>• Click start date, then click end date</div>
                  <div>• Future dates are disabled</div>
                  <div>• Range will apply automatically when both dates are selected</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`relative ${className}`}>
      {/* Simple Date Selection Button */}
      <button
        type="button"
        onClick={handleOpenModal}
        disabled={disabled}
        className={`
          flex items-center gap-2 text-gray-400 hover:text-white transition-colors 
          focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed
          text-sm font-medium
        `}
      >
        <span className="text-white">
          {formattedRange?.display || 'Select date range'}
        </span>
        <Calendar className="h-4 w-4" />
      </button>

      {/* Date Range Display */}
      {formattedRange && (
        <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>({formattedRange.period})</span>
          </div>
          
          {formattedRange.comparison && (
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              <span>vs {formattedRange.comparison}</span>
            </div>
          )}
        </div>
      )}

      {/* Modal Overlay via Portal */}
      {typeof document !== 'undefined' && createPortal(modalOverlay, document.body)}
    </div>
  );
};

export default DailyDatePicker; 