import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProductsAdminPage from './pages/ProductsAdminPage';
import MakeSalePage from './pages/MakeSalePage';
import SalesAdminPage from './pages/SalesAdminPage';
import ProductsViewPage from './pages/ProductsViewPage'; // דף תצוגת מוצרים כללי
import ProtectedRoute from './components/utils/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import UsersAdminPage from './pages/UsersAdminPage';
import MainLayout from './components/layout/MainLayout';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
function App() {
  const { user } = useAuth(); // קבלת המשתמש מהקונטקסט

  return (
    <>
   
   
      <div className="container">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/products-view" element={<ProductsViewPage />} /> {/* דף כללי לצפייה במוצרים */}
          <Route path="/admin/users" element={<UsersAdminPage />} />


          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/admin/products" element={<ProductsAdminPage />} />
            <Route path="/make-sale" element={<MakeSalePage />} />
            <Route path="/admin/sales" element={<SalesAdminPage />} />
            {/* Route for home, redirect to dashboard if logged in, else to login */}
            <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
          </Route>

          {/* Fallback for non-existing routes */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
     
    </>
  );
}

export default App;