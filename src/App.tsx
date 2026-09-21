import React, { useState, useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import Login from './components/login';
import MainPage from './components/main';
import ResultPage from './components/results';
import useCookies from './hooks/useCookies';
import { AUTH_FLAG_NAME } from './utils/api';

const App: React.FC = () => {
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const { getCookies } = useCookies();

  // Check if the user is authenticated on app load. Read through the hook so the
  // flag's name and encoding live in one place; a substring match on
  // document.cookie also matched a partially-cleared flag.
  useEffect(() => {
    if (getCookies(AUTH_FLAG_NAME) === 'true') {
      setAuthenticated(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  if (!authenticated) {
    return <Login setAuthenticated={setAuthenticated} />;
  }

  return (
    <Routes>
      <Route path="/" element={<MainPage setAuthenticated={setAuthenticated} />} />

      <Route path="/data-selection" element={<ResultPage setAuthenticated={function (value: React.SetStateAction<boolean>): void {
        throw new Error('Function not implemented.');
      }} />} />
      <Route path="/login" element={<Login setAuthenticated={setAuthenticated} />} />
    </Routes>

  );
};

export default App;
