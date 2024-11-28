import React, { useState } from 'react';
import useCookies from '../hooks/useCookies';
import { registerUser } from '../utils/api';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

const Login: React.FC = () => {
  const { setAuthCookie } = useCookies();
  const [device, setDevice] = useState<string>('');
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleLogin = async () => {
    if (!device || !pin) {
      setError('Please enter both device and PIN');
      return;
    }

    try {

      const data = await registerUser(device, pin);

      setAuthCookie();

      window.location.href = '/data-selection'; 

    } catch (error) {
      setError('An error occurred during registration');
      console.error(error);
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
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
         <Button variant="contained" onClick={handleLogin}>Log in</Button>
      </div>
    </div>
  );
};

export default Login;
