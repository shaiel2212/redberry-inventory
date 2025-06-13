import React from 'react';
import Header from '../layout/Header';

const MainLayout = ({ children }) => {
  return (
    <div>
      <Header />
      <main className="p-4">{children}</main>
    </div>
  );
};

export default MainLayout;
