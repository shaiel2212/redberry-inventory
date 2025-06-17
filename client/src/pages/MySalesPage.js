import React, { useEffect, useState } from 'react';
import saleService from '../services/saleService';
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../context/AuthContext';

const MySalesPage = () => {
  const { user } = useAuth();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMySales = async () => {
      try {
        setLoading(true);
       const data = await saleService.getMySales();
        setSales(data);
      } catch (err) {
        setError('שגיאה בטעינת המכירות האישיות.');
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'SELLER') {
      fetchMySales();
    }
  }, [user]);

  return (
    <MainLayout>
      <div className="p-4 max-w-4xl mx-auto text-right">
        <h2 className="text-xl font-bold mb-4">המכירות שלי</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {loading ? (
          <p>טוען...</p>
        ) : (
          <table className="w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">מספר</th>
                <th className="border p-2">תאריך</th>
                <th className="border p-2">לקוח</th>
                <th className="border p-2">סכום</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id} className="border-t">
                  <td className="border p-2">{sale.id}</td>
                  <td className="border p-2">{new Date(sale.sale_date).toLocaleString('he-IL')}</td>
                  <td className="border p-2">{sale.customer_name}</td>
                  <td className="border p-2">₪{sale.total_amount?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </MainLayout>
  );
};

export default MySalesPage;