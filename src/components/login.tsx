import React, { useState } from 'react';
import useCookies from '../hooks/useCookies';
import { registerUser } from '../utils/api';

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
        <label htmlFor="device">Device</label>
        <input
          id="device"
          type="text"
          value={device}
          onChange={(e) => setDevice(e.target.value)}
          placeholder="Enter device name"
        />
      </div>
      <div className="input-container">
        <label htmlFor="pin">Enter PIN</label>
        <input
          id="pin"
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="Enter PIN"
          maxLength={6}
        />
      </div>
      {error && <p className="error-message">{error}</p>}
      <div >
         <button onClick={handleLogin}>Log in</button>
      </div>
    </div>
  );
};

export default Login;
