export const COOKIE_TOKEN_NAME  = "RicochetToken";
export const COOKIE_GUID_NAME = "RicochetGuid";

export const registerUser = async (device: string, pin: string) => {
    try {
      const URL = process.env.REACT_APP_REGISTER_URL || "";
      if (!URL) {
        console.log('URL for register user was not set');
        throw 'URL for register user was not set';
      }

      const response = await fetch(URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ device, pin }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
        throw ('Failed to register device');
    }
};

export const getMarks = async (): Promise<string[]> => {
  const marksList = process.env.REACT_APP_MARKS || '';
  const items = marksList.split(',')
    .map(item => item.trim())  
    .map(item => item.toUpperCase());  

  return items; 
};

export const getRegistrationStatus = async (token: string, guid: string) => {
  try {
    const URL = process.env.REACT_APP_GET_REGISTER_STATUS_URL || "";
    if (!URL) {
      console.log('URL for getting register status was not set');
      return false;
    }

    const response = await fetch(URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, guid }),
    });
    return response.ok; 
  } catch (error) {
      return false;
  }
};