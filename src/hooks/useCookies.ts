import { COOKIE_TOKEN_NAME, COOKIE_GUID_NAME } from '../utils/api';

const AUTH_FLAG_NAME = 'isAuthenticated';
const ONE_YEAR_SECONDS = 31536000;

const useCookies = () => {

  const setCookies = (token: string, guid: string) => {
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    const attributes = `; path=/; max-age=${ONE_YEAR_SECONDS}; SameSite=Strict${secure}`;
    document.cookie = `${AUTH_FLAG_NAME}=true${attributes}`;
    document.cookie = `${COOKIE_TOKEN_NAME}=${token}${attributes}`;
    document.cookie = `${COOKIE_GUID_NAME}=${guid}${attributes}`;
  };

  const getCookies = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return null;
  };

  const removeAuthentication = () => {
    const expire = (name: string) => {
      document.cookie = `${name}=; path=/; max-age=0; SameSite=Strict`;
    };
    expire(AUTH_FLAG_NAME);
    expire(COOKIE_TOKEN_NAME);
    expire(COOKIE_GUID_NAME);
  };

  return { setCookies, getCookies, removeAuthentication };
};

export default useCookies;
