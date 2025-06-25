import DOMPurify from 'dompurify';
import React, { useState, useEffect } from 'react';
import saleService from '../services/saleService';
import MainLayout from '../components/layout/MainLayout';

const SalesAdminPage = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSaleDetails, setSelectedSaleDetails] = useState(null);
  const [editDiscount, setEditDiscount] = useState(false);
  const [discountPercent, setDiscountPercent] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [deliveryCost, setDeliveryCost] = useState('');

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
      setDiscountPercent('');
      setDiscountAmount('');
      setDeliveryCost(data.delivery_cost || '');
    } catch (err) {
      setError(`שגיאה בטעינת פרטי מכירה ${saleId}.`);
      console.error(err);
    }
  };

  const handleUpdateSaleDetails = async () => {
    const discountType = discountPercent !== '' ? 'percent' : discountAmount !== '' ? 'amount' : null;
    const discountValue = discountType === 'percent' ? parseFloat(discountPercent) : parseFloat(discountAmount);
    const delivery = parseFloat(deliveryCost);

    if (discountType && (isNaN(discountValue) || discountValue < 0)) {
      setError('ערך הנחה לא תקין');
      return;
    }

    if (deliveryCost !== '' && (isNaN(delivery) || delivery < 0)) {
      setError('ערך עלות משלוח לא תקין');
      return;
    }

    try {
      await saleService.updateSaleDetails(selectedSaleDetails.id, {
        ...(discountType && { discount_type: discountType, discount_value: discountValue }),
        ...(deliveryCost !== '' && { delivery_cost: delivery }),
      });

      await fetchSaleDetails(selectedSaleDetails.id);
      setEditDiscount(false);
    } catch (err) {
      console.error(err);
      setError('שגיאה בעדכון פרטי העסקה');
    }
  };

  const closeModal = () => {
    setSelectedSaleDetails(null);
    setEditDiscount(false);
  };

  return (
    <MainLayout>
      <div dir="rtl" className="p-4 max-w-5xl mx-auto space-y-4">
        <h2 className="text-2xl font-bold">ניהול מכירות</h2>
        {error && <p className="text-red-600">{error}</p>}
        {sales.length === 0 && !loading && <p>לא נמצאו מכירות.</p>}

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">מספר מכירה</th>
                <th className="p-2 border">תאריך</th>
                <th className="p-2 border">לקוח</th>
                <th className="p-2 border">נמכר ע"י</th>
                <th className="p-2 border">סכום כולל</th>
                <th className="p-2 border">סה"כ לאחר הנחות</th>
                <th className="p-2 border" >הערות</th>
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
                  <td className="p-2 border">₪{parseFloat(sale.total_amount).toFixed(2)}</td>
                  <td className="p-2 border font-semibold text-green-700">₪{parseFloat(sale.final_amount || sale.total_amount).toFixed(2)}</td>
                  <td className="p-2 border">{sale.notes || '-'}</td> {/* חדש */}
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

        {/* Mobile Cards */}
        <div className="block md:hidden space-y-4">
          {sales.map((sale) => (
            <div key={sale.id} className="border rounded-lg p-4 shadow-sm bg-white">
              <p><strong>מספר:</strong> {sale.id}</p>
              <p><strong>תאריך:</strong> {new Date(sale.sale_date).toLocaleString('he-IL')}</p>
              <p><strong>לקוח:</strong> {sale.customer_name || '-'}</p>
              <p><strong>נמכר ע"י:</strong> {sale.sold_by || '-'}</p>
              <p><strong>סכום:</strong> ₪{parseFloat(sale.total_amount).toFixed(2)}</p>
              <p><strong>אחרי הנחות:</strong> ₪{parseFloat(sale.final_amount || sale.total_amount).toFixed(2)}</p>
              <button
                onClick={() => fetchSaleDetails(sale.id)}
                className="mt-2 bg-blue-500 hover:bg-blue-600 text-white w-full py-2 rounded"
              >
                הצג פרטים
              </button>
            </div>
          ))}
        </div>

        {selectedSaleDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 p-2 md:p-0">
            <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-md md:max-w-lg relative text-right overflow-y-auto max-h-[90vh]">

              <button
                onClick={closeModal}
                className="absolute top-2 left-2 text-gray-500 text-xl font-bold"
              >✕</button>

              <h3 className="text-xl font-bold mb-2">פרטי מכירה #{selectedSaleDetails.id}</h3>

              <div className="text-sm space-y-1">
                <p><strong>תאריך:</strong> {new Date(selectedSaleDetails.sale_date).toLocaleString('he-IL')}</p>
                <p><strong>לקוח:</strong> {selectedSaleDetails.customer_name || '-'}</p>
                <p><strong>נמכר ע"י:</strong> {selectedSaleDetails.sold_by || '-'}</p>
                <p><strong>סכום כולל:</strong> ₪{parseFloat(selectedSaleDetails.total_amount).toFixed(2)}</p>
                <p><strong>הנחה באחוזים:</strong> {selectedSaleDetails.discount_percent || 0}%</p>
                <p><strong>הנחה בש"ח:</strong> ₪{selectedSaleDetails.discount_amount || 0}</p>
                <p><strong>סה"כ לאחר הנחה:</strong> ₪{parseFloat(selectedSaleDetails.final_amount || selectedSaleDetails.total_amount).toFixed(2)}</p>

                {selectedSaleDetails.discount_given_by && (
                  <p><strong>ניתנה ע"י:</strong> {selectedSaleDetails.discount_given_by}</p>
                )}
                {selectedSaleDetails.discount_given_at && (
                  <p><strong>בתאריך:</strong> {new Date(selectedSaleDetails.discount_given_at).toLocaleString('he-IL')}</p>
                )}
              </div>
              {selectedSaleDetails.notes && (
                <div className="mt-2 text-sm text-gray-700">
                  <strong>הערות:</strong> {selectedSaleDetails.notes}
                </div>
              )}

              {editDiscount ? (
                <div className="mt-4 space-y-2">
                  <label className="block text-sm">הנחה באחוזים:</label>
                  <input
                    type="number"
                    value={discountPercent}
                    onChange={(e) => { setDiscountPercent(e.target.value); setDiscountAmount(''); }}
                    className="border p-1 w-full"
                    placeholder="לדוגמה: 15"
                    disabled={discountAmount !== ''}
                  />

                  <label className="block text-sm">או הנחה בשקלים:</label>
                  <input
                    type="number"
                    value={discountAmount}
                    onChange={(e) => { setDiscountAmount(e.target.value); setDiscountPercent(''); }}
                    className="border p-1 w-full"
                    placeholder="לדוגמה: 100"
                    disabled={discountPercent !== ''}
                  />

                  <label className="block text-sm">עלות משלוח (₪):</label>
                  <input
                    type="number"
                    value={deliveryCost}
                    onChange={(e) => setDeliveryCost(e.target.value)}
                    className="border p-1 w-full"
                    placeholder="לדוגמה: 50"
                  />

                  <button
                    onClick={handleUpdateSaleDetails}
                    className="bg-green-600 text-white w-full py-2 rounded mt-2"
                  >
                    עדכן פרטי עסקה
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditDiscount(true)}
                  className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-white w-full py-2 rounded"
                >
                  ערוך פרטי עסקה
                </button>
              )}

              <h4 className="mt-4 font-semibold">📦 פריטים במכירה:</h4>
              <ul className="list-disc pr-5 text-sm mt-1 space-y-1">
                {selectedSaleDetails.items.map(item => (
                  <li key={item.product_id}>
                    {item.product_name || item.name} — כמות: {item.quantity}, ₪{parseFloat(item.sale_price || item.price_per_unit).toFixed(2)} ליחידה
                  </li>
                ))}
              </ul>

              <button
                onClick={closeModal}
                className="mt-6 bg-gray-800 hover:bg-gray-900 text-white w-full py-2 rounded"
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
