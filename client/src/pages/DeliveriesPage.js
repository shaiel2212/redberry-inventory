import React, { useEffect, useState } from 'react';
import deliveryService from '../services/deliveryService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from '../components/ui/dialog';
import { Loader2, CheckCircle2, MapPin, X } from 'lucide-react';
import { motion } from 'framer-motion';
import MainLayout from '../components/layout/MainLayout';
import { DELIVERY_STATUSES } from '../constants/deliveryStatuses';
import { toast } from 'react-hot-toast';
import DeliveryCard from '../components/deliveryCard/DeliveryCard';

const getStatusLabel = (statusValue) => {
  const found = DELIVERY_STATUSES.find((s) => s.value === statusValue);
  return found ? found.label : statusValue;
};

const DeliveriesPage = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [deliveries, setDeliveries] = useState([]);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [loadingId, setLoadingId] = useState(null);
  const [deliveredId, setDeliveredId] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [updatedId, setUpdatedId] = useState(null);

  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'admin' && user.role !== 'user') {
      navigate('/');
    } else {
      loadDeliveriesForTab(activeTab);
    }
  }, [user, activeTab, navigate]);

  const loadDeliveriesForTab = async (tab) => {
    try {
      setDeliveries([]);

      if (tab === 'pending') {
        const res = await deliveryService.getPendingDeliveries();
        const filtered = res.data.filter(d => !d.is_awaiting_stock);
        setDeliveries(filtered);
        console.log("🔍 response from API:", res.data);
      }

      else if (tab === 'awaiting_stock') {
        const res = await deliveryService.getAwaitingStockDeliveries();
        setDeliveries(res);
        console.log("📦 awaiting_stock items:", res.map((d, i) => ({
          index: i,
          keys: Object.keys(d),
          values: d
        })));
        console.log("🔍 response from API:", res);
      }

      else if (tab === 'all') {
        const res = await deliveryService.getAllDeliveries();
        setDeliveries(res.data);
        console.log("✅ fetched all:", res.data.map(d => d.status));
        console.log("🔍 response from API:", res);
      }

    } catch (err) {
      console.error('❌ שגיאה בטעינת משלוחים:', err);
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
        loadDeliveriesForTab(activeTab);
      }, 1500);
    } catch (err) {
      console.error('שגיאה בסימון כסופק:', err);
      setErrorMessage('אירעה שגיאה בסימון ההזמנה. אנא נסה שוב.');
      setLoadingId(null);
    }
  };

  const handleUploadProof = async (deliveryId, file, type) => {
    try {
      await deliveryService.uploadDeliveryProof(deliveryId, file, type);
      loadDeliveriesForTab(activeTab);
    } catch (err) {
      console.error('שגיאה בהעלאת תעודה:', err);
      setErrorMessage('שגיאה בהעלאת הקובץ.');
    }
  };

  const buildWazeLink = (address) => {
    const encoded = encodeURIComponent(address);
    return `https://waze.com/ul?q=${encoded}&navigate=yes`;
  };

  const openDetails = (delivery) => {
    if (activeTab === 'awaiting_stock') return; // הגנה: אין פתיחה בטאב "ממתינים למלאי"
    setSelectedDelivery(delivery);
    setDialogOpen(true);
    setErrorMessage('');
  };

  const filteredDeliveries = deliveries || [];


  return (
    <MainLayout>
      <div className="p-4 max-w-full md:max-w-5xl mx-auto">
        <h2 className="text-xl font-bold mb-4 text-center">
          {activeTab === 'pending' && 'משלוחים ממתינים'}
          {activeTab === 'awaiting_stock' && 'ממתינים למלאי'}
          {activeTab === 'all' && 'כל המשלוחים'}
        </h2>

        <div className="flex justify-center gap-4 mb-4">
          <button onClick={() => setActiveTab('pending')} className={`px-4 py-1 rounded ${activeTab === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
            ממתינים
          </button>
          <button onClick={() => setActiveTab('awaiting_stock')} className={`px-4 py-1 rounded ${activeTab === 'awaiting_stock' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
            ממתינים למלאי
          </button>
          <button onClick={() => setActiveTab('all')} className={`px-4 py-1 rounded ${activeTab === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
            כל המשלוחים
          </button>
        </div>

        <div className="block md:hidden space-y-4">
          {filteredDeliveries.map(delivery => (
            <DeliveryCard
              key={delivery.delivery_id}
              delivery={delivery}
              user={user}
              openDetails={openDetails} // שימוש בלוגיקה הכוללת הגנה
            />
          ))}
        </div>

        <div className="hidden md:block" >
          <table className="min-w-full text-sm border rounded overflow-hidden shadow">
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
              {Array.isArray(filteredDeliveries) && filteredDeliveries.map((delivery) => (
                <tr key={delivery.delivery_id} className="text-right">
                  <td className="p-2 border">#{delivery.sale_id}</td>
                  <td className="p-2 border">{delivery.customer_name}</td>
                  <td className="p-2 border">
                    {delivery.address ? (
                      <a href={buildWazeLink(delivery.address)} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                        <MapPin className="inline w-4 h-4 ml-1" />{delivery.address}
                      </a>
                    ) : ('-')}
                  </td>
                  <td className="p-2 border hidden sm:table-cell">{delivery.product_name}</td>
                  <td className="p-2 border hidden sm:table-cell">{delivery.size}</td>
                  <td className="p-2 border hidden sm:table-cell">{delivery.quantity}</td>
                  <td className="p-2 border hidden md:table-cell">{delivery.seller_name}</td>
                  <td className="p-2 border text-center">
                    {delivery.delivery_proof_url ? <a href={delivery.delivery_proof_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">צפייה</a> : '-'}
                  </td>
                  <td className="p-2 border text-center">
                    {delivery.delivery_proof_signed_url ? <a href={delivery.delivery_proof_signed_url} target="_blank" rel="noopener noreferrer" className="text-green-600 underline">צפייה</a> : '-'}
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
                    ) : updatedId === delivery.id ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="text-yellow-600 font-medium"
                      >
                        הוקצה לשליח ✔
                      </motion.div>
                    ) : (
                      getStatusLabel(delivery.status)
                    )}
                  </td>
                  <td className="p-2 border">
                    <button
                      disabled={activeTab === 'awaiting_stock'}
                      className={`bg-blue-600 text-white px-2 py-1 w-full text-sm ${activeTab === 'awaiting_stock' ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => openDetails(delivery)}
                    >
                      פרטים
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialog גלובלי עבור פרטים */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="text-right">
          <div className="flex justify-between mb-2">
            <DialogTitle className="text-lg font-bold">אישור סיום אספקה</DialogTitle>
            <button onClick={() => setDialogOpen(false)}><X className="w-5 h-5 text-gray-500" /></button>
          </div>

          {errorMessage && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
              {errorMessage}
            </div>
          )}

          <p className="mb-4">
            הזמנה <strong>#{selectedDelivery?.sale_id}</strong> ללקוח <strong>{selectedDelivery?.customer_name}</strong>
          </p>

          {selectedDelivery?.assigned_by_name && selectedDelivery?.assigned_at && (
            <p className="text-sm text-gray-600 mb-4">
              הוקצה ע״י <strong>{selectedDelivery.assigned_by_name}</strong>
              בתאריך <strong>{new Date(selectedDelivery.assigned_at).toLocaleString('he-IL')}</strong>
            </p>
          )}

          {(user?.role === 'admin' || user?.role === 'user') && (
            <>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1 text-blue-700">העלאת תעודה (טיוטה):</label>
                <input type="file" accept="image/*" onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) handleUploadProof(selectedDelivery.id, file, 'unsigned');
                }} className="block w-full text-sm text-gray-700" />
                {selectedDelivery?.delivery_proof_url && <p className="text-xs text-blue-600">✔ תעודה קיימת</p>}
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium mb-1 text-green-700">העלאת תעודה חתומה:</label>
                <input type="file" accept="image/*" onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) handleUploadProof(selectedDelivery.id, file, 'signed');
                }} className="block w-full text-sm text-gray-700" />
                {selectedDelivery?.delivery_proof_signed_url && <p className="text-xs text-green-600">✔ תעודה חתומה קיימת – יש ללחוץ על "סימון כסופק"</p>}
              </div>
            </>
          )}

          {!selectedDelivery?.delivery_proof_signed_url && (
            <p className="text-red-600 text-sm mb-2">לא ניתן לאשר אספקה – יש להעלות תעודה חתומה!</p>
          )}

          <div className="flex justify-end gap-2">
            <button onClick={() => {
              setDialogOpen(false);
              setSelectedDelivery(null);
            }} className="px-3 py-1 border rounded text-gray-600 hover:bg-gray-100">ביטול</button>

            <button
              disabled={!selectedDelivery?.delivery_proof_signed_url}
              onClick={() => markAsDelivered(selectedDelivery.id)}
              className={`px-3 py-1 rounded text-white ${!selectedDelivery?.delivery_proof_signed_url ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
            >
              סימון כסופק
            </button>

            {(user?.role === 'admin') && selectedDelivery?.status === 'pending' && (
              <div className="flex flex-col items-end">
                <button
                  disabled={!selectedDelivery?.delivery_proof_url}
                  onClick={async () => {
                    try {
                      await deliveryService.assignToCourier(selectedDelivery.id);
                      loadDeliveriesForTab(activeTab);
                      toast.success('המשלוח הוקצה לשליח בהצלחה');
                    } catch (err) {
                      console.error('שגיאה בהקצאה:', err);
                      toast.error('שגיאה בהקצאת משלוח');
                    }
                  }}
                  className={`px-3 py-1 rounded text-white ${!selectedDelivery?.delivery_proof_url ? 'bg-gray-400 cursor-not-allowed' : 'bg-yellow-500 hover:bg-yellow-600'}`}
                >
                  הקצה לשליח
                </button>

                {!selectedDelivery?.delivery_proof_url && (
                  <p className="text-xs text-red-500 mt-1">
                    יש להעלות תעודת טיוטה לפני הקצאה לשליח.
                  </p>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default DeliveriesPage;