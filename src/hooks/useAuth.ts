import { useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';


export const useAuth = () => {
  const token = localStorage.getItem('token');
  return {
    isAuthenticated: !!token,
    token,
  };
};

export const useRequireAuth = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: '/' });
    }
  }, [isAuthenticated, navigate]);

  return isAuthenticated;
};
