import React from 'react';

const SalesList = ({ sales }) => {
  return (
    <div className="overflow-x-auto">
      <table className="table table-zebra w-full">
        <thead>
          <tr>
            <th>תאריך</th>
            <th>לקוח</th>
            <th>אמצעי תשלום</th>
            <th>סכום</th>
          </tr>
        </thead>
        <tbody>
          {sales.map((sale) => (
            <tr key={sale.id}>
              <td>{new Date(sale.sale_date).toLocaleDateString()}</td>
              <td>{sale.customer_name || '—'}</td>
              <td>{sale.total_amount} ₪</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SalesList;
