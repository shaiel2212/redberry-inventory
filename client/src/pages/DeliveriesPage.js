// DeliveriesPage.jsx
import React, { useEffect, useState } from 'react';
import deliveryService from '../services/deliveryService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Dialog, DialogContent, DialogTrigger } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Loader2, CheckCircle2, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

const DeliveriesPage = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [loadingId, setLoadingId] = useState(null);
  const [deliveredId, setDeliveredId] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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
    const encoded = encodeURIComponent(address);
    return `https://waze.com/ul?ll=${encoded}&navigate=yes`;
  };

  return (
    <div className="p-4 max-w-full md:max-w-4xl mx-auto">
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
                  {delivery.address && (
                    <a
                      href={buildWazeLink(delivery.address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline flex items-center gap-1 justify-end"
                    >
                      <MapPin className="w-4 h-4" /> לנווט
                    </a>
                  )}
                </td>
                <td className="p-2 border hidden sm:table-cell">{delivery.product_name}</td>
                <td className="p-2 border hidden sm:table-cell">{delivery.size}</td>
                <td className="p-2 border hidden sm:table-cell">{delivery.quantity}</td>
                <td className="p-2 border hidden md:table-cell">{delivery.seller_name}</td>
                <td className="p-2 border">
                  {deliveredId === delivery.id ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.4 }}
                      className="flex items-center text-green-600 gap-1"
                    >
                      <CheckCircle2 className="w-4 h-4" /> סופק
                    </motion.div>
                  ) : (
                    delivery.status
                  )}
                </td>
                <td className="p-2 border">
                  {delivery.status !== 'delivered' && (
                    <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
                      <DialogTrigger asChild>
                        <Button
                          className="bg-blue-600 text-white px-2 py-1 w-full text-sm"
                          onClick={() => {
                            setSelectedDelivery(delivery);
                            setDialogOpen(true);
                          }}
                          disabled={loadingId === delivery.id}
                        >
                          {loadingId === delivery.id ? (
                            <Loader2 className="animate-spin w-4 h-4 mx-auto" />
                          ) : (
                            'פרטים'
                          )}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <h2 className="text-lg font-bold">אישור סיום אספקה</h2>
                        <p className="mb-4">
                          האם אתה בטוח שברצונך לסמן את ההזמנה <strong>#{selectedDelivery?.sale_id}</strong> ללקוח <strong>{selectedDelivery?.customer_name}</strong> כסופקה?
                        </p>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            ביטול
                          </Button>
                          <Button
                            onClick={() => {
                              markAsDelivered(selectedDelivery.id);
                              setDialogOpen(false);
                            }}
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
    </div>
  );
};

export default DeliveriesPage;