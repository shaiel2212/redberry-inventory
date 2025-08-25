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
  const [orderFormFile, setOrderFormFile] = useState(null);
  const [orderFormPreview, setOrderFormPreview] = useState(null);

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
      
      // אם יש תמונת הזמנה, העלה אותה
      if (orderFormFile) {
        try {
          await saleService.uploadOrderForm(result.sale_id, orderFormFile);
          if (orderFormFile.type === 'application/pdf') {
            toast.success('קובץ PDF הזמנה מקורי הועלה בהצלחה!');
          } else {
            toast.success('תמונת הזמנה מקורי הועלתה בהצלחה!');
          }
        } catch (uploadError) {
          console.error('Error uploading order form:', uploadError);
          toast.error('המכירה בוצעה בהצלחה, אך הייתה בעיה בהעלאת קובץ ההזמנה');
        }
      }

      toast.success(`מכירה בוצעה בהצלחה! מספר מכירה: ${result.sale_id}`);
      setCart([]);
      setSelectedClientId(null);
      setForm({ address: '', notes: '' });
      setOrderFormFile(null);
      setOrderFormPreview(null);
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // בדיקת סוג הקובץ
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('סוג קובץ לא נתמך. אנא בחר תמונה (JPG, PNG, GIF) או קובץ PDF');
        return;
      }

      // בדיקת גודל הקובץ (מקסימום 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('גודל הקובץ חורג מ-10MB. אנא בחר קובץ קטן יותר');
        return;
      }

      setOrderFormFile(file);

      // יצירת תצוגה מקדימה אם זה קובץ תמונה
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setOrderFormPreview(e.target.result);
        };
        reader.readAsDataURL(file);
      } else {
        setOrderFormPreview(null);
      }

      // הודעה על סוג הקובץ
      if (file.type === 'application/pdf') {
        toast.success(`קובץ PDF "${file.name}" נבחר בהצלחה!`);
      } else {
        toast.success(`תמונת "${file.name}" נבחרה בהצלחה!`);
      }
    }
  };

  const removeOrderForm = () => {
    setOrderFormFile(null);
    setOrderFormPreview(null);
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
          
          <div>
            <label className="font-semibold">טופס הזמנה מקורי (אופציונלי)</label>
            <div className="mt-2">
              <input
                type="file"
                id="orderForm"
                accept=".jpg,.jpeg,.png,.gif,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="orderForm"
                className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {orderFormFile ? 'שנה קובץ' : 'בחר קובץ'}
              </label>
              <span className="ml-2 text-sm text-gray-500">
                JPG, PNG, GIF או PDF (מקסימום 10MB)
              </span>
            </div>
            
            {orderFormFile && (
              <div className="mt-3 p-3 bg-gray-50 rounded-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">
                      {orderFormFile.name}
                    </span>
                    <span className="ml-2 text-xs text-gray-500">
                      ({(orderFormFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <button
                      type="button"
                      onClick={() => document.getElementById('orderForm').click()}
                      className="text-blue-600 hover:text-blue-700 text-sm p-1 rounded hover:bg-blue-50"
                      title="ערוך קובץ"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={removeOrderForm}
                      className="text-red-500 hover:text-red-700 text-sm p-1 rounded hover:bg-red-50"
                      title="הסר קובץ"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                {/* תצוגה מקדימה */}
                <div className="mt-3">
                  {orderFormFile.type.startsWith('image/') ? (
                    // תצוגה מקדימה לתמונות
                    <div className="relative">
                      <img
                        src={orderFormPreview}
                        alt="תצוגה מקדימה של טופס הזמנה"
                        className="max-w-full h-auto max-h-48 rounded border shadow-sm"
                      />
                      <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                        תמונה
                      </div>
                    </div>
                  ) : orderFormFile.type === 'application/pdf' ? (
                    // תצוגה מקדימה ל-PDF
                    <div className="bg-white border rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-center mb-3">
                        <svg className="w-16 h-16 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                        </svg>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          {orderFormFile.name}
                        </div>
                        <div className="text-xs text-gray-500 mb-3">
                          קובץ PDF - {(orderFormFile.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                        <div className="bg-red-50 border border-red-200 rounded px-3 py-2">
                          <div className="text-xs text-red-700">
                            📄 קובץ PDF יועלה כקובץ דיגיטלי
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // תצוגה מקדימה לקבצים אחרים
                    <div className="bg-white border rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-center mb-3">
                        <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                        </svg>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          {orderFormFile.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          סוג קובץ: {orderFormFile.type}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
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