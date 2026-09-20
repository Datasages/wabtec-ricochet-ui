import useCookies from './useCookies';
import { COOKIE_TOKEN_NAME, COOKIE_GUID_NAME } from '../utils/api';

describe('useCookies', () => {
  let writes: string[];
  let originalCookie: PropertyDescriptor | undefined;

  beforeEach(() => {
    writes = [];
    originalCookie =
      Object.getOwnPropertyDescriptor(Document.prototype, 'cookie') ||
      Object.getOwnPropertyDescriptor(document, 'cookie');
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      get: () => '',
      set: (value: string) => {
        writes.push(value);
      },
    });
  });

  afterEach(() => {
    if (originalCookie) {
      Object.defineProperty(document, 'cookie', originalCookie);
    }
  });

  test('setCookies writes auth flag, token and guid with path, max-age and SameSite', () => {
    const { setCookies } = useCookies();

    setCookies('tok-123', 'guid-456');

    expect(writes).toHaveLength(3);
    writes.forEach((w) => {
      expect(w).toContain('path=/');
      expect(w).toContain('max-age=31536000');
      expect(w).toContain('SameSite=Strict');
    });
    expect(writes.some((w) => w.startsWith('isAuthenticated=true'))).toBe(true);
    expect(writes.some((w) => w.startsWith(`${COOKIE_TOKEN_NAME}=tok-123`))).toBe(true);
    expect(writes.some((w) => w.startsWith(`${COOKIE_GUID_NAME}=guid-456`))).toBe(true);
  });

  test('setCookies marks cookies Secure over https', () => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { protocol: 'https:' },
    });
    const { setCookies } = useCookies();

    setCookies('t', 'g');

    writes.forEach((w) => expect(w).toContain('; Secure'));
  });

  test('removeAuthentication expires the auth flag, token and guid with matching path', () => {
    const { removeAuthentication } = useCookies();

    removeAuthentication();

    expect(writes).toHaveLength(3);
    writes.forEach((w) => {
      expect(w).toContain('max-age=0');
      expect(w).toContain('path=/');
    });
    expect(writes.some((w) => w.startsWith('isAuthenticated='))).toBe(true);
    expect(writes.some((w) => w.startsWith(`${COOKIE_TOKEN_NAME}=`))).toBe(true);
    expect(writes.some((w) => w.startsWith(`${COOKIE_GUID_NAME}=`))).toBe(true);
  });
});
