import api from './api';

const getPendingDeliveries = () => {
  return api.get('/deliveries/pending');
};

const markAsDelivered = (id) => {
  return api.patch(`/deliveries/${id}/deliver`);
};

export default {
  getPendingDeliveries,
  markAsDelivered
};