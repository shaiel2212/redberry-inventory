import DOMPurify from 'dompurify';
import React, { useState, useEffect } from 'react';
import productService from '../services/productService';
import ProductForm from '../components/products/ProductForm'; // טופס להוספה/עריכה
import MainLayout from '../components/layout/MainLayout';
// import ProductListForAdmin from '../components/products/ProductListForAdmin'; // רשימת מוצרים עם כפתורי עריכה/מחיקה

const ProductsAdminPage = () => {
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null); // מוצר נוכחי לעריכה
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await productService.getAllProducts();
      setProducts(data);
    } catch (err) {
      setError('שגיאה בטעינת המוצרים.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleEdit = (product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDelete = async (productId) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק מוצר זה?')) {
      try {
        await productService.deleteProduct(productId);
        fetchProducts(); // רענון הרשימה
      } catch (err) {
        setError(err.response?.data?.message || 'שגיאה במחיקת המוצר.');
        console.error(err);
      }
    }
  };

  const handleFormSubmit = async () => {
    fetchProducts(); // רענון הרשימה לאחר הוספה/עריכה
    setShowForm(false);
    setEditingProduct(null);
  };

  if (loading) return <p>טוען מוצרים...</p>;
  if (error && !showForm) return <p className="p-4 sm:p-6 error-message">{error}</p>; // הצג שגיאה רק אם הטופס לא פתוח (כי בטופס יש טיפול משלו)

  return (
    <MainLayout>
    <div>
      <h2>ניהול מלאי מוצרים</h2>
      <button onClick={() => { setEditingProduct(null); setShowForm(!showForm); }}>
        {showForm && !editingProduct ? 'בטל הוספה' : 'הוסף מוצר חדש'}
      </button>
      {showForm && <ProductForm productToEdit={editingProduct} onFormSubmit={handleFormSubmit} setErrorParent={setError} />}

      <h3>רשימת מוצרים</h3>
      {products.length === 0 && !loading && <p>לא נמצאו מוצרים.</p>}
      <div className="overflow-x-auto">
<table>
        <thead>
          <tr>
            <th>שם</th>
            <th>קטגוריה</th>
            <th>מחיר מכירה</th>
            <th>כמות במלאי</th>
            <th>פעולות</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>{product.name}</td>
              <td>{product.category}</td>
              <td>₪{parseFloat(product.sale_price).toFixed(2)}</td>
              <td>{product.stock_quantity}</td>
              <td>
                <button onClick={() => handleEdit(product)}>ערוך</button>
                <button onClick={() => handleDelete(product.id)} style={{marginLeft: '5px', backgroundColor: 'darkred'}}>מחק</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
</div>
    </div>
    </MainLayout>
  );
};

export default ProductsAdminPage;