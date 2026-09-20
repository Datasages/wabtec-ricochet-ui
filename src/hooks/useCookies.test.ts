import useCookies from './useCookies';
import { COOKIE_TOKEN_NAME, COOKIE_GUID_NAME } from '../utils/api';

describe('useCookies', () => {
  let writes: string[];
  let originalCookie: PropertyDescriptor | undefined;
  let originalLocation: PropertyDescriptor | undefined;

  const captureWrites = () => {
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      get: () => '',
      set: (value: string) => {
        writes.push(value);
      },
    });
  };

  beforeEach(() => {
    writes = [];
    originalCookie =
      Object.getOwnPropertyDescriptor(Document.prototype, 'cookie') ||
      Object.getOwnPropertyDescriptor(document, 'cookie');
    originalLocation = Object.getOwnPropertyDescriptor(window, 'location');
    captureWrites();
  });

  afterEach(() => {
    if (originalCookie) {
      Object.defineProperty(document, 'cookie', originalCookie);
    }
    if (originalLocation) {
      Object.defineProperty(window, 'location', originalLocation);
    }
  });

  test('setCookies writes auth flag, token and guid with path, max-age, SameSite and no Secure over http', () => {
    const { setCookies } = useCookies();

    setCookies('tok-123', 'guid-456');

    expect(writes).toHaveLength(3);
    writes.forEach((w) => {
      expect(w).toContain('path=/');
      expect(w).toContain('max-age=31536000');
      expect(w).toContain('SameSite=Strict');
      expect(w).not.toContain('Secure');
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

    expect(writes).toHaveLength(3);
    writes.forEach((w) => expect(w).toContain('; Secure'));
  });

  test('removeAuthentication expires all cookies, including the legacy no-path auth flag', () => {
    const { removeAuthentication } = useCookies();

    removeAuthentication();

    expect(writes).toHaveLength(4);
    writes.forEach((w) => expect(w).toContain('max-age=0'));
    expect(writes.some((w) => w.startsWith(`${COOKIE_TOKEN_NAME}=`) && w.includes('path=/'))).toBe(true);
    expect(writes.some((w) => w.startsWith(`${COOKIE_GUID_NAME}=`) && w.includes('path=/'))).toBe(true);
    expect(writes.some((w) => w.startsWith('isAuthenticated=') && w.includes('path=/'))).toBe(true);
    expect(writes.some((w) => w.startsWith('isAuthenticated=') && !w.includes('path='))).toBe(true);
  });

  test('getCookies reads a named cookie and returns null when absent', () => {
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      get: () => `${COOKIE_TOKEN_NAME}=abc123; ${COOKIE_GUID_NAME}=xyz789`,
      set: () => undefined,
    });
    const { getCookies } = useCookies();

    expect(getCookies(COOKIE_TOKEN_NAME)).toBe('abc123');
    expect(getCookies(COOKIE_GUID_NAME)).toBe('xyz789');
    expect(getCookies('nonexistent')).toBeNull();
  });
});
