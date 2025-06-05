import axios from 'axios';

// הגדרת כתובת API עם תמיכה ב-CORS כולל credentials
axios.defaults.withCredentials = true;

const API_URL = process.env.REACT_APP_API_BASE_URL + '/auth';
console.log('🔍 API URL:', process.env.REACT_APP_API_BASE_URL);

const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

const register = async (username, email, password, role) => {
  const response = await axios.post(
    `${API_URL}/register`,
    { username, email, password, role },
    { withCredentials: true } // שליחת עוגיות במידת הצורך
  );

  if (response.data.token) {
    localStorage.setItem('user', JSON.stringify(response.data.user));
    localStorage.setItem('token', response.data.token);
    setAuthToken(response.data.token);
  }

  return response.data;
};

const login = async (credentials) => {
  try {
    const response = await axios.post(
      `${API_URL}/login`,
      credentials,
      { withCredentials: true }
    );

    const token = response.data.token;
    if (token) {
      localStorage.setItem('token', token);
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
  setAuthToken,
};

export default authService;
