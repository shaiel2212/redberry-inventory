
// DeliveriesPage.jsx
import React, { useEffect, useState } from 'react';
import deliveryService from '../services/deliveryService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../components/layout/MainLayout';
import { MapPin, Loader2, CheckCircle2 } from 'lucide-react';

const DeliveriesPage = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [loadingId, setLoadingId] = useState(null);
  const [deliveredId, setDeliveredId] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user || (user.role !== 'DELIVER' && user.role !== 'admin')) {
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
      setLoadingId(id);
      await deliveryService.markAsDelivered(id);
      setDeliveredId(id);
      setSelectedDelivery(null);
      setTimeout(() => {
        setDeliveredId(null);
        setLoadingId(null);
        fetchDeliveries();
      }, 1500);
    } catch (err) {
      console.error('Error marking as delivered:', err);
      setLoadingId(null);
    }
  };

  const buildWazeLink = (address) => {
    const encodedAddress = encodeURIComponent(address);
    return `https://waze.com/ul?q=${encodedAddress}&navigate=yes`;
  };

  return (
    <MainLayout>
      <div className="p-4 max-w-full md:max-w-5xl mx-auto">
        <h2 className="text-xl font-bold mb-4 text-center">משלוחים ממתינים</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border">
            <thead>
              <tr className="bg-gray-100 text-right">
                <th className="p-2 border">מס׳ הזמנה</th>
                <th className="p-2 border">לקוח</th>
                <th className="p-2 border">כתובת</th>
                <th className="p-2 border hidden sm:table-cell">מוצר</th>
                <th className="p-2 border hidden sm:table-cell">מידה</th>
                <th className="p-2 border hidden sm:table-cell">כמות</th>
                <th className="p-2 border hidden md:table-cell">נמכר ע״י</th>
                <th className="p-2 border">סטטוס</th>
                <th className="p-2 border">פעולה</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.map((delivery) => (
                <tr key={delivery.id} className="text-right">
                  <td className="p-2 border">#{delivery.sale_id}</td>
                  <td className="p-2 border">{delivery.customer_name}</td>
                  <td className="p-2 border">
                    {delivery.address ? (
                      <a
                        href={buildWazeLink(delivery.address)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline flex items-center gap-1 justify-end"
                      >
                        <MapPin className="w-4 h-4" /> לנווט
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="p-2 border hidden sm:table-cell">{delivery.product_name}</td>
                  <td className="p-2 border hidden sm:table-cell">{delivery.size}</td>
                  <td className="p-2 border hidden sm:table-cell">{delivery.quantity}</td>
                  <td className="p-2 border hidden md:table-cell">{delivery.seller_name}</td>
                  <td className="p-2 border">
                    {deliveredId === delivery.id ? (
                      <span className="flex items-center gap-1 text-green-600 font-semibold">
                        <CheckCircle2 className="w-4 h-4" /> סופק
                      </span>
                    ) : (
                      delivery.status
                    )}
                  </td>
                  <td className="p-2 border">
                    {delivery.status !== 'delivered' && (
                      <>
                        {selectedDelivery?.id === delivery.id ? (
                          <div className="flex flex-col gap-2">
                            <div className="text-sm">
                              אישור אספקה עבור הזמנה #{delivery.sale_id}
                              <div className="text-xs mt-1">לקוח: {delivery.customer_name}</div>
                            </div>
                            <div className="flex justify-end gap-2">
                              <button
                                className="px-3 py-1 rounded border bg-gray-100 hover:bg-gray-200"
                                onClick={() => setSelectedDelivery(null)}
                              >
                                ביטול
                              </button>
                              <button
                                className="px-3 py-1 rounded bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => markAsDelivered(delivery.id)}
                                disabled={loadingId === delivery.id}
                              >
                                {loadingId === delivery.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                                ) : (
                                  'אישור'
                                )}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded w-full"
                            onClick={() => setSelectedDelivery(delivery)}
                          >
                            פרטים
                          </button>
                        )}
                      </>
                    )}
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

export default DeliveriesPage;
