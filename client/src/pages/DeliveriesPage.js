import React, { useEffect, useState } from 'react';
import deliveryService from '../services/deliveryService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Dialog, DialogTrigger, DialogContent } from '../components/ui/dialog';
import { Loader2, CheckCircle2, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

const DeliveriesPage = () => {

  const [deliveries, setDeliveries] = useState([]);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [loadingId, setLoadingId] = useState(null);
  const [deliveredId, setDeliveredId] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'user') {
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
      setErrorMessage('אירעה שגיאה בסימון ההזמנה. אנא נסה שוב.');
      setLoadingId(null);
    }
  };

  const handleUploadProof = async (deliveryId, file, type) => {
    const formData = new FormData();
    formData.append('proof', file);

    try {
      await deliveryService.uploadDeliveryProof(deliveryId, formData, type);
      fetchDeliveries();
    } catch (err) {
      console.error('שגיאה בהעלאת תעודה:', err);
      setErrorMessage('שגיאה בהעלאת הקובץ.');
    }
  };

  const buildWazeLink = (address) => {
    const encoded = encodeURIComponent(address);
    return `https://waze.com/ul?q=${encoded}&navigate=yes`;
  };

  return (
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
              <th className="p-2 border">תעודה</th>
              <th className="p-2 border">תעודה חתומה</th>
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
                      className="text-blue-600 underline"
                    >
                      <MapPin className="inline w-4 h-4 ml-1" />
                      {delivery.address}
                    </a>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="p-2 border hidden sm:table-cell">{delivery.product_name}</td>
                <td className="p-2 border hidden sm:table-cell">{delivery.size}</td>
                <td className="p-2 border hidden sm:table-cell">{delivery.quantity}</td>
                <td className="p-2 border hidden md:table-cell">{delivery.seller_name}</td>
                <td className="p-2 border text-center">
                  {delivery.delivery_proof_url ? (
                    <a href={delivery.delivery_proof_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">צפייה</a>
                  ) : ('-')}
                </td>
                <td className="p-2 border text-center">
                  {delivery.delivery_proof_signed_url ? (
                    <a href={delivery.delivery_proof_signed_url} target="_blank" rel="noopener noreferrer" className="text-green-600 underline">צפייה</a>
                  ) : ('-')}
                </td>
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
                    <Dialog>
                      <DialogTrigger asChild>
                        <button
                          className="bg-blue-600 text-white px-2 py-1 w-full text-sm"
                          onClick={() => {
                            setSelectedDelivery(delivery);
                            setErrorMessage('');
                          }}
                        >
                          פרטים
                        </button>
                      </DialogTrigger>
                      <DialogContent className="text-right">
                        <h2 className="text-lg font-bold mb-2">אישור סיום אספקה</h2>
                        {errorMessage && (
                          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
                            {errorMessage}
                          </div>
                        )}
                        <p className="mb-4">
                          הזמנה <strong>#{selectedDelivery?.sale_id}</strong> ללקוח <strong>{selectedDelivery?.customer_name}</strong>
                        </p>
                        {(user?.role === 'admin' || user?.role === 'user') && (
                          <>
                            <div className="mb-3">
                              <label className="block text-sm font-medium mb-1 text-blue-700">העלאת תעודה (טיוטה):</label>
                              <input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (file) handleUploadProof(selectedDelivery.id, file, 'unsigned');
                                }}
                                className="block w-full text-sm text-gray-700"
                              />
                              {selectedDelivery?.delivery_proof_url && (
                                <div className="mt-1 text-sm text-blue-600">
                                  <a href={selectedDelivery.delivery_proof_url} target="_blank" rel="noopener noreferrer" className="underline">צפייה בתעודה</a>
                                </div>
                              )}
                            </div>
                            <div className="mb-3">
                              <label className="block text-sm font-medium mb-1 text-green-700">העלאת תעודה חתומה:</label>
                              <input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (file) handleUploadProof(selectedDelivery.id, file, 'signed');
                                }}
                                className="block w-full text-sm text-gray-700"
                              />
                              {selectedDelivery?.delivery_proof_signed_url && (
                                <div className="mt-1 text-sm text-green-600">
                                  <a href={selectedDelivery.delivery_proof_signed_url} target="_blank" rel="noopener noreferrer" className="underline">צפייה בתעודה חתומה</a>
                                </div>
                              )}
                            </div>
                          </>
                        )}

                        {!selectedDelivery?.delivery_proof_signed_url && (
                          <p className="text-red-600 text-sm mb-2">לא ניתן לאשר אספקה – יש להעלות תעודה חתומה!</p>
                        )}
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setDialogOpen(false);
                              setSelectedDelivery(null);
                            }}
                            className="px-3 py-1 border rounded text-gray-600 hover:bg-gray-100"
                          >
                            ביטול
                          </button>
                          <button
                            disabled={!selectedDelivery?.delivery_proof_signed_url}
                            onClick={() => markAsDelivered(selectedDelivery.id)}
                            className={`px-3 py-1 rounded text-white ${!selectedDelivery?.delivery_proof_signed_url ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                          >
                            סימון כסופק
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
    </div>
  );
};

export default DeliveriesPage;