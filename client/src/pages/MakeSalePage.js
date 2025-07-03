import DOMPurify from 'dompurify';
import React, { useState, useEffect } from 'react';
import productService from '../services/productService';
import saleService from '../services/saleService';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../context/AuthContext'; // ודא שזה קיים למעלה
import ClientPicker from '../components/clientPicker/ClientPicker';
import toast from 'react-hot-toast';

const MakeSalePage = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ address: '', notes: '' });
  const [selectedClientId, setSelectedClientId] = useState(null);

  const navigate = useNavigate();
  const { user } = useAuth(); // הוסף זאת לפני useEffect

  useEffect(() => {
    // הגנה: רק מוכר יכול להיכנס לעמוד הזה
    if (user?.role !== 'seller' && user?.role !== 'admin') {
      navigate('/');
      return;
    }

    // אם כן, נטען את המוצרים
    const fetchProducts = async () => {
      try {
        const data = await productService.getAllProducts();
        setProducts(data);
      } catch (err) {
        setError('שגיאה בטעינת מוצרים.');
      }
    };

    fetchProducts();
  }, [user, navigate]);

  const handleChange = (e) => {
    setForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleAddToCart = (product) => {
    setError('');
    const existingItem = cart.find(item => item.product_id === product.id);

    if (existingItem) {
      setCart(cart.map(item =>
        item.product_id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
      if ((existingItem.quantity + 1) > product.stock_quantity) {
        setError(`שימו לב: הוזמן יותר מהכמות הקיימת למוצר '${product.name}'.`);
      }
    } else {
      setCart([...cart, {
        product_id: product.id,
        name: product.name,
        quantity: 1,
        price_per_unit: parseFloat(product.sale_price),
        stock_quantity: product.stock_quantity
      }]);

      if (product.stock_quantity <= 0) {
        setError(`המוצר '${product.name}' חסר במלאי – הוא יוזמן כהזמנה ממתינה.`);
      }
    }
  };

  const handleUpdateQuantity = (productId, newQuantity) => {
    const item = cart.find(item => item.product_id === productId);
    if (!item) return;

    if (newQuantity <= 0) {
      setCart(cart.filter(item => item.product_id !== productId));
    } else if (newQuantity > item.stock_quantity) {
      setError(`הכמות חורגת מהמלאי (${item.stock_quantity})`);
    } else {
      setCart(cart.map(item =>
        item.product_id === productId ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.quantity * item.price_per_unit, 0);
  };

  const handleSubmitSale = async () => {
    const totalAmount = calculateTotal();

    if (cart.length === 0) return setError('עגלת הקניות ריקה.');
    if (isNaN(totalAmount) || totalAmount <= 0) return setError('סכום לתשלום אינו חוקי.');
    if (!selectedClientId) {
      setError('נא לבחור לקוח מהרשימה');
      return;
    }

    const saleData = {
      client_id: selectedClientId,
      address: form.address.trim(),
      total_amount: Number(totalAmount.toFixed(2)),
      seller_id: user.id,
      notes: form.notes?.trim() || null,
      items: cart.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity
      })),
    };

    try {
      setLoading(true);
      const result = await saleService.createSale(saleData);
      toast.success(`מכירה בוצעה בהצלחה! מספר מכירה: ${result.sale_id}`);
      setCart([]);
      setSelectedClientId(null);
      setForm({ address: '', notes: '' });
      const updatedProducts = await productService.getAllProducts();
      setProducts(updatedProducts.filter(p => p.stock_quantity > 0));
    } catch (err) {
      console.error('❌ Create sale error:', err);
      toast.error(err.response?.data?.message || 'שגיאה בביצוע המכירה.');
    } finally {
      setLoading(false);
    }
  };

  const handleClientSelect = (clientId) => {
    setSelectedClientId(clientId);
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto p-4 space-y-6 text-right">
        <h2 className="text-2xl font-bold mb-4 text-center">ביצוע מכירה</h2>

        {error && <div className="bg-red-100 border border-red-300 text-red-700 p-2 rounded text-center">{error}</div>}

        <div className="bg-white rounded-xl shadow p-4 space-y-4">
          <div>
            <label className="font-semibold">בחר לקוח</label>
            <ClientPicker selectedClientId={selectedClientId} onSelectClient={handleClientSelect} />
          </div>
          <div>
            <label className="font-semibold">כתובת למשלוח</label>
            <input
              type="text"
              id="address"
              name="address"
              className="border rounded p-2 w-full"
              placeholder="רחוב, עיר, אזור..."
              value={form.address}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="font-semibold">הערות</label>
            <textarea
              id="notes"
              name="notes"
              rows={2}
              className="border rounded p-2 w-full"
              placeholder="הערות פנימיות / בקשות מיוחדות"
              value={form.notes}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-4 space-y-2">
          <label className="font-semibold">בחר מוצרים:</label>
          <input
            type="text"
            placeholder="חפש מוצר..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border rounded p-2 w-full"
          />
          <ul className="divide-y max-h-48 overflow-y-auto">
            {products
              .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
              .map(product => (
                <li key={product.id} className="flex justify-between items-center py-2 text-sm">
                  <span>
                    {product.name} (₪{parseFloat(product.sale_price).toFixed(2)}) - מלאי: {product.stock_quantity}
                    {product.stock_quantity <= 0 && (
                      <span className="text-red-500 ml-2">(לא זמין במלאי)</span>
                    )}
                  </span>
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded-md shadow-sm transition min-w-[64px] h-8 flex items-center justify-center"
                    style={{ lineHeight: '1.2' }}
                    onClick={() => handleAddToCart(product)}
                  >
                    הוסף לסל
                  </button>
                </li>
              ))}
          </ul>
        </div>
       
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-bold mb-2">עגלת קניות</h3>
          {cart.length === 0 ? (
            <p className="text-gray-500">העגלה ריקה</p>
          ) : (
            <table className="w-full text-sm border rounded">
              <thead>
                <tr className="bg-gray-100">
                  <th>שם</th>
                  <th>כמות</th>
                  <th>מחיר ליח'</th>
                  <th>סה"כ</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cart.map(item => (
                  <tr key={item.product_id} className={item.stock_quantity <= 0 ? 'bg-red-50' : ''}>
                    <td>
                      {item.name}
                      {item.stock_quantity <= 0 && (
                        <span className="text-xs text-red-600 ml-2">(חסר במלאי – יסופק בהמשך)</span>
                      )}
                    </td>
                    <td>
                      <button type="button" onClick={() => handleUpdateQuantity(item.product_id, item.quantity - 1)} className="px-2">-</button>
                      <span className="mx-2">{item.quantity}</span>
                      <button type="button" onClick={() => handleUpdateQuantity(item.product_id, item.quantity + 1)} className="px-2">+</button>
                    </td>
                    <td>₪{item.price_per_unit.toFixed(2)}</td>
                    <td>₪{(item.price_per_unit * item.quantity).toFixed(2)}</td>
                    <td>
                      <button type="button" onClick={() => handleUpdateQuantity(item.product_id, 0)} className="text-red-500">הסר</button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="text-left font-bold">סה"כ</td>
                  <td colSpan={2} className="font-bold">₪{calculateTotal().toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          )}
          <button type="button" onClick={() => setCart([])} className="mt-2 bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded">נקה עגלה</button>
        </div>

        <button
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl text-lg font-bold mt-4"
          onClick={handleSubmitSale}
          disabled={loading}
        >
          {loading ? 'מעבד...' : 'בצע מכירה'}
        </button>

        {loading && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
            <div className="bg-white p-6 rounded shadow text-center">
              <span className="block mb-2">שומר מכירה...</span>
              <div className="loader mx-auto"></div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default MakeSalePage;