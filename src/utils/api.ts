import { responsiveFontSizes } from "@mui/material";

const handleErrors = async (response: Response) => {
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Something went wrong');
    }
    console.log('got response.body=', response.body)
    return ""; //response.body.json();
  };

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
      const data = await response.text();
      console.log ('data text =', data);
      //const parsed = JSON.parse(data)
      // console.log ('parsed =', parsed);
      return data;
      // return await handleErrors(response);
    } catch (error) {
      throw error;
    }
};

export const fetchItems = async (): Promise<string[]> => {
   /* const response = await fetch('/api/items'); 
    const data = await response.json();*/
    const data = { items: ["CDTX", "AMTK"] };
    return data.items; 
  };
  