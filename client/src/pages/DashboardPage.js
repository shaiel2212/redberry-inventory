import DOMPurify from 'dompurify';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../components/layout/MainLayout';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';

const DashboardPage = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [salesByDay, setSalesByDay] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [salesSummary, lowStockRes, salesGraphRes] = await Promise.all([
          api.get(`${process.env.REACT_APP_API_BASE_URL}/reports/sales_summary`),
          api.get(`${process.env.REACT_APP_API_BASE_URL}/reports/low_stock`),
          api.get(`${process.env.REACT_APP_API_BASE_URL}/reports/sales_by_day`)
        ]);
        setSummary(salesSummary.data);
        setLowStock(lowStockRes.data);
        setSalesByDay(salesGraphRes.data);
      } catch (err) {
        setError('שגיאה בטעינת נתונים');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <MainLayout><p className="p-4 sm:p-6 text-center mt-10">טוען נתונים...</p></MainLayout>;
  if (error) return <MainLayout><p className="p-4 sm:p-6 text-red-500 text-center">{error}</p></MainLayout>;

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 p-6 space-y-8 text-right bg-[#e7fafd] min-h-screen" dir="rtl">
        {/* ברכה */}
        <div className="p-4 sm:p-6 text-xl font-semibold text-gray-700 text-right">בוקר טוב, {user?.username || 'מנהל'} 👋</div>

        {/* כרטיסי מידע */}
        <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 sm:p-6 bg-white rounded-xl shadow p-4">
            <p className="p-4 sm:p-6 text-sm text-gray-500">מכירות יומיות</p>
            <p className="p-4 sm:p-6 text-2xl font-bold text-green-600">₪{summary.daily}</p>
          </div>
          <div className="p-4 sm:p-6 bg-white rounded-xl shadow p-4">
            <p className="p-4 sm:p-6 text-sm text-gray-500">מכירות שבועיות</p>
            <p className="p-4 sm:p-6 text-2xl font-bold text-blue-600">₪{summary.weekly}</p>
          </div>
          <div className="p-4 sm:p-6 bg-white rounded-xl shadow p-4">
            <p className="p-4 sm:p-6 text-sm text-gray-500">מכירות חודשיות</p>
            <p className="p-4 sm:p-6 text-2xl font-bold text-purple-600">₪{summary.monthly}</p>
          </div>
        </div>

        {/* גרף מכירות */}
        <div className="p-4 sm:p-6 bg-white rounded-xl shadow p-4">
          <h3 className="p-4 sm:p-6 text-lg font-semibold mb-4">סטטיסטיקות מכירות</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={salesByDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* טבלת מוצרים במלאי נמוך */}
        <div className="p-4 sm:p-6 bg-white rounded-xl shadow p-4">
          <h3 className="p-4 sm:p-6 text-lg font-semibold mb-4">פריטים במלאי נמוך</h3>
          <div className="p-4 sm:p-6 overflow-x-auto">
            <div className="overflow-x-auto">
<table className="p-4 sm:p-6 w-full table-auto text-sm text-right">
              <thead className="p-4 sm:p-6 bg-gray-100">
                <tr>
               
                  <th className="p-4 sm:p-6 p-2">שם</th>
                  <th className="p-4 sm:p-6 p-2">כמות</th>
                  <th className="p-4 sm:p-6 p-2">מחיר</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((item) => (
                  <tr key={item.id} className="p-4 sm:p-6 border-b">
                    <td className="p-4 sm:p-6 p-2">{item.name}</td>
                    <td className="p-4 sm:p-6 p-2 text-red-600 font-semibold">{item.stock_quantity}</td>
                    <td className="p-4 sm:p-6 p-2">₪{item.sale_price || '---'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
</div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default DashboardPage;
