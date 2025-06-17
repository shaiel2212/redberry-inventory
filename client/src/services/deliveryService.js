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
 * העלאת תעודת משלוח
 * @param {number} deliveryId - מזהה משלוח
 * @param {File} file - קובץ להעלאה
 * @param {"unsigned"|"signed"|undefined} type - סוג התעודה (לא חובה)
 */
const uploadDeliveryProof = (deliveryId, file, type) => {
  const formData = new FormData();
  console.log('Uploading file:', file);
  formData.append('proof', file);
  if (type) {
    formData.append('type', type); // שינוי חשוב: שליחה בגוף ולא ב־query param
  }

  return api.patch(`/deliveries/${deliveryId}/proof`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export default {
  getPendingDeliveries,
  markAsDelivered,
  uploadDeliveryProof,
};
