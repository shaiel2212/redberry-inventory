
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../components/layout/MainLayout';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import api from '../services/api';

const DashboardPage = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [salesByDay, setSalesByDay] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "בוקר טוב";
    if (hour < 18) return "צהריים טובים";
    return "ערב טוב";
  };
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [salesSummary, lowStockRes, salesGraphRes] = await Promise.all([
          api.get(`${process.env.REACT_APP_API_BASE_URL}/reports/sales_summary`),
          api.get(`${process.env.REACT_APP_API_BASE_URL}/reports/low_stock`),
          api.get(`${process.env.REACT_APP_API_BASE_URL}/reports/sales_by_day`)
        ]);
        setSummary(salesSummary.data);
        setLowStock(lowStockRes.data.slice(0, 3)); // רק שלושה פריטים
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

  if (loading) return <MainLayout><p className="p-6 text-center mt-10">טוען נתונים...</p></MainLayout>;
  if (error) return <MainLayout><p className="p-6 text-red-500 text-center">{error}</p></MainLayout>;

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 space-y-6 text-right bg-[#e7fafd] min-h-screen" dir="rtl">
        {/* ברכה */}
        <div className="text-xl font-semibold text-gray-700"> {getGreeting()}, {user?.username || 'משתמש'}👋</div>

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
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={salesByDay} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => [`₪${value.toLocaleString()}`, 'סה"כ מכירות']}
                  labelFormatter={(label) => `תאריך: ${label}`}
                />
                <Bar dataKey="total" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* מוצרים במלאי נמוך - גרסת מובייל */}
        <div className="bg-white rounded-xl shadow p-4 space-y-4">
          <h3 className="text-lg font-semibold mb-2">פריטים במלאי נמוך</h3>
          {lowStock.length === 0 ? (
            <p className="text-gray-500 text-sm">אין מוצרים במלאי נמוך</p>
          ) : (
            <div className="space-y-3">
              {lowStock.map((item) => (
                <div key={item.id} className="border rounded-lg p-3 text-sm space-y-1 bg-gray-50">
                  <div><span className="font-semibold">שם:</span> {item.name}</div>
                  <div><span className="font-semibold">כמות:</span> <span className="text-red-600 font-bold">{item.stock_quantity}</span></div>
                  <div><span className="font-semibold">מחיר:</span> ₪{item.sale_price || '---'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default DashboardPage;
