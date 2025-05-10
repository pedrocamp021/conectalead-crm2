import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppStore } from '../lib/store';
import { LoginForm } from '../components/auth/LoginForm';

export const Login: React.FC = () => {
  const { user, isLoading, fetchUserData } = useAppStore();

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // If loading, show nothing yet
  if (isLoading) {
    return null;
  }

  // If user is already logged in, redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <LoginForm />
      </div>
    </div>
  );
};