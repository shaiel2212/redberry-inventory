import React, { useEffect, useState } from 'react';
import deliveryService from '../services/deliveryService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // ודא שזה הנתיב הנכון

const DeliveriesPage = () => {
  const [deliveries, setDeliveries] = useState([]);
  const navigate = useNavigate();
    const { user } = useAuth();


  useEffect(() => {
    if (user?.role !== 'DELIVER') {
      navigate('/'); // או "/403"
    } else {
      fetchDeliveries();
    }
  }, [user, navigate]);

  const fetchDeliveries = async () => {
    const response = await deliveryService.getPendingDeliveries();
    setDeliveries(response.data);
  };

  const markAsDelivered = async (id) => {
    await deliveryService.markAsDelivered(id);
    fetchDeliveries();
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">משלוחים ממתינים</h2>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">לקוח</th>
            <th className="p-2 border">מוצר</th>
            <th className="p-2 border">מידה</th>
            <th className="p-2 border">כמות</th>
            <th className="p-2 border">נמכר ע״י</th>
            <th className="p-2 border">סטטוס</th>
            <th className="p-2 border">פעולה</th>
          </tr>
        </thead>
        <tbody>
          {deliveries.map(delivery => (
            <tr key={delivery.id}>
              <td className="p-2 border">{delivery.customer_name}</td>
              <td className="p-2 border">{delivery.product_name}</td>
              <td className="p-2 border">{delivery.size}</td>
              <td className="p-2 border">{delivery.quantity}</td>
              <td className="p-2 border">{delivery.seller_name}</td>
              <td className="p-2 border">{delivery.status}</td>
              <td className="p-2 border">
                {delivery.status !== 'delivered' && (
                  <button className="bg-green-500 text-white px-2 py-1" onClick={() => markAsDelivered(delivery.id)}>
                    סמן כסופק
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DeliveriesPage;