import DOMPurify from 'dompurify';
import React from 'react';
import LoginForm from '../components/auth/LoginForm';
import MainLayout from '../components/layout/MainLayout';

const LoginPage = () => {
  return (
    <MainLayout>
    <div>
      <h2>התחברות למערכת</h2>
      <LoginForm />
    </div>
    </MainLayout>
  );
};

export default LoginPage;