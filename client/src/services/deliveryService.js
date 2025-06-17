import api from './api';

/**
 * שליפת משלוחים ממתינים
 */
const getPendingDeliveries = () => {
  return api.get('/deliveries/pending');
};

/**
 * סימון משלוח כסופק
 */
const markAsDelivered = (id) => {
  return api.patch(`/deliveries/${id}/deliver`);
};

/**
 * העלאת תעודת משלוח (טיוטה או חתומה)
 * @param {number} deliveryId - מזהה משלוח
 * @param {File} file - קובץ להעלאה
 * @param {"unsigned"|"signed"} type - סוג התעודה
 */
const uploadDeliveryProof = (deliveryId, file, type = 'unsigned') => {
  const formData = new FormData();
  formData.append('proof', file);

  return api.patch(
    `/deliveries/${deliveryId}/proof?type=${type}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
};

export default {
  getPendingDeliveries,
  markAsDelivered,
  uploadDeliveryProof,
};