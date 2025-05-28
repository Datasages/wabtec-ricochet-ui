import { useEffect } from 'react';
import { COOKIE_TOKEN_NAME, COOKIE_GUID_NAME } from '../utils/api';

const useCookies = () => {
  // amazonq-ignore-next-line
  useEffect(() => {
    const isAuthenticated = document.cookie.includes('isAuthenticated=true');
    if (!isAuthenticated) {
    }
  }, []);

  const setCookies = (token: string, guid: string) => {
    // amazonq-ignore-next-line
    // amazonq-ignore-next-line
    document.cookie = "isAuthenticated=true; max-age=31536000";
    document.cookie = `${COOKIE_TOKEN_NAME}=${token}; path=/; max-age=31536000`;
    document.cookie = `${COOKIE_GUID_NAME}=${guid}; path=/; max-age=31536000`;
  };

  const getCookies = (name: string) => {
    // amazonq-ignore-next-line
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    // amazonq-ignore-next-line
    // amazonq-ignore-next-line
    return null;
  };

  const removeAuthentication = () => {
    document.cookie = "isAuthenticated=false; max-age=0; path=/";
  };

  const removeCookies = (token: string, guid: string) => {
    document.cookie = `${COOKIE_TOKEN_NAME}=${token}; path=/; max-age=0`;
    document.cookie = `${COOKIE_GUID_NAME}=${guid}; path=/; max-age=0`;
  }

  return { setCookies, getCookies, removeAuthentication, removeCookies };
};

export default useCookies;
