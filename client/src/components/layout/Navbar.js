import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-blue-700 text-white px-6 py-4 shadow-md">
      <div className="flex justify-between items-center">
        <Link to={isAuthenticated ? "/dashboard" : "/"} className="text-2xl font-bold">
        
        </Link>
        <ul className="flex gap-4 items-center text-sm">
          <li><Link to="/products-view" className="hover:underline">מוצרים</Link></li>
          {isAuthenticated ? (
            <>
              <li><Link to="/dashboard" className="hover:underline">לוח בקרה</Link></li>
              {(user?.role === 'admin' || user?.role === 'manager') && (
                <>
                  <li><Link to="/admin/products" className="hover:underline">ניהול מוצרים</Link></li>
                  <li><Link to="/admin/sales" className="hover:underline">ניהול מכירות</Link></li>
                  <li><Link to="/admin/users" className="hover:underline">ניהול משתמשים</Link></li>
                </>
              )}
              <li><Link to="/make-sale" className="hover:underline">בצע מכירה</Link></li>
              <li className="text-gray-300">שלום, {user?.username} ({user?.role})</li>
              <li>
                <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded">
                  התנתק
                </button>
              </li>
            </>
          ) : (
            <>
              <li><Link to="/login" className="hover:underline">התחברות</Link></li>
              <li><Link to="/register" className="hover:underline">הרשמה</Link></li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
