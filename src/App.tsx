import React, { useState, useEffect } from 'react';
import Login from './components/login';
import MainPage from './components/main';
import ResultPage from './components/results';
import useCookies from './hooks/useCookies';

const App: React.FC = () => {
  const [data, setData] = useState<string | null>(null);
  const { setAuthCookie } = useCookies();
  const [authenticated, setAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    if (document.cookie.includes('isAuthenticated=true')) {
      setAuthenticated(true);
    }
  }, []);

  if (!authenticated) {
    return <Login />;
  }

  if (data) {
    return <ResultPage data={data} />;
  }

  return <MainPage />;
};

export default App;
