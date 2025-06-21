import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  withCredentials: true,
  timeout: 10000
});
console.log("🔍 env var:", process.env.REACT_APP_API_BASE_URL);

// Interceptor לבקשות: מוסיף טוקן אם קיים
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn("⚠️ No token in localStorage");
    }
    return config;
  },
  (error) => {
    console.error('❌ בקשה נכשלה:', error.message);
    return Promise.reject(error);
  }
);

// Interceptor לתשובות: מדפיס תגובה או שגיאה
api.interceptors.response.use(
  (response) => {
    console.log("✅ Response received from:", response.config.baseURL + response.config.url);
    return response;
  },
  (error) => {
    console.log("❌ Response error from:", error.config?.baseURL + error.config?.url);
    if (error.response) {
      const { status, data } = error.response;
      console.warn(`🚨 שגיאת שרת (${status}):`, data?.message || error.message);
      switch (status) {
        case 400: alert(data.message || 'בקשה שגויה'); break;
        case 401: alert('אינך מחובר. אנא התחבר שוב.'); break;
        case 403: alert('אין לך הרשאה לגשת לפעולה זו.'); break;
        case 500: alert('שגיאת שרת פנימית. נסה שוב מאוחר יותר.'); break;
        default: alert(data.message || 'שגיאה לא ידועה');
      }
    } else {
      console.error('❌ שגיאת רשת:', error.message);
      alert('לא ניתן להתחבר לשרת. בדוק את החיבור לאינטרנט.');
    }
    return Promise.reject(error);
  }
);

export default api;
