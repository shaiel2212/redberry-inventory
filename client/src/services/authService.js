import axios from 'axios';

const API_URL = `${process.env.REACT_APP_API_URL}/auth`;

const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

const register = async (username, email, password, role) => {
  const response = await axios.post(`${API_URL}/register`, {
    username,
    email,
    password,
    role
  });
  if (response.data.token) {
    localStorage.setItem('user', JSON.stringify(response.data.user));
    localStorage.setItem('token', response.data.token);
    setAuthToken(response.data.token);
  }
  return response.data;
};

const login = async (credentials) => {
  try {
    const response = await axios.post(`${API_URL}/login`, credentials);
     const token = response.data.token;
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      setAuthToken(token);
    }
    return response.data;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    throw error;
  }
};

const logout = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  setAuthToken(null);
};

const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

const getToken = () => {
  return localStorage.getItem('token');
};

// Initialize token if already present
const token = getToken();
if (token) {
    setAuthToken(token);
}


const authService = {
  register,
  login,
  logout,
  getCurrentUser,
  getToken,
  setAuthToken
};

export default authService;