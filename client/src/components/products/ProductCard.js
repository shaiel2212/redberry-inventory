import React from 'react';

const ProductCard = ({ product, onAddToCart }) => { // onAddToCart אם רוצים להוסיף לעגלה ישירות
  return (
    <div className="product-card">
      {product.image_url && <img src={product.image_url} alt={product.name} />}
      <h3>{product.name}</h3>
      <p>{product.description?.substring(0,100)}{product.description?.length > 100 ? '...' : ''}</p>
      <p>קטגוריה: {product.category || 'לא צוין'}</p>
      <p><strong>מחיר: ₪{parseFloat(product.sale_price).toFixed(2)}</strong></p>
      <p>מלאי: {product.stock_quantity > 0 ? product.stock_quantity : <span style={{color: 'red'}}>אזל מהמלאי</span>}</p>
      {onAddToCart && product.stock_quantity > 0 && (
        <button onClick={() => onAddToCart(product)}>הוסף לעגלה</button>
      )}
    </div>
  );
};

export default ProductCard;