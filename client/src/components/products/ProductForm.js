import React, { useState, useEffect } from 'react';
import productService from '../../services/productService';

const ProductForm = ({ productToEdit, onFormSubmit, setErrorParent }) => {
  const [product, setProduct] = useState({
    name: '',
    description: '',
    category: '',
    supplier: '',
    cost_price: '',
    sale_price: '',
    stock_quantity: 0,
    image_url: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (productToEdit) {
      setProduct({
        name: productToEdit.name || '',
        description: productToEdit.description || '',
        category: productToEdit.category || '',
        supplier: productToEdit.supplier || '',
        cost_price: productToEdit.cost_price || '',
        sale_price: productToEdit.sale_price || '',
        stock_quantity: productToEdit.stock_quantity || 0,
        image_url: productToEdit.image_url || ''
      });
    } else {
      // Reset form for new product
      setProduct({
        name: '', description: '', category: '', supplier: '',
        cost_price: '', sale_price: '', stock_quantity: 0, image_url: ''
      });
    }
  }, [productToEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (setErrorParent) setErrorParent(''); // איפוס שגיאה בקומפוננטת האב
    setLoading(true);

    // Basic validation
    if (!product.name || !product.sale_price || product.stock_quantity === '') {
        setError('שם, מחיר מכירה וכמות במלאי הם שדות חובה.');
        setLoading(false);
        return;
    }


    try {
      if (productToEdit) {
        await productService.updateProduct(productToEdit.id, product);
      } else {
        await productService.createProduct(product);
      }
      onFormSubmit(); // Trigger refresh or other actions in parent
      // Reset form for new product entry if it wasn't an edit
      if (!productToEdit) {
        setProduct({ name: '', description: '', category: '', supplier: '', cost_price: '', sale_price: '', stock_quantity: 0, image_url: '' });
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || (productToEdit ? 'שגיאה בעדכון המוצר.' : 'שגיאה ביצירת המוצר.');
      setError(errMsg);
      if (setErrorParent) setErrorParent(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ border: '1px solid #ccc', padding: '20px', margin: '20px 0' }}>
      <h3>{productToEdit ? 'עריכת מוצר' : 'הוספת מוצר חדש'}</h3>
      {error && <p className="error-message">{error}</p>}
      <div>
        <label>שם מוצר:</label>
        <input type="text" name="name" value={product.name} onChange={handleChange} required />
      </div>
      <div>
        <label>תיאור:</label>
        <textarea name="description" value={product.description} onChange={handleChange}></textarea>
      </div>
      <div>
        <label>קטגוריה:</label>
        <input type="text" name="category" value={product.category} onChange={handleChange} />
      </div>
       <div>
        <label>ספק:</label>
        <input type="text" name="supplier" value={product.supplier} onChange={handleChange} />
      </div>
      <div>
        <label>מחיר עלות (₪):</label>
        <input type="number" step="0.01" name="cost_price" value={product.cost_price} onChange={handleChange} />
      </div>
      <div>
        <label>מחיר מכירה (₪):</label>
        <input type="number" step="0.01" name="sale_price" value={product.sale_price} onChange={handleChange} required />
      </div>
      <div>
        <label>כמות במלאי:</label>
        <input type="number" name="stock_quantity" value={product.stock_quantity} onChange={handleChange} required min="0" />
      </div>
      <div>
        <label>כתובת URL לתמונה:</label>
        <input type="text" name="image_url" value={product.image_url} onChange={handleChange} />
      </div>
      <button type="submit" disabled={loading}>
        {loading ? 'מעבד...' : (productToEdit ? 'עדכן מוצר' : 'הוסף מוצר')}
      </button>
    </form>
  );
};

export default ProductForm;