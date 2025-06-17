import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const showDeliveries = user?.role === 'admin' || user?.role === 'seller' || user?.role === 'user';

  const renderLinks = () => (
    <>
      <li><Link to="/products-view" className="hover:underline">מוצרים</Link></li>

      {isAuthenticated && (
        <>
          {/* 👑 ADMIN */}
          {user?.role === 'admin' && (
            <>
              <li><Link to="/dashboard" className="hover:underline">לוח בקרה</Link></li>
              {showDeliveries && (
                <li><Link to="/deliveries" className="hover:underline">משלוחים</Link></li>
              )}
              <li><Link to="/admin/products" className="hover:underline">ניהול מוצרים</Link></li>
              <li><Link to="/admin/sales" className="hover:underline">ניהול מכירות</Link></li>
              <li><Link to="/admin/users" className="hover:underline">ניהול משתמשים</Link></li>
            </>
          )}

          {/* 👤 USER */}
          {user?.role === 'user' && (
            <>
              <li><Link to="/dashboard" className="hover:underline">לוח בקרה</Link></li>
              {showDeliveries && (
                <li><Link to="/deliveries" className="hover:underline">משלוחים</Link></li>
              )}
              
            </>
          )}

          {/* 🧾 SELLER */}
          {user?.role === 'seller' && (
            <li><Link to="/my-sales" className="hover:underline">היסטוריית מכירות</Link></li>
          )}

          {/* לכל תפקיד */}
          <li><Link to="/make-sale" className="hover:underline">בצע מכירה</Link></li>
          <li className="text-gray-600">
            שלום, {user?.username} ({user?.role})
          </li>
          <li>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
            >
              התנתק
            </button>
          </li>
        </>
      )}

      {!isAuthenticated && (
        <>
          <li><Link to="/login" className="hover:underline">התחברות</Link></li>
          <li><Link to="/register" className="hover:underline">הרשמה</Link></li>
        </>
      )}
    </>
  );

  return (
    <nav className="bg-blue-700 text-black shadow-md">
      <div className="flex justify-between items-center px-6 py-4">
        <Link to={isAuthenticated ? "/dashboard" : "/"} className="text-2xl font-bold text-blue-900">
          Redberry
        </Link>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-2xl focus:outline-none"
        >
          ☰
        </button>

        {/* דסקטופ */}
        <ul className="hidden md:flex gap-4 items-center text-sm">
          {renderLinks()}
        </ul>
      </div>

      {/* מובייל */}
      {isOpen && (
        <ul className="flex flex-col gap-2 px-6 pb-4 text-sm md:hidden">
          {renderLinks()}
        </ul>
      )}
    </nav>
  );
};

export default Navbar;