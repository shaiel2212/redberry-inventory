import axios from 'axios';
import config from '../config'

const API_URL = process.env.REACT_APP_API_BASE_URL + '/products';

// No auth header needed for getAll if it's public on backend
const getAllProducts = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

const getProductById = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`);
  return response.data;
};

// For routes that require authentication, axios instance should have the token header
// This is handled globally in authService.setAuthToken
const createProduct = async (productData) => {
  const response = await axios.post(API_URL, productData);
  return response.data;
};

const updateProduct = async (id, productData) => {
  const response = await axios.put(`${API_URL}/${id}`, productData);
  return response.data;
};

const deleteProduct = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
};

const updateStock = async (id, quantity_change) => {
    const response = await axios.post(`${API_URL}/${id}/stock`, { quantity_change });
    return response.data;
}

const productService = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
};

export default productService;