import useCookies from './useCookies';
import { COOKIE_TOKEN_NAME, COOKIE_GUID_NAME, AUTH_FLAG_NAME } from '../utils/api';

describe('useCookies', () => {
  let writes: string[];
  let originalCookie: PropertyDescriptor | undefined;
  let originalLocation: PropertyDescriptor | undefined;

  const captureWrites = (readback = '') => {
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      get: () => readback,
      set: (value: string) => {
        writes.push(value);
      },
    });
  };

  // jsdom marks window.location unforgeable, so defineProperty alone does not
  // reliably replace it. Deleting first is the pattern that works.
  const setProtocol = (protocol: string) => {
    delete (window as { location?: unknown }).location;
    (window as unknown as { location: { protocol: string } }).location = { protocol };
  };

  beforeEach(() => {
    writes = [];
    originalCookie =
      Object.getOwnPropertyDescriptor(Document.prototype, 'cookie') ||
      Object.getOwnPropertyDescriptor(document, 'cookie');
    originalLocation = Object.getOwnPropertyDescriptor(window, 'location');
    // Pin the protocol rather than relying on the afterEach restore: jsdom does
    // not always expose a restorable window.location descriptor, so a test that
    // set https: would otherwise leak into every test after it.
    setProtocol('http:');
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
    expect(writes.some((w) => w.startsWith(`${AUTH_FLAG_NAME}=true`))).toBe(true);
    expect(writes.some((w) => w.startsWith(`${COOKIE_TOKEN_NAME}=tok-123`))).toBe(true);
    expect(writes.some((w) => w.startsWith(`${COOKIE_GUID_NAME}=guid-456`))).toBe(true);
  });

  test('setCookies marks cookies Secure over https', () => {
    setProtocol('https:');
    const { setCookies } = useCookies();

    setCookies('t', 'g');

    expect(writes).toHaveLength(3);
    writes.forEach((w) => expect(w).toContain('; Secure'));
  });

  test('setCookies percent-encodes values so a separator cannot truncate or inject an attribute', () => {
    const { setCookies } = useCookies();

    setCookies('tok;Domain=.railwaynet.net', 'guid with space');

    const token = writes.find((w) => w.startsWith(`${COOKIE_TOKEN_NAME}=`));
    const guid = writes.find((w) => w.startsWith(`${COOKIE_GUID_NAME}=`));
    expect(token).toBe(
      `${COOKIE_TOKEN_NAME}=tok%3BDomain%3D.railwaynet.net; path=/; max-age=31536000; SameSite=Strict`,
    );
    expect(guid).toBe(
      `${COOKIE_GUID_NAME}=guid%20with%20space; path=/; max-age=31536000; SameSite=Strict`,
    );
    // The injected Domain must survive only as encoded text, never as an attribute.
    expect(token).not.toContain('; Domain=');
  });

  test('removeAuthentication expires all cookies, including the legacy no-path auth flag', () => {
    const { removeAuthentication } = useCookies();

    removeAuthentication();

    writes.forEach((w) => expect(w).toContain('max-age=0'));
    expect(writes.some((w) => w.startsWith(`${COOKIE_TOKEN_NAME}=`) && w.includes('path=/'))).toBe(true);
    expect(writes.some((w) => w.startsWith(`${COOKIE_GUID_NAME}=`) && w.includes('path=/'))).toBe(true);
    expect(writes.some((w) => w.startsWith(`${AUTH_FLAG_NAME}=`) && w.includes('path=/'))).toBe(true);
    expect(writes.some((w) => w.startsWith(`${AUTH_FLAG_NAME}=`) && !w.includes('path='))).toBe(true);
  });

  test('removeAuthentication names the base path explicitly, so it does not depend on the current URL', () => {
    // The legacy flag's default-path is the base path. Relying on the path-less
    // write alone would miss it from a nested route such as /data-selection/,
    // which is where the 401 handler signs out.
    const previous = process.env.REACT_APP_BASE_PATH;
    process.env.REACT_APP_BASE_PATH = '/ricochet-ui';

    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const scopedUseCookies = require('./useCookies').default;
      const { removeAuthentication } = scopedUseCookies();

      removeAuthentication();
    });

    expect(
      writes.some((w) => w.startsWith(`${AUTH_FLAG_NAME}=`) && w.includes('path=/ricochet-ui')),
    ).toBe(true);

    process.env.REACT_APP_BASE_PATH = previous;
  });

  test('getCookies reads a named cookie and returns null when absent', () => {
    captureWrites(`${COOKIE_TOKEN_NAME}=abc123; ${COOKIE_GUID_NAME}=xyz789`);
    const { getCookies } = useCookies();

    expect(getCookies(COOKIE_TOKEN_NAME)).toBe('abc123');
    expect(getCookies(COOKIE_GUID_NAME)).toBe('xyz789');
    expect(getCookies('nonexistent')).toBeNull();
  });

  test('getCookies decodes values and does not match on a name prefix', () => {
    captureWrites(`${COOKIE_TOKEN_NAME}Extra=wrong; ${COOKIE_TOKEN_NAME}=a%3Bb`);
    const { getCookies } = useCookies();

    expect(getCookies(COOKIE_TOKEN_NAME)).toBe('a;b');
  });

  test('getCookies returns the first match when a stale duplicate is still present', () => {
    // A device can hold the same cookie name at two paths while migrating
    // between builds; the browser lists the most specific path first.
    captureWrites(`${AUTH_FLAG_NAME}=true; ${AUTH_FLAG_NAME}=stale`);
    const { getCookies } = useCookies();

    expect(getCookies(AUTH_FLAG_NAME)).toBe('true');
  });

  test('getCookies returns null on an empty cookie jar', () => {
    captureWrites('');
    const { getCookies } = useCookies();

    expect(getCookies(AUTH_FLAG_NAME)).toBeNull();
  });
});
