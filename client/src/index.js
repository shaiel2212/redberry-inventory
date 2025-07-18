import React from 'react';
import ReactDOM from 'react-dom/client';
import './App.css'; // אפשר לשנות או להוסיף קובץ CSS גלובלי אחר
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
console.log('✔️ Loaded ENV:', process.env.REACT_APP_API_BASE_URL);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);