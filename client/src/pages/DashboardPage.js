import DOMPurify from 'dompurify';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../components/layout/MainLayout';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
          axios.get(`${process.env.REACT_APP_API_URL}/api/reports/sales_summary`),
          axios.get(`${process.env.REACT_APP_API_URL}/api/reports/low_stock`),
          axios.get(`${process.env.REACT_APP_API_URL}/api/reports/sales_by_day`)
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

  if (loading) return <MainLayout><p className="text-center mt-10">טוען נתונים...</p></MainLayout>;
  if (error) return <MainLayout><p className="text-red-500 text-center">{error}</p></MainLayout>;

  return (
    <MainLayout>
      <div className="p-6 space-y-8 text-right bg-[#e7fafd] min-h-screen" dir="rtl">
        {/* ברכה */}
        <div className="text-xl font-semibold text-gray-700 text-right">בוקר טוב, {user?.username || 'מנהל'} 👋</div>

        {/* כרטיסי מידע */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow p-4">
            <p className="text-sm text-gray-500">מכירות יומיות</p>
            <p className="text-2xl font-bold text-green-600">₪{summary.daily}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <p className="text-sm text-gray-500">מכירות שבועיות</p>
            <p className="text-2xl font-bold text-blue-600">₪{summary.weekly}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <p className="text-sm text-gray-500">מכירות חודשיות</p>
            <p className="text-2xl font-bold text-purple-600">₪{summary.monthly}</p>
          </div>
        </div>

        {/* גרף מכירות */}
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="text-lg font-semibold mb-4">סטטיסטיקות מכירות</h3>
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
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="text-lg font-semibold mb-4">פריטים במלאי נמוך</h3>
          <div className="overflow-x-auto">
            <table className="w-full table-auto text-sm text-right">
              <thead className="bg-gray-100">
                <tr>
               
                  <th className="p-2">שם</th>
                  <th className="p-2">כמות</th>
                  <th className="p-2">מחיר</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="p-2">{item.name}</td>
                    <td className="p-2 text-red-600 font-semibold">{item.stock_quantity}</td>
                    <td className="p-2">₪{item.sale_price || '---'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default DashboardPage;
