import DOMPurify from 'dompurify';
import React, { useState, useEffect } from 'react';
import productService from '../services/productService';
import ProductCard from '../components/products/ProductCard'; // קומפוננטה לתצוגת מוצר בודד
import MainLayout from '../components/layout/MainLayout';

const ProductsViewPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
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
    fetchProducts();
  }, []);

  if (loading) return <p>טוען מוצרים...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <MainLayout>
    <div>
      <h2>קטלוג מוצרים</h2>
      {products.length === 0 && !loading && <p>לא נמצאו מוצרים.</p>}
      <div className="product-list">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
    </MainLayout>
  );
};

export default ProductsViewPage;