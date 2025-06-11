import React, { useEffect, useState } from 'react';
import api from '../api';
import MainLayout from '../components/layout/MainLayout';

const DashboardPage = () => {
  const [salesSummary, setSalesSummary] = useState(null);
  const [lowStock, setLowStock] = useState(null);
  const [salesGraph, setSalesGraph] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [salesSummaryRes, lowStockRes, salesGraphRes] = await Promise.all([
          api.get('/reports/sales_summary'),
          api.get('/reports/low_stock'),
          api.get('/reports/sales_by_day')
        ]);
        setSalesSummary(salesSummaryRes.data);
        setLowStock(lowStockRes.data);
        setSalesGraph(salesGraphRes.data);
      } catch (error) {
        console.error('❌ שגיאה בטעינת הדשבורד:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <MainLayout>
      <h2>דשבורד</h2>
      <pre>{JSON.stringify({ salesSummary, lowStock, salesGraph }, null, 2)}</pre>
    </MainLayout>
  );
};

export default DashboardPage;
