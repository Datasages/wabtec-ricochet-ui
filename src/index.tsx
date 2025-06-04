import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/globals.css'; 
import './styles/main.css'
import { BrowserRouter } from 'react-router-dom';
import App from './App';

const rootElement = document.getElementById('root') as HTMLElement;

const basename = process.env.REACT_APP_BASE_PATH || '';

const root = ReactDOM.createRoot(rootElement);
root.render(
  <BrowserRouter basename={basename}>
    <App />
  </BrowserRouter>
);
