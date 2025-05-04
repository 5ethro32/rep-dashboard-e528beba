import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { getAvailableMonths } from '@/utils/unified-data-service';

interface TimePeriodContextType {
  currentPeriod: string;
  previousPeriod: string;
  availablePeriods: string[];
  isLoading: boolean;
  setCurrentPeriod: (period: string) => void;
  setPreviousPeriod: (period: string) => void;
  setPeriodsWithDefault: (current?: string, previous?: string) => Promise<void>;
}

const TimePeriodContext = createContext<TimePeriodContextType | null>(null);

interface TimePeriodProviderProps {
  children: ReactNode;
}

export const TimePeriodProvider = ({ children }: TimePeriodProviderProps) => {
  const [currentPeriod, setCurrentPeriod] = useState<string>('');
  const [previousPeriod, setPreviousPeriod] = useState<string>('');
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Initialize available periods on mount
  useEffect(() => {
    const initPeriods = async () => {
      await setPeriodsWithDefault();
    };
    
    initPeriods();
  }, []);
  
  // Function to set periods with defaults if not specified
  const setPeriodsWithDefault = async (current?: string, previous?: string) => {
    setIsLoading(true);
    
    try {
      const months = await getAvailableMonths();
      setAvailablePeriods(months);
      
      if (months.length > 0) {
        // Set current period (default to most recent)
        const currentIndex = current && months.includes(current) 
          ? months.indexOf(current) 
          : 0;
        setCurrentPeriod(months[currentIndex]);
        
        // Set previous period (default to one before current if exists)
        if (previous && months.includes(previous)) {
          setPreviousPeriod(previous);
        } else if (months.length > 1 && currentIndex < months.length - 1) {
          setPreviousPeriod(months[currentIndex + 1]);
        } else {
          // Same as current if no other option
          setPreviousPeriod(months[currentIndex]);
        }
      }
    } catch (error) {
      console.error('Error initializing time periods:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <TimePeriodContext.Provider value={{
      currentPeriod,
      previousPeriod,
      availablePeriods,
      isLoading,
      setCurrentPeriod,
      setPreviousPeriod,
      setPeriodsWithDefault
    }}>
      {children}
    </TimePeriodContext.Provider>
  );
};

export const useTimePeriod = (): TimePeriodContextType => {
  const context = useContext(TimePeriodContext);
  
  if (!context) {
    throw new Error('useTimePeriod must be used within a TimePeriodProvider');
  }
  
  return context;
}; 