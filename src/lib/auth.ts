import { redirect } from '@tanstack/react-router';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  exp: number;
  [key: string]: any;
}

const isTokenValid = (token: string): boolean => {
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp > currentTime;
  } catch (error) {
    return false;
  }
};

export const requireAuth = () => {
  const token = localStorage.getItem('token');

  if (!token || !isTokenValid(token)) {
    if (token) {
      localStorage.removeItem('token');
    }

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
    if (isTokenValid(token)) {
      throw redirect({ to: '/app/dashboard' });
    } else {
      localStorage.removeItem('token');
    }
  }
};
