import api from './api';

api.defaults.withCredentials = true;

// תיקון: השתמש בכתובת המלאה עם /api/auth
const API_URL = `${process.env.REACT_APP_API_BASE_URL}/auth`;


console.log("🔧 Base URL:", process.env.REACT_APP_API_BASE_URL);
console.log("🔧 API_URL:", API_URL);

const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
}; 

const login = async (credentials) => {
  console.log("🔁 API_URL (login):", API_URL);
  console.log("🔁 Full login URL:", `${API_URL}/login`);

  try {
    const response = await api.post(
      `${API_URL}/login`,
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
// force build
    const { token, user } = response.data;
// force build
    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setAuthToken(token);
    }

    return response.data;
  } catch (error) {
    console.error('❌ Login failed:', error);
    console.error('❌ Error response:', error.response?.data);
    console.error('❌ Error status:', error.response?.status);
    throw error;
  }
};

const register = async (username, email, password) => {
  console.log("🔁 API_URL (register):", API_URL);
  console.log("🔁 Full register URL:", `${API_URL}/register`);

  try {
    const response = await api.post(
      `${API_URL}/register`,
      {
        username,
        email,
        password,
        role: 'user'
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
};

const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

const getToken = () => {
  return localStorage.getItem('token');
};

// טען טוקן בהתחלה
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