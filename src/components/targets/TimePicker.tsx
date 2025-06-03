import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimePickerProps {
  startTime: string;
  endTime: string;
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string) => void;
  startDate: Date;
  endDate: Date;
  className?: string;
}

const TimePicker: React.FC<TimePickerProps> = ({
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  startDate,
  endDate,
  className
}) => {
  // Check if start and end dates are the same day
  const isSameDay = startDate.toDateString() === endDate.toDateString();

  // Validate time logic
  const isValidTimeRange = () => {
    if (!startTime || !endTime) return true; // Allow empty times
    
    if (isSameDay) {
      // Same day: end time must be after start time
      return endTime > startTime;
    }
    
    // Different days: any time combination is valid
    return true;
  };

  const timeRangeValid = isValidTimeRange();

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  // Calculate duration
  const calculateDuration = () => {
    if (!startTime || !endTime) return null;
    
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-${isSameDay ? '01' : '02'}T${endTime}`);
    
    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffHours < 1) {
      const diffMinutes = Math.round(diffMs / (1000 * 60));
      return `${diffMinutes} minutes`;
    } else if (diffHours < 24) {
      const hours = Math.floor(diffHours);
      const minutes = Math.round((diffHours - hours) * 60);
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours} hours`;
    } else {
      const days = Math.floor(diffHours / 24);
      const remainingHours = Math.round(diffHours % 24);
      return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days} days`;
    }
  };

  const duration = calculateDuration();

  return (
    <Card className={cn("bg-gray-800 border-gray-600", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-lg flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-400" />
          Challenge Timing
        </CardTitle>
        <CardDescription className="text-gray-400">
          Set specific start and end times for this daily challenge
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date Range Display */}
        <div className="flex items-center gap-2 p-3 bg-gray-700 rounded-lg">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-white text-sm">
            {formatDate(startDate)}
            {!isSameDay && (
              <>
                <span className="text-gray-400 mx-2">→</span>
                {formatDate(endDate)}
              </>
            )}
          </span>
          {isSameDay && (
            <span className="text-blue-400 text-xs ml-2">(Same day challenge)</span>
          )}
        </div>

        {/* Time Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-white text-sm">Start Time</Label>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => onStartTimeChange(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white"
            />
            <p className="text-xs text-gray-400">
              Challenge begins at this time on {formatDate(startDate)}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-white text-sm">End Time</Label>
            <Input
              type="time"
              value={endTime}
              onChange={(e) => onEndTimeChange(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white"
            />
            <p className="text-xs text-gray-400">
              Challenge ends at this time on {formatDate(endDate)}
            </p>
          </div>
        </div>

        {/* Validation and Duration Display */}
        {startTime && endTime && (
          <div className={cn(
            "p-3 rounded-lg border",
            timeRangeValid 
              ? "bg-green-900/20 border-green-500/20" 
              : "bg-red-900/20 border-red-500/20"
          )}>
            <div className="flex items-center justify-between">
              <div>
                <p className={cn(
                  "text-sm font-medium",
                  timeRangeValid ? "text-green-400" : "text-red-400"
                )}>
                  {timeRangeValid ? "✓ Valid time range" : "⚠ Invalid time range"}
                </p>
                {!timeRangeValid && (
                  <p className="text-red-300 text-xs mt-1">
                    End time must be after start time on the same day
                  </p>
                )}
              </div>
              {timeRangeValid && duration && (
                <div className="text-right">
                  <p className="text-green-400 text-sm font-medium">Duration</p>
                  <p className="text-green-300 text-xs">{duration}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Time Examples */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { label: "Morning", start: "09:00", end: "12:00" },
            { label: "Afternoon", start: "13:00", end: "17:00" },
            { label: "Evening", start: "18:00", end: "21:00" },
            { label: "Full Day", start: "00:00", end: "23:59" }
          ].map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                onStartTimeChange(preset.start);
                onEndTimeChange(preset.end);
              }}
              className="p-2 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded border border-gray-600 transition-colors"
            >
              <div className="font-medium">{preset.label}</div>
              <div className="text-gray-400">{preset.start}-{preset.end}</div>
            </button>
          ))}
        </div>

        {/* Help Text */}
        <div className="text-xs text-gray-400 space-y-1">
          <p>• Times are in 24-hour format (HH:MM)</p>
          <p>• For same-day challenges, end time must be after start time</p>
          <p>• For multi-day challenges, any time combination is allowed</p>
          <p>• Leave times empty to use default start/end of day</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TimePicker; 