import { useEffect } from 'react';
import { COOKIE_TOKEN_NAME, COOKIE_GUID_NAME} from '../utils/api';

const useCookies = () => {
  useEffect(() => {
    const isAuthenticated = document.cookie.includes('isAuthenticated=true');
    if (!isAuthenticated) {
    }
  }, []);
  
  const setCookies = (token: string, guid: string) => {
    document.cookie = "isAuthenticated=true; max-age=31536000"; 
    document.cookie = `${COOKIE_TOKEN_NAME}=${token}; path=/; max-age=31536000`;
    document.cookie = `${COOKIE_GUID_NAME}=${guid}; path=/; max-age=31536000`; 
  };
  
  const getCookies = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return null;
  };

  return { setCookies, getCookies };
};

export default useCookies;
