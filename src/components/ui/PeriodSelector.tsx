import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTimePeriod } from '@/contexts/TimePeriodContext';

interface PeriodSelectorProps {
  className?: string;
  showComparison?: boolean;
  label?: string;
}

const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  className,
  showComparison = true,
  label = "Select Period"
}) => {
  const {
    currentPeriod,
    previousPeriod,
    availablePeriods,
    isLoading,
    setCurrentPeriod,
    setPreviousPeriod
  } = useTimePeriod();

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div>
            <Label htmlFor="current-period">{label}</Label>
            <Select
              value={currentPeriod}
              onValueChange={setCurrentPeriod}
              disabled={isLoading || availablePeriods.length === 0}
            >
              <SelectTrigger id="current-period" className="w-full mt-1">
                <SelectValue placeholder="Select current period" />
              </SelectTrigger>
              <SelectContent>
                {availablePeriods.map(period => (
                  <SelectItem key={period} value={period}>
                    {period}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showComparison && (
            <div>
              <Label htmlFor="comparison-period">Compare To</Label>
              <Select
                value={previousPeriod}
                onValueChange={setPreviousPeriod}
                disabled={isLoading || availablePeriods.length <= 1}
              >
                <SelectTrigger id="comparison-period" className="w-full mt-1">
                  <SelectValue placeholder="Select comparison period" />
                </SelectTrigger>
                <SelectContent>
                  {availablePeriods.map(period => (
                    <SelectItem 
                      key={period} 
                      value={period}
                      disabled={period === currentPeriod}
                    >
                      {period}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PeriodSelector; 