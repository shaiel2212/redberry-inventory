import axios from 'axios';
import api from './api';


const getAllClients = async () => {
  const res = await api.get('/clients');  // ✅ מוסיף ל-baseURL את /clients
  return res.data;
};

const createClient = async (clientData) => {
  const res = await api.post('/clients', clientData);  // ✅ POST ל-/clients
  return res.data;
};

const getBillingReminders = async () => {
  const res = await api.get('/clients/billing-reminders');
  return res.data;
};

export default {
  getAllClients,
  createClient,
  getBillingReminders,
};