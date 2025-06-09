import axios from 'axios';

axios.defaults.withCredentials = true;
 const API_URL = `${process.env.REACT_APP_API_BASE_URL}/auth`;

const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
}; 


const login = async (credentials) => {
  console.log("🔁 API_URL (login):", API_URL);

  try {
    const response = await axios.post(
      `${API_URL}/login`,
      {
        username: credentials.username,
        password: credentials.password
      },
      {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true
      }
    );

    const { token, user } = response.data;

    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setAuthToken(token);
    }

    return response.data;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    throw error;
  }
};

const register = async (username, email, password) => {
  const API_URL = `${process.env.REACT_APP_API_BASE_URL}/auth`;
  console.log("🔁 API_URL (register):", API_URL);

  try {
    const response = await axios.post(
      `${API_URL}/register`,
      {
        username,
        email,
        password,
        role: 'user' // ברירת מחדל
      },
      {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true
      }
    );

    const { token, user } = response.data;

    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setAuthToken(token);
    }

    return response.data;
  } catch (error) {
    console.error('❌ Registration failed:', error.response?.data || error.message);
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