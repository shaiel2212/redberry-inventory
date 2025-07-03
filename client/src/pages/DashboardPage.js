import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../components/layout/MainLayout';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import api from '../services/api';
import { Dialog, DialogContent, DialogTitle } from '../components/ui/dialog';
import clientService from '../services/clientService';
import { AlertCircle } from 'lucide-react';
import {
  Dialog as RadixDialog,
  DialogContent as RadixDialogContent,
  DialogOverlay as RadixDialogOverlay,
  DialogTrigger as RadixDialogTrigger,
  DialogTitle as RedixDialogTitle,
} from "@radix-ui/react-dialog";
import saleService from '../services/saleService';
import deliveryService from '../services/deliveryService';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [salesByDay, setSalesByDay] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [billingReminders, setBillingReminders] = useState([]);
  const [showReminder, setShowReminder] = useState(false);
  const [recentSales, setRecentSales] = useState([]);
  const [pendingDeliveries, setPendingDeliveries] = useState({
    awaitingDraft: [],
    awaitingAssignment: [],
    awaitingDelivery: [],
    delivered: [],
    cancelled: []
  });
  const [activeTab, setActiveTab] = useState('awaitingDraft');
  const navigate = useNavigate();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "בוקר טוב";
    if (hour < 18) return "צהריים טובים";
    return "ערב טוב";
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [salesSummary, lowStockRes, salesGraphRes, recentSalesRes] = await Promise.all([
          api.get(`${process.env.REACT_APP_API_BASE_URL}/reports/sales_summary`),
          api.get(`${process.env.REACT_APP_API_BASE_URL}/reports/low_stock`),
          api.get(`${process.env.REACT_APP_API_BASE_URL}/reports/sales_by_day`),
          saleService.getRecentSales(),
        ]);
        setSummary(salesSummary.data);
        setLowStock(lowStockRes.data.slice(0, 3)); // רק שלושה פריטים
        setSalesByDay(salesGraphRes.data);
        setRecentSales(Array.isArray(recentSalesRes) ? recentSalesRes : []);
      } catch (err) {
        setError('שגיאה בטעינת נתונים');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    async function fetchPendingDeliveries() {
      const data = await deliveryService.getDashboardDeliveriesByStatus();
      setPendingDeliveries(data);
    }
    fetchPendingDeliveries();
  }, []);

  
  useEffect(() => {
    async function fetchReminders() {
      const res = await clientService.getBillingReminders();
      if (res.length > 0) {
        setBillingReminders(res);
        setShowReminder(true);
      }
    }
    fetchReminders();
  }, []);

  const handleSaleClick = (saleId) => {
    navigate(`/admin/sales?focus=${saleId}`);
  };

  const handleDeliveryClick = (deliveryId, status) => {
    navigate(`/deliveries?focus=${deliveryId}&status=${status}`);
  };

  if (loading) return <MainLayout><p className="p-6 text-center mt-10">טוען נתונים...</p></MainLayout>;
  if (error) return <MainLayout><p className="p-6 text-red-500 text-center">{error}</p></MainLayout>;

  if (!Array.isArray(recentSales)) {
    return <MainLayout><p className="p-6 text-red-500 text-center">שגיאה בטעינת עסקאות אחרונות</p></MainLayout>;
  }

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

        {/* 5 העסקאות האחרונות */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow p-4 mt-2">
              <h3 className="text-lg font-semibold mb-2">5 העסקאות האחרונות</h3>
              {recentSales.length === 0 ? (
                <p className="text-gray-500 text-sm">לא נמצאו עסקאות אחרונות</p>
              ) : (
                <div className="max-h-56 overflow-y-auto divide-y">
                  {recentSales.map((sale) => (
                    <div
                      key={sale.id}
                      className="py-2 flex flex-col md:flex-row md:items-center md:gap-4 text-sm cursor-pointer hover:bg-blue-50 transition"
                      onClick={() => handleSaleClick(sale.id)}
                    >
                      <span className="font-bold text-blue-700">#{sale.id}</span>
                      <span className="text-gray-500">{new Date(sale.sale_date).toLocaleString('he-IL')}</span>
                      <span className="flex-1">{sale.customer_name || '-'}</span>
                      <span>₪{parseFloat(sale.final_amount || sale.total_amount).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* משלוחים לפי סטטוס */}
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow p-4 mt-2">
              <h3 className="text-lg font-semibold mb-2">סטטוס משלוחים</h3>
              <div className="flex gap-4 mb-2 text-sm">
                <span
                  className={`cursor-pointer pb-1 border-b-2 transition ${activeTab === 'awaitingDraft' ? 'border-blue-500 text-blue-700 font-bold' : 'border-transparent text-gray-500'}`}
                  onClick={() => setActiveTab('awaitingDraft')}
                >
                  ממתין לטיוטה
                </span>
                <span
                  className={`cursor-pointer pb-1 border-b-2 transition ${activeTab === 'awaitingAssignment' ? 'border-blue-500 text-blue-700 font-bold' : 'border-transparent text-gray-500'}`}
                  onClick={() => setActiveTab('awaitingAssignment')}
                >
                  ממתין להקצאת שליח
                </span>
                <span
                  className={`cursor-pointer pb-1 border-b-2 transition ${activeTab === 'awaitingDelivery' ? 'border-blue-500 text-blue-700 font-bold' : 'border-transparent text-gray-500'}`}
                  onClick={() => setActiveTab('awaitingDelivery')}
                >
                  ממתין למסירה
                </span>
                <span
                  className={`cursor-pointer pb-1 border-b-2 transition ${activeTab === 'delivered' ? 'border-blue-500 text-blue-700 font-bold' : 'border-transparent text-gray-500'}`}
                  onClick={() => setActiveTab('delivered')}
                >
                  נמסר
                </span>
                <span
                  className={`cursor-pointer pb-1 border-b-2 transition ${activeTab === 'cancelled' ? 'border-blue-500 text-blue-700 font-bold' : 'border-transparent text-gray-500'}`}
                  onClick={() => setActiveTab('cancelled')}
                >
                  בוטל
                </span>
              </div>
              <div className="max-h-56 overflow-y-auto divide-y">
                {(pendingDeliveries[activeTab] || []).length === 0 ? (
                  <p className="text-gray-500 text-sm">אין משלוחים ממתינים</p>
                ) : (
                  pendingDeliveries[activeTab].map((delivery) => (
                    <div
                      key={delivery.id}
                      className="py-2 flex flex-col md:flex-row md:items-center md:gap-4 text-sm cursor-pointer hover:bg-blue-50 transition"
                      onClick={() => handleDeliveryClick(delivery.id, delivery.status)}
                    >
                      <span className="font-bold text-blue-700">#{delivery.sale_id}</span>
                      <span className="text-gray-500">{new Date(delivery.sale_date).toLocaleString('he-IL')}</span>
                      <span className="flex-1">{delivery.customer_name || '-'}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {showReminder && (
          <Dialog open={showReminder} onClose={() => setShowReminder(false)}>
            <DialogContent className="text-right max-w-lg w-full p-6 rounded-3xl shadow-2xl bg-gradient-to-br from-blue-50 via-white to-blue-100 border border-blue-200">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-7 h-7 text-yellow-500" />
                <DialogTitle className="text-xl font-bold text-blue-700">
                  לתשומת לבך: לקוחות עם מועד חיוב קרוב
                </DialogTitle>
              </div>
              <ul className="list-disc pr-5 text-sm mt-1 space-y-1">
                {billingReminders.map(client => (
                  <li key={client.id}>{client.full_name} (יום חיוב: {client.billing_day})</li>
                ))}
              </ul>
              <button
                onClick={() => setShowReminder(false)}
                className="mt-6 bg-gray-800 hover:bg-gray-900 text-white w-full py-2 rounded"
              >
                סגור
              </button>
            </DialogContent>
          </Dialog>
        )}

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
