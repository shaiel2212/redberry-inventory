import DOMPurify from 'dompurify';
import React, { useState, useEffect } from 'react';
import productService from '../services/productService';
import saleService from '../services/saleService';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../context/AuthContext'; // ודא שזה קיים למעלה

const MakeSalePage = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ address: '' });

  const navigate = useNavigate();
const { user } = useAuth(); // הוסף זאת לפני useEffect

  useEffect(() => {
    // הגנה: רק מוכר יכול להיכנס לעמוד הזה
    if (user?.role !== 'SELLER') {
      navigate('/');
      return;
    }

    // אם כן, נטען את המוצרים
    const fetchProducts = async () => {
      try {
        const data = await productService.getAllProducts();
        setProducts(data.filter(p => p.stock_quantity > 0));
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
      if (existingItem.quantity < product.stock_quantity) {
        setCart(cart.map(item =>
          item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        ));
      } else {
        setError(`לא ניתן להוסיף עוד '${product.name}'. במלאי ${product.stock_quantity}.`);
      }
    } else {
      if (product.stock_quantity > 0) {
        setCart([...cart, {
          product_id: product.id,
          name: product.name,
          quantity: 1,
          price_per_unit: parseFloat(product.sale_price),
          stock_quantity: product.stock_quantity
        }]);
      } else {
        setError(`המוצר '${product.name}' אזל מהמלאי.`);
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
    if (!customerName.trim()) {
      setError('נא להזין את שם הלקוח');
      return;
    }

    const saleData = {
      customer_name: customerName.trim(),
      address: form.address.trim(),
      total_amount: Number(totalAmount.toFixed(2)),
      seller_id: user.id, // 👈 הוספה חשובה!
      items: cart.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity
      })),
    };
    try {
      setLoading(true);
      const result = await saleService.createSale(saleData);
      alert(`מכירה בוצעה בהצלחה! מספר מכירה: ${result.sale_id}`);
      setCart([]);
      setCustomerName('');
      setForm({ address: '' });
      const updatedProducts = await productService.getAllProducts();
      setProducts(updatedProducts.filter(p => p.stock_quantity > 0));
    } catch (err) {
      console.error('❌ Create sale error:', err);
      setError(err.response?.data?.message || 'שגיאה בביצוע המכירה.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="p-4 max-w-4xl mx-auto space-y-4">
        <h2 className="text-xl font-bold">ביצוע מכירה</h2>
        {error && <p className="text-red-500 border border-red-300 bg-red-100 p-2 rounded">{error}</p>}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label htmlFor="customerName" className="font-semibold">שם לקוח :</label>
          <input
            type="text"
            id="customerName"
            className="border p-2 rounded w-full sm:max-w-sm"
            value={customerName}
            onChange={(e) => setCustomerName(DOMPurify.sanitize(e.target.value))}
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label htmlFor="address" className="font-semibold">כתובת למשלוח :</label>
          <input
            type="text"
            id="address"
            name="address"
            className="border p-2 rounded w-full sm:max-w-sm"
            placeholder="רחוב, עיר, אזור..."
            value={form.address}
            onChange={handleChange}
          />
        </div>

        <div className="space-y-2">
          <label className="font-semibold">בחר מוצרים:</label>
          <input
            type="text"
            placeholder="חפש מוצר..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border p-2 rounded w-full sm:max-w-md"
          />

          <ul className="border rounded divide-y max-h-60 overflow-y-auto">
            {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(product => (
              <li key={product.id} className="flex justify-between items-center p-2 text-sm">
                <span>{product.name} (₪{parseFloat(product.sale_price).toFixed(2)}) - מלאי: {product.stock_quantity}</span>
                <button
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                  onClick={() => handleAddToCart(product)}
                >הוסף לעגלה</button>
              </li>
            ))}
          </ul>
        </div>

        <h3 className="text-lg font-bold mt-4">עגלת קניות:</h3>
        {cart.length === 0 ? <p className="text-gray-500">העגלה ריקה.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border">
              <thead className="bg-gray-100">
                <tr className="text-right">
                  <th className="p-2">מוצר</th>
                  <th className="p-2">כמות</th>
                  <th className="p-2">מחיר ליחידה</th>
                  <th className="p-2">סה"כ לפריט</th>
                  <th className="p-2">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {cart.map(item => (
                  <tr key={item.product_id} className="border-t text-right">
                    <td className="p-2">{item.name}</td>
                    <td className="p-2">
                      <input
                        type="number"
                        className="w-16 border rounded p-1"
                        value={item.quantity}
                        onChange={(e) => handleUpdateQuantity(item.product_id, parseInt(e.target.value))}
                      />
                    </td>
                    <td className="p-2">₪{item.price_per_unit.toFixed(2)}</td>
                    <td className="p-2">₪{(item.price_per_unit * item.quantity).toFixed(2)}</td>
                    <td className="p-2">
                      <button
                        className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
                        onClick={() => handleUpdateQuantity(item.product_id, 0)}
                      >הסר</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="text-right font-semibold text-lg mt-4">
          סה"כ לתשלום: ₪{calculateTotal().toFixed(2)}
        </div>

        <button
          onClick={handleSubmitSale}
          disabled={loading || cart.length === 0}
          className="mt-4 bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-2 rounded disabled:opacity-50"
        >{loading ? 'מעבד...' : 'בצע מכירה'}</button>
      </div>
    </MainLayout>
  );
};

export default MakeSalePage;