import React, { useState } from 'react';
import useCookies from '../hooks/useCookies';
import { registerUser, getRegistrationStatus } from '../utils/api';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { useNavigate } from 'react-router';

const BASE_DELAY_MS = 2000;
const MAX_DELAY_MS = 30000;
const MAX_POLL_MS = 60 * 60 * 1000;

interface LoginProps {
  setAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const Login: React.FC<LoginProps> = ({ setAuthenticated }) => {
  const { setCookies, removeAuthentication } = useCookies();
  const [device, setDevice] = useState<string>('');
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');

  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!device || !pin) {
      setError('Please enter both device and PIN');
      return;
    }

    try {

      const data = await registerUser(device, pin);

      if (!data || !data.token || !data.guid) {
        setError('An error occurred during registration');
        return;
      }

      const start = Date.now();
      let delay = BASE_DELAY_MS;
      let registrationStatus = false;
      while (!registrationStatus && Date.now() - start < MAX_POLL_MS) {
        registrationStatus = await getRegistrationStatus(data.token, data.guid);
        if (!registrationStatus) {
          await sleep(delay);
          delay = Math.min(delay * 2, MAX_DELAY_MS);
        }
      }

      if (!registrationStatus) {
        setError('Registration was not approved in time. Please try again.');
        removeAuthentication();
        setAuthenticated(false);
        return;
      }

      setCookies(data.token, data.guid);
      setAuthenticated(true);
      navigate('/');

    } catch (error) {
      setError('An error occurred during registration');
      console.error(error);
    }
  };

  return (
    <div className="login-container">
      <h2>Register</h2>
      <div className="input-container">
        <TextField
          id="device"
          type="text"
          label="Device"
          value={device}
          onChange={(e) => setDevice(e.target.value)}
          placeholder="Enter device name"
        />
      </div>
      <div className="input-container">
        <TextField
          id="pin"
          label="Enter PIN"
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="Enter PIN"
        />
      </div>
      {error && <p className="error-message">{error}</p>}
      <div >
        <Button variant="contained" onClick={handleLogin}>Register</Button>
      </div>
    </div>
  );
};

export default Login;
