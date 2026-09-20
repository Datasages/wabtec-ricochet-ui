import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/globals.css'; 
import './styles/main.css'
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { BASE_PATH } from './utils/api';

const rootElement = document.getElementById('root') as HTMLElement;

const basename = BASE_PATH;

const root = ReactDOM.createRoot(rootElement);
root.render(
  <BrowserRouter basename={basename}>
    <App />
  </BrowserRouter>
);
