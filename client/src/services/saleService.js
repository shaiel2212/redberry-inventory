import api from './api';

const API_URL = process.env.REACT_APP_API_BASE_URL + '/sales';

// Auth token is expected to be set globally by authService for these requests
const createSale = async (saleData) => {
  // saleData: { items: [{ productId, quantity, price_per_unit }], customer_name, total_amount }
  const response = await api.post(API_URL, saleData);
  return response.data;
};

const getAllSales = async () => {
  const response = await api.get(API_URL);
  return response.data;
};

const getSaleById = async (id) => {
  const response = await api.get(`${API_URL}/${id}`);
  return response.data;
};
const getMySales = async () => {
  const response = await api.get('/sales/mine');
  return response.data;
};
export const updateSaleDiscount = (saleId, discountData) => {
  
  return api.patch(`/sales/${saleId}/discount`, discountData);
};
export const getSalesReport = async (filters = {}) => {
  const token = localStorage.getItem('token'); // או איך שאתה שומר אותו
  const params = new URLSearchParams(filters).toString();

  const response = await api.get(`/sales/report?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};
export const updateSaleDetails = (saleId, updateData) => {
  return api.patch(`/sales/${saleId}/details`, updateData);
};

const getRecentSales = async () => { 
  const response = await api.get('/sales/recent');
  console.log(response.data);
  return response.data;
};

const saleService = {
  createSale,
  getAllSales,
  getMySales,
  getSaleById,
  updateSaleDiscount,
  getSalesReport,
  updateSaleDetails,
  getRecentSales,
};

export default saleService;