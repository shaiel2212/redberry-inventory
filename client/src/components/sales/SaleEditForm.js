import React, { useState, useEffect } from 'react';
import saleService from '../../services/saleService';
import productService from '../../services/productService';
import ProductList from '../products/ProductList';

const SaleEditForm = ({ sale, onSave, onCancel }) => {
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [deliveryCost, setDeliveryCost] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => {
    if (sale) {
      setAddress(sale.address || '');
      setNotes(sale.notes || '');
      setDeliveryCost(sale.delivery_cost || '');
      setDiscountPercent(sale.discount_percent || '');
      setItems(sale.items ? sale.items.map(item => ({ ...item })) : []);
    }
  }, [sale]);

  const handleItemQuantity = (idx, value) => {
    const newItems = [...items];
    newItems[idx].quantity = Math.max(1, Number(value));
    setItems(newItems);
  };
  const handleRemoveItem = (idx) => {
    const newItems = [...items];
    newItems.splice(idx, 1);
    setItems(newItems);
  };

  // Placeholder for add item logic (to be implemented)
  const handleAddItem = () => {
    setShowProductDialog(true);
    if (allProducts.length === 0) {
      productService.getAllProducts().then(setAllProducts);
    }
  };

  const handleProductPick = (product) => {
    setItems([...items, {
      product_id: product.id,
      product_name: product.name,
      quantity: 1,
      sale_price: product.sale_price,
      price_per_unit: product.sale_price,
    }]);
    setShowProductDialog(false);
    setProductSearch('');
  };

  const filteredProducts = allProducts.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const handleSave = async () => {
    setError('');
    setSaving(true);
    try {
      // חישוב סכום כולל כל הפריטים
      const totalAmount = items.reduce((sum, item) => sum + (parseFloat(item.sale_price || item.price_per_unit) * item.quantity), 0);
      let finalAmount = totalAmount;
      const discount = parseFloat(discountPercent) || 0;
      if (discount > 0) finalAmount -= finalAmount * (discount / 100);
      // קריאה ל-API עם total_amount ו-final_amount
      await saleService.updateSaleFull(sale.id, {
        address,
        notes,
        delivery_cost: deliveryCost === '' ? null : Number(deliveryCost),
        discount_percent: discountPercent === '' ? null : Number(discountPercent),
        items,
        total_amount: Number(totalAmount.toFixed(2)),
        final_amount: Number(finalAmount.toFixed(2)),
      });
      if (onSave) onSave();
    } catch (err) {
      setError('שגיאה בשמירת העסקה');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-bold mb-2">עריכת עסקה #{sale.id}</h3>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <label className="block font-semibold">כתובת:</label>
      <input type="text" className="border rounded p-2 w-full mb-2" value={address} onChange={e => setAddress(e.target.value)} />
      <label className="block font-semibold">הערות:</label>
      <textarea className="border rounded p-2 w-full mb-2" value={notes} onChange={e => setNotes(e.target.value)} />
      <label className="block font-semibold">עלות משלוח:</label>
      <input type="number" className="border rounded p-2 w-full mb-2" value={deliveryCost} onChange={e => setDeliveryCost(e.target.value)} />
      <label className="block font-semibold">הנחה כללית (%):</label>
      <input type="number" className="border rounded p-2 w-full mb-2" value={discountPercent} onChange={e => setDiscountPercent(e.target.value)} />

      <div className="mt-2 text-sm">
        <p><strong>סה"כ לאחר הנחה:</strong> ₪{(() => {
          // סכום כולל כל הפריטים
          const total = items.reduce((sum, item) => sum + (parseFloat(item.sale_price || item.price_per_unit) * item.quantity), 0);
          let final = total;
          const discount = parseFloat(discountPercent) || 0;
          if (discount > 0) final -= final * (discount / 100);
          return final.toFixed(2);
        })()}</p>
        <p className="font-bold text-blue-700">סה"כ לאחר הנחה ומשלוח: ₪{(() => {
          const total = items.reduce((sum, item) => sum + (parseFloat(item.sale_price || item.price_per_unit) * item.quantity), 0);
          let final = total;
          const discount = parseFloat(discountPercent) || 0;
          if (discount > 0) final -= final * (discount / 100);
          const delivery = parseFloat(deliveryCost) || 0;
          return (final - delivery).toFixed(2);
        })()} <span className="text-xs text-gray-500">(כולל משלוח)</span></p>
      </div>

      <h4 className="mt-4 font-semibold">📦 פריטים במכירה:</h4>
      <table className="w-full text-sm mt-2 border rounded">
        <thead>
          <tr className="bg-blue-100">
            <th>שם מוצר</th>
            <th>כמות</th>
            <th>מחיר ליח'</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={item.product_id}>
              <td>{item.product_name || item.name}</td>
              <td>
                <input
                  type="number"
                  min={1}
                  className="border rounded w-16 text-center"
                  value={item.quantity}
                  onChange={e => handleItemQuantity(idx, e.target.value)}
                />
              </td>
              <td>₪{parseFloat(item.sale_price || item.price_per_unit).toFixed(2)}</td>
              <td>
                <button
                  className="text-red-600 hover:underline"
                  onClick={() => handleRemoveItem(idx)}
                >הסר</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="mt-2 bg-blue-200 hover:bg-blue-300 text-blue-900 px-3 py-1 rounded" onClick={handleAddItem} type="button">הוסף פריט</button>
      {/* דיאלוג בחירת מוצר */}
      {showProductDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full relative">
            <button className="absolute left-2 top-2 text-gray-500 hover:text-red-600 text-xl" onClick={() => setShowProductDialog(false)}>×</button>
            <h3 className="text-lg font-bold mb-2">בחר מוצר להוספה</h3>
            <input
              type="text"
              placeholder="חפש מוצר..."
              className="border rounded p-2 w-full mb-3"
              value={productSearch}
              onChange={e => setProductSearch(e.target.value)}
              autoFocus
            />
            <div className="max-h-72 overflow-y-auto">
              <ProductList products={filteredProducts} onAddToCart={handleProductPick} />
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 mt-6">
        <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={handleSave} disabled={saving}>שמור</button>
        <button className="bg-gray-400 text-white px-4 py-2 rounded" onClick={onCancel} type="button">ביטול</button>
      </div>
    </div>
  );
};

export default SaleEditForm; 