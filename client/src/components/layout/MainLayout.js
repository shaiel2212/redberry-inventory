import React from 'react';
import Navbar from './Navbar';
import { Toaster } from 'react-hot-toast';

const MainLayout = ({ children }) => {
  return (
    <div>
       <Navbar />
      <main className="p-4">{children}</main>
         <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
    </div>
  );
};

export default MainLayout;
