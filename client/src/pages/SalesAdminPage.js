
import DOMPurify from 'dompurify';
import React, { useState, useEffect } from 'react';
import saleService from '../services/saleService';
import MainLayout from '../components/layout/MainLayout';

const SalesAdminPage = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSaleDetails, setSelectedSaleDetails] = useState(null);

  useEffect(() => {
    const fetchSales = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await saleService.getAllSales();
        setSales(data);
      } catch (err) {
        setError('שגיאה בטעינת היסטוריית המכירות.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSales();
  }, []);

  const fetchSaleDetails = async (saleId) => {
    try {
      setSelectedSaleDetails(null);
      const data = await saleService.getSaleById(saleId);
      setSelectedSaleDetails(data);
    } catch (err) {
      setError(`שגיאה בטעינת פרטי מכירה ${saleId}.`);
      console.error(err);
    }
  };

  return (
    <MainLayout>
      <div dir="rtl" className="p-4 max-w-5xl mx-auto space-y-4">
        <h2 className="text-2xl font-bold">היסטוריית מכירות</h2>
        {error && <p className="text-red-600">{error}</p>}
        {sales.length === 0 && !loading && <p>לא נמצאו מכירות.</p>}

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">מספר מכירה</th>
                <th className="p-2 border">תאריך</th>
                <th className="p-2 border">לקוח</th>
                <th className="p-2 border">נמכר ע"י</th>
                <th className="p-2 border">סכום כולל</th>
                <th className="p-2 border">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id} className="border-t">
                  <td className="p-2 border">{sale.id}</td>
                  <td className="p-2 border">{new Date(sale.sale_date).toLocaleString('he-IL')}</td>
                  <td className="p-2 border">{sale.customer_name || '-'}</td>
                  <td className="p-2 border">{sale.sold_by || '-'}</td>
                  <td className="p-2 border">
                    ₪{sale.total_amount ? parseFloat(sale.total_amount).toFixed(2) : '0.00'}
                  </td>
                  <td className="p-2 border">
                    <button
                      onClick={() => fetchSaleDetails(sale.id)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                    >
                      הצג פרטים
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* מודל הצגת פרטי מכירה */}
        {selectedSaleDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full relative text-right overflow-y-auto max-h-[90vh]">
              <button
                onClick={() => setSelectedSaleDetails(null)}
                className="absolute top-2 left-2 text-gray-500 text-xl font-bold"
              >
                ✕
              </button>
              <h3 className="text-xl font-semibold mb-2">פרטי מכירה #{selectedSaleDetails.id}</h3>
              <p><strong>תאריך:</strong> {new Date(selectedSaleDetails.sale_date).toLocaleString('he-IL')}</p>
              <p><strong>לקוח:</strong> {selectedSaleDetails.customer_name || '-'}</p>
              <p><strong>נמכר ע"י:</strong> {selectedSaleDetails.sold_by || '-'}</p>
              <p><strong>סכום כולל:</strong> ₪{selectedSaleDetails.total_amount ? parseFloat(selectedSaleDetails.total_amount).toFixed(2) : '0.00'}</p>
              <h4 className="mt-3 font-semibold">פריטים:</h4>
              <ul className="list-disc pr-4 space-y-1">
                {selectedSaleDetails.items.map(item => (
                  <li key={item.product_id}>
                    {item.product_name || item.name} - כמות: {item.quantity}, מחיר ליחידה: ₪{parseFloat(item.price_per_unit).toFixed(2)}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setSelectedSaleDetails(null)}
                className="mt-4 bg-gray-700 hover:bg-gray-800 text-white px-4 py-1 rounded w-full"
              >
                סגור פרטים
              </button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default SalesAdminPage;
