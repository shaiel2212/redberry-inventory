import React, { useState } from 'react';

const SaleForm = ({ onSubmit, isSubmitting }) => {
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ customerName, paymentMethod });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow p-4 rounded">
      <h2 className="text-lg font-semibold mb-4">הזן פרטי מכירה</h2>

      <input
        type="text"
        placeholder="שם לקוח (אופציונלי)"
        value={customerName}
        onChange={(e) => setCustomerName(e.target.value)}
        className="input input-bordered w-full mb-3"
      />

      <select
        value={paymentMethod}
        onChange={(e) => setPaymentMethod(e.target.value)}
        className="select select-bordered w-full mb-3"
      >
        <option value="cash">מזומן</option>
        <option value="card">אשראי</option>
      </select>

      <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full">
        {isSubmitting ? 'שולח...' : 'בצע מכירה'}
      </button>
    </form>
  );
};

export default SaleForm;
