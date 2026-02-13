import React, { createContext, useContext, useState, useEffect } from 'react';

const UnitContext = createContext({ isMetric: true, toggleUnit: () => {} });

export function UnitProvider({ children }: { children: React.ReactNode }) {
  const [isMetric, setIsMetric] = useState(true);
  useEffect(() => {
    const stored = localStorage.getItem('unit');
    setIsMetric(stored !== 'imperial');
  }, []);
  const toggleUnit = () => {
    const newIsMetric = !isMetric;
    localStorage.setItem('unit', newIsMetric ? 'metric' : 'imperial');
    setIsMetric(newIsMetric);
  };
  return <UnitContext.Provider value={{ isMetric, toggleUnit }}>{children}</UnitContext.Provider>;
}

export function useUnitToggle() {
  return useContext(UnitContext);
}
