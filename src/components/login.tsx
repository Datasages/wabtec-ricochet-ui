import React, { useState } from 'react';
import useCookies from '../hooks/useCookies';
import { registerUser, getRegistrationStatus } from '../utils/api';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { useNavigate } from 'react-router';

const ATTEMPTS_NUMBER = 1800;
const TIMEOUT = 2000;

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

      let attempts = 0;
      let registrationStatus = false;
      while (registrationStatus !== true && attempts++ < ATTEMPTS_NUMBER) {
        registrationStatus = await getRegistrationStatus(data.token, data.guid);
        if (!registrationStatus) {
          await sleep(TIMEOUT);
        } else {
          setCookies(data.token, data.guid);
          setAuthenticated(true);
          navigate('/');
        }
      }

      if (attempts === ATTEMPTS_NUMBER) {
        setError('Maximum attempts reached. Registration status not true.');
        removeAuthentication();
        setAuthenticated(false);
        return;
      }


      if (!registrationStatus) {
        console.log("Registration status is not correct.")
        setError('Registration status is not correct.');
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
