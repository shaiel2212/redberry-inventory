// DeliveriesPage.js
import React, { useEffect, useState } from 'react';
import deliveryService from '../services/deliveryService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const DeliveriesPage = () => {
  const [deliveries, setDeliveries] = useState([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role !== 'DELIVER') {
      navigate('/');
    } else {
      fetchDeliveries();
    }
  }, [user, navigate]);

  const fetchDeliveries = async () => {
    try {
      const response = await deliveryService.getPendingDeliveries();
      setDeliveries(response.data);
    } catch (err) {
      console.error('Error fetching deliveries:', err);
    }
  };

  const markAsDelivered = async (id) => {
    try {
      await deliveryService.markAsDelivered(id);
      fetchDeliveries();
    } catch (err) {
      console.error('Error marking as delivered:', err);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">משלוחים ממתינים</h2>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">מס׳ הזמנה</th>
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
          {deliveries.map((delivery) => (
            <tr key={delivery.id}>
              <td className="p-2 border">#{delivery.sale_id}</td>
              <td className="p-2 border">{delivery.customer_name}</td>
              <td className="p-2 border">{delivery.product_name}</td>
              <td className="p-2 border">{delivery.size}</td>
              <td className="p-2 border">{delivery.quantity}</td>
              <td className="p-2 border">{delivery.seller_name}</td>
              <td className="p-2 border">{delivery.status}</td>
              <td className="p-2 border">
                {delivery.status !== 'delivered' && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="bg-green-500 text-white px-2 py-1 w-full">
                        סמן כסופק
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="text-right">
                      <h2 className="text-lg font-bold">אישור סיום אספקה</h2>
                      <p className="mb-4">
                        האם אתה בטוח שברצונך לסמן את ההזמנה <strong>#{delivery.sale_id}</strong> ללקוח <strong>{delivery.customer_name}</strong> כסופקה?
                      </p>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline">ביטול</Button>
                        <Button
                          onClick={() => markAsDelivered(delivery.id)}
                          className="bg-green-600 text-white"
                        >
                          אישור
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
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
