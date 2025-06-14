// DeliveriesPage.js
import React, { useEffect, useState } from 'react';
import deliveryService from '../services/deliveryService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Dialog, DialogContent, DialogTrigger } from '../components/ui/dialog';
import { Loader2, CheckCircle2, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
      console.error('שגיאה בטעינת משלוחים:', err);
    }
  };

  const markAsDelivered = async (id) => {
    try {
      setLoadingId(id);
      await deliveryService.markAsDelivered(id);

      toast.success('✅ ההזמנה סומנה כסופקה בהצלחה!');

      setDeliveredId(id);
      setDialogOpen(false);
      setSelectedDelivery(null);

      setTimeout(() => {
        setDeliveredId(null);
        setLoadingId(null);
        fetchDeliveries();
      }, 1500);
    } catch (err) {
      console.error('שגיאה בסימון כסופק:', err);
      setLoadingId(null);
    }
  };

  const buildWazeLink = (address) => {
    const encoded = encodeURIComponent(address);
    return `https://waze.com/ul?q=${encoded}&navigate=yes`;
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
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                      <DialogTrigger asChild>
                        <button
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded w-full"
                          onClick={() => {
                            setSelectedDelivery(delivery);
                            setDialogOpen(true);
                          }}
                        >
                          {loadingId === delivery.id ? (
                            <Loader2 className="animate-spin w-4 h-4 mx-auto" />
                          ) : (
                            'פרטים'
                          )}
                        </button>
                      </DialogTrigger>
                      <DialogContent className="text-right max-w-md mx-auto shadow-xl rounded-xl animate-fade-in bg-white">
                        <h2 className="text-lg font-bold mb-2">אישור אספקה</h2>
                        <p>
                          האם אתה בטוח שברצונך לסמן את ההזמנה
                          <strong> #{selectedDelivery?.sale_id}</strong> ללקוח
                          <strong> {selectedDelivery?.customer_name}</strong> כסופקה?
                        </p>
                        <div className="flex justify-end gap-2 mt-4">
                          <button
                            className="px-4 py-1 rounded border border-gray-300"
                            onClick={() => {
                              setDialogOpen(false);
                              setSelectedDelivery(null);
                            }}
                          >
                            ביטול
                          </button>
                          <button
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded"
                            onClick={() => markAsDelivered(selectedDelivery.id)}
                          >
                            אישור
                          </button>
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

      <ToastContainer position="top-center" autoClose={2000} />
    </div>
  );
};

export default DeliveriesPage;
