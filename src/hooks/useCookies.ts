import { COOKIE_TOKEN_NAME, COOKIE_GUID_NAME, AUTH_FLAG_NAME, BASE_PATH } from '../utils/api';

const ONE_YEAR_SECONDS = 31536000;

const useCookies = () => {

  const setCookies = (token: string, guid: string) => {
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    const attributes = `; path=/; max-age=${ONE_YEAR_SECONDS}; SameSite=Strict${secure}`;
    // Encode: a raw ';' or ',' in a credential would truncate the value, and a
    // value ending in an attribute would let the registration response set one
    // we never intended (e.g. a wider Domain).
    document.cookie = `${AUTH_FLAG_NAME}=true${attributes}`;
    document.cookie = `${COOKIE_TOKEN_NAME}=${encodeURIComponent(token)}${attributes}`;
    document.cookie = `${COOKIE_GUID_NAME}=${encodeURIComponent(guid)}${attributes}`;
  };

  // Returns the first match by name. Duplicates are possible while a device still
  // holds a cookie written by an older build at a different path, and the browser
  // orders the most specific path first.
  const getCookies = (name: string): string | null => {
    const entries = document.cookie ? document.cookie.split('; ') : [];
    for (const entry of entries) {
      const separator = entry.indexOf('=');
      if (separator === -1) continue;
      if (entry.slice(0, separator) === name) {
        const raw = entry.slice(separator + 1);
        try {
          return decodeURIComponent(raw);
        } catch {
          // Builds before the encoding fix stored values raw, so a lone '%' is
          // not a valid escape and decodeURIComponent throws. Returning the raw
          // value keeps a deployed device working instead of throwing out of
          // the caller's useEffect, which would leave the field UI blank.
          return raw;
        }
      }
    }
    return null;
  };

  const removeAuthentication = () => {
    const expire = (name: string, path: string) => {
      document.cookie = `${name}=; path=${path}; max-age=0; SameSite=Strict`;
    };
    expire(AUTH_FLAG_NAME, '/');
    expire(COOKIE_TOKEN_NAME, '/');
    expire(COOKIE_GUID_NAME, '/');
    // Builds before the path=/ fix wrote the auth flag with no path, so its
    // default-path is the base path. A path=/ deletion does not match it, and a
    // path-less deletion only matches when the current URL's directory happens
    // to BE the base path — which it is not on /data-selection/, where the 401
    // handler signs out. Name the path explicitly so the clear is not
    // position-dependent. Do not remove: the stale flag has a one-year TTL and
    // App.tsx treats it as authenticated.
    if (BASE_PATH) {
      expire(AUTH_FLAG_NAME, BASE_PATH);
    }
    document.cookie = `${AUTH_FLAG_NAME}=; max-age=0; SameSite=Strict`;
  };

  return { setCookies, getCookies, removeAuthentication };
};

export default useCookies;
