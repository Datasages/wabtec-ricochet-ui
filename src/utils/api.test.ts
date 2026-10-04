import { API, BASE_PATH, MarksError, checkAuth, getMarks, getRegistrationStatus, registerUser } from './api';

// The app and strolr-api share one host behind each railroad's ALB, so every
// URL is a fixed same-origin path. These are the literal paths strolr-api
// serves; a test that built them from the constants would prove nothing.
describe('API paths', () => {
  test('are fixed same-origin paths under /strolr-api', () => {
    expect(API).toEqual({
      register: '/strolr-api/ricochet/mobile/register',
      status: '/strolr-api/ricochet/mobile/status',
      authStatus: '/strolr-api/ricochet/mobile/authstatus',
      run: '/strolr-api/ricochet/mobile/run',
      marks: '/strolr-api/ricochet/mobile/marks',
    });
  });

  test('the app is served under /ricochet-ui', () => {
    expect(BASE_PATH).toBe('/ricochet-ui');
  });
});

describe('calls', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const respond = (status: number, body: unknown) =>
    fetchMock.mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    });

  const sentTo = () => fetchMock.mock.calls[0][0];
  const sentBody = () => JSON.parse(fetchMock.mock.calls[0][1].body);

  test('registerUser posts the device and PIN to register', async () => {
    respond(200, { guid: 'g', token: 't' });

    await expect(registerUser('tablet-7', '123456')).resolves.toEqual({ guid: 'g', token: 't' });
    expect(sentTo()).toBe('/strolr-api/ricochet/mobile/register');
    expect(sentBody()).toEqual({ device: 'tablet-7', pin: '123456' });
  });

  test('getRegistrationStatus posts to status', async () => {
    respond(200, 'OK');

    await expect(getRegistrationStatus('t', 'g')).resolves.toBe(true);
    expect(sentTo()).toBe('/strolr-api/ricochet/mobile/status');
  });

  test('checkAuth posts to authstatus and returns the status code', async () => {
    respond(401, null);

    await expect(checkAuth('t', 'g')).resolves.toBe(401);
    expect(sentTo()).toBe('/strolr-api/ricochet/mobile/authstatus');
  });

  describe('getMarks', () => {
    test('posts the device credential and returns the railroad marks', async () => {
      respond(200, ['AMTK', 'CDTX', 'WDTX', 'IDTX', 'RNCX']);

      await expect(getMarks('tok', 'guid-1')).resolves.toEqual(['AMTK', 'CDTX', 'WDTX', 'IDTX', 'RNCX']);
      expect(sentTo()).toBe('/strolr-api/ricochet/mobile/marks');
      expect(fetchMock.mock.calls[0][1].method).toBe('POST');
      expect(sentBody()).toEqual({ guid: 'guid-1', token: 'tok' });
    });

    // strolr-api answers 401 when verify() fails: an unknown, revoked or
    // unapproved device. The caller signs the device out on this status.
    test('rejects with the status when the device is refused', async () => {
      respond(401, null);

      const error = await getMarks('bad', 'guid-1').catch((e) => e);
      expect(error).toBeInstanceOf(MarksError);
      expect(error.status).toBe(401);
    });

    test('rejects on a server error', async () => {
      respond(500, null);

      await expect(getMarks('tok', 'guid-1')).rejects.toMatchObject({ status: 500 });
    });

    // The response crosses a boundary: anything but an array of strings is
    // refused rather than rendered as menu items.
    test.each([
      ['an object', { marks: ['AMTK'] }],
      ['a list with a non-string', ['AMTK', 7]],
      ['null', null],
    ])('rejects %s', async (_label, body) => {
      respond(200, body);

      await expect(getMarks('tok', 'guid-1')).rejects.toBeInstanceOf(MarksError);
    });
  });
});
