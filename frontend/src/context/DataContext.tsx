import React, { createContext, useContext, useState } from 'react';

interface SalesData {
  Date: string;
  Product: string;
  Category: string;
  Quantity: number;
  Unit_Price: number;
  Total_Amount: number;
  Customer_ID: string;
  Region: string;
}

// Indicadores que a API devolve
export interface Metrics {
    total_revenue: number;
    orders: number;
    customers: number;
    avg_ticket: number;
    revenue_by_category: Record<string, number>;
    revenue_by_month: Record<string, number>;
    top_products: Record<string, number>;
}

interface DataContextType {
  salesData: SalesData[];
  setSalesData: (data: SalesData[]) => void;
  isDataLoaded: boolean;
  setIsDataLoaded: (loaded: boolean) => void;
  metrics: Metrics | null;            
  setMetrics: (m: Metrics | null) => void; 
  uploadedFile: File | null;
  setUploadedFile: (file: File | null) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  return (
    <DataContext.Provider
      value={{
        salesData,
        setSalesData,
        isDataLoaded,
        setIsDataLoaded,
        metrics,        
        setMetrics,
        uploadedFile,
        setUploadedFile,
      }}
    >
      {children}
      </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export type { SalesData };
