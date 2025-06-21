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

export default {
  getPendingDeliveries,
  getAllDeliveries, // ← חדש
  markAsDelivered,
  uploadDeliveryProof,
};
