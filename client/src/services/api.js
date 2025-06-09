import axios from 'axios';

// יצירת אינסטנס עם baseURL מה־env
const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  withCredentials: true,
  timeout: 10000
});

// Interceptor לפני שליחת הבקשה
api.interceptors.request.use(
  (config) => {
    // ניתן להוסיף טוקן אוטומטי אם שמור ב־localStorage:
    // const token = localStorage.getItem('token');
    // if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => {
    console.error('❌ בקשה נכשלה:', error.message);
    return Promise.reject(error);
  }
);

// Interceptor לתשובה
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      console.warn(`🚨 שגיאת שרת (${status}):`, data?.message || error.message);

      // טיפול בשגיאות נפוצות
      switch (status) {
        case 400:
          alert(data.message || 'בקשה שגויה');
          break;
        case 401:
          alert('אינך מחובר. אנא התחבר שוב.');
          break;
        case 403:
          alert('אין לך הרשאה לגשת לפעולה זו.');
          break;
        case 500:
          alert('שגיאת שרת פנימית. נסה שוב מאוחר יותר.');
          break;
        default:
          alert(data.message || 'שגיאה לא ידועה');
      }
    } else {
      console.error('❌ שגיאת רשת:', error.message);
      alert('לא ניתן להתחבר לשרת. בדוק את החיבור לאינטרנט.');
    }

    return Promise.reject(error);
  }
);

export default api;
