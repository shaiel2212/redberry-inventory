import React from 'react';
import Navbar from './Navbar';

const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-800">
      <Navbar />
      <main className="flex-1 p-6">{children}</main>
      <footer className="bg-gray-800 text-gray-300 text-center py-3 text-sm">
        Redberry Admin © {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default MainLayout;
