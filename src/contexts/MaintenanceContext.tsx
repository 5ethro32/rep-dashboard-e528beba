
import React, { createContext, useContext, useState, useEffect } from 'react';

interface MaintenanceContextType {
  isInMaintenance: boolean;
  bypassMaintenance: () => void;
}

const MaintenanceContext = createContext<MaintenanceContextType | undefined>(undefined);

export const MaintenanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInMaintenance, setIsInMaintenance] = useState(true);
  
  const bypassMaintenance = () => {
    setIsInMaintenance(false);
    localStorage.setItem('maintenance_bypassed', 'true');
    // Force a reload to ensure all components recognize the maintenance state change
    window.location.href = '/rep-performance';
  };
  
  useEffect(() => {
    // Check if maintenance has been bypassed
    const bypassStatus = localStorage.getItem('maintenance_bypassed');
    if (bypassStatus === 'true') {
      setIsInMaintenance(false);
    }
  }, []);
  
  return (
    <MaintenanceContext.Provider value={{ isInMaintenance, bypassMaintenance }}>
      {children}
    </MaintenanceContext.Provider>
  );
};

export const useMaintenance = () => {
  const context = useContext(MaintenanceContext);
  if (context === undefined) {
    throw new Error('useMaintenance must be used within a MaintenanceProvider');
  }
  return context;
};
