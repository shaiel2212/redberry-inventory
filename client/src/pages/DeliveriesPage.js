import React, { useEffect, useState } from 'react';
import deliveryService from '../services/deliveryService';
import jobsService from '../services/jobsService';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from '../components/ui/dialog';
import { Loader2, CheckCircle2, MapPin, X, UserPlus2, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import MainLayout from '../components/layout/MainLayout';
import { DELIVERY_STATUSES } from '../constants/deliveryStatuses';
import { toast } from 'react-hot-toast';
import DeliveryCard from '../components/deliveryCard/DeliveryCard';
import { AnimatePresence } from 'framer-motion';

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
  const [globalLoading, setGlobalLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const params = new URLSearchParams(location.search);
  const focusId = params.get("focus");
  const statusFromUrl = params.get("status");

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'admin' && user.role !== 'user') {
      navigate('/');
    } else {
      loadDeliveriesForTab(activeTab);
    }
  }, [user, activeTab, navigate]);

  useEffect(() => {
    if (!loading && deliveries.length > 0 && focusId) {
      openDeliveryDetails(focusId);
      const params = new URLSearchParams(location.search);
      params.delete('focus');
      navigate({ search: params.toString() }, { replace: true });
    }
  }, [loading, deliveries, focusId, navigate, location.search]);

  useEffect(() => {
    if (statusFromUrl) {
      setActiveTab(statusFromUrl);
    }
  }, [statusFromUrl]);

  const loadDeliveriesForTab = async (tab) => {
    try {
      setDeliveries([]);
      setLoading(true);

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
    } finally {
      setLoading(false);
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
    setGlobalLoading(true);
    try {
      const res = await deliveryService.uploadDeliveryProof(deliveryId, file, type);
      toast.success(`${type === 'signed' ? 'תעודה חתומה' : 'תעודה'} הועלתה בהצלחה`);
      const newUrl = res.data.fileUrl + '?t=' + Date.now();
      setSelectedDelivery(prev => prev && prev.id === deliveryId
        ? {
            ...prev,
            ...(type === 'signed'
              ? { delivery_proof_signed_url: newUrl }
              : { delivery_proof_url: newUrl }
            )
          }
        : prev
      );
      setDeliveries(prev =>
        prev.map(delivery =>
          delivery.id === deliveryId
            ? {
                ...delivery,
                ...(type === 'signed'
                  ? { delivery_proof_signed_url: newUrl }
                  : { delivery_proof_url: newUrl }
                )
              }
            : delivery
        )
      );
    } catch (err) {
      toast.error('שגיאה בהעלאת הקובץ');
    } finally {
      setGlobalLoading(false);
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

  const openDeliveryDetails = async (id) => {
    try {
      const delivery = await deliveryService.getDeliveryById(id);
      console.log('delivery:', delivery);
      setSelectedDelivery(delivery);
      setDialogOpen(true);
      setErrorMessage('');
    } catch (err) {
      console.error('שגיאה בפתיחת פרטי המשלוח:', err);
      setErrorMessage('אירעה שגיאה בפתיחת פרטי המשלוח. אנא נסה שוב מאוחר יותר.');
    }
  };

  const filteredDeliveries = deliveries || [];

  const handleSaleClick = (saleId) => {
    navigate(`/admin/sales?focus=${saleId}`);
  };

  const handleDeliveryClick = (deliveryId, status) => {
    navigate(`/deliveries?focus=${deliveryId}&status=${status}`);
  };

  const handleCheckRestockedItems = async () => {
    try {
      setGlobalLoading(true);
      const result = await jobsService.runCheckRestockedItems();
      
      if (result.success) {
        if (result.updatedItems > 0 || result.updatedDeliveries > 0) {
          toast.success(`${result.message} - הנתונים עודכנו בהצלחה!`);
        } else {
          toast.info('בדיקת מלאי הושלמה - לא נמצאו פריטים שחזרו למלאי');
        }
        // רענון הנתונים
        loadDeliveriesForTab(activeTab);
      } else {
        toast.error(result.message || 'שגיאה בבדיקת מלאי');
      }
    } catch (err) {
      console.error('שגיאה בבדיקת מלאי:', err);
      toast.error('שגיאה בבדיקת מלאי');
    } finally {
      setGlobalLoading(false);
    }
  };

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
          {/* כפתור בדיקת מלאי - רק למנהלים */}
          {user?.role === 'admin' && (
            <button 
              onClick={handleCheckRestockedItems}
              disabled={globalLoading}
              className="px-4 py-1 bg-gradient-to-r from-green-500 to-green-600 text-white rounded hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95"
            >
              {globalLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  בודק...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  בדוק מלאי
                </>
              )}
            </button>
          )}
        </div>

        {/* Desktop & Mobile Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDeliveries.map((delivery) => (
            <DeliveryCard
              key={delivery.id}
              delivery={delivery}
              user={user}
              openDetails={openDetails}
            />
          ))}
        </div>
      </div>

      {/* Dialog גלובלי עבור פרטים */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent dir="rtl"  className="text-right max-w-lg w-full p-6 rounded-3xl shadow-2xl bg-gradient-to-br from-blue-50 via-white to-blue-100 border border-blue-200">
          <div className="flex items-center justify-center mb-4 relative">
            {/* כפתור X – בצד שמאל */}
            <button
              onClick={() => setDialogOpen(false)}
              className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-blue-100 transition"
              style={{ direction: 'ltr' }}
              aria-label="סגור"
            >
              <X className="w-7 h-7 text-gray-400 hover:text-blue-600" />
            </button>
            {/* כותרת ממורכזת */}
            <DialogTitle className="text-2xl font-extrabold text-blue-700 flex items-center gap-2 justify-center w-full">
              <CheckCircle2 className="w-7 h-7 text-blue-500 animate-bounce" />
              אישור סיום אספקה
            </DialogTitle>
          </div>

          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 100, opacity: 0 }}
                className="flex items-center gap-2 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg mb-4"
              >
                <X className="w-5 h-5" />
                <span>{errorMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <span className="text-gray-700">
               הזמנה   <strong className="text-blue-700">#{selectedDelivery?.sale_id}</strong>
              <span dir="rtl">
                ללקוח <strong className="text-blue-700"><bdi>{selectedDelivery?.customer_name}</bdi></strong>
              </span>
            </span>
          </motion.div>

          {selectedDelivery?.assigned_by_name && selectedDelivery?.assigned_at && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-gray-500 mb-4"
            >
              הוקצה ע"י <strong>{selectedDelivery.assigned_by_name}</strong>
              בתאריך <strong>{new Date(selectedDelivery.assigned_at).toLocaleString('he-IL')}</strong>
            </motion.p>
          )}

          {(user?.role === 'admin' || user?.role === 'user') && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1 text-blue-700">העלאת תעודה (טיוטה):</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) handleUploadProof(selectedDelivery.id, file, 'unsigned');
                  }}
                  className="block w-full text-sm text-gray-700 border border-blue-200 rounded-lg p-2"
                />
                {selectedDelivery?.delivery_proof_url && (
                  <div className="mt-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-500" />
                    <span className="text-xs text-blue-600">✔ תעודה קיימת</span>
                    <button
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e) => {
                          const file = e.target.files[0];
                          if (file) handleUploadProof(selectedDelivery.id, file, 'unsigned');
                        };
                        input.click();
                      }}
                      className="text-xs text-red-600 underline hover:text-red-800 ml-2"
                    >
                      החלף תעודה
                    </button>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1 text-green-700">העלאת תעודה חתומה:</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) handleUploadProof(selectedDelivery.id, file, 'signed');
                  }}
                  className="block w-full text-sm text-gray-700 border border-green-200 rounded-lg p-2"
                />
                {selectedDelivery?.delivery_proof_signed_url && (
                  <div className="mt-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-xs text-green-600">✔ תעודה חתומה קיימת – יש ללחוץ על \"סימון כסופק\"</span>
                    <button
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e) => {
                          const file = e.target.files[0];
                          if (file) handleUploadProof(selectedDelivery.id, file, 'signed');
                        };
                        input.click();
                      }}
                      className="text-xs text-red-600 underline hover:text-red-800 ml-2"
                    >
                      החלף תעודה חתומה
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {!selectedDelivery?.delivery_proof_signed_url && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-600 text-sm mb-2 flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              לא ניתן לאשר אספקה – יש להעלות תעודה חתומה!
            </motion.p>
          )}

          <div className="flex flex-col md:flex-row justify-end gap-2 mt-6">
            {/* כפתור הקצה לשליח */}
            {(user?.role === 'admin') && selectedDelivery?.status === 'pending' && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                disabled={!selectedDelivery?.delivery_proof_url}
                onClick={async () => {
                  try {
                    await deliveryService.assignToCourier(selectedDelivery.id);
                    loadDeliveriesForTab(activeTab, 1, true);
                    toast.success('המשלוח הוקצה לשליח בהצלחה');
                  } catch (err) {
                    console.error('שגיאה בהקצאה:', err);
                    toast.error('שגיאה בהקצאת משלוח');
                  }
                }}
                className={`w-full flex justify-center items-center gap-1 px-4 py-2 rounded-lg font-bold text-white transition ${!selectedDelivery?.delivery_proof_url ? 'bg-gray-400 cursor-not-allowed' : 'bg-yellow-500 hover:bg-yellow-600'}`}
              >
                <UserPlus2 className="w-5 h-5" />
                הקצה לשליח
              </motion.button>
            )}

            {/* כפתור ביטול */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => {
                setDialogOpen(false);
                setSelectedDelivery(null);
              }}
              className="w-full flex items-center justify-center text-center px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition"
            >
              ביטול
            </motion.button>

            {/* כפתור סימון כסופק */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              disabled={!selectedDelivery?.delivery_proof_signed_url?.length}
              onClick={() => markAsDelivered(selectedDelivery.id)}
              className={`w-full flex items-center justify-center text-center px-4 py-2 rounded-lg font-bold transition
                ${!selectedDelivery?.delivery_proof_signed_url?.length
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'}
              `}
            >
              <CheckCircle2 className="w-5 h-5" />
              סימון כסופק
            </motion.button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default DeliveriesPage;