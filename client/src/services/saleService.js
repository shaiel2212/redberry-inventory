import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL + '/api/sales';

// Auth token is expected to be set globally by authService for these requests
const createSale = async (saleData) => {
  // saleData: { items: [{ productId, quantity, price_per_unit }], customer_name, total_amount }
  const response = await axios.post(API_URL, saleData);
  return response.data;
};

const getAllSales = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

const getSaleById = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`);
  return response.data;
};

const saleService = {
  createSale,
  getAllSales,
  getSaleById,
};

export default saleService;