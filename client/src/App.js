import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProductsAdminPage from './pages/ProductsAdminPage';
import MakeSalePage from './pages/MakeSalePage';
import SalesAdminPage from './pages/SalesAdminPage';
import ProductsViewPage from './pages/ProductsViewPage';
import UsersAdminPage from './pages/UsersAdminPage';
import DeliveriesPage from './pages/DeliveriesPage';
import MySalesPage from './pages/MySalesPage';
import ProtectedRoute from './components/utils/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import SalesReportPage from './pages/ReportPage';

function App() {
  const { user } = useAuth();

  // טיפול בטעינה התחלתית
  if (user === undefined) {
    return <div className="p-4 text-center">⏳ טוען נתוני משתמש...</div>;
  }

  const isSeller = user?.role === 'seller';
  const isUser = user?.role === 'user';
  const isAdmin = user?.role === 'admin';
  const isDeliver = user?.role === 'deliver';

  return (
    <>
      <div className="container">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/products-view" element={<ProductsViewPage />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            {/* ADMIN */}
            {isAdmin && (
              <>
                <Route path="/reports/sales" element={<SalesReportPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/deliveries" element={<DeliveriesPage />} />
                <Route path="/make-sale" element={<MakeSalePage />} />
                <Route path="/my-sales" element={<MySalesPage />} />
                <Route path="/admin/products" element={<ProductsAdminPage />} />
                <Route path="/admin/sales" element={<SalesAdminPage />} />
                <Route path="/admin/users" element={<UsersAdminPage />} />
                <Route path="/" element={<Navigate to="/dashboard" />} />
              </>
            )}

            {/* SELLER */}
            {isSeller && (
              <>
                <Route path="/make-sale" element={<MakeSalePage />} />
                <Route path="/my-sales" element={<MySalesPage />} />
                <Route path="/dashboard" element={<Navigate to="/make-sale" />} />
                <Route path="/" element={<Navigate to="/make-sale" />} />
              </>
            )}

            {/* USER */}
            {isUser && (
              <>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/deliveries" element={<DeliveriesPage />} />
                <Route path="/make-sale" element={<MakeSalePage />} />
                <Route path="/my-sales" element={<MySalesPage />} />
                <Route path="/" element={<Navigate to="/dashboard" />} />
              </>
            )}

            {/* DELIVER */}
            {isDeliver && (
              <>
                <Route path="/deliveries" element={<DeliveriesPage />} />
                <Route path="/" element={<Navigate to="/deliveries" />} />
              </>
            )}
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to={user ? "/" : "/login"} />} />
        </Routes>

        <ToastContainer position="top-right" autoClose={4000} />
      </div>
    </>
  );
}

export default App;
