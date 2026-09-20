import React, { useState, useEffect } from 'react';
import { checkAuth, getMarks } from '../utils/api';
import { COOKIE_TOKEN_NAME, COOKIE_GUID_NAME } from '../utils/api';
import useCookies from '../hooks/useCookies';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import { useNavigate } from 'react-router';



interface LoginProps {
  setAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
}

const MainPage: React.FC<LoginProps> = ({ setAuthenticated }) => {
  const { getCookies, removeAuthentication } = useCookies();
  const [items, setItems] = useState<string[]>([]);
  const [mark, setMark] = useState<string>('');
  const [locoId, setLocoId] = useState<string>("");

  const navigate = useNavigate();

  const getAuthentication = async () => {
    const URL = process.env.REACT_APP_GET_AUTHSTATUS_URL || "";
    const savedGuid = getCookies(COOKIE_GUID_NAME) || "";

    try {
      const authResponse = await fetch(URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guid: savedGuid }),
      });

      if (authResponse.status === 401) {
        // Explicit handling for unauthorized response
        console.warn('Device deregistered or unauthorized');
        removeAuthentication();
        setAuthenticated(false);
        return false;
      }

      if (!authResponse.ok) {
        // Handle other errors (e.g., 500)
        console.error(`Unexpected error: ${authResponse.status}`);
        return false;
      }

      return true;

    } catch (error) {
      // Network or other low-level error
      console.error('Failed to check authentication:', error);
      return false;
    }
  };


  const fetchMarks = async () => {
    const data = await getMarks();
    setItems(data);

    if (data && data.length > 0) {
      setMark(data[0]);
    }
  };

  useEffect(() => {
    const run = async () => {
      const authOk = await getAuthentication();
      if (authOk) {
        await fetchMarks();
      } else {
        navigate('/login');
      }
    };
    run();
  }, []);

  const handleButtonClick = () => {
    navigate(`/data-selection/?mark=${mark}&locoId=${locoId}`);
  };

  const handleSignOut = () => {
    removeAuthentication();
    setAuthenticated(false);
    navigate('/login');
  };

  return (

    <div className="main-container">
      <div className="content">
        <div style={{ textAlign: 'right' }}>
          <Button variant="text" onClick={handleSignOut}>Sign out</Button>
        </div>
        <FormControl fullWidth margin="normal">
          <InputLabel>Mark</InputLabel>
          <Select
            value={mark}
            onChange={(e) => setMark(e.target.value)}
            label="Mark"
            fullWidth
          >
            {items.map((item, index) => (
              <MenuItem key={index} value={item}>
                {item}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          id="locoId"
          label="Loco Id"
          type="text"
          variant="outlined"
          value={locoId}
          onChange={(e) => {
            const value = e.target.value;
            // Only update the state if the value consists of digits (or is empty)
            if (/^\d*$/.test(value)) {
              setLocoId(value);  // Set only if the value is valid
            }
          }}
          placeholder="Enter Loco Id"
          fullWidth
          margin="normal"
          sx={{
            backgroundColor: '#f4f4f4',
            borderRadius: '8px',
            'input[type="number"]::-webkit-outer-spin-button': {
              display: 'none',
            },
            'input[type="number"]::-webkit-inner-spin-button': {
              display: 'none',
            },
            '-moz-appearance': 'textfield',
          }}
        />
        <div style={{ padding: 10 }}>
          <Button className="big-button"
            sx={{
              width: 150,
              height: 150,
              padding: 0,
              borderRadius: '50%',
              fontSize: '16px',
              boxSizing: 'border-box',
            }}
            variant="contained" onClick={handleButtonClick}>
            CHECK COMM PATH
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MainPage;
