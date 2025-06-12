
import DOMPurify from 'dompurify';
import React, { useState, useEffect } from 'react';
import productService from '../services/productService';
import ProductForm from '../components/products/ProductForm';
import MainLayout from '../components/layout/MainLayout';

const ProductsAdminPage = () => {
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
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
        fetchProducts();
      } catch (err) {
        setError(err.response?.data?.message || 'שגיאה במחיקת המוצר.');
        console.error(err);
      }
    }
  };

  const handleFormSubmit = async () => {
    fetchProducts();
    setShowForm(false);
    setEditingProduct(null);
  };

  if (loading) return <p>טוען מוצרים...</p>;
  if (error && !showForm) return <p className="p-4 sm:p-6 error-message">{error}</p>;

  return (
    <MainLayout>
      <div dir="rtl" className="p-4 max-w-6xl mx-auto space-y-4">
        <h2 className="text-2xl font-bold">ניהול מלאי מוצרים</h2>

        <button
          onClick={() => { setEditingProduct(null); setShowForm(!showForm); }}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold"
        >
          {showForm && !editingProduct ? 'בטל הוספה' : 'הוסף מוצר חדש'}
        </button>

        {showForm && (
          <ProductForm
            productToEdit={editingProduct}
            onFormSubmit={handleFormSubmit}
            setErrorParent={setError}
          />
        )}

        <h3 className="text-xl font-semibold mt-6">רשימת מוצרים</h3>
        {products.length === 0 && !loading && <p>לא נמצאו מוצרים.</p>}

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">שם</th>
                <th className="p-2 border">קטגוריה</th>
                <th className="p-2 border">מחיר מכירה</th>
                <th className="p-2 border">כמות במלאי</th>
                <th className="p-2 border">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-t hover:bg-gray-50">
                  <td className="p-2 border">{product.name}</td>
                  <td className="p-2 border">{product.category}</td>
                  <td className="p-2 border">₪{parseFloat(product.sale_price).toFixed(2)}</td>
                  <td className="p-2 border">{product.stock_quantity}</td>
                  <td className="p-2 border space-x-2 space-x-reverse">
                    <button
                      onClick={() => handleEdit(product)}
                      className="bg-yellow-400 hover:bg-yellow-500 text-black px-3 py-1 rounded"
                    >
                      ערוך
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                    >
                      מחק
                    </button>
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
