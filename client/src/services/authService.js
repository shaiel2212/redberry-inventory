import api from './api';

// כבר יש /api ב-BASE_URL, רק צריך להוסיף /auth
const AUTH_ENDPOINT = '/auth';

const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
}; 

const login = async (credentials) => {
  console.log("🔁 Login endpoint:", `${process.env.REACT_APP_API_BASE_URL}${AUTH_ENDPOINT}/login`);

  try {
    const response = await api.post(
      `${AUTH_ENDPOINT}/login`, // זה יהיה /auth/login, ועם הbase זה יהיה /api/auth/login
      {
        username: credentials.username,
        password: credentials.password
      },
      {
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        withCredentials: true
      }
    );

    const { token, user } = response.data;

    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setAuthToken(token);
    }

    console.log('✅ Login successful');
    return response.data;
  } catch (error) {
    console.error('❌ Login failed:', error);
    console.error('❌ Error response:', error.response?.data);
    console.error('❌ Error status:', error.response?.status);
    throw error;
  }
};

const register = async (username, email, password) => {
  console.log("🔁 Register endpoint:", `${process.env.REACT_APP_API_BASE_URL}${AUTH_ENDPOINT}/register`);

  try {
    const response = await api.post(
      `${AUTH_ENDPOINT}/register`, // זה יהיה /auth/register, ועם הbase זה יהיה /api/auth/register
      {
        username,
        email,
        password,
        role: 'user' // ברירת מחדל
      },
      {
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        withCredentials: true
      }
    );

    const { token, user } = response.data;

    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setAuthToken(token);
    }

    console.log('✅ Registration successful');
    return response.data;
  } catch (error) {
    console.error('❌ Registration failed:', error);
    console.error('❌ Error response:', error.response?.data);
    console.error('❌ Error status:', error.response?.status);
    throw error;
  }
};

const logout = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  setAuthToken(null);
  console.log('✅ Logout successful');
};

const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

const getToken = () => {
  return localStorage.getItem('token');
};

// טען טוכן בהתחלה אם קיים
const token = getToken();
if (token) {
  setAuthToken(token);
  console.log('🔑 Token loaded from storage');
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