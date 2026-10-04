import React, { useState, useEffect } from 'react';
import { COOKIE_GUID_NAME, COOKIE_TOKEN_NAME, MarksError, checkAuth, getMarks } from '../utils/api';
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
  const [marksError, setMarksError] = useState<string>('');

  const navigate = useNavigate();

  const getAuthentication = async () => {
    const savedToken = getCookies(COOKIE_TOKEN_NAME) || "";
    const savedGuid = getCookies(COOKIE_GUID_NAME) || "";

    const status = await checkAuth(savedToken, savedGuid);

    if (status === 401) {
      console.warn('Device deregistered or unauthorized');
      removeAuthentication();
      setAuthenticated(false);
      return false;
    }

    // checkAuth reports a network failure as 500.
    if (status < 200 || status >= 300) {
      console.error(`Unexpected error: ${status}`);
      return false;
    }

    return true;
  };


  const fetchMarks = async () => {
    const savedToken = getCookies(COOKIE_TOKEN_NAME) || "";
    const savedGuid = getCookies(COOKIE_GUID_NAME) || "";

    try {
      const data = await getMarks(savedToken, savedGuid);
      setItems(data);

      if (data.length > 0) {
        setMark(data[0]);
      }
    } catch (error) {
      // The marks route checks the full token, unlike /authstatus above, so a
      // device that passed the guid-only check can still be refused here.
      // Treat that as the same sign-out.
      if (error instanceof MarksError && error.status === 401) {
        removeAuthentication();
        setAuthenticated(false);
        navigate('/login');
        return;
      }
      // Anything else, a 404 included, is most likely a railroad whose
      // strolr-api predates the marks route (below 2.12.0). Say so on the page:
      // with no marks the check cannot run.
      console.error('Failed to load marks:', error);
      setMarksError('Could not load the railroad marks');
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
        {marksError && <p className="error-message">{marksError}</p>}
        <div style={{ padding: 10 }}>
          <Button className="big-button"
            disabled={items.length === 0}
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
