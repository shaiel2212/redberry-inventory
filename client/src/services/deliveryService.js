import api from './api';

/**
 * שליפת משלוחים ממתינים
 */
const getPendingDeliveries = () => {
  return api.get('/deliveries/pending');
};

/**
 * שליפת כל המשלוחים
 */
const getAllDeliveries = () => {
  return api.get('/deliveries/all');
};

/**
 * סימון משלוח כסופק
 */
const markAsDelivered = (id) => {
  return api.patch(`/deliveries/${id}/deliver`);
};

/**
 * העלאת תעודת משלוח
 * @param {number} deliveryId - מזהה משלוח
 * @param {File} file - קובץ להעלאה
 */
const uploadDeliveryProof = (deliveryId, file, type = 'unsigned') => {
  const formData = new FormData();
  formData.append('proof', file);
  formData.append('type', type);

  return api.patch(`/deliveries/${deliveryId}/proof`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

const assignToCourier = (id) => {
  return api.patch(`/deliveries/${id}/assign`);
};
export async function getAwaitingStockDeliveries() {
  const res = await api.get('/deliveries/awaiting-stock');
  return res.data;
}


const getDashboardDeliveriesByStatus = async () => {
  const res = await api.get('/deliveries/dashboard-by-status');
  return res.data;
};

const getDeliveryById = async (id) => {
  const res = await api.get(`/deliveries/${id}`);
  return res.data;
};

export default {
  getPendingDeliveries,
  getAllDeliveries, // ← חדש
  markAsDelivered,
  uploadDeliveryProof,
  assignToCourier,
  getAwaitingStockDeliveries,
  getDeliveryById,
  getDashboardDeliveriesByStatus,
};
