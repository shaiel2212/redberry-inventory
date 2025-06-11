import DOMPurify from 'dompurify';
import React, { useState, useEffect } from 'react';
import productService from '../services/productService';
import saleService from '../services/saleService';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';

const MakeSalePage = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]); // { productId, name, quantity, price_per_unit, stock_quantity }
  const [searchTerm, setSearchTerm] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await productService.getAllProducts();
        setProducts(data);
; // הצג רק מוצרים במלאי
      } catch (err) {
        setError('שגיאה בטעינת מוצרים.');
      }
    };
    fetchProducts();
  }, []);

  const handleAddToCart = (product) => {
    setError('');
    const existingItem = cart.find(item => item.productId === product.id);
    if (existingItem) {
      if (existingItem.quantity < product.stock_quantity) {
        setCart(cart.map(item =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        ));
      } else {
        setError(`לא ניתן להוסיף עוד '${product.name}'. הכמות במלאי היא ${product.stock_quantity}.`);
      }
    } else {
      if (product.stock_quantity > 0) {
        setCart([...cart, {
            productId: product.id,
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
    setError('');
    const itemInCart = cart.find(item => item.productId === productId);
    if (!itemInCart) return;

    if (newQuantity <= 0) {
      setCart(cart.filter(item => item.productId !== productId));
    } else if (newQuantity > itemInCart.stock_quantity) {
        setError(`הכמות המבוקשת עבור '${itemInCart.name}' חורגת מהמלאי (${itemInCart.stock_quantity}).`);
        setCart(cart.map(item =>
            item.productId === productId ? { ...item, quantity: itemInCart.stock_quantity } : item
        ));
    }
    else {
      setCart(cart.map(item =>
        item.productId === productId ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.quantity * item.price_per_unit), 0).toFixed(2);
  };

  const handleSubmitSale = async () => {
    if (cart.length === 0) {
      setError('עגלת הקניות ריקה.');
      return;
    }
    setError('');
    setLoading(true);
    const saleData = {
      items: cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price_per_unit: item.price_per_unit
      })),
      customer_name: customerName,
      total_amount: parseFloat(calculateTotal())
    };

    try {
      const result = await saleService.createSale(saleData);
      alert(`מכירה בוצעה בהצלחה! מספר מכירה: ${result.saleId}`);
      setCart([]);
      setCustomerName('');
      // רענון מלאי מוצרים (אופציונלי כאן, או שהמשתמש ינווט לדף אחר)
       const updatedProducts = await productService.getAllProducts();
       setProducts(updatedProducts.filter(p => p.stock_quantity > 0));
      // navigate('/admin/sales'); // או לדף אחר
    } catch (err) {
      setError(err.response?.data?.message || 'שגיאה בביצוע המכירה.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainLayout>
    <div>
      <h2>ביצוע מכירה</h2>
      {error && <p className="p-4 sm:p-6 error-message">{error}</p>}

      <div>
        <label htmlFor="customerName">שם לקוח (אופציונלי):</label>
        <input
            type="text"
            id="customerName"
            value={customerName}
            onChange={(e) => setCustomerName(DOMPurify.sanitize(e.target.value))}
        />
      </div>

      <h3>בחר מוצרים:</h3>
      <input
        type="text"
        placeholder="חפש מוצר..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{marginBottom: '10px', padding: '8px', width: '300px'}}
      />
      <div style={{ display: 'flex', maxHeight: '300px', overflowY: 'auto', border: '1px solid #ccc' }}>
        <ul style={{ listStyleType: 'none', padding: 0, width: '100%' }}>
          {filteredProducts.map(product => (
            <li key={product.id} style={{ padding: '10px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{product.name} (₪{parseFloat(product.sale_price).toFixed(2)}) - מלאי: {product.stock_quantity}</span>
              <button onClick={() => handleAddToCart(product)} disabled={product.stock_quantity <= 0}>הוסף לעגלה</button>
            </li>
          ))}
           {filteredProducts.length === 0 && <p>לא נמצאו מוצרים התואמים לחיפוש.</p>}
        </ul>
      </div>


      <h3>עגלת קניות:</h3>
      {cart.length === 0 ? (
        <p>העגלה ריקה.</p>
      ) : (
        <div className="overflow-x-auto">
<table style={{width: '100%', marginTop: '10px'}}>
          <thead>
            <tr>
              <th>מוצר</th>
              <th>כמות</th>
              <th>מחיר ליחידה</th>
              <th>סה"כ לפריט</th>
              <th>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {cart.map(item => (
              <tr key={item.productId}>
                <td>{item.name}</td>
                <td>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleUpdateQuantity(item.productId, parseInt(e.target.value))}
                    min="1"
                    max={item.stock_quantity} // Set max to available stock
                    style={{width: '60px'}}
                  />
                </td>
                <td>₪{item.price_per_unit.toFixed(2)}</td>
                <td>₪{(item.quantity * item.price_per_unit).toFixed(2)}</td>
                <td>
                  <button onClick={() => handleUpdateQuantity(item.productId, 0)} style={{backgroundColor: 'salmon'}}>הסר</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
</div>
      )}
      <h3>סה"כ לתשלום: ₪{calculateTotal()}</h3>
      <button onClick={handleSubmitSale} disabled={loading || cart.length === 0}>
        {loading ? 'מעבד...' : 'בצע מכירה'}
      </button>
    </div>
    </MainLayout>
  );
};

export default MakeSalePage;