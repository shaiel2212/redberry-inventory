import DOMPurify from 'dompurify';
import React from 'react';
import MainLayout from '../components/layout/MainLayout';
import RegisterForm from '../components/auth/RegisterForm';

const RegisterPage = () => {
  return (
    <MainLayout>
      <div className="p-4 sm:p-6 max-w-md mx-auto mt-12 bg-white p-8 rounded shadow">
        <h2 className="p-4 sm:p-6 text-2xl font-bold mb-6 text-center">הרשמה למערכת</h2>
        <RegisterForm />
      </div>
    </MainLayout>
  );
};

export default RegisterPage;