import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-gray-800 text-white p-4 flex justify-between items-center">
      <h1 className="text-lg font-bold">Redberry App</h1>
      <nav className="flex gap-4 items-center text-sm">
        {user?.role === 'ADMIN' && (
          <>
            <Link to="/admin">ניהול</Link>
            <Link to="/deliveries">משלוחים</Link>
          </>
        )}
        {user?.role === 'DELIVER' && (
          <Link to="/deliveries">משלוחים</Link>
        )}
        {user && (
          <button
            onClick={logout}
            className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded"
          >
            התנתק
          </button>
        )}
      </nav>
    </header>
  );
};

export default Header;
