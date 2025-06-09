import axios from 'axios';

const API_URL = process.env.REACT_APP_API_BASE_URL + '/users';

const getAllUsers = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

const updateUserRole = async (id, role) => {
  const response = await axios.put(`${API_URL}/${id}/role`, { role });
  return response.data;
};

const deleteUser = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
};

export default {
  getAllUsers,
  updateUserRole,
  deleteUser
};
