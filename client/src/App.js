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
import MySalesPage from './pages/MySalesPage'; // ⬅️ ודא שקובץ זה קיים
import ProtectedRoute from './components/utils/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

function App() {
  const { user } = useAuth();

  return (
    <>
      <div className="container">
        <Route element={<ProtectedRoute />}>
          {/* ADMIN – רואה הכל */}
          {user?.role === 'admin' && (
            <>
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
          {user?.role === 'seller' && (
            <>
              <Route path="/make-sale" element={<MakeSalePage />} />
              <Route path="/my-sales" element={<MySalesPage />} />
              <Route path="/dashboard" element={<Navigate to="/make-sale" />} />
              <Route path="/" element={<Navigate to="/make-sale" />} />
            </>
          )}

          {/* USER */}
          {user?.role === 'user' && (
            <>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/deliveries" element={<DeliveriesPage />} />
              <Route path="/make-sale" element={<MakeSalePage />} />
              <Route path="/my-sales" element={<MySalesPage />} />
              <Route path="/" element={<Navigate to="/dashboard" />} />
            </>
          )}

          {/* DELIVER (אם קיים) */}
          {user?.role === 'deliver' && (
            <>
              <Route path="/deliveries" element={<DeliveriesPage />} />
              <Route path="*" element={<Navigate to="/deliveries" />} />
            </>
          )}
        </Route>

        <ToastContainer position="top-right" autoClose={4000} />
      </div>
    </>
  );
}

export default App;