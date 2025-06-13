
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import axios from 'axios';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [salesSummary, setSalesSummary] = useState({ daily: 0, weekly: 0, monthly: 0 });
  const [lowStock, setLowStock] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setError('');
      const [salesRes, stockRes] = await Promise.all([
        axios.get('/api/reports/sales_summary'),
        axios.get('/api/reports/low_stock')
      ]);
      setSalesSummary(salesRes.data);
      setLowStock(stockRes.data.slice(0, 3));
    } catch (err) {
      setError('שגיאה בטעינת נתוני לוח הבקרה');
      console.error(err);
    }
  };

  return (
    <MainLayout>
      <div dir="rtl" className="p-4 max-w-5xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold text-center">לוח בקרה</h2>

        {error && <p className="text-red-600 text-center">{error}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border rounded shadow p-4 text-right">
            <p className="text-sm text-gray-500">סה"כ היום</p>
            <p className="text-2xl font-bold text-green-600">₪{salesSummary.daily?.toLocaleString()}</p>
          </div>
          <div className="bg-white border rounded shadow p-4 text-right">
            <p className="text-sm text-gray-500">סה"כ השבוע</p>
            <p className="text-2xl font-bold text-blue-600">₪{salesSummary.weekly?.toLocaleString()}</p>
          </div>
          <div className="bg-white border rounded shadow p-4 text-right">
            <p className="text-sm text-gray-500">סה"כ החודש</p>
            <p className="text-2xl font-bold text-purple-600">₪{salesSummary.monthly?.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white border rounded shadow p-4">
          <h3 className="text-lg font-semibold mb-2">מוצרים עם מלאי נמוך</h3>
          {lowStock.length === 0 ? (
            <p className="text-gray-500">אין מוצרים במלאי נמוך</p>
          ) : (
            <ul className="space-y-1 text-sm text-right">
              {lowStock.map(product => (
                <li key={product.id}>
                  <span className="font-semibold">{product.name}</span> - כמות: {product.stock_quantity}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white border rounded shadow p-4">
          <h3 className="text-lg font-semibold mb-2">גרף מכירות</h3>
          <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
            (כאן ניתן להטמיע גרף בעזרת Chart.js על סמך /api/reports/sales_by_day)
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-sm font-semibold">
          <button onClick={() => navigate('/products')} className="bg-blue-500 hover:bg-blue-600 text-white py-3 rounded">ניהול מוצרים</button>
          <button onClick={() => navigate('/sales')} className="bg-indigo-500 hover:bg-indigo-600 text-white py-3 rounded">צפייה במכירות</button>
          <button onClick={() => navigate('/sale')} className="bg-green-600 hover:bg-green-700 text-white py-3 rounded">ביצוע מכירה</button>
          <button onClick={() => navigate('/users')} className="bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded">משתמשים</button>
        </div>
      </div>
    </MainLayout>
  );
};

export default DashboardPage;
