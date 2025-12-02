import { redirect } from '@tanstack/react-router';

export const requireAuth = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw redirect({ 
      to: '/',
      search: {
        redirect: location.href,
      },
    });
  }
};

export const redirectIfAuthenticated = () => {
  const token = localStorage.getItem('token');
  if (token) {
    throw redirect({ to: '/app/dashboard' });
  }
};
