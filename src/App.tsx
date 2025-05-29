import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './components/login';
import MainPage from './components/main';
import ResultPage from './components/results';

const App: React.FC = () => {
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [data, setData] = useState<any>(null);


  // Check if the user is authenticated on app load
  useEffect(() => {
    if (document.cookie.includes('isAuthenticated=true')) {
      setAuthenticated(true);
    }
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
