export const COOKIE_TOKEN_NAME = "RicochetToken";
export const COOKIE_GUID_NAME = "RicochetGuid";
export const AUTH_FLAG_NAME = "isAuthenticated";

// The app is served under this sub-path on every railroad's host. Cookie paths
// and the router basename must agree, so both read this one value.
export const BASE_PATH = "/ricochet-ui";

// Each railroad's ALB serves /ricochet-ui and /strolr-api on one host, so the
// API is always this page's own origin. Nothing here names a railroad or an
// environment, which is what lets one image serve all of them (vault decision
// 2026-10-04-ricochet-ui-zero-config-image.md).
const MOBILE_API = "/strolr-api/ricochet/mobile";

export const API = {
  register: `${MOBILE_API}/register`,
  status: `${MOBILE_API}/status`,
  authStatus: `${MOBILE_API}/authstatus`,
  run: `${MOBILE_API}/run`,
  marks: `${MOBILE_API}/marks`,
} as const;

const postJson = (url: string, body: unknown) =>
  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

export const registerUser = async (device: string, pin: string) => {
  try {
    const response = await postJson(API.register, { device, pin });
    const data = await response.json();
    return data;
  } catch (error) {
    throw ('Failed to register device');
  }
};

export class MarksError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = 'MarksError';
  }
}

// The railroad's reporting marks, from strolr-api's railroads.json. The route
// checks the device token, so it needs the same credential /run does; a 401
// means the device is no longer approved.
export const getMarks = async (token: string, guid: string): Promise<string[]> => {
  const response = await postJson(API.marks, { guid, token });
  if (!response.ok) {
    throw new MarksError(response.status, `marks request failed with ${response.status}`);
  }

  const marks: unknown = await response.json();
  if (!Array.isArray(marks) || !marks.every((mark) => typeof mark === 'string')) {
    throw new MarksError(response.status, 'marks response is not a list of strings');
  }
  return marks;
};

export const getRegistrationStatus = async (token: string, guid: string) => {
  try {
    const response = await postJson(API.status, { token, guid });
    return response.ok;
  } catch (error) {
    return false;
  }
};

// The link test: one echo per transport, each reported PASS or FAIL.
export const runCheck = async (token: string, guid: string, mark: string, loco: string) => {
  const response = await postJson(API.run, { token, guid, mark, loco });
  return response.json();
};

export const checkAuth = async (token: string, guid: string) => {
  try {
    const response = await postJson(API.authStatus, { token, guid });
    return response.status;
  } catch (error) {
    return 500;
  }
};
