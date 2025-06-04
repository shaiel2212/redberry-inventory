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
        setSelectedSaleDetails(null); // Reset previous details
        const data = await saleService.getSaleById(saleId);
        setSelectedSaleDetails(data);
    } catch (err) {
        setError(`שגיאה בטעינת פרטי מכירה ${saleId}.`);
        console.error(err);
    }
  }

  if (loading) return <p>טוען היסטוריית מכירות...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <MainLayout>
    <div>
      <h2>היסטוריית מכירות</h2>
      {sales.length === 0 && !loading && <p>לא נמצאו מכירות.</p>}
      <table>
        <thead>
          <tr>
            <th>מספר מכירה</th>
            <th>תאריך</th>
            <th>לקוח</th>
            <th>נמכר ע"י</th>
            <th>סכום כולל</th>
            <th>פעולות</th>
          </tr>
        </thead>
        <tbody>
          {sales.map((sale) => (
            <tr key={sale.id}>
              <td>{sale.id}</td>
              <td>{new Date(sale.sale_date).toLocaleString('he-IL')}</td>
              <td>{sale.customer_name || '-'}</td>
              <td>{sale.sold_by || '-'}</td>
              <td>₪{parseFloat(sale.total_amount).toFixed(2)}</td>
              <td>
                <button onClick={() => fetchSaleDetails(sale.id)}>הצג פרטים</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedSaleDetails && (
        <div style={{marginTop: '20px', border: '1px solid #ccc', padding: '15px'}}>
            <h3>פרטי מכירה #{selectedSaleDetails.id}</h3>
            <p><strong>תאריך:</strong> {new Date(selectedSaleDetails.sale_date).toLocaleString('he-IL')}</p>
            <p><strong>לקוח:</strong> {selectedSaleDetails.customer_name || '-'}</p>
            <p><strong>נמכר ע"י:</strong> {selectedSaleDetails.sold_by || '-'}</p>
            <p><strong>סכום כולל:</strong> ₪{parseFloat(selectedSaleDetails.total_amount).toFixed(2)}</p>
            <h4>פריטים:</h4>
            <ul>
                {selectedSaleDetails.items.map(item => (
                    <li key={item.product_id}>
                        {item.product_name} - כמות: {item.quantity}, מחיר ליחידה: ₪{parseFloat(item.price_per_unit).toFixed(2)}
                    </li>
                ))}
            </ul>
            <button onClick={() => setSelectedSaleDetails(null)}>סגור פרטים</button>
        </div>
      )}
    </div>
    </MainLayout>
  );
};

export default SalesAdminPage;