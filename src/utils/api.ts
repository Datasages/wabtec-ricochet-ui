const API_URL = '/api';

const handleErrors = async (response: Response) => {
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Something went wrong');
    }
    return response.json();
  };

export const registerUser = async (device: string, pin: string) => {
    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ device, pin }),
      });
      return await handleErrors(response);
    } catch (error) {
      //TEST TODO throw error;
      return { token: 'ome new token 123456'}
    }
};

export const fetchItems = async (): Promise<string[]> => {
   /* const response = await fetch('/api/items'); 
    const data = await response.json();*/
    const data = { items: ["CDTX", "AMTK"] };
    return data.items; 
  };
  