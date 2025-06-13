import React from 'react';
import Header from '../layout/Header';
import Navbar from './Navbar';

const MainLayout = ({ children }) => {
  return (
    <div>
      <Header />
       <Navbar />
      <main className="p-4">{children}</main>
    </div>
  );
};

export default MainLayout;
