import { useEffect } from 'react';

const useCookies = () => {
  useEffect(() => {
    const isAuthenticated = document.cookie.includes('isAuthenticated=true');
    if (!isAuthenticated) {
    }
  }, []);
  
  const setAuthCookie = () => {
    document.cookie = "isAuthenticated=true; max-age=31536000"; 
  };
  
  return { setAuthCookie };
};

export default useCookies;
